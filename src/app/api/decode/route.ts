import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runDecode, isSeverityGated, RESPONSE_TYPE_LABELS, assessNoticeAuthenticity } from "@/core";

export const dynamic = "force-dynamic";

const AMAZON_MARKERS = [
  /amazon/i,
  /seller central/i,
  /asin/i,
  /notice/i,
  /policy/i,
  /account health/i,
];

function looksLikeNotice(text: string): boolean {
  if (text.length < 50) return false;
  const hits = AMAZON_MARKERS.filter((re) => re.test(text)).length;
  return hits >= 2;
}

const DecodeBody = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Field 'text' is required.")
    .max(50_000, "Notice text exceeds 50,000 character limit."),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DecodeBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid body.";
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json({ error: first }, { status: tooLong ? 413 : 400 });
  }

  const { text } = parsed.data;

  if (!looksLikeNotice(text)) {
    return NextResponse.json(
      {
        error:
          "This doesn't look like an Amazon notice. Paste the full enforcement notice from Seller Central.",
      },
      { status: 422 },
    );
  }

  // No receipt date passed. This was `new Date()`, which counted every stated window from the
  // moment of decoding; the `dueAt: null` guard below kept that from ever reaching the seller, at
  // the cost of also discarding a real date. The notice's own header date is now used when it has
  // one; otherwise the window is described as running from the day it was received.
  const result = runDecode(text, {});

  return NextResponse.json({
    kind: result.classification.kind,
    confidence: result.classification.confidence,
    /*
      A date is only sent when it was counted from a date the notice itself carries.

      This used to null every `dueAt`, because the call above passed `new Date()` and a window
      counted from the moment of decoding must never be shown as the seller's deadline. That guard
      was right, but blunt: it also threw away a real date the notice stated in its own header, and
      the chip then said "Date not stated" beside a notice that plainly gives ninety days.

      Kept as a guard rather than dropped, now precise instead of blanket. `startsOn` is set only when
      the start came from the notice, so a regression that reintroduced a made-up start date would
      still never reach the seller as a countdown.
    */
    deadlines: result.deadlines.map((deadline) => ({
      ...deadline,
      dueAt: deadline.startsOn ? deadline.dueAt : null,
    })),
    severityGated: isSeverityGated(result.classification.kind),
    // AA-39: the decision itself. Without this the free decoder can still only describe a notice,
    // which is the part Amazon's own Seller Assistant now does for nothing.
    responseType: {
      type: result.responseType.type,
      label: RESPONSE_TYPE_LABELS[result.responseType.type],
      reason: result.responseType.reason,
      competing: result.responseType.competing.map((t) => RESPONSE_TYPE_LABELS[t]),
      // Only the notice's own spans are meaningful to the caller; form-instruction matches carry
      // -1 offsets because the form text is not what the page is highlighting.
      matches: result.responseType.matches.filter((m) => m.start >= 0).slice(0, 5),
    },
    // Capped so a pathological notice cannot return an unbounded payload.
    entities: result.entities.slice(0, 60),
    // #87: things worth checking before the seller acts on this message. Never a verdict — see
    // src/core/noticeAuthenticity.ts. Empty for the overwhelming majority of real notices.
    authenticity: assessNoticeAuthenticity(text).signals,
  });
}

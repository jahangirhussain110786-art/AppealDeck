import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runDecode, isSeverityGated, RESPONSE_TYPE_LABELS } from "@/core";

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

  const result = runDecode(text, { noticeReceivedAt: new Date() });

  return NextResponse.json({
    kind: result.classification.kind,
    confidence: result.classification.confidence,
    // Decode has no confirmed receipt/deactivation date. Preserve stated windows without
    // presenting a deadline computed from today's date as the seller's actual deadline.
    deadlines: result.deadlines.map((deadline) => ({ ...deadline, dueAt: null })),
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
  });
}

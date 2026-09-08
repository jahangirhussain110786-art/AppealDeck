import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runDecode, isSeverityGated } from "@/core";

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
    deadlines: result.deadlines,
    severityGated: isSeverityGated(result.classification.kind),
  });
}

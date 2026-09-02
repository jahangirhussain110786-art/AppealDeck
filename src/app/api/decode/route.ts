import { NextRequest, NextResponse } from "next/server";
import { runDecode } from "@/core";
import type { ViolationKind } from "@/core";

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

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Field 'text' is required." }, { status: 400 });
  }

  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Notice text exceeds 50,000 character limit." },
      { status: 413 },
    );
  }

  if (!looksLikeNotice(text)) {
    return NextResponse.json(
      {
        error:
          "This doesn't look like an Amazon notice. Paste the full enforcement notice from Seller Central.",
      },
      { status: 422 },
    );
  }

  const kind: ViolationKind = "UNKNOWN";
  const result = runDecode(text, { noticeReceivedAt: new Date() });

  return NextResponse.json({
    kind: result.classification.kind,
    confidence: result.classification.confidence,
    deadlines: result.deadlines,
    severityGated: result.classification.kind === "INAUTHENTIC_DOCUMENTS",
  });
}

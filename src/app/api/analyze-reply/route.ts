import { NextRequest, NextResponse } from "next/server";
import { analyzeReply } from "@/core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reply = (body as { reply?: unknown })?.reply;
  if (typeof reply !== "string" || reply.trim().length === 0) {
    return NextResponse.json({ error: "Field 'reply' is required." }, { status: 400 });
  }

  if (reply.length > 30000) {
    return NextResponse.json(
      { error: "Reply text exceeds 30,000 character limit." },
      { status: 413 },
    );
  }

  const result = analyzeReply(reply);

  return NextResponse.json({
    category: result.category,
    extractedAsks: result.extractedAsks,
    confidence: result.confidence,
  });
}

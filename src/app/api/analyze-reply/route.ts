import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeReply } from "@/core";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { rateLimitAnalyzeReply, tooManyRequestsResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const AnalyzeReplyBody = z.object({
  reply: z
    .string()
    .trim()
    .min(1, "Field 'reply' is required.")
    .max(30_000, "Reply text exceeds 30,000 character limit."),
});

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }

  if (!(await isLicenseActive(user.email))) {
    return NextResponse.json({ error: "Appeal Pass required." }, { status: 403 });
  }

  const rate = await rateLimitAnalyzeReply(user);
  if (!rate.success) {
    return tooManyRequestsResponse(rate);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = AnalyzeReplyBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid body.";
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json({ error: first }, { status: tooLong ? 413 : 400 });
  }

  const result = analyzeReply(parsed.data.reply);

  return NextResponse.json({
    category: result.category,
    extractedAsks: result.extractedAsks,
    confidence: result.confidence,
  });
}

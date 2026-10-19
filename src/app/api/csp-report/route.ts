import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Receives the browser's Content-Security-Policy violation reports. The policy in `vercel.json` is
 * report-only, so until this existed a violation was visible only in the visitor's own console and
 * the policy could never be judged ready to enforce. Reports carry the blocked address and the rule
 * broken, never page content; only those two fields are logged, trimmed, and the body is capped.
 */
export async function POST(request: Request) {
  try {
    // Refuse on the declared size first so an oversized body is never read into memory.
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > 10_000) return new NextResponse(null, { status: 413 });
    const raw = await request.text();
    if (raw.length > 10_000) return new NextResponse(null, { status: 413 });
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const inner = parsed["csp-report"];
    const body = (inner && typeof inner === "object" ? inner : parsed) as Record<string, unknown>;
    // Anyone can post here, so strip line breaks and control characters: a report must not be
    // able to write a forged log line.
    const field = (k: string) =>
      String(body[k] ?? "")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .slice(0, 200);
    console.warn(
      `[csp] ${field("effective-directive") || field("violated-directive")} blocked ${field("blocked-uri") || field("blockedURL")}`,
    );
  } catch {
    // A malformed report is not worth an error.
  }
  return new NextResponse(null, { status: 204 });
}

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
    const raw = await request.text();
    if (raw.length > 10_000) return new NextResponse(null, { status: 413 });
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const body = (parsed["csp-report"] ?? parsed) as Record<string, unknown>;
    const field = (k: string) => String(body[k] ?? "").slice(0, 200);
    console.warn(
      `[csp] ${field("effective-directive") || field("violated-directive")} blocked ${field("blocked-uri") || field("blockedURL")}`,
    );
  } catch {
    // A malformed report is not worth an error.
  }
  return new NextResponse(null, { status: 204 });
}

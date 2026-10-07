import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cronAuth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { collectOpsStatus, isAllClear, sendOpsDigest } from "@/lib/opsDigest";

export const dynamic = "force-dynamic";

/**
 * Daily: counts what is parked or failing and, only when something is, emails `OPS_ALERT_EMAIL`.
 * With no address set the counts are logged as an error line (visible in Vercel's logs) and
 * returned, so a missing setting does not hide the problem. Same bearer-token authorization as
 * the other jobs.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  try {
    const status = await collectOpsStatus(supabaseAdmin);
    if (isAllClear(status)) return NextResponse.json({ ok: true, ...status, alerted: false });
    const to = process.env.OPS_ALERT_EMAIL;
    let alerted = false;
    if (to) {
      try {
        await sendOpsDigest(to, status);
        alerted = true;
      } catch {
        // Falls through to the log line below.
      }
    }
    if (!alerted) console.error("OPS ATTENTION NEEDED", status);
    return NextResponse.json({ ok: false, ...status, alerted });
  } catch {
    return NextResponse.json({ error: "Could not read status" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { redisCredentials } from "@/lib/redisEnv";

export const dynamic = "force-dynamic";

/**
 * For an uptime monitor. Public, so it says only whether the service can do its job: the database
 * answers, and the rate limiter is configured (without it every signed-in server feature refuses).
 * No versions, keys, counts or error text.
 */
export async function GET() {
  let database = false;
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from("payment_events_unmatched")
        .select("event_id", { head: true, count: "exact" })
        .limit(1);
      database = !error;
    } catch {
      database = false;
    }
  }
  const limiter = redisCredentials() !== null;
  const ok = database && limiter;
  return NextResponse.json(
    { ok, database, limiter },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

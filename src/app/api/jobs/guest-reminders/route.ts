/**
 * Sends the guest deadline reminders whose day has come, and deletes rows past their keep date
 * (23 Oct 2026). Same authorization as the other jobs: a shared `CRON_SECRET` bearer token. Inert
 * until `RESEND_API_KEY` is set and migration `0022` is applied.
 */
import { NextRequest, NextResponse } from "next/server";
import { deliverGuestReminders } from "@/lib/guestReminders";
import { isCronAuthorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await deliverGuestReminders());
  } catch {
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
}

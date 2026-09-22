/**
 * AA-40 (AM-26): the cron that makes the product speak first.
 *
 * Same shape and authorization as `/api/jobs/purchase-emails` — a shared `CRON_SECRET` bearer
 * token, `force-dynamic`, and a JSON count back. Inert until the founder adds `RESEND_API_KEY`
 * and applies migration `0011`, in the same way the purchase email was inert before its key.
 */

import { NextRequest, NextResponse } from "next/server";
import { deliverCaseReminders } from "@/lib/caseReminders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await deliverCaseReminders());
  } catch {
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
}

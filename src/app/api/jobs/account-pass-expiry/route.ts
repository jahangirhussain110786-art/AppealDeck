/**
 * The daily job that tells an Account Pass holder their cover is about to end (22 Oct 2026).
 *
 * Same shape and authorization as `/api/jobs/case-reminders`: a shared `CRON_SECRET` bearer token,
 * `force-dynamic`, and a JSON count back. Inert until the founder has applied migration 0018 and set
 * `RESEND_API_KEY`; with no Account Pass sold there is nothing for it to find.
 */

import { NextRequest, NextResponse } from "next/server";
import { deliverAccountPassNotices } from "@/lib/accountPassNotices";
import { isCronAuthorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await deliverAccountPassNotices());
  } catch {
    return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  }
}

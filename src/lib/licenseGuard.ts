import { NextResponse } from "next/server";

/**
 * `fetchLicenseForUser`, `claimCasePass` and the device lookups throw when the database is
 * unavailable. Routes used to let that escape as a generic 500; this is the one answer they give
 * instead. A 503 (never a 403) so a paying seller is told to retry, not that they have no Pass —
 * and, because withBreaker counts every 5xx, it is recorded as a breaker failure on guarded routes.
 */
export function serviceUnavailableResponse(): Response {
  return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
}

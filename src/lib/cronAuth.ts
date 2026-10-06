import { timingSafeEqual } from "node:crypto";

/**
 * True only when `CRON_SECRET` is set and the request carries exactly `Bearer <secret>`.
 * Fails closed when the secret is unset. The comparison is constant-time so the secret cannot be
 * recovered by timing the 401s.
 */
export function isCronAuthorized(request: {
  headers: { get(name: string): string | null };
}): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

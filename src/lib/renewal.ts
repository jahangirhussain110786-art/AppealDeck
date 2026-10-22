/**
 * When an Account Pass may be renewed (22 Oct 2026). Pure, and in its own file so the Billing screen
 * (which runs in the browser) and the checkout intent (on the server) apply the same rule without the
 * screen pulling in anything that talks to the database.
 *
 * A renewal opens 60 days before the cover ends, so nobody pays for twelve months far ahead of need,
 * and stays open for 30 days after, so a seller who forgot is not locked into the dearer new
 * Account Pass. The twelve months always start where the cover ends, or on the day of payment if it
 * had already ended (migration 0018).
 */
export const RENEWAL_OPENS_DAYS_BEFORE = 60;
export const RENEWAL_CLOSES_DAYS_AFTER = 30;

const DAY = 86_400_000;

export function renewalWindow(
  expiresAt: string,
  now: number = Date.now(),
): "early" | "open" | "closed" {
  const end = Date.parse(expiresAt);
  if (Number.isNaN(end)) return "closed";
  if (now < end - RENEWAL_OPENS_DAYS_BEFORE * DAY) return "early";
  if (now > end + RENEWAL_CLOSES_DAYS_AFTER * DAY) return "closed";
  return "open";
}

/** Whether the cover has already ended. Kept here so a component never reads the clock itself. */
export function coverHasEnded(expiresAt: string, now: number = Date.now()): boolean {
  const end = Date.parse(expiresAt);
  return !Number.isNaN(end) && end <= now;
}

/** The day renewing opens, as an ISO date. */
export function renewalOpensOn(expiresAt: string): string {
  return new Date(Date.parse(expiresAt) - RENEWAL_OPENS_DAYS_BEFORE * DAY).toISOString();
}

/** The last day a lapsed Account Pass can still be renewed, as an ISO date. */
export function renewalClosesOn(expiresAt: string): string {
  return new Date(Date.parse(expiresAt) + RENEWAL_CLOSES_DAYS_AFTER * DAY).toISOString();
}

/**
 * The two things a seller can buy (22 Oct 2026, stage 2 of the combined plan).
 *
 * - "case": the Appeal Pass, one case, every round, no expiry. Always on sale.
 * - "account": the Account Pass, every case on the account for 12 months. On sale only when its
 *   Paddle price is configured, so nothing about it appears, or can be bought, until the founder has
 *   applied migration 0017 and created the price (docs/DEPLOYMENT.md section 5d).
 *
 * The environment is read inside functions, never into a module constant, so a test (or a later
 * deploy) sees the value it set. Each `process.env.NEXT_PUBLIC_*` below is written out in full so
 * the build can inline it for the browser.
 */
export type PassPlan = "case" | "account";

export function casePassPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS || undefined;
}

export function accountPassPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS || undefined;
}

export function accountPassEnabled(): boolean {
  return accountPassPriceId() !== undefined;
}

/**
 * The Paddle discount code that gives the first buyers of the Account Pass the Appeal Pass price.
 * Paddle's own usage limit on that discount is what ends the offer; this only says which code to
 * send. Unset means there is no founding offer.
 */
export function foundingCode(): string | undefined {
  const code = process.env.NEXT_PUBLIC_FOUNDING_CODE?.trim().toUpperCase();
  return code && /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code) ? code : undefined;
}

/** How many Passes the founding offer covers (the number of the Paddle discount's usage limit). */
export function foundingSpots(): number {
  const raw = Number(process.env.NEXT_PUBLIC_FOUNDING_SPOTS);
  return Number.isInteger(raw) && raw > 0 && raw <= 1000 ? raw : 25;
}

/** The founding offer exists only for the Account Pass, and only when it has a code. */
export function foundingEnabled(): boolean {
  return accountPassEnabled() && foundingCode() !== undefined;
}

export function parsePlan(raw: unknown): PassPlan {
  return raw === "account" ? "account" : "case";
}

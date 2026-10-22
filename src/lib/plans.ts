/**
 * Everything a seller or a professional can buy (22 Oct 2026, stages 2 and 3 of the combined plan).
 *
 * Sellers:
 * - "case": the Appeal Pass, one case, every round, no expiry. Always on sale.
 * - "account": the Account Pass, every case on the account for 12 months.
 * - "review": an AI reading of the documents of one case ($49), credited toward the Appeal Pass.
 * - "renewal": twelve more months on an Account Pass that is ending ($99).
 * Professionals (verified by hand first):
 * - "pack10", "pack30": case credits, each of which activates one case.
 * - "pro": a monthly subscription that adds ten credits a month.
 *
 * Every one except the Appeal Pass is on sale only when its Paddle price is configured, so nothing
 * about it appears, or can be bought, until the founder has applied the migration and created the
 * price (docs/DEPLOYMENT.md sections 5d and 5e).
 *
 * The environment is read inside functions, never into a module constant, so a test (or a later
 * deploy) sees the value it set. Each `process.env.NEXT_PUBLIC_*` below is written out in full so
 * the build can inline it for the browser.
 */
export type PassPlan = "case" | "account" | "review" | "renewal" | "pack10" | "pack30" | "pro";

export const PASS_PLANS: readonly PassPlan[] = [
  "case",
  "account",
  "review",
  "renewal",
  "pack10",
  "pack30",
  "pro",
];

/** The plans bought from inside a case. The rest belong to the account, so they need no case. */
export const PLAN_NEEDS_CASE: Record<PassPlan, boolean> = {
  case: true,
  account: true,
  review: true,
  renewal: false,
  pack10: false,
  pack30: false,
  pro: false,
};

/** The case id an account-level purchase is recorded against (a checkout intent always has one). */
export const ACCOUNT_SCOPE = "account";

export function casePassPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS || undefined;
}

export function accountPassPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS || undefined;
}

export function reviewPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW || undefined;
}

/** The Appeal Pass price for a case that already has a document review: the review's price comes off. */
export function passAfterReviewPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW || undefined;
}

export function renewalPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL || undefined;
}

export function pack10PriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_PACK_10 || undefined;
}

export function pack30PriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_PACK_30 || undefined;
}

export function proPlanPriceId(): string | undefined {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN || undefined;
}

export function accountPassEnabled(): boolean {
  return accountPassPriceId() !== undefined;
}

/** The document review is offered only with its credited Appeal Pass price, or the credit would be a promise. */
export function reviewEnabled(): boolean {
  return reviewPriceId() !== undefined && passAfterReviewPriceId() !== undefined;
}

/** A renewal extends an Account Pass, so it exists only where the Account Pass does. */
export function renewalEnabled(): boolean {
  return accountPassEnabled() && renewalPriceId() !== undefined;
}

export function packsEnabled(): boolean {
  return pack10PriceId() !== undefined || pack30PriceId() !== undefined;
}

export function proPlanEnabled(): boolean {
  return proPlanPriceId() !== undefined;
}

/** Anything on sale to professionals. */
export function professionalsEnabled(): boolean {
  return packsEnabled() || proPlanEnabled();
}

/**
 * Whether a product that is not on sale yet is still shown, with its price and "Opens soon" and no
 * way to buy it. On by default so /pricing and /for-professionals show the whole structure before
 * Paddle is connected; `NEXT_PUBLIC_PLANS_PREVIEW=off` hides it again. Showing is never selling:
 * every purchase path (the checkout, the intent route, the webhook) still needs its Paddle price.
 */
export function previewPlans(): boolean {
  return process.env.NEXT_PUBLIC_PLANS_PREVIEW !== "off";
}

/** The Account Pass is shown: on sale, or previewed as "Opens soon". */
export function accountPassListed(): boolean {
  return accountPassEnabled() || previewPlans();
}

/** The AI document review is shown: on sale, or previewed as "Opens soon". */
export function reviewListed(): boolean {
  return reviewEnabled() || previewPlans();
}

/** The professional prices are shown: on sale, or previewed as "Opens soon". */
export function professionalsListed(): boolean {
  return professionalsEnabled() || previewPlans();
}

/** The Paddle price a plan opens, or undefined when it is not on sale. */
export function priceIdFor(plan: PassPlan): string | undefined {
  switch (plan) {
    case "case":
      return casePassPriceId();
    case "account":
      return accountPassPriceId();
    case "review":
      return reviewEnabled() ? reviewPriceId() : undefined;
    case "renewal":
      return renewalEnabled() ? renewalPriceId() : undefined;
    case "pack10":
      return pack10PriceId();
    case "pack30":
      return pack30PriceId();
    case "pro":
      return proPlanPriceId();
  }
}

/**
 * The prices beyond the Appeal Pass and Account Pass, as the webhook hands them to the database
 * function: kind to price id. Empty when none is configured, in which case the webhook leaves the
 * argument out and the call is exactly the one made before any of them existed.
 */
export function extraPriceIds(): Record<string, string> {
  const candidates: Record<string, string | undefined> = {
    document_review: reviewPriceId(),
    pass_after_review: passAfterReviewPriceId(),
    account_renewal: renewalPriceId(),
    pack_10: pack10PriceId(),
    pack_30: pack30PriceId(),
    pro_plan: proPlanPriceId(),
  };
  return Object.fromEntries(
    Object.entries(candidates).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
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

/**
 * Whether the $25 outcome-report rebate is offered. It is a money promise made in the founder's
 * name, so it is off until `NEXT_PUBLIC_REBATE_ENABLED=true` is set deliberately.
 */
export function rebateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REBATE_ENABLED === "true";
}

export function parsePlan(raw: unknown): PassPlan {
  return typeof raw === "string" && (PASS_PLANS as readonly string[]).includes(raw)
    ? (raw as PassPlan)
    : "case";
}

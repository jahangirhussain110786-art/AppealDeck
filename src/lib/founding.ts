import { accountPassPriceId, foundingCode, foundingEnabled, foundingSpots } from "@/lib/plans";

/**
 * The offer can be hidden for a dozen reasons, and every one of them used to be silent: the
 * pricing page simply showed no founding spots. A mismatch between Paddle's `usage_limit` and
 * `NEXT_PUBLIC_FOUNDING_SPOTS` is the likeliest (it is set in two places), and it is invisible
 * from the outside. One line, once per process, names the reason (F15, 26 Oct 2026).
 */
let warned = false;
function warnHidden(reason: string): void {
  if (warned) return;
  warned = true;
  console.warn("FOUNDING OFFER HIDDEN", { reason, code: foundingCode() });
}

/**
 * Founding spots left, or null when the offer is off or the count could not be read (the offer is
 * then simply not shown, never guessed).
 *
 * It reads the configured discount's own redemption count. Unrelated Passes do not consume it.
 * Paddle can accept concurrent checkouts beyond a usage limit, so the count is advisory.
 */
export async function foundingSpotsLeft(): Promise<number | null> {
  if (!foundingEnabled() || !process.env.PADDLE_API_KEY) return null;
  const base =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  try {
    const response = await fetch(`${base}/discounts?code=${encodeURIComponent(foundingCode()!)}`, {
      headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const { data } = await response.json();
    const discount = Array.isArray(data)
      ? data.find((d) => d.code?.toUpperCase() === foundingCode())
      : null;
    if (!discount) {
      warnHidden("Paddle returned no discount with that code");
      return null;
    }
    const problem =
      discount.status !== "active"
        ? `status is ${String(discount.status)}`
        : !discount.enabled_for_checkout
          ? "not enabled for checkout"
          : discount.type !== "flat"
            ? `type is ${String(discount.type)}`
            : discount.amount !== "8000"
              ? `amount is ${String(discount.amount)}, expected 8000`
              : discount.currency_code !== "USD"
                ? `currency is ${String(discount.currency_code)}, expected USD`
                : discount.recur
                  ? "it recurs, expected a one-off"
                  : discount.usage_limit !== foundingSpots()
                    ? `usage_limit is ${String(discount.usage_limit)}, NEXT_PUBLIC_FOUNDING_SPOTS is ${String(foundingSpots())}`
                    : !Number.isInteger(discount.times_used) || discount.times_used < 0
                      ? `times_used is ${String(discount.times_used)}`
                      : !Array.isArray(discount.restrict_to) || discount.restrict_to.length !== 1
                        ? "restrict_to is not exactly one price"
                        : discount.restrict_to[0] !== accountPassPriceId()
                          ? "restrict_to names another price than the Account Pass"
                          : discount.expires_at && Date.parse(discount.expires_at) <= Date.now()
                            ? `expired at ${String(discount.expires_at)}`
                            : null;
    if (problem) {
      warnHidden(problem);
      return null;
    }
    return Math.max(0, discount.usage_limit - discount.times_used);
  } catch {
    return null;
  }
}

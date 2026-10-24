import { accountPassPriceId, foundingCode, foundingEnabled, foundingSpots } from "@/lib/plans";

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
    if (
      !discount ||
      discount.status !== "active" ||
      !discount.enabled_for_checkout ||
      discount.type !== "flat" ||
      discount.amount !== "8000" ||
      discount.currency_code !== "USD" ||
      discount.recur ||
      discount.usage_limit !== foundingSpots() ||
      !Number.isInteger(discount.times_used) ||
      discount.times_used < 0 ||
      !Array.isArray(discount.restrict_to) ||
      discount.restrict_to.length !== 1 ||
      discount.restrict_to[0] !== accountPassPriceId() ||
      (discount.expires_at && Date.parse(discount.expires_at) <= Date.now())
    )
      return null;
    return Math.max(0, discount.usage_limit - discount.times_used);
  } catch {
    return null;
  }
}

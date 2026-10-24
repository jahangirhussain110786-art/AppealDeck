import { parsePartnerCode } from "@/lib/partnerCode";
import { supabaseAdmin } from "@/lib/supabase/server";

export function referralsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REFERRALS_ENABLED === "true";
}

export type ReferralOffer = { id: string; code: string; discountId: string };

export async function validateReferral(raw: unknown, userId: string): Promise<ReferralOffer> {
  const code = parsePartnerCode(raw);
  if (!code) throw new Error("Use the letters and numbers in your partner's code.");
  if (!referralsEnabled() || !supabaseAdmin)
    throw new Error("Partner codes are unavailable here. You can remove the code to continue.");
  const { data, error } = await supabaseAdmin
    .from("referral_codes")
    .select("id, code, discount_id, active, partners!inner(user_id, active)")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error("We could not check that code. Try again before paying.");
  const partner = data?.partners as unknown as { user_id: string; active: boolean } | undefined;
  if (!data?.active || !partner?.active || partner.user_id === userId)
    throw new Error("That code is unavailable for this purchase. Check it or remove it.");
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("We could not check that code. Try again before paying.");
  const base =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  const response = await fetch(`${base}/discounts/${encodeURIComponent(data.discount_id)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("We could not check that code. Try again before paying.");
  const { data: discount } = await response.json();
  const prices = [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS,
  ].filter(Boolean);
  if (
    discount?.id !== data.discount_id ||
    discount.status !== "active" ||
    !discount.enabled_for_checkout ||
    discount.code?.toUpperCase() !== code ||
    discount.type !== "flat" ||
    discount.amount !== "2500" ||
    discount.currency_code !== "USD" ||
    discount.recur ||
    !Array.isArray(discount.restrict_to) ||
    !discount.restrict_to.length ||
    discount.restrict_to.some((price: string) => !prices.includes(price)) ||
    prices.some((price) => !discount.restrict_to.includes(price)) ||
    (discount.expires_at && Date.parse(discount.expires_at) <= Date.now()) ||
    (discount.usage_limit !== null && discount.times_used >= discount.usage_limit)
  )
    throw new Error("That code is unavailable for this purchase. Check it or remove it.");
  return { id: data.id, code, discountId: data.discount_id };
}

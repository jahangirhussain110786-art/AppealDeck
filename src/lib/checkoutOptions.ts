import { parsePartnerCode } from "@/lib/partnerCode";

/** What Paddle.js `Checkout.open` is given for one Pass (kept pure so it can be tested). */
export type CheckoutOptions = {
  items: { priceId: string }[];
  customer?: { email?: string };
  customData: { checkout_intent_id: string };
  /** A partner's code, or the founding code. Paddle shows the discount in its own window. */
  discountCode?: string;
};

export function buildCheckoutOptions(input: {
  priceId: string;
  intentId: string;
  email?: string;
  partnerCode?: string | null;
  /** The founding code the server offered for the Account Pass while spots remain. */
  foundingCode?: string | null;
}): CheckoutOptions {
  // Paddle takes one code per checkout. A partner's code wins over the founding code: the seller
  // still gets the partner's discount, and the partner is never cheated of the sale it introduced.
  const code = parsePartnerCode(input.partnerCode) ?? parsePartnerCode(input.foundingCode);
  return {
    items: [{ priceId: input.priceId }],
    customer: input.email ? { email: input.email } : undefined,
    customData: { checkout_intent_id: input.intentId },
    ...(code ? { discountCode: code } : {}),
  };
}

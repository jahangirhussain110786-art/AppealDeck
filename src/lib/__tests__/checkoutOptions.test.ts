import { describe, expect, it } from "vitest";
import { buildCheckoutOptions } from "../checkoutOptions";

describe("checkout options", () => {
  const base = { priceId: "pri_1", intentId: "intent_1" };

  it("carries the price and the intent, and no discount when there is no code", () => {
    const opts = buildCheckoutOptions(base);
    expect(opts.items).toEqual([{ priceId: "pri_1" }]);
    expect(opts.customData).toEqual({ checkout_intent_id: "intent_1" });
    expect(opts.customer).toBeUndefined();
    expect("discountCode" in opts).toBe(false);
  });

  it("passes the buyer's email when it is known", () => {
    expect(buildCheckoutOptions({ ...base, email: "a@b.co" }).customer).toEqual({
      email: "a@b.co",
    });
  });

  it("passes a partner's code to Paddle as the discount code, normalised", () => {
    expect(buildCheckoutOptions({ ...base, partnerCode: "anna-2026" }).discountCode).toBe(
      "ANNA-2026",
    );
  });

  it("passes the founding code when there is no partner code", () => {
    expect(buildCheckoutOptions({ ...base, foundingCode: "founding" }).discountCode).toBe(
      "FOUNDING",
    );
  });

  it("lets a partner's code win over the founding code, so the partner keeps the sale", () => {
    expect(
      buildCheckoutOptions({ ...base, partnerCode: "anna", foundingCode: "FOUNDING" }).discountCode,
    ).toBe("ANNA");
  });

  it("falls back to the founding code when the partner code is not a usable code", () => {
    expect(
      buildCheckoutOptions({ ...base, partnerCode: "<x>", foundingCode: "FOUNDING" }).discountCode,
    ).toBe("FOUNDING");
  });

  it("never passes a code that is not a usable code", () => {
    for (const bad of ["<x>", "ab", "", null, undefined])
      expect("discountCode" in buildCheckoutOptions({ ...base, partnerCode: bad })).toBe(false);
  });
});

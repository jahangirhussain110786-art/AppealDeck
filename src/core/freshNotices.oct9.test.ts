import { describe, expect, it } from "vitest";
import { runDecode } from "./index";

/**
 * 9 Oct 2026. Ten notices in families the 29 Sep researched set does not cover, written from how
 * sellers describe them, and run through the real decoder. Two decoded as UNKNOWN, which costs a
 * seller the violation-specific guidance and the evidence list.
 */
const decode = (text: string) => runDecode(text, {} as never);

describe("fresh notice families", () => {
  it("a condition complaint ('sold as new' that was used) is a policy case", () => {
    const r = decode(
      "Subject: Policy warning: Condition complaints\n\nWe have received customer complaints that items you sold as new were used or in poor condition. Your listing B0CXYZ1234 has been removed. Submit a plan of action that explains the root cause.",
    );
    expect(r.classification.kind).toBe("POLICY");
  });

  it("sales rank manipulation is a policy case", () => {
    const r = decode(
      "Subject: Seller account deactivated\n\nWe have determined that you manipulated sales rank by purchasing your own products through other accounts. This violates the Fair Marketplace Policy. To appeal, send a plan of action.",
    );
    expect(r.classification.kind).toBe("POLICY");
  });

  it("a fair pricing policy notice is a policy case", () => {
    const r = decode(
      "Your account has been deactivated for violating our Fair Pricing Policy. Submit a plan of action explaining the pricing.",
    );
    expect(r.classification.kind).toBe("POLICY");
  });

  it("does not pull an ordinary listing notice into policy", () => {
    const r = decode(
      "We removed ASIN B0ABCDEFGH from sale because the detail page does not match the product. Update the listing.",
    );
    expect(r.classification.kind).toBe("LISTING");
  });

  it("an item that was merely sold as new, with no complaint, is not a condition case", () => {
    const r = decode("Your order of items sold as new shipped on time. Thank you for selling.");
    expect(r.classification.kind).not.toBe("POLICY");
  });
});

describe("administrative notices that state a seller deadline", () => {
  const labels = (text: string) => decode(text).deadlines.map((d) => d.label);

  it("reads 'update your payment method within 7 days' as a 7-day window", () => {
    expect(
      labels(
        "We were unable to charge the credit card on file. Please update your payment method within 7 days to avoid your selling privileges being suspended.",
      ),
    ).toEqual(["Appeal window: 7 days"]);
  });

  it("reads 'update your tax information within 30 days' as a 30-day window", () => {
    expect(
      labels(
        "The TIN you provided does not match IRS records. Please update your tax information in Seller Central within 30 days.",
      ),
    ).toEqual(["Appeal window: 30 days"]);
  });

  it("still ignores update windows that are not the seller's own account", () => {
    expect(labels("Customers may update their order within 30 days of purchase.")).toEqual([
      expect.stringContaining("ambiguous"),
    ]);
    expect(labels("We will update your listing within 5 days of review.")).toEqual([
      expect.stringContaining("ambiguous"),
    ]);
  });
});

describe("operating more than one account", () => {
  it("is a related-account case", () => {
    const r = decode(
      "Your account violated the Business Solutions Agreement by operating multiple accounts without a business need. We have deactivated this account.",
    );
    expect(r.classification.kind).toBe("RELATED_ACCOUNT");
  });
});

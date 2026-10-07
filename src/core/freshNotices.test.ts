import { describe, expect, it } from "vitest";
import { runDecode, isSeverityGated } from "./index";
import { newWorkspace, proposedRequirements } from "./workspace";

/**
 * Notices written on 7 Oct 2026 for the launch audit, in wording the engine was not built against.
 * Four ordinary families read as UNKNOWN: a dangerous-goods review that asks for a Safety Data
 * Sheet (the sheet itself was never raised), a category that "requires approval", an item-condition
 * ("used sold as new") complaint and a review-manipulation removal. UNKNOWN costs a seller the
 * family's guidance and its list of records.
 */
const kindOf = (text: string) => runDecode(text, {}).classification.kind;
const labels = (text: string) =>
  proposedRequirements({ ...newWorkspace(), notice: text }, kindOf(text)).map((r) => r.label);

describe("fresh notice wording", () => {
  const hazmat = `Action required: Dangerous goods review

The following ASINs have been identified as potentially subject to dangerous goods regulations and their listings are suppressed: B07QXZ1W2M, B08N5LNQCX. To restore these listings you must submit a Safety Data Sheet (SDS) or Exemption Sheet for each product, plus a clear photo of the product label, in the Manage Your Compliance dashboard.`;

  it("reads a dangerous-goods review as product safety and raises the Safety Data Sheet", () => {
    expect(kindOf(hazmat)).toBe("PRODUCT_SAFETY");
    expect(labels(hazmat)).toContain("Test report or compliance certificate");
    expect(isSeverityGated(kindOf(hazmat))).toBe(false);
  });

  it("reads a category that requires approval as a restricted product", () => {
    const text =
      "Your listing for ASIN B0BQ7D9J3K could not be created. This product is in a category that requires approval: Topicals & Cosmetics. You are not currently approved to sell in this category.";
    expect(kindOf(text)).toBe("RESTRICTED_PRODUCT");
  });

  it("reads an item-condition complaint and a review-manipulation removal as policy, not gated", () => {
    const condition =
      "We removed the following listing because customers complained about Item condition complaints (Used Sold as New). Submit a plan of action.";
    const reviews =
      "We have found that you violated our policies by attempting to manipulate customer reviews. Your selling privileges have been removed. To appeal, send us a plan of action.";
    expect(kindOf(condition)).toBe("POLICY");
    expect(kindOf(reviews)).toBe("POLICY");
    expect(isSeverityGated("POLICY")).toBe(false);
  });

  it("does not sweep in ordinary wording that merely mentions the same words", () => {
    // "approval" in a routine sentence, "used" on its own, and a bare "sheet" are not these families.
    expect(kindOf("Your tax interview is awaiting approval from our team.")).toBe("UNKNOWN");
    expect(kindOf("Please send the used goods receipt and a spreadsheet of orders.")).toBe(
      "UNKNOWN",
    );
    expect(kindOf("Your account is not yet approved for a payout schedule change.")).toBe(
      "UNKNOWN",
    );
  });
});

import { describe, expect, it } from "vitest";
import { runDecode } from "./index";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";
import type { ViolationKind } from "./violationKinds";

/**
 * Fresh wordings, 8 Oct 2026. Eighteen notices written in styles and families that were not in the
 * fixtures or the researched corpus. Six routine ones fell to UNKNOWN (the "please clarify" dead
 * end): an ASIN removed for "not as described", a review-compensation removal, an Account Health
 * Rating deactivation, an FBA inbound suspension, a price-gouging removal, and a hazmat request
 * for a Safety Data Sheet whose records were not recognised. Each assertion is the answer a correct
 * product gives; a failure means a case now gets a different answer.
 */
const kindOf = (t: string): ViolationKind => runDecode(t, {}).classification.kind;

describe("routine notices that used to fall to UNKNOWN", () => {
  it.each<[string, ViolationKind, string]>([
    [
      "an ASIN removed for 'not as described'",
      "LISTING",
      "Hello Seller,\n\nWe have removed the following ASIN from sale because we received a complaint it is not as described: B0CXYZ1234. Your listing Buy Box eligibility is suppressed. Tell us what caused the issue and what steps you have taken. Reply within 7 days.",
    ],
    [
      "a Customer Product Reviews policy removal",
      "POLICY",
      "Dear Seller,\n\nWe've detected activity that violates our Customer Product Reviews policy, including offering compensation for reviews. Your selling privileges have been permanently removed. You may appeal by submitting a Plan of Action.",
    ],
    [
      "an Account Health Rating deactivation",
      "PERFORMANCE_METRIC",
      "Account Health Rating: Critical. Your selling account was deactivated because your Account Health Rating dropped. Submit an appeal to request reinstatement of your selling privileges.",
    ],
    [
      "an FBA inbound suspension",
      "PERFORMANCE_METRIC",
      "Your FBA privileges have been suspended because of repeated inbound non-compliance. Please submit a plan of action explaining how you will prepare your shipments correctly.",
    ],
    [
      "a price-gouging removal",
      "POLICY",
      "We've detected pricing on your offers that is significantly higher than recent prices (price gouging) for ASIN B09LMNOPQR. If you believe this is an error, submit an appeal.",
    ],
  ])("reads %s as %s", (_name, kind, text) => {
    expect(kindOf(text)).toBe(kind);
  });
});

describe("what Amazon asks for, in plain words", () => {
  it("reads 'tell us what caused the issue' as a Plan of Action request", () => {
    const r = runDecode(
      "We removed ASIN B0CXYZ1234 from sale. Tell us what caused the issue and what steps you have taken.",
      {},
    );
    expect(r.responseType.type).toBe("PLAN_OF_ACTION");
  });

  it("reads a request for a Safety Data Sheet and exemption sheet as supporting documents", () => {
    const r = runDecode(
      "Your listing for ASIN B07ABCDEFG has been identified as a dangerous good. Please provide a Safety Data Sheet (SDS) and exemption sheet within 14 days.",
      {},
    );
    expect(r.classification.kind).toBe("PRODUCT_SAFETY");
    expect(r.responseType.type).toBe("SUPPORTING_DOCUMENTS");
  });
});

describe("notices that must NOT be forced into a family", () => {
  it.each([
    [
      "a congratulation",
      "Congratulations Seller! You are now approved to sell in Grocery. To maintain, keep your metrics high.",
    ],
    ["a two-line vague message", "Hi, your account has been blocked. Please appeal."],
    [
      "a notice in Spanish",
      "Estimado vendedor, hemos desactivado su cuenta por quejas de autenticidad. Envíe un plan de acción en 30 días.",
    ],
  ])("leaves %s unclassified", (_n, text) => {
    expect(kindOf(text)).toBe("UNKNOWN");
  });

  it("does not read a removal elsewhere in the text as a listing case", () => {
    expect(
      kindOf("Your Order Defect Rate is 1.4%. We removed no listings. Submit a plan of action."),
    ).toBe("PERFORMANCE_METRIC");
  });

  it("keeps an account deactivation that says 'your listings have been removed' out of LISTING", () => {
    expect(
      kindOf(
        "Your Amazon seller account has been deactivated. Your listings have been removed. This is due to repeated violations of our policies. Submit a Plan of Action.",
      ),
    ).toBe("POLICY");
  });
});

describe("a forged 'legal department' message", () => {
  it("raises warning signs rather than being treated as a notice to answer", () => {
    const t =
      "This is a notice from the legal department of Amazon. Your account is subject to a legal claim; failing to pay a $499 compliance fee by Friday results in permanent closure. Pay via gift card at the link: http://amazon-sellers-support.xyz/pay";
    expect(assessNoticeAuthenticity(t).signals.length).toBeGreaterThan(0);
  });
});

/**
 * 7 Oct 2026 hand review of the reply analyser. Each case is wording Amazon (or a seller pasting a
 * thread) really uses. The first group are false negatives that told a seller they were not back, or
 * hid what was still owed; the last group pins the direction that matters most — a message must
 * never be read as "you are back" when it is not.
 */
import { describe, it, expect } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

describe("reply analyser, round 3", () => {
  it("reads a reinstatement that says it came after a review", () => {
    expect(
      analyzeReply("We have reinstated your selling account after reviewing your appeal.").category,
    ).toBe("reinstated");
    expect(
      analyzeReply("After reviewing your plan of action, we have reinstated your selling account.")
        .category,
    ).toBe("reinstated");
    expect(
      analyzeReply(
        "Your selling account has been reactivated and your listings will be restored within 24 hours.",
      ).category,
    ).toBe("reinstated");
  });

  it("does not call a reinstatement plus a removed ASIN a final rejection", () => {
    const r = analyzeReply(
      "We have reinstated your selling account. However, ASIN B0ABCDEFGH has been permanently removed from the catalog.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBe(true);
  });

  it("flags an identity check still owed after a reinstatement", () => {
    const r = analyzeReply(
      "We have reinstated your selling account. Please verify your identity within 7 days.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBe(true);
    expect(r.openAsks?.[0]?.quote).toMatch(/verify your identity/);
  });

  it("reads 'not accepted' and 'not successful' as a refusal that goes on", () => {
    expect(
      analyzeReply("Your plan of action was not accepted. Please send a new plan of action.")
        .category,
    ).toBe("needs_more_information");
    expect(analyzeReply("Your appeal was not successful.").category).toBe("needs_more_information");
  });

  it("reads 'your decision is final' as final", () => {
    expect(
      analyzeReply("We cannot reinstate your selling account. Your decision is final.").category,
    ).toBe("final_decision_negative");
  });

  it("still never reads a conditional or negated sentence as a reinstatement", () => {
    for (const text of [
      "If your plan of action is accepted, we will reinstate your selling account.",
      "We have not reinstated your selling account.",
      "Your account will be reinstated once you provide invoices.",
      "We have reinstated your selling account if you confirm the details.",
      "You wrote: 'Your account is now active'. We do not have enough information.",
    ]) {
      expect(analyzeReply(text).category, text).not.toBe("reinstated");
    }
  });

  it("still reads a permanently closed account as final", () => {
    expect(analyzeReply("Your selling account has been permanently closed.").category).toBe(
      "final_decision_negative",
    );
  });
});

import { describe, expect, it } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

const category = (text: string) => analyzeReply(text).category;

/** 6 Oct 2026. Replies Amazon really writes that were all "unrecognized". */
describe("ways Amazon says yes", () => {
  it.each([
    "Your appeal has been approved.",
    "Your selling account has been reactivated.",
    "We have lifted the suspension on your account.",
    "Your listings have been restored.",
    "We've reinstated your account.",
    "We’ve reinstated your account.",
  ])("reads %s as reinstated", (text) => {
    expect(category(text)).toBe("reinstated");
  });

  it("keeps the guard against hopeful and negated wording", () => {
    for (const text of [
      "If your appeal has been approved you will be notified.",
      "Your appeal has not been approved.",
      "Once your listings are restored, you may sell again.",
      "Your account will be reactivated when you provide documents.",
    ]) {
      expect(category(text), text).not.toBe("reinstated");
    }
  });
});

describe("ways Amazon says no", () => {
  it.each([
    "Your appeal has been denied.",
    "We are unable to approve your appeal at this time.",
    "Your submission does not meet our requirements.",
  ])("reads %s as a refusal that does not close the case", (text) => {
    expect(category(text)).toBe("needs_more_information");
  });

  it.each([
    "You may not appeal this decision further.",
    "You are no longer able to sell on Amazon.",
    "We cannot accept further appeals.",
    "There will be no further appeals.",
  ])("reads %s as final", (text) => {
    expect(category(text)).toBe("final_decision_negative");
  });

  it("lets 'do not submit further appeals' beat the non-final 'will not reinstate'", () => {
    const r = analyzeReply(
      "After review, we will not reinstate your selling account. Please do not submit further appeals.",
    );
    expect(r.category).toBe("final_decision_negative");
  });

  it("reads funds that will stay on hold", () => {
    expect(category("Your funds will remain on hold.")).toBe("funds_decision");
  });
});

describe("a reinstatement that is not the whole story", () => {
  const reply =
    "Your selling privileges have been reinstated. However, ASIN B08N5WRWNW remains removed from the catalog. Please submit a plan of action for this ASIN within 14 days.";

  it("reports reinstated with what is still open, never as a plain success", () => {
    const r = analyzeReply(reply);
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBe(true);
    expect(r.openAsks?.map((a) => a.kind)).toEqual(["plan_of_action"]);
    expect(r.openAsks?.[0]?.quote).toContain("submit a plan of action");
  });

  it("reports a plain reinstatement without the partial fields", () => {
    const r = analyzeReply(
      "Your selling privileges have been reinstated. No further action is required.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBeUndefined();
    expect(r.openAsks).toBeUndefined();
  });

  it("notes a removal that remains even when no request is made", () => {
    const r = analyzeReply("Your account is now active. ASIN B08N5WRWNW remains suppressed.");
    expect(r.partial).toBe(true);
    expect(r.openAsks).toEqual([]);
  });
});

describe("a Seller Support thread", () => {
  it("reads the last Amazon message, so an earlier refusal does not outvote a later reinstatement", () => {
    const thread = [
      "Amazon: We are unable to reinstate your account at this time. Please send invoices.",
      "Seller (you): Attached.",
      "Amazon: We have reviewed your invoices. Your account is now active.",
    ].join("\n");
    expect(category(thread)).toBe("reinstated");
  });
});

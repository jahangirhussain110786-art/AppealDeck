import { describe, it, expect } from "vitest";
import { assessNovelty, shouldWarnBeforeSubmit, type PriorSubmission } from "./submissionNovelty";

const APPEAL = [
  "Our account was deactivated for inauthentic items.",
  "The root cause was that we sourced stock from a wholesaler without verifying their supply chain.",
  "We have since obtained invoices directly from the brand.",
  "We will only source from authorised distributors going forward.",
].join(" ");

function prior(text: string, revision = 1): PriorSubmission {
  return { at: "2026-09-01T00:00:00Z", revision, text };
}

describe("assessNovelty", () => {
  it("treats a first submission as new", () => {
    const r = assessNovelty(APPEAL, []);
    expect(r.verdict).toBe("new");
    expect(r.comparedTo).toBeUndefined();
    expect(shouldWarnBeforeSubmit(r)).toBe(false);
  });

  it("catches an exactly repeated appeal", () => {
    const r = assessNovelty(APPEAL, [prior(APPEAL)]);
    expect(r.verdict).toBe("identical");
    expect(r.similarity).toBe(1);
    expect(shouldWarnBeforeSubmit(r)).toBe(true);
  });

  /** The realistic failure: a seller reformats rather than rewrites and believes it is new. */
  it("catches a repeat disguised by whitespace, case and punctuation", () => {
    const reformatted = APPEAL.replace(/\. /g, ".\n\n").toUpperCase().replace(/,/g, "");
    const r = assessNovelty(reformatted, [prior(APPEAL)]);
    expect(r.verdict).toBe("identical");
    expect(shouldWarnBeforeSubmit(r)).toBe(true);
  });

  it("flags an appeal where only one line was added", () => {
    const r = assessNovelty(`${APPEAL} We apologise for the inconvenience.`, [prior(APPEAL)]);
    expect(r.verdict).toBe("near-identical");
    expect(r.addedSentences).toBe(1);
    expect(shouldWarnBeforeSubmit(r)).toBe(true);
  });

  it("accepts a real revision without warning", () => {
    const revised = [
      "Our account was deactivated for inauthentic items.",
      "The root cause was that we sourced stock from a wholesaler without verifying their supply chain.",
      "We now hold a signed distribution agreement with the brand dated 12 September 2026.",
      "We have removed all remaining stock from the affected wholesaler and disposed of 240 units.",
      "Our new purchasing checklist requires a brand authorisation letter before any purchase order.",
    ].join(" ");
    const r = assessNovelty(revised, [prior(APPEAL)]);
    expect(r.verdict).toBe("revised");
    expect(shouldWarnBeforeSubmit(r)).toBe(false);
    expect(r.addedSentences).toBeGreaterThan(0);
  });

  it("treats a genuinely different response as new", () => {
    const different = [
      "This response concerns the identity verification request received on 20 September 2026.",
      "I have attached the government-issued identification named in the notice.",
      "The address matches the one registered on the account.",
    ].join(" ");
    const r = assessNovelty(different, [prior(APPEAL)]);
    expect(r.verdict).toBe("new");
    expect(shouldWarnBeforeSubmit(r)).toBe(false);
  });

  /** A seller on attempt three who reverts to their first appeal has sent a duplicate; comparing
   * only against the most recent submission would miss it entirely. */
  it("compares against the closest prior submission, not only the latest", () => {
    const secondAttempt = "An entirely different second attempt about a different matter.";
    const r = assessNovelty(APPEAL, [prior(APPEAL, 1), prior(secondAttempt, 2)]);
    expect(r.verdict).toBe("identical");
    expect(r.comparedTo?.revision).toBe(1);
  });

  it("reports what changed, so the warning can be acted on", () => {
    const r = assessNovelty(`${APPEAL} One extra sentence here.`, [prior(APPEAL)]);
    expect(r.addedSentences).toBe(1);
    expect(r.removedSentences).toBe(0);
    expect(r.comparedTo).toEqual({ at: "2026-09-01T00:00:00Z", revision: 1 });
  });

  it("counts removed sentences when the seller cuts material", () => {
    const shortened = APPEAL.split(". ").slice(0, 2).join(". ") + ".";
    const r = assessNovelty(shortened, [prior(APPEAL)]);
    expect(r.removedSentences).toBeGreaterThan(0);
  });

  it("handles an empty draft without throwing or claiming a duplicate", () => {
    const r = assessNovelty("   ", [prior(APPEAL)]);
    expect(r.verdict).toBe("new");
    expect(shouldWarnBeforeSubmit(r)).toBe(false);
  });

  it("explains the identical verdict rather than only labelling it", () => {
    const r = assessNovelty(APPEAL, [prior(APPEAL)]);
    // What is true of the seller's own text — the only thing this module measures.
    expect(r.message).toMatch(/word for word/i);
    // And why it matters, so the warning is actionable rather than a bare label.
    expect(r.message).toMatch(/answers what they asked|went unanswered/i);
  });

  /**
   * This assertion replaces one that pinned the defect in place. The old test required the
   * `identical` message to say repeated submissions "run out of attempts" — a claim
   * `docs/handoffs/2026-09-21-phase-1-evidence-review.md` row 7 marks causality-unsupported, so the
   * suite was enforcing the very thing the research had withdrawn.
   *
   * It now guards the property instead of the wording: no message predicts Amazon's decision. Same
   * shape as `noticeAuthenticity`'s test that the output never reaches a verdict — a rule worth
   * holding is worth holding as a test, because both of these claims had already escaped once.
   */
  it("predicts nothing about Amazon's decision in any message", () => {
    const drafts = [APPEAL, `${APPEAL} extra.`, "Something completely different.", "   "];
    for (const text of drafts) {
      const { message } = assessNovelty(text, [prior(APPEAL)]);
      expect(message).not.toMatch(/run out of attempts|exhaust/i);
      expect(message).not.toMatch(/permanent(?:ly)?[\s-]?lock/i);
      expect(message).not.toMatch(/\bodds\b|\bchances\b|likelihood/i);
      expect(message).not.toMatch(/amazon (?:will|is likely|is unlikely|treats)/i);
      expect(message).not.toMatch(/\bguarantee|\breject(?:s|ed|ion)\b|\bapprove/i);
    }
  });

  it("never phrases a warning as a block", () => {
    for (const text of [APPEAL, `${APPEAL} extra.`]) {
      const r = assessNovelty(text, [prior(APPEAL)]);
      expect(r.message).not.toMatch(/cannot submit|not allowed|blocked|forbidden/i);
    }
  });
});

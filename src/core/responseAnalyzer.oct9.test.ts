import { describe, expect, it } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

/**
 * 9 Oct 2026. Fresh wordings, written from how Amazon replies read on seller forums rather than
 * from the fixtures the analyser was built against (the method that found seven defects in the
 * notice decoder on 29 Sep). Each positive case below came back "unrecognized" before.
 */
describe("replies the analyser did not read before 9 Oct 2026", () => {
  it("reads 'we have decided to reinstate' as reinstated", () => {
    const r = analyzeReply(
      "Thank you for your Plan of Action. After reviewing it, we have decided to reinstate your selling privileges. You can resume selling now.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBeUndefined();
  });

  it("reads an accepted plan of action as reinstated", () => {
    expect(analyzeReply("Your Plan of Action has been accepted. Thank you.").category).toBe(
      "reinstated",
    );
  });

  it("reads the passive 'further appeals will not be reviewed' as final", () => {
    const r = analyzeReply(
      "We reviewed your information. Your account will remain blocked. Further appeals on this matter will not be reviewed.",
    );
    expect(r.category).toBe("final_decision_negative");
  });

  it("reads 'we still need the purchase order' as a document request", () => {
    const r = analyzeReply(
      "Thank you for providing the invoice. We still need the purchase order that matches it before we can finish the review.",
    );
    expect(r.category).toBe("document_request");
  });

  it("does not call a reinstatement whole when it still needs a record", () => {
    const r = analyzeReply(
      "We have decided to reinstate your selling privileges. We still need the purchase order for the listing we removed.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBe(true);
    expect(r.openAsks?.[0]?.kind).toBe("documents");
  });
});

describe("the same words must not be read as good news", () => {
  it("'decided not to reinstate' is not a reinstatement", () => {
    expect(
      analyzeReply("After review, we have decided not to reinstate your selling privileges.")
        .category,
    ).not.toBe("reinstated");
  });

  it("a plan of action that was not accepted is not a reinstatement", () => {
    expect(analyzeReply("Your plan of action was not accepted.").category).toBe(
      "needs_more_information",
    );
  });

  it("an accepted plan quoted back inside a refusal stays a refusal", () => {
    const r = analyzeReply(
      "You wrote: 'Your plan of action has been accepted.' That is not our decision. We do not have enough information to reinstate your account.",
    );
    expect(r.category).toBe("needs_more_information");
  });

  it("'if your plan of action is accepted' is a condition, not a statement", () => {
    expect(
      analyzeReply("If your plan of action is accepted, your account is now active.").category,
    ).not.toBe("reinstated");
  });

  it("a request that does not say it needs a record is not a document request", () => {
    expect(
      analyzeReply("We need more time to review your case. We will write to you again.").category,
    ).toBe("unrecognized");
  });
});

import { describe, expect, it } from "vitest";
import { analyzeReply } from "./responseAnalyzer";

describe("analyzeReply: negation and refusals", () => {
  it.each([
    "We have not reinstated your account.",
    "If your plan of action is accepted, your account is now active.",
    "Your account is not active. We have not reinstated your account.",
  ])("never reports reinstated for: %s", (t) => {
    expect(analyzeReply(t).category).not.toBe("reinstated");
  });

  it.each([
    "We're unable to reinstate your account.",
    "We can't reinstate your account at this time.",
    "We will not reinstate your account.",
    "We are not able to reinstate your selling privileges.",
  ])("reads a refusal that leaves the case open: %s", (t) => {
    expect(analyzeReply(t).category).toBe("needs_more_information");
  });

  it.each([
    "Your account has been permanently suspended.",
    "We have permanently closed your account.",
  ])("reads a final removal: %s", (t) => {
    expect(analyzeReply(t).category).toBe("final_decision_negative");
  });

  it("still reports a plain reinstatement", () => {
    expect(analyzeReply("Your account has been reinstated. Thank you.").category).toBe(
      "reinstated",
    );
    expect(analyzeReply("Good news. Your selling privileges have been restored.").category).toBe(
      "reinstated",
    );
  });
});

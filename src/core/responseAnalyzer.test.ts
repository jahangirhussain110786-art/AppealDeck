import { describe, it, expect } from "vitest";
import { analyzeReply, isRuleMatch } from "./responseAnalyzer";

describe("responseAnalyzer", () => {
  it("detects reinstated replies", () => {
    const result = analyzeReply(
      "We have reviewed your appeal and reinstated your account. Your selling privileges have been restored.",
    );
    expect(result.category).toBe("reinstated");
    expect(result.confidence).toBe("rule");
  });

  it("detects final negative decisions", () => {
    const result = analyzeReply(
      "After careful review, this decision is final. We will not be able to respond to further appeals.",
    );
    expect(result.category).toBe("final_decision_negative");
  });

  it("detects document requests and extracts the evidence kind", () => {
    const result = analyzeReply(
      "Please provide us with the following documents: supplier invoices for the affected ASINs.",
    );
    expect(result.category).toBe("document_request");
    expect(result.extractedAsks).toContain("supplier_invoice");
  });

  it("detects needs_more_information", () => {
    const result = analyzeReply(
      "We do not have enough information to reinstate your account. Please provide more detail about your corrective actions.",
    );
    expect(result.category).toBe("needs_more_information");
  });

  it("detects identity verification requests", () => {
    const result = analyzeReply(
      "Before we proceed, please verify your identity by providing a government-issued ID.",
    );
    expect(result.category).toBe("identity_verification");
    expect(result.extractedAsks).toContain("identity_doc");
  });

  it("detects funds decisions", () => {
    const result = analyzeReply("Your funds will be released after the standard review period.");
    expect(result.category).toBe("funds_decision");
  });

  it("returns unrecognized for unrelated text", () => {
    const result = analyzeReply(
      "Your recent order #123-4567890 has been shipped and will arrive Thursday.",
    );
    expect(result.category).toBe("unrecognized");
    expect(result.extractedAsks).toEqual([]);
  });

  it("caps input length", () => {
    const huge = "x".repeat(100000) + "this decision is final";
    const result = analyzeReply(huge);
    expect(result.category).toBe("final_decision_negative");
  });

  it("isRuleMatch returns true for known categories", () => {
    expect(isRuleMatch("Your account is now active again")).toBe(true);
  });

  it("isRuleMatch returns false for unrecognized text", () => {
    expect(isRuleMatch("Hello, how are you today?")).toBe(false);
  });
});

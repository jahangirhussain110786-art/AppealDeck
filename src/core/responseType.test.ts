import { describe, it, expect } from "vitest";
import { determineResponseType, splitClauses, RESPONSE_TYPE_LABELS } from "./responseType";

describe("splitClauses", () => {
  it("reports offsets that index back into the original string", () => {
    const raw = "First sentence. Second one here.\nThird on a new line.";
    for (const clause of splitClauses(raw)) {
      expect(raw.slice(clause.start, clause.start + clause.text.length)).toBe(clause.text);
    }
  });

  it("does not split inside a decimal or a hostname", () => {
    const clauses = splitClauses("Your rate is 1.5% against sellercentral.amazon.com targets.");
    expect(clauses).toHaveLength(1);
  });

  it("drops empty clauses from blank lines", () => {
    expect(splitClauses("One.\n\n\nTwo.").map((c) => c.text)).toEqual(["One.", "Two."]);
  });
});

describe("determineResponseType", () => {
  it("identifies a plan-of-action request", () => {
    const r = determineResponseType("Please submit a Plan of Action explaining the root cause.");
    expect(r.type).toBe("PLAN_OF_ACTION");
    expect(r.confidence).toBe("stated");
  });

  it("identifies a documents request", () => {
    expect(determineResponseType("Please provide your supplier invoice.").type).toBe(
      "SUPPORTING_DOCUMENTS",
    );
  });

  it("identifies a questionnaire and an acknowledgement", () => {
    expect(determineResponseType("Please complete the questionnaire below.").type).toBe(
      "QUESTIONNAIRE",
    );
    expect(determineResponseType("Please acknowledge that you have read the policy.").type).toBe(
      "ACKNOWLEDGEMENT",
    );
  });

  it("identifies a notice that asks for nothing", () => {
    expect(determineResponseType("Your case remains under review.").type).toBe(
      "NO_ACTION_REQUESTED",
    );
  });

  // The two failure modes that cost a seller an appeal attempt.
  it("does not read a negated instruction as a request", () => {
    const r = determineResponseType(
      "Do not submit a Plan of Action. Please provide the invoice for this product.",
    );
    expect(r.type).toBe("SUPPORTING_DOCUMENTS");
  });

  it("does not read a past-tense mention as a request", () => {
    const r = determineResponseType(
      "Your previous Plan of Action was received. Please provide the supplier invoice.",
    );
    expect(r.type).toBe("SUPPORTING_DOCUMENTS");
    expect(r.competing).not.toContain("PLAN_OF_ACTION");
  });

  // Found by decoding a real verification notice in the browser: the first version only matched
  // bare infinitives, so "by providing government-issued identification" produced nothing at all.
  it.each([
    "Please complete identity verification by providing government-issued identification.",
    "We require you submitting the supplier invoice.",
    "Kindly furnish the authorization letter.",
    "Start by uploading your receipts.",
    "This requires supplying a test report.",
  ])("reads an inflected request verb: %s", (notice) => {
    expect(determineResponseType(notice).type).toBe("SUPPORTING_DOCUMENTS");
  });

  it("refuses to guess when nothing matches, and says so", () => {
    const r = determineResponseType("Your account has been deactivated. Read the message.");
    expect(r.type).toBe("UNDETERMINED");
    expect(r.confidence).toBe("undetermined");
    expect(r.matches).toHaveLength(0);
    expect(r.reason).toMatch(/not going to guess/i);
  });

  it("prefers the plan of action when a notice asks for both it and documents", () => {
    const r = determineResponseType(
      "Please submit a Plan of Action explaining the root cause. Also provide your supplier invoice.",
    );
    expect(r.type).toBe("PLAN_OF_ACTION");
    expect(r.competing).toContain("SUPPORTING_DOCUMENTS");
  });

  it("warns the seller to check the form when the evidence conflicts", () => {
    const r = determineResponseType(
      "Please submit a Plan of Action explaining the root cause. Also provide your supplier invoice.",
    );
    expect(r.reason).toMatch(/check the response page/i);
  });

  it("does not add the conflict warning when the reading is unambiguous", () => {
    const r = determineResponseType("Please provide your supplier invoice.");
    expect(r.reason).not.toMatch(/check the response page/i);
  });

  it("treats a bare form-field label as a request, but the same words in prose as context", () => {
    // A form labelled "Corrective actions and prevention" IS the request.
    expect(determineResponseType("", "Corrective actions and prevention").type).toBe(
      "PLAN_OF_ACTION",
    );
    // The same phrase inside a notice, with nothing asking for it, is not.
    expect(
      determineResponseType("This action followed corrective action taken on your account.").type,
    ).not.toBe("PLAN_OF_ACTION");
  });

  it("returns spans that point at the seller's own words", () => {
    const raw = "Please submit a Plan of Action explaining the root cause.";
    const r = determineResponseType(raw);
    for (const m of r.matches) {
      expect(m.start).toBeGreaterThanOrEqual(0);
      expect(raw.slice(m.start, m.end).toLowerCase()).toContain("plan of action");
    }
  });

  it("labels every response type", () => {
    for (const key of Object.keys(RESPONSE_TYPE_LABELS)) {
      expect(RESPONSE_TYPE_LABELS[key as keyof typeof RESPONSE_TYPE_LABELS]).toBeTruthy();
    }
  });
});

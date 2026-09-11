import { describe, it, expect } from "vitest";
import { daysBetween, outcomeFromReplyCategory, buildOutcomeRecord } from "./outcomeModel";

describe("daysBetween", () => {
  it("computes whole days between two ISO timestamps", () => {
    expect(daysBetween("2026-09-01T00:00:00Z", "2026-09-11T00:00:00Z")).toBe(10);
  });

  it("returns 0 for the same instant", () => {
    expect(daysBetween("2026-09-11T00:00:00Z", "2026-09-11T00:00:00Z")).toBe(0);
  });

  it("clamps a negative span (outcome before submission) to 0 rather than reporting negative", () => {
    expect(daysBetween("2026-09-11T00:00:00Z", "2026-09-01T00:00:00Z")).toBe(0);
  });

  it("returns 0 for unparseable input rather than throwing", () => {
    expect(daysBetween("not-a-date", "2026-09-11T00:00:00Z")).toBe(0);
  });
});

describe("outcomeFromReplyCategory", () => {
  it("maps 'reinstated' to 'approved'", () => {
    expect(outcomeFromReplyCategory("reinstated")).toBe("approved");
  });

  it("maps 'final_decision_negative' to 'rejected'", () => {
    expect(outcomeFromReplyCategory("final_decision_negative")).toBe("rejected");
  });

  it("returns null for non-terminal categories", () => {
    expect(outcomeFromReplyCategory("document_request")).toBeNull();
    expect(outcomeFromReplyCategory("needs_more_information")).toBeNull();
    expect(outcomeFromReplyCategory("identity_verification")).toBeNull();
    expect(outcomeFromReplyCategory("funds_decision")).toBeNull();
    expect(outcomeFromReplyCategory("unrecognized")).toBeNull();
  });
});

describe("buildOutcomeRecord", () => {
  it("assembles a schema-conformant record with the computed day span", () => {
    const record = buildOutcomeRecord({
      kind: "POLICY",
      marketplace: "amazon.com",
      docType: "poa",
      attempts: 1,
      readinessAtSubmit: 90,
      outcome: "approved",
      submittedAt: "2026-09-01T00:00:00Z",
      outcomeAt: "2026-09-08T00:00:00Z",
    });
    expect(record).toEqual({
      kind: "POLICY",
      marketplace: "amazon.com",
      docType: "poa",
      attempts: 1,
      readinessAtSubmit: 90,
      outcome: "approved",
      daysToOutcome: 7,
    });
  });

  it("never includes any field beyond the six-field schema (no PII surface exists)", () => {
    const record = buildOutcomeRecord({
      kind: "FUNDS",
      marketplace: "unknown",
      docType: "funds_appeal",
      attempts: 2,
      readinessAtSubmit: 60,
      outcome: "no_response",
      submittedAt: "2026-09-01T00:00:00Z",
      outcomeAt: "2026-09-15T00:00:00Z",
    });
    expect(Object.keys(record).sort()).toEqual(
      [
        "attempts",
        "daysToOutcome",
        "docType",
        "kind",
        "marketplace",
        "outcome",
        "readinessAtSubmit",
      ].sort(),
    );
  });
});

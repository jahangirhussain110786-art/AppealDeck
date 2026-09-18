import { describe, expect, it } from "vitest";
import { CaseDataSchema } from "./caseSchema";
import { createCaseFile } from "@/core/interviewEngine";
describe("case boundary schema", () => {
  it("preserves current identity, narrative, attestation and deadlines", () => {
    const file = {
      ...createCaseFile("POLICY"),
      preventiveMeasures: "A documented review process",
      preventiveMeasuresAsked: true,
    };
    expect(CaseDataSchema.parse(file)).toMatchObject(file);
  });
  it.each([
    { id: "case", kind: "made_up" },
    { id: "case", kind: "POLICY", actionItems: [null] },
    { id: "case", kind: "POLICY", evidenceSlots: { supplier_invoice: { present: "yes" } } },
    { id: "case", kind: "POLICY", rootCause: "x".repeat(12001) },
    { kind: "POLICY" },
  ])("rejects invalid domain inputs", (data) =>
    expect(CaseDataSchema.safeParse(data).success).toBe(false),
  );
});

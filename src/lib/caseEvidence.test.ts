import { describe, expect, it } from "vitest";
import { createCaseFile } from "@/core";
import type { Vault } from "@/core/vault/vault";
import { withCaseEvidence } from "./caseEvidence";
describe("case evidence isolation", () => {
  it("does not count another case's invoice or a deleted attachment", async () => {
    const file = createCaseFile("POLICY");
    file.evidenceSlots.supplier_invoice = { present: true };
    const records = [{ caseId: "older-case", kind: "document", evidenceKind: "supplier_invoice" }];
    const vault = {
      list: async (filter: { caseId: string }) => records.filter((r) => r.caseId === filter.caseId),
    } as unknown as Vault;
    expect((await withCaseEvidence(vault, file)).evidenceSlots.supplier_invoice?.present).toBe(
      false,
    );
  });
});

import type { CaseFile, EvidenceKind } from "@/core";
import type { Vault } from "@/core/vault/vault";

/** Only files attached to this case can satisfy its slots; deleted files no longer count. */
export async function withCaseEvidence(vault: Vault, file: CaseFile): Promise<CaseFile> {
  const records = await vault.list({ caseId: file.id });
  const present = new Set(records.filter((r) => r.kind === "document").map((r) => r.evidenceKind));
  const evidenceSlots = { ...file.evidenceSlots };
  for (const key of new Set([...Object.keys(evidenceSlots), ...present])) {
    if (!key) continue;
    const kind = key as EvidenceKind;
    evidenceSlots[kind] = { ...evidenceSlots[kind], present: present.has(key) };
  }
  return { ...file, evidenceSlots };
}

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
  const workspace = file.workspace
    ? {
        ...file.workspace,
        requirements: file.workspace.requirements.map((r) => {
          const linked = records.find(
            (record) =>
              record.kind === "document" &&
              record.id === r.recordId &&
              record.plaintextHash === r.contentHash &&
              record.name === r.filename,
          );
          return linked
            ? r
            : {
                ...r,
                status: r.status === "reviewed" ? ("needed" as const) : r.status,
                recordId: undefined,
                filename: undefined,
                contentHash: undefined,
                page: undefined,
              };
        }),
      }
    : undefined;
  return { ...file, evidenceSlots, ...(workspace ? { workspace } : {}) };
}

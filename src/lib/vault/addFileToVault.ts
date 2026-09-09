import type { Vault, AddDocumentInput, VaultListItem } from "@/core/vault/vault";
import type { VaultRecordInput } from "@/core/vault/schema";
import type { EvidenceKind } from "@/core/evidenceModel";
import { toast } from "sonner";
import { APP } from "@/content/app";
import { formatBytes } from "@/lib/format";

export type AddResult =
  { status: "added"; record: VaultRecordInput } | { status: "duplicate"; existing: VaultListItem };

export async function addFileToVault(
  vault: Vault,
  file: File,
  opts: { evidenceKind?: EvidenceKind; caseId?: string } = {},
): Promise<AddResult> {
  const buf = new Uint8Array(await file.arrayBuffer());

  const dup = await vault.findByPlaintext(buf);
  if (dup) {
    toast.info(APP.interview.fileUpload.duplicate, {
      description: APP.interview.fileUpload.duplicateDesc
        .replace("{name}", file.name)
        .replace("{existing}", dup.name),
    });
    return { status: "duplicate", existing: dup };
  }

  const input: AddDocumentInput = {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: buf,
    kind: "document",
    evidenceKind: opts.evidenceKind ?? undefined,
    caseId: opts.caseId ?? undefined,
  };

  const record = await vault.add(input);
  const size = formatBytes(file.size);
  const slot = opts.evidenceKind
    ? APP.evidenceKinds[opts.evidenceKind]
    : APP.interview.fileUpload.vaultSlot;

  toast.success(APP.interview.fileUpload.added.replace("{name}", file.name), {
    description: APP.interview.fileUpload.addedDesc.replace("{size}", size).replace("{slot}", slot),
  });

  return { status: "added", record };
}

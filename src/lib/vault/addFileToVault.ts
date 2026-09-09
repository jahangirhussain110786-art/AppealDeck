import type { Vault, AddDocumentInput, VaultListItem } from "@/core/vault/vault";
import { toast } from "sonner";
import { APP } from "@/content/app";
import { formatBytes } from "@/lib/format";

export type AddResult = { status: "added"; listItem: VaultListItem } | { status: "duplicate" };

export async function addFileToVault(
  vault: Vault,
  file: File,
  evidenceKind?: string,
  caseId?: string,
  slot?: string,
): Promise<AddResult> {
  const buf = new Uint8Array(await file.arrayBuffer());

  const dup = await vault.findByPlaintext(buf);
  if (dup) {
    toast.info(APP.interview.fileUpload.duplicate, {
      description: APP.interview.fileUpload.duplicateDesc
        .replace("{name}", file.name)
        .replace("{existing}", dup.name),
    });
    return { status: "duplicate" };
  }

  const input: AddDocumentInput = {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: buf,
    kind: "document",
    evidenceKind: evidenceKind ?? undefined,
    caseId: caseId ?? undefined,
  };

  await vault.add(input);
  const records = await vault.list({ evidenceKind });
  const added = records.find((r) => r.name === file.name);
  const size = formatBytes(file.size);
  const label = slot ?? APP.vault.encryptedBadge;

  toast.success(APP.interview.fileUpload.added.replace("{name}", file.name), {
    description: APP.interview.fileUpload.addedDesc
      .replace("{size}", size)
      .replace("{slot}", label),
  });

  return { status: "added", listItem: added! };
}

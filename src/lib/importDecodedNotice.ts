import { createCaseFile } from "@/core/caseFile";
import { newWorkspace, proposedRequirements, routeWorkspace } from "@/core/workspace";
import type { ViolationKind } from "@/core";
import type { Vault } from "@/core/vault/vault";
import { listCases, loadCaseFile, saveCaseFile, setActiveCaseId } from "./caseStore";
import type { PendingNotice } from "./pendingNotice";
import { WorkspaceSchema } from "./workspaceSchema";

/** Save before displaying the workspace; repeated entry resumes the same encrypted case. */
export async function importDecodedNotice(
  vault: Vault,
  pending: PendingNotice,
  kind: ViolationKind,
) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pending.text));
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return vault.atomic(async () => {
    for (const entry of await listCases(vault)) {
      const existing = await loadCaseFile(vault, entry.id);
      if (existing?.workspace?.decodedNoticeHash === hash) {
        await setActiveCaseId(vault, existing.id);
        return existing;
      }
    }
    const workspace = { ...newWorkspace(), notice: pending.text, decodedNoticeHash: hash };
    workspace.protocol = routeWorkspace(workspace).protocol;
    workspace.requirements = proposedRequirements(workspace);
    WorkspaceSchema.parse(workspace);
    const file = { ...createCaseFile(kind), workspace, deadlines: pending.deadlines };
    await saveCaseFile(vault, file);
    return file;
  });
}

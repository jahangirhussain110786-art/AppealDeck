import { describe, expect, it, vi } from "vitest";
import { withCaseEvidence } from "./caseEvidence";
import { createCaseFile } from "@/core/caseFile";
import { newWorkspace } from "@/core/workspace";
import type { Vault } from "@/core/vault/vault";

describe("workspace document reconciliation", () => {
  it("invalidates missing or changed files without rewriting past submissions", async () => {
    const workspace = newWorkspace();
    workspace.requirements = [
      {
        id: "r1",
        label: "Invoice",
        sourceQuote: "Provide invoice",
        note: "Product match",
        status: "reviewed",
        recordId: "doc",
        filename: "invoice.pdf",
        contentHash: "old-hash",
        page: 1,
      },
    ];
    const file = { ...createCaseFile("UNKNOWN"), workspace };
    const list = vi
      .fn()
      .mockResolvedValue([
        { id: "doc", name: "invoice.pdf", kind: "document", plaintextHash: "new-hash" },
      ]);
    const reconciled = await withCaseEvidence({ list } as unknown as Vault, file);
    expect(list).toHaveBeenCalledWith({ caseId: file.id });
    expect(reconciled.workspace?.requirements[0].recordId).toBeUndefined();
    expect(reconciled.workspace?.requirements[0].status).toBe("needed");
    expect(workspace.requirements[0].status).toBe("reviewed");
    list.mockResolvedValue([]);
    expect(
      (await withCaseEvidence({ list } as unknown as Vault, file)).workspace?.requirements[0]
        .recordId,
    ).toBeUndefined();
  });
});

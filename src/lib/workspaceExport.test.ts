import { describe, expect, it } from "vitest";
import { buildCaseExport } from "./workspaceExport";
import { createCaseFile } from "@/core/caseFile";
import { documentWorkspace } from "@/core/workspace.fixture";

describe("buildCaseExport", () => {
  it("includes the notice, response facts, evidence plan, submissions and replies in full", () => {
    const w = {
      ...documentWorkspace(),
      submissions: [
        {
          id: "s1",
          at: new Date().toISOString(),
          revision: 1,
          protocol: "documents" as const,
          text: "Full response text goes here in full, not summarized.",
          receipt: "REF-123",
          attachments: [
            { recordId: "file-1", filename: "invoice.pdf", contentHash: "hash-1", page: 2 },
          ],
        },
      ],
      replies: [
        { id: "r1", at: new Date().toISOString(), text: "Please also send X.", applied: false },
      ],
    };
    const file = { ...createCaseFile("POLICY"), workspace: w };
    const text = buildCaseExport(file, w);
    expect(text).toContain(w.notice);
    expect(text).toContain(w.formInstructions);
    expect(text).toContain(w.explanation);
    expect(text).toContain("Supplier invoice");
    expect(text).toContain("Product code J-104 appears on the invoice line.");
    expect(text).toContain("Full response text goes here in full, not summarized.");
    expect(text).toContain("REF-123");
    expect(text).toContain("Please also send X.");
    expect(text).toContain("not a submitted response");
  });

  it("does not claim a submission or reply exists when there are none", () => {
    const w = documentWorkspace();
    const file = { ...createCaseFile("POLICY"), workspace: w };
    const text = buildCaseExport(file, w);
    expect(text).toContain("(no submission recorded)");
    expect(text).toContain("(no reply recorded)");
  });
});

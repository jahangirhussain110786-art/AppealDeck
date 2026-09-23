import { describe, it, expect } from "vitest";
import { buildEvidenceManifest, manifestFilename, type PackRecord } from "@/lib/evidencePack";
import { newWorkspace } from "@/core/workspace";
import type { CaseFile } from "@/core/caseFile";

const file = { id: "case-1", kind: "INAUTHENTIC_DOCUMENTS" } as CaseFile;

const record: PackRecord = {
  filename: "invoice-acme.pdf",
  mimeType: "application/pdf",
  sizeBytes: 250_000,
  contentHash: "v1.abc123",
  addedAt: "2026-09-10T00:00:00Z",
  answers: "Supplier invoice",
  page: 1,
};

describe("buildEvidenceManifest", () => {
  it("lists every file with its content hash", () => {
    const out = buildEvidenceManifest({ file, workspace: newWorkspace(), records: [record] });
    expect(out).toContain("invoice-acme.pdf");
    expect(out).toContain("v1.abc123");
    expect(out).toContain("244.1 KB");
    expect(out).toContain("Supplier invoice");
  });

  /** The whole point of the manifest: a record that survives outside Amazon's account. */
  it("explains what a hash is for, so the record is usable months later", () => {
    const out = buildEvidenceManifest({ file, workspace: newWorkspace(), records: [record] });
    expect(out).toMatch(/contents are unchanged since it was added/i);
  });

  it("says plainly that nothing was sent to Amazon", () => {
    const out = buildEvidenceManifest({ file, workspace: newWorkspace(), records: [] });
    expect(out).toMatch(/not a submission/i);
    expect(out).toMatch(/AppealDeck has not sent any of them to Amazon/i);
  });

  it("states an empty case honestly rather than printing an empty section", () => {
    const out = buildEvidenceManifest({ file, workspace: newWorkspace(), records: [] });
    expect(out).toContain("(no files in the vault for this case)");
    expect(out).toContain("(nothing recorded as sent yet)");
    expect(out).toContain("(none recorded yet)");
  });

  it("records each requirement with the sentence that asked for it", () => {
    const workspace = {
      ...newWorkspace(),
      requirements: [
        {
          id: "r1",
          label: "Supplier invoice",
          sourceQuote: "Please provide your supplier invoice.",
          status: "reviewed" as const,
          note: "Shows the completed transaction.",
          filename: "invoice-acme.pdf",
          page: 1,
        },
      ],
    };
    const out = buildEvidenceManifest({ file, workspace, records: [record] });
    expect(out).toContain("Requested because: Please provide your supplier invoice.");
    expect(out).toContain("file: invoice-acme.pdf · page 1");
  });

  it("records the hash captured at submission time, not only the current one", () => {
    const workspace = {
      ...newWorkspace(),
      submissions: [
        {
          id: "s1",
          at: "2026-09-12T00:00:00Z",
          revision: 1,
          protocol: "documents" as const,
          text: "Response text",
          receipt: "AMZ-123",
          attachments: [
            { recordId: "rec1", filename: "invoice-acme.pdf", contentHash: "v1.abc123", page: 1 },
          ],
        },
      ],
    };
    const out = buildEvidenceManifest({ file, workspace, records: [record] });
    expect(out).toContain("reference AMZ-123");
    expect(out).toContain("Content hash at the time it was sent: v1.abc123");
  });

  it("notes when a submission had no attachments rather than leaving a blank", () => {
    const workspace = {
      ...newWorkspace(),
      submissions: [
        {
          id: "s1",
          at: "2026-09-12T00:00:00Z",
          revision: 1,
          protocol: "operational" as const,
          text: "Plan of action",
          receipt: "",
          attachments: [],
        },
      ],
    };
    const out = buildEvidenceManifest({ file, workspace, records: [] });
    expect(out).toContain("Attachments recorded: none");
  });
});

describe("manifestFilename", () => {
  it("is dated so successive exports do not overwrite each other", () => {
    expect(manifestFilename("case-1", new Date("2026-09-22T10:00:00Z"))).toBe(
      "appealdeck-evidence-manifest-case-1-2026-09-22.txt",
    );
  });

  it("strips anything that could escape the filename", () => {
    const name = manifestFilename("../../etc/passwd", new Date("2026-09-22T10:00:00Z"));
    expect(name).not.toContain("/");
    expect(name).not.toContain("..");
  });

  it("falls back to a usable name when the id has nothing safe in it", () => {
    expect(manifestFilename("///", new Date("2026-09-22T10:00:00Z"))).toContain("case");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSubmission,
  openItemsAt,
  readinessOf,
  submissionHistoryMessage,
  workspaceOutcomeRecord,
} from "./submissionRecord";
import { createCaseFile } from "@/core/caseFile";
import { documentWorkspace } from "@/core/workspace.fixture";
import { WorkspaceSchema } from "./workspaceSchema";

/**
 * 23 Sep 2026 (audit item R). A submission could only be recorded when the prepared response passed
 * every check, and it always recorded the prepared text — so an edited or early submission was
 * either unrecordable or recorded as words the seller never sent.
 */
const prepared = {
  rendered: "The prepared response.",
  mode: "full-draft",
  findings: [],
};
const base = { receipt: "", id: "sub-1", at: "2026-09-23T10:00:00.000Z" };

describe("buildSubmission", () => {
  it("records the prepared text when the seller sent it as it was", () => {
    const s = buildSubmission({ ...base, workspace: documentWorkspace(), prepared });
    expect(s.text).toBe("The prepared response.");
    expect(s).not.toHaveProperty("preparedText");
  });

  it("records what the seller actually sent, and keeps the prepared text beside it", () => {
    const s = buildSubmission({
      ...base,
      workspace: documentWorkspace(),
      prepared,
      sentText: "  What I really sent, after my consultant edited it.  ",
    });
    expect(s.text).toBe("What I really sent, after my consultant edited it.");
    expect(s.preparedText).toBe("The prepared response.");
  });

  it("does not call it changed when the pasted text is the prepared text", () => {
    const s = buildSubmission({
      ...base,
      workspace: documentWorkspace(),
      prepared,
      sentText: "The prepared response.",
    });
    expect(s).not.toHaveProperty("preparedText");
  });

  it("records a submission made with items still open, and keeps them", () => {
    const w = documentWorkspace();
    const withGap = {
      ...w,
      requirements: w.requirements.map((r) => ({
        ...r,
        status: "needed" as const,
        recordId: undefined,
        filename: undefined,
        contentHash: undefined,
      })),
    };
    const s = buildSubmission({
      ...base,
      workspace: withGap,
      prepared: {
        ...prepared,
        mode: "gap-draft",
        findings: [{ severity: "warning", code: "X", message: "A sentence promises an outcome." }],
      },
    });
    expect(s.unresolved).toContain("Prepared as a working draft, not a full draft.");
    expect(s.unresolved).toContain("A sentence promises an outcome.");
    // An unlinked record is an open item, not an attachment with no name.
    expect(s.attachments).toEqual([]);
    expect(submissionHistoryMessage(s)).toMatch(/still open/);
    expect(submissionHistoryMessage(s)).not.toMatch(/approv|confirmed|accepted/i);
  });

  it("survives the vault's validator, which strips any field it does not declare", () => {
    const w = documentWorkspace();
    const s = buildSubmission({
      ...base,
      workspace: w,
      prepared: { ...prepared, mode: "gap-draft" },
      sentText: "Edited.",
    });
    const parsed = WorkspaceSchema.parse({ ...w, submissions: [s] });
    expect(parsed.submissions[0]).toMatchObject({
      text: "Edited.",
      preparedText: "The prepared response.",
      unresolved: ["Prepared as a working draft, not a full draft."],
    });
  });

  it("finds nothing open on a finished case", () => {
    expect(openItemsAt(documentWorkspace(), prepared)).toEqual([]);
  });

  it("stores how complete the case was when it was sent", () => {
    const w = documentWorkspace();
    expect(buildSubmission({ ...base, workspace: w, prepared }).readinessAtSubmit).toBe(100);
    const half = {
      ...w,
      requirements: [
        ...w.requirements,
        { id: "x", label: "Other", sourceQuote: "q", status: "needed" as const, note: "" },
      ],
    };
    expect(readinessOf(half)).toBe(50);
  });
});

/**
 * 23 Sep 2026. The opt-in outcome card was offered only to classic cases, so no workspace case —
 * every case since the interview was retired — could share an outcome, and D6 allows a success
 * figure from nothing else.
 */
describe("workspaceOutcomeRecord", () => {
  const w = documentWorkspace();
  const sent = buildSubmission({ ...base, workspace: w, prepared });
  const file = { ...createCaseFile("INAUTHENTIC"), workspace: { ...w, submissions: [sent] } };
  const log = {
    state: "APPROVED" as const,
    attemptCount: 1,
    resolution: { status: "reinstated" as const, at: "2026-09-30T10:00:00.000Z" },
  };

  it("describes the case as it was sent, and what the seller recorded", () => {
    expect(workspaceOutcomeRecord(file, log)).toEqual({
      kind: "INAUTHENTIC",
      marketplace: "amazon.com",
      docType: "poa",
      attempts: 1,
      readinessAtSubmit: 100,
      outcome: "approved",
      daysToOutcome: 7,
    });
  });

  it("carries no case content, only structure", () => {
    const text = JSON.stringify(workspaceOutcomeRecord(file, log));
    expect(text).not.toContain(w.notice.slice(0, 20));
    expect(text).not.toContain(file.id);
  });

  it("offers nothing before an outcome is recorded", () => {
    expect(workspaceOutcomeRecord(file, { ...log, resolution: undefined })).toBeNull();
  });

  it("offers nothing when completeness at the time was never measured", () => {
    // A submission recorded before this shipped, or one sent before the seller found us.
    const { readinessAtSubmit: _dropped, ...older } = sent;
    void _dropped;
    const oldFile = { ...file, workspace: { ...file.workspace, submissions: [older] } };
    expect(workspaceOutcomeRecord(oldFile, log)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  fileForCommit,
  fileStateAfterLog,
  hadSubmission,
  outcomeBlocksStateChange,
  type CaseLog,
} from "@/lib/caseStore";
import { logWithOutcome } from "@/components/workspace/CaseOutcome";
import { createCaseFile } from "@/core/caseFile";
import { documentWorkspace } from "@/core/workspace.fixture";
import { buildCaseExport, unsavedText } from "@/lib/workspaceExport";
import type { Workspace } from "@/core/workspace";

describe("6. a stale tab cannot revert the case's state, kind or deadlines", () => {
  const current = {
    ...createCaseFile("UNKNOWN"),
    workspace: documentWorkspace(),
    state: "SUBMITTED" as const,
  };
  const disk = {
    ...current,
    state: "CLOSED" as const,
    kind: "INAUTHENTIC" as const,
    deadlines: [
      {
        kind: "appeal_window" as const,
        label: "Appeal by 1 Oct 2026",
        dueAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  };
  it("takes state, kind and deadlines from disk when the commit names none", () => {
    const out = fileForCommit(current, disk, documentWorkspace(), {});
    expect(out.state).toBe("CLOSED");
    expect(out.kind).toBe("INAUTHENTIC");
    expect(out.deadlines).toEqual(disk.deadlines);
  });
  it("what the commit names still wins", () => {
    const out = fileForCommit(current, disk, documentWorkspace(), {
      state: "REVISION",
      kind: "POLICY",
      deadlines: [],
    });
    expect(out.state).toBe("REVISION");
    expect(out.kind).toBe("POLICY");
    expect(out.deadlines).toEqual([]);
  });
  it("falls back to this tab's copy when nothing is on disk or another case is", () => {
    expect(fileForCommit(current, null, documentWorkspace(), {}).state).toBe("SUBMITTED");
    expect(fileForCommit(current, { ...disk, id: "other" }, documentWorkspace(), {}).state).toBe(
      "SUBMITTED",
    );
  });
});

describe("7. a round cannot restart while an outcome is recorded", () => {
  const settled: Pick<CaseLog, "resolution"> = {
    resolution: { status: "rejected", at: "2026-10-02T00:00:00.000Z" },
  };
  it("blocks moving CLOSED or APPROVED into a working state", () => {
    expect(outcomeBlocksStateChange("CLOSED", settled, "SUBMITTED")).toBe(true);
    expect(outcomeBlocksStateChange("APPROVED", settled, "REVISION")).toBe(true);
    expect(outcomeBlocksStateChange("CLOSED", settled, "INTAKE")).toBe(true);
  });
  it("allows everything that cannot lose the record", () => {
    expect(outcomeBlocksStateChange("CLOSED", settled, undefined)).toBe(false);
    expect(outcomeBlocksStateChange("CLOSED", settled, "APPROVED")).toBe(false);
    expect(outcomeBlocksStateChange("SUBMITTED", settled, "REVISION")).toBe(false);
    expect(outcomeBlocksStateChange("CLOSED", { resolution: undefined }, "SUBMITTED")).toBe(false);
    expect(outcomeBlocksStateChange("CLOSED", null, "SUBMITTED")).toBe(false);
  });
});

describe("9. 'marked as sent' counts as something sent, in one shared place", () => {
  const log: CaseLog = {
    state: "SUBMITTED",
    attemptCount: 0,
    markedSentAt: "2026-10-01T00:00:00.000Z",
  };
  it("hadSubmission counts markedSentAt, a recorded submission and an attempt count", () => {
    expect(hadSubmission(log)).toBe(true);
    expect(hadSubmission({ state: "INTAKE", attemptCount: 0 })).toBe(false);
    expect(hadSubmission({ state: "INTAKE", attemptCount: 1 })).toBe(true);
    expect(hadSubmission({ state: "INTAKE", attemptCount: 0 }, { submissions: [{}] })).toBe(true);
    expect(
      hadSubmission({ state: "INTAKE", attemptCount: 0 }, { submissions: [{ source: "prior" }] }),
    ).toBe(false);
  });
  it("record the outcome, then take it back: waiting on Amazon is kept", () => {
    const recorded = logWithOutcome(log, "rejected", "2026-10-02T00:00:00.000Z")!;
    expect(recorded.state).toBe("CLOSED");
    const back = logWithOutcome(recorded, "pending", "2026-10-03T00:00:00.000Z")!;
    expect(back.state).toBe("SUBMITTED");
    expect(back).not.toHaveProperty("resolution");
    // The file state follows by the same rule.
    expect(fileStateAfterLog({ state: "CLOSED" }, back)).toBe("SUBMITTED");
  });
});

describe("13. the export says what the page says", () => {
  const build = (patch: Partial<Workspace>) => {
    const file = {
      ...createCaseFile("INAUTHENTIC"),
      workspace: { ...documentWorkspace(), ...patch },
    };
    return buildCaseExport(file, file.workspace, null);
  };
  it("prints the seller's position", () => {
    expect(build({ position: "dispute" })).toContain("Position: disagrees with the finding");
    expect(build({ position: "accept" })).toContain("Position: accepts the finding");
  });
  it("prints another store as another store", () => {
    const out = build({ marketplace: "other" });
    expect(out).toContain("Marketplace: another Amazon store");
    expect(out).not.toContain("Not confirmed");
  });
  it("lists the records the seller removed, with the reason", () => {
    const out = build({
      dismissed: [
        {
          key: "sourcing_doc",
          label: "Sourcing record",
          reason: "Not part of this notice.",
          at: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
    expect(out).toContain("Records the seller removed (1)");
    expect(out).toContain("Sourcing record");
    expect(out).toContain("Not part of this notice.");
  });
  it("says when the case is held for qualified help", () => {
    const out = build({
      d6Latch: {
        at: "2026-10-01T00:00:00.000Z",
        quote: "You submitted forged invoices.",
        source: "x",
      },
    });
    expect(out).toContain("Held for qualified help");
    expect(out).toContain("forged invoices");
  });
});

describe("6. the text a refused save was about to write can be copied", () => {
  it("collects the response fields, answers and pending drafts", () => {
    const text = unsavedText(
      {
        explanation: "The cause was a supplier code change.",
        correctiveActions: "",
        preventiveMeasures: "A weekly check.",
        answers: [{ question: "When did it start?", answer: "In August." }],
        draft: { "response.explanation": "older" },
      },
      [["response.explanation", "typed just now"]],
    );
    expect(text).toContain("The cause was a supplier code change.");
    expect(text).toContain("A weekly check.");
    expect(text).toContain("Answer to: When did it start?");
    expect(text).toContain("typed just now");
    expect(text).not.toContain("older");
  });
  it("is empty when there is nothing", () => {
    expect(unsavedText({ explanation: "", correctiveActions: "", preventiveMeasures: "" })).toBe(
      "",
    );
  });
});

describe("8. reviewing the notice on a case that has moved on keeps its state", () => {
  it("isPastSubmission", async () => {
    const { isPastSubmission } = await import("@/lib/caseStore");
    for (const s of ["SUBMITTED", "AWAITING", "REVISION", "APPROVED", "CLOSED"] as const)
      expect(isPastSubmission(s)).toBe(true);
    for (const s of ["INTAKE", "DECODED", "REMEDIATION", "READY"] as const)
      expect(isPastSubmission(s)).toBe(false);
  });
});

describe("14. recording a prior attempt merges into the workspace as it is now", () => {
  it("keeps what an earlier queued save changed", async () => {
    const { mergePriorAttempts } = await import("@/core/workspace");
    const snapshot = documentWorkspace();
    const old = {
      ...snapshot,
      explanation: "Typed after the card was rendered.",
      history: [{ id: "later", at: "2026-10-01T00:00:00.000Z", message: "Queued save" }],
    };
    const updated = {
      submissions: [
        {
          id: "p",
          at: "2026-09-01T00:00:00.000Z",
          revision: 0,
          protocol: "documents" as const,
          text: "",
          receipt: "",
          attachments: [],
          source: "prior" as const,
        },
      ],
      history: [
        {
          id: "added",
          at: "2026-10-02T00:00:00.000Z",
          message: "Recorded a response sent before this case was created.",
        },
      ],
    };
    const out = mergePriorAttempts(old, updated);
    expect(out.explanation).toBe("Typed after the card was rendered.");
    expect(out.submissions).toHaveLength(1);
    expect(out.history.map((h) => h.id)).toEqual(["later", "added"]);
  });
});

describe("15. an address naming a prototype key opens the overview", () => {
  it("validView accepts only the tabs themselves", async () => {
    const { validView } = await import("@/core/workspace");
    const tabs = { overview: "Overview", evidence: "Documents" };
    expect(validView(tabs, "evidence")).toBe("evidence");
    expect(validView(tabs, "constructor")).toBeUndefined();
    expect(validView(tabs, "toString")).toBeUndefined();
    expect(validView(tabs, "__proto__")).toBeUndefined();
    expect(validView(tabs, undefined)).toBeUndefined();
  });
});

describe("17. an outcome cancels the server's email reminder whatever the sign-in state", () => {
  it("cancels when the reminder was ever on, and keeps the switch on if the server did not agree", async () => {
    const { logAfterOutcome } = await import("@/components/workspace/CaseOutcome");
    const next: CaseLog = {
      state: "CLOSED",
      attemptCount: 1,
      emailReminder: true,
      resolution: { status: "rejected", at: "2026-10-02T00:00:00.000Z" },
    };
    let calls = 0;
    const ok = await logAfterOutcome({ emailReminder: true }, next, async () => (calls++, true));
    expect(calls).toBe(1);
    expect(ok.log.emailReminder).toBe(false);
    expect(ok.cancelFailed).toBe(false);
    const failed = await logAfterOutcome({ emailReminder: true }, next, async () => false);
    expect(failed.log.emailReminder).toBe(true);
    expect(failed.cancelFailed).toBe(true);
  });
  it("does nothing when no email reminder was on", async () => {
    const { logAfterOutcome } = await import("@/components/workspace/CaseOutcome");
    let calls = 0;
    const next: CaseLog = {
      state: "CLOSED",
      attemptCount: 1,
      resolution: { status: "rejected", at: "2026-10-02T00:00:00.000Z" },
    };
    const out = await logAfterOutcome({}, next, async () => (calls++, true));
    expect(calls).toBe(0);
    expect(out.log).toBe(next);
  });
});

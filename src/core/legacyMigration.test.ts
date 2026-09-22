import { describe, it, expect } from "vitest";
import {
  migrateLegacyCase,
  needsMigration,
  migrationSummary,
  MIGRATION_HEADINGS,
} from "./legacyMigration";
import { newWorkspace } from "./workspace";
import type { CaseFile } from "./interviewEngine";
import type { ActionItem } from "./readiness";

function legacyCase(over: Partial<CaseFile> = {}): CaseFile {
  return {
    id: "case-1",
    kind: "INAUTHENTIC_DOCUMENTS",
    state: "INTAKE",
    createdAt: "2026-09-01T00:00:00Z",
    timelineEvents: [],
    priorAppealCount: 0,
    evidenceSlots: {},
    actionItems: [],
    attemptCount: 0,
    ...over,
  } as CaseFile;
}

const action = (over: Partial<ActionItem> & { label: string }): ActionItem => ({
  id: over.label,
  evidenceSlots: [],
  status: "todo",
  ...over,
});

describe("migrateLegacyCase", () => {
  it("carries the root cause into the explanation", () => {
    const w = migrateLegacyCase(
      legacyCase({ rootCause: "We sourced from an unverified wholesaler." }),
    );
    expect(w.explanation).toContain("We sourced from an unverified wholesaler.");
  });

  it("carries preventive measures across", () => {
    const w = migrateLegacyCase(
      legacyCase({ preventiveMeasures: "Authorised distributors only." }),
    );
    expect(w.preventiveMeasures).toBe("Authorised distributors only.");
  });

  /**
   * The two fields the old button-driven migration silently dropped. Once the interview is retired
   * there is nowhere else for them to live, so losing them here would destroy the seller's work.
   */
  it("carries the timeline, which the old migration dropped", () => {
    const w = migrateLegacyCase(
      legacyCase({
        rootCause: "Root cause text.",
        timelineEvents: [
          { date: "2026-08-01", description: "Stock purchased from wholesaler." },
          { date: "2026-08-20", description: "Amazon removed the listing." },
        ],
      }),
    );
    expect(w.explanation).toContain(MIGRATION_HEADINGS.timeline);
    expect(w.explanation).toContain("2026-08-01: Stock purchased from wholesaler.");
    expect(w.explanation).toContain("2026-08-20: Amazon removed the listing.");
    // The root cause is still there — the timeline is added, not substituted.
    expect(w.explanation).toContain("Root cause text.");
  });

  it("carries the action list, which the old migration also dropped", () => {
    const w = migrateLegacyCase(
      legacyCase({
        actionItems: [
          action({ label: "Removed the affected stock", status: "done" }),
          action({ label: "Contact the brand for authorisation", status: "todo" }),
        ],
      }),
    );
    expect(w.correctiveActions).toContain("Removed the affected stock");
    expect(w.correctiveActions).toContain("Contact the brand for authorisation");
  });

  /** Claiming a planned action as finished is exactly what the composer's critic exists to stop. */
  it("keeps completed and planned actions in separate, labelled sections", () => {
    const w = migrateLegacyCase(
      legacyCase({
        actionItems: [
          action({ label: "Disposed of 240 units", status: "done" }),
          action({ label: "Will update the sourcing SOP", status: "todo" }),
        ],
      }),
    );
    const doneAt = w.correctiveActions.indexOf(MIGRATION_HEADINGS.actionsDone);
    const plannedAt = w.correctiveActions.indexOf(MIGRATION_HEADINGS.actionsPlanned);
    expect(doneAt).toBeGreaterThanOrEqual(0);
    expect(plannedAt).toBeGreaterThan(doneAt);
    expect(w.correctiveActions.indexOf("Disposed of 240 units")).toBeLessThan(plannedAt);
  });

  it("treats the interview's done answer as completed even when status lags", () => {
    const w = migrateLegacyCase(
      legacyCase({
        actionItems: [action({ label: "Obtained brand invoice", actionCheckAnswer: "done" })],
      }),
    );
    expect(w.correctiveActions).toContain(MIGRATION_HEADINGS.actionsDone);
  });

  it("leaves out an action the seller declined", () => {
    const w = migrateLegacyCase(
      legacyCase({
        actionItems: [
          action({ label: "Sue the supplier", declined: { reason: "Too costly", at: "x" } }),
        ],
      }),
    );
    expect(w.correctiveActions).not.toContain("Sue the supplier");
  });

  it("includes an attestation note alongside a completed action", () => {
    const w = migrateLegacyCase(
      legacyCase({
        actionItems: [
          action({
            label: "Disposed of stock",
            status: "done",
            attestation: { attestedAt: "2026-09-01", note: "240 units, receipt #55" },
          }),
        ],
      }),
    );
    expect(w.correctiveActions).toContain("240 units, receipt #55");
  });

  /** It now runs automatically on open, so a second pass must not duplicate the seller's words. */
  it("is idempotent — an existing workspace is returned untouched", () => {
    const existing = { ...newWorkspace(), explanation: "Already written by hand." };
    const file = legacyCase({ workspace: existing, rootCause: "Should not be re-applied." });
    expect(migrateLegacyCase(file)).toBe(existing);
  });

  it("produces a valid empty workspace for a case with nothing in it", () => {
    const w = migrateLegacyCase(legacyCase());
    expect(w.explanation).toBe("");
    expect(w.correctiveActions).toBe("");
    expect(w.preventiveMeasures).toBe("");
    expect(w.revision).toBe(1);
  });

  it("skips blank timeline entries rather than emitting empty bullets", () => {
    const w = migrateLegacyCase(
      legacyCase({ timelineEvents: [{ date: "2026-08-01", description: "   " }] }),
    );
    expect(w.explanation).toBe("");
  });

  it("handles a timeline entry with no date", () => {
    const w = migrateLegacyCase(
      legacyCase({ timelineEvents: [{ date: "", description: "Something happened." }] }),
    );
    expect(w.explanation).toContain("- Something happened.");
  });
});

describe("needsMigration", () => {
  it("is true only for a case with no workspace", () => {
    expect(needsMigration(legacyCase())).toBe(true);
    expect(needsMigration(legacyCase({ workspace: newWorkspace() }))).toBe(false);
  });
});

describe("migrationSummary", () => {
  it("names what moved so a changed case is explained, not merely changed", () => {
    const summary = migrationSummary(
      legacyCase({
        rootCause: "x",
        timelineEvents: [{ date: "2026-08-01", description: "y" }],
        preventiveMeasures: "z",
      }),
    );
    expect(summary).toContain("your root-cause answer");
    expect(summary).toContain("your timeline");
    expect(summary).toContain("your preventive measures");
    expect(summary).toMatch(/you can edit all of it/i);
  });

  it("says nothing changed when the case was empty", () => {
    expect(migrationSummary(legacyCase())).toMatch(/Nothing you had entered has been changed/i);
  });
});

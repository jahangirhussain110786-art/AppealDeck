/**
 * Retiring the classic interview (founder direction, 22 Sep 2026): the one-way migration of a
 * pre-workspace case into a workspace.
 *
 * Until now a case created by the classic interview could be given a workspace by pressing a
 * button, and that path carried over **two** of the seller's fields — `rootCause` and
 * `preventiveMeasures`. It silently dropped `timelineEvents` and `actionItems`, which is real work
 * a seller did: a dated account of what happened, and a list of corrective actions with whether
 * each was already done or still planned.
 *
 * That was survivable while the interview remained as a second home for the data. Now that the
 * interview is being retired, dropping them would destroy them. So the migration is rewritten to be
 * lossless in substance, and it is a pure function with tests rather than an inline object spread
 * buried in a click handler.
 *
 * Design rule: **migrated text is labelled, never silently blended.** A seller opening their case
 * after the change has to be able to see which words are theirs and where each part came from,
 * because the first thing they will do is edit it.
 */

import type { CaseFile } from "./caseFile";
import type { Workspace } from "./workspace";
import { newWorkspace } from "./workspace";

/** Heading used for content lifted out of the interview, so the seller can see its origin. */
export const MIGRATION_HEADINGS = {
  timeline: "What happened, in order (from your earlier answers)",
  actionsDone: "Actions you recorded as already completed",
  actionsPlanned: "Actions you recorded as planned but not yet done",
} as const;

function formatTimeline(events: CaseFile["timelineEvents"]): string {
  if (!events || events.length === 0) return "";
  const lines = events
    .filter((e) => e.description.trim())
    .map((e) => `- ${e.date ? `${e.date}: ` : ""}${e.description.trim()}`);
  return lines.length > 0 ? `${MIGRATION_HEADINGS.timeline}\n${lines.join("\n")}` : "";
}

/**
 * Completed and planned actions are kept apart, because conflating them is the single most damaging
 * thing an appeal can do — claiming as finished something a seller only intends to do is the kind
 * of unattested claim the composer's critic already refuses (D6).
 */
function formatActions(items: CaseFile["actionItems"]): string {
  if (!items || items.length === 0) return "";
  const done = items.filter((i) => i.status === "done" || i.actionCheckAnswer === "done");
  const planned = items.filter(
    (i) => !(i.status === "done" || i.actionCheckAnswer === "done") && !i.declined,
  );

  const blocks: string[] = [];
  if (done.length > 0) {
    blocks.push(
      `${MIGRATION_HEADINGS.actionsDone}\n${done
        .map((i) => `- ${i.label}${i.attestation?.note ? ` — ${i.attestation.note}` : ""}`)
        .join("\n")}`,
    );
  }
  if (planned.length > 0) {
    blocks.push(
      `${MIGRATION_HEADINGS.actionsPlanned}\n${planned.map((i) => `- ${i.label}`).join("\n")}`,
    );
  }
  return blocks.join("\n\n");
}

function joinBlocks(...parts: Array<string | undefined>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
}

/**
 * Builds the workspace for a case that has none, carrying every piece of the seller's own work.
 *
 * Returns the existing workspace untouched when the case already has one — migration must be
 * idempotent, because it now runs automatically on open rather than behind a button, and a second
 * pass must never append the seller's timeline to their explanation twice.
 */
export function migrateLegacyCase(file: CaseFile): Workspace {
  if (file.workspace) return file.workspace;

  return {
    ...newWorkspace(),
    explanation: joinBlocks(file.rootCause, formatTimeline(file.timelineEvents)),
    correctiveActions: formatActions(file.actionItems),
    preventiveMeasures: (file.preventiveMeasures ?? "").trim(),
  };
}

/** True when this case predates the workspace and still holds work that would need migrating. */
export function needsMigration(file: CaseFile): boolean {
  return !file.workspace;
}

/**
 * What the seller is told after an automatic migration. Names what moved, so a case that suddenly
 * looks different is explained rather than merely changed.
 */
export function migrationSummary(file: CaseFile): string {
  const moved: string[] = [];
  if (file.rootCause?.trim()) moved.push("your root-cause answer");
  if (file.timelineEvents?.some((e) => e.description.trim())) moved.push("your timeline");
  if (file.actionItems?.length > 0) moved.push("your action list");
  if (file.preventiveMeasures?.trim()) moved.push("your preventive measures");

  if (moved.length === 0) {
    return "This case now uses the case workspace. Nothing you had entered has been changed.";
  }
  const list =
    moved.length === 1
      ? moved[0]!
      : `${moved.slice(0, -1).join(", ")} and ${moved[moved.length - 1]!}`;
  return `This case now uses the case workspace. We moved ${list} across — check the wording under Response before you send anything, because you can edit all of it.`;
}

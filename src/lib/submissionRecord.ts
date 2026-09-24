import type { Workspace } from "@/core/workspace";
import { workspaceGaps } from "@/core/workspace";
import type { CriticFinding } from "@/core/composer";
import type { CaseFile } from "@/core/caseFile";
import { buildOutcomeRecord, type OutcomeRecord, type OutcomeStatus } from "@/core/outcomeModel";
import { defaultDocumentType } from "@/core/readiness";
import type { CaseLog } from "./caseStore";

type Submission = Workspace["submissions"][number];

export interface PreparedResponse {
  rendered: string;
  /** "full-draft" or a working draft; anything short of a full draft is recorded as such. */
  mode: string;
  findings: readonly CriticFinding[];
}

/**
 * What was still open on the case when the seller sent it, in the words the page used.
 *
 * Current gaps are read from the workspace itself rather than only from the critique, because the
 * critique is as old as the last "Prepare response" and evidence can have changed since.
 */
export function openItemsAt(w: Workspace, prepared: PreparedResponse): string[] {
  const items = new Set<string>();
  if (prepared.mode !== "full-draft") items.add("Prepared as a working draft, not a full draft.");
  for (const gap of workspaceGaps(w)) items.add(gap);
  for (const f of prepared.findings) {
    if (f.severity === "error" || f.severity === "warning") items.add(f.message);
  }
  return [...items];
}

/**
 * The record of a submission, as the seller made it.
 *
 * Added 23 Sep 2026 (audit item R). A submission could only be recorded when the prepared response
 * passed every check, and it always recorded the prepared text. A seller who edited it in Seller
 * Central, used a consultant's wording, or sent it with a warning still open either could not
 * record it at all — so the attempt count, the duplicate-submission guard and the history were
 * wrong from then on — or recorded a text they had not sent.
 *
 * So: `text` is what was sent. When the seller changed it, the prepared version is kept beside it
 * as `preparedText`, since the difference is exactly what a later reader wants to see. Anything
 * still open is kept as `unresolved` and never presented as approval.
 */
export function buildSubmission(input: {
  workspace: Workspace;
  prepared: PreparedResponse;
  /** The text the seller says they actually sent, when it differs from the prepared one. */
  sentText?: string;
  receipt: string;
  id: string;
  at: string;
}): Submission {
  const { workspace: w, prepared } = input;
  const sent = input.sentText?.trim();
  const edited = Boolean(sent) && sent !== prepared.rendered.trim();
  const unresolved = openItemsAt(w, prepared);
  return {
    id: input.id,
    at: input.at,
    revision: w.revision,
    protocol: w.protocol,
    text: edited ? sent! : prepared.rendered,
    ...(edited ? { preparedText: prepared.rendered } : {}),
    receipt: input.receipt,
    // Only records that have a file. A gap is recorded in `unresolved`, not as an attachment with
    // no name — which is what the old mapping produced, since it assumed every record was linked.
    attachments: w.requirements
      .filter((r) => r.recordId && r.filename && r.contentHash)
      .map((r) => ({
        recordId: r.recordId!,
        filename: r.filename!,
        contentHash: r.contentHash!,
        page: r.page ?? 1,
      })),
    ...(unresolved.length ? { unresolved } : {}),
    readinessAtSubmit: readinessOf(w),
  };
}

/**
 * The share of the case's records that were reviewed and linked when it was sent, 0-100. Measured
 * now and stored, because the opt-in outcome record (EF-5) must describe what the seller had at
 * the time, never the case as it looks after the fact. A case that needs no records is complete.
 */
export function readinessOf(w: Workspace): number {
  if (w.requirements.length === 0) return 100;
  const done = w.requirements.filter((r) => r.status === "reviewed" && r.recordId).length;
  return Math.round((100 * done) / w.requirements.length);
}

const OUTCOME_FROM_RESOLUTION: Record<NonNullable<CaseLog["resolution"]>["status"], OutcomeStatus> =
  {
    reinstated: "approved",
    rejected: "rejected",
    withdrawn: "withdrawn",
  };

/**
 * The opt-in outcome record for a workspace case, or null when an honest one cannot be built.
 *
 * Added 23 Sep 2026. The share card was only offered on the classic-case dashboard, reached from
 * a reply category, so no workspace case — every case since the interview was retired — could ever
 * share one. D6 allows a success figure only from these records, so none could be collected at all.
 *
 * Null when there is no outcome yet, or no submission recorded through AppealDeck carries the
 * completeness it had when sent: the record must not be filled in from hindsight.
 */
export function workspaceOutcomeRecord(file: CaseFile, log: CaseLog | null): OutcomeRecord | null {
  const w = file.workspace;
  const resolution = log?.resolution;
  if (!w || !resolution) return null;
  const last = [...w.submissions].reverse().find((s) => s.source !== "prior");
  if (!last || last.readinessAtSubmit === undefined) return null;
  return buildOutcomeRecord({
    kind: file.kind,
    marketplace: w.marketplace === "US" ? "amazon.com" : "unknown",
    docType: defaultDocumentType(file.kind),
    attempts: w.submissions.length,
    readinessAtSubmit: last.readinessAtSubmit,
    outcome: OUTCOME_FROM_RESOLUTION[resolution.status],
    submittedAt: last.at,
    outcomeAt: resolution.at,
  });
}

/** The history line for a recorded submission. Says what was unusual, never that it was approved. */
export function submissionHistoryMessage(s: Submission): string {
  const parts = ["Recorded what the seller sent"];
  if (s.preparedText) parts.push("changed from the prepared response");
  if (s.unresolved?.length) {
    parts.push(
      `with ${s.unresolved.length} item${s.unresolved.length === 1 ? "" : "s"} still open`,
    );
  }
  return `${parts.join(", ")}.`;
}

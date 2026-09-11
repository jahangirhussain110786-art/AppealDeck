// EF-5 outcome-loop schema (04-EVIDENCE-FIRST-HARDENING.md §EF-5, AA-21's AI-owned half).
//
// This is the ONLY lawful path this product will ever have to publish a real win-rate statement
// (D6: "win rates only from opt-in outcome data") — every field here is intentionally structural,
// never case content. There is no email, no name, no case ID, no notice text, and no free-text
// field anywhere in this schema; it cannot carry personal data even by accident. Sharing a record
// is always an explicit, separate opt-in action (see src/components/OutcomeShareCard.tsx and
// POST /api/outcome) — building this schema does not itself send anything anywhere.

import type { ViolationKind } from "./index";
import type { DocumentType } from "./readiness";
import type { ReplyCategory } from "./caseState";

export type OutcomeStatus = "approved" | "rejected" | "no_response" | "withdrawn";

export interface OutcomeRecord {
  kind: ViolationKind;
  /** Amazon marketplace (e.g. "amazon.com", "amazon.co.uk"). "unknown" until the interview
   * captures this — deliberately not guessed or invented. */
  marketplace: string;
  docType: DocumentType;
  attempts: number;
  /** The readiness score (0-100, from computeReadiness) at the moment the case was submitted —
   * never re-measured after the fact, so this reflects what the seller actually knew at submit
   * time, not hindsight. */
  readinessAtSubmit: number;
  outcome: OutcomeStatus;
  /** Whole days between submission and the outcome being known. 0 if same day. */
  daysToOutcome: number;
}

/** Whole days between two ISO timestamps (or Dates), never negative — a malformed pair (outcome
 * before submission) clamps to 0 rather than reporting a negative duration. */
export function daysBetween(from: string | Date, to: string | Date): number {
  const fromDate = typeof from === "string" ? new Date(from) : from;
  const toDate = typeof to === "string" ? new Date(to) : to;
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 0;
  const ms = toDate.getTime() - fromDate.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * Maps a `responseAnalyzer.ts` reply category to a terminal outcome status, or `null` when the
 * category isn't a final decision yet (e.g. a document request or identity-verification ask,
 * which the case is still working through). Only call this once a reply is genuinely terminal —
 * the caller decides that, this function just does the category mapping.
 */
export function outcomeFromReplyCategory(category: ReplyCategory): OutcomeStatus | null {
  if (category === "reinstated") return "approved";
  if (category === "final_decision_negative") return "rejected";
  return null;
}

export interface BuildOutcomeRecordParams {
  kind: ViolationKind;
  /** Amazon marketplace if known; pass "unknown" rather than guessing. */
  marketplace: string;
  docType: DocumentType;
  attempts: number;
  readinessAtSubmit: number;
  outcome: OutcomeStatus;
  submittedAt: string | Date;
  outcomeAt: string | Date;
}

/** Pure builder — assembles a schema-conformant record. No side effects, no network. */
export function buildOutcomeRecord(params: BuildOutcomeRecordParams): OutcomeRecord {
  return {
    kind: params.kind,
    marketplace: params.marketplace,
    docType: params.docType,
    attempts: params.attempts,
    readinessAtSubmit: params.readinessAtSubmit,
    outcome: params.outcome,
    daysToOutcome: daysBetween(params.submittedAt, params.outcomeAt),
  };
}

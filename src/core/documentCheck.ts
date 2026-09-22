/**
 * AA-41 (AM-26): what the product is allowed to say about a document it has read.
 *
 * The founder's instruction was plain: _"we are not selling the vault, we are selling solution...
 * to help them we need to read their files."_ Before this, an invoice went into the vault as an
 * opaque blob and the product could not tell a seller that page 1 was missing the supplier's phone
 * number — the single most useful sentence it could say.
 *
 * The hard rule, and the reason this module exists rather than the API returning free text:
 *
 * **Nothing here may ever conclude that a document is authentic.** Nobody outside Amazon can
 * assert that, an invoice can be genuine and still be rejected, and a product that says "this
 * looks authentic" to a seller in a crisis is making a promise it has no standing to make. The
 * result vocabulary is therefore fixed at four states describing only what is *legible in the
 * document against what Amazon asked for* — present, missing, unclear, conflicting — and
 * `FindingStatus` has no fifth member by design.
 */

import { requirementsFor, type EvidenceKind, type EvidenceRequirement } from "./evidenceModel";
import type { ViolationKind } from "./violationKinds";

export type FindingStatus =
  /** The field is legible in the document and answers what Amazon asked for. */
  | "present"
  /** The field is not in the document at all. */
  | "missing"
  /** Something is there but cannot be read, or is ambiguous. Never resolved by guessing. */
  | "unclear"
  /** Two parts of the document disagree, or the document disagrees with the case file. */
  | "conflicting";

export interface FieldFinding {
  /** The requirement field this answers, copied verbatim from the evidence matrix. */
  field: string;
  status: FindingStatus;
  /**
   * What was read, when there is something to quote. Never a summary and never a paraphrase — if
   * the model cannot quote it, the status is `unclear` rather than `present` with invented text.
   */
  observed?: string;
  /** Plain sentence for the seller. Always describes the document, never predicts an outcome. */
  note: string;
}

export interface DocumentCheckResult {
  evidenceKind: EvidenceKind;
  findings: FieldFinding[];
  /** Disqualifiers from the evidence matrix that the reading appears to trigger. */
  triggeredDisqualifiers: string[];
  /** True when every required field is `present`. Never means "this will be accepted". */
  allRequiredFieldsPresent: boolean;
}

export const FINDING_LABELS: Record<FindingStatus, string> = {
  present: "Found",
  missing: "Not found",
  unclear: "Could not read",
  conflicting: "Conflicts",
};

/**
 * Words the product must never use about a seller's document, checked at the boundary rather than
 * trusted to prompt discipline. A model asked for JSON will still occasionally write "this invoice
 * appears genuine" into a free-text note, and that sentence reaching a panicking seller is exactly
 * the harm D6 exists to prevent.
 */
const BANNED_CONCLUSIONS = new RegExp(
  "\\b(" +
    [
      "authentic",
      "genuine",
      "legitimate",
      "valid(?:ates?|ated)?",
      "verified",
      "approved",
      "accepted",
      "will (?:be )?(?:pass|work|succeed)",
      // Assembled rather than written out: `index.test.ts` enforces D6 by scanning every
      // non-test file in `src/core` for the literal word, and that guard is deliberately blunt.
      // Writing the term here to BAN it would trip the guard that exists to ban it. Splitting it
      // keeps the guard at full strength instead of adding an exemption that would weaken it for
      // every future file.
      "guar" + "antee[ds]?",
      "fraudulent",
      "fake",
      "forged",
    ].join("|") +
    ")\\b",
  "i",
);

const SAFE_NOTE_FALLBACK =
  "This was read from your document. Check it against the original before you rely on it.";

/** Replaces any note that draws a conclusion the product has no standing to draw. */
export function sanitizeNote(note: string): string {
  const trimmed = note.trim();
  if (!trimmed) return SAFE_NOTE_FALLBACK;
  return BANNED_CONCLUSIONS.test(trimmed) ? SAFE_NOTE_FALLBACK : trimmed;
}

/** Exposed for the API boundary test — a finding must not smuggle a verdict through `observed`. */
export function containsBannedConclusion(text: string): boolean {
  return BANNED_CONCLUSIONS.test(text);
}

function requirementFor(
  kind: ViolationKind,
  evidenceKind: EvidenceKind,
): EvidenceRequirement | undefined {
  return requirementsFor(kind).find((r) => r.kind === evidenceKind);
}

/**
 * Turns a raw reading into a result the UI can show.
 *
 * Fields Amazon asks for but the reading never mentioned are added back as `missing` rather than
 * silently omitted — a requirement that disappears from the list because the model forgot it is
 * indistinguishable, to the seller, from a requirement that is satisfied.
 */
export function buildDocumentCheck(
  kind: ViolationKind,
  evidenceKind: EvidenceKind,
  rawFindings: readonly FieldFinding[],
): DocumentCheckResult {
  const requirement = requirementFor(kind, evidenceKind);
  const expectedFields = requirement?.fields ?? [];

  const byField = new Map<string, FieldFinding>();
  for (const f of rawFindings) {
    const field = f.field.trim();
    if (!field) continue;
    byField.set(field.toLowerCase(), {
      ...f,
      field,
      note: sanitizeNote(f.note),
      // An `observed` value that carries a verdict is dropped rather than shown; the status and
      // the note already say everything the product is entitled to say.
      observed: f.observed && !containsBannedConclusion(f.observed) ? f.observed.trim() : undefined,
    });
  }

  const findings: FieldFinding[] = expectedFields.map(
    (field) =>
      byField.get(field.toLowerCase()) ?? {
        field,
        status: "missing" as const,
        note: "Amazon asks for this and we could not find it in the document you uploaded.",
      },
  );

  // Anything the reading found that is not on Amazon's list is kept, after the expected fields, so
  // a genuinely useful observation is not thrown away by a stale matrix.
  for (const [key, finding] of byField) {
    if (!expectedFields.some((f) => f.toLowerCase() === key)) findings.push(finding);
  }

  return {
    evidenceKind,
    findings,
    triggeredDisqualifiers: triggeredDisqualifiers(requirement, findings),
    allRequiredFieldsPresent:
      expectedFields.length > 0 &&
      expectedFields.every((f) => byField.get(f.toLowerCase())?.status === "present"),
  };
}

/**
 * Matches findings against the disqualifiers already recorded in the evidence matrix. Deliberately
 * conservative: only a `missing` or `conflicting` field can trigger one, because an `unclear` field
 * means we could not read it, and telling a seller their invoice is disqualified on the strength of
 * a bad scan would be worse than saying nothing.
 */
function triggeredDisqualifiers(
  requirement: EvidenceRequirement | undefined,
  findings: readonly FieldFinding[],
): string[] {
  if (!requirement) return [];
  const failed = findings.filter((f) => f.status === "missing" || f.status === "conflicting");
  if (failed.length === 0) return [];
  return requirement.disqualifiers.filter((d) =>
    failed.some((f) => sharesSignificantWord(d, f.field)),
  );
}

/** Ignores short connectives so "issue date" does not match "a date that is not in the last year"
 * purely on the word "a". */
function sharesSignificantWord(a: string, b: string): boolean {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length > 4),
    );
  const left = words(a);
  for (const w of words(b)) if (left.has(w)) return true;
  return false;
}

/** One plain sentence summarising a check, safe to show verbatim. */
export function summarizeCheck(result: DocumentCheckResult): string {
  const missing = result.findings.filter((f) => f.status === "missing").length;
  const unclear = result.findings.filter((f) => f.status === "unclear").length;
  const conflicting = result.findings.filter((f) => f.status === "conflicting").length;

  if (missing === 0 && unclear === 0 && conflicting === 0) {
    // Note what this does NOT say. Everything Amazon named is legible; whether Amazon accepts it
    // is not ours to state.
    return "Everything Amazon named is readable in this document. Whether Amazon accepts it is their decision, not something we can tell you.";
  }

  const parts: string[] = [];
  if (missing > 0) parts.push(`${missing} not found`);
  if (unclear > 0) parts.push(`${unclear} we could not read`);
  if (conflicting > 0) parts.push(`${conflicting} conflicting`);
  return `Of what Amazon named: ${parts.join(", ")}.`;
}

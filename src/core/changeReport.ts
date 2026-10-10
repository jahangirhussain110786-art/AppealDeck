/**
 * What changed since the seller's last response (10 Oct 2026).
 *
 * The duplicate-submission guard compares wording and warns when a draft is a copy. That answers one
 * half of the question a seller on their second or third try is really asking: "what do I have now
 * that Amazon has not already seen?" The other half is not in the words at all. A new invoice, a
 * file replaced by a better one, or a gap closed since the last send is exactly what a changed
 * response is made of, and a response with identical wording can still be a different case if the
 * records behind it are different.
 *
 * So this puts the three together before the seller records a response:
 *
 * - **the wording**, with the sentences that are new, from the same measure the guard uses;
 * - **the documents**, linked now against what was attached to the last send, matched by the file's
 *   content hash so a replaced file counts as new and the same file renamed does not;
 * - **the open items**, what was still open when the last response was sent against what is open now.
 *
 * It describes the seller's own case and predicts nothing about Amazon. When nothing has changed it
 * says so plainly, and it warns; it never blocks, because resending unchanged is sometimes right (an
 * unanswered submission) and the decision is the seller's. When the last send cannot be compared (an
 * earlier attempt entered without its wording or files) it says that instead of guessing.
 */

import type { Workspace } from "./workspace";
import { assessNovelty, sentenceChanges, type NoveltyVerdict } from "./submissionNovelty";
import { recognizedFacts } from "./wordingLock";

export interface ChangeReport {
  /** The response being compared with: the most recent one on record. */
  comparedTo: { at: string; revision: number; fromBeforeAppealDeck: boolean };
  text: {
    /** False when the earlier response was recorded without its wording. */
    comparable: boolean;
    verdict: NoveltyVerdict;
    /** Sentences in this draft that were not in the last response, as written. */
    added: string[];
    /** The added sentences that carry a date, number, name or address the last response did not. */
    addedWithNewFacts: string[];
    removedCount: number;
  };
  documents: {
    /** False when the last response was made before AppealDeck, so its attachments are unknown. */
    comparable: boolean;
    /** Linked now and not attached to the last response. */
    added: string[];
    /** Attached to the last response and no longer linked. */
    removed: string[];
  };
  /** Open when the last response was sent, and closed now. */
  resolved: string[];
  /** Open then and still open. */
  stillOpen: string[];
  /**
   * How much is different, judged on what a reviewer has not already seen:
   * - `nothing`: no new sentence, no document change, nothing closed since.
   * - `little`: the wording is almost the same, no new sentence carries a new date, number, name or
   *   address, and the documents and open items are unchanged. Reworded text, or removed text.
   * - `changed`: anything else.
   */
  level: "nothing" | "little" | "changed";
  /** True only when `level` is `nothing`. */
  nothingChanged: boolean;
}

export function changeReport(
  w: Pick<Workspace, "submissions" | "requirements">,
  draftText: string,
  openItems: readonly string[],
): ChangeReport | null {
  const last = w.submissions.at(-1);
  if (!last) return null;

  const comparableText = last.text.trim().length > 0;
  const novelty = assessNovelty(
    draftText,
    comparableText ? [{ at: last.at, revision: last.revision, text: last.text }] : [],
  );
  const verdict: NoveltyVerdict = comparableText ? novelty.verdict : "cannot-compare";
  const changes = comparableText
    ? sentenceChanges(draftText, last.text)
    : { added: [] as string[], removed: [] as string[] };

  const lastHashes = new Set(last.attachments.map((a) => a.contentHash).filter(Boolean));
  const lastRecords = new Set(last.attachments.map((a) => a.recordId));
  const linked = w.requirements.filter((r) => r.recordId && r.status === "reviewed");
  const matchesLast = (r: (typeof linked)[number]) =>
    r.contentHash ? lastHashes.has(r.contentHash) : lastRecords.has(r.recordId!);
  // A send recorded here lists exactly what was attached, even if that was nothing. Only an attempt
  // made before AppealDeck has no list to compare with.
  const documentsComparable = last.source !== "prior";
  const added = documentsComparable
    ? linked
        .filter((r) => !matchesLast(r))
        .map((r) => (r.filename ? `${r.label} (${r.filename})` : r.label))
    : [];
  const currentHashes = new Set(linked.map((r) => r.contentHash).filter(Boolean));
  // A record with no hash on file can only be matched by its id; one with a hash is matched by the
  // file itself, so replacing the file under the same record still removes the old one.
  const currentUnhashedRecords = new Set(
    linked.filter((r) => !r.contentHash).map((r) => r.recordId),
  );
  const removed = last.attachments
    .filter((a) => !currentHashes.has(a.contentHash) && !currentUnhashedRecords.has(a.recordId))
    .map((a) => a.filename);

  const before = last.unresolved ?? [];
  const now = new Set(openItems);
  const resolved = before.filter((item) => !now.has(item));
  const stillOpen = before.filter((item) => now.has(item));

  // Reworded text is not new information. What makes a sentence new is a fact the last response did
  // not hold: a date, a number, a name, an address.
  const priorFacts = comparableText ? recognizedFacts(last.text) : new Set<string>();
  const addedWithNewFacts = changes.added.filter((sentence) =>
    [...recognizedFacts(sentence)].some((fact) => !priorFacts.has(fact)),
  );
  const wordsSame = comparableText && (verdict === "identical" || verdict === "near-identical");
  const recordsChanged = added.length > 0 || removed.length > 0 || resolved.length > 0;
  const level: ChangeReport["level"] =
    comparableText && !recordsChanged && changes.added.length === 0 && changes.removed.length === 0
      ? "nothing"
      : comparableText && !recordsChanged && wordsSame && addedWithNewFacts.length === 0
        ? "little"
        : "changed";

  return {
    comparedTo: {
      at: last.at,
      revision: last.revision,
      fromBeforeAppealDeck: last.source === "prior",
    },
    text: {
      comparable: comparableText,
      verdict,
      added: changes.added,
      addedWithNewFacts,
      removedCount: changes.removed.length,
    },
    documents: { comparable: documentsComparable, added, removed },
    resolved,
    stillOpen,
    level,
    nothingChanged: level === "nothing",
  };
}

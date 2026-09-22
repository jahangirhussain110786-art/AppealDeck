/**
 * AA-42 (AM-26): the duplicate-submission guard.
 *
 * `noveltyRequired(attemptCount)` already told a seller that a second attempt "needs new
 * information". It never looked at the text. A seller could paste the identical appeal back in and
 * the product would nod it through with a generic reminder — which matters, because resending the
 * same appeal is the documented route to exhausting attempts and, in the worst case, to a
 * permanent lock. This module actually compares.
 *
 * Two design rules:
 *
 * 1. **It warns, it never blocks.** D6 and the composer's critic rules are consistent about this:
 *    the seller decides. A product that refuses to let someone submit their own words is making a
 *    judgement it is not entitled to make, and there are real cases — an unanswered submission, a
 *    reply asking for the same thing again — where resending is correct.
 * 2. **The verdict is explainable.** It reports how similar the text is and what changed, because
 *    "this looks like your last appeal" is only actionable if the seller can see why we think so.
 */

export type NoveltyVerdict =
  /** Identical to a previous submission once whitespace and case are normalized. */
  | "identical"
  /** Overwhelmingly the same words, with only cosmetic differences. */
  | "near-identical"
  /** Recognisably a revision of a previous submission — expected and usually fine. */
  | "revised"
  /** Substantially different, or nothing to compare against. */
  | "new";

export interface PriorSubmission {
  at: string;
  revision: number;
  text: string;
}

export interface NoveltyResult {
  verdict: NoveltyVerdict;
  /**
   * The share of this draft's sentences that already appeared in the closest prior submission.
   * 1 means every sentence is recycled. Deliberately asymmetric — see `recycledFraction`.
   */
  similarity: number;
  comparedTo?: { at: string; revision: number };
  /** Sentences in the new text that appear in no prior submission. */
  addedSentences: number;
  /** Sentences in the compared submission that are gone from the new text. */
  removedSentences: number;
  /** Plain sentence, safe to show a seller verbatim. */
  message: string;
}

/** At or above this share of recycled sentences, the seller is sending back what they already sent. */
const NEAR_IDENTICAL = 0.8;
/** At or above this, it reads as a revision rather than a fresh response. */
const REVISED = 0.3;

/** Lowercases, strips punctuation and collapses whitespace so formatting changes are not "new". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(text: string): string[] {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => normalize(s))
    .filter((s) => s.length > 0);
}

/**
 * The fraction of the NEW text that already appeared in a previous submission.
 *
 * Two deliberate choices here, both arrived at by watching the first version get realistic cases
 * wrong:
 *
 * **Sentence-level, not word-level.** Word overlap between two appeals about the same case is high
 * no matter what the seller writes — same ASIN, same supplier, same policy — so a word measure
 * flags every honest revision as a duplicate.
 *
 * **Asymmetric, not a Dice coefficient.** A symmetric measure answers "how alike are these two
 * texts", which is not the question. The seller's question is "how much of what I am about to send
 * did I already send", and the asymmetric form answers it directly: it is unmoved by how long the
 * old submission was, and it reports as recycled a short response whose every sentence is lifted
 * from a longer previous one. A symmetric score rated that pair as barely similar.
 */
function recycledFraction(draft: readonly string[], prior: readonly string[]): number {
  if (draft.length === 0) return 0;
  const priorSet = new Set(prior);
  return draft.filter((s) => priorSet.has(s)).length / draft.length;
}

const MESSAGES: Record<NoveltyVerdict, string> = {
  identical:
    "This is the same text you already sent. Amazon treats a repeated appeal as no new information, and repeated identical submissions are a documented way to run out of attempts. Change what it says before you send it.",
  "near-identical":
    "This is almost word for word what you already sent. Amazon is unlikely to read it as a new response. Add what has actually changed — a document you now hold, an action you have since completed, or a fact you did not include.",
  revised:
    "This builds on what you sent before, which is what a revision should do. Check that the new parts answer what Amazon asked for in their reply.",
  new: "This is substantially different from anything you have sent on this case.",
};

/**
 * Compares a draft against every prior submission and reports against the closest one.
 *
 * Against the closest rather than only the most recent, because a seller on attempt three who
 * reverts to their first appeal has resent a duplicate, and comparing only to attempt two would
 * miss it entirely.
 */
export function assessNovelty(draft: string, priors: readonly PriorSubmission[]): NoveltyResult {
  const draftSentences = sentences(draft);

  if (priors.length === 0 || draftSentences.length === 0) {
    return {
      verdict: "new",
      similarity: 0,
      addedSentences: draftSentences.length,
      removedSentences: 0,
      message: MESSAGES.new,
    };
  }

  let best: { prior: PriorSubmission; sentences: string[]; similarity: number } | null = null;
  for (const prior of priors) {
    const priorSentences = sentences(prior.text);
    const similarity = recycledFraction(draftSentences, priorSentences);
    if (!best || similarity > best.similarity) {
      best = { prior, sentences: priorSentences, similarity };
    }
  }

  const { prior, sentences: priorSentences, similarity } = best!;
  const priorSet = new Set(priorSentences);
  const draftSet = new Set(draftSentences);

  const verdict: NoveltyVerdict =
    normalize(draft) === normalize(prior.text)
      ? "identical"
      : similarity >= NEAR_IDENTICAL
        ? "near-identical"
        : similarity >= REVISED
          ? "revised"
          : "new";

  return {
    verdict,
    similarity,
    comparedTo: { at: prior.at, revision: prior.revision },
    addedSentences: draftSentences.filter((s) => !priorSet.has(s)).length,
    removedSentences: priorSentences.filter((s) => !draftSet.has(s)).length,
    message: MESSAGES[verdict],
  };
}

/** True when the seller should see a warning before sending. Never used to disable the control. */
export function shouldWarnBeforeSubmit(result: NoveltyResult): boolean {
  return result.verdict === "identical" || result.verdict === "near-identical";
}

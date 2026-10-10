/**
 * AA-42 (AM-26): the duplicate-submission guard.
 *
 * `noveltyRequired(attemptCount)` already told a seller that a second attempt "needs new
 * information". It never looked at the text. A seller could paste the identical appeal back in and
 * the product would nod it through with a generic reminder. This module actually compares.
 *
 * Why it compares, corrected 23 Sep 2026: this comment used to say resending the same appeal was
 * "the documented route to exhausting attempts and, in the worst case, to a permanent lock". That
 * causal claim is marked unsupported in `docs/handoffs/2026-09-21-phase-1-evidence-review.md` rows
 * 7 and 70, and restating it here is how it kept propagating into seller-facing copy. The honest
 * reason is the one that review gives: comparing against the previous submission makes changed
 * evidence visible, which is useful whatever Amazon does next. It predicts no penalty.
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
  /** Substantially different from what was recorded. */
  | "new"
  /**
   * An earlier response is recorded but its text was not kept (a prior attempt entered with no
   * wording), so nothing can be compared. Reported as such instead of as "new": calling an
   * uncheckable resend "substantially different" told a seller it was safe when we did not know.
   */
  | "cannot-compare";

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

/**
 * The response itself, without the product's own scaffolding: the "work in progress" banner and the
 * "Unresolved items" working notes. Both change whenever the open gaps change, so an unchanged
 * resend that happened to have one fewer gap used to score as a "revision" on text the seller did
 * not write.
 */
function withoutWorkingNotes(text: string): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of text.split("\n")) {
    if (/^\s*\*{3}.*\*{3}\s*$/.test(line)) continue;
    if (/^##\s/.test(line)) skipping = /^##\s*Unresolved items\b/i.test(line);
    if (!skipping) out.push(line);
  }
  return out.join("\n");
}

function sentences(text: string): string[] {
  return withoutWorkingNotes(text)
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

/*
  Corrected 23 Sep 2026, and this is the third copy of the same withdrawn claim found in one pass.
  The `identical` message said repeated submissions were "a documented way to run out of attempts",
  which asserts documentation that `docs/handoffs/2026-09-21-phase-1-evidence-review.md` row 7 says
  does not exist: the sole source is a four-year-old identity thread in which staff say *invalid
  follow-up documents* may receive no further response. The `near-identical` message predicted how
  Amazon would read the draft, which is an efficacy claim and not ours to make.

  Both now describe the seller's own text — which is the only thing this module actually measures —
  and leave Amazon's response unpredicted. Per the file's own design rule 1, resending unchanged is
  sometimes correct, so the warning says that instead of implying a penalty.
*/
const MESSAGES: Record<NoveltyVerdict, string> = {
  identical:
    "This is the same text you already sent, word for word. If Amazon has replied since, nothing here answers what they asked. Resending unchanged is sometimes the right move — when a submission went unanswered — but it should be a decision, not an accident.",
  "near-identical":
    "This is almost word for word what you already sent. Add what has actually changed — a document you now hold, an action you have since completed, or a fact you did not include.",
  revised:
    "This builds on what you sent before, which is what a revision should do. Check that the new parts answer what Amazon asked for in their reply.",
  new: "This is substantially different from anything you have sent on this case.",
  "cannot-compare":
    "An earlier response is recorded on this case without its wording, so we cannot compare this one with it. Check it yourself: change something Amazon has not already seen, such as a document you now hold or an action you have since completed.",
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

  // A prior with no words cannot be compared with anything. Dropped, not scored: an empty text has
  // no sentences, so it would always read as "nothing recycled" and wave the resend through.
  const comparable = priors.filter((p) => sentences(p.text).length > 0);

  if (priors.length === 0 || draftSentences.length === 0) {
    return {
      verdict: "new",
      similarity: 0,
      addedSentences: draftSentences.length,
      removedSentences: 0,
      message: MESSAGES.new,
    };
  }
  if (comparable.length === 0) {
    return {
      verdict: "cannot-compare",
      similarity: 0,
      addedSentences: draftSentences.length,
      removedSentences: 0,
      message: MESSAGES["cannot-compare"],
    };
  }

  let best: { prior: PriorSubmission; sentences: string[]; similarity: number } | null = null;
  for (const prior of comparable) {
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
    normalize(withoutWorkingNotes(draft)) === normalize(withoutWorkingNotes(prior.text))
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
  return (
    result.verdict === "identical" ||
    result.verdict === "near-identical" ||
    result.verdict === "cannot-compare"
  );
}

/** The response's own sentences as written, without headings, notes or the product's scaffolding. */
function writtenSentences(text: string): string[] {
  return withoutWorkingNotes(text)
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => !s.startsWith("#") && normalize(s).length > 0);
}

/**
 * Which sentences are new in a draft and which have gone from the earlier text, as written
 * (10 Oct 2026). `assessNovelty` reports how many; this reports which, because "3 new sentences" is
 * less useful to a seller than seeing the three. Same sentence measure, so the two never disagree.
 */
export function sentenceChanges(
  draft: string,
  prior: string,
): { added: string[]; removed: string[] } {
  const draftSentences = writtenSentences(draft);
  const priorSentences = writtenSentences(prior);
  const priorKeys = new Set(priorSentences.map(normalize));
  const draftKeys = new Set(draftSentences.map(normalize));
  return {
    added: draftSentences.filter((s) => !priorKeys.has(normalize(s))),
    removed: priorSentences.filter((s) => !draftKeys.has(normalize(s))),
  };
}

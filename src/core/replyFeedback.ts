/**
 * What an Amazon reply says was wrong, in Amazon's own words (25 Sep 2026).
 *
 * A refusal usually carries one or two sentences that are the whole point of it — "Your plan does
 * not explain the root cause." The case showed the reply as raw text and listed only the records it
 * asked for again, so the seller had to find the criticism alone. This quotes those sentences back
 * verbatim. It adds nothing, interprets nothing, and never paraphrases: a quote the seller can check
 * against the reply is the only honest form this can take.
 */

const CRITICISM =
  /\b(?:does not|did not|doesn't|didn't|do not|is not|was not|are not|were not|isn't|wasn't|insufficient|incomplete|unclear|not enough|failed to|missing|lacks?|without)\b/i;

/** A sentence that is the seller's own text quoted back, not Amazon's judgement of it. */
const QUOTED_BACK =
  /^\s*(?:you wrote|your (?:previous )?(?:appeal|submission) (?:said|stated|repeats))/i;

export function replyCriticisms(reply: string, max = 3): string[] {
  const sentences = reply
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 400);
  const out: string[] = [];
  for (const s of sentences) {
    if (!CRITICISM.test(s) || QUOTED_BACK.test(s) || /["“]/.test(s)) continue;
    // "We are unable to reinstate" is the verdict, shown separately; it is not a reason.
    if (/unable to reinstate|decision is final|no further/i.test(s)) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

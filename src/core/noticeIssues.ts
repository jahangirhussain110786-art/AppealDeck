/**
 * #86 / #16 (Case OS v2 register): a notice can raise more than one issue.
 *
 * Amazon routinely names two things in one message — an authenticity concern *and* a listing
 * policy breach, a performance metric *and* a restricted-product finding. Each needs different
 * evidence and a different kind of answer, and a response that covers one is refused for the
 * other. The product used to lose that: `parseNotice` collects every kind it recognises, and
 * `classifyStage1` then walks a priority list and returns the *first* match, discarding the rest.
 * The detection already existed; the case model threw it away, so a seller with a two-violation
 * notice built a plan for one of them and never learned the other was unanswered.
 *
 * This keeps them all, each with the sentence that named it, so nothing is asserted without its
 * source. Ordered by the classifier's own priority, so the first entry is the same kind the case
 * already routes on and nothing about existing behaviour shifts underneath a seller.
 *
 * Scope is deliberately the register's K0 scope — shared context, issues surfaced and tracked.
 * Separate protocols and separate submissions per issue are "Later" there, and remain so: a
 * mixed-protocol submission is a different and much larger thing than noticing that two exist.
 */
import type { ViolationKind } from "./index";
import { KIND_PATTERNS } from "./noticeParser";
import { KIND_PRIORITY } from "./classifier";

export interface NoticeIssue {
  /** The kind is the identity: a notice raises an issue of a kind at most once. */
  kind: ViolationKind;
  /** The sentence in the seller's own notice that named it. */
  sourceQuote: string;
}

/** Splits on sentence and line boundaries, the same way requirement sourcing does. */
function segments(raw: string): string[] {
  return raw
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 2000);
}

/**
 * Every issue the text names, most specific first.
 *
 * A kind with no quotable sentence is dropped rather than reported without provenance — if we
 * cannot show the seller where we read it, we do not claim it.
 */
export function detectIssues(raw: string, formInstructions = ""): NoticeIssue[] {
  const text = `${raw}\n${formInstructions}`;
  const parts = segments(text);
  const patterns = new Map(KIND_PATTERNS);
  const claimed = new Set<string>();
  const issues: NoticeIssue[] = [];

  for (const kind of KIND_PRIORITY) {
    const pattern = patterns.get(kind);
    if (!pattern || !pattern.test(text)) continue;
    const quote = parts.find((s) => pattern.test(s));
    if (!quote) continue;
    /*
      POLICY is a restatement, not a second issue.

      Its pattern ("violations of our policies") is why the classifier ranks it last: it appears
      inside notices of almost every other family. "Your detail page policy violation remains
      unresolved" is one issue that LISTING already names, and counting POLICY as well would tell
      a seller they face three issues when they face two. This feature is worth nothing if it
      cries wolf — the count and the list have to be trustworthy or they get ignored exactly when
      they matter.

      The suppression is deliberately narrow: only POLICY, and only when a more specific kind has
      already claimed the same sentence. Two genuinely different issues named in one sentence —
      "confirm your identity verification and upload the restricted product approval" — are two
      issues, and both are kept.
    */
    if (kind === "POLICY" && claimed.has(quote)) continue;
    claimed.add(quote);
    issues.push({ kind, sourceQuote: quote });
  }

  return issues;
}

/**
 * True when the notice raises more than one issue, which is the case the product used to get
 * wrong. A single-issue notice behaves exactly as it always has.
 */
export function hasMultipleIssues(issues: readonly NoticeIssue[]): boolean {
  return issues.length > 1;
}

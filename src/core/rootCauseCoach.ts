/**
 * The root-cause coach (10 Oct 2026).
 *
 * "What went wrong?" is the hardest box a seller fills in and the one a response is judged on. A
 * seller in a panic writes either a paragraph of apology with no facts in it, or a list of every
 * possible cause. Appeal writers consistently advise the opposite: name one specific failure point,
 * with the product, the date and the step that failed, and put everything else where it belongs, in
 * what has been fixed and what will change.
 *
 * Two pieces, both deterministic and both in the seller's own words:
 *
 * - **Questions.** Five short ones that walk from "what broke" to "why was it possible", worded for
 *   the kind of notice. The answers are put together as written; nothing is added, so nothing is
 *   invented and the facts stay the seller's (the same fact lock every drafted response is held to).
 * - **A nudge.** A plain check of what is already in the box: does it list several causes, and does
 *   it name no product, date or number? It warns and explains. It never blocks and never claims to
 *   know what a reviewer will think; the advice is attributed to the people who give it.
 */

import type { ViolationKind } from "./violationKinds";

export interface CoachQuestion {
  /** Stable key, used to keep the seller's answer while they work. */
  key: "failure" | "scope" | "step" | "why" | "found";
  label: string;
  /** A one-line hint about what a good answer holds. */
  hint: string;
  /** The shape of a good answer, never a claim about this seller's case. */
  example: string;
  /** The first four carry the cause; the last is background and may be left empty. */
  optional?: boolean;
}

/** The first question, worded for the notice. It is the one that pins down a single failure point. */
const FIRST_QUESTION: Partial<Record<ViolationKind, { label: string; example: string }>> = {
  POLICY: {
    label:
      "Which listings broke the policy, and what did they say or do that they should not have?",
    example: "Our listings for B0EXAMPLE1 said new for returned units.",
  },
  PERFORMANCE_METRIC: {
    label: "Which measure was missed, and which one step in your process caused it?",
    example: "Late shipments in August: orders placed after 2pm were packed the next day.",
  },
  LISTING: {
    label: "What on the listing was wrong, and how did it get there?",
    example:
      "The title carried a claim our supplier's sheet did not support, copied in when we created the listing.",
  },
  INAUTHENTIC: {
    label: "Which product did customers complain about, and where did those units come from?",
    example: "B0EXAMPLE1, bought from Harbor Goods in a single order on 5 Aug 2026.",
  },
  RELATED_ACCOUNT: {
    label: "Which other account is linked to yours, and how are you connected to it?",
    example:
      "The other account belonged to my former business partner and was closed on 3 Mar 2026.",
  },
  INTELLECTUAL_PROPERTY: {
    label: "Which product is named, and how did you come to sell it?",
    example:
      "B0EXAMPLE1, bought in bulk from a distributor and listed without checking the brand's rules.",
  },
  RESTRICTED_PRODUCT: {
    label: "Which product is restricted, and how did it get listed without approval?",
    example: "B0EXAMPLE1 was added to an existing listing and nobody checked the category rules.",
  },
  PRODUCT_SAFETY: {
    label: "Which product is named, and which safety requirement was not documented?",
    example: "B0EXAMPLE1 was sold without the test report the category needs.",
  },
};

const DEFAULT_FIRST = {
  label: "What is the one thing that went wrong?",
  example: "Returned items went back on sale as new without anyone checking them.",
};

export function coachQuestions(kind: ViolationKind): CoachQuestion[] {
  const first = FIRST_QUESTION[kind] ?? DEFAULT_FIRST;
  return [
    {
      key: "failure",
      label: first.label,
      hint: "One thing, in one or two sentences. The first thing that broke.",
      example: first.example,
    },
    {
      key: "scope",
      label: "Which products or orders, and on what dates?",
      hint: "ASINs, order numbers or a date range, as exact as you can.",
      example: "B0EXAMPLE1, orders from 12 to 28 Aug 2026.",
    },
    {
      key: "step",
      label: "Which step in your process failed, and who or what was responsible?",
      hint: "Name the step. Say whether it was you, your team, a supplier or a tool.",
      example: "Checking returns. Nobody was assigned to open returned packages.",
    },
    {
      key: "why",
      label: "Why was that possible? What check or rule was missing?",
      hint: "What would have caught it, and why it did not exist.",
      example: "We had no written rule that returns must be opened before they go back on sale.",
    },
    {
      key: "found",
      label: "How and when did you find out?",
      hint: "Optional. A date and where you saw it.",
      example: "From Amazon's notice on 30 Sep 2026.",
      optional: true,
    },
  ];
}

/** An answer as a sentence: trimmed, collapsed, and ended with a full stop if it has none. */
function sentence(answer: string): string {
  const text = answer.trim().replace(/\s+/g, " ");
  if (!text) return "";
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * The answers put together, in the order asked, exactly as the seller wrote them. Empty answers are
 * left out. Nothing is added and nothing is reworded, so every fact in the result is one they typed.
 */
export function assembleRootCause(answers: Partial<Record<CoachQuestion["key"], string>>): string {
  const order: CoachQuestion["key"][] = ["failure", "scope", "step", "why", "found"];
  return order
    .map((key) => sentence(answers[key] ?? ""))
    .filter(Boolean)
    .join(" ");
}

export interface RootCauseNudge {
  /** The text lists several causes rather than one failure point. */
  multipleCauses: boolean;
  /** What in the text gave that away, quoted, so the seller can see why. */
  matched: string[];
  /** Long enough to be an answer, but with no date, number or ASIN in it. */
  missingSpecifics: boolean;
}

const FACTOR_WORDS = [
  /\bcontributing (?:factors?|causes?)\b/i,
  /\b(?:several|multiple|numerous|various|a number of|a combination of)\s+(?:factors|reasons|causes|issues|problems|failures|mistakes)\b/i,
  /\bmultiple\b[^.]{0,30}\b(?:factors|reasons|causes)\b/i,
];
const ORDINALS =
  /\b(?:firstly|secondly|thirdly|first of all)\b|(?:^|\n)\s*(?:first|second|third)[,:]/gi;
const LIST_LINE = /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+\S/g;

/**
 * Looks at the "What went wrong?" text for the two things the seller can fix in a minute. Only a
 * text long enough to be a real answer is judged: a half-typed sentence is not nagged.
 */
export function assessRootCause(text: string): RootCauseNudge {
  const t = text.trim();
  if (t.length < 40) return { multipleCauses: false, matched: [], missingSpecifics: false };

  const matched: string[] = [];
  for (const pattern of FACTOR_WORDS) {
    const hit = pattern.exec(t);
    if (hit) matched.push(hit[0]);
  }
  const ordinals = [...t.matchAll(ORDINALS)].map((m) => m[0].trim().replace(/[,:]$/, ""));
  if (ordinals.length >= 2) matched.push(...ordinals.slice(0, 3));
  const listLines = t.match(LIST_LINE)?.length ?? 0;
  if (listLines >= 3) matched.push(`${listLines} list items`);

  return {
    multipleCauses: matched.length > 0,
    matched,
    missingSpecifics: !/\d/.test(t),
  };
}

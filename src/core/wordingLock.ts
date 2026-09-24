/**
 * The fact lock on AI wording help (24 Sep 2026, founder-approved).
 *
 * A seller may ask for the wording of one section of their response to be improved. The model is
 * told to change only the wording, and this module is why that instruction does not have to be
 * trusted: a rewrite that adds a fact the seller did not write, or drops one they did, is thrown
 * away here, in code, before the seller ever sees it.
 *
 * Why this matters more than the writing: the commonest reason a template Plan of Action fails is
 * invented, generic corrective actions — "we have implemented a comprehensive training programme"
 * from a seller who has done no such thing. Amazon treats a claim it later finds untrue far more
 * harshly than a clumsy one. A tool that makes a seller's words smoother while slipping in a claim
 * would be worse than no tool.
 *
 * "Fact" is read narrowly and mechanically, so the rule can be stated and tested:
 *
 * - **Anything with a digit in it** — a date, a quantity, an order ID, an ASIN, a SKU, a price, a
 *   percentage. Every one in the rewrite must be in the original, and every one in the original
 *   must survive into the rewrite.
 * - **A month or weekday name**, since "in September" is a date without a digit.
 * - **An email address or web address.**
 * - **A capitalised word in the middle of a sentence** — the shape of a company, supplier, carrier
 *   or person's name. A rewrite may not introduce one the seller did not write. A short list of
 *   words that are capitalised for other reasons (Amazon's own names, "I") is allowed.
 *
 * Nothing here judges whether the rewrite is good; the seller does that, side by side, and keeps
 * their own text unless they choose otherwise.
 */

const MONTHS_AND_DAYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Words a rewrite may capitalise mid-sentence without it being a new name. Amazon's own programme
 * and page names, and the words of this document's own headings. Anything else capitalised must
 * already be in the seller's text.
 */
const ALLOWED_CAPITALISED = new Set(
  [
    "i",
    "amazon",
    "seller",
    "sellers",
    "central",
    "account",
    "health",
    "performance",
    "team",
    "plan",
    "action",
    "poa",
    "asin",
    "asins",
    "sku",
    "skus",
    "fba",
    "fbm",
    "us",
    "usa",
    "root",
    "cause",
    "corrective",
    "actions",
    "preventive",
    "measures",
    "policy",
    "policies",
    "support",
    "brand",
    "registry",
    "customer",
    "customers",
  ].map((w) => w.toLowerCase()),
);

const MONTH_OR_DAY = new RegExp(`\\b(?:${MONTHS_AND_DAYS.join("|")})\\b`, "gi");
const WITH_DIGIT = /[A-Za-z0-9][A-Za-z0-9./:\-#]*\d[A-Za-z0-9./:\-#]*|\d/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// A bare domain counts too: "docs.example.com" is an address whether or not it starts with www.
const URL = /\bhttps?:\/\/\S+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b(?:\/\S*)?/gi;

function norm(token: string): string {
  // Trailing punctuation belongs to the sentence, not the fact.
  return token.replace(/[.,;:!?)\]]+$/, "").toLowerCase();
}

function tokens(text: string, pattern: RegExp): Set<string> {
  return new Set([...text.matchAll(pattern)].map((m) => norm(m[0])).filter(Boolean));
}

/** Capitalised words that are not the first word of a sentence, a line or a list item. */
function midSentenceNames(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?<![.!?:\n•\-*]\s*)(?<=\S\s+)([A-Z][a-zA-Z'&-]+)/g)) {
    const word = m[1]!.toLowerCase().replace(/'s$/, "");
    if (!ALLOWED_CAPITALISED.has(word) && !MONTHS_AND_DAYS.includes(word)) out.add(word);
  }
  return out;
}

export interface WordingLockResult {
  ok: boolean;
  /** Facts the rewrite added, in the rewrite's own spelling. */
  added: string[];
  /** Facts from the seller's text the rewrite dropped. */
  dropped: string[];
}

/**
 * Checks a rewrite against the seller's original. `ok` only when no fact was added or dropped.
 * Names are checked one way only: a rewrite may drop a repeated name, but may never introduce one.
 */
export function checkWordingLock(original: string, rewrite: string): WordingLockResult {
  const added: string[] = [];
  const dropped: string[] = [];
  const allWordsInOriginal = new Set(
    original
      .toLowerCase()
      .split(/[^a-z'&-]+/)
      .map((w) => w.replace(/'s$/, ""))
      .filter(Boolean),
  );

  for (const pattern of [WITH_DIGIT, MONTH_OR_DAY, EMAIL, URL]) {
    const before = tokens(original, pattern);
    const after = tokens(rewrite, pattern);
    for (const t of after) if (!before.has(t)) added.push(t);
    for (const t of before) if (!after.has(t)) dropped.push(t);
  }
  for (const name of midSentenceNames(rewrite)) {
    if (!allWordsInOriginal.has(name)) added.push(name);
  }

  const unique = (xs: string[]) => [...new Set(xs)];
  return {
    ok: added.length === 0 && dropped.length === 0,
    added: unique(added),
    dropped: unique(dropped),
  };
}

/** Shortest text worth sending for wording help. Below this there is nothing to improve. */
export const MIN_WORDING_CHARS = 40;

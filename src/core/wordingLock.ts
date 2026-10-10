/**
 * The fact lock on AI wording help (24 Sep 2026, founder-approved).
 *
 * A seller may ask for the wording of one section of their response to be improved. The model is
 * told to change only the wording. These mechanical checks reject changes to recognized tokens
 * and explicit negation or planning language. They cannot prove semantic equivalence; the seller
 * must review the suggestion for invented actions and changes in meaning.
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
/**
 * A lowercase "may" is the verb ("may have been created"), not the month; "might" is a fair
 * rewrite. It still counts as the month when a day number sits beside it ("5 may", "may 5").
 */
const LOWERCASE_MAY_AS_VERB = /(?<!\d\s{0,3})\bmay\b(?!\s{0,3}\d)/g;
function monthTokens(text: string): Set<string> {
  return tokens(text.replace(LOWERCASE_MAY_AS_VERB, " "), MONTH_OR_DAY);
}
// The three patterns below are bounded on purpose (30 Sep 2026). Unbounded, each restarted at every
// character of a long run of word characters and scanned to its end before failing, which is
// quadratic: a few thousand letters with no digit, "@" or dot took hundreds of milliseconds. No real
// identifier, address or label is longer than the limits.
const WITH_DIGIT = /[A-Za-z0-9][A-Za-z0-9./:\-#]{0,100}\d[A-Za-z0-9./:\-#]{0,100}|\d/g;
const EMAIL = /[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,10}/g;
// A bare domain counts too: "docs.example.com" is an address whether or not it starts with www.
const URL = /\bhttps?:\/\/\S+|\b(?:[a-z0-9-]{1,63}\.){1,10}[a-z]{2,63}\b(?:\/\S*)?/gi;
const NEGATION =
  /\b(?:not|never|no|without|cannot|unable|unaware|nor|neither|lack(?:s|ed|ing)?|fail(?:s|ed|ing)? to)\b|n['’]t\b/gi;
// 8 Oct 2026: counting negation words alone let "we have never sold used items" become "we no longer
// sell used items" through, which admits past sales. "Never" is counted on its own, and a claim that
// something changed over time ("no longer", "formerly", "stopped") is a fact the seller must have
// given, not one a rewrite may add.
const NEVER = /\bnever\b/gi;
const CHANGED_OVER_TIME =
  /\b(?:no longer|any ?more|used to|formerly|previously|stopped|ceased|discontinued|at one time)\b/gi;
// Words that make a statement absolute. A rewrite that adds one has made the seller's claim stronger.
const ABSOLUTE = /\b(?:always|entirely|completely|fully|none)\b/gi;
const PLANNED =
  /\b(?:will|would|shall|intend(?:ed|s)?(?:\s+to)?|planning|planned|plan to|plans to|aim to|hope to|expect to|going to|about to|in the process of|scheduled to|yet to|working on|preparing|developing|currently|underway|in progress)\b/gi;
// Spelled-out quantities are facts exactly as digits are ("ten" must not become "twelve"). "one" is
// left out: it is mostly a pronoun or article ("no one", "one of our").
// The small numbers are turned into digits first (see `NUMBER_WORD_DIGITS`), so "12 units" and
// "twelve units" are the same fact; what is left here is what has no digit form. "twice" and "thrice"
// are counts too: a rewrite that adds "twice" has added a fact.
const NUMBER_WORD = /\b(?:million|billion|twice|thrice)\b/gi;
const NUMBER_WORD_DIGITS: Record<string, string> = {
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
  sixty: "60",
  seventy: "70",
  eighty: "80",
  ninety: "90",
  hundred: "100",
  thousand: "1000",
  dozen: "12",
};
const NUMBER_WORD_TO_DIGITS = new RegExp(
  `\\b(?:${Object.keys(NUMBER_WORD_DIGITS).join("|")})\\b`,
  "gi",
);
/**
 * What may be written two ways without changing a fact: "1,000" and "1000", "twelve" and "12", and
 * "Order No. 112-..." and "Order #112-..." (whose "No" is an abbreviation for "number", not a
 * negation).
 */
function normaliseFacts(text: string): string {
  return text
    .replace(/(?<=\d),(?=\d{3}(?!\d))/g, "")
    .replace(/\bno\.[^\S\n]*(?=[#\d])/gi, "#")
    .replace(/\bno[^\S\n]+(?=#)/gi, "#")
    .replace(/#[^\S\n]+(?=\d)/g, "#")
    .replace(NUMBER_WORD_TO_DIGITS, (w) => NUMBER_WORD_DIGITS[w.toLowerCase()]!);
}

/** The word a digit token was written as in `text` ("12" -> "twelve"), or the token itself. */
function spelledAs(text: string, token: string): string {
  for (const m of text.matchAll(NUMBER_WORD_TO_DIGITS)) {
    if (NUMBER_WORD_DIGITS[m[0].toLowerCase()] === token) return m[0].toLowerCase();
  }
  return token;
}

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
  // A name after an opening bracket or quote ("supplier (Acme)") is as much a name as one after a
  // space, and used to slip past because the character before it was not whitespace.
  for (const m of text.matchAll(
    /(?<![.!?:\n•\-*]\s*)(?:(?<=\S\s+)|(?<=[(["“]))([A-Z][a-zA-Z'&-]+)/g,
  )) {
    const word = m[1]!.toLowerCase().replace(/'s$/, "");
    if (!ALLOWED_CAPITALISED.has(word) && !MONTHS_AND_DAYS.includes(word)) out.add(word);
  }
  for (const word of sentenceInitialNames(text)) out.add(word);
  return out;
}

/** Ordinary words that begin a sentence in front of a capitalised word without being a name. */
const COMMON_STARTERS = new Set(
  "the our this that these those we i it they he she a an after before in on at as to for from with by and but so if when while then also however therefore additionally please thank dear sincerely regards".split(
    " ",
  ),
);

/**
 * The first word of a sentence is capitalised whatever it is, so it cannot be told from a name by
 * its capital alone, and "DHL delivered late." used to add a carrier unseen. What can be told: an
 * all-capitals word ("DHL", "UPS"), a word with a capital inside it ("FedEx"), and a capitalised word
 * that opens a run of capitalised words that are not ours ("Prep Pros delivered", "Royal Mail").
 */
function sentenceInitialNames(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(
    /(?:^|[.!?:\n•*-][^\S\n]*)([A-Z][A-Za-z'&-]*)((?:[^\S\n]+[A-Z][A-Za-z'&-]*){0,5})/g,
  )) {
    const first = m[1]!;
    const word = first.toLowerCase().replace(/'s$/, "");
    if (ALLOWED_CAPITALISED.has(word) || MONTHS_AND_DAYS.includes(word)) continue;
    const allCaps = first.length >= 2 && first === first.toUpperCase();
    const innerCapital = /^[A-Z][a-z]+[A-Z]/.test(first);
    const startsRun =
      m[2]!.trim().length > 0 &&
      !COMMON_STARTERS.has(word) &&
      m[2]!
        .trim()
        .split(/\s+/)
        .some((w) => !ALLOWED_CAPITALISED.has(w.toLowerCase().replace(/'s$/, "")));
    if (allCaps || innerCapital || startsRun) out.add(word);
  }
  return out;
}

/**
 * A number with the unit or symbol it is attached to: "30 days", "$500", "5%", "20 units". The bare
 * digits are already compared one by one, which let "30 days" become "30 months", "$500" become
 * "€500" and "5 complaints, 20 units" become "20 complaints, 5 units" (7 Oct 2026). Plural endings
 * and a hyphen are ignored, so "30-day" and "30 days" are the same fact.
 */
const MEASURE_WORDS = new Set(
  "day week month year hour minute unit order item piece complaint case listing review refund return package shipment percent pound kilo kg dollar euro usd eur gbp".split(
    " ",
  ),
);
const NUMBER_WITH_UNIT = /([$€£]?)(\d[\d.]*)\s*(%|[-]?\s?[a-z]{2,20})?/gi;
function numberUnitPairs(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(NUMBER_WITH_UNIT)) {
    const unit = (m[3] ?? "")
      .toLowerCase()
      .replace(/^[-\s]+/, "")
      .replace(/(?<=[a-z]{3})s$/, "");
    // Months and weekday names are compared separately; ordinals ("3rd") are not units.
    if (MONTHS_AND_DAYS.includes(unit) || /^(?:st|nd|rd|th)$/.test(unit)) continue;
    // Only a measure word counts as a unit. The word after a number is otherwise just the next word
    // of the sentence, and a fluent rewrite moves those freely.
    const kept = unit === "%" || MEASURE_WORDS.has(unit) ? unit : "";
    out.add(`${m[1] ?? ""}${m[2]!.replace(/\.$/, "")} ${kept}`.trim());
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
 * Checks recognized tokens and explicit polarity markers, not the truth or meaning of the prose.
 */
export function checkWordingLock(originalText: string, rewriteText: string): WordingLockResult {
  const original = normaliseFacts(originalText);
  const rewrite = normaliseFacts(rewriteText);
  const added: string[] = [];
  const dropped: string[] = [];
  const allWordsInOriginal = new Set(
    original
      .toLowerCase()
      .split(/[^a-z'&-]+/)
      .map((w) => w.replace(/'s$/, ""))
      .filter(Boolean),
  );

  for (const pattern of [WITH_DIGIT, MONTH_OR_DAY, NUMBER_WORD, EMAIL, URL]) {
    const before = pattern === MONTH_OR_DAY ? monthTokens(original) : tokens(original, pattern);
    const after = pattern === MONTH_OR_DAY ? monthTokens(rewrite) : tokens(rewrite, pattern);
    // A number the seller wrote as a word is reported as that word, not as its digits.
    for (const t of after) if (!before.has(t)) added.push(spelledAs(rewriteText, t));
    for (const t of before) if (!after.has(t)) dropped.push(spelledAs(originalText, t));
  }
  {
    const before = numberUnitPairs(original);
    const after = numberUnitPairs(rewrite);
    for (const t of after) if (!before.has(t)) added.push(t);
    for (const t of before) if (!after.has(t)) dropped.push(t);
  }
  // A rewrite that is much longer than what the seller wrote has said something they did not.
  const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;
  if (wordCount(rewrite) > wordCount(original) * 1.35 + 6) added.push("added content");
  for (const name of midSentenceNames(rewrite)) {
    if (!allWordsInOriginal.has(name)) added.push(name);
  }
  const wordsInRewrite = new Set(
    rewrite
      .toLowerCase()
      .split(/[^a-z'&-]+/)
      .map((w) => w.replace(/'s$/, "")),
  );
  for (const name of midSentenceNames(original)) {
    if (!wordsInRewrite.has(name)) dropped.push(name);
  }
  for (const [label, pattern] of [
    ["negation", NEGATION],
    ["never", NEVER],
    ["a change over time", CHANGED_OVER_TIME],
    ["an absolute claim", ABSOLUTE],
    ["planned action", PLANNED],
  ] as const) {
    const before = [...original.matchAll(pattern)].length;
    const after = [...rewrite.matchAll(pattern)].length;
    if (after > before) added.push(label);
    if (after < before) dropped.push(label);
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

/**
 * Every fact `checkWordingLock` recognises in a text, as a set of normalised tokens: anything with a
 * digit, a month or weekday, a spelled-out count, an email or web address, a number with its unit,
 * and a capitalised name (10 Oct 2026). The same reading, exposed so that the change report can ask
 * whether a response contains a fact its predecessor did not, which is what separates new
 * information from reworded text.
 */
export function recognizedFacts(text: string): Set<string> {
  const normalised = normaliseFacts(text);
  const out = new Set<string>();
  for (const pattern of [WITH_DIGIT, MONTH_OR_DAY, NUMBER_WORD, EMAIL, URL]) {
    const found = pattern === MONTH_OR_DAY ? monthTokens(normalised) : tokens(normalised, pattern);
    for (const t of found) out.add(t);
  }
  for (const pair of numberUnitPairs(normalised)) out.add(pair);
  for (const name of midSentenceNames(normalised)) out.add(name);
  return out;
}

/**
 * Reading a date printed on a seller's document — an invoice, a letter — so the product can compare
 * it with a window itself instead of asking a language model to judge "is this recent enough".
 *
 * Added 24 Sep 2026 (ChatGPT audit item H). The document checker was asked for "issue date (within
 * 365 days)" without being told today's date, so the "within" half was a guess. The model now only
 * quotes the date; this module reads the quote and the arithmetic happens in code.
 *
 * Documents are messier than notice headers, and the stakes are the same — a wrong answer tells a
 * seller an invoice is fine when it is not. So the rule is: **return every calendar day the text can
 * honestly mean, and let the caller decide only when all of them lead to the same answer.**
 *
 * - An unambiguous date ("3 March 2026", "March 3, 2026", "2026-03-03", "03-Mar-2026") has one
 *   reading.
 * - An all-numeric date ("03/04/2026") has two readings when both parts could be the month — 3 April
 *   and 4 March — and one when only one part can be ("25/04/2026").
 * - A text with no full date (a month and year only, a day and month only) has no reading.
 *
 * The model is asked to quote one date per field, so only the first date in the text is read.
 */

import { dayIn, isoDay, monthNumber } from "./noticeDate";

const MONTH_WORD =
  "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)";

/** "03-Mar-2026", "3.Mar.2026", "3/Mar/2026" — the separators invoice software likes. */
const DAY_MON_YEAR_PUNCT = new RegExp(
  `\\b(\\d{1,2})[-./]${MONTH_WORD}\\.?[-./,\\s]+(\\d{4})\\b`,
  "i",
);

/** "2026/03/04", "2026.03.04" — year first is never ambiguous. */
const YEAR_FIRST = /\b(\d{4})[/.](\d{1,2})[/.](\d{1,2})\b/;

/** "03/04/2026", "3.4.26", "03-04-2026". Two readings unless one part cannot be a month. */
const NUMERIC = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/;

function fullYear(y: string): number {
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

/**
 * Every calendar day (YYYY-MM-DD) the text can honestly mean — one, two, or none. Never guesses
 * between day-first and month-first; it returns both and leaves the decision to the caller.
 */
export function documentDateReadings(text: string): string[] {
  const unambiguous = dayIn(text);
  if (unambiguous) return [unambiguous];

  const punct = DAY_MON_YEAR_PUNCT.exec(text);
  if (punct) {
    const d = isoDay(Number(punct[3]), monthNumber(punct[2]!), Number(punct[1]));
    return d ? [d] : [];
  }

  const yearFirst = YEAR_FIRST.exec(text);
  if (yearFirst) {
    const d = isoDay(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
    return d ? [d] : [];
  }

  const numeric = NUMERIC.exec(text);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const year = fullYear(numeric[3]!);
    const readings = new Set<string>();
    const dayFirst = isoDay(year, b, a);
    const monthFirst = isoDay(year, a, b);
    if (dayFirst) readings.add(dayFirst);
    if (monthFirst) readings.add(monthFirst);
    return [...readings];
  }

  return [];
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

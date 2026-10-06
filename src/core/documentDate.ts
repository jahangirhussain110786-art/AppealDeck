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
 * - A text holding more than one different date ("Order date 01 Mar 2025; Invoice date 05 Mar
 *   2026") is read only when exactly one of them is labelled as the invoice or issue date; otherwise
 *   it has no reading (6 Oct 2026: the first date was being taken, whichever it was).
 */

import { isoDay, monthNumber } from "./noticeDate";

const MONTH_WORD =
  "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)";

/** "1st", "2nd" — harmless to accept. */
const ORDINAL = "(?:st|nd|rd|th)?";

/** "3 March 2026", "3rd of March, 2026". */
const DAY_MONTH_YEAR = new RegExp(
  `\\b(\\d{1,2})${ORDINAL}\\s+(?:of\\s+)?${MONTH_WORD}\\.?,?\\s+(\\d{4})\\b`,
  "gi",
);
/** "March 3, 2026". */
const MONTH_DAY_YEAR = new RegExp(
  `\\b${MONTH_WORD}\\.?\\s+(\\d{1,2})${ORDINAL},?\\s+(\\d{4})\\b`,
  "gi",
);

/** "03-Mar-2026", "3.Mar.2026", "3/Mar/2026", "05-Mar-26" — the separators invoice software likes. */
const DAY_MON_YEAR_PUNCT = new RegExp(
  `\\b(\\d{1,2})[-./]${MONTH_WORD}\\.?[-./,\\s]+(\\d{4}|\\d{2})\\b`,
  "gi",
);

/** "2026-03-04", "2026/03/04", "2026.03.04" — year first is never ambiguous. */
const YEAR_FIRST = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/g;

/** "03/04/2026", "3.4.26", "03-04-2026". Two readings unless one part cannot be a month. */
const NUMERIC = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/g;

/** A label that says a date is when the document was issued. */
const ISSUE_LABEL =
  /(?:invoice date|date of issue|issue date|date issued|issued(?: on)?|dated)\W*$/i;

function fullYear(y: string): number {
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

interface Found {
  index: number;
  end: number;
  readings: string[];
}

function one(d: string | null): string[] {
  return d ? [d] : [];
}

/** Every full date in the text, in order, none overlapping another. */
function datesIn(text: string): Found[] {
  const found: Found[] = [];
  const add = (m: RegExpMatchArray, readings: string[]) =>
    found.push({ index: m.index ?? 0, end: (m.index ?? 0) + m[0].length, readings });

  for (const m of text.matchAll(DAY_MONTH_YEAR))
    add(m, one(isoDay(Number(m[3]), monthNumber(m[2]!), Number(m[1]))));
  for (const m of text.matchAll(MONTH_DAY_YEAR))
    add(m, one(isoDay(Number(m[3]), monthNumber(m[1]!), Number(m[2]))));
  for (const m of text.matchAll(DAY_MON_YEAR_PUNCT))
    add(m, one(isoDay(fullYear(m[3]!), monthNumber(m[2]!), Number(m[1]))));
  for (const m of text.matchAll(YEAR_FIRST))
    add(m, one(isoDay(Number(m[1]), Number(m[2]), Number(m[3]))));
  for (const m of text.matchAll(NUMERIC)) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = fullYear(m[3]!);
    add(m, [...new Set([isoDay(year, b, a), isoDay(year, a, b)].filter((d): d is string => !!d))]);
  }

  found.sort((x, y) => x.index - y.index || y.end - x.end);
  const out: Found[] = [];
  for (const d of found) {
    const last = out[out.length - 1];
    if (!last || d.index >= last.end) out.push(d);
  }
  return out;
}

/**
 * Every calendar day (YYYY-MM-DD) the text can honestly mean — one, two, or none. Never guesses
 * between day-first and month-first; it returns both and leaves the decision to the caller.
 */
export function documentDateReadings(text: string): string[] {
  const all = datesIn(text);
  if (all.length === 0) return [];
  const first = all[0]!;
  if (all.length === 1) return first.readings;

  // The same day written twice ("03/04/2026 (3 April 2026)") is still one date.
  const key = (f: Found) => [...f.readings].sort().join("|");
  if (all.every((d) => key(d) === key(first))) return first.readings;

  // Several different dates: only a clearly labelled invoice/issue date can speak for the quote.
  const labelled = all.filter((d, i) => {
    const from = i === 0 ? 0 : all[i - 1]!.end;
    return ISSUE_LABEL.test(text.slice(Math.max(from, d.index - 30), d.index));
  });
  return labelled.length === 1 ? labelled[0]!.readings : [];
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

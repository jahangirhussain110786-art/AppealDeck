/**
 * The day an Amazon notice was sent, read from the notice itself — or nothing.
 *
 * Added 23 Sep 2026. A stated appeal window ("you may appeal within 30 days") only becomes a
 * deadline once we know when it started counting, and until now every caller counted it from the
 * moment of the call. That is wrong in the dangerous direction — a notice received twenty days ago
 * would end twenty days later than it really does. `/api/decode` hid the result by discarding every
 * date it computed, so the decoder said "Date not stated" instead, which was safe but told the seller
 * nothing. Applying an Amazon reply in the workspace had no such guard: it stored the window counted
 * from the click, and the workspace showed that date as the seller's real deadline.
 *
 * Founder direction the same day: if the pasted notice or email carries its date, use it; if not,
 * tell the seller plainly that the window runs from the day they received it, and never invent a
 * date. This module is the first half of that. It is deliberately strict, because a wrong start
 * date is worse than none — the fallback is honest and calm, and a guess is neither.
 *
 * What counts:
 *
 * - **Only a date on a labelled header line** — `Date:`, `Sent:`, `Received:` and their variants,
 *   which is what a copied or forwarded email carries. A date in the body is never used: a notice
 *   is full of dates (orders, complaints, invoices, the deadline itself) and nothing in the prose
 *   says which, if any, is the day it arrived.
 * - **Only unambiguous formats** — ISO, "1 Sep 2026", "September 1, 2026". An all-numeric date such
 *   as 03/04/2026 is March or April depending on the reader's country, so it is refused, exactly as
 *   `entities.ts` already refuses to pick one.
 * - **Exactly one day.** A forwarded chain can carry the forwarder's date and Amazon's; two
 *   different days means we cannot tell which one the seller means, so we say so rather than choose.
 *
 * The result is a calendar date (YYYY-MM-DD) as written, not a moment converted to UTC. "The day
 * you received it" is a day on the seller's calendar, and converting "Mon, 1 Sep 2026 23:30 -0700"
 * to UTC would move it to the 2nd.
 */

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH =
  "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)";

/**
 * A header line an email client writes when a message is copied or forwarded. Leading `>` is
 * allowed because a quoted forward prefixes every line with it. Matched at the start of a line only
 * — "we sent you a notice on 1 Sep 2026" in the body is prose, not a header.
 */
const HEADER =
  /^[\s>]*(?:date|sent|sent on|received|date sent|date received|notification date)\s*:\s*(.+)$/gim;

/** "1st", "2nd", "23rd", "30th" — written in prose, rarely in a header, harmless to accept in both. */
const ORDINAL = "(?:st|nd|rd|th)?";

const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const DAY_MONTH_YEAR = new RegExp(
  `\\b(\\d{1,2})${ORDINAL}\\s+(?:of\\s+)?${MONTH}\\.?,?\\s+(\\d{4})\\b`,
  "i",
);
const MONTH_DAY_YEAR = new RegExp(`\\b${MONTH}\\.?\\s+(\\d{1,2})${ORDINAL},?\\s+(\\d{4})\\b`, "i");

export function isoDay(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Round-trip through a UTC date so "31 Feb" is rejected rather than rolled into March.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Keyed on the first three letters, so "September", "Sept" and "Sep" all resolve. */
export function monthNumber(name: string): number {
  return MONTHS[name.slice(0, 3).toLowerCase()] ?? 0;
}

/** The unambiguous calendar date in one header value, or null. Numeric slash dates never match. */
export function dayIn(value: string): string | null {
  const iso = ISO.exec(value);
  if (iso) return isoDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const dmy = DAY_MONTH_YEAR.exec(value);
  if (dmy) return isoDay(Number(dmy[3]), monthNumber(dmy[2]!), Number(dmy[1]));
  const mdy = MONTH_DAY_YEAR.exec(value);
  if (mdy) return isoDay(Number(mdy[3]), monthNumber(mdy[1]!), Number(mdy[2]));
  return null;
}

/**
 * The day the notice was sent, as YYYY-MM-DD, when the pasted text states exactly one. Null when it
 * states none, only an ambiguous one, or more than one different day.
 */
export function receiptDateOf(raw: string): string | null {
  const days = new Set<string>();
  for (const match of raw.matchAll(HEADER)) {
    const day = dayIn(match[1]!);
    if (day) days.add(day);
  }
  return days.size === 1 ? [...days][0]! : null;
}

/**
 * The last day to respond, when the notice names it as a date — "submit your appeal by 1 October
 * 2026" — rather than as a length of time.
 *
 * Added 23 Sep 2026. Until now only "within 30 days" was read, so a notice that gave the date
 * itself was shown as having no fixed window at all. A stated date is the most reliable deadline a
 * notice can carry: no start date is needed and no arithmetic is done, so it is used whenever it is
 * found, in preference to a counted window.
 *
 * Held to the same standard as `receiptDateOf`, because a wrong deadline is worse than none:
 *
 * - **Only a date tied to responding.** A notice is full of dates. One counts only when it follows
 *   "by", "before", "no later than", "on or before" or "until" in a sentence about appealing,
 *   submitting or responding — or is introduced as the "appeal deadline" or "response deadline".
 * - **Not Amazon's own timetable, and not the seller's history.** "We will review your appeal by…",
 *   "funds are held until…", "invoices dated before…" and anything in the past tense are refused.
 * - **Only unambiguous formats**, exactly as the header reader: never an all-numeric date.
 * - **A date without a year** ("by October 1") is placed only against the notice's own header date,
 *   as the first such day on or after it. With no header there is no honest year to give it.
 * - **Exactly one day, and not before the notice itself.** Two different deadlines, or one that
 *   falls before the notice was sent, means we cannot tell what is meant, so we say nothing.
 */
export interface StatedDeadline {
  /** YYYY-MM-DD, as written. */
  day: string;
  /** Where the date sits in the pasted text, so the decoder can point at the seller's own words. */
  start: number;
  end: number;
}

const WEEKDAY = "(?:(?:mon|tues|wednes|thurs|fri|satur|sun)day,?\\s+)?";

/** Sticky (`y`): each is tried exactly where a cue ends, never searched for further along. */
const AT_ISO = /(\d{4})-(\d{2})-(\d{2})\b/y;
const AT_DAY_MONTH_YEAR = new RegExp(
  `${WEEKDAY}(?:the\\s+)?(\\d{1,2})${ORDINAL}\\s+(?:of\\s+)?${MONTH}\\.?,?\\s+(\\d{4})\\b`,
  "iy",
);
const AT_MONTH_DAY_YEAR = new RegExp(
  `${WEEKDAY}${MONTH}\\.?\\s+(\\d{1,2})${ORDINAL},?\\s+(\\d{4})\\b`,
  "iy",
);
const AT_DAY_MONTH = new RegExp(
  `${WEEKDAY}(?:the\\s+)?(\\d{1,2})${ORDINAL}\\s+(?:of\\s+)?${MONTH}\\b\\.?`,
  "iy",
);
const AT_MONTH_DAY = new RegExp(`${WEEKDAY}${MONTH}\\.?\\s+(\\d{1,2})${ORDINAL}\\b`, "iy");

/** "by", "before" and the rest: a last day only when the sentence around it is about responding. */
const LAST_DAY_CUE = /\b(?:no later than|not later than|on or before|before|by|until)\s+/gi;
/** "Appeal deadline: …" names its own subject, so it needs no sentence around it. */
const DEADLINE_NOUN_CUE =
  /\b(?:(?:appeal|response|submission|reply)\s+deadline(?:\s+is)?|deadline\s+to\s+(?:appeal|respond|reply))\s*:?\s*/gi;

const RESPONDING = /\b(?:appeal|plan of action|poa|submit|resubmit|respond|reply)\b/i;
/** "You have until 1 October 2026 to submit an appeal" — the action comes after the date. */
const RESPONDING_AFTER = /^[^.!?\n]{0,40}?\bto\s+(?:appeal|submit|resubmit|respond|reply)\b/i;
/** Amazon's timetable or the state of the money, not the seller's last day. */
const SOMEONE_ELSES_CLOCK =
  /\b(?:we|amazon|our team|funds?|payments?|disbursements?)\s+(?:will|would|may|might|can|could|should|is|are|was|were)\b/i;
const PAST_TENSE = /\b(?:was|were|has been|had been|have been)\b/i;
/** "invoices dated before…", "orders placed before…": a condition on a document, not a deadline. */
const DESCRIBES_A_RECORD =
  /\b(?:dated|issued|placed|purchased|shipped|delivered|received|made|created|sent|generated)\s*$/i;

/** The sentence a cue sits in, from its last boundary up to the cue. A period only ends one before a space. */
function sentenceBefore(raw: string, at: number): string {
  const before = raw.slice(Math.max(0, at - 200), at);
  let cut = -1;
  for (const m of before.matchAll(/[!?\n]|\.(?=\s)/g)) cut = m.index!;
  return before.slice(cut + 1);
}

/** The clause a cue sits in: the sentence after its last comma, semicolon or colon. */
function clauseOf(sentence: string): string {
  let cut = -1;
  for (const m of sentence.matchAll(/[,;:]/g)) cut = m.index!;
  return sentence.slice(cut + 1);
}

/** The first `month`/`day` on or after `sentOn` — how a reader places "by October 1" in a dated email. */
function nextOccurrence(sentOn: string, month: number, day: number): string | null {
  const year = Number(sentOn.slice(0, 4));
  const same = isoDay(year, month, day);
  if (!same) return null;
  return same >= sentOn ? same : isoDay(year + 1, month, day);
}

/**
 * The date written exactly at `at`, if one is. `day` is null when a date is there but cannot be
 * placed — "31 February", or "October 1" in a notice that carries no date of its own.
 */
function dateAt(
  raw: string,
  at: number,
  sentOn: string | null,
): { day: string | null; end: number } | undefined {
  const tryAt = (re: RegExp): RegExpExecArray | null => {
    re.lastIndex = at;
    return re.exec(raw);
  };
  let m = tryAt(AT_ISO);
  if (m) return { day: isoDay(Number(m[1]), Number(m[2]), Number(m[3])), end: at + m[0].length };
  m = tryAt(AT_DAY_MONTH_YEAR);
  if (m) {
    return { day: isoDay(Number(m[3]), monthNumber(m[2]!), Number(m[1])), end: at + m[0].length };
  }
  m = tryAt(AT_MONTH_DAY_YEAR);
  if (m) {
    return { day: isoDay(Number(m[3]), monthNumber(m[1]!), Number(m[2])), end: at + m[0].length };
  }
  m = tryAt(AT_DAY_MONTH);
  if (m) {
    const day = sentOn ? nextOccurrence(sentOn, monthNumber(m[2]!), Number(m[1])) : null;
    return { day, end: at + m[0].length };
  }
  m = tryAt(AT_MONTH_DAY);
  if (m) {
    const day = sentOn ? nextOccurrence(sentOn, monthNumber(m[1]!), Number(m[2])) : null;
    return { day, end: at + m[0].length };
  }
  return undefined;
}

/**
 * The last day to respond that the notice states as a date, or null. `sentOn` is the notice's own
 * header date (`receiptDateOf`), used only to place a date written without a year and to refuse a
 * deadline that falls before the notice was sent.
 */
export function statedDeadlineOf(raw: string, sentOn: string | null): StatedDeadline | null {
  const found: Array<{ day: string | null; start: number; end: number }> = [];

  for (const cue of raw.matchAll(LAST_DAY_CUE)) {
    const at = cue.index! + cue[0].length;
    const date = dateAt(raw, at, sentOn);
    if (!date) continue;
    const sentence = sentenceBefore(raw, cue.index!);
    const clause = clauseOf(sentence);
    const after = raw.slice(date.end, date.end + 80);
    const aboutResponding = RESPONDING.test(sentence) || RESPONDING_AFTER.test(after);
    if (!aboutResponding) continue;
    if (SOMEONE_ELSES_CLOCK.test(clause) || PAST_TENSE.test(clause)) continue;
    if (DESCRIBES_A_RECORD.test(raw.slice(Math.max(0, cue.index! - 40), cue.index!))) continue;
    found.push({ day: date.day, start: at, end: date.end });
  }

  for (const cue of raw.matchAll(DEADLINE_NOUN_CUE)) {
    const at = cue.index! + cue[0].length;
    const date = dateAt(raw, at, sentOn);
    if (date) found.push({ day: date.day, start: at, end: date.end });
  }

  if (found.length === 0) return null;
  // A date in deadline position that cannot be placed is not something to step around: the notice
  // did name a last day, we cannot tell which, and a different one found elsewhere may not be it.
  if (found.some((f) => f.day === null)) return null;
  const days = new Set(found.map((f) => f.day!));
  if (days.size !== 1) return null;
  const [first] = found.sort((a, b) => a.start - b.start);
  if (sentOn && first!.day! < sentOn) return null;
  return { day: first!.day!, start: first!.start, end: first!.end };
}

const SHORT_MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * "1 Sep 2026" — day, short month, year. Chosen because it cannot be misread in any country, which
 * matters when the seller is checking it against the date on their own email.
 */
export function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} ${SHORT_MONTH[m! - 1]} ${y}`;
}

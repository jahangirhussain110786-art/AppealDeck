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

const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const DAY_MONTH_YEAR = new RegExp(`\\b(\\d{1,2})\\s+${MONTH}\\.?,?\\s+(\\d{4})\\b`, "i");
const MONTH_DAY_YEAR = new RegExp(`\\b${MONTH}\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "i");

function isoDay(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Round-trip through a UTC date so "31 Feb" is rejected rather than rolled into March.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Keyed on the first three letters, so "September", "Sept" and "Sep" all resolve. */
function monthNumber(name: string): number {
  return MONTHS[name.slice(0, 3).toLowerCase()] ?? 0;
}

/** The unambiguous calendar date in one header value, or null. Numeric slash dates never match. */
function dayIn(value: string): string | null {
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

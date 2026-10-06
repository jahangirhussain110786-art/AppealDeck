/**
 * AA-39 (AM-26): pull the case's real identifiers out of the notice.
 *
 * Before this, nothing in the product extracted an ASIN, a case ID, an order ID or a date — the
 * seller retyped everything by hand into the workspace, and the decoder could only ever talk about
 * the notice in the abstract. Every value here carries the offsets of the text it came from, so the
 * UI can highlight the seller's own words rather than presenting a number we appear to have
 * conjured. That traceability is the D6 requirement, not a nicety.
 *
 * Deliberate omission: no confidence scores. A span either matched a documented Amazon identifier
 * format or it did not.
 */

import { splitClauses, REQUEST_VERB } from "./responseType";
import { numericDateIn } from "./noticeDate";

export type EntityKind = "asin" | "order_id" | "case_id" | "date" | "amount" | "requested_record";

export interface ExtractedEntity {
  kind: EntityKind;
  /**
   * For every kind except `requested_record`, this is the identifier exactly as it appears in the
   * source, so `raw.slice(start, end) === value` holds. For `requested_record` it is instead the
   * canonical label we display ("Supplier invoice"), because the notice may say "invoice",
   * "invoices" or "receipts" for the same requirement and the workspace needs one stable name.
   * The span still points at the real matched words, so highlighting is unaffected.
   */
  value: string;
  /** The clause or match this came from, verbatim. Never paraphrased. */
  quote: string;
  /** Offsets into the source text. `raw.slice(start, end)` is always real source text. */
  start: number;
  end: number;
  /**
   * Set on dates whose format cannot be read unambiguously (e.g. 03/04/2026, which is March 4th or
   * April 3rd depending on locale). We surface the raw text and refuse to pick — guessing wrong on
   * a deadline is precisely the harm this product exists to prevent.
   */
  ambiguous?: boolean;
  /**
   * On an ambiguous numeric date, the two days it could mean (day-first, then month-first) as
   * YYYY-MM-DD, so the page can say "12 Sep or 9 Dec — check" instead of showing a bare number.
   */
  readings?: [string, string];
  /**
   * The identifier in the form to store and compare when the source spelled it differently
   * (lower case, spaced, an OCR letter O for the zero). Absent when the source text is already it.
   */
  normalized?: string;
}

/** ASINs are ten characters; modern ones are B0 plus eight uppercase alphanumerics. */
const ASIN = /\bB0[A-Z0-9]{8}\b/gi;
/** "B0 ABCD EF13", "B0-ABCD-EF13": an ASIN broken into groups by a copy or a line wrap. */
const ASIN_SPACED = /\bB0(?:[ -][A-Z0-9]{2,6}){1,2}\b|\bB0[A-Z0-9]{2,6}[ -][A-Z0-9]{2,6}\b/gi;
/** OCR reads the zero as a capital O. Upper case only, so "BOOKSELLER" needs digits to qualify. */
const ASIN_OCR = /\bBO[A-Z0-9]{8}\b/g;
/** A labelled ASIN one character short or long ("ASIN: B0ABCDEF1"). */
const ASIN_NEAR_MISS = /\basins?\s*[:#-]?\s*(B[0O][A-Z0-9]{6,7}|B[0O][A-Z0-9]{9,11})(?![A-Z0-9])/gi;

/** Amazon order IDs are the documented 3-7-7 grouping. */
const ORDER_ID = /\b\d{3}-\d{7}-\d{7}\b/g;
/** "111 - 1234567 - 7654321", "111 1234567 7654321", "1111234567-7654321": spacing a copy added or a hyphen it lost. */
const ORDER_ID_LOOSE = /\b\d{3}[ \t]*-?[ \t]*\d{7}[ \t]*-?[ \t]*\d{7}\b/g;

/**
 * Case IDs are plain digit runs, so they are only matched when explicitly labelled. An unlabelled
 * ten-digit number in a notice is far more likely to be a phone number or an order total.
 */
const CASE_ID =
  /\bcase(?:\s*(?:id|number|no\.?|#))?\s*[:#]?\s*(\d{6,15}|\d{1,6}(?:[ -]\d{2,6}){1,4})\b/gi;

const MONTH =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";

const DATE_PATTERNS: ReadonlyArray<readonly [RegExp, boolean]> = [
  // ISO — unambiguous.
  // (?!\d) rather than \b so a timestamp such as 2026-03-04T23:30:00 still yields its day.
  [/\b\d{4}-\d{2}-\d{2}(?!\d)/g, false],
  // "12 September 2026" / "12 Sep 2026" — unambiguous.
  [new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\.?,?\\s+\\d{4}\\b`, "gi"), false],
  // "September 12, 2026" / "March 4th, 2026" — unambiguous.
  [new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "gi"), false],
  // All-numeric dates are read by `numericDateEntities` below, which settles the ones that cannot
  // be misread (a part above 12) and returns both readings for the ones that can.
];

/** 25/09/2026, 09/25/2026, 12.09.2026, 9/12/26 — see `numericDateIn`. */
const NUMERIC_DATE = /(?<![\d/.-])\d{1,2}([/.-])\d{1,2}\1(?:\d{4}|\d{2})(?!\d)/g;

function numericDateEntities(raw: string): ExtractedEntity[] {
  const out: ExtractedEntity[] = [];
  for (const m of raw.matchAll(NUMERIC_DATE)) {
    const read = numericDateIn(m[0]);
    if (!read) continue;
    const start = m.index ?? 0;
    out.push({
      kind: "date",
      value: m[0],
      quote: m[0],
      start,
      end: start + m[0].length,
      ...(read.readings ? { ambiguous: true, readings: read.readings } : {}),
    });
  }
  return out;
}

const AMOUNT = /(?:USD|GBP|EUR|CAD|AUD|\$|£|€)\s?\d[\d,]*(?:\.\d{2})?\b/g;

/**
 * Document types Amazon names in requests. The label is what we show; the pattern is what we match.
 * Kept aligned with `proposedRequirements()` in `workspace.ts` so the decoder and the workspace
 * never disagree about what was asked for.
 */
const RECORD_TYPES: ReadonlyArray<readonly [string, RegExp]> = [
  ["Supplier invoice", /\binvoices?\b|\breceipts?\b/i],
  ["Letter of authorization", /\b(?:letter of authori[sz]ation|authori[sz]ation letter|\bLOA\b)/i],
  [
    "Identity document",
    /\b(?:identity document|government[\s-]issued (?:ID|identification)|passport|driver'?s licence|driver'?s license)\b/i,
  ],
  [
    "Sales or performance report",
    /\b(?:sales report|sales records?|order report|metrics? report|performance report)\b/i,
  ],
  ["Listing correction proof", /\b(?:proof of (?:correction|changes)|listing screenshots?)\b/i],
  [
    "Supplier contact details",
    /\b(?:supplier (?:contact|details|information)|contact (?:details|information) (?:for|of) (?:your |the )?supplier)\b/i,
  ],
  ["Tracking information", /\b(?:tracking (?:information|numbers?|details)|proof of delivery)\b/i],
  [
    "Product images",
    /\b(?:product (?:images|photos|photographs)|images of the (?:product|packaging)|photographs of)\b/i,
  ],
  [
    "Certificate or test report",
    /\b(?:certificate|certification|test report|compliance report|safety (?:data sheet|report))\b/i,
  ],
];

// Shared with `responseType.ts` (AA-39) so the two modules cannot disagree about what counts as a
// request. They previously had separate verb lists and both missed gerunds such as "providing".

const NEGATION =
  /\b(do not|don't|does not|no need to|not required|not requested|not necessary|no additional|no further)\b/i;

function collect(
  raw: string,
  kind: EntityKind,
  pattern: RegExp,
  opts: { group?: number; ambiguous?: boolean } = {},
): ExtractedEntity[] {
  const out: ExtractedEntity[] = [];
  // `lastIndex` is reset because these patterns are module-level and global.
  pattern.lastIndex = 0;
  for (const m of raw.matchAll(pattern)) {
    const whole = m[0];
    const index = m.index ?? 0;
    const captured = opts.group !== undefined ? m[opts.group] : undefined;
    // When a capture group is used, report the span of the captured value, not of the whole label.
    const offsetInMatch = captured !== undefined ? whole.lastIndexOf(captured) : 0;
    const value = captured ?? whole;
    out.push({
      kind,
      value: value.trim(),
      quote: whole.trim(),
      start: index + offsetInMatch,
      end: index + offsetInMatch + value.length,
      ...(opts.ambiguous ? { ambiguous: true } : {}),
    });
  }
  return out;
}

/**
 * Named records are only extracted from clauses that actually ask for something and are not
 * negated, so "do not resend the invoices you already provided" does not become a requirement.
 */
function collectRequestedRecords(raw: string): ExtractedEntity[] {
  const out: ExtractedEntity[] = [];
  for (const clause of splitClauses(raw)) {
    if (!REQUEST_VERB.test(clause.text) || NEGATION.test(clause.text)) continue;
    for (const [label, pattern] of RECORD_TYPES) {
      const found = pattern.exec(clause.text);
      if (!found) continue;
      out.push({
        kind: "requested_record",
        value: label,
        quote: clause.text,
        start: clause.start + found.index,
        end: clause.start + found.index + found[0].length,
      });
    }
  }
  return out;
}

/** First occurrence of each (kind, value) wins; the rest are duplicates of the same fact. */
function dedupe(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Set<string>();
  return entities
    .sort((a, b) => a.start - b.start)
    .filter((e) => {
      const key = `${e.kind}:${(e.normalized ?? e.value).toUpperCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Identifiers as the seller sees them are not always identifiers as Amazon wrote them: a copy adds
 * spaces, an OCR reads a zero as the letter O, a lowercase paste ("asin: b0abcdef12"). The span and
 * `value` stay the exact source text, so highlighting and `raw.slice(start, end) === value` hold;
 * `normalized` is the form to store, compare and look up.
 */
function withNormalized(
  entities: ExtractedEntity[],
  normalize: (value: string) => string | null,
): ExtractedEntity[] {
  const out: ExtractedEntity[] = [];
  for (const e of entities) {
    const normalized = normalize(e.value);
    if (normalized === null) continue;
    out.push(normalized === e.value ? e : { ...e, normalized });
  }
  return out;
}

const compact = (value: string): string => value.replace(/[\s-]+/g, "").toUpperCase();

function asinEntities(raw: string): ExtractedEntity[] {
  const strict = withNormalized(collect(raw, "asin", ASIN), (v) => v.toUpperCase());
  const spaced = withNormalized(collect(raw, "asin", ASIN_SPACED), (v) => {
    const c = compact(v);
    // Ten characters in all, with at least one digit among the eight: "B0 AND SELLER" is not an ASIN.
    return c.length === 10 && /\d/.test(c.slice(2)) ? c : null;
  });
  const ocr = withNormalized(collect(raw, "asin", ASIN_OCR), (v) =>
    /\d/.test(v.slice(2)) ? `B0${v.slice(2)}` : null,
  );
  return dropOverlappingEntities([...strict, ...spaced, ...ocr]);
}

function orderEntities(raw: string): ExtractedEntity[] {
  const loose = collect(raw, "order_id", ORDER_ID_LOOSE).filter((e) => /[ \t-]/.test(e.value));
  const all = [...collect(raw, "order_id", ORDER_ID), ...loose];
  return dropOverlappingEntities(
    withNormalized(all, (v) => {
      const digits = v.replace(/\D/g, "");
      return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
    }),
  );
}

function caseEntities(raw: string): ExtractedEntity[] {
  return withNormalized(collect(raw, "case_id", CASE_ID, { group: 1 }), (v) => {
    const digits = v.replace(/\D/g, "");
    // A spaced run is only believed when it is long enough to be a case number at all.
    if (/[ -]/.test(v) && digits.length < 8) return null;
    return digits;
  });
}

/** Earlier-listed spans win over later ones that overlap them. */
function dropOverlappingEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const kept: ExtractedEntity[] = [];
  for (const e of entities) {
    if (kept.some((k) => e.start < k.end && k.start < e.end)) continue;
    kept.push(e);
  }
  return kept;
}

export interface UnreadableId {
  kind: "asin";
  /** The characters as pasted, with the span they came from. */
  value: string;
  start: number;
  end: number;
}

/**
 * A labelled ASIN that is a character short or long ("ASIN: B0ABCDEF1") was silently dropped: no
 * entity, no error, and the seller never learned the ID had not been read. The caller names each
 * one so the seller can retype it.
 */
export function findUnreadableIds(raw: string): UnreadableId[] {
  const out: UnreadableId[] = [];
  for (const m of raw.matchAll(ASIN_NEAR_MISS)) {
    const value = m[1]!;
    if (value.length === 10) continue;
    const start = (m.index ?? 0) + m[0].lastIndexOf(value);
    out.push({ kind: "asin", value, start, end: start + value.length });
  }
  return out;
}

export function extractEntities(raw: string): ExtractedEntity[] {
  const dates = [
    ...DATE_PATTERNS.flatMap(([pattern, ambiguous]) =>
      collect(raw, "date", pattern, { ambiguous }),
    ),
    ...numericDateEntities(raw),
  ];
  return dedupe([
    ...asinEntities(raw),
    ...orderEntities(raw),
    ...caseEntities(raw),
    ...dropOverlapping(dates),
    ...collect(raw, "amount", AMOUNT),
    ...collectRequestedRecords(raw),
  ]);
}

/**
 * "12 September 2026" matches both the day-first and the numeric patterns in some inputs. When two
 * date spans overlap, the earlier-listed (unambiguous) pattern wins, so we never downgrade a date
 * we could actually read into an "ambiguous" one.
 */
function dropOverlapping(dates: ExtractedEntity[]): ExtractedEntity[] {
  const kept: ExtractedEntity[] = [];
  for (const d of dates) {
    if (kept.some((k) => d.start < k.end && k.start < d.end)) continue;
    kept.push(d);
  }
  return kept;
}

export function entitiesOfKind(entities: ExtractedEntity[], kind: EntityKind): ExtractedEntity[] {
  return entities.filter((e) => e.kind === kind);
}

export const ENTITY_LABELS: Record<EntityKind, string> = {
  asin: "ASIN",
  order_id: "Order ID",
  case_id: "Case ID",
  date: "Date",
  amount: "Amount",
  requested_record: "Requested record",
};

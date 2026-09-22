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
}

/** ASINs are ten characters; modern ones are B0 plus eight uppercase alphanumerics. */
const ASIN = /\bB0[A-Z0-9]{8}\b/g;

/** Amazon order IDs are the documented 3-7-7 grouping. */
const ORDER_ID = /\b\d{3}-\d{7}-\d{7}\b/g;

/**
 * Case IDs are plain digit runs, so they are only matched when explicitly labelled. An unlabelled
 * ten-digit number in a notice is far more likely to be a phone number or an order total.
 */
const CASE_ID = /\bcase(?:\s*(?:id|number|no\.?|#))?\s*[:#]?\s*(\d{6,15})\b/gi;

const MONTH =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";

const DATE_PATTERNS: ReadonlyArray<readonly [RegExp, boolean]> = [
  // ISO — unambiguous.
  [/\b\d{4}-\d{2}-\d{2}\b/g, false],
  // "12 September 2026" / "12 Sep 2026" — unambiguous.
  [new RegExp(`\\b\\d{1,2}\\s+${MONTH}\\.?,?\\s+\\d{4}\\b`, "gi"), false],
  // "September 12, 2026" — unambiguous.
  [new RegExp(`\\b${MONTH}\\.?\\s+\\d{1,2},?\\s+\\d{4}\\b`, "gi"), false],
  // All-numeric — ambiguous unless the first component is clearly a day > 12, which we do not
  // special-case, because a rule that is right most of the time is worse here than one that asks.
  [/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, true],
];

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
      const key = `${e.kind}:${e.value.toUpperCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function extractEntities(raw: string): ExtractedEntity[] {
  const dates = DATE_PATTERNS.flatMap(([pattern, ambiguous]) =>
    collect(raw, "date", pattern, { ambiguous }),
  );
  return dedupe([
    ...collect(raw, "asin", ASIN),
    ...collect(raw, "order_id", ORDER_ID),
    ...collect(raw, "case_id", CASE_ID, { group: 1 }),
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

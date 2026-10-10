/**
 * Do the seller's invoices cover the units they sold? (10 Oct 2026)
 *
 * Amazon's rule for an authenticity case, as the evidence matrix records it, is that invoiced units
 * must be at least the seller's sales of the cited products over the 365 days before the notice.
 * A document check reads one invoice at a time and has never been given a sales figure, so it said
 * "we have not compared it with units sold" and left the arithmetic to the seller. A seller with
 * four invoices and a sales report is exactly who gets this wrong.
 *
 * What this does, and does not do:
 *
 * - **The seller states the sales figure.** It comes from Seller Central's business reports and is
 *   one number for the products in the notice (`CaseFacts.unitsSold`). We never infer it.
 * - **The model quotes; code adds.** The invoiced quantity is whatever the document check already
 *   quoted for the quantity field. A quote that cannot be read as a plain list of quantities is
 *   counted as unreadable, never guessed at, and a partly readable quote is not partly counted.
 * - **Every line is counted.** An invoice may include products that are not in the notice, and an
 *   invoice line cannot be tied to an ASIN from the invoice alone, so the total is an upper bound
 *   for the cited products. That is why a shortfall is a plain fact (even counting everything,
 *   the invoices fall short) while "enough" says only that the numbers add up and asks the seller
 *   to check the lines.
 * - **Each file counts once, and only inside the window.** The same file attached to two records is
 *   one invoice, and an invoice whose date the check found outside the 365 days is listed as not
 *   counted rather than quietly added.
 * - **It predicts nothing.** Matching numbers do not mean Amazon will accept the invoices.
 */

import type { SavedDocumentCheck } from "./documentCheck";

/** The quantity field of the supplier-invoice requirement, whichever way it is worded. */
const QUANTITY_FIELD = /\b(?:invoiced quantity|units sold)\b/i;

/** A table row ending "<quantity> <unit price> <amount>", as the device reader quotes it. */
const TABLE_ROW = /(?:^|\s)(\d[\d,]*)\s+[$£€]?\s?\d[\d,]*\.\d{2}\s+[$£€]?\s?\d[\d,]*\.\d{2}\s*$/;
/** "Qty: 120", "Quantity 40". */
const LABELLED = /\b(?:qty|quantity|units?|pcs|pieces)\b[\s.:#]*(\d[\d,]*)/i;
/** "120 units", "40 pcs". */
const TRAILING_UNIT = /\b(\d[\d,]*)\s*(?:units?|pcs|pieces)\b/i;

const MAX_UNITS = 10_000_000;

/**
 * The total quantity printed in a quote, or null when any part of it cannot be read as a quantity.
 * Parts are separated by ";" or line breaks, which is how the readings join several rows.
 */
export function parseInvoicedUnits(observed: string): number | null {
  const parts = observed
    .split(/[;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  let total = 0;
  for (const part of parts) {
    const hit = TABLE_ROW.exec(part) ?? LABELLED.exec(part) ?? TRAILING_UNIT.exec(part);
    if (!hit) return null;
    const n = Number(hit[1]!.replace(/,/g, ""));
    if (!Number.isInteger(n) || n <= 0 || n > MAX_UNITS) return null;
    total += n;
  }
  return total;
}

export type CoverageStatus =
  /** No invoice has a readable quantity yet. */
  | "none"
  /** Even counting every line on every counted invoice, the total is below the units sold. */
  | "short"
  /** The counted total is at least the units sold. Says nothing about which products. */
  | "enough";

export interface InvoiceCoverage {
  unitsSold: number;
  /** Units on the invoices that were counted. */
  invoicedUnits: number;
  /** Invoices counted, one per file. */
  counted: number;
  /** Invoices checked whose quantity could not be read as a plain number. */
  unreadable: number;
  /** Invoices checked whose date the check found outside the 365-day window, not counted. */
  outsideWindow: number;
  status: CoverageStatus;
  /** How far below the units sold the counted total is. 0 unless `short`. */
  shortBy: number;
}

/**
 * Adds up the invoices checked on a case against the units the seller says they sold. Null when
 * the seller has not stated a sales figure, so nothing is shown that could not be compared.
 */
export function invoiceCoverage(
  checks: readonly SavedDocumentCheck[] | undefined,
  unitsSold: number | undefined,
): InvoiceCoverage | null {
  if (unitsSold === undefined || !Number.isInteger(unitsSold) || unitsSold <= 0) return null;

  const seen = new Set<string>();
  let invoicedUnits = 0;
  let counted = 0;
  let unreadable = 0;
  let outsideWindow = 0;

  for (const check of checks ?? []) {
    if (check.outcome.kind !== "fields") continue;
    const result = check.outcome.result;
    if (result.evidenceKind !== "supplier_invoice") continue;
    // One file, one invoice, however many records it is linked to.
    const key = check.contentHash ?? check.recordId;
    if (seen.has(key)) continue;
    seen.add(key);

    const date = result.findings.find((f) => /^issue date\b/i.test(f.field.trim()));
    if (date?.status === "conflicting") {
      outsideWindow++;
      continue;
    }
    const quantity = result.findings.find(
      (f) =>
        QUANTITY_FIELD.test(f.field) &&
        f.observed &&
        (f.status === "present" || f.status === "not_assessed"),
    );
    const units = quantity?.observed ? parseInvoicedUnits(quantity.observed) : null;
    if (units === null) {
      unreadable++;
      continue;
    }
    invoicedUnits += units;
    counted++;
  }

  const status: CoverageStatus =
    counted === 0 ? "none" : invoicedUnits >= unitsSold ? "enough" : "short";
  return {
    unitsSold,
    invoicedUnits,
    counted,
    unreadable,
    outsideWindow,
    status,
    shortBy: status === "short" ? unitsSold - invoicedUnits : 0,
  };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * The result in plain words, for the page and the export. States the arithmetic and asks the seller
 * to check what the arithmetic cannot, and says nothing about whether Amazon will accept anything.
 */
export function coverageSentence(c: InvoiceCoverage): string {
  const notes: string[] = [];
  if (c.unreadable > 0)
    notes.push(
      `${c.unreadable} checked ${plural(c.unreadable, "invoice had", "invoices had")} no quantity we could read and ${plural(c.unreadable, "is", "are")} not counted.`,
    );
  if (c.outsideWindow > 0)
    notes.push(
      `${c.outsideWindow} ${plural(c.outsideWindow, "invoice is", "invoices are")} dated outside the 365 days and ${plural(c.outsideWindow, "is", "are")} not counted.`,
    );
  const tail = notes.length ? ` ${notes.join(" ")}` : "";
  if (c.status === "none")
    return `No invoice has a quantity we could read yet. Check each invoice and we add them up against the ${c.unitsSold} units you sold.${tail}`;
  const shown = `Your checked invoices show ${c.invoicedUnits} units in total, counting every line on them. You sold ${c.unitsSold}.`;
  if (c.status === "short")
    return `${shown} They fall short by ${c.shortBy}. Amazon asks for invoices that cover what you sold in the 365 days before its notice, so ask your suppliers for the missing invoices.${tail}`;
  return `${shown} The numbers add up. Check that the lines are for the products named in your notice.${tail}`;
}

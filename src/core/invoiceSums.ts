/**
 * The two sums behind an invoice check, written out (G-02, 12 Oct 2026).
 *
 * A document check already compares an invoice with the 365-day window and, with a sales figure,
 * with the units sold, but it reports a verdict per field. A seller (or a helper testing the tool)
 * wants to see the arithmetic: which two dates, how many days, against what; how many units on the
 * invoice, against how many sold. Showing the working is also the honest form of the claim, since
 * the seller can see exactly what was compared with what.
 *
 * Nothing here is new knowledge. Days come from `documentDateReadings` and `daysBetween`, the same
 * reader the field comparison uses, so the sum can never disagree with the finding above it, and
 * units come from `invoiceCoverage`. It says "inside the window" or "the numbers add up", never
 * that Amazon will accept anything, and it says which date the window was counted from.
 */

import type { DocumentCheckResult } from "./documentCheck";
import { documentDateReadings, daysBetween } from "./documentDate";
import { invoiceCoverage, coverageSentence, type InvoiceCoverage } from "./invoiceCoverage";
import { formatDay } from "./noticeDate";

export const WINDOW_DAYS = 365;

export interface DaysSum {
  /** The invoice date, YYYY-MM-DD, when the check found exactly one reading of it. */
  invoiceDay: string | null;
  /** The day the 365 days are counted back from. */
  anchorDay: string;
  /** Whether that is the notice's own date or only today's date. */
  anchor: "notice" | "today";
  /** Whole days from the invoice date to the anchor. Null when there is no single date to count. */
  days: number | null;
  /** The invoice could be read as more than one day; both are listed and none is counted. */
  readings: string[];
  sentence: string;
}

export interface InvoiceSums {
  days: DaysSum | null;
  units: { coverage: InvoiceCoverage; sentence: string } | null;
}

const plural = (n: number) => (n === 1 ? "day" : "days");

function daysSum(
  result: DocumentCheckResult,
  noticeDate: string | undefined,
  today: string,
): DaysSum | null {
  const finding = result.findings.find((f) => /^issue date\b/i.test(f.field.trim()) && f.observed);
  if (!finding) return null;
  const readings = documentDateReadings(finding.observed!);
  const anchor = noticeDate ? "notice" : "today";
  const anchorDay = noticeDate ?? today;
  const counted = noticeDate
    ? `your notice is dated ${formatDay(anchorDay)}`
    : `counted from today, ${formatDay(anchorDay)}, because no notice date was entered`;

  if (readings.length === 0) {
    return {
      invoiceDay: null,
      anchorDay,
      anchor,
      days: null,
      readings,
      sentence:
        "No full date (day, month and year) could be read from the invoice, so the days cannot be counted. Check the date on the original.",
    };
  }
  if (readings.length > 1) {
    return {
      invoiceDay: null,
      anchorDay,
      anchor,
      days: null,
      readings,
      sentence: `The invoice date can be read as ${readings.map(formatDay).join(" or ")}, so the days are not counted. Check which the supplier means.`,
    };
  }
  const invoiceDay = readings[0]!;
  const days = daysBetween(invoiceDay, anchorDay);
  let verdict: string;
  if (days < 0) {
    verdict = `The invoice is dated after that day, so it is not within the ${WINDOW_DAYS} days before it. Check the date on the original.`;
  } else if (days <= WINDOW_DAYS) {
    verdict = `${days} ${plural(days)} against the ${WINDOW_DAYS} Amazon usually asks about: inside the window.`;
  } else {
    verdict = `${days} ${plural(days)} against the ${WINDOW_DAYS} Amazon usually asks about: ${days - WINDOW_DAYS} ${plural(days - WINDOW_DAYS)} outside the window.`;
  }
  return {
    invoiceDay,
    anchorDay,
    anchor,
    days,
    readings,
    sentence: `The invoice is dated ${formatDay(invoiceDay)} and ${counted}. ${verdict}`,
  };
}

export function invoiceSums(
  result: DocumentCheckResult,
  options: { noticeDate?: string; today: string; unitsSold?: number },
): InvoiceSums {
  const days = daysSum(result, options.noticeDate, options.today);
  const coverage = invoiceCoverage(
    [
      {
        recordId: "invoice",
        at: options.today,
        contextKey: "",
        outcome: { kind: "fields", result },
      },
    ],
    options.unitsSold,
  );
  return { days, units: coverage ? { coverage, sentence: coverageSentence(coverage) } : null };
}

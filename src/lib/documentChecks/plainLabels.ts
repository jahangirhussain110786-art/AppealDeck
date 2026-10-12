/**
 * Plain-language row labels for the document check (B3, 6 Oct 2026).
 *
 * The evidence matrix writes each field the way Amazon's requirement reads ("line items mappable to
 * the ASIN(s)"), and that wording is also the key a stored check is matched on, so it must not
 * change. A seller reads the card, not the matrix, so the labels are mapped at display time only.
 * A field with no plain version is shown exactly as stored.
 */
const PLAIN: ReadonlyArray<readonly [RegExp, string]> = [
  [/^line items mappable to the ASIN/i, "Does it list the product Amazon named?"],
  [/^invoiced quantity consistent with units sold/i, "Do the quantities match what you sold?"],
  // G-108 (12 Oct 2026): the rest of the supplier-invoice rows, as questions a seller can answer.
  [/^supplier business name/i, "Is the supplier's business name printed?"],
  [/^supplier physical address/i, "Is the supplier's street address printed?"],
  [/^supplier phone/i, "Is a phone number or email for the supplier printed?"],
  [/^supplier website/i, "Is the supplier's website printed?"],
  [/^issue date \(within 365 days\)/i, "Is the invoice dated within the last 365 days?"],
  [
    /^your business name and address as the buyer/i,
    "Is your business name and address printed as the buyer?",
  ],
];

export function plainFieldLabel(field: string): string {
  const hit = PLAIN.find(([pattern]) => pattern.test(field.trim()));
  return hit ? hit[1] : field;
}

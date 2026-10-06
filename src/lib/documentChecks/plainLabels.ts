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
];

export function plainFieldLabel(field: string): string {
  const hit = PLAIN.find(([pattern]) => pattern.test(field.trim()));
  return hit ? hit[1] : field;
}

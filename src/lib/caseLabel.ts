/**
 * The seller's own name for a case (G-60, 12 Oct 2026): a client, a store, or whatever they call it.
 *
 * Someone running ten or fifteen accounts cannot tell "Product safety · case 4f2a91" from the next
 * "Product safety · case b71c03". The label is the seller's, optional, and lives with the case in the
 * encrypted vault; it is never sent anywhere. It is deliberately NOT written into the index of the
 * upload pack, which goes to Amazon: a client's name is the seller's business, not Amazon's. It is
 * written into the seller's own exports and record.
 */

export const CASE_LABEL_MAX = 80;

/** What a typed label becomes: one line, no control characters, trimmed and capped. */
export function cleanCaseLabel(input: string): string {
  const oneLine = Array.from(input)
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? " " : c))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  // By character, not by UTF-16 unit, so a long label never ends in half of an emoji.
  return Array.from(oneLine).slice(0, CASE_LABEL_MAX).join("").trim();
}

/** The label of a case, or "" when it has none. */
export function labelOf(workspace: { label?: string } | null | undefined): string {
  return cleanCaseLabel(workspace?.label ?? "");
}

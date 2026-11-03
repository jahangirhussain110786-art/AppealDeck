/** A heading's anchor. Headings are unique within a page, so the slug is too. */
export function anchorId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildClipboardText(
  sections: { heading: string; body: string }[],
  edits: Record<number, string>,
): string {
  const parts = sections.map((s, i) => {
    return s.heading + "\n" + (edits[i] !== undefined ? edits[i] : s.body);
  });
  return parts.join("\n\n").trim();
}

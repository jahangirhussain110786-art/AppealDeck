/**
 * A reading estimate for the guides hub (2 Nov 2026).
 *
 * Counts the words a reader will actually see: every string in the content object, titles and
 * section text alike, at roughly 220 words a minute. Rounded and floored at two, so a short note
 * never claims to be a one-minute read. The label says "min read" because it is an estimate.
 */
const WORDS_PER_MINUTE = 220;
const FLOOR_MINUTES = 2;

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === "string") {
    into.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, into);
  }
}

export function readingMinutes(content: unknown): number {
  const strings: string[] = [];
  collectStrings(content, strings);
  const words = strings.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(FLOOR_MINUTES, Math.round(words / WORDS_PER_MINUTE));
}

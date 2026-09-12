/**
 * Splits a headline string around one accent word/phrase for the
 * <AccentWord> treatment (AM-22 — one accent word per major headline).
 * The full copy stays in src/content/*.ts as plain text; this only decides
 * where to apply the visual accent at render time. Returns null if the
 * accent phrase isn't found, so a future copy edit degrades to plain text
 * instead of silently rendering nothing.
 */
export function splitAccent(
  text: string,
  accent: string,
): { pre: string; accent: string; post: string } | null {
  const i = text.indexOf(accent);
  if (i === -1) return null;
  return {
    pre: text.slice(0, i),
    accent,
    post: text.slice(i + accent.length),
  };
}

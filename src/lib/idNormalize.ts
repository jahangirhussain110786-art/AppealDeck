// Invisible paste-artifact characters, written as escapes so they can be seen in review: zero-width
// space (U+200B), zero-width non-joiner (U+200C), zero-width joiner (U+200D) and the zero-width
// no-break space / byte-order mark (U+FEFF).
const INVISIBLE_CHARS = /[​‌‍﻿]/g;

/**
 * Strips those invisible paste artifacts from a block of pasted text, leaving every visible
 * character, line break and space exactly where it was.
 *
 * Added 23 Sep 2026: a notice pasted out of a mail client can carry a zero-width space *inside* an
 * identifier, and `entities.ts`'s `\bB0[A-Z0-9]{8}\b` then matches nothing — verified, not assumed:
 * "B08N5​WRWNW" extracts as `null` while the clean string extracts fine. The ASIN disappears
 * with no error and the seller cannot tell. (A non-breaking space is harmless by comparison,
 * because JavaScript's `\s` already matches it.)
 *
 * This must run where the text is *stored*, never inside the extractor: `entities.ts` guarantees
 * `raw.slice(start, end) === value` so the UI can highlight the seller's own words, and sanitising
 * after the spans are computed would slide every offset. Length-preserving alternatives were
 * considered and rejected — a zero-width character left in place still defeats the match.
 *
 * (A `normalizePastedId` and a `looksLikeAsin` sat beside this until 30 Sep 2026. They were built
 * for an ID input field that has never existed and nothing called them; git history has them.)
 */
export function stripInvisibleChars(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, "");
}

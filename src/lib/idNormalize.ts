// AA-31's "ID paste normaliser" — sellers routinely paste Amazon case IDs, order IDs, and ASINs
// with stray whitespace, inconsistent casing, or copy-paste artifacts (curly quotes, zero-width
// spaces from a rich-text source). This normalizes a pasted identifier to the form Amazon itself
// displays, without guessing at or inventing a value. Pure function, no side effects.

// Invisible/paste-artifact characters (verified via `od -c`, not just visually — they render as
// nothing in most editors): zero-width space (U+200B), zero-width non-joiner (U+200C), zero-width
// joiner (U+200D), zero-width no-break space / BOM (U+FEFF).
const INVISIBLE_CHARS = /[​‌‍﻿]/g;
// Curly quotes a rich-text source can introduce (U+2018/2019 single, U+201C/201D double), which
// should never survive into an ID.
const CURLY_SINGLE_QUOTES = /[‘’]/g;
const CURLY_DOUBLE_QUOTES = /[“”]/g;

/**
 * Normalizes a pasted Amazon case/order ID or ASIN: trims whitespace, collapses internal
 * whitespace runs, strips invisible Unicode paste artifacts, and uppercases (Amazon IDs are
 * case-insensitive but conventionally shown upper-case). Returns an empty string for
 * empty/whitespace-only input rather than throwing.
 */
export function normalizePastedId(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS, "")
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Strips the same invisible paste artifacts from a block of pasted text, leaving every visible
 * character, line break and space exactly where it was.
 *
 * Why this exists separately from `normalizePastedId` (23 Sep 2026): a notice pasted out of a mail
 * client can carry a zero-width space *inside* an identifier, and `entities.ts`'s `\bB0[A-Z0-9]{8}\b`
 * then matches nothing — verified, not assumed: "B08N5​WRWNW" extracts as `null` while the
 * clean string extracts fine. The ASIN disappears with no error and the seller cannot tell. (A
 * non-breaking space is harmless by comparison, because JavaScript's `\s` already matches it.)
 *
 * This must run where the text is *stored*, never inside the extractor: `entities.ts` guarantees
 * `raw.slice(start, end) === value` so the UI can highlight the seller's own words, and sanitising
 * after the spans are computed would slide every offset. Length-preserving alternatives were
 * considered and rejected — a zero-width character left in place still defeats the match.
 */
export function stripInvisibleChars(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, "");
}

/**
 * ASIN shape check — 10 alphanumeric characters. Amazon ASINs conventionally start with "B0" in
 * most marketplaces, but not universally, so this only checks length/charset, never a stricter
 * pattern that could reject a genuinely valid ASIN.
 */
export function looksLikeAsin(normalized: string): boolean {
  return /^[A-Z0-9]{10}$/.test(normalized);
}

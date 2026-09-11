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
 * ASIN shape check — 10 alphanumeric characters. Amazon ASINs conventionally start with "B0" in
 * most marketplaces, but not universally, so this only checks length/charset, never a stricter
 * pattern that could reject a genuinely valid ASIN.
 */
export function looksLikeAsin(normalized: string): boolean {
  return /^[A-Z0-9]{10}$/.test(normalized);
}

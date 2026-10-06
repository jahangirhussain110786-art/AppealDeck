import { normalizeNoticeText } from "@/core/noticeText";

/** Below this, text is treated as typed rather than pasted. */
const PASTE_LENGTH = 120;

/**
 * Cleans a block of pasted text so the rest of the product reads what the seller sees.
 *
 * Added 23 Sep 2026 for invisible paste artifacts: a notice pasted out of a mail client can carry a
 * zero-width space *inside* an identifier, and `entities.ts`'s `\bB0[A-Z0-9]{8}\b` then matches
 * nothing — verified, not assumed: an ASIN with a zero-width space in the middle extracts as `null`
 * while the clean string extracts fine. The ASIN disappears with no error and the seller cannot
 * tell.
 *
 * 6 Oct 2026: widened to the whole normaliser (`normalizeNoticeText`) for anything that looks like
 * a paste, because tabs, `&nbsp;`, markdown bold, `>` quote markers and hard-wrapped lines defeated
 * the extractors in the same silent way. Text shorter than a paste (under 120 characters) only gets
 * the light clean — invisible characters and odd spaces — so a seller typing into a controlled
 * textarea never has a line joined or a marker removed under the cursor. `normalizeNoticeText` is
 * idempotent, so a page that normalised in the textarea and a server that normalises again agree
 * about every offset.
 *
 * This must run where the text is *stored*, never inside the extractor: `entities.ts` guarantees
 * `raw.slice(start, end) === value` so the UI can highlight the seller's own words, and sanitising
 * after the spans are computed would slide every offset.
 *
 * (A `normalizePastedId` and a `looksLikeAsin` sat beside this until 30 Sep 2026. They were built
 * for an ID input field that has never existed and nothing called them; git history has them. Spaced,
 * lower-case and OCR-damaged identifiers are now read by `entities.ts` itself.)
 */
export function stripInvisibleChars(raw: string): string {
  return normalizeNoticeText(raw, { level: raw.length >= PASTE_LENGTH ? "full" : "light" });
}

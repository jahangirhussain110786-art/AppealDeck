import { normalizeNoticeText } from "@/core/noticeText";

/**
 * The light clean, for a controlled textarea's `onChange`: invisible characters and odd spaces
 * only. It is the ONLY thing that may run on each keystroke.
 *
 * 7 Oct 2026: this used to run the whole normaliser on anything of 120 characters or more. Typing
 * into a controlled textarea then lost its Enter, its spaces and a `>` (the normaliser collapses
 * blank lines, double spaces, quote markers and wrapped lines), glued a lowercase word typed on a
 * new line to the line above, and left the controlled value different from the DOM, so the caret
 * jumped. The full normaliser now runs only on a paste (`insertPasted`) and, on the server, once the
 * text is submitted.
 *
 * Invisible-character removal still matters for the reason it was written (23 Sep 2026): a notice
 * pasted out of a mail client can carry a zero-width space *inside* an identifier, and
 * `entities.ts`'s `\bB0[A-Z0-9]{8}\b` then matches nothing. The text must be cleaned where it is
 * *stored*, never inside the extractor: `entities.ts` guarantees `raw.slice(start, end) === value`,
 * and sanitising after the spans are computed would slide every offset.
 */
export function stripInvisibleChars(raw: string): string {
  return normalizeNoticeText(raw, { level: "light" });
}

export interface PasteResult {
  /** The text the field should now hold. */
  value: string;
  /** Where the caret belongs, just after what was pasted. */
  caret: number;
}

/**
 * What a textarea holds after `pasted` replaces the characters between `start` and `end`. The
 * pasted text gets the full normaliser (tabs, `&nbsp;`, markdown, quote markers, wrapped lines); the
 * text the seller already typed is left exactly as it is. `maxLength` cuts the result, because the
 * browser's own `maxLength` does not apply once the paste event is handled by hand.
 */
export function insertPasted(
  current: string,
  start: number,
  end: number,
  pasted: string,
  maxLength?: number,
): PasteResult {
  const from = Math.max(0, Math.min(start, current.length));
  const to = Math.max(from, Math.min(end, current.length));
  const clean = normalizeNoticeText(pasted);
  let value = current.slice(0, from) + clean + current.slice(to);
  let caret = from + clean.length;
  if (maxLength !== undefined && value.length > maxLength) {
    value = value.slice(0, maxLength);
    caret = Math.min(caret, maxLength);
  }
  return { value: stripInvisibleChars(value), caret };
}

/** The structural slice of a React paste event that `handlePaste` needs. */
interface PasteEventLike {
  clipboardData: { getData(type: string): string };
  currentTarget: HTMLTextAreaElement;
  preventDefault(): void;
}

/**
 * An `onPaste` handler body: normalises what was pasted, inserts it at the selection and hands the
 * new value to `apply`. Does nothing (and lets the browser paste normally) when the clipboard holds
 * no text.
 */
export function handlePaste(
  event: PasteEventLike,
  apply: (value: string) => void,
  maxLength?: number,
): void {
  const pasted = event.clipboardData.getData("text");
  if (!pasted) return;
  event.preventDefault();
  const el = event.currentTarget;
  const { value, caret } = insertPasted(
    el.value,
    el.selectionStart ?? el.value.length,
    el.selectionEnd ?? el.value.length,
    pasted,
    maxLength,
  );
  apply(value);
  // The value is controlled, so the browser moves the caret to the end when it is replaced.
  requestAnimationFrame(() => {
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      // The element may be gone, or not support selection: the caret position is a courtesy.
    }
  });
}

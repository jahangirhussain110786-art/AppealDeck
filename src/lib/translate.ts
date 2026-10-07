/**
 * Translating a notice into English with the browser's own on-device translator.
 *
 * AppealDeck has no translation engine and sends nothing anywhere to translate: where the browser
 * offers its built-in `Translator` (Chrome and other Chromium browsers), the text is translated on
 * the seller's device, and the English result is then decoded like any pasted notice. Where the
 * browser has no translator, nothing is attempted and the seller is told so. The founder's
 * instruction (7 Oct 2026) was to wire up an existing, smart technique and not to build one; this
 * file is the wiring, and the translator's output is always presented as a machine translation
 * for the seller to check against the original (a date, an ID or a number can change in
 * translation).
 */
interface TranslatorInstance {
  translate(text: string): Promise<string>;
  destroy?: () => void;
}
interface TranslatorStatic {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
}

export type TranslateResult =
  | { ok: true; text: string }
  | { ok: false; reason: "no_browser_support" | "language_unavailable" | "failed" };

export function browserTranslator(): TranslatorStatic | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { Translator?: TranslatorStatic }).Translator;
  return candidate && typeof candidate.create === "function" ? candidate : null;
}

/** Whether this browser can translate from `language` to English. Never throws. */
export async function canTranslateToEnglish(
  language: string,
  api: TranslatorStatic | null = browserTranslator(),
): Promise<boolean> {
  if (!api) return false;
  try {
    const state = await api.availability({ sourceLanguage: language, targetLanguage: "en" });
    return state !== "unavailable";
  } catch {
    return false;
  }
}

const CHUNK_LIMIT = 3000;

/** Splits on blank lines and then on lines, so no chunk breaks a sentence in the middle of a line. */
export function chunkForTranslation(text: string, limit = CHUNK_LIMIT): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > limit) {
      chunks.push(current);
      current = "";
    }
    // A single line longer than the limit is cut at spaces rather than refused.
    if (line.length > limit) {
      for (let i = 0; i < line.length; i += limit) {
        if (current) chunks.push(current);
        current = line.slice(i, i + limit);
      }
      continue;
    }
    current = current ? `${current}\n${line}` : line;
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function translateToEnglish(
  text: string,
  language: string,
  api: TranslatorStatic | null = browserTranslator(),
): Promise<TranslateResult> {
  if (!api) return { ok: false, reason: "no_browser_support" };
  if (!(await canTranslateToEnglish(language, api)))
    return { ok: false, reason: "language_unavailable" };
  let translator: TranslatorInstance | undefined;
  try {
    translator = await api.create({ sourceLanguage: language, targetLanguage: "en" });
    const parts: string[] = [];
    for (const chunk of chunkForTranslation(text)) parts.push(await translator.translate(chunk));
    const out = parts.join("\n").trim();
    return out ? { ok: true, text: out } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  } finally {
    translator?.destroy?.();
  }
}

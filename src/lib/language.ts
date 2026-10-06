/**
 * Which language a pasted notice is written in — enough to tell a seller "this is German" instead of
 * decoding it as English and returning UNKNOWN.
 *
 * Added 6 Oct 2026. A seller whose Seller Central is set to German, Japanese or Turkish pastes what
 * they see; the decoder read it as English, found nothing, and either said "kind: UNKNOWN" (Latin
 * scripts) or "this doesn't look like an Amazon notice" (Japanese). Neither tells them what is
 * wrong or what to do. The fix for the seller is one setting in Seller Central, so naming the
 * language and saying so is the whole feature.
 *
 * Deliberately small: stopword frequency for the Latin-script languages and script ranges for the
 * rest. It claims a language only when the evidence is plain, and otherwise stays "English", so a
 * real English notice that quotes a few foreign words is never refused.
 */

export interface LanguageGuess {
  /** ISO 639-1 code, or "und" when nothing could be judged. */
  code: string;
  /** English name, for the sentence shown to the seller. */
  name: string;
  /** True only for English. */
  supported: boolean;
}

const ENGLISH: LanguageGuess = { code: "en", name: "English", supported: true };

/** Frequent function words per language, chosen so none is also an everyday English word. */
const STOPWORDS: Readonly<Record<string, { name: string; words: string }>> = {
  en: {
    name: "English",
    words:
      "the and to of is in your you we that for this are with be on not have will has been can our or if as by from at it please was were may must should account seller amazon",
  },
  de: {
    name: "German",
    words:
      "der die das und ist nicht ein eine einen mit für auf von zu den dem des sie ihr ihre ihren wir werden wurde wurden haben hat sich auch oder wenn bitte konto verkäufer wurde sind nach über bei aus",
  },
  fr: {
    name: "French",
    words:
      "le la les et est une un des du de pour que qui dans pas vous votre vos nous avec sur par ce cette sont été compte vendeur ont être doit peut sera aux au",
  },
  es: {
    name: "Spanish",
    words:
      "el los las y es una un del para que por con su sus se usted cuenta vendedor sido han está ha han lo al como más pero sus esta este fue",
  },
  it: {
    name: "Italian",
    words:
      "il lo gli le e è una un di per che con non si suo sua sono stato stata venditore vostra nel nella della dei delle da questo questa può deve",
  },
  pt: {
    name: "Portuguese",
    words:
      "o os as e é uma um do da dos das para que com não se seu sua você conta vendedor foi são pelo pela está tem deve pode mais",
  },
  nl: {
    name: "Dutch",
    words:
      "de het een en is niet van voor met op aan uw wij zijn werd verkoper bij door ook dit deze kunt moet wordt heeft",
  },
  tr: {
    name: "Turkish",
    words:
      "ve bir bu için ile olarak değil hesap satıcı sizin sizi olan daha çok hesabınız lütfen kadar veya ancak tarafından",
  },
  pl: {
    name: "Polish",
    words:
      "i w nie się na z do jest że to konto sprzedawcy jako przez lub oraz przy dla zostało został twoje twoje",
  },
  sv: {
    name: "Swedish",
    words:
      "och att det är inte som en med för på av har kan konto säljare ditt din vi vara blir om",
  },
};

const STOP_SETS: ReadonlyArray<readonly [string, string, ReadonlySet<string>]> = Object.entries(
  STOPWORDS,
).map(([code, v]) => [code, v.name, new Set(v.words.split(" "))] as const);

interface ScriptRule {
  code: string;
  name: string;
  pattern: RegExp;
}

const SCRIPTS: ReadonlyArray<ScriptRule> = [
  { code: "ja", name: "Japanese", pattern: /[\p{Script=Hiragana}\p{Script=Katakana}]/gu },
  { code: "ko", name: "Korean", pattern: /\p{Script=Hangul}/gu },
  { code: "zh", name: "Chinese", pattern: /\p{Script=Han}/gu },
  { code: "ar", name: "Arabic", pattern: /\p{Script=Arabic}/gu },
  { code: "ru", name: "Russian", pattern: /\p{Script=Cyrillic}/gu },
  { code: "hi", name: "Hindi", pattern: /\p{Script=Devanagari}/gu },
  { code: "th", name: "Thai", pattern: /\p{Script=Thai}/gu },
  { code: "he", name: "Hebrew", pattern: /\p{Script=Hebrew}/gu },
  { code: "el", name: "Greek", pattern: /\p{Script=Greek}/gu },
];

const MIN_LETTERS = 25;
const MIN_WORDS = 12;

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

export function detectLanguage(text: string): LanguageGuess {
  // A very long paste is judged on its opening and closing, which is all a language needs.
  const sample = text.length > 6000 ? `${text.slice(0, 3000)}\n${text.slice(-3000)}` : text;
  const letters = count(sample, /\p{L}/gu);
  if (letters < MIN_LETTERS) return ENGLISH;

  const perScript = SCRIPTS.map((s) => ({ ...s, n: count(sample, s.pattern) }));
  const nonLatin = perScript.reduce((sum, s) => sum + s.n, 0);
  if (nonLatin / letters > 0.3) {
    // Japanese is written with Han characters as well as kana, so any real amount of kana wins.
    const kana = perScript.find((s) => s.code === "ja")!;
    if (kana.n / letters > 0.03) return { code: "ja", name: kana.name, supported: false };
    const top = [...perScript].sort((a, b) => b.n - a.n)[0]!;
    return { code: top.code, name: top.name, supported: false };
  }

  const words = sample.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  if (words.length < MIN_WORDS) return ENGLISH;
  const scores = STOP_SETS.map(([code, name, set]) => {
    let hits = 0;
    for (const w of words) if (set.has(w)) hits++;
    return { code, name, score: hits / words.length };
  });
  const english = scores.find((s) => s.code === "en")!.score;
  const best = scores.filter((s) => s.code !== "en").sort((a, b) => b.score - a.score)[0]!;
  // A foreign language has to be plainly ahead: frequent, and well clear of how English the text is.
  if (best.score >= 0.12 && best.score > english * 1.5) {
    return { code: best.code, name: best.name, supported: false };
  }
  return ENGLISH;
}

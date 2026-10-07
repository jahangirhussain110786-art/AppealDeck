/**
 * The questions a questionnaire asks, read from the response page and the notice.
 *
 * Added 23 Sep 2026 (audit item L). A questionnaire response was one heading over one free-text
 * box, so a seller answering five set questions wrote an essay, and nothing checked that each
 * question had been answered. Amazon's own moderators describe the questionnaire as a form to be
 * answered in order, and replacing it with a general appeal is a known way to be refused.
 *
 * A question counts only as the seller's own text shows it: a sentence ending in a question mark,
 * with any list numbering removed, in the order it appears. Nothing is paraphrased, merged or
 * invented — if we cannot see the questions, the seller answers in one box as before.
 */

/** List markers: "1.", "1)", "(2)", "a)", "Q3:", bullets. */
const LIST_MARKER = /^(?:\(?\d{1,2}[.)]|\(?[a-h][.)]|q\s?\d{1,2}[:.)]|[-•*–])\s*/i;

/** Questions that are about us, not the case. */
const NOT_ABOUT_THE_CASE =
  /\b(?:contact us|seller support|help page|help centre|help center)\b|^(?:do you have|have|any) (?:any |more )?questions\?$|\b(?:can|may|how can) we help\b/i;

/**
 * A numbered item that asks for an answer without a question mark: "Describe how you source your
 * products." Amazon mixes these with true questions in one numbered form, and reading only the
 * question marks silently dropped the rest, so a response omitted a question Amazon had asked
 * (found 7 Oct 2026). Read only when the same list also holds a question, so a numbered list of
 * documents to send is never mistaken for a questionnaire, and never when it asks for a file,
 * which is a record rather than an answer.
 */
const PROMPT_ITEM =
  /^(?:please\s+)?(?:describe|explain|state|list|detail|outline|specify|identify|tell us|provide (?:a |an )?(?:description|explanation|summary|list|brief)|confirm (?:whether|if|that))\b/i;
const ASKS_FOR_A_FILE =
  /\b(?:invoices?|documents?|upload|attach(?:ment)?s?|screenshots?|photos?|copy of|statement|certificate)\b/i;

export function questionsIn(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const lines = text.split("\n");
  const listItems = lines.filter((l) => LIST_MARKER.test(l.trim()));
  const mixedList = listItems.length >= 2 && listItems.some((l) => l.trim().endsWith("?"));
  for (const line of lines) {
    if (mixedList && LIST_MARKER.test(line.trim()) && !line.includes("?")) {
      const item = line.trim().replace(LIST_MARKER, "").trim();
      if (
        PROMPT_ITEM.test(item) &&
        !ASKS_FOR_A_FILE.test(item) &&
        item.length >= 12 &&
        item.length <= 500 &&
        !seen.has(item.toLowerCase())
      ) {
        seen.add(item.toLowerCase());
        out.push(item);
      }
      continue;
    }
    // Several questions can share a line: "Answer: What happened? What have you changed?"
    for (const piece of line.split(/(?<=\?)\s+/)) {
      let q = piece.trim();
      if (!q.endsWith("?")) continue;
      // "Please answer the following questions: What caused it?" — keep what follows the colon.
      const colon = q.lastIndexOf(":");
      if (colon > 0 && !q.slice(0, colon).includes("?")) q = q.slice(colon + 1).trim();
      q = q.replace(LIST_MARKER, "").trim();
      if (q.length < 12 || q.length > 500 || NOT_ABOUT_THE_CASE.test(q)) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}

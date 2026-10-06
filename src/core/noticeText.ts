/**
 * One place that turns whatever a seller pasted into the text the rest of the product reads.
 *
 * Added 6 Oct 2026 after a degraded-paste sweep (84 cases). A notice copied out of a mail client, a
 * browser, a PDF or a chat arrives with tabs, non-breaking spaces, HTML entities, markdown bold,
 * `>` quote markers, soft hyphens, hard-wrapped lines and smart punctuation, and every one of those
 * silently defeated an extractor: a 72-column email lost its 90-day window to a line break, a
 * `**Date:** 12 September 2026` line lost its receipt date to the asterisks, an `&nbsp;` between
 * "Plan" and "of" classified a whole notice UNKNOWN. None of it raised an error. The seller just got
 * a worse decode and no way to know why.
 *
 * **Callers store the normalised text.** `entities.ts` promises `raw.slice(start, end) === value`
 * and that holds on whatever string it is given, so the text that is displayed and highlighted must
 * be the text that was normalised. `/api/decode` returns it as `normalizedText`. The function is
 * idempotent (normalising its own output changes nothing), which is what keeps a client that already
 * normalised in the textarea and a server that normalises again in agreement about every offset.
 *
 * Besides the normaliser this file holds the small pure detectors that look at the *shape* of a
 * paste rather than its meaning: several notices pasted together, the seller's own appeal pasted by
 * mistake, OCR garbage, an Account Health warning that is not an enforcement action, and the
 * speaker turns of a Seller Support thread.
 */

/* ------------------------------------------------------------------ normaliser */

/** Zero-width characters, the byte-order mark and the soft hyphen. */
const cp = (...codes: number[]): string => codes.map((c) => String.fromCharCode(c)).join("");
const INVISIBLE = new RegExp(`[${cp(0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad)}]`, "g");
/** Tabs and every flavour of non-breaking or thin space (U+00A0, U+1680, U+2000-200A, U+202F, U+205F, U+3000). */
const ODD_SPACES = new RegExp(
  `[\\t${cp(0x00a0, 0x1680)}${cp(0x2000)}-${cp(0x200a)}${cp(0x202f, 0x205f, 0x3000)}]`,
  "g",
);
const LINE_BREAKS = new RegExp(`[${cp(0x2028, 0x2029, 0x0b, 0x0c)}]`, "g");
/** Tabs and every flavour of non-breaking or thin space. */

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  ndash: "-",
  mdash: "-",
  hellip: "...",
  shy: "",
  zwnj: "",
  zwj: "",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
};

function decodeEntitiesOnce(text: string): string {
  return text.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1]!.toLowerCase() === "x" ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return whole;
      if (code >= 0xd800 && code <= 0xdfff) return whole;
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

function decodeEntities(text: string): string {
  // Repeated, so a double-encoded "&amp;nbsp;" settles to the same thing a second pass would give.
  let current = text;
  for (let i = 0; i < 3; i++) {
    const next = decodeEntitiesOnce(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

const KNOWN_TAGS =
  "a|b|i|u|p|br|hr|div|span|strong|em|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|h[1-6]|font|img|center|blockquote|pre|code|section|article|header|footer|small|big|sup|sub|body|html|head|title|meta|style|script|o:p";

function stripHtml(text: string): string {
  if (!/<\/?[a-zA-Z!]/.test(text)) return text;
  return (
    text
      .replace(/<!--[\s\S]{0,5000}?-->/g, "")
      // The target of a link is evidence the authenticity check needs; the visible text rarely is.
      .replace(/<a\s[^<>]{0,500}?href\s*=\s*["']([^"'<>]{1,500})["'][^<>]{0,500}>/gi, " $1 ")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(?:p|div|li|tr|h[1-6]|table|blockquote|ul|ol)\s*>/gi, "\n")
      // Only real HTML tags: "<noreply@amazon.com>" is an address and "<https://…>" is a link.
      .replace(new RegExp(`<\\/?(?:${KNOWN_TAGS})(?:\\s[^<>]{0,500})?\\/?>`, "gi"), "")
  );
}

const HEADER_LABELS = /(?:^|[ ])(From|To|Cc|Bcc|Date|Sent|Subject|Received|Reply-To):\s/g;

/** A header block flattened onto one line ("From: x Date: y Subject: z") goes back to one line each. */
function explodeFlattenedHeaders(line: string): string {
  const hits = [...line.matchAll(HEADER_LABELS)];
  if (hits.length === 1) {
    // A lone "Date:" in the middle of a line whose line breaks were lost, followed by something
    // that reads as a date: the header belongs on its own line, or the receipt date is never found.
    const only = hits[0]!;
    const at = only.index! + 1;
    if (
      only.index! > 0 &&
      /^(?:Date|Sent|Received)$/.test(only[1]!) &&
      /\d/.test(line.slice(at, at + 40))
    ) {
      return `${line.slice(0, only.index!).trimEnd()}\n${line.slice(at)}`;
    }
    return line;
  }
  if (hits.length < 2) return line;
  let out = "";
  let last = 0;
  hits.forEach((m, i) => {
    const labelAt = m.index! + (m[0].startsWith(" ") ? 1 : 0);
    if (i === 0) return;
    out += `${line.slice(last, m.index!).trimEnd()}\n`;
    // (a flattened header run is the one place a trailing space is dropped: it is being split here)
    last = labelAt;
  });
  return out + line.slice(last);
}

const HEADER_LINE =
  /^(?:from|to|cc|bcc|date|sent|subject|received|reply-to|date sent|date received|notification date):/i;
const LIST_ITEM = /^(?:[-*•]|\d{1,3}[.)])\s/;

/** A line being built up from the wrapped lines that were joined into it. Kept as parts so that joining stays linear. */
interface JoinedLine {
  parts: string[];
  length: number;
  words: number;
}

const ENDS_A_SENTENCE = /[.!?:;]["')\]]?$/;

function canJoin(cur: JoinedLine, lastPart: string, next: string): boolean {
  if (lastPart === "" || next === "") return false;
  if (ENDS_A_SENTENCE.test(lastPart.slice(-3))) return false;
  if (HEADER_LINE.test(cur.parts[0]!) || HEADER_LINE.test(next)) return false;
  if (LIST_ITEM.test(next)) return false;
  if (/^[a-z]/.test(next)) return cur.words >= 3 || cur.length >= 25;
  // A number can start the next wrapped line ("... within\n90 days"); only after a long line, so a
  // "Case ID" label above its value is left alone.
  if (/^\d/.test(next)) return cur.length >= 40 && cur.words >= 5;
  return false;
}

export interface NormalizeOptions {
  /**
   * `light` is for text that is being typed: invisible characters and odd spaces only, so a seller
   * typing into a controlled textarea never has a line joined or a quote marker removed under the
   * cursor. `full` is for text that was pasted or is being read.
   */
  level?: "full" | "light";
}

export function normalizeNoticeText(raw: string, options: NormalizeOptions = {}): string {
  let text = (raw ?? "").replace(INVISIBLE, "");
  if (options.level === "light") return text.replace(ODD_SPACES, (c) => (c === "\t" ? c : " "));

  try {
    text = text.normalize("NFKC");
  } catch {
    // Unpairable surrogates: leave the text as it is rather than refuse it.
  }
  text = text.replace(/\r\n?/g, "\n").replace(LINE_BREAKS, "\n");
  if (/[<&]/.test(text)) text = decodeEntities(stripHtml(decodeEntities(text)));
  text = text
    .replace(INVISIBLE, "")
    .replace(ODD_SPACES, " ")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐‑]/g, "-")
    // En and em dashes are the seller's own punctuation; only a dash between digits (an ID or a range) is read as a hyphen.
    .replace(/(?<=\d)[‒-―−](?=\d)/g, "-")
    // Markdown emphasis. Underscores only as a matched pair around text, so "Laboratory: ______"
    // keeps its blank.
    .replace(/\*\*/g, "")
    .replace(/(?<![_\w])__(?=[^\s_])([^\n]{1,200}?)(?<=[^\s_])__(?![_\w])/g, "$1");

  const lines = text.split("\n").flatMap((line) => {
    // Trailing spaces are left alone: a seller typing a space at the end of a line in a normalised
    // textarea must not have it taken away under the cursor.
    const cleaned = line.replace(/^[>\s]+/, "").replace(/ {2,}/g, " ");
    return explodeFlattenedHeaders(cleaned).split("\n");
  });

  // Blank-line runs collapse to one blank line.
  const collapsed: string[] = [];
  for (const line of lines) {
    if (line === "" && collapsed.length > 0 && collapsed[collapsed.length - 1] === "") continue;
    collapsed.push(line);
  }

  // Hyphenation across a line break, then unwrapping of hard-wrapped lines.
  const wordCount = (s: string): number => (s === "" ? 0 : s.split(" ").length);
  const joined: JoinedLine[] = [];
  for (const line of collapsed) {
    const cur = joined[joined.length - 1];
    const lastIndex = cur ? cur.parts.length - 1 : 0;
    const lastPart = cur ? cur.parts[lastIndex]!.trimEnd() : "";
    if (cur && /[A-Za-z]-$/.test(lastPart.slice(-2)) && /^[a-z]/.test(line)) {
      cur.parts[lastIndex] = lastPart.slice(0, -1) + line;
      cur.length += line.length - 1;
      cur.words += wordCount(line) - 1;
    } else if (cur && canJoin(cur, lastPart, line)) {
      cur.parts[lastIndex] = lastPart;
      cur.parts.push(line);
      cur.length += line.length + 1;
      cur.words += wordCount(line);
    } else {
      joined.push({ parts: [line], length: line.length, words: wordCount(line) });
    }
  }
  return joined.map((j) => j.parts.join(" ")).join("\n");
}

/* ------------------------------------------------------------------ several notices in one paste */

const SEPARATOR =
  /^[-_=*~ ]*(?:forwarded message|original message|begin forwarded message)[-_=*~ a-z]*$/i;
const DATE_HEADER_LINE = /^(?:date|sent)\s*:/i;
const SUBJECT_LINE = /^subject\s*:/i;

export interface NoticeSegment {
  /** Offset of the segment's first character in the text it was cut from. */
  start: number;
  end: number;
  text: string;
}

/**
 * Cuts a paste into the separate messages it carries, at `-----Original Message-----` style
 * separators and at the start of each header block. A single forwarded email (one separator, one
 * header block) is one segment; two messages are two.
 */
export function splitNotices(text: string): NoticeSegment[] {
  const lines: Array<{ text: string; start: number }> = [];
  let at = 0;
  for (const line of text.split("\n")) {
    lines.push({ text: line, start: at });
    at += line.length + 1;
  }
  const cuts: number[] = [];
  let seenBody = false;
  let inHeaders = false;
  lines.forEach((line, i) => {
    const t = line.text.trim();
    if (t === "") return;
    if (SEPARATOR.test(t)) {
      if (seenBody) cuts.push(i);
      seenBody = false;
      inHeaders = true;
      return;
    }
    if (HEADER_LINE.test(t)) {
      if (!inHeaders && seenBody) cuts.push(i);
      inHeaders = true;
      return;
    }
    inHeaders = false;
    seenBody = true;
  });
  const bounds = [0, ...cuts.map((i) => lines[i]!.start), text.length];
  const segments: NoticeSegment[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i]!;
    const end = bounds[i + 1]!;
    if (start === end && i > 0) continue;
    segments.push({ start, end, text: text.slice(start, end) });
  }
  return segments.filter((s) => s.text.trim() !== "");
}

/** More than one message pasted into one box. */
export function detectMultipleNotices(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim());
  const dates = lines.filter((l) => DATE_HEADER_LINE.test(l)).length;
  const subjects = lines.filter((l) => SUBJECT_LINE.test(l)).length;
  const markers = lines.filter((l) => SEPARATOR.test(l)).length;
  if (dates >= 2 || subjects >= 2 || markers >= 2) return true;
  if (markers === 1) {
    // A forward is one message after its marker; a reply chain has text and headers before it.
    const first = lines.findIndex((l) => SEPARATOR.test(l));
    return lines.slice(0, first).some((l) => DATE_HEADER_LINE.test(l) || SUBJECT_LINE.test(l));
  }
  return (
    splitNotices(text).filter((s) => s.text.trim().length > 40).length >= 2 && dates + subjects >= 2
  );
}

/* ------------------------------------------------------------------ the seller's own text */

const FIRST_PERSON_APPEAL: ReadonlyArray<RegExp> = [
  /\bI\s+(?:am|’m|'m)\s+writing\s+to\s+(?:appeal|request|ask|dispute)\b/i,
  /\bI\s+(?:would\s+like|wish|want)\s+to\s+appeal\b/i,
  /\bI\s+(?:respectfully\s+)?(?:request|ask)\s+(?:that\s+)?(?:you\s+)?(?:reinstate|reactivate|review)\b/i,
  /\b(?:please\s+)?(?:reinstate|reactivate)\s+my\s+(?:seller\s+|selling\s+)?(?:account|privileges|listings?)\b/i,
  /\bmy\s+(?:seller\s+|selling\s+)?account\s+(?:was|has\s+been|got)\s+(?:suspended|deactivated|blocked)\b/i,
  /\bI\s+(?:apologi[sz]e|take\s+full\s+responsibility|have\s+(?:taken|implemented|reviewed|corrected))\b/i,
  /\bI\s+(?:understand|assure|promise|hope)\b/i,
];
const SIGN_OFF =
  /^\s*(?:sincerely|best\s+regards|kind\s+regards|regards|yours\s+(?:sincerely|faithfully)|thank\s+you\s+for\s+your\s+(?:time|consideration|understanding))\b/im;
const AMAZON_VOICE =
  /\bwe(?:’re|'re|\s+are)\s+(?:writing|unable|not\s+able|sorry)\b|\bwe\s+(?:have\s+)?(?:reviewed|removed|deactivated|suspended|received)\b|\bthank\s+you\s+for\s+(?:your\s+(?:appeal|submission|plan)|contacting|submitting)\b/i;

/**
 * True when the paste reads as the seller writing to Amazon ("I am writing to appeal…", "Please
 * reinstate my account", "Sincerely") rather than Amazon writing to the seller. Decoding the
 * seller's own appeal as a notice produces nonsense, because every phrase in it is about the
 * very things a notice raises.
 */
export function looksLikeSellerText(text: string): boolean {
  if (AMAZON_VOICE.test(text)) return false;
  const first = FIRST_PERSON_APPEAL.filter((re) => re.test(text)).length;
  if (first >= 2) return true;
  return first >= 1 && SIGN_OFF.test(text);
}

/* ------------------------------------------------------------------ OCR and copy garbage */

/** Words an Amazon notice uses. Repairs are only made to a token that becomes one of these. */
const VOCAB: ReadonlySet<string> = new Set(
  (
    "account accounts action actions amazon appeal appeals asin asins authenticity bank buyer buyers central " +
    "closed complaint complaints customer date deactivated deactivation december document documents " +
    "february funds health intellectual invoice invoices january listing listings march metrics notice " +
    "november october order orders performance plan policies policy privileges product products property " +
    "provide reinstate removed response review sales sell selling seller sellers september submit " +
    "supplier suspended suspension subject trademark verification violation violations your within " +
    "april august friday monday saturday sunday thursday tuesday wednesday"
  ).split(" "),
);

function isGarbledToken(token: string): boolean {
  if (token.length < 4) return false;
  if (isDigitRunWithLetter(token)) return true; // 2O26
  if (!/[a-z]/.test(token)) return false; // all-caps tokens are ASINs and codes
  if (/[a-z]{2,}[0158][a-z]+/i.test(token)) return true; // sell1ng, Amaz0n, vi0lations
  // poIicy: a capital I or O inside a lowercase word, counted only when the repair is a known word.
  if (/[a-z]{2,}[IO][a-z]{2,}/.test(token) && repairToken(token) !== token) return true;
  return false;
}

/** "2O26", "l2": a number with a letter standing in for a digit. Mostly digits, so an ASIN never qualifies. */
function isDigitRunWithLetter(token: string): boolean {
  if (!/\d[OlIo]\d/.test(token)) return false;
  return (token.match(/\d/g)?.length ?? 0) / token.length >= 0.7;
}

function repairToken(token: string): string {
  if (isDigitRunWithLetter(token))
    return token.replace(/(?<=\d)[Oo](?=\d)/g, "0").replace(/(?<=\d)[lI](?=\d)/g, "1");
  const options: string[] = [token];
  const substitutions: Array<[RegExp, string[]]> = [
    [/0/g, ["o"]],
    [/1/g, ["l", "i"]],
    [/5/g, ["s"]],
    [/8/g, ["b"]],
    [/(?<=[a-z])I(?=[a-z])/g, ["l", "i"]],
    [/(?<=[a-z])O(?=[a-z])/g, ["o"]],
  ];
  for (const [pattern, letters] of substitutions) {
    if (!pattern.test(token)) continue;
    for (const letter of letters) {
      options.push(token.replace(pattern, letter));
    }
  }
  // Two confusions in one word ("poIicy" has one; "vi0Iations" has two) are tried together.
  for (const first of options.slice()) {
    for (const [pattern, letters] of substitutions) {
      for (const letter of letters) options.push(first.replace(pattern, letter));
    }
  }
  const hit = options.find((o) => VOCAB.has(o.toLowerCase()));
  return hit ?? token;
}

export interface GarbleAssessment {
  garbled: boolean;
  suspectTokens: number;
}

/** Counts the signature OCR mistakes: digits and capital I/O inside words, letters inside numbers. */
export function assessGarbled(text: string): GarbleAssessment {
  const tokens = text.match(/[A-Za-z0-9]{4,40}/g) ?? [];
  let suspect = 0;
  for (const token of tokens) if (isGarbledToken(token)) suspect++;
  return {
    garbled: suspect >= 3 && suspect / Math.max(tokens.length, 1) >= 0.02,
    suspectTokens: suspect,
  };
}

/**
 * A cheap repair for the obvious OCR confusions, applied only where the result is a word an
 * Amazon notice uses (or a digit run that was clearly a date), and a split word is rejoined when
 * the join is one of those words. Never applied silently: `/api/decode` says it did it.
 */
export function repairOcrText(text: string): string {
  const repaired = text.replace(/[A-Za-z0-9]{4,40}/g, (token) =>
    isGarbledToken(token) ? repairToken(token) : token,
  );
  return repaired.replace(
    /\b([A-Za-z]{2,10}) ([A-Za-z]{1,8})\b/g,
    (whole, a: string, b: string) => {
      const joined = (a + b).toLowerCase();
      return VOCAB.has(joined) && !VOCAB.has(a.toLowerCase()) && !VOCAB.has(b.toLowerCase())
        ? a + b
        : whole;
    },
  );
}

/* ------------------------------------------------------------------ warnings that are not actions */

export type NotEnforcementKind = "warning" | "listing_removal";

const ENFORCED =
  /\b(?:has|have)\s+been\s+(?:deactivated|suspended|terminated|blocked|closed|revoked)\b|\bwe(?:’ve|'ve|\s+have)\s+(?:deactivated|suspended|terminated|blocked|closed)\b|\b(?:is|are)\s+(?:now\s+)?(?:deactivated|suspended|blocked|closed)\b|\bselling\s+privileges\s+(?:have\s+been|are)\s+(?:removed|suspended|revoked)\b|\bpermanently\s+(?:deactivated|suspended|closed|removed)\b/i;
const WARNING =
  /\b(?:at\s+risk|target\s+not\s+met|not\s+meeting|below\s+(?:the\s+)?target|does\s+not\s+meet\s+(?:the\s+)?(?:target|requirement)|(?:may|could|might)\s+(?:result\s+in|lead\s+to)\s+(?:deactivation|suspension|account\s+(?:deactivation|suspension))|(?:metric|health)\s+(?:summary|snapshot)|needs?\s+attention)/i;
const LISTING_REMOVAL =
  /\blistings?\b[^.\n]{0,100}\b(?:has|have|was|were)\s+(?:been\s+)?(?:removed|suppressed|taken\s+down)\b/i;
const ASKS_FOR_RESPONSE =
  /\b(?:appeal|plan|respond|provide|submit|send|upload|reinstate|explain|describe)\b/i;

export interface NotEnforcementAssessment {
  notEnforcement: boolean;
  kind?: NotEnforcementKind;
}

/**
 * An Account Health "at risk" banner, a metric snapshot or a one-line listing removal is a warning:
 * no suspension exists, so no appeal is open and nothing here is answered with a Plan of Action.
 */
export function assessNotEnforcement(text: string): NotEnforcementAssessment {
  if (ENFORCED.test(text)) return { notEnforcement: false };
  if (WARNING.test(text) && !ASKS_FOR_RESPONSE.test(text)) {
    return { notEnforcement: true, kind: "warning" };
  }
  // A one-line removal, not a notice that goes on to say what to do: it is one sentence.
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim() !== "");
  if (
    text.trim().length <= 200 &&
    sentences.length <= 1 &&
    LISTING_REMOVAL.test(text) &&
    !ASKS_FOR_RESPONSE.test(text)
  ) {
    return { notEnforcement: true, kind: "listing_removal" };
  }
  return { notEnforcement: false };
}

/* ------------------------------------------------------------------ Seller Support threads */

export interface SpeakerTurn {
  speaker: "amazon" | "seller" | "unknown";
  start: number;
  end: number;
  /** True when a line such as "Amazon:" or "Seller (you):" opened the turn. */
  labelled: boolean;
}

const AMAZON_LABEL =
  /^(?:>\s*)*(?:amazon(?:\s+seller)?(?:\s+(?:support|performance|team))?|seller\s+support|seller\s+performance|account\s+health\s+team|support(?:\s+team)?)\s*(?:\([^)\n]{1,30}\))?\s*:/i;
const SELLER_LABEL = /^(?:>\s*)*(?:seller(?:\s*\((?:you|me)\))?|you|me|customer)\s*:/i;

/**
 * The turns of a pasted Seller Support thread. An unlabelled opening is Amazon's when the first
 * label is the seller's, and ignored otherwise. Only the structure of the paste is read.
 */
export function splitSpeakerTurns(text: string): SpeakerTurn[] {
  const marks: Array<{ at: number; speaker: "amazon" | "seller" }> = [];
  let at = 0;
  for (const line of text.split("\n")) {
    const t = line.trimStart();
    if (AMAZON_LABEL.test(t)) marks.push({ at, speaker: "amazon" });
    else if (SELLER_LABEL.test(t)) marks.push({ at, speaker: "seller" });
    at += line.length + 1;
  }
  if (marks.length === 0) return [];
  const turns: SpeakerTurn[] = [];
  if (marks[0]!.at > 0 && text.slice(0, marks[0]!.at).trim() !== "") {
    turns.push({
      speaker: marks[0]!.speaker === "seller" ? "amazon" : "unknown",
      start: 0,
      end: marks[0]!.at,
      labelled: false,
    });
  }
  marks.forEach((m, i) => {
    turns.push({
      speaker: m.speaker,
      start: m.at,
      end: marks[i + 1]?.at ?? text.length,
      labelled: true,
    });
  });
  return turns;
}

/**
 * The range of the last message Amazon wrote in a thread, or null when the paste is not a thread
 * (no seller turn, fewer than two turns). A thread is read by what Amazon said last: an earlier
 * request that a later "no further action is required" answers is not still open.
 */
export function lastAmazonTurn(text: string): { start: number; end: number } | null {
  const turns = splitSpeakerTurns(text);
  if (turns.length < 2) return null;
  const hasSeller = turns.some((t) => t.speaker === "seller");
  const amazonTurns = turns.filter((t) => t.speaker === "amazon");
  if (!hasSeller && amazonTurns.length < 2) return null;
  const last = amazonTurns[amazonTurns.length - 1];
  return last ? { start: last.start, end: last.end } : null;
}

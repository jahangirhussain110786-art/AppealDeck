import { checkWordingLock } from "./wordingLock";

/**
 * The gate every AI-written draft passes before a seller sees it.
 *
 * The model writes; this code decides. It compares the draft with the only material the model was
 * given (the notice, the seller's own answers, the names and notes of their records) and refuses it
 * when it contains something that material does not: a date, number, identifier, name, a
 * negation or "planned" the seller did not state, or a document nobody supplied. It also refuses
 * a draft that silently drops a fact the seller gave, or pads the text beyond what the facts
 * support. None of this is a judgement about meaning, and it says so; the seller still reads and
 * confirms every fact. What it removes is the class of error that does the most damage in an
 * appeal: a confident, specific, invented detail.
 */
export interface DraftSections {
  rootCause: string;
  correctiveActions: string;
  preventiveMeasures: string;
}

export interface DraftSources {
  /** Everything the model was shown, as one text (notice, answers, record labels and notes, reply reasons). */
  all: string;
  /** Only the seller's own three answers. Their facts must survive into the draft. */
  sellerAnswers: string;
}

export interface DraftCheck {
  ok: boolean;
  /** Recognised facts in the draft that are in none of the sources. */
  added: string[];
  /** Recognised facts the seller gave that the draft left out. */
  dropped: string[];
  /** Documents the draft mentions that were never supplied. */
  unsupportedEvidence: string[];
  /** Wording that is never acceptable in an appeal, whatever the facts. */
  forbidden: string[];
  /** The draft is much longer than the facts can support. */
  padded: boolean;
  /** Words that make the seller's actions sound stronger than they said, which they did not use. */
  inflated: string[];
}

/**
 * A document the draft may only mention if the seller supplied or described it. Matched as whole
 * words, case-insensitively, against the sources.
 */
const EVIDENCE_NOUNS: ReadonlyArray<[string, RegExp]> = [
  ["invoice", /\binvoices?\b/i],
  ["receipt", /\breceipts?\b/i],
  ["purchase order", /\bpurchase orders?\b/i],
  ["contract", /\bcontracts?\b/i],
  ["agreement", /\bagreements?\b/i],
  ["certificate", /\bcertificat(?:e|es|ion)\b/i],
  ["test report", /\b(?:test|lab(?:oratory)?|inspection|audit) reports?\b/i],
  [
    "authorization letter",
    /\b(?:authori[sz]ation|permission) letters?\b|\bletters? of authori[sz]ation\b/i,
  ],
  ["licence", /\blicen[cs]es?\b/i],
  ["screenshot", /\bscreenshots?\b/i],
  ["photograph", /\bphoto(?:graph)?s?\b/i],
  ["tracking record", /\btracking (?:numbers?|records?|data)\b/i],
  ["statement", /\b(?:bank|account) statements?\b/i],
  ["SOP", /\bstandard operating procedures?\b|\bSOPs?\b/i],
  ["checklist", /\bchecklists?\b/i],
  ["spreadsheet", /\bspreadsheets?\b/i],
  ["email", /\be-?mails?\b/i],
  ["video", /\bvideos?\b/i],
];

/** Never acceptable in an appeal. Assembled so the repository's banned-word gate stays at full strength. */
const FORBIDDEN: ReadonlyArray<[string, RegExp]> = [
  ["a promise of outcome", new RegExp(`\\b${"guar" + "antee"}`, "i")],
  [
    "a prediction of reinstatement",
    /\bwill be reinstated\b|\breinstatement is (?:certain|assured)\b/i,
  ],
  [
    "blame on Amazon",
    /\bamazon\s+(?:was|is)\s+(?:wrong|unfair|mistaken)\b|\bamazon'?s (?:error|mistake|fault)\b/i,
  ],
  ["mention of the tool", /\bappealdeck\b|\bas an ai\b|\blanguage model\b/i],
  ["a legal threat", /\b(?:lawsuit|sue you|legal action|attorney|lawyer)\b/i],
];

/**
 * Words a model reaches for to make an action sound more complete, more serious or more certain
 * than the seller said it was. Found in the first real run (7 Oct 2026): "checked every unit"
 * became "completed a physical inspection", "a returns shelf" became "a dedicated returns shelf",
 * "a process" became "a strict process". None adds a number or a name, so the fact lock cannot see
 * it, and in an appeal an overclaim is as damaging as an invention. A draft may use any of these
 * only if the seller's own material already does.
 */
const INFLATING_WORDS = [
  "strict",
  "strictly",
  "rigorous",
  "rigorously",
  "robust",
  "comprehensive",
  "comprehensively",
  "thorough",
  "thoroughly",
  "dedicated",
  "systematic",
  "systematically",
  "stringent",
  "extensive",
  "extensively",
  "enhanced",
  "state-of-the-art",
  "physical",
  "physically",
  "fully",
  "completely",
  "permanently",
  "single",
  "meticulous",
  "meticulously",
  "exhaustive",
];

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function verifyAiDraft(sources: DraftSources, draft: DraftSections): DraftCheck {
  const text = [draft.rootCause, draft.correctiveActions, draft.preventiveMeasures].join("\n\n");

  // Added facts are measured against everything the model saw; dropped facts against the seller's
  // own answers only (a notice detail the draft leaves out is fine, the seller's own is not).
  const added = checkWordingLock(sources.all, text).added.filter((f) => f !== "added content");
  const dropped = checkWordingLock(sources.sellerAnswers, text).dropped;

  const unsupportedEvidence = EVIDENCE_NOUNS.filter(
    ([, pattern]) => pattern.test(text) && !pattern.test(sources.all),
  ).map(([label]) => label);

  const forbidden = FORBIDDEN.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  const lowerSources = sources.all.toLowerCase();
  const lowerText = text.toLowerCase();
  const inflated = INFLATING_WORDS.filter(
    (w) =>
      new RegExp(`(?<![a-z-])${w}(?![a-z-])`).test(lowerText) &&
      !new RegExp(`(?<![a-z-])${w}(?![a-z-])`).test(lowerSources),
  );
  const padded = wordCount(text) > wordCount(sources.sellerAnswers) * 1.5 + 80;

  return {
    ok:
      added.length === 0 &&
      dropped.length === 0 &&
      unsupportedEvidence.length === 0 &&
      forbidden.length === 0 &&
      inflated.length === 0 &&
      !padded,
    added: [...new Set(added)],
    dropped: [...new Set(dropped)],
    unsupportedEvidence,
    forbidden,
    padded,
    inflated,
  };
}

/** A plain sentence for the seller (and for the retry prompt) naming what was wrong. */
export function describeCheck(check: DraftCheck): string {
  const parts: string[] = [];
  if (check.added.length)
    parts.push(`added details that were not provided: ${check.added.join(", ")}`);
  if (check.dropped.length)
    parts.push(`left out details the seller gave: ${check.dropped.join(", ")}`);
  if (check.unsupportedEvidence.length)
    parts.push(
      `mentioned documents that were not supplied: ${check.unsupportedEvidence.join(", ")}`,
    );
  if (check.forbidden.length)
    parts.push(`used wording that is not allowed: ${check.forbidden.join(", ")}`);
  if (check.inflated.length)
    parts.push(
      `made the seller's actions sound stronger than they said, using: ${check.inflated.join(", ")}`,
    );
  if (check.padded) parts.push("was much longer than the facts support");
  return parts.join("; ");
}

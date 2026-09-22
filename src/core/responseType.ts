/**
 * AA-39 (AM-26): what is Amazon actually asking this seller to DO?
 *
 * This is the decision the product never made. `parseNotice` says what family a notice belongs to
 * and when it is due; nothing said whether the seller should write a Plan of Action, attach
 * records, acknowledge something, answer a questionnaire, or simply wait. Choosing wrong is the
 * single most expensive mistake available to a suspended seller, because a wrong response usually
 * burns an appeal attempt.
 *
 * Two rules govern everything here, both from D6:
 *
 * 1. **Never invent.** Every determination is backed by a real substring of the seller's own text,
 *    returned with its offsets so the UI can show them the sentence we read. No match means
 *    `UNDETERMINED` and an honest instruction to go and look — never a plausible guess.
 * 2. **Negation is not a match.** "Do not send a new plan of action" is evidence *against*
 *    PLAN_OF_ACTION, and historically the most dangerous sentence in the corpus, because a
 *    keyword scan reads it as a request.
 *
 * Response-type names follow the ones Amazon's own moderators use in Seller Forums posts
 * (questionnaire / acknowledge / quiz / supporting documents / plan of action), recorded in
 * `docs/handoffs/2026-09-19-second-opinion-salvage/salvage-research_amazon-mechanics.md`.
 */

export type ResponseType =
  | "PLAN_OF_ACTION"
  | "SUPPORTING_DOCUMENTS"
  | "ACKNOWLEDGEMENT"
  | "QUESTIONNAIRE"
  | "NO_ACTION_REQUESTED"
  | "UNDETERMINED";

export interface ResponseTypeMatch {
  type: Exclude<ResponseType, "UNDETERMINED">;
  /** Exact substring of the source text. Never paraphrased. */
  quote: string;
  start: number;
  end: number;
}

export interface ResponseTypeResult {
  type: ResponseType;
  /**
   * `stated` — the notice names the response type in a non-negated clause.
   * `inferred` — no explicit request, but a supported reading exists (e.g. only a records request).
   * `undetermined` — nothing matched, or the evidence genuinely conflicts.
   */
  confidence: "stated" | "inferred" | "undetermined";
  /** Every supporting quote found, in document order. Drives the "why we think this" UI. */
  matches: ResponseTypeMatch[];
  /** Other types that also had evidence. Non-empty means the seller should verify before acting. */
  competing: Array<Exclude<ResponseType, "UNDETERMINED">>;
  /** Plain-language explanation, safe to show a panicking seller verbatim. */
  reason: string;
}

/** A clause plus its offset in the original string, so every match can be traced back. */
interface Clause {
  text: string;
  start: number;
}

/**
 * Splits on newlines and sentence ends while preserving offsets. Sentence splitting is done with a
 * scan rather than `String.split`, because split discards the positions we need for highlighting.
 */
export function splitClauses(raw: string): Clause[] {
  const out: Clause[] = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    const isBreak =
      ch === "\n" || ((ch === "." || ch === "!" || ch === "?") && isSentenceEnd(raw, i));
    if (!isBreak) continue;
    pushClause(out, raw, start, i + 1);
    start = i + 1;
  }
  pushClause(out, raw, start, raw.length);
  return out;
}

function isSentenceEnd(raw: string, i: number): boolean {
  const next = raw[i + 1];
  // End of input, or followed by whitespace. Avoids splitting "1.5" or "sellercentral.amazon.com".
  return next === undefined || /\s/.test(next);
}

function pushClause(out: Clause[], raw: string, from: number, to: number): void {
  const slice = raw.slice(from, to);
  const leading = slice.length - slice.trimStart().length;
  const text = slice.trim();
  if (text.length > 0) out.push({ text, start: from + leading });
}

/**
 * Clauses that tell the seller NOT to do something, or that a thing is not needed. Matching any of
 * these disqualifies the clause as evidence of a request. Kept deliberately broad — a missed
 * negation produces a wrong instruction, while an over-eager one only costs us a supporting quote.
 */
const NEGATION =
  /\b(do not|don't|does not|no need to|not required|not requested|not necessary|no additional|no further|rather than|instead of|without)\b/i;

/**
 * Clauses that describe what has already happened. "Your previous Plan of Action was received" is
 * the notice telling the seller about their own history, not asking for another one — and reading
 * it as a request routes a documents-only case to the composer, which is the single most expensive
 * mistake this module can make.
 *
 * This deliberately over-matches. "We previously requested invoices; please provide them now" loses
 * its supporting quote and the decision falls back to UNDETERMINED, which tells the seller to check
 * the form. That is a good outcome; confidently telling them the wrong thing is not.
 */
const HISTORICAL =
  /\b(previous(?:ly)?|earlier|already|prior)\b|\b(?:was|were|have been|has been) (?:received|reviewed|submitted|provided)\b|\byou (?:submitted|sent|provided)\b/i;

/**
 * Terms that are a request on their own when they appear as a form-field label, but not when they
 * appear mid-sentence in a notice. A form that says "Corrective actions and prevention" IS asking
 * for a plan of action; a notice that merely mentions the phrase may be describing anything.
 */
const POA_TERM = /\bplan of action\b|\bPOA\b|\broot cause\b|\bcorrective action/i;

/**
 * Verbs that introduce a request, including their inflections.
 *
 * The inflections are not optional polish. Real Amazon wording says "by providing government-issued
 * identification" — a bare `\bprovide\b` misses it, and the first browser test of AA-39 extracted
 * nothing at all from exactly that sentence. Gerunds are how these notices are actually written.
 */
const REQUEST_VERB_SOURCE =
  "(?:provid(?:e|es|ing|ed)|submit(?:s|ting|ted)?|send(?:s|ing)?|upload(?:s|ing|ed)?|includ(?:e|es|ing|ed)|attach(?:es|ing|ed)?|furnish(?:es|ing|ed)?|suppl(?:y|ies|ying)|request(?:s|ed|ing)?)";

/** In prose, the plan-of-action terms only count when something actually asks for them. */
const POA_REQUESTED = new RegExp(
  `\\b(?:${REQUEST_VERB_SOURCE}|explain(?:s|ing)?|describ(?:e|es|ing)|writ(?:e|ing)|prepar(?:e|es|ing)|complet(?:e|es|ing))\\b[^\\n]{0,120}?(?:\\bplan of action\\b|\\bPOA\\b|\\broot cause\\b|\\bcorrective action)`,
  "i",
);

/**
 * Document nouns Amazon names. `identification` and the identity documents were missing from the
 * first version, so a verification notice asking for a passport produced no request at all.
 */
const DOCUMENT_NOUN =
  "(?:invoice|receipt|document|documentation|record|proof|certificate|certification|identification|identity document|government[\\s-]issued (?:ID|identification)|passport|letter of authori[sz]ation|authori[sz]ation letter|sales report|order report|tracking|screenshot|test report)";

const PATTERNS: ReadonlyArray<readonly [Exclude<ResponseType, "UNDETERMINED">, RegExp]> = [
  ["PLAN_OF_ACTION", POA_REQUESTED],
  [
    "QUESTIONNAIRE",
    /\bquestionnaire\b|\bquiz\b|answer the following question|complete (?:the|this) (?:form|questionnaire)|respond to (?:the|these) question/i,
  ],
  [
    "ACKNOWLEDGEMENT",
    /\backnowledge(?:ment|ments)?\b|confirm that you (?:have|understand|will)|confirm you have (?:read|reviewed|understood)/i,
  ],
  [
    "SUPPORTING_DOCUMENTS",
    new RegExp(`\\b${REQUEST_VERB_SOURCE}\\b[^\\n]{0,120}?\\b${DOCUMENT_NOUN}s?\\b`, "i"),
  ],
  [
    "NO_ACTION_REQUESTED",
    /no (?:further |additional )?(?:action|information|documents?|response)[^\n]{0,30}(?:is |are |)(?:required|requested|needed)|(?:currently|still|remains?) under review|we will (?:contact|update|notify) you/i,
  ],
];

/**
 * Preference order when several types have evidence. A notice that asks for BOTH a plan of action
 * and documents is a plan-of-action notice whose documents are exhibits — answering with files
 * alone fails. NO_ACTION_REQUESTED sits last because "no further action" frequently appears as
 * boilerplate ("no further action is required at this time on the other listings") inside notices
 * that very much do request something.
 */
const PREFERENCE: ReadonlyArray<Exclude<ResponseType, "UNDETERMINED">> = [
  "PLAN_OF_ACTION",
  "QUESTIONNAIRE",
  "SUPPORTING_DOCUMENTS",
  "ACKNOWLEDGEMENT",
  "NO_ACTION_REQUESTED",
];

const REASONS: Record<Exclude<ResponseType, "UNDETERMINED">, string> = {
  PLAN_OF_ACTION:
    "Amazon is asking for a Plan of Action — a written explanation of the root cause, what you have already corrected, and what prevents it recurring. Attaching documents alone will not answer this.",
  SUPPORTING_DOCUMENTS:
    "Amazon is asking for specific records, not an essay. Send exactly what is named, and keep any explanation short.",
  ACKNOWLEDGEMENT:
    "Amazon is asking you to acknowledge or confirm something. This is usually short — adding an unrequested appeal can work against you.",
  QUESTIONNAIRE:
    "Amazon is asking you to answer set questions or complete a form. Answer the questions asked, in order, rather than replacing them with a general appeal.",
  NO_ACTION_REQUESTED:
    "This notice does not appear to request a response — it reads as an update or a review still in progress. Confirm on the case page before sending anything, because replying when nothing was asked can restart a queue.",
};

const UNDETERMINED_REASON =
  "We could not tell from this text what kind of response Amazon wants, so we are not going to guess. Open the notice in Seller Central and check what the response page itself asks for — the wording there decides it.";

const CONFLICT_SUFFIX =
  " This notice also contains wording for a different kind of response, so check the response page in Seller Central before you send anything.";

/**
 * Determines the requested response type from a notice and, when available, the text of the
 * response form the seller is looking at. Form instructions are weighted identically — they are
 * often the only place the real request appears, which is why `routeWorkspace` asks for them.
 */
export function determineResponseType(raw: string, formInstructions = ""): ResponseTypeResult {
  // `terse: true` marks a source whose lines are form-field labels rather than prose. See POA_TERM.
  const sources: Array<{ text: string; offset: number; terse: boolean }> = [
    { text: raw, offset: 0, terse: false },
  ];
  // Form instructions are scanned too. Their offsets are reported relative to the notice and are
  // therefore not meaningful for highlighting the notice itself; callers that need to highlight
  // form text should call this function again with the form text as `raw`.
  if (formInstructions.trim()) sources.push({ text: formInstructions, offset: -1, terse: true });

  const matches: ResponseTypeMatch[] = [];
  for (const source of sources) {
    for (const clause of splitClauses(source.text)) {
      if (NEGATION.test(clause.text) || HISTORICAL.test(clause.text)) continue;
      for (const [type, basePattern] of PATTERNS) {
        const pattern = source.terse && type === "PLAN_OF_ACTION" ? POA_TERM : basePattern;
        const found = pattern.exec(clause.text);
        if (!found) continue;
        const localStart = clause.start + found.index;
        matches.push({
          type,
          quote: clause.text,
          start: source.offset === -1 ? -1 : localStart,
          end: source.offset === -1 ? -1 : localStart + found[0].length,
        });
      }
    }
  }

  if (matches.length === 0) {
    return {
      type: "UNDETERMINED",
      confidence: "undetermined",
      matches: [],
      competing: [],
      reason: UNDETERMINED_REASON,
    };
  }

  const present = new Set(matches.map((m) => m.type));
  const chosen = PREFERENCE.find((t) => present.has(t))!;
  const competing = PREFERENCE.filter((t) => t !== chosen && present.has(t));

  // A bare "no action" reading alongside any real request is a contradiction we must not resolve
  // silently in the seller's favour, in either direction.
  const contradicted = chosen !== "NO_ACTION_REQUESTED" && present.has("NO_ACTION_REQUESTED");

  return {
    type: chosen,
    confidence: "stated",
    matches: matches.filter((m) => m.type === chosen),
    competing,
    reason: REASONS[chosen] + (competing.length > 0 || contradicted ? CONFLICT_SUFFIX : ""),
  };
}

/** Shared with `entities.ts`, so a verb form recognised here is recognised there too. */
export const REQUEST_VERB = new RegExp(`\\b${REQUEST_VERB_SOURCE}\\b`, "i");

/** Short label for chips and headings. */
export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  PLAN_OF_ACTION: "Plan of Action",
  SUPPORTING_DOCUMENTS: "Supporting documents",
  ACKNOWLEDGEMENT: "Acknowledgement",
  QUESTIONNAIRE: "Questionnaire",
  NO_ACTION_REQUESTED: "No response requested",
  UNDETERMINED: "Not yet clear",
};

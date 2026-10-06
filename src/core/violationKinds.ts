/**
 * The violation taxonomy, kept in its own module rather than in `core/index.ts`.
 *
 * Why a separate file: `caseSchema.ts` and several API route validators need this list, and they
 * are imported by routes whose tests mock the `@/core` barrel. Pulling the constant from the barrel
 * made every one of those mocks responsible for re-exporting it, and a mock that forgot produced a
 * module-load failure rather than a readable assertion. Importing the narrow module instead keeps
 * the schema boundary independent of what any test chooses to mock. `core/index.ts` re-exports
 * everything here, so the public surface is unchanged.
 */

/**
 * Taxonomy v2 (AM-26 / AA-39, 22 Sep 2026). The first six members are the original set; the last
 * four were added because notices in those families had no home — they fell through to POLICY or
 * UNKNOWN and then to a "please clarify" dead end, which is the behaviour the founder named.
 *
 * This array is the single source of truth. AA-39 found six hand-maintained copies of these strings
 * outside `core/` — a zod enum, two route validators, an outcome validator and a page-level type
 * guard — none of which TypeScript could check against the union type, because a standalone string
 * array is structurally unrelated to it. Adding a kind therefore used to compile cleanly while the
 * API silently rejected it, defeating the point of the taxonomy. Every site now derives from here;
 * do not reintroduce a literal list.
 */
export const VIOLATION_KINDS = [
  "INAUTHENTIC_DOCUMENTS",
  /**
   * The ordinary inauthentic-item complaint, split out from `INAUTHENTIC_DOCUMENTS` on
   * 23 Sep 2026 — and it is the most common Amazon deactivation there is.
   *
   * One kind was doing two jobs. `INAUTHENTIC_DOCUMENTS` matched `/inauthentic|not authentic/`, so
   * "we received complaints about the authenticity of your items" — a routine, entirely appealable
   * complaint answered with supplier invoices — landed in the category D6 severity-gates for
   * *forged documents*. The seller was told "this case type requires professional help. We cannot
   * generate a self-serve draft", permanently, on the single most common reason anyone arrives
   * here. Four fixtures asserted `severityGated: true` and so pinned it in place.
   *
   * D6 gates fabricated documents, fraud and child safety. An allegation that goods are not
   * genuine is none of those; it is the case this product was built for.
   */
  "INAUTHENTIC",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  "VERIFICATION",
  "PERFORMANCE_METRIC",
  "PRODUCT_SAFETY",
  "RESTRICTED_PRODUCT",
  "UNKNOWN",
] as const;

export type ViolationKind = (typeof VIOLATION_KINDS)[number];

export function isViolationKind(value: unknown): value is ViolationKind {
  return typeof value === "string" && (VIOLATION_KINDS as readonly string[]).includes(value);
}

/**
 * D6 gates exactly three things: forged documents, fraud, and child safety. The taxonomy-v2 kinds
 * added in AA-39 are deliberately NOT added here — PRODUCT_SAFETY in particular reads like it
 * belongs, but gating it would repeat the implementation drift the 21 Sep 2026 review found in
 * `routeWorkspace()`, where categories nobody had locked were quietly treated as if D6 named them.
 * Widening this set is a founder decision and an amendment, never a judgement call made in passing.
 */
export const SEVERITY_GATED: ReadonlySet<ViolationKind> = new Set(["INAUTHENTIC_DOCUMENTS"]);

export function isSeverityGated(kind: ViolationKind): boolean {
  return SEVERITY_GATED.has(kind);
}

/**
 * What D6 actually gates, as one regex both the classifier and the router read.
 *
 * `routeWorkspace` has had the narrow, correct version of this test since the 21 Sep 2026 review
 * found the severity check had "silently grown" to cover product safety, related accounts and every
 * IP notice. The classifier kept a wider one, so the two disagreed: the router correctly declined
 * to call an ordinary authenticity complaint a specialist matter, while the classifier put it in a
 * severity-gated category anyway. Two copies of a rule is how that happened, so there is now one.
 *
 * `DOCUMENT_FABRICATION` is the half that names a violation family — an allegation that the records
 * themselves were forged. `D6_GATED_ALLEGATION` adds fraud and child safety, which are not evidence
 * families but must still stop a self-serve draft.
 */
const FABRICATION_WORD = "forged|falsified|fabricated|manipulated|altered";
const RECORD_WORD = "documents?|invoices?|records?";

/**
 * Both word orders, because Amazon writes it both ways: "falsified invoices" and "the invoices you
 * supplied were falsified". The rule only ever matched the first, so the second classified as an
 * ordinary complaint and would have been handed a self-serve draft — the precise outcome D6 exists
 * to prevent, and a worse error than the reverse.
 *
 * This completes the existing rule rather than widening its scope. The standing instruction that
 * widening the gate needs a founder decision is about *categories* — product safety, related
 * accounts, intellectual property, all of which the 21 Sep review found had crept in and were
 * removed. Recognising the same allegation phrased passively adds no category.
 */
export const DOCUMENT_FABRICATION = new RegExp(
  `\\b(?:${FABRICATION_WORD})\\s+(?:${RECORD_WORD})\\b` +
    `|\\b(?:${RECORD_WORD})\\b[^.!?\\n]{0,40}?\\b(?:were|was|are|is|appear(?:s)? to be|have been|had been)\\s+(?:${FABRICATION_WORD})\\b`,
  "i",
);

/**
 * Fraud, forgery and child abuse as *allegations*, not as words (narrowed 6 Oct 2026, inverted the
 * same day).
 *
 * The first version matched the bare words and sent every "fraud prevention checks" notice to
 * professional review. The narrowing that replaced it listed allegation *shapes* ("suspected fraud",
 * "fraudulent activity"), and an independent review showed that list missing ordinary wording:
 * "deactivated for fraud", "accused of fraud", "forged supplier invoices", "fake invoices", "tampered
 * with", "child pornography". A shape list fails open: whatever its author did not think of is sold
 * a draft, which is the error D6 exists to prevent, and it is far worse than the reverse (an extra
 * referral to qualified help).
 *
 * So the rule is now inverted. Every sentence is first stripped of a short, explicit list of
 * boilerplate that merely names the topic ("fraud prevention", "anti-fraud", "to protect against
 * fraud", "child safety standards", "child ASIN", "tamper-resistant packaging"). Whatever
 * fraud / forgery / child-abuse vocabulary is left gates. When unsure, gate.
 */
const BOILERPLATE = new RegExp(
  [
    // fraud prevention / detection / protection / awareness / checks / team / policy ...
    "\\b(?:fraud|fraudulent)[\\s-]+(?:prevention|detection|protection|awareness|checks?|screening|controls?|teams?|departments?|polic(?:y|ies)|systems?|measures?|reviews?|monitoring|safeguards?|programs?|programmes?|processes|process|procedures?|operations|investigators?\\s+team)\\b",
    "\\b(?:anti|counter)-?[\\s-]*(?:fraud|fraudulent|scam)\\w*",
    // Verbs limited to the forms boilerplate uses. "detected fraud" and "reported fraud" are
    // allegations and must NOT be stripped, so `detect\w*` / `report\w*` are deliberately absent.
    "\\b(?:prevent(?:ing)?|detecting|combat(?:ing)?|deter(?:ring)?|avoid(?:ing)?|beware of|aware of|awareness of|protect(?:s|ing)?\\s+(?:\\w+\\s+){0,3}?(?:against|from))\\s+(?:\\w+\\s+){0,2}?(?:fraud\\w*|scams?)\\b",
    "\\b(?:prevention|detection|reporting)\\s+of\\s+(?:\\w+\\s+){0,2}?(?:fraud\\w*|scams?)\\b",
    "\\bfraud,\\s*waste\\b",
    "\\bscam\\s+(?:emails?|e-mails?|messages?|calls?|texts?|awareness|prevention|alerts?)\\b",
    "\\bchild safety (?:standards?|regulations?|requirements?|laws?|mechanisms?|features?|rules?|compliance|certificates?|certification|testing)\\b",
    "\\bchild(?:ren'?s)?[\\s-]+(?:lock|resistant|proof)\\b",
    "\\bchild ASINs?\\b",
    "\\btamper[\\s-]+(?:evident|resistant|proof)\\b",
    // "must not be altered / edited" is an instruction about how to submit, not an allegation.
    "\\b(?:do not|don't|must not|should not|cannot|can't|never|not|without|un)\\s*(?:be\\s+)?(?:edited|altered|edit|alter)\\b",
  ].join("|"),
  "gi",
);

const DOC_NOUN =
  "(?:documents?|docs?|invoices?|records?|paperwork|ID|identification|bills?|statements?|receipts?|certificates?|licen[cs]es?|letters?)";
const DOC_WORD =
  "(?:fake|faked|counterfeit\\w*|false|manipulated|edited|altered|doctored|fabricat\\w+|bogus|phony)";

const ALLEGATION_VOCABULARY = new RegExp(
  [
    "\\b(?:fraud\\w*|defraud\\w*)\\b",
    "\\bforg(?:ed|ery|eries|ing)\\b",
    "\\bfalsif\\w+",
    "\\bdoctored\\b",
    "\\btamper\\w*",
    "\\bscam\\w*",
    // fake / false / edited ... within a few words of a record noun, both orders
    `\\b${DOC_WORD}\\s+(?:of\\s+)?(?:[\\w'-]+\\s+){0,3}?${DOC_NOUN}\\b`,
    `\\b${DOC_NOUN}\\b[^.!?\\n]{0,60}?\\b(?:(?:were|was|are|is|been|be|being|appears?(?:\\s+to\\s+(?:be|have\\s+been))?|seems?(?:\\s+to\\s+(?:be|have\\s+been))?|looks?(?:\\s+(?:to\\s+be|like))?|found\\s+to\\s+be|determined\\s+to\\s+be)\\s+(?:\\w+\\s+){0,2}?)${DOC_WORD}\\b`,
    // child abuse family
    "\\bchild(?:ren)?\\s+(?:sexual\\w*|sex\\b|abus\\w+|exploit\\w+|pornograph\\w*|porn\\b|endanger\\w*|molest\\w*|trafficking)",
    "\\bCSAM\\b",
    "\\bendanger\\w*\\s+(?:\\w+\\s+){0,2}?(?:child\\w*|minors?)\\b",
    "\\bsexuali[sz]\\w*\\s+(?:\\w+\\s+){0,3}?(?:minors?|children|child)\\b",
    "\\bsexual\\w*\\s+(?:\\w+\\s+){0,4}?(?:minors?|children|child)\\b",
    "\\b(?:minors?|children)\\b[^.!?\\n]{0,40}?\\bsexual\\w*",
    "\\bchild(?:ren)?(?:'s)?\\s+safety\\s+(?:violations?|incidents?|investigations?)\\b",
    "\\bsafety\\s+of\\s+(?:\\w+\\s+){0,2}?(?:children|minors|a child)\\b[^.!?\\n]{0,60}?\\b(?:violat\\w+|abus\\w+|harm\\w*|endanger\\w*|exploit\\w*|risk|threat\\w*|incident\\w*)",
    "\\b(?:violat\\w+|abus\\w+|harm\\w*|endanger\\w*|exploit\\w*|risk|threat\\w*)\\b[^.!?\\n]{0,40}?\\bsafety\\s+of\\s+(?:\\w+\\s+){0,2}?(?:children|minors|a child)\\b",
    "\\bput(?:ting)?\\s+children\\s+at\\s+risk\\b",
  ].join("|"),
  "i",
);

/**
 * Sentences, with line breaks inside one turned into spaces: a pasted notice wraps lines mid-
 * sentence, and "fake\ninvoices" is the same allegation as "fake invoices". Paragraph breaks still
 * end a sentence.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n\s*\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * The first sentence of `text` that carries a D6 allegation, or `null`. Used by the router (is this
 * case gated?) and by the latch (what exactly did the notice say?), so both read one rule.
 */
export function findD6Allegation(text: string): { quote: string } | null {
  for (const sentence of splitSentences(text)) {
    const stripped = sentence.replace(BOILERPLATE, " ");
    if (ALLEGATION_VOCABULARY.test(stripped) || DOCUMENT_FABRICATION.test(sentence))
      return { quote: sentence.trim().slice(0, 300) };
  }
  return null;
}

/** `true` when any sentence of `text` carries a D6 allegation. */
export function hasD6Allegation(text: string): boolean {
  return findD6Allegation(text) !== null;
}

/** Kept so existing call sites read `D6_GATED_ALLEGATION.test(text)`; it is not a RegExp any more. */
export const D6_GATED_ALLEGATION = { test: hasD6Allegation };

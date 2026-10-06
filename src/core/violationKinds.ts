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
 * Fraud and child safety as *allegations*, not as words (narrowed 6 Oct 2026).
 *
 * The first version matched the bare words `fraud` and `child safety` anywhere in the text. Amazon
 * writes "as part of our fraud prevention checks, please verify your identity" and "complies with
 * child safety standards (CPSIA)" in ordinary verification, funds-hold and product-safety notices,
 * and every one of them was sent to professional review with the draft refused. D6 gates what a
 * notice *accuses the seller of*; it never said a notice that mentions the topic is gated.
 *
 * The allegation shapes below are the implementation of that sentence. Boilerplate that merely
 * names the topic ("fraud prevention", "fraud detection", "anti-fraud", "to protect against
 * fraud", "child safety standards / regulations / requirements") does not match, on purpose.
 * `DOCUMENT_FABRICATION` is unchanged.
 */
const NOT_PREVENTION =
  "(?<!\\b(?:prevent(?:ing|ion of)?|detect(?:ing|ion of)?|combat(?:ing)?|anti-?|protect(?:ing)?\\s+(?:against|from))\\s+)";

const FRAUD_ALLEGATION =
  // "alleged / suspected / evidence of / engaged in / involved in / committed fraud"
  "\\b(?:alleged|alleging|suspected|suspicion of|evidence of|engaged in|engaging in|involved in|participat(?:ed|ing) in|committed|committing)\\s+(?:\\w+\\s+){0,2}?fraud\\b(?!\\s+(?:prevention|detection|protection|checks?|team|department|screening|controls?)\\b)" +
  // "fraudulent activity / transactions / accounts / documents / orders / claims"
  `|${NOT_PREVENTION}\\bfraudulent\\s+(?:activity|activities|transactions?|accounts?|documents?|orders?|claims?|behaviou?r|conduct)\\b` +
  "|\\bfraud investigations?\\b" +
  "|\\b(?:we|amazon)\\s+(?:has|have)?\\s*(?:detected|identified|found)\\s+fraud\\b";

const CHILD_SAFETY_ALLEGATION =
  "\\bchild sexual abuse material\\b|\\bCSAM\\b|\\bchild exploitation\\b|\\bendangering (?:a )?child(?:ren)?\\b" +
  "|\\bchild safety (?:violations?|incidents?|investigations?)\\b";

export const D6_GATED_ALLEGATION = new RegExp(
  `${DOCUMENT_FABRICATION.source}|${FRAUD_ALLEGATION}|${CHILD_SAFETY_ALLEGATION}`,
  "i",
);

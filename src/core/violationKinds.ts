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

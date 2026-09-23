import type { ViolationKind } from "./index";
import { isSeverityGated } from "./index";
import type { ParsedNotice } from "./noticeParser";

export type Confidence = "deterministic" | "llm-needed";

export interface Classification {
  kind: ViolationKind;
  severityGated: boolean;
  confidence: Confidence;
}

/**
 * First match wins, so this is ordered most-specific to most-generic. POLICY stays last because its
 * pattern ("violations of our policies") appears inside notices of almost every other family.
 * AA-39 inserted the four taxonomy-v2 kinds by specificity: PRODUCT_SAFETY high because a safety
 * notice carries obligations the seller must not miss while reading it as an ordinary policy strike,
 * PERFORMANCE_METRIC below the conduct kinds because a metric notice often also quotes policy text.
 */
export const KIND_PRIORITY: ReadonlyArray<ViolationKind> = [
  // A fabrication allegation outranks the ordinary complaint immediately below it, so a notice
  // making both is classified — and gated — by the more serious one.
  "INAUTHENTIC_DOCUMENTS",
  "INAUTHENTIC",
  "PRODUCT_SAFETY",
  "RELATED_ACCOUNT",
  "INTELLECTUAL_PROPERTY",
  "RESTRICTED_PRODUCT",
  "VERIFICATION",
  "PERFORMANCE_METRIC",
  "LISTING",
  "FUNDS",
  "POLICY",
];

export function classifyStage1(parsed: ParsedNotice): Classification {
  for (const kind of KIND_PRIORITY) {
    if (parsed.kindHints.includes(kind)) {
      return { kind, severityGated: isSeverityGated(kind), confidence: "deterministic" };
    }
  }
  return { kind: "UNKNOWN", severityGated: false, confidence: "llm-needed" };
}

/**
 * The violation kind a case should carry once its notice is confirmed in the workspace.
 *
 * Added 23 Sep 2026. Only `/decode` ever classified a notice; one typed straight into `/case` —
 * the ordinary way in — left the case `UNKNOWN` for good unless the seller corrected it by hand.
 * `UNKNOWN`'s evidence matrix is empty, so those cases raised no unspoken records, showed no
 * violation-specific reasons, and needed fallbacks in two places just to show guidance at all.
 * It stayed that way because classifying used to be dangerous: until D split the taxonomy, an
 * ordinary "items are not authentic" notice classified straight into the permanent severity gate.
 *
 * Three rules, each preventing a specific way this could go wrong:
 *
 * 1. **A seller's own choice is final.** If they corrected the kind, we never overwrite it — or the
 *    correction would undo itself on the next save.
 * 2. **Never downgrade to `UNKNOWN`.** A notice we cannot place says nothing about the kind, so an
 *    existing reading (from a decode, or a `?kind=` link) is kept rather than thrown away.
 * 3. **Otherwise the notice decides**, over a `?kind=` link or an earlier reading, because the
 *    notice is the evidence and a link is only where the seller happened to click.
 */
export function kindForConfirmedNotice(
  current: { kind: ViolationKind; kindSetBy?: "seller" },
  parsed: ParsedNotice,
): ViolationKind {
  if (current.kindSetBy === "seller") return current.kind;
  const read = classifyStage1(parsed).kind;
  return read === "UNKNOWN" ? current.kind : read;
}

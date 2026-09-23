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

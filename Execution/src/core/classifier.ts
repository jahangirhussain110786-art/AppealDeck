import type { ViolationKind } from "./index";
import { isSeverityGated } from "./index";
import type { ParsedNotice } from "./noticeParser";

export type Confidence = "deterministic" | "llm-needed";

export interface Classification {
  kind: ViolationKind;
  severityGated: boolean;
  confidence: Confidence;
}

const PRIORITY: ReadonlyArray<ViolationKind> = [
  "INAUTHENTIC_DOCUMENTS",
  "RELATED_ACCOUNT",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  "POLICY",
];

export function classifyStage1(parsed: ParsedNotice): Classification {
  for (const kind of PRIORITY) {
    if (parsed.kindHints.includes(kind)) {
      return { kind, severityGated: isSeverityGated(kind), confidence: "deterministic" };
    }
  }
  return { kind: "UNKNOWN", severityGated: false, confidence: "llm-needed" };
}

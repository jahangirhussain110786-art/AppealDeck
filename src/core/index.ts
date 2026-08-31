export const CORE_VERSION = "0.1.0" as const;

export type ViolationKind =
  | "INAUTHENTIC_DOCUMENTS"
  | "RELATED_ACCOUNT"
  | "POLICY"
  | "INTELLECTUAL_PROPERTY"
  | "LISTING"
  | "FUNDS"
  | "UNKNOWN";

export const SEVERITY_GATED: ReadonlySet<ViolationKind> = new Set([
  "INAUTHENTIC_DOCUMENTS",
]);

export function isSeverityGated(kind: ViolationKind): boolean {
  return SEVERITY_GATED.has(kind);
}

import { parseNotice } from "./noticeParser";
import type { ParsedNotice } from "./noticeParser";
import { classifyStage1 } from "./classifier";
import type { Classification, Confidence } from "./classifier";
import { computeDeadlines, isIndefiniteHold } from "./deadlinesModel";
import type { Deadline, DeadlineKind, DeadlineInput } from "./deadlinesModel";
import { FIXTURES, FIXTURE_KINDS } from "./fixtures";
import type { Fixture, FixtureExpected } from "./fixtures";
import { KIND_GUIDANCE, guidanceFor } from "./guidance";
import type { KindGuidance } from "./guidance";

export { parseNotice };
export type { ParsedNotice };
export { classifyStage1 };
export type { Classification, Confidence };
export { computeDeadlines, isIndefiniteHold };
export type { Deadline, DeadlineKind, DeadlineInput };
export { FIXTURES, FIXTURE_KINDS };
export type { Fixture, FixtureExpected };
export { KIND_GUIDANCE, guidanceFor };
export type { KindGuidance };

export interface DecodeOptions {
  noticeReceivedAt: Date;
  deactivatedAt?: Date;
  aha?: boolean;
}

export interface DecodeResult {
  parsed: ParsedNotice;
  classification: Classification;
  deadlines: Deadline[];
}

export function runDecode(raw: string, opts: DecodeOptions): DecodeResult {
  const parsed = parseNotice(raw);
  const classification = classifyStage1(parsed);
  const deadlines = computeDeadlines({
    noticeReceivedAt: opts.noticeReceivedAt,
    deactivatedAt: opts.deactivatedAt,
    parsed,
    kind: classification.kind,
    aha: opts.aha,
  });
  return { parsed, classification, deadlines };
}

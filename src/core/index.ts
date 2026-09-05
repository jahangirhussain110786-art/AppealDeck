export const CORE_VERSION = "0.1.0" as const;

export type ViolationKind =
  | "INAUTHENTIC_DOCUMENTS"
  | "RELATED_ACCOUNT"
  | "POLICY"
  | "INTELLECTUAL_PROPERTY"
  | "LISTING"
  | "FUNDS"
  | "UNKNOWN";

export const SEVERITY_GATED: ReadonlySet<ViolationKind> = new Set(["INAUTHENTIC_DOCUMENTS"]);

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
import {
  KIND_GUIDANCE,
  guidanceFor,
  allGuidanceStrings,
  GLOBAL_EXPECTATIONS,
  POLICY_CHECKED_ON,
} from "./guidance";
import type { KindGuidance, TriagedActions, GlobalExpectations } from "./guidance";
import { EVIDENCE_MATRIX, requirementsFor, requiredKinds, allKinds } from "./evidenceModel";
import {
  nextState,
  nextBestActions,
  availableDocTypes,
  expectationsCopy,
  computeFundsTrack,
  isTerminal,
  isSubmitted,
  noveltyRequired,
  NOVELTY_REQUIRED_FROM_ATTEMPT,
} from "./caseState";
import { analyzeReply, isRuleMatch } from "./responseAnalyzer";
import {
  computeReadiness,
  isRequiredComplete,
  generateActionItems,
  documentTypesFor,
  defaultDocumentType,
  composerModeFor,
  toneProfileFor,
  READINESS_COPY,
  readinessLabel,
} from "./readiness";
import {
  LETTER_TEMPLATES,
  SUPPLIER_INVOICE_REQUEST,
  RIGHTS_OWNER_RETRACTION,
  FOLLOWUP_NUDGE,
  letterById,
  lettersForEvidenceKind,
} from "./letters";

export { parseNotice };
export type { ParsedNotice } from "./noticeParser";
export { classifyStage1 };
export type { Classification, Confidence } from "./classifier";
export { computeDeadlines, isIndefiniteHold };
export type { Deadline, DeadlineKind, DeadlineInput } from "./deadlinesModel";
export { FIXTURES, FIXTURE_KINDS };
export type { Fixture, FixtureExpected } from "./fixtures";
export { KIND_GUIDANCE, guidanceFor, allGuidanceStrings, GLOBAL_EXPECTATIONS, POLICY_CHECKED_ON };
export type { KindGuidance, TriagedActions, GlobalExpectations };
export { EVIDENCE_MATRIX, requirementsFor, requiredKinds, allKinds };
export type { EvidenceKind, EvidenceRequirement } from "./evidenceModel";
export {
  nextState,
  nextBestActions,
  availableDocTypes,
  expectationsCopy,
  computeFundsTrack,
  isTerminal,
  isSubmitted,
  noveltyRequired,
  NOVELTY_REQUIRED_FROM_ATTEMPT,
  analyzeReply,
  isRuleMatch,
};
export type { CaseState, CaseStateContext, FundsTrackState, ReplyCategory } from "./caseState";
export type { AnalysisResult } from "./responseAnalyzer";
export {
  computeReadiness,
  isRequiredComplete,
  generateActionItems,
  documentTypesFor,
  defaultDocumentType,
  composerModeFor,
  toneProfileFor,
  READINESS_COPY,
  readinessLabel,
};
export type {
  DocumentType,
  ActionItem,
  ActionAlternative,
  ReadinessResult,
  ComposerMode,
  CaseFileData,
} from "./readiness";
export {
  LETTER_TEMPLATES,
  SUPPLIER_INVOICE_REQUEST,
  RIGHTS_OWNER_RETRACTION,
  FOLLOWUP_NUDGE,
  letterById,
  lettersForEvidenceKind,
};
export type { LetterTemplate } from "./letters";
export { createCaseFile, nextStep, applyAnswer, interviewProgress } from "./interviewEngine";
export type {
  StepKind,
  InputType,
  EnumOption,
  InterviewStep,
  StepAnswer,
  CaseFile,
  InterviewProgress,
} from "./interviewEngine";
export { composePoa, critiquePoa, renderPoaText } from "./composer";
export type { PoaSection, PoaDraft, CriticFinding, CriticResult } from "./composer";
export type { VaultStatus, VaultListItem, AddDocumentInput } from "./vault/vault";
export type {
  EncryptionEnvelope,
  KdfParams,
  WrappedDek,
  KeyMode,
  VaultConfig,
} from "./vault/envelope";
export { VAULT_ENVELOPE_VERSION } from "./vault/envelope";

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

export const CORE_VERSION = "0.1.0" as const;

/**
 * Taxonomy v2 (AM-26 / AA-39, 22 Sep 2026). The first four members are the original set; the
 * last four were added because notices in those families had no home — they fell through to
 * POLICY or UNKNOWN and then to a "please clarify" dead end, which is the behaviour the founder
 * named. Adding a kind here is deliberately expensive: TypeScript forces every exhaustive map
 * (KIND_GUIDANCE, EVIDENCE_MATRIX, CASE_STATE_LABEL) to gain a real entry, so a new category
 * cannot ship without the guidance and evidence requirements that make it useful.
 */
// The taxonomy lives in its own module so schema validators can import it without pulling the
// barrel (see the note at the top of ./violationKinds). Re-exported here to keep `@/core` complete.
export {
  VIOLATION_KINDS,
  isViolationKind,
  SEVERITY_GATED,
  isSeverityGated,
} from "./violationKinds";
export type { ViolationKind } from "./violationKinds";

import { parseNotice } from "./noticeParser";
import type { ParsedNotice } from "./noticeParser";
import { classifyStage1, kindForConfirmedNotice } from "./classifier";
import type { Classification } from "./classifier";
import { determineResponseType, splitClauses, RESPONSE_TYPE_LABELS } from "./responseType";
import type { ResponseType, ResponseTypeResult, ResponseTypeMatch } from "./responseType";
import { extractEntities, entitiesOfKind, ENTITY_LABELS } from "./entities";
import type { EntityKind, ExtractedEntity } from "./entities";
import { computeDeadlines, isIndefiniteHold, serializeDeadlines } from "./deadlinesModel";
import type { Deadline } from "./deadlinesModel";
import { FIXTURES, FIXTURE_KINDS } from "./fixtures";
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
  isNarrativeSufficient,
  isNarrativeTextSufficient,
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
export { classifyStage1, kindForConfirmedNotice };
export type { Classification, Confidence } from "./classifier";
export { determineResponseType, splitClauses, RESPONSE_TYPE_LABELS };
export { assessNoticeAuthenticity } from "./noticeAuthenticity";
export type {
  AuthenticityAssessment,
  AuthenticitySignal,
  AuthenticitySignalId,
} from "./noticeAuthenticity";
export type { ResponseType, ResponseTypeResult, ResponseTypeMatch };
export { extractEntities, entitiesOfKind, ENTITY_LABELS };
export type { EntityKind, ExtractedEntity };
export {
  buildFactsLedger,
  entriesFromEntities,
  entriesFromDocumentCheck,
  entriesFromSeller,
  describeSource,
  describeContradiction,
  FACT_STATUS_LABELS,
} from "./factsLedger";
export type { Fact, FactEntry, FactSource, FactStatus, FactsLedger } from "./factsLedger";
export { assessNovelty, shouldWarnBeforeSubmit } from "./submissionNovelty";
export type { NoveltyResult, NoveltyVerdict, PriorSubmission } from "./submissionNovelty";
export {
  verificationChecklist,
  verificationFlavour,
  VERIFICATION_FLAVOUR_LABELS,
} from "./verificationTrack";
export type { VerificationFlavour, VerificationStep } from "./verificationTrack";
export {
  buildDocumentCheck,
  summarizeCheck,
  sanitizeNote,
  containsBannedConclusion,
  FINDING_LABELS,
} from "./documentCheck";
export type { DocumentCheckResult, FieldFinding, FindingStatus } from "./documentCheck";
export {
  buildClockBrief,
  clockItemsForCase,
  describeClockItem,
  mostUrgent,
  SOON_WINDOW_DAYS,
} from "./clock";
export type {
  ClockBrief,
  ClockItem,
  ClockUrgency,
  ClockSource,
  ClockCaseInput,
  ClockDeadline,
} from "./clock";
export { computeDeadlines, isIndefiniteHold, serializeDeadlines };
export type { Deadline, DeadlineKind, DeadlineInput, SerializedDeadline } from "./deadlinesModel";
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
  isNarrativeSufficient,
  isNarrativeTextSufficient,
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
export { createCaseFile } from "./caseFile";
export type { CaseFile } from "./caseFile";
export {
  composePoa,
  critiquePoa,
  renderPoaText,
  ROOT_CAUSE_GAP_MESSAGE,
  PREVENTIVE_MEASURES_GAP_MESSAGE,
  NARRATIVE_GAP_MESSAGE,
} from "./composer";
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
  /**
   * Only when genuinely known. Optional since 23 Sep 2026 — the decode route passed `new Date()`,
   * counting every stated window from the moment of decoding. See `computeDeadlines`.
   */
  noticeReceivedAt?: Date;
  deactivatedAt?: Date;
  aha?: boolean;
  /**
   * Text of the response form the seller is looking at, when they have it. Often the only place the
   * actual request appears — the notice says an account was deactivated, the form says what to send.
   */
  formInstructions?: string;
}

export interface DecodeResult {
  parsed: ParsedNotice;
  classification: Classification;
  deadlines: Deadline[];
  /**
   * AA-39: what Amazon is asking the seller to DO. Previously absent — the decoder could name the
   * problem and the deadline but never the required response, which is the decision that actually
   * determines whether an appeal survives.
   */
  responseType: ResponseTypeResult;
  /** AA-39: identifiers pulled from the notice, each carrying the span it came from. */
  entities: ExtractedEntity[];
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
  return {
    parsed,
    classification,
    deadlines,
    responseType: determineResponseType(raw, opts.formInstructions ?? ""),
    entities: extractEntities(raw),
  };
}

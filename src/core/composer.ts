import type { ViolationKind } from "./index";
import type { DocumentType } from "./readiness";
import { composerModeFor, isRequiredComplete } from "./readiness";
import type { CaseFileData, ComposerMode } from "./readiness";
import { requirementsFor } from "./evidenceModel";
import type { EvidenceKind } from "./evidenceModel";
import { defaultDocumentType } from "./readiness";

export interface PoaSection {
  heading: string;
  body: string;
}

export interface PoaDraft {
  docType: DocumentType;
  mode: ComposerMode;
  sections: PoaSection[];
  watermark?: string;
  metadata: {
    generatedAt: string;
    kind: ViolationKind;
    evidenceComplete: boolean;
    attemptNumber: number;
  };
}

export interface CriticFinding {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

export interface CriticResult {
  findings: CriticFinding[];
  passed: boolean;
}

const GAP_DRAFT_WATERMARK = "NOT READY TO SUBMIT — evidence gaps listed below.";

export function composePoa(data: CaseFileData, attemptNumber: number = 1): PoaDraft {
  const mode = composerModeFor(data);
  const docType = defaultDocumentType(data.kind);
  const complete = isRequiredComplete(data);

  const sections: PoaSection[] = [];

  sections.push(buildRootCauseSection(data));
  sections.push(buildCorrectiveActionsSection(data));
  sections.push(buildPreventiveMeasuresSection(data));

  if (mode.mode === "gap-draft") {
    sections.push(buildGapSection(data));
  }

  return {
    docType,
    mode,
    sections,
    watermark: mode.mode === "gap-draft" ? GAP_DRAFT_WATERMARK : undefined,
    metadata: {
      generatedAt: new Date().toISOString(),
      kind: data.kind,
      evidenceComplete: complete,
      attemptNumber,
    },
  };
}

function buildRootCauseSection(data: CaseFileData): PoaSection {
  const guidance = data.kind;
  return {
    heading: "Root Cause",
    body: `[Describe what caused the ${guidance.replace(/_/g, " ")} issue. Be specific and factual.]`,
  };
}

function buildCorrectiveActionsSection(data: CaseFileData): PoaSection {
  const actions: string[] = [];

  for (const item of data.actionItems) {
    if (item.status === "done" && item.attestation) {
      actions.push(`- [Completed] ${item.label}`);
    } else if (item.status === "done") {
      actions.push(`- [Completed, unattested] ${item.label}`);
    } else if (item.declined) {
      actions.push(`- [Declined: ${item.declined.reason}] ${item.label}`);
    } else {
      actions.push(`- [Pending] ${item.label}`);
    }
  }

  return {
    heading: "Corrective Actions",
    body: actions.length > 0 ? actions.join("\n") : "[No corrective actions recorded.]",
  };
}

function buildPreventiveMeasuresSection(data: CaseFileData): PoaSection {
  return {
    heading: "Preventive Measures",
    body: "[Describe the systemic changes you have made to prevent this issue from recurring.]",
  };
}

function buildGapSection(data: CaseFileData): PoaSection {
  const missing = requirementsFor(data.kind).filter((r) => {
    if (!r.required) return false;
    const slot = data.evidenceSlots[r.kind];
    return !slot || !slot.present;
  });

  const items = missing.map((r) => `- ${r.kind.replace(/_/g, " ")}: ${r.whyAmazonWantsIt}`);

  return {
    heading: "Evidence Gaps (Action Required)",
    body:
      "The following required evidence is missing. Obtain these items before submitting:\n\n" +
      (items.length > 0 ? items.join("\n") : "[No specific gaps detected.]"),
  };
}

export function critiquePoa(draft: PoaDraft, data: CaseFileData): CriticResult {
  const findings: CriticFinding[] = [];

  checkUnattestedClaims(draft, data, findings);
  checkEmptyEvidenceSlots(draft, data, findings);
  checkNovelty(draft, findings);
  checkBannedLanguage(draft, findings);
  checkSeverityGate(draft, data, findings);

  const passed = !findings.some((f) => f.severity === "error");

  return { findings, passed };
}

function checkUnattestedClaims(
  draft: PoaDraft,
  data: CaseFileData,
  findings: CriticFinding[],
): void {
  const unattested = data.actionItems.filter((a) => a.status === "done" && !a.attestation);
  if (unattested.length > 0) {
    findings.push({
      severity: "warning",
      code: "UNATTESTED_CLAIMS",
      message: `${unattested.length} completed action(s) lack attestation: ${unattested.map((a) => a.label).join(", ")}. Past-tense corrective claims should map to attested actions.`,
    });
  }
}

function checkEmptyEvidenceSlots(
  draft: PoaDraft,
  data: CaseFileData,
  findings: CriticFinding[],
): void {
  const required = requirementsFor(data.kind).filter((r) => r.required);
  const emptyRequired = required.filter((r) => {
    const slot = data.evidenceSlots[r.kind];
    return !slot || !slot.present;
  });

  if (emptyRequired.length > 0) {
    findings.push({
      severity: "warning",
      code: "EMPTY_EVIDENCE_SLOTS",
      message: `Required evidence missing: ${emptyRequired.map((r) => r.kind.replace(/_/g, " ")).join(", ")}. The draft will be a gap draft.`,
    });
  }
}

function checkNovelty(draft: PoaDraft, findings: CriticFinding[]): void {
  if (draft.metadata.attemptNumber > 1 && draft.metadata.evidenceComplete) {
    findings.push({
      severity: "info",
      code: "NOVELTY_REMINDER",
      message: `This is attempt ${draft.metadata.attemptNumber}. Ensure this submission contains material changes (new evidence or changed root-cause framing) versus the previous attempt.`,
    });
  }
}

const BANNED_PATTERNS: ReadonlyArray<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /\bguarantee\b/i,
    code: "BANNED_GUARANTEE",
    message: "Remove promise-of-success language — outcome claims are prohibited.",
  },
  {
    pattern: /\bwill be reinstated\b/i,
    code: "BANNED_REINSTATEMENT_PROMISE",
    message: "Remove reinstatement promises — no tool can promise outcomes.",
  },
  {
    pattern: /\d{1,2}\s*(hours?|days?)\b/i,
    code: "BANNED_TIME_PROMISE",
    message: "Remove time promises — response times vary and cannot be promised.",
  },
  {
    pattern: /\b(amazon\s*(sucks?|is\s*(wrong|unfair)))\b/i,
    code: "BANNED_BLAME",
    message: "Remove blame language — professional tone required.",
  },
];

function checkBannedLanguage(draft: PoaDraft, findings: CriticFinding[]): void {
  const fullText = draft.sections.map((s) => s.body).join("\n");
  for (const { pattern, code, message } of BANNED_PATTERNS) {
    if (pattern.test(fullText)) {
      findings.push({ severity: "error", code, message });
    }
  }
}

function checkSeverityGate(draft: PoaDraft, data: CaseFileData, findings: CriticFinding[]): void {
  if (data.kind === "INAUTHENTIC_DOCUMENTS") {
    const hasInvoice = data.evidenceSlots["supplier_invoice"]?.present;
    if (!hasInvoice) {
      findings.push({
        severity: "error",
        code: "SEVERITY_GATE",
        message:
          "Inauthentic-document cases without a verifiable supplier invoice are routed to professional help. A self-serve draft is not appropriate.",
      });
    }
  }
}

export function renderPoaText(draft: PoaDraft): string {
  const lines: string[] = [];

  if (draft.watermark) {
    lines.push(`*** ${draft.watermark} ***`);
    lines.push("");
  }

  for (const section of draft.sections) {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(section.body);
    lines.push("");
  }

  return lines.join("\n");
}

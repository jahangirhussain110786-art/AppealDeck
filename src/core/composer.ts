import type { ViolationKind } from "./index";
import type { DocumentType } from "./readiness";
import {
  composerModeFor,
  isNarrativeSufficient,
  isNarrativeTextSufficient,
  isRequiredComplete,
} from "./readiness";
import type { CaseFileData, ComposerMode } from "./readiness";
import { requirementsFor } from "./evidenceModel";
import { defaultDocumentType } from "./readiness";

export interface PoaSection {
  heading: string;
  body: string;
  /**
   * Provenance of `body`, for an honest per-section label in the UI. Undefined (the default from
   * `composePoa()` itself) means the deterministic path — the seller's own words, or a plain
   * system message about a gap. Only `applyLlmSections` (`src/lib/llm/composePoaLlm.ts`) sets
   * `"ai"`, and only on the specific section it actually replaced.
   */
  source?: "seller" | "ai";
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
    /**
     * True only when an LLM call (`composePoaWithLlm`, `src/lib/llm/composePoaLlm.ts`) actually
     * replaced the Root Cause / Preventive Measures body text with a drafted version, grounded in
     * the same seller-provided facts. `composePoa()` itself never sets this — it is the
     * deterministic, always-available fallback and always produces verbatim seller text. Left
     * false here rather than omitted so every draft (deterministic or not) reports its own
     * provenance instead of leaving the seller to guess.
     */
    aiDrafted: boolean;
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

// The composer is platform-agnostic core, so these seller-facing gap messages live here instead of
// importing the app content module.
export const ROOT_CAUSE_GAP_MESSAGE =
  "There isn't enough detail here yet to draft this section credibly. Return to the case interview and describe, specifically, what caused this issue and how your process allowed it to happen.";
export const PREVENTIVE_MEASURES_GAP_MESSAGE =
  "No preventive measures were provided. Add the specific changes you have made, or will make, to prevent this issue from recurring.";
export const NARRATIVE_GAP_MESSAGE =
  "The root-cause narrative needs more specific detail before this section can be drafted credibly.";

export function composePoa(data: CaseFileData, attemptNumber: number = 1): PoaDraft {
  const mode = composerModeFor(data);
  const docType = defaultDocumentType(data.kind);
  const complete = isRequiredComplete(data);

  const sections: PoaSection[] = [];

  sections.push(buildRootCauseSection(data));
  sections.push(buildCorrectiveActionsSection(data));
  sections.push(buildPreventiveMeasuresSection(data));

  if (mode.mode === "gap-draft") {
    sections.push(buildGapSection(data, mode));
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
      aiDrafted: false,
    },
  };
}

function buildRootCauseSection(data: CaseFileData): PoaSection {
  if (isNarrativeSufficient(data)) {
    const leadIn = data.timelineEvents?.[0]?.date ? `On ${data.timelineEvents[0].date}: ` : "";
    return {
      heading: "Root Cause",
      body: `${leadIn}${data.rootCause!.trim()}`,
    };
  }

  return {
    heading: "Root Cause",
    body: ROOT_CAUSE_GAP_MESSAGE,
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
  const preventiveMeasures = data.preventiveMeasures?.trim();
  if (preventiveMeasures && isNarrativeTextSufficient(preventiveMeasures)) {
    return {
      heading: "Preventive Measures",
      body: preventiveMeasures,
    };
  }

  return {
    heading: "Preventive Measures",
    body: PREVENTIVE_MEASURES_GAP_MESSAGE,
  };
}

function buildGapSection(data: CaseFileData, mode: ComposerMode): PoaSection {
  const missing = requirementsFor(data.kind).filter((r) => {
    if (!r.required) return false;
    const slot = data.evidenceSlots[r.kind];
    return !slot || !slot.present;
  });

  const items = missing.map((r) => `- ${r.kind.replace(/_/g, " ")}: ${r.whyAmazonWantsIt}`);
  const parts: string[] = [];

  if (missing.length > 0) {
    parts.push(
      "The following required evidence is missing. Obtain these items before submitting:\n\n" +
        items.join("\n"),
    );
  }

  if (mode.gapReason === "narrative" || mode.gapReason === "both") {
    parts.push(NARRATIVE_GAP_MESSAGE);
  }

  return {
    heading: "Evidence Gaps (Action Required)",
    body: parts.length > 0 ? parts.join("\n\n") : "[No specific gaps detected.]",
  };
}

export function critiquePoa(draft: PoaDraft, data: CaseFileData): CriticResult {
  const findings: CriticFinding[] = [];

  checkUnattestedClaims(draft, data, findings);
  checkEmptyEvidenceSlots(draft, data, findings);
  checkNovelty(draft, findings);
  checkBannedLanguage(draft, findings);
  checkSeverityGate(draft, data, findings);
  // AA-31 deterministic critic rules (11 Sep 2026) — warnings/info only, never hard blocks,
  // per the amendment's own instruction ("warnings, never hard blocks"). Real-world failure
  // modes for these came from the 2 Sep 2026 competitor recheck's forum evidence, merged into
  // 07-REFERENCE/02-COMPETITOR-DOSSIER.md §3a: generic language, invented commitments, and
  // blaming people instead of naming a root cause are documented rejection triggers, not
  // hypothetical risks.
  checkFutureTenseCorrectiveActions(draft, findings);
  checkBlameShifting(draft, findings);
  checkVagueTimePhrases(draft, findings);
  checkDocumentFreshness(data, findings);
  checkUnreferencedEvidence(draft, data, findings);

  const passed = !findings.some((f) => f.severity === "error");

  return { findings, passed };
}

function checkUnattestedClaims(
  _draft: PoaDraft,
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
  _draft: PoaDraft,
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

function checkSeverityGate(_draft: PoaDraft, data: CaseFileData, findings: CriticFinding[]): void {
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

// --- AA-31 deterministic critic rules (11 Sep 2026) -------------------------------------------

const FUTURE_TENSE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwe\s+will\s+\w+/i,
  /\bwe('| a)?re\s+going\s+to\s+\w+/i,
  /\bwe\s+plan\s+to\s+\w+/i,
  /\bwe\s+intend\s+to\s+\w+/i,
  /\bfrom\s+now\s+on,?\s+we\s+will\b/i,
];

/**
 * Corrective actions must describe what was already done, not what will be done — Amazon reads
 * a Plan of Action as a record of completed remediation, and "we will fix this" is exactly the
 * kind of unfulfillable commitment the 2 Sep 2026 competitor recheck's forum evidence names as a
 * documented rejection trigger (see 07-REFERENCE/02-COMPETITOR-DOSSIER.md §3a). Warning only —
 * a seller may have a legitimate reason to describe planned work, e.g. a preventive measure still
 * being rolled out — the critic flags it for a human decision, it never blocks.
 */
function checkFutureTenseCorrectiveActions(draft: PoaDraft, findings: CriticFinding[]): void {
  const section = draft.sections.find((s) => s.heading === "Corrective Actions");
  if (!section) return;
  const hits = FUTURE_TENSE_PATTERNS.filter((p) => p.test(section.body));
  if (hits.length > 0) {
    findings.push({
      severity: "warning",
      code: "FUTURE_TENSE_CORRECTIVE_ACTION",
      message:
        "Corrective Actions reads as a future promise ('we will…') rather than something already done. Amazon expects completed remediation here — describe what changed, not what's planned.",
    });
  }
}

const BLAME_SHIFTING_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(the|our)\s+supplier\s+(caused|was\s+responsible|did\s+this|misled)/i,
  /\b(a\s+former|our\s+(former\s+)?)\s*employee\s+(caused|was\s+responsible|did\s+this)/i,
  /\bthis\s+was\s+(out\s+of\s+our\s+control|not\s+our\s+fault|beyond\s+our\s+control)/i,
  /\b(the\s+)?system\s+(glitch|error)\s+caused\b/i,
  /\bwe\s+(were\s+)?not\s+aware\s+(this\s+was|of\s+this)\b/i,
];

/**
 * Naming a supplier, an ex-employee, or "the system" as the cause — instead of the seller's own
 * process gap — is a documented rejection pattern (real forum thread: 24 rejections on one case
 * traced to blaming employees instead of naming a systemic root cause; see the dossier §3a
 * citation above). Warning only, never a hard block — sometimes a third party genuinely was the
 * proximate cause, and the seller still needs to say so; the critic just makes sure the *root
 * cause* framing (what the seller's own process failed to catch) is present too.
 */
function checkBlameShifting(draft: PoaDraft, findings: CriticFinding[]): void {
  const rootCause = draft.sections.find((s) => s.heading === "Root Cause");
  if (!rootCause) return;
  if (BLAME_SHIFTING_PATTERNS.some((p) => p.test(rootCause.body))) {
    findings.push({
      severity: "warning",
      code: "BLAME_SHIFTING_LANGUAGE",
      message:
        "Root Cause names a third party or an external event as the cause. Amazon expects the seller's own process gap — e.g. what verification step should have caught this before it reached a customer.",
    });
  }
}

const VAGUE_TIME_PATTERNS: ReadonlyArray<RegExp> = [
  /\brecently\b/i,
  /\bsoon\b/i,
  /\bshortly\b/i,
  /\bin\s+the\s+near\s+future\b/i,
  /\bas\s+soon\s+as\s+possible\b/i,
  /\bright\s+away\b/i,
];

/**
 * "We recently fixed this" tells Amazon nothing checkable. A dated corrective action ("on 3 Sep
 * 2026 we...") is verifiable; a vague-time phrase is not. Warning only.
 */
function checkVagueTimePhrases(draft: PoaDraft, findings: CriticFinding[]): void {
  const fullText = draft.sections.map((s) => s.body).join("\n");
  const hits = VAGUE_TIME_PATTERNS.filter((p) => p.test(fullText));
  if (hits.length > 0) {
    findings.push({
      severity: "warning",
      code: "VAGUE_TIME_PHRASE",
      message:
        "The draft uses a vague time phrase (e.g. 'recently', 'soon') instead of a specific date. Replace it with the actual date the action was taken — a checkable date reads as more credible than a vague one.",
    });
  }
}

/**
 * Cross-checks each present, dated evidence slot against its requirement's `freshnessDays`
 * (e.g. a supplier invoice must show an issue date within 365 days — verified against the 2 Sep
 * 2026 policy fact-check, not invented). Only runs when a document date was actually captured;
 * silently skips slots where the vault UI hasn't recorded one yet, rather than penalizing the
 * seller for a gap in our own data capture.
 */
function checkDocumentFreshness(data: CaseFileData, findings: CriticFinding[]): void {
  const requirements = requirementsFor(data.kind);
  for (const req of requirements) {
    if (!req.freshnessDays) continue;
    const slot = data.evidenceSlots[req.kind];
    if (!slot?.present || !slot.documentDate) continue;
    const documentDate = new Date(slot.documentDate);
    if (Number.isNaN(documentDate.getTime())) continue;
    const ageDays = Math.round((Date.now() - documentDate.getTime()) / 86_400_000);
    if (ageDays > req.freshnessDays) {
      findings.push({
        severity: "warning",
        code: "DOCUMENT_STALE",
        message: `${req.kind.replace(/_/g, " ")} is dated ${ageDays} days ago, older than the ${req.freshnessDays}-day freshness Amazon typically expects. Consider obtaining a more recent document.`,
      });
    }
  }
}

/**
 * Nudges the seller to reference present evidence by filename in the draft text — a POA that
 * says "see attached supplier_invoice.pdf" is easier for a reviewer to cross-check than one that
 * mentions evidence only in the abstract. Info-level only; this is a quality suggestion, not a
 * correctness check.
 */
function checkUnreferencedEvidence(
  draft: PoaDraft,
  data: CaseFileData,
  findings: CriticFinding[],
): void {
  const presentKinds = Object.entries(data.evidenceSlots)
    .filter(([, slot]) => slot?.present)
    .map(([kind]) => kind);
  if (presentKinds.length === 0) return;
  const fullText = draft.sections
    .map((s) => s.body)
    .join("\n")
    .toLowerCase();
  const unreferenced = presentKinds.filter((kind) => !fullText.includes(kind.replace(/_/g, " ")));
  if (unreferenced.length > 0) {
    findings.push({
      severity: "info",
      code: "EVIDENCE_NOT_REFERENCED_BY_NAME",
      message: `${unreferenced.length} attached evidence item(s) aren't mentioned by name in the draft text. Referencing evidence directly (e.g. "see the attached supplier invoice") helps a reviewer cross-check it.`,
    });
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

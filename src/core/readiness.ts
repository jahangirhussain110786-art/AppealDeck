import type { ViolationKind } from "./index";
import { requirementsFor } from "./evidenceModel";
import type { EvidenceKind, EvidenceRequirement } from "./evidenceModel";

export type DocumentType =
  "poa" | "ip_dispute" | "funds_appeal" | "listing_appeal" | "followup_nudge";

export interface ActionItem {
  id: string;
  label: string;
  evidenceSlots: EvidenceKind[];
  status: "todo" | "in_progress" | "done";
  declined?: { reason: string; at: string };
  attestation?: { attestedAt: string; note: string };
  /**
   * Answer to the "have you done this yet?" check the interview asks before requesting a file
   * (AM-24, 12 Sep 2026 — founder: sellers should be asked whether an action is already done,
   * still planned, or not possible, not sent straight to a file-upload box). `"done"` means the
   * interview should now ask for the proof; `"will_do"` means the seller intends to but hasn't
   * yet, so the file step is skipped for now and the item's `status` moves to `"in_progress"`.
   * Undefined means the check hasn't been asked yet.
   */
  actionCheckAnswer?: "done" | "will_do";
}

export interface ActionAlternative {
  id: string;
  label: string;
  honestyNote: string;
  consequence: string;
  readinessImpact: "none" | "reduced" | "path_change";
}

export interface ReadinessResult {
  score: number;
  missing: EvidenceRequirement[];
  disqualifiedPresent: string[];
  unattestedActions: ActionItem[];
}

export interface CaseFileData {
  kind: ViolationKind;
  rootCause?: string;
  timelineEvents?: Array<{ date: string; description: string }>;
  preventiveMeasures?: string;
  /**
   * `documentDate` (optional, ISO date string) is the date printed on the uploaded document
   * itself (e.g. a supplier invoice's issue date) — not when it was uploaded. Used by the
   * composer's freshness check (AA-31) against each requirement's `freshnessDays`. Left
   * undefined wherever the vault UI doesn't yet capture it; the check simply skips those slots.
   */
  evidenceSlots: Partial<
    Record<EvidenceKind, { present: boolean; disqualified?: boolean; documentDate?: string }>
  >;
  actionItems: ActionItem[];
}

export function computeReadiness(data: CaseFileData): ReadinessResult {
  const requirements = requirementsFor(data.kind);
  const required = requirements.filter((r) => r.required);

  const missing: EvidenceRequirement[] = [];
  let disqualifiedPresent: string[] = [];

  for (const req of required) {
    const slot = data.evidenceSlots[req.kind];
    if (!slot || !slot.present) {
      missing.push(req);
    } else if (slot.disqualified) {
      disqualifiedPresent.push(req.kind);
    }
  }

  const unattestedActions = data.actionItems.filter((a) => a.status === "done" && !a.attestation);

  const total = required.length;
  const satisfied = total - missing.length - disqualifiedPresent.length;
  const score = total === 0 ? 1 : Math.max(0, satisfied / total);

  return { score, missing, disqualifiedPresent, unattestedActions };
}

export function isRequiredComplete(data: CaseFileData): boolean {
  const result = computeReadiness(data);
  return result.missing.length === 0 && result.disqualifiedPresent.length === 0;
}

const MIN_NARRATIVE_CHARS = 40;
const LOW_EFFORT_NARRATIVES = new Set([
  "idk",
  "i don't know",
  "n/a",
  "na",
  "none",
  "unknown",
  "not sure",
  "no idea",
]);

export function isNarrativeSufficient(data: Pick<CaseFileData, "rootCause">): boolean {
  return isNarrativeTextSufficient(data.rootCause);
}

export function isNarrativeTextSufficient(text: string | undefined): boolean {
  const value = (text ?? "").trim();
  if (value.length < MIN_NARRATIVE_CHARS) return false;
  return !LOW_EFFORT_NARRATIVES.has(value.toLowerCase());
}

export function generateActionItems(kind: ViolationKind): ActionItem[] {
  const requirements = requirementsFor(kind);
  const items: ActionItem[] = [];

  for (const req of requirements) {
    if (!req.required) continue;
    items.push({
      id: `obtain_${req.kind}`,
      label: `Obtain ${req.kind.replace(/_/g, " ")}`,
      evidenceSlots: [req.kind],
      status: "todo",
    });
  }

  return items;
}

const DOC_TYPE_MATRIX: ReadonlyArray<{ type: DocumentType; kinds: ViolationKind[] }> = [
  { type: "poa", kinds: ["RELATED_ACCOUNT", "POLICY", "UNKNOWN"] },
  { type: "ip_dispute", kinds: ["INTELLECTUAL_PROPERTY"] },
  { type: "funds_appeal", kinds: ["FUNDS"] },
  { type: "listing_appeal", kinds: ["LISTING"] },
  { type: "poa", kinds: ["INAUTHENTIC_DOCUMENTS"] },
];

export function documentTypesFor(kind: ViolationKind): DocumentType[] {
  const types = new Set<DocumentType>();
  for (const entry of DOC_TYPE_MATRIX) {
    if (entry.kinds.includes(kind)) {
      types.add(entry.type);
    }
  }
  return [...types];
}

export function defaultDocumentType(kind: ViolationKind): DocumentType {
  const types = documentTypesFor(kind);
  return types[0] ?? "poa";
}

export function toneProfileFor(docType: DocumentType): string {
  switch (docType) {
    case "ip_dispute":
      return "factual-rebuttal";
    case "funds_appeal":
      return "risk-removal";
    case "listing_appeal":
      return "risk-removal";
    case "followup_nudge":
      return "ownership";
    case "poa":
    default:
      return "ownership";
  }
}

export interface ComposerMode {
  mode: "full-draft" | "gap-draft";
  reason: string;
  gapReason?: "evidence" | "narrative" | "both";
}

export function composerModeFor(data: CaseFileData): ComposerMode {
  const evidenceComplete = isRequiredComplete(data);
  const narrativeComplete = isNarrativeSufficient(data);
  if (evidenceComplete && narrativeComplete) {
    return { mode: "full-draft", reason: "Required evidence and narrative are complete." };
  }

  const gapReason =
    !evidenceComplete && !narrativeComplete ? "both" : !evidenceComplete ? "evidence" : "narrative";

  return {
    mode: "gap-draft",
    reason:
      gapReason === "narrative"
        ? "The root-cause narrative needs more specific detail."
        : gapReason === "both"
          ? "Required evidence and the root-cause narrative are incomplete."
          : "Required evidence incomplete — rendering gap draft with action plan.",
    gapReason,
  };
}

export const READINESS_COPY = "Case-file completeness — not a prediction of Amazon's decision.";

export function readinessLabel(score: number): string {
  return `Case-file completeness: ${Math.round(score * 100)}% — not a prediction of Amazon's decision.`;
}

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
  evidenceSlots: Partial<Record<EvidenceKind, { present: boolean; disqualified?: boolean }>>;
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
}

export function composerModeFor(data: CaseFileData): ComposerMode {
  const complete = isRequiredComplete(data);
  if (complete) {
    return { mode: "full-draft", reason: "Required evidence complete." };
  }
  return {
    mode: "gap-draft",
    reason: "Required evidence incomplete — rendering gap draft with action plan.",
  };
}

export const READINESS_COPY = "Case-file completeness — not a prediction of Amazon's decision.";

export function readinessLabel(score: number): string {
  return `Case-file completeness: ${Math.round(score * 100)}% — not a prediction of Amazon's decision.`;
}

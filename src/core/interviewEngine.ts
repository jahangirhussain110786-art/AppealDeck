import type { ViolationKind } from "./index";
import type { CaseState } from "./caseState";
import { requirementsFor } from "./evidenceModel";
import type { EvidenceKind, EvidenceRequirement } from "./evidenceModel";
import { generateActionItems, isRequiredComplete } from "./readiness";
import type { ActionItem, ActionAlternative } from "./readiness";

export type StepKind =
  | "intake_root_cause"
  | "intake_timeline"
  | "intake_prior_appeals"
  | "evidence_ask"
  | "action_check"
  | "status_explanation";

export type InputType = "enum" | "file" | "date" | "number" | "short_text";

export interface EnumOption {
  id: string;
  label: string;
}

export interface InterviewStep {
  id: string;
  kind: StepKind;
  title: string;
  prompt: string;
  inputType: InputType;
  options?: EnumOption[];
  evidenceKind?: EvidenceKind;
  actionItem?: ActionItem;
  required?: boolean;
  whyAmazonWantsIt?: string;
  declineAlternatives?: ActionAlternative[];
}

export interface StepAnswer {
  stepId: string;
  value?: string;
  choiceId?: string;
  filePresent?: boolean;
  declined?: boolean;
  declineReason?: string;
  declineAlternativeId?: string;
}

export interface CaseFile {
  kind: ViolationKind;
  state: CaseState;
  rootCause?: string;
  timelineEvents: Array<{ date: string; description: string }>;
  priorAppealCount: number;
  evidenceSlots: Partial<Record<EvidenceKind, { present: boolean; disqualified?: boolean }>>;
  actionItems: ActionItem[];
  attemptCount: number;
}

export interface InterviewProgress {
  current: number;
  total: number;
  pendingEvidence: number;
}

export function createCaseFile(kind: ViolationKind): CaseFile {
  return {
    kind,
    state: "DECODED",
    timelineEvents: [],
    priorAppealCount: 0,
    evidenceSlots: {},
    actionItems: generateActionItems(kind),
    attemptCount: 0,
  };
}

export function nextStep(file: CaseFile): InterviewStep | null {
  if (file.state === "GATED_PRO_HELP" || file.state === "READY") {
    return null;
  }

  if (!file.rootCause) {
    return {
      id: "intake_root_cause",
      kind: "intake_root_cause",
      title: "What happened?",
      prompt:
        "In your own words, what led to this enforcement? This stays in your case file and is never sent to Amazon unless you choose to include it.",
      inputType: "short_text",
      required: true,
    };
  }

  if (file.timelineEvents.length === 0) {
    return {
      id: "intake_timeline",
      kind: "intake_timeline",
      title: "Key dates",
      prompt:
        "When did you receive the notice? Add any other relevant dates (deactivation, first contact with Amazon, etc.).",
      inputType: "date",
      required: true,
    };
  }

  if (file.priorAppealCount === 0 && file.attemptCount === 0) {
    return {
      id: "intake_prior_appeals",
      kind: "intake_prior_appeals",
      title: "Prior appeals",
      prompt: "Have you submitted any appeals for this issue before?",
      inputType: "enum",
      options: [
        { id: "no", label: "No, this is my first" },
        { id: "yes_1", label: "Yes, once before" },
        { id: "yes_2plus", label: "Yes, more than once" },
      ],
      required: true,
    };
  }

  const openAction = file.actionItems.find((a) => a.status === "todo");
  if (openAction) {
    const slotKind = openAction.evidenceSlots[0];
    if (!slotKind) return null;
    const req = requirementsFor(file.kind).find((r) => r.kind === slotKind);
    return {
      id: `evidence_${slotKind}`,
      kind: "evidence_ask",
      title: `Provide: ${slotKind.replace(/_/g, " ")}`,
      prompt:
        req?.whyAmazonWantsIt ??
        `Amazon requires ${slotKind.replace(/_/g, " ")} for this appeal type.`,
      inputType: "file",
      evidenceKind: slotKind,
      actionItem: openAction,
      required: req?.required ?? true,
      whyAmazonWantsIt: req?.whyAmazonWantsIt,
      declineAlternatives: req ? alternativesFor(req) : undefined,
    };
  }

  if (!isRequiredComplete(file)) {
    return {
      id: "status_incomplete",
      kind: "status_explanation",
      title: "Evidence still needed",
      prompt:
        "Some required evidence is still missing. You can proceed with a gap draft that names what's missing, or continue gathering.",
      inputType: "enum",
      options: [
        { id: "proceed_gap", label: "Proceed with gap draft" },
        { id: "continue", label: "Continue gathering evidence" },
      ],
    };
  }

  return null;
}

export function applyAnswer(file: CaseFile, answer: StepAnswer): CaseFile {
  const next: CaseFile = {
    ...file,
    timelineEvents: [...file.timelineEvents],
    evidenceSlots: { ...file.evidenceSlots },
    actionItems: file.actionItems.map((a) => ({ ...a })),
  };

  switch (answer.stepId) {
    case "intake_root_cause":
      if (answer.value) {
        next.rootCause = answer.value;
      }
      break;

    case "intake_timeline":
      if (answer.value) {
        next.timelineEvents.push({
          date: answer.value,
          description: "Key date",
        });
      }
      break;

    case "intake_prior_appeals":
      if (answer.choiceId === "yes_1") {
        next.priorAppealCount = 1;
      } else if (answer.choiceId === "yes_2plus") {
        next.priorAppealCount = 2;
      }
      break;

    default:
      if (answer.stepId.startsWith("evidence_")) {
        const kind = answer.stepId.replace("evidence_", "") as EvidenceKind;
        const actionIdx = next.actionItems.findIndex((a) => a.evidenceSlots[0] === kind);
        if (actionIdx === -1) break;
        const action = next.actionItems[actionIdx];
        if (!action) break;

        if (answer.declined) {
          action.status = "todo";
          action.declined = {
            reason: answer.declineReason ?? "User declined",
            at: new Date().toISOString(),
          };
        } else if (answer.filePresent) {
          next.evidenceSlots[kind] = { present: true };
          action.status = "done";
        }
      }
      break;
  }

  return next;
}

export function interviewProgress(file: CaseFile): InterviewProgress {
  const total = countTotalSteps(file);
  const current = countCompletedSteps(file);
  const pendingEvidence = file.actionItems.filter((a) => a.status === "todo").length;
  return { current, total, pendingEvidence };
}

function countTotalSteps(file: CaseFile): number {
  let count = 3;
  count += file.actionItems.length;
  return count;
}

function countCompletedSteps(file: CaseFile): number {
  let count = 0;
  if (file.rootCause) count++;
  if (file.timelineEvents.length > 0) count++;
  if (file.priorAppealCount === 0 && file.attemptCount === 0) {
    // not yet answered
  } else {
    count++;
  }
  for (const action of file.actionItems) {
    if (action.status === "done") count++;
  }
  return count;
}

function alternativesFor(req: EvidenceRequirement): ActionAlternative[] {
  const base: ActionAlternative[] = [];

  if (req.kind === "supplier_invoice") {
    base.push({
      id: "sourcing_change",
      label: "Switch narrative to sourcing change + inventory disposal",
      honestyNote:
        "This path honestly states you cannot obtain the invoice and are changing sourcing.",
      consequence:
        "Amazon commonly re-asks for the invoice; this path has a weaker evidentiary foundation.",
      readinessImpact: "reduced",
    });
  }

  base.push({
    id: "decline_proceed",
    label: "Decline and proceed without this evidence",
    honestyNote: "The appeal proceeds without this item. The gap draft will name it.",
    consequence: `Missing ${req.kind.replace(/_/g, " ")} typically weakens the appeal.`,
    readinessImpact: "reduced",
  });

  return base;
}

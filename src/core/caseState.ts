import type { ViolationKind } from "./index";

export type CaseState =
  | "DECODED"
  | "GATED_PRO_HELP"
  | "INTAKE"
  | "REMEDIATION"
  | "READY"
  | "SUBMITTED"
  | "AWAITING"
  | "APPROVED"
  | "REJECTED"
  | "REVISION"
  | "NO_RESPONSE"
  | "FOLLOW_UP"
  | "ESCALATION"
  | "CLOSED";

export interface CaseStateContext {
  kind: ViolationKind;
  severityGated: boolean;
  intakeComplete: boolean;
  requiredComplete: boolean;
  submitted: boolean;
  attemptCount: number;
  hasReply: boolean;
  replyCategory?: ReplyCategory;
  fundsHeld: boolean;
  fundsEligible: boolean;
}

export type ReplyCategory =
  | "needs_more_information"
  | "document_request"
  | "identity_verification"
  | "final_decision_negative"
  | "reinstated"
  | "funds_decision"
  | "unrecognized";

interface Transition {
  to: CaseState;
  guard: (ctx: CaseStateContext) => boolean;
  priority: number;
}

const SUBMITTED_STATES: ReadonlySet<CaseState> = new Set([
  "SUBMITTED",
  "AWAITING",
  "REJECTED",
  "REVISION",
  "NO_RESPONSE",
  "FOLLOW_UP",
  "ESCALATION",
]);

export function isSubmitted(state: CaseState): boolean {
  return SUBMITTED_STATES.has(state);
}

export function isTerminal(state: CaseState): boolean {
  return state === "APPROVED" || state === "CLOSED" || state === "GATED_PRO_HELP";
}

const TRANSITIONS: ReadonlyArray<Transition> = [
  { to: "GATED_PRO_HELP", guard: (ctx) => ctx.severityGated && !ctx.submitted, priority: 100 },
  { to: "APPROVED", guard: (ctx) => ctx.replyCategory === "reinstated", priority: 95 },
  {
    to: "INTAKE",
    guard: (ctx) => !ctx.severityGated && !ctx.submitted && !ctx.intakeComplete,
    priority: 90,
  },
  { to: "READY", guard: (ctx) => ctx.requiredComplete && !ctx.submitted, priority: 85 },
  {
    to: "REMEDIATION",
    guard: (ctx) =>
      !ctx.severityGated && !ctx.submitted && ctx.intakeComplete && !ctx.requiredComplete,
    priority: 80,
  },
  {
    to: "REJECTED",
    guard: (ctx) =>
      ctx.submitted &&
      (ctx.replyCategory === "final_decision_negative" ||
        ctx.replyCategory === "needs_more_information" ||
        ctx.replyCategory === "document_request" ||
        ctx.replyCategory === "identity_verification"),
    priority: 75,
  },
  { to: "AWAITING", guard: (ctx) => ctx.submitted && !ctx.hasReply, priority: 70 },
  {
    to: "NO_RESPONSE",
    guard: (ctx) => ctx.submitted && ctx.attemptCount >= 1 && !ctx.hasReply,
    priority: 60,
  },
];

export function nextState(ctx: CaseStateContext, current: CaseState): CaseState {
  if (isTerminal(current)) return current;

  const sorted = [...TRANSITIONS].sort((a, b) => b.priority - a.priority);
  for (const t of sorted) {
    if (t.guard(ctx)) return t.to;
  }
  return current;
}

export function nextBestActions(state: CaseState): string[] {
  switch (state) {
    case "DECODED":
      return ["Start intake to classify your case needs"];
    case "GATED_PRO_HELP":
      return ["This case type requires professional help. We cannot generate a self-serve draft."];
    case "INTAKE":
      return ["Complete the intake questions"];
    case "REMEDIATION":
      return ["Complete the required actions and attach evidence"];
    case "READY":
      return ["Review and submit your Plan of Action"];
    case "SUBMITTED":
      return ["Wait for Amazon's response"];
    case "AWAITING":
      return ["If no response after your reminder period, consider following up"];
    case "APPROVED":
      return ["Reinstatement confirmed. Review the post-win hardening checklist"];
    case "REJECTED":
    case "REVISION":
      return ["Review the feedback, address the gaps, and resubmit with new information"];
    case "NO_RESPONSE":
      return ["Send a follow-up referencing your original submission"];
    case "FOLLOW_UP":
      return ["Submit the follow-up with any new information"];
    case "ESCALATION":
      return ["Advance to the next escalation stage or consult a professional"];
    case "CLOSED":
      return [];
    default:
      return [];
  }
}

export function availableDocTypes(state: CaseState): string[] {
  switch (state) {
    case "READY":
    case "SUBMITTED":
    case "REVISION":
      return ["poa", "funds_appeal", "ip_dispute"];
    case "REMEDIATION":
      return ["followup_nudge"];
    default:
      return [];
  }
}

export function expectationsCopy(state: CaseState): string {
  switch (state) {
    case "AWAITING":
    case "SUBMITTED":
      return "Amazon typically responds within a variable window. There is no fixed response time.";
    case "REVISION":
      return "Resubmissions must include new information or changed framing. Repeated identical submissions risk a permanent lock.";
    case "ESCALATION":
      return "Each escalation stage should add new information. Self-serve odds decrease at later stages.";
    case "NO_RESPONSE":
      return "A follow-up is reasonable after your chosen reminder period.";
    default:
      return "";
  }
}

export interface FundsTrackState {
  held: boolean;
  eligible: boolean;
  state: "INACTIVE" | "LOCKED" | "FUNDS_READY" | "FUNDS_SUBMITTED" | "FUNDS_AWAITING";
}

export function computeFundsTrack(ctx: CaseStateContext, currentState: CaseState): FundsTrackState {
  if (!ctx.fundsHeld) return { held: false, eligible: false, state: "INACTIVE" };
  if (!ctx.fundsEligible) return { held: true, eligible: false, state: "LOCKED" };
  if (isSubmitted(currentState)) return { held: true, eligible: true, state: "FUNDS_SUBMITTED" };
  return { held: true, eligible: true, state: "FUNDS_READY" };
}

export const NOVELTY_REQUIRED_FROM_ATTEMPT = 2;

export function noveltyRequired(attemptCount: number): boolean {
  return attemptCount >= NOVELTY_REQUIRED_FROM_ATTEMPT;
}

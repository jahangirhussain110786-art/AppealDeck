import type { ViolationKind } from "./index";

export type CaseState =
  | "DECODED"
  | "GATED_PRO_HELP"
  | "INTAKE"
  | "REMEDIATION"
  /**
   * AA-40: the case is blocked on a third party — usually a supplier who has not sent an invoice,
   * or a rights owner who has not answered a retraction request. Previously these cases sat in
   * REMEDIATION looking like the seller was procrastinating, when in fact they were waiting on
   * someone they do not control. Distinguishing the two changes what the product should say.
   */
  | "WAITING_THIRD_PARTY"
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
  reminderDue?: boolean;
  /** AA-40: set when the seller has recorded that they are blocked on a third party. */
  waitingOnThirdParty?: boolean;
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
  // AA-40: sits just above REMEDIATION, so a case blocked on a supplier is described as waiting
  // rather than as unfinished homework. Below READY on purpose — if the evidence has actually
  // arrived, the case is ready regardless of a stale waiting flag the seller forgot to clear.
  {
    to: "WAITING_THIRD_PARTY",
    guard: (ctx) =>
      !ctx.severityGated &&
      !ctx.submitted &&
      ctx.intakeComplete &&
      !ctx.requiredComplete &&
      ctx.waitingOnThirdParty === true,
    priority: 82,
  },
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
  {
    to: "AWAITING",
    guard: (ctx) => ctx.submitted && !ctx.hasReply && !ctx.reminderDue,
    priority: 70,
  },
  {
    to: "NO_RESPONSE",
    guard: (ctx) => ctx.submitted && !ctx.hasReply && ctx.reminderDue === true,
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

/**
 * `missingLabels` names the specific items still outstanding for states where that's known and
 * actionable — required-evidence labels for `REMEDIATION`, or the evidence Amazon's reply
 * explicitly asked for (`CaseLog.lastReply.extractedAsks`) for `REJECTED`/`REVISION`. Passing it
 * turns a generic "attach evidence" sentence into "Attach: supplier invoice, identity document"
 * — the caller already has this data computed (readiness/reply analysis) one card away on the
 * same page, so this closes real distance rather than adding new work (14 Sep 2026 founder
 * direction: exact, correct guidance over generic canned text). Ignored — safe to omit — for
 * every other state.
 */
export function nextBestActions(state: CaseState, missingLabels: readonly string[] = []): string[] {
  switch (state) {
    case "DECODED":
      return ["Start intake to classify your case needs"];
    case "GATED_PRO_HELP":
      return ["This case type requires professional help. We cannot generate a self-serve draft."];
    case "INTAKE":
      return ["Complete the intake questions"];
    case "REMEDIATION":
      return missingLabels.length > 0
        ? [`Attach the required evidence: ${missingLabels.join(", ")}`]
        : ["Complete the required actions and attach evidence"];
    case "WAITING_THIRD_PARTY":
      return [
        "You are waiting on someone else. Set a follow-up date and send the chase letter if it passes.",
      ];
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
      return missingLabels.length > 0
        ? [
            `Amazon's reply specifically asked for: ${missingLabels.join(", ")}. Address that, then resubmit with new information.`,
          ]
        : ["Review the feedback, address the gaps, and resubmit with new information"];
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
    /*
      Corrected 23 Sep 2026. These two lines carried claims this project's own research had already
      withdrawn, and the first of them renders in `BeforeYouSubmitChecklist` — the last thing a
      seller reads before submitting, and the moment they are most frightened.

      "Repeated identical submissions risk a permanent lock" is marked **causality unsupported** in
      `docs/handoffs/2026-09-21-phase-1-evidence-review.md` row 7: the only source is a four-year-old,
      case-specific staff reply about invalid follow-up documents receiving no further response, which
      is far narrower than a universal rule. That review's own instruction is to recommend comparison
      with the previous submission "because it makes changed evidence visible, not because it predicts
      an irreversible penalty".

      "Self-serve odds decrease at later stages" is an efficacy claim with nothing behind it. §70 of
      the same review lists rejection rates and successful outcomes among the things it does not
      support, and the 22 Sep legal research records that unsubstantiated efficacy claims are exactly
      what the FTC's DoNotPay order turns on.

      Both now say what is true and useful, and predict nothing.
    */
    case "REVISION":
      return "Answer the specific request in Amazon's latest reply. Your response is compared against what you already sent, so you can see what has changed before you submit.";
    case "ESCALATION":
      return "Send something Amazon has not already seen. No one outside Amazon can tell you how a further attempt will be judged.";
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

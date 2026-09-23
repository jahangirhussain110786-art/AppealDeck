import { describe, it, expect } from "vitest";
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
  type CaseState,
  type CaseStateContext,
} from "./caseState";

/**
 * Written as the keys of a `Record<CaseState, 1>` rather than a plain array so that adding a state
 * to the union fails typecheck until it is listed here. An array would silently leave the new
 * state's copy unchecked, which is the shape of the bug this list exists to catch.
 */
const ALL_STATES = Object.keys({
  DECODED: 1,
  GATED_PRO_HELP: 1,
  INTAKE: 1,
  REMEDIATION: 1,
  WAITING_THIRD_PARTY: 1,
  READY: 1,
  SUBMITTED: 1,
  AWAITING: 1,
  APPROVED: 1,
  REJECTED: 1,
  REVISION: 1,
  NO_RESPONSE: 1,
  FOLLOW_UP: 1,
  ESCALATION: 1,
  CLOSED: 1,
} satisfies Record<CaseState, 1>) as CaseState[];

const baseCtx = (overrides: Partial<CaseStateContext> = {}): CaseStateContext => ({
  kind: "POLICY",
  severityGated: false,
  intakeComplete: false,
  requiredComplete: false,
  submitted: false,
  attemptCount: 0,
  hasReply: false,
  fundsHeld: false,
  fundsEligible: false,
  ...overrides,
});

describe("caseState transitions", () => {
  it("severity-gated kinds go to GATED_PRO_HELP before submission", () => {
    const ctx = baseCtx({ kind: "INAUTHENTIC_DOCUMENTS", severityGated: true });
    expect(nextState(ctx, "DECODED")).toBe("GATED_PRO_HELP");
  });

  it("non-gated kinds move from DECODED to INTAKE", () => {
    expect(nextState(baseCtx(), "DECODED")).toBe("INTAKE");
  });

  it("REMEDIATION when intake done but evidence incomplete", () => {
    const ctx = baseCtx({ intakeComplete: true, requiredComplete: false });
    expect(nextState(ctx, "INTAKE")).toBe("REMEDIATION");
  });

  it("READY when required evidence is complete", () => {
    const ctx = baseCtx({ intakeComplete: true, requiredComplete: true });
    expect(nextState(ctx, "REMEDIATION")).toBe("READY");
  });

  it("AWAITING after submission with no reply", () => {
    const ctx = baseCtx({ submitted: true, attemptCount: 1 });
    expect(nextState(ctx, "SUBMITTED")).toBe("AWAITING");
  });

  it("NO_RESPONSE only after the seller's reminder is due", () => {
    expect(
      nextState(baseCtx({ submitted: true, attemptCount: 1, reminderDue: true }), "AWAITING"),
    ).toBe("NO_RESPONSE");
    expect(
      nextState(baseCtx({ submitted: true, attemptCount: 5, reminderDue: false }), "AWAITING"),
    ).toBe("AWAITING");
  });

  it("APPROVED when reinstated reply arrives", () => {
    const ctx = baseCtx({ submitted: true, hasReply: true, replyCategory: "reinstated" });
    expect(nextState(ctx, "AWAITING")).toBe("APPROVED");
  });

  it("REJECTED on final_decision_negative", () => {
    const ctx = baseCtx({
      submitted: true,
      hasReply: true,
      replyCategory: "final_decision_negative",
    });
    expect(nextState(ctx, "AWAITING")).toBe("REJECTED");
  });

  it("REJECTED on needs_more_information", () => {
    const ctx = baseCtx({
      submitted: true,
      hasReply: true,
      replyCategory: "needs_more_information",
    });
    expect(nextState(ctx, "AWAITING")).toBe("REJECTED");
  });

  it("REJECTED on document_request", () => {
    const ctx = baseCtx({ submitted: true, hasReply: true, replyCategory: "document_request" });
    expect(nextState(ctx, "AWAITING")).toBe("REJECTED");
  });

  it("does not leave terminal states", () => {
    const ctx = baseCtx({ requiredComplete: true });
    expect(nextState(ctx, "APPROVED")).toBe("APPROVED");
    expect(nextState(ctx, "CLOSED")).toBe("CLOSED");
    expect(nextState(ctx, "GATED_PRO_HELP")).toBe("GATED_PRO_HELP");
  });
});

describe("isTerminal / isSubmitted", () => {
  it("identifies terminal states", () => {
    expect(isTerminal("APPROVED")).toBe(true);
    expect(isTerminal("CLOSED")).toBe(true);
    expect(isTerminal("GATED_PRO_HELP")).toBe(true);
    expect(isTerminal("AWAITING")).toBe(false);
  });

  it("identifies submitted states", () => {
    expect(isSubmitted("SUBMITTED")).toBe(true);
    expect(isSubmitted("AWAITING")).toBe(true);
    expect(isSubmitted("REJECTED")).toBe(true);
    expect(isSubmitted("DECODED")).toBe(false);
    expect(isSubmitted("INTAKE")).toBe(false);
  });
});

describe("nextBestActions", () => {
  it("returns actions for every state", () => {
    const states = [
      "DECODED",
      "GATED_PRO_HELP",
      "INTAKE",
      "REMEDIATION",
      "READY",
      "SUBMITTED",
      "AWAITING",
      "APPROVED",
      "REJECTED",
      "REVISION",
      "NO_RESPONSE",
      "FOLLOW_UP",
      "ESCALATION",
      "CLOSED",
    ] as const;
    for (const s of states) {
      const actions = nextBestActions(s);
      expect(Array.isArray(actions)).toBe(true);
    }
  });

  it("CLOSED returns empty actions", () => {
    expect(nextBestActions("CLOSED")).toEqual([]);
  });

  it("REMEDIATION names the specific missing evidence when given", () => {
    const actions = nextBestActions("REMEDIATION", ["Supplier invoice", "Identity document"]);
    expect(actions[0]).toContain("Supplier invoice");
    expect(actions[0]).toContain("Identity document");
  });

  it("REMEDIATION falls back to the generic sentence with no missing labels", () => {
    expect(nextBestActions("REMEDIATION", [])).toEqual([
      "Complete the required actions and attach evidence",
    ]);
  });

  it("REJECTED/REVISION name exactly what Amazon's reply asked for when given", () => {
    const actions = nextBestActions("REJECTED", ["Identity document"]);
    expect(actions[0]).toContain("Identity document");
    expect(actions[0]).toMatch(/resubmit/i);
  });

  it("REJECTED/REVISION fall back to the generic sentence with no reply-derived labels", () => {
    expect(nextBestActions("REVISION", [])).toEqual([
      "Review the feedback, address the gaps, and resubmit with new information",
    ]);
  });

  it("ignores missingLabels for states that don't use it", () => {
    expect(nextBestActions("READY", ["Supplier invoice"])).toEqual([
      "Review and submit your Plan of Action",
    ]);
  });
});

describe("availableDocTypes", () => {
  it("READY offers poa, funds_appeal, ip_dispute", () => {
    expect(availableDocTypes("READY")).toEqual(["poa", "funds_appeal", "ip_dispute"]);
  });

  it("DECODES offers nothing", () => {
    expect(availableDocTypes("DECODED")).toEqual([]);
  });
});

describe("expectationsCopy", () => {
  it("AWAITING copy avoids time promises", () => {
    const copy = expectationsCopy("AWAITING");
    expect(copy).not.toMatch(/\d+\s*(hour|day|minute)/i);
  });

  it("REVISION copy points the seller at what has changed since their last submission", () => {
    expect(expectationsCopy("REVISION")).toMatch(/what you already sent|what has changed/i);
  });

  /**
   * Added 23 Sep 2026 with the correction to REVISION and ESCALATION. Two claims this project's own
   * research had withdrawn were shipping here — one of them rendered in `BeforeYouSubmitChecklist`,
   * the last thing a seller reads before submitting — and the suite had no assertion that could
   * notice. The previous REVISION test pinned the old wording, so it passed throughout.
   *
   * This guards the rule rather than the sentence: D6 forbids predicting Amazon's decision, and the
   * 22 Sep legal research records that unsubstantiated efficacy claims are what the FTC's DoNotPay
   * order turns on. Every state's copy is checked, not just the two that were wrong, because the
   * next one to drift will be a different state.
   */
  it("predicts nothing about Amazon's decision in any state's copy", () => {
    for (const state of ALL_STATES) {
      const copy = expectationsCopy(state);
      if (!copy) continue;
      expect(copy, state).not.toMatch(/permanent(?:ly)?[\s-]?lock/i);
      expect(copy, state).not.toMatch(/\bodds\b|\bchances\b|likelihood/i);
      expect(copy, state).not.toMatch(/run out of attempts|exhaust/i);
      expect(copy, state).not.toMatch(/\bguarantee|\bwin rate\b|success rate/i);
      expect(copy, state).not.toMatch(
        /more likely|less likely|improve[sd]? your|reduce[sd]? your/i,
      );
    }
  });
});

describe("computeFundsTrack", () => {
  it("INACTIVE when no funds held", () => {
    expect(computeFundsTrack(baseCtx(), "DECODED").state).toBe("INACTIVE");
  });

  it("LOCKED when held but not yet eligible", () => {
    const ctx = baseCtx({ fundsHeld: true, fundsEligible: false });
    expect(computeFundsTrack(ctx, "DECODED").state).toBe("LOCKED");
  });

  it("FUNDS_READY when eligible and not yet submitted", () => {
    const ctx = baseCtx({ fundsHeld: true, fundsEligible: true });
    expect(computeFundsTrack(ctx, "READY").state).toBe("FUNDS_READY");
  });

  it("FUNDS_SUBMITTED after submission", () => {
    const ctx = baseCtx({ fundsHeld: true, fundsEligible: true, submitted: true });
    expect(computeFundsTrack(ctx, "AWAITING").state).toBe("FUNDS_SUBMITTED");
  });
});

describe("noveltyRequired", () => {
  it("false below the threshold", () => {
    expect(noveltyRequired(0)).toBe(false);
    expect(noveltyRequired(1)).toBe(false);
  });

  it("true at and above the threshold", () => {
    expect(noveltyRequired(NOVELTY_REQUIRED_FROM_ATTEMPT)).toBe(true);
    expect(noveltyRequired(5)).toBe(true);
  });
});

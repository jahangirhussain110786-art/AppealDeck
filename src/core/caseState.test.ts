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
  type CaseStateContext,
} from "./caseState";

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

  it("REVISION copy warns about novelty", () => {
    expect(expectationsCopy("REVISION")).toMatch(/new information/i);
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

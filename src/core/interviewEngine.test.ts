import { describe, it, expect } from "vitest";
import { createCaseFile, nextStep, applyAnswer, interviewProgress } from "./interviewEngine";
import type { CaseFile } from "./interviewEngine";

describe("createCaseFile", () => {
  it("creates a file in DECODED state with action items for the kind", () => {
    const file = createCaseFile("POLICY");
    expect(file.state).toBe("DECODED");
    expect(file.kind).toBe("POLICY");
    expect(file.actionItems.length).toBeGreaterThan(0);
    expect(file.timelineEvents).toEqual([]);
    expect(file.priorAppealCount).toBe(0);
  });
});

describe("nextStep", () => {
  it("returns null for GATED_PRO_HELP state", () => {
    const file = { ...createCaseFile("INAUTHENTIC_DOCUMENTS"), state: "GATED_PRO_HELP" as const };
    expect(nextStep(file)).toBeNull();
  });

  it("returns null for READY state", () => {
    const file = { ...createCaseFile("POLICY"), state: "READY" as const };
    expect(nextStep(file)).toBeNull();
  });

  it("asks for root cause first", () => {
    const file = createCaseFile("POLICY");
    const step = nextStep(file);
    expect(step?.kind).toBe("intake_root_cause");
    expect(step?.inputType).toBe("short_text");
  });

  it("asks for timeline after root cause is set", () => {
    const file = { ...createCaseFile("POLICY"), rootCause: "test cause" };
    const step = nextStep(file);
    expect(step?.kind).toBe("intake_timeline");
    expect(step?.inputType).toBe("date");
  });

  it("asks for prior appeals after timeline", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
    };
    const step = nextStep(file);
    expect(step?.kind).toBe("intake_prior_appeals");
    expect(step?.inputType).toBe("enum");
    expect(step?.options).toHaveLength(3);
  });

  it("asks for preventive measures after prior appeals and before evidence", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealsAnswered: true,
    };
    const step = nextStep(file);
    expect(step?.kind).toBe("intake_preventive_measures");
    expect(step?.required).toBe(false);
  });

  it("asks whether the action is already done (action_check) before asking for a file", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealsAnswered: true,
      preventiveMeasuresAsked: true,
    };
    const step = nextStep(file);
    expect(step?.kind).toBe("action_check");
    expect(step?.inputType).toBe("enum");
    expect(step?.options?.map((o) => o.id)).toEqual(["done", "will_do"]);
  });

  it("asks for the file only after action_check is answered 'done'", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealsAnswered: true,
      preventiveMeasuresAsked: true,
    };
    const checkStep = nextStep(file)!;
    const afterCheck = applyAnswer(file, { stepId: checkStep.id, choiceId: "done" });
    const uploadStep = nextStep(afterCheck);
    expect(uploadStep?.kind).toBe("evidence_ask");
    expect(uploadStep?.id).toBe(checkStep.id.replace("action_check_", "evidence_"));
  });

  it("skips the file step and moves on when action_check is answered 'will_do'", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealsAnswered: true,
      preventiveMeasuresAsked: true,
    };
    const checkStep = nextStep(file)!;
    const afterCheck = applyAnswer(file, { stepId: checkStep.id, choiceId: "will_do" });
    const action = afterCheck.actionItems.find(
      (a) => a.evidenceSlots[0] === checkStep.evidenceKind,
    );
    expect(action?.status).toBe("in_progress");
    expect(action?.actionCheckAnswer).toBe("will_do");
    // The action item is no longer "unchecked" or "ready for upload", so nextStep moves past it
    // to the evidence-still-missing explanation rather than looping back on the same question.
    expect(nextStep(afterCheck)?.kind).toBe("status_explanation");
  });

  it("returns null when all evidence done and complete", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealCount: 0,
      priorAppealsAnswered: true,
      preventiveMeasuresAsked: true,
      attemptCount: 1,
      actionItems: [],
      evidenceSlots: {
        metric_export: { present: true },
      },
    };
    const step = nextStep(file);
    expect(step).toBeNull();
  });
});

describe("applyAnswer", () => {
  it("sets root cause from short_text answer", () => {
    const file = createCaseFile("POLICY");
    const result = applyAnswer(file, {
      stepId: "intake_root_cause",
      value: "My supplier sent counterfeits",
    });
    expect(result.rootCause).toBe("My supplier sent counterfeits");
    expect(file.rootCause).toBeUndefined();
  });

  it("adds timeline event from date answer", () => {
    const file = { ...createCaseFile("POLICY"), rootCause: "test" };
    const result = applyAnswer(file, { stepId: "intake_timeline", value: "2026-01-15" });
    expect(result.timelineEvents).toHaveLength(1);
    expect(result.timelineEvents[0].date).toBe("2026-01-15");
  });

  it("sets prior appeal count from enum choice", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
    };
    const result = applyAnswer(file, { stepId: "intake_prior_appeals", choiceId: "yes_1" });
    expect(result.priorAppealCount).toBe(1);
  });

  it("answering 'no prior appeals' moves past the step instead of re-asking it", () => {
    // Regression: nextStep used to treat priorAppealCount === 0 as "unanswered",
    // which is also the correct value for "No, this is my first" — trapping every
    // first-time appellant (the most common answer) in a loop on this step.
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
    };
    const result = applyAnswer(file, { stepId: "intake_prior_appeals", choiceId: "no" });
    expect(result.priorAppealCount).toBe(0);
    expect(result.priorAppealsAnswered).toBe(true);
    expect(nextStep(result)?.kind).not.toBe("intake_prior_appeals");
  });

  it("records a 'will_do' action_check answer as in_progress", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `action_check_${evidenceKind}`,
      choiceId: "will_do",
    });
    const action = result.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(action?.status).toBe("in_progress");
    expect(action?.actionCheckAnswer).toBe("will_do");
  });

  it("records a 'done' action_check answer without marking evidence present yet", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `action_check_${evidenceKind}`,
      choiceId: "done",
    });
    const action = result.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(action?.status).toBe("todo");
    expect(action?.actionCheckAnswer).toBe("done");
    expect(result.evidenceSlots[evidenceKind]?.present).toBeUndefined();
  });

  it("declines an action_check step the same way as a file decline", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `action_check_${evidenceKind}`,
      declined: true,
      declineReason: "Can't obtain this",
    });
    const action = result.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(action?.declined?.reason).toBe("Can't obtain this");
  });

  it("marks evidence as present when file uploaded", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `evidence_${evidenceKind}`,
      filePresent: true,
    });
    const action = result.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(action?.status).toBe("done");
    expect(result.evidenceSlots[evidenceKind]?.present).toBe(true);
  });

  it("declines action when user declines evidence", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `evidence_${evidenceKind}`,
      declined: true,
      declineReason: "I can't get this",
    });
    const action = result.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(action?.declined).toBeDefined();
    expect(action?.declined?.reason).toBe("I can't get this");
  });

  it("does not mutate the original case file", () => {
    const file = createCaseFile("POLICY");
    const evidenceKind = file.actionItems[0].evidenceSlots[0];
    const result = applyAnswer(file, {
      stepId: `evidence_${evidenceKind}`,
      filePresent: true,
    });
    const originalAction = file.actionItems.find((a) => a.evidenceSlots[0] === evidenceKind);
    expect(originalAction?.status).toBe("todo");
    expect(result).not.toBe(file);
  });
});

describe("interviewProgress", () => {
  it("shows 0 steps for fresh file", () => {
    const file = createCaseFile("POLICY");
    const progress = interviewProgress(file);
    expect(progress.current).toBe(0);
    expect(progress.total).toBeGreaterThan(0);
  });

  it("tracks completed steps", () => {
    const file: CaseFile = {
      ...createCaseFile("POLICY"),
      rootCause: "test",
      timelineEvents: [{ date: "2026-01-01", description: "notice" }],
      priorAppealCount: 0,
      priorAppealsAnswered: true,
      attemptCount: 1,
      actionItems: [],
    };
    const progress = interviewProgress(file);
    expect(progress.current).toBe(3);
    expect(progress.pendingEvidence).toBe(0);
  });

  it("counts pending evidence items", () => {
    const file = createCaseFile("POLICY");
    const progress = interviewProgress(file);
    expect(progress.pendingEvidence).toBe(file.actionItems.length);
  });
});

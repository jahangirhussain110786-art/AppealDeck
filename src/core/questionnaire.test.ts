import { describe, expect, it } from "vitest";
import { questionsIn } from "./questionnaire";
import { composeWorkspace, newWorkspace, workspaceGaps, type Workspace } from "./workspace";

/**
 * 23 Sep 2026 (audit item L). A questionnaire response was one heading over one free-text box, and a
 * single 40-character rule decided whether any non-operational response was "written" — so five set
 * questions were answered as an essay, and a correct one-line acknowledgement stayed a draft forever.
 */
describe("questionsIn", () => {
  it("reads numbered questions in the order Amazon wrote them, without their numbering", () => {
    const form = [
      "Please answer the following questions:",
      "1. What caused the late shipments on the listed orders?",
      "2) Which carrier do you use for these orders?",
      "Q3: When did the change take effect?",
    ].join("\n");
    expect(questionsIn(form)).toEqual([
      "What caused the late shipments on the listed orders?",
      "Which carrier do you use for these orders?",
      "When did the change take effect?",
    ]);
  });

  it("separates several questions on one line, and drops the lead-in before a colon", () => {
    expect(
      questionsIn("Answer the following: What happened to the order? What have you changed since?"),
    ).toEqual(["What happened to the order?", "What have you changed since?"]);
  });

  it("ignores questions about us rather than the case, and repeats", () => {
    const text = [
      "What caused the late shipments on the listed orders?",
      "Have questions?",
      "Can we help? Contact us through Seller Support.",
      "What caused the late shipments on the listed orders?",
    ].join("\n");
    expect(questionsIn(text)).toEqual(["What caused the late shipments on the listed orders?"]);
  });

  it("finds nothing in text that asks nothing", () => {
    expect(questionsIn("Your account has been deactivated. Submit a plan of action.")).toEqual([]);
  });
});

function questionnaire(over: Partial<Workspace> = {}): Workspace {
  return {
    ...newWorkspace(),
    protocol: "questionnaire",
    confirmed: true,
    requirementsConfirmed: true,
    notice: "We need more information about the late shipments on your account.",
    formInstructions:
      "1. What caused the late shipments on the listed orders?\n2. When did the change take effect?",
    ...over,
  };
}

describe("a questionnaire case", () => {
  it("treats each unanswered question as an open item, by its own wording", () => {
    const gaps = workspaceGaps(
      questionnaire({
        answers: [
          {
            question: "What caused the late shipments on the listed orders?",
            answer: "A carrier cut-off we had wrong.",
          },
        ],
      }),
    );
    expect(gaps).toContain("Answer the question: When did the change take effect?");
    expect(gaps).not.toContain(
      "Answer the question: What caused the late shipments on the listed orders?",
    );
  });

  it("accepts a short, correct answer — length is not what makes an answer", () => {
    const w = questionnaire({
      answers: [
        {
          question: "What caused the late shipments on the listed orders?",
          answer: "A wrong carrier cut-off.",
        },
        { question: "When did the change take effect?", answer: "1 September 2026." },
      ],
    });
    expect(workspaceGaps(w).filter((g) => /answer|explain/i.test(g))).toEqual([]);
  });

  it("lays the response out under Amazon's questions, in order", () => {
    const w = questionnaire({
      answers: [
        { question: "When did the change take effect?", answer: "1 September 2026." },
        {
          question: "What caused the late shipments on the listed orders?",
          answer: "A wrong carrier cut-off.",
        },
      ],
    });
    const headings = composeWorkspace({ kind: "PERFORMANCE_METRIC", workspace: w }, 1).sections.map(
      (s) => s.heading,
    );
    expect(headings.slice(0, 2)).toEqual([
      "What caused the late shipments on the listed orders?",
      "When did the change take effect?",
    ]);
  });
});

describe("an acknowledgement", () => {
  it("is complete in one line, when one line is what was asked", () => {
    const w: Workspace = {
      ...newWorkspace(),
      protocol: "acknowledgement",
      explanation: "I acknowledge the policy.",
    };
    expect(workspaceGaps(w)).not.toContain("Explain how the supplied records answer the request.");
    expect(workspaceGaps(w)).not.toContain("Write the acknowledgement Amazon asked for.");
  });

  it("is still open when nothing has been written", () => {
    const w: Workspace = { ...newWorkspace(), protocol: "acknowledgement" };
    expect(workspaceGaps(w)).toContain("Write the acknowledgement Amazon asked for.");
  });
});

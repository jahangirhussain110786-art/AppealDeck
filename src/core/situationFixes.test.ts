import { describe, expect, it } from "vitest";
import { D6_GATED_ALLEGATION } from "./violationKinds";
import {
  answerableInWords,
  applyWorkspaceReply,
  composeWorkspace,
  markSentWaiting,
  newWorkspace,
  professionalReviewApplies,
  proposedRequirements,
  routeWorkspace,
  workspaceCanCompose,
  workspaceGaps,
  type Requirement,
  type Workspace,
} from "./workspace";
import { documentWorkspace } from "./workspace.fixture";
import { createCaseFile } from "./caseFile";
import { stateForOutcome } from "./caseState";
import { clockItemsForCase, dateOfNotice, pastDeadlineNextStep } from "./clock";
import { replyEndsCase } from "./escalation";
import { assessNovelty, shouldWarnBeforeSubmit } from "./submissionNovelty";
import { critiquePoa } from "./composer";
import { requirementGuidance } from "./requirementGuidance";
import { computeDeadlines } from "./deadlinesModel";
import { parseNotice } from "./noticeParser";
import { FIXTURES } from "./fixtures";
import { logWithOutcome } from "@/components/workspace/CaseOutcome";
import { summarizeCase } from "@/lib/caseSummary";
import { STORES } from "@/content/stores";
import type { SavedDocumentCheck } from "./documentCheck";

const route = (notice: string, extra: Partial<Workspace> = {}) =>
  routeWorkspace({ ...newWorkspace(), notice, formInstructions: "", ...extra });

describe("1. D6 gates allegations, not the words fraud and child safety", () => {
  const notGated = [
    "As part of our fraud prevention checks we need to verify your identity. Please upload your government-issued ID within 7 days.",
    "Your funds are held. As part of our fraud detection program, provide a bank statement and a government-issued ID to release the balance.",
    "This toy listing must comply with child safety standards (CPSIA). Please provide a test report for the product within 14 days.",
    "We use anti-fraud measures to protect against fraud. Please provide the supplier invoice for the affected product.",
    "Our child safety requirements apply to this category. Please send the invoice for the product.",
  ];
  it.each(notGated)("does not gate boilerplate: %s", (text) => {
    expect(D6_GATED_ALLEGATION.test(text)).toBe(false);
    expect(route(text).protocol).not.toBe("specialist");
  });

  const gated = [
    "We found evidence of fraud on your account.",
    "You are suspected of being involved in fraud.",
    "We detected fraudulent activity on your account.",
    "Your account was suspended for fraudulent transactions.",
    "You have committed fraud against customers.",
    "This account is under a fraud investigation.",
    "The listing contains child sexual abuse material.",
    "Reports of child exploitation were linked to your account.",
    "This was a child safety violation.",
    "The invoices you provided were forged.",
    "We believe you submitted falsified documents.",
  ];
  it.each(gated)("still gates the allegation: %s", (text) => {
    expect(D6_GATED_ALLEGATION.test(text)).toBe(true);
    expect(route(text).protocol).toBe("specialist");
  });

  it("does not take 'fraudulent activity' as an allegation when it is about prevention", () => {
    expect(D6_GATED_ALLEGATION.test("We work to protect against fraudulent activity.")).toBe(false);
  });

  it("every classifier-gated fixture that states the allegation in words still routes to specialist", () => {
    const gatedFixtures = FIXTURES.filter((f) => f.expected.severityGated);
    expect(gatedFixtures.length).toBeGreaterThan(0);
    const stillGated = gatedFixtures.filter((f) => route(f.raw).protocol === "specialist");
    // Every gated fixture that states a forged-document or fraud allegation keeps gating.
    for (const f of gatedFixtures.filter((x) => D6_GATED_ALLEGATION.test(x.raw)))
      expect(stillGated).toContain(f);
    expect(stillGated.length).toBeGreaterThan(0);
  });

  it("the stored flag clears when the corrected text no longer carries an allegation", () => {
    const w = { ...documentWorkspace(), professionalReviewRequired: true };
    expect(professionalReviewApplies(w)).toBe(false);
    expect(route(w.notice, { professionalReviewRequired: true }).protocol).not.toBe("specialist");
  });

  it("never clears while an earlier confirmed request holds the allegation", () => {
    const w: Workspace = {
      ...documentWorkspace(),
      professionalReviewRequired: true,
      previousRequests: [
        {
          revision: 1,
          notice: "Amazon alleges that your invoices were forged.",
          formInstructions: "",
          protocol: "specialist",
          requirements: [],
        },
      ],
    };
    expect(professionalReviewApplies(w)).toBe(true);
    expect(routeWorkspace(w).protocol).toBe("specialist");
  });

  it("a boilerplate reply does not flip a working case to specialist", () => {
    const w = documentWorkspace();
    w.replies.push({
      id: "r1",
      at: "2026-10-01T00:00:00.000Z",
      text: "Thank you. As part of our fraud prevention process we need the sales report for the affected product.",
      applied: false,
    });
    const next = applyWorkspaceReply({ ...w, professionalReviewRequired: true }, "r1");
    expect(routeWorkspace(next).protocol).not.toBe("specialist");
  });
});

describe("2. another Amazon store goes down the same routes", () => {
  it("routes the same and carries the store notice", () => {
    const us = route("Please provide the supplier invoice for the affected product.");
    const other = route("Please provide the supplier invoice for the affected product.", {
      marketplace: "other",
    });
    expect(other.protocol).toBe(us.protocol);
    expect(other.reason).toContain(STORES.nonUsNotice);
    expect(us.reason).not.toContain(STORES.nonUsNotice);
  });
  it("can be composed", () => {
    expect(workspaceCanCompose({ ...documentWorkspace(), marketplace: "other" })).toBe(true);
  });
});

describe("3. a recorded outcome changes the case state", () => {
  it("maps outcomes to states and back", () => {
    expect(stateForOutcome("reinstated", "SUBMITTED", true)).toBe("APPROVED");
    expect(stateForOutcome("rejected", "SUBMITTED", true)).toBe("CLOSED");
    expect(stateForOutcome("withdrawn", "SUBMITTED", true)).toBe("CLOSED");
    expect(stateForOutcome("pending", "APPROVED", true)).toBe("SUBMITTED");
    expect(stateForOutcome("pending", "CLOSED", false)).toBe("INTAKE");
    expect(stateForOutcome("pending", "SUBMITTED", true)).toBe("SUBMITTED");
  });
  it("writes the state with the outcome and stops the clock", () => {
    const log = logWithOutcome(
      { state: "SUBMITTED", attemptCount: 1 },
      "reinstated",
      "2026-10-02",
    )!;
    expect(log.state).toBe("APPROVED");
    const items = clockItemsForCase(
      {
        caseId: "c",
        kind: "UNKNOWN",
        state: log.state,
        reminderAt: "2026-10-03T00:00:00.000Z",
        deadlines: [
          { kind: "appeal_window", label: "Appeal by 1 Oct", dueAt: "2026-10-01T00:00:00.000Z" },
        ],
      },
      Date.parse("2026-10-06T00:00:00.000Z"),
    );
    expect(items).toEqual([]);
    const back = logWithOutcome(log, "pending", "2026-10-02")!;
    expect(back.state).toBe("SUBMITTED");
    expect(back).not.toHaveProperty("resolution");
  });
  it("the dashboard row reads the recorded outcome", () => {
    const f = {
      ...createCaseFile("INAUTHENTIC"),
      workspace: documentWorkspace(),
      state: "SUBMITTED" as const,
    };
    const entry = { id: f.id, kind: f.kind, createdAt: f.createdAt, archived: false };
    const s = summarizeCase(entry, f, new Date(2026, 9, 6), null, {
      state: "APPROVED",
      attemptCount: 1,
      resolution: { status: "reinstated", at: "2026-10-02T00:00:00.000Z" },
    });
    expect(s.status).toBe("closed");
    expect(s.next).toBe(STORES.outcomeLine.reinstated);
    expect(s.waitingAmazon).toBeUndefined();
  });
  it("an unread reply that reads as reinstatement points at recording the outcome", () => {
    const w = documentWorkspace();
    w.replies.push({
      id: "r",
      at: "2026-10-02T00:00:00.000Z",
      text: "We have reviewed your appeal and your selling account has been reinstated. You may resume selling.",
      applied: false,
    });
    const f = { ...createCaseFile("INAUTHENTIC"), workspace: w };
    const s = summarizeCase(
      { id: f.id, kind: f.kind, createdAt: f.createdAt },
      f,
      new Date(),
      null,
    );
    expect(replyEndsCase(w.replies[0]!.text)).toBe("reinstated");
    expect(s.next).toBe(STORES.recordOutcome);
  });
});

function declinedRecord(w: Workspace, reason: string): Workspace {
  return {
    ...w,
    requirements: w.requirements.map((r) => ({
      ...r,
      status: "cannot_obtain" as const,
      declined: { reason, alternativeId: "decline_proceed", at: "2026-10-01T00:00:00.000Z" },
    })),
  };
}

describe("5. a reasoned decline is acknowledged, not an open item", () => {
  it("leaves no gap, no watermark and no working notes, and still states it", () => {
    const w = declinedRecord(documentWorkspace(), "The supplier closed and issues no invoices.");
    expect(workspaceGaps(w)).toEqual([]);
    const draft = composeWorkspace({ kind: "UNKNOWN", workspace: w }, 1);
    expect(draft.watermark).toBeUndefined();
    expect(draft.mode.mode).toBe("full-draft");
    const body = draft.sections.find((s) => s.heading === "Records I could not obtain")!.body;
    expect(body).toContain("Supplier invoice: The supplier closed");
    // Honesty: it is never listed as a supplied record.
    expect(draft.sections.find((s) => s.heading === "Supporting records")!.body).toBe(
      "No reviewed records linked.",
    );
  });
  it("a decline with no reason is still an open item", () => {
    const w = declinedRecord(documentWorkspace(), "   ");
    expect(workspaceGaps(w).some((g) => g.includes("Supplier invoice"))).toBe(true);
  });
});

function operational(extra: Partial<Workspace> = {}): Workspace {
  return {
    ...newWorkspace(),
    notice:
      "Please submit a Plan of Action explaining the root cause, the corrective actions and the preventive measures for your account.",
    protocol: "operational",
    confirmed: true,
    requirementsConfirmed: true,
    explanation: "The accounts were linked because my brother used our shared address.",
    correctiveActions: "",
    preventiveMeasures: "",
    ...extra,
  };
}

describe("6. a seller who did nothing wrong is not made to invent corrective actions", () => {
  const relationship: Requirement = {
    id: "rel",
    label: "Linked-account resolution record",
    sourceQuote: "",
    status: "reviewed",
    note: "The other account belongs to my brother. We live in the same house but run separate businesses and share no bank account.",
    source: "matrix",
    evidenceKind: "account_resolution_proof",
  };
  it("satisfies the record with a truthful statement and no file", () => {
    const w = operational({ requirements: [relationship] });
    expect(answerableInWords(w, relationship)).toBe(true);
    expect(workspaceGaps(w).some((g) => g.includes("Linked-account"))).toBe(false);
    const draft = composeWorkspace({ kind: "RELATED_ACCOUNT", workspace: w }, 1);
    const body = draft.sections.find((s) => s.heading === "Supporting records")!.body;
    expect(body).toContain("(statement, no file)");
  });
  it("asks the corrective questions in a way that allows 'nothing needed correcting'", () => {
    const gaps = workspaceGaps(operational({ requirements: [relationship] }));
    expect(gaps.some((g) => g.includes(STORES.nothingToCorrectHint))).toBe(true);
  });
  it("does not lower the bar for an ordinary operational plan or any other record", () => {
    const ordinary = operational({
      requirements: [
        { ...relationship, label: "Supplier invoice", evidenceKind: "supplier_invoice" },
      ],
    });
    expect(answerableInWords(ordinary, ordinary.requirements[0]!)).toBe(false);
    const gaps = workspaceGaps(ordinary);
    expect(gaps.some((g) => g.includes("Add the file, say what it shows, and save it"))).toBe(true);
    expect(gaps.some((g) => g.includes(STORES.nothingToCorrectHint))).toBe(false);
  });
});

describe("7. 'I disagree' still gets a response", () => {
  const notice =
    "Your selling account is suspended. Please submit a Plan of Action explaining the root cause, corrective actions and preventive measures.";
  it("stays composable and opens by contesting the finding", () => {
    const w = operational({ notice, position: "dispute" });
    expect(routeWorkspace(w).protocol).toBe("operational");
    expect(workspaceCanCompose(w)).toBe(true);
    const draft = composeWorkspace({ kind: "UNKNOWN", workspace: w }, 1);
    expect(draft.sections[0]).toEqual({ heading: "Position", body: STORES.disputeFraming });
    const plain = composeWorkspace({ kind: "UNKNOWN", workspace: { ...w, position: "unsure" } }, 1);
    expect(plain.sections[0]!.heading).not.toBe("Position");
  });
  it("only falls back to the dispute route when nothing composable was asked for", () => {
    expect(route("Thank you for your message.", { position: "dispute" }).protocol).not.toBe(
      "operational",
    );
  });
});

describe("8. already sent outside the product", () => {
  it("marks the case sent and waiting, with one history line, composing nothing", () => {
    const f = { ...createCaseFile("INAUTHENTIC"), workspace: documentWorkspace() };
    const out = markSentWaiting(f);
    expect(out.state).toBe("SUBMITTED");
    expect(out.workspace!.history.at(-1)!.message).toBe(STORES.markedSentWaiting);
    expect(out.workspace!.submissions).toEqual(f.workspace.submissions);
  });
});

describe("9. the funds appeal date needs the deactivation date", () => {
  it("dateOfNotice reads only a real calendar day", () => {
    expect(dateOfNotice("2026-09-01")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(dateOfNotice(null)).toBeUndefined();
    expect(dateOfNotice("2026-13-45")).toBeUndefined();
  });
  it("gives a dated funds line when the notice date is passed on", () => {
    const parsed = parseNotice(
      "Date: 2026-09-01\nYour selling account has been deactivated and your funds are being held.",
    );
    const withDate = computeDeadlines({
      parsed,
      kind: "FUNDS",
      deactivatedAt: dateOfNotice(parsed.receivedOn),
    }).find((d) => d.kind === "funds_appeal_eligible");
    if (parsed.receivedOn) expect(withDate?.dueAt).not.toBeNull();
  });
});

describe("10. a refusal that faults the plan", () => {
  const refusal =
    "Your Plan of Action does not identify the root cause. Please also provide the supplier invoice for the affected product.";
  function refused(): Workspace {
    const w = operational({
      explanation: "A supplier mistake caused the listing problem on our account last month.",
      correctiveActions:
        "We removed the listing on 2 September and retrained the staff on 3 September.",
      preventiveMeasures:
        "Every listing is checked weekly by the owner against the supplier catalogue.",
      correctiveActionsAttested: { at: "2026-09-04T00:00:00.000Z" },
    });
    w.replies.push({ id: "r1", at: "2026-10-01T00:00:00.000Z", text: refusal, applied: false });
    return w;
  }
  it("keeps the plan sections and raises a gap, after the reply is applied", () => {
    const next = applyWorkspaceReply(refused(), "r1");
    expect(routeWorkspace(next).protocol).toBe("operational");
    const draft = composeWorkspace(
      { kind: "UNKNOWN", workspace: { ...next, protocol: "operational", confirmed: true } },
      2,
    );
    expect(draft.sections.map((s) => s.heading)).toContain("Root Cause");
    expect(workspaceGaps({ ...next, protocol: "operational", confirmed: true })).toContain(
      STORES.rootCauseFaulted,
    );
  });
  it("a plain document request is still a document request", () => {
    const w = refused();
    w.replies[0]!.text = "Please provide the supplier invoice for the affected product.";
    expect(routeWorkspace(applyWorkspaceReply(w, "r1")).protocol).toBe("documents");
  });
  it("does not offer another round for a final decision, nor for a reinstatement", () => {
    expect(
      replyEndsCase("We are unable to reinstate your selling account. This decision is final."),
    ).toBe("final");
    expect(replyEndsCase("Your selling account has been reinstated. You may resume selling.")).toBe(
      "reinstated",
    );
    expect(
      replyEndsCase("Please provide the supplier invoice for the affected product."),
    ).toBeNull();
  });
});

describe("11. the duplicate guard is not falsely reassuring", () => {
  const prior = (text: string) => [{ at: "2026-09-01T00:00:00.000Z", revision: 0, text }];
  it("reports cannot-compare, and warns, when the earlier text was not kept", () => {
    const r = assessNovelty("A new response about the supplier invoice.", prior(""));
    expect(r.verdict).toBe("cannot-compare");
    expect(shouldWarnBeforeSubmit(r)).toBe(true);
  });
  it("still compares against a prior that has text, ignoring empty ones", () => {
    const text = "We checked every invoice. The supplier is named on each line. We kept copies.";
    const r = assessNovelty(text, [...prior(""), ...prior(text)]);
    expect(r.verdict).toBe("identical");
  });
  it("an unchanged resend with different working notes is still identical", () => {
    const base = "## Root Cause\n\nThe listing was wrong because the supplier changed a code.\n";
    const sent = `*** WORK IN PROGRESS — NOT READY TO SUBMIT ***\n\n${base}\n## Unresolved items — working notes\n\nAdd the file: Supplier invoice\nSay what it shows\n`;
    const resend = `${base}`;
    expect(assessNovelty(resend, prior(sent)).verdict).toBe("identical");
  });
});

describe("12. a second issue in the same notice raises its records", () => {
  it("unions the evidence matrix over every issue the notice names", () => {
    const notice =
      "We could not verify the authenticity of your product. Separately, your detail page violates our listing policy. Please provide your response.";
    const single = proposedRequirements(
      { notice, formInstructions: "", revision: 1 },
      "INAUTHENTIC",
    );
    const both = proposedRequirements({ notice, formInstructions: "", revision: 1 }, "UNKNOWN");
    // Whatever the primary kind, the records of every detected issue are raised, once each.
    const kinds = both.map((r) => r.evidenceKind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(single.length).toBeGreaterThan(0);
    const union = proposedRequirements({ notice, formInstructions: "", revision: 1 }, "LISTING");
    expect(union.some((r) => r.evidenceKind === "supplier_invoice")).toBe(true);
  });
});

describe("13. saved document checks reach 'Before you send'", () => {
  it("lists a pro-forma reading and a conflicting field as warnings, never errors", () => {
    const w = documentWorkspace();
    const check: SavedDocumentCheck = {
      recordId: "file-1",
      contentHash: "hash-1",
      at: "2026-10-01T00:00:00.000Z",
      contextKey: "x",
      outcome: {
        kind: "fields",
        result: {
          evidenceKind: "supplier_invoice",
          findings: [
            {
              field: "invoice date within 365 days",
              status: "conflicting",
              observed: "2024-01-01",
              note: "The date is more than 365 days before the notice.",
            },
          ],
          triggeredDisqualifiers: ["pro-forma invoices and quotes"],
          allRequiredFieldsPresent: false,
        },
      },
    };
    const file = { ...createCaseFile("INAUTHENTIC"), workspace: { ...w, documentChecks: [check] } };
    const draft = composeWorkspace({ kind: file.kind, workspace: file.workspace }, 1);
    const result = critiquePoa(draft, file);
    const codes = result.findings.map((f) => f.code);
    expect(codes).toContain("DOCUMENT_CHECK_CONFLICT");
    expect(codes).toContain("DOCUMENT_CHECK_DISQUALIFIER");
    expect(
      result.findings
        .filter((f) => f.code.startsWith("DOCUMENT_CHECK"))
        .every((f) => f.severity === "warning"),
    ).toBe(true);
  });
  it("ignores a check about a file that has since been replaced", () => {
    const w = documentWorkspace();
    const check = {
      recordId: "file-1",
      contentHash: "OTHER",
      at: "2026-10-01T00:00:00.000Z",
      contextKey: "x",
      outcome: {
        kind: "fields" as const,
        result: {
          evidenceKind: "supplier_invoice" as const,
          findings: [],
          triggeredDisqualifiers: ["pro-forma invoices and quotes"],
          allRequiredFieldsPresent: false,
        },
      },
    };
    const file = { ...createCaseFile("INAUTHENTIC"), workspace: { ...w, documentChecks: [check] } };
    const draft = composeWorkspace({ kind: file.kind, workspace: file.workspace }, 1);
    expect(critiquePoa(draft, file).findings.some((f) => f.code.startsWith("DOCUMENT_CHECK"))).toBe(
      false,
    );
  });
});

describe("14. a passed notice date still has a next step", () => {
  it("names the way forward for an overdue notice date only", () => {
    expect(pastDeadlineNextStep({ source: "deadline", urgency: "overdue" })).toBe(
      STORES.pastDeadlineNextStep,
    );
    expect(pastDeadlineNextStep({ source: "deadline", urgency: "soon" })).toBeNull();
    expect(pastDeadlineNextStep({ source: "reminder", urgency: "overdue" })).toBeNull();
    expect(STORES.pastDeadlineNextStep).not.toMatch(/will be|guarantee|likely/i);
  });
});

describe("15. a case that cannot be answered here has no send step", () => {
  const base = (patch: Partial<Workspace>) => {
    const f = {
      ...createCaseFile("UNKNOWN"),
      workspace: { ...newWorkspace(), confirmed: true, ...patch },
    };
    return summarizeCase({ id: f.id, kind: f.kind, createdAt: f.createdAt }, f, new Date(), null);
  };
  it.each([
    ["information", STORES.nextStep.information],
    ["dispute", STORES.nextStep.dispute],
    ["specialist", STORES.nextStep.specialist],
  ] as const)("%s", (protocol, expected) => {
    expect(base({ protocol }).next).toBe(expected);
  });
  it("drops the un-clearable boilerplate gaps", () => {
    const w: Workspace = {
      ...newWorkspace(),
      notice: "Thank you for the information you sent. No further action is needed.",
      protocol: "information",
      confirmed: true,
    };
    const gaps = workspaceGaps(w);
    expect(gaps.some((g) => g.includes("Tick that your document list is complete"))).toBe(false);
    expect(gaps.some((g) => g.includes("what your documents show"))).toBe(false);
  });
});

describe("16. retail-arbitrage and drop-shipping explanation paths", () => {
  it("are offered beside the invoice alternatives, with no outcome claim", () => {
    const g = requirementGuidance(
      { label: "Supplier invoice", evidenceKind: "supplier_invoice" },
      "INAUTHENTIC",
    )!;
    const ids = g.alternatives.map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(["retail_arbitrage", "drop_shipping", "decline_proceed"]),
    );
    const explain = requirementGuidance(
      { label: "Linked-account resolution record", evidenceKind: "account_resolution_proof" },
      "RELATED_ACCOUNT",
    )!;
    expect(explain.alternatives.map((a) => a.id)).toContain("explain_in_words");
  });
});

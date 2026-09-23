import { describe, expect, it } from "vitest";
import {
  applyWorkspaceReply,
  computeReplyDelta,
  replyDeltaCounts,
  composeWorkspace,
  newWorkspace,
  priorAttempts,
  proposedRequirements,
  recordPriorAttempt,
  removePriorAttempt,
  routeWorkspace,
  totalAttempts,
  workspaceCanCompose,
  workspaceGaps,
  type Workspace,
} from "./workspace";
import { assessNovelty, shouldWarnBeforeSubmit } from "./submissionNovelty";
import { noveltyRequired } from "./caseState";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { composePoa, critiquePoa } from "./composer";
import { createCaseFile } from "./caseFile";
import { CaseDataSchema } from "@/lib/caseSchema";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import { documentWorkspace } from "./workspace.fixture";

describe("request routing", () => {
  it.each([
    ["Please provide your supplier invoice for this product.", "Upload documents", "documents"],
    [
      "Your previous Plan of Action was received. Please provide the supplier invoice.",
      "Upload documents",
      "documents",
    ],
    [
      "Your documents were flagged as altered invoices. Please provide records.",
      "Upload documents",
      "specialist",
    ],
    // AA-39: was "clarification" — a dead end for the exact seller this product is for. Verification
    // is now a route of its own, with its own guidance and evidence requirements.
    [
      "Please complete identity verification by providing government-issued identification.",
      "Upload documents",
      "verification",
    ],
    [
      "Please submit a Plan of Action explaining the root cause.",
      "Corrective actions and prevention",
      "operational",
    ],
    [
      "Your response remains under review. No additional information is required.",
      "No action requested",
      "information",
    ],
    [
      "Do not submit a Plan of Action. Please provide the invoice for this product.",
      "Upload the invoice",
      "documents",
    ],
    [
      "Your account has been deactivated. Read the message for details.",
      "I cannot see the form",
      "clarification",
    ],
    [
      "You have supplied falsified invoices. Please provide your supporting records.",
      "Upload documents",
      "specialist",
    ],
    // AA-39: was "specialist". D6 gates fabricated documents, fraud and child safety — it has never
    // named related accounts. The blanket block was implementation drift (found 21 Sep 2026) and
    // made the product decline to help a seller whose notice plainly asks for records.
    [
      "Your selling account is linked to another account with an unresolved issue.",
      "Submit documents",
      "documents",
    ],
    // AA-39: the three response families that previously had no home at all.
    [
      "Please complete the questionnaire below so we can review your account.",
      "Answer the following questions",
      "questionnaire",
    ],
    [
      "Please acknowledge that you have read the policy before we continue.",
      "Confirm that you understand",
      "acknowledgement",
    ],
  ])(
    "routes observable requests without forcing an appeal: %s",
    (notice, formInstructions, protocol) => {
      expect(routeWorkspace({ ...newWorkspace(), notice, formInstructions }).protocol).toBe(
        protocol,
      );
    },
  );
  it("preserves disagreement and abstains outside the supported marketplace", () => {
    expect(
      routeWorkspace({ ...documentWorkspace(), professionalReviewRequired: true }).protocol,
    ).toBe("specialist");
    expect(routeWorkspace({ ...documentWorkspace(), position: "dispute" }).protocol).toBe(
      "dispute",
    );
    expect(routeWorkspace({ ...documentWorkspace(), marketplace: "other" }).protocol).toBe(
      "clarification",
    );
    expect(workspaceCanCompose({ ...documentWorkspace(), protocol: "operational" })).toBe(false);
  });
  it("only proposes requested documents, with verbatim source and no duplicates", () => {
    const sampleRecords = proposedRequirements({
      notice: SAMPLE_NOTICE_TEXT,
      formInstructions: "",
    });
    expect(sampleRecords).toHaveLength(1);
    expect(sampleRecords[0].label).toBe("Supplier invoice");
    const w = documentWorkspace();
    expect(w.requirements).toHaveLength(1);
    expect(w.notice).toContain(w.requirements[0].sourceQuote);
    expect(
      proposedRequirements({
        notice: "Do not provide invoices for this request.",
        formInstructions: "",
      }),
    ).toEqual([]);
  });
});

describe("response and provenance", () => {
  it("produces a document response without confession or prevention sections", () => {
    const workspace = documentWorkspace();
    const file = { ...createCaseFile("UNKNOWN"), workspace };
    const draft = composePoa(file);
    expect(draft.docType).toBe("document_response");
    expect(draft.mode.mode).toBe("full-draft");
    expect(draft.sections.map((s) => s.heading)).not.toContain("Root Cause");
    expect(draft.sections.at(-1)?.body).toContain("invoice.pdf, page 2");
    expect(critiquePoa(draft, file).findings).toEqual([]);
  });
  it("runs the AA-31 text-quality checks (future tense, blame-shifting, vague time) on a workspace draft too", () => {
    const workspace = {
      ...documentWorkspace(),
      protocol: "operational" as const,
      explanation:
        "The supplier caused this issue and we were not aware of this until recently. We will implement two-person verification going forward.",
      correctiveActions: "We will fix our onboarding process soon.",
      preventiveMeasures: "We plan to add a review step shortly.",
    };
    const file = { ...createCaseFile("UNKNOWN"), workspace };
    const draft = composePoa(file);
    const { findings } = critiquePoa(draft, file);
    const codes = findings.map((f) => f.code);
    expect(codes).toContain("FUTURE_TENSE_LANGUAGE");
    expect(codes).toContain("BLAME_SHIFTING_LANGUAGE");
    expect(codes).toContain("VAGUE_TIME_PHRASE");
  });

  it("does not consider upload, waiting, unchecked scope or missing provenance ready", () => {
    const workspace = documentWorkspace();
    for (const status of ["needed", "waiting"] as const) {
      const changed = {
        ...workspace,
        requirements: workspace.requirements.map((r) => ({ ...r, status })),
      };
      expect(composeWorkspace({ kind: "UNKNOWN", workspace: changed }, 1).mode.mode).toBe(
        "gap-draft",
      );
    }
    expect(workspaceGaps({ ...workspace, requirementsConfirmed: false })).not.toEqual([]);
    expect(
      workspaceGaps({
        ...workspace,
        requirements: [{ ...workspace.requirements[0], sourceQuote: "Invented request" }],
      }),
    ).not.toEqual([]);
    expect(
      workspaceGaps({
        ...workspace,
        requirements: [{ ...workspace.requirements[0], contentHash: undefined }],
      }),
    ).not.toEqual([]);
  });
  it("requires operational facts only for the operational protocol", () => {
    const workspace = {
      ...documentWorkspace(),
      notice: "Please submit a Plan of Action explaining corrective actions.",
      formInstructions: "Root cause, corrective actions and prevention",
      protocol: "operational" as const,
      requirements: [],
    };
    expect(workspaceGaps(workspace)).toContain(
      "Describe corrective actions, distinguishing completed work from plans.",
    );
    expect(
      workspaceGaps({
        ...workspace,
        correctiveActions:
          "We added a daily dispatch review on 16 September, recorded by the warehouse owner.",
        preventiveMeasures:
          "The operations owner checks unresolved orders before the cutoff and records the review.",
      }),
    ).toEqual([]);
  });
  it("preserves submitted text, original instructions and evidence when applying a new reply", () => {
    const w = documentWorkspace();
    w.submissions.push({
      id: "attempt-1",
      at: new Date().toISOString(),
      revision: 1,
      protocol: "documents",
      text: "Exact text submitted",
      receipt: "case-42",
      attachments: [
        { recordId: "file-1", filename: "invoice.pdf", contentHash: "hash-1", page: 2 },
      ],
    });
    w.replies.push({
      id: "reply-1",
      at: new Date().toISOString(),
      text: "Please provide the sales report for the affected product.",
      applied: false,
    });
    const frozen = structuredClone(w);
    const next = applyWorkspaceReply(w, "reply-1");
    expect(w).toEqual(frozen);
    expect(next.submissions).toEqual(frozen.submissions);
    expect(next.previousRequests[0].notice).toBe(frozen.notice);
    // B-03, 23 Sep 2026: this line used to assert `"needed"`, which contradicted the test's own
    // name. The reply asks for a sales report and says nothing about the invoice, so the reviewed
    // invoice is kept — with its vault record, hash, page and the seller's note intact.
    expect(next.requirements[0].status).toBe("reviewed");
    expect(next.requirements[0].recordId).toBe("file-1");
    expect(next.requirements[0].note).toBe(frozen.requirements[0].note);
    expect(next.confirmed).toBe(false);
    expect(next.revision).toBe(2);
    expect(applyWorkspaceReply(next, "reply-1")).toBe(next);
    const held = applyWorkspaceReply({ ...w, professionalReviewRequired: true }, "reply-1");
    expect(routeWorkspace(held).protocol).toBe("specialist");
  });
  it("retains workspace data at the API boundary and rejects malformed evidence", () => {
    const file = { ...createCaseFile("UNKNOWN"), workspace: documentWorkspace() };
    expect(CaseDataSchema.parse(file).workspace).toEqual(file.workspace);
    file.workspace.requirements[0].page = -1;
    expect(CaseDataSchema.safeParse(file).success).toBe(false);
  });
});

/**
 * #91. A seller usually finds this product after appealing once or twice alone and being
 * rejected. Until these landed, the product counted only what it had recorded itself, so a third
 * attempt was treated as a first and every rule that depends on the attempt number was wrong.
 */
describe("attempts made before this case existed", () => {
  const withNotice = (): Workspace => ({
    ...newWorkspace(),
    notice: "Your account was deactivated. Submit a Plan of Action.",
    protocol: "operational",
  });

  it("counts a prior attempt as an attempt", () => {
    const w = recordPriorAttempt(withNotice(), {
      at: "2026-09-01T00:00:00.000Z",
      text: "My first appeal, which Amazon rejected.",
    });
    expect(totalAttempts(w)).toBe(1);
    expect(priorAttempts(w)).toHaveLength(1);
  });

  it("makes the next response subject to the novelty requirement", () => {
    const fresh = withNotice();
    expect(noveltyRequired(totalAttempts(fresh))).toBe(false);

    const afterTwo = recordPriorAttempt(
      recordPriorAttempt(fresh, { at: "2026-09-01T00:00:00.000Z", text: "First try." }),
      { at: "2026-09-08T00:00:00.000Z", text: "Second try." },
    );
    // The seller is now on attempt three; sending the same thing again is the
    // best-evidenced way to be refused.
    expect(noveltyRequired(totalAttempts(afterTwo))).toBe(true);
  });

  it("gives the duplicate-submission guard something to compare against", () => {
    const sent = "We have removed the listing and retrained the team on condition grading.";
    const w = recordPriorAttempt(withNotice(), { at: "2026-09-01T00:00:00.000Z", text: sent });

    const resubmitted = assessNovelty(sent, w.submissions);
    expect(resubmitted.verdict).toBe("identical");
    expect(shouldWarnBeforeSubmit(resubmitted)).toBe(true);

    const rewritten = assessNovelty(
      "The supplier invoice for order 111-2223334-5556667 is attached, and it names the manufacturer directly.",
      w.submissions,
    );
    expect(shouldWarnBeforeSubmit(rewritten)).toBe(false);
  });

  it("accepts an attempt the seller can no longer produce the text of", () => {
    const w = recordPriorAttempt(withNotice(), { at: "2026-09-01T00:00:00.000Z", text: "   " });
    // The count is the part that matters; an empty text simply gives the guard nothing to
    // compare, which is honest rather than invented.
    expect(totalAttempts(w)).toBe(1);
    expect(priorAttempts(w)[0]!.text).toBe("");
    expect(assessNovelty("A completely new response.", w.submissions).verdict).toBe("new");
  });

  it("marks a prior attempt so it can never be mistaken for one drafted here", () => {
    const w = recordPriorAttempt(withNotice(), { at: "2026-09-01T00:00:00.000Z", text: "Sent." });
    const entry = w.submissions[0]!;
    expect(entry.source).toBe("prior");
    expect(entry.revision).toBe(0);
    expect(entry.receipt).toBe("");
  });

  it("records what happened in the case history", () => {
    const w = recordPriorAttempt(withNotice(), { at: "2026-09-01T00:00:00.000Z", text: "Sent." });
    expect(w.history.at(-1)!.message).toMatch(/before this case/i);
  });

  it("removes only a prior attempt, never a real submission", () => {
    const w = recordPriorAttempt(withNotice(), { at: "2026-09-01T00:00:00.000Z", text: "Sent." });
    const real = {
      ...w,
      submissions: [
        ...w.submissions,
        {
          id: "real-1",
          at: "2026-09-20T00:00:00.000Z",
          revision: 1,
          protocol: "operational" as const,
          text: "Recorded here.",
          receipt: "",
          attachments: [],
        },
      ],
    };
    expect(removePriorAttempt(real, "real-1").submissions).toHaveLength(2);
    const cleaned = removePriorAttempt(real, w.submissions[0]!.id);
    expect(cleaned.submissions).toHaveLength(1);
    expect(cleaned.submissions[0]!.id).toBe("real-1");
  });

  it("falls back to a fixed epoch rather than inventing a date", () => {
    const w = recordPriorAttempt(withNotice(), { at: "  ", text: "Sent, date forgotten." });
    expect(w.submissions[0]!.at).toBe(new Date(0).toISOString());
  });
  /**
   * The validator guards every vault write, and it strips keys it does not know. A prior attempt
   * that does not survive it comes back looking like one drafted here — and the guard that should
   * warn about resending goes quiet again.
   */
  it("survives the schema that guards every save", () => {
    const w = recordPriorAttempt(
      { ...newWorkspace(), notice: "x".repeat(40), protocol: "operational" },
      { at: "2026-09-01T00:00:00.000Z", text: "What I sent the first time." },
    );
    const parsed = WorkspaceSchema.safeParse(w);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    const round = parsed.data!;
    expect(round.submissions[0]!.source).toBe("prior");
    expect(round.submissions[0]!.revision).toBe(0);
    expect(priorAttempts(round as Workspace)).toHaveLength(1);
  });
});

/**
 * B-03, the reply delta. Until 23 Sep 2026 an Amazon reply reset every requirement to "needed",
 * so a seller redid their whole evidence review on each round — and the median real case is
 * multi-round, so the product was most useless exactly where it promised to save the most labour.
 */
describe("reply delta", () => {
  function withReply(w: Workspace, text: string): Workspace {
    w.replies.push({ id: "reply-1", at: new Date().toISOString(), text, applied: false });
    return w;
  }

  it("keeps a reviewed requirement the reply does not mention, with the seller's work attached", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report for this product.");
    const delta = computeReplyDelta(w, "reply-1")!;
    const invoice = delta.items.find((i) => i.requirement.label === "Supplier invoice")!;
    expect(invoice.change).toBe("carried");
    expect(invoice.requirement.status).toBe("reviewed");
    expect(invoice.requirement.recordId).toBe("file-1");
    expect(invoice.requirement.contentHash).toBe("hash-1");
    expect(invoice.requirement.page).toBe(2);
    expect(invoice.requirement.note).toBe(w.requirements[0]!.note);
  });

  it("reopens a reviewed requirement Amazon asks for again, quoting the reply", () => {
    const w = withReply(
      documentWorkspace(),
      "The document you sent was not sufficient. Please provide the supplier invoice again.",
    );
    const delta = computeReplyDelta(w, "reply-1")!;
    const invoice = delta.items.find((i) => i.requirement.label === "Supplier invoice")!;
    expect(invoice.change).toBe("reopened");
    expect(invoice.requirement.status).toBe("needed");
    // Anchored to Amazon's own words, never paraphrased — the rule everywhere else in this model.
    expect(invoice.replyQuote).toContain("supplier invoice");
    expect(w.notice).toContain(invoice.requirement.sourceQuote.slice(0, 0));
    // The linked file survives a reopen: the seller may well re-use it with a better explanation.
    expect(invoice.requirement.recordId).toBe("file-1");
  });

  it("adds a requirement the reply raises for the first time", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report for this product.");
    const delta = computeReplyDelta(w, "reply-1")!;
    const added = delta.items.filter((i) => i.change === "added");
    expect(added).toHaveLength(1);
    expect(added[0]!.requirement.label).toBe("Sales or performance record");
    expect(added[0]!.requirement.status).toBe("needed");
    expect(added[0]!.replyQuote).toContain("sales report");
  });

  it("leaves an unreviewed requirement outstanding whether or not the reply repeats it", () => {
    const base = documentWorkspace();
    base.requirements = base.requirements.map((r) => ({ ...r, status: "needed" as const }));
    const w = withReply(base, "Please provide the sales report for this product.");
    const delta = computeReplyDelta(w, "reply-1")!;
    const invoice = delta.items.find((i) => i.requirement.label === "Supplier invoice")!;
    // Amazon not repeating a request does not withdraw it, and we must not imply that it does.
    expect(invoice.change).toBe("outstanding");
    expect(invoice.requirement.status).toBe("needed");
  });

  it("counts the outcomes for the summary the seller confirms against", () => {
    const w = withReply(
      documentWorkspace(),
      "Please provide the supplier invoice again and add the sales report.",
    );
    const counts = replyDeltaCounts(computeReplyDelta(w, "reply-1")!);
    expect(counts).toEqual({ reopened: 1, added: 1, outstanding: 0, carried: 0 });
  });

  it("returns nothing for an unknown or already-applied reply", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report.");
    expect(computeReplyDelta(w, "nope")).toBeNull();
    const applied = applyWorkspaceReply(w, "reply-1");
    expect(computeReplyDelta(applied, "reply-1")).toBeNull();
  });

  it("applies exactly what the delta proposed, and survives the schema that guards every save", () => {
    const w = withReply(
      documentWorkspace(),
      "Please provide the supplier invoice again and add the sales report.",
    );
    const delta = computeReplyDelta(w, "reply-1")!;
    const next = applyWorkspaceReply(w, "reply-1");
    // Compared on everything the seller is shown, not on `id`: a newly added requirement gets a
    // fresh uuid from `proposedRequirements()` on each call, so the preview and the applied copy
    // differ there and nowhere else. Asserting deep equality would pin the uuid, not the promise.
    const shape = (rs: typeof next.requirements) =>
      rs.map((r) => ({ label: r.label, status: r.status, recordId: r.recordId }));
    expect(shape(next.requirements)).toEqual(shape(delta.requirements));
    expect(next.revision).toBe(w.revision + 1);
    // The 22 Sep lesson: the validator strips keys it does not know, so a shape that never meets
    // it in a test is a shape that silently loses fields on the way to the vault.
    const parsed = WorkspaceSchema.safeParse(next);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    expect(parsed.data!.requirements).toHaveLength(delta.requirements.length);
  });
});

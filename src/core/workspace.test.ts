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
  requirementsAfterKindChange,
  requirementsAfterNoticeChange,
  requirementKey,
  routeWorkspace,
  sourceQuoteResolves,
  requestTextForRevision,
  evidenceKindForRequirement,
  requirementEvidenceKind,
  EVIDENCE_KIND_LABELS,
  MATRIX_SOURCE_NOTE,
  SELLER_SOURCE_NOTE,
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
      revision: 1,
    });
    expect(sampleRecords).toHaveLength(1);
    expect(sampleRecords[0]!.label).toBe("Supplier invoice");
    const w = documentWorkspace();
    expect(w.requirements).toHaveLength(1);
    expect(w.notice).toContain(w.requirements[0]!.sourceQuote);
    expect(
      proposedRequirements({
        notice: "Do not provide invoices for this request.",
        formInstructions: "",
        revision: 1,
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
        requirements: [{ ...workspace.requirements[0]!, sourceQuote: "Invented request" }],
      }),
    ).not.toEqual([]);
    expect(
      workspaceGaps({
        ...workspace,
        requirements: [{ ...workspace.requirements[0]!, contentHash: undefined }],
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
    expect(next.previousRequests[0]!.notice).toBe(frozen.notice);
    // B-03, 23 Sep 2026: this line used to assert `"needed"`, which contradicted the test's own
    // name. The reply asks for a sales report and says nothing about the invoice, so the reviewed
    // invoice is kept — with its vault record, hash, page and the seller's note intact.
    expect(next.requirements[0]!.status).toBe("reviewed");
    expect(next.requirements[0]!.recordId).toBe("file-1");
    expect(next.requirements[0]!.note).toBe(frozen.requirements[0]!.note);
    expect(next.confirmed).toBe(false);
    expect(next.revision).toBe(2);
    expect(applyWorkspaceReply(next, "reply-1")).toBe(next);
    const held = applyWorkspaceReply({ ...w, professionalReviewRequired: true }, "reply-1");
    expect(routeWorkspace(held).protocol).toBe("specialist");
  });
  it("retains workspace data at the API boundary and rejects malformed evidence", () => {
    const file = { ...createCaseFile("UNKNOWN"), workspace: documentWorkspace() };
    expect(CaseDataSchema.parse(file).workspace).toEqual(file.workspace);
    file.workspace.requirements[0]!.page = -1;
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

/**
 * A-02 / A-03. Before 23 Sep 2026 the only answers a seller could give a requirement were "here it
 * is" and "I'm waiting". Someone who genuinely could not obtain a compliant invoice — the most
 * common dead end in this product — had no way to say so and stayed blocked on a gap they could
 * never clear, with `workspaceGaps` telling them forever to "review and link evidence".
 */
describe("a record the seller cannot obtain", () => {
  function declined(reason: string): Workspace {
    const w = documentWorkspace();
    w.requirements = w.requirements.map((r) => ({
      ...r,
      status: "cannot_obtain" as const,
      declined: { reason, alternativeId: "sourcing_change", at: "2026-09-23T00:00:00.000Z" },
    }));
    return w;
  }

  it("is a named gap, not an instruction to do the impossible", () => {
    const gaps = workspaceGaps(declined("The supplier closed in 2025 and issues no invoices."));
    expect(gaps).toContain("Named as unobtainable, and stated in the response: Supplier invoice");
    expect(gaps).not.toContain("Review and link evidence for: Supplier invoice");
  });

  it("still keeps the draft a working draft, because the evidence really is missing", () => {
    const w = declined("The supplier closed in 2025 and issues no invoices.");
    expect(composeWorkspace({ kind: "UNKNOWN", workspace: w }, 1).mode.mode).toBe("gap-draft");
  });

  it("states the gap in the seller's own words, in a section of its own", () => {
    const reason = "The supplier closed in 2025 and issues no invoices.";
    const draft = composeWorkspace({ kind: "UNKNOWN", workspace: declined(reason) }, 1);
    const section = draft.sections.find((s) => s.heading === "Records I could not obtain")!;
    // Its own heading, because a reader must never mistake a declared gap for a supplied record.
    expect(section).toBeDefined();
    expect(section.body).toContain(reason);
    expect(draft.sections.find((s) => s.heading === "Supporting records")!.body).not.toContain(
      reason,
    );
  });

  it("does not add the section when nothing was declined", () => {
    const draft = composeWorkspace({ kind: "UNKNOWN", workspace: documentWorkspace() }, 1);
    expect(draft.sections.find((s) => s.heading === "Records I could not obtain")).toBeUndefined();
  });

  it("falls back to the ordinary gap when a decline carries no reason", () => {
    const w = documentWorkspace();
    w.requirements = w.requirements.map((r) => ({ ...r, status: "cannot_obtain" as const }));
    // An empty decline is not an explanation, and must not buy the seller a softer message.
    expect(workspaceGaps(w)).toContain("Review and link evidence for: Supplier invoice");
  });

  it("survives the schema that guards every save", () => {
    // This validator strips keys it does not know, and that has already silently dropped two
    // fields in this codebase (#91's `source` and `issues`). A dropped decline would turn "I told
    // you I cannot get this" back into an unexplained blank the next time the case is opened.
    const w = declined("The supplier closed in 2025 and issues no invoices.");
    const parsed = WorkspaceSchema.safeParse(w);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    expect(parsed.data!.requirements[0]!.status).toBe("cannot_obtain");
    expect(parsed.data!.requirements[0]!.declined?.reason).toContain("supplier closed");
    expect(parsed.data!.requirements[0]!.declined?.alternativeId).toBe("sourcing_change");
  });
});

/**
 * A-01, EF-2's attestation. The layer existed in `readiness.ts` and nothing could write to it: the
 * only code that set `status: "done"` was the interview's `applyAnswer`, so `UNATTESTED_CLAIMS` had
 * never fired on a single real case. A Plan of Action's corrective-actions section is a set of
 * claims about completed work, and Amazon treats a claim it later finds untrue far more harshly
 * than an incomplete appeal.
 */
describe("confirming corrective actions", () => {
  function operational(extra: Partial<Workspace> = {}): Workspace {
    return {
      ...documentWorkspace(),
      protocol: "operational" as const,
      explanation:
        "The listing was suppressed because our dispatch check did not run on 12 September 2026.",
      correctiveActions:
        "We added a daily dispatch review on 16 September 2026, recorded by the warehouse owner.",
      preventiveMeasures:
        "The operations owner checks unresolved orders before the cutoff and records the review.",
      ...extra,
    };
  }

  it("warns when the draft states completed work nobody has stood behind", () => {
    const file = { ...createCaseFile("POLICY"), workspace: operational() };
    const findings = critiquePoa(composePoa(file), file).findings;
    const claim = findings.find((f) => f.code === "UNATTESTED_CLAIMS");
    expect(claim).toBeDefined();
    // A warning, never an error: a hard block would be the product overruling the person who did
    // the work. The seller submits, and D6 forbids us pretending otherwise.
    expect(claim!.severity).toBe("warning");
  });

  it("stops warning once the seller confirms", () => {
    const file = {
      ...createCaseFile("POLICY"),
      workspace: operational({ correctiveActionsAttested: { at: "2026-09-23T00:00:00.000Z" } }),
    };
    const findings = critiquePoa(composePoa(file), file).findings;
    expect(findings.find((f) => f.code === "UNATTESTED_CLAIMS")).toBeUndefined();
  });

  it("says nothing on a route that has no corrective actions", () => {
    // A document response makes no claims about completed work, so the check must stay silent
    // rather than becoming noise on every draft.
    const file = { ...createCaseFile("POLICY"), workspace: documentWorkspace() };
    const findings = critiquePoa(composePoa(file), file).findings;
    expect(findings.find((f) => f.code === "UNATTESTED_CLAIMS")).toBeUndefined();
  });

  it("survives the schema that guards every save", () => {
    const parsed = WorkspaceSchema.safeParse(
      operational({ correctiveActionsAttested: { at: "2026-09-23T00:00:00.000Z" } }),
    );
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    expect(parsed.data!.correctiveActionsAttested?.at).toBe("2026-09-23T00:00:00.000Z");
  });
});

/**
 * B-05. `proposedRequirements` used five regexes on the notice and never consulted the evidence
 * matrix, so a record Amazon did not spell out was never raised — and Amazon routinely does not
 * spell it out. Knowing that an inauthenticity case needs a supplier invoice whether or not the
 * notice says the word is what a seller pays an appeal writer for.
 */
/** G, 24 Sep 2026. Declared in the schema in the same edit as the model — it strips unknown keys. */
describe("the seller's business details", () => {
  it("survive the schema that guards every save", () => {
    const w = {
      ...newWorkspace(),
      caseFacts: {
        businessName: "Hawlton Trading",
        businessAddress: "12 High Street, Lahore",
        suppliers: ["Acme Ltd"],
      },
    };
    const parsed = WorkspaceSchema.safeParse(w);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    expect(parsed.data!.caseFacts).toEqual(w.caseFacts);
  });

  it("also survive the case-file schema the compose route validates", () => {
    const file = {
      ...createCaseFile("POLICY"),
      workspace: { ...newWorkspace(), caseFacts: { businessName: "Hawlton Trading" } },
    };
    const parsed = CaseDataSchema.safeParse(file);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    expect(parsed.data!.workspace?.caseFacts?.businessName).toBe("Hawlton Trading");
  });
});

/** 24 Sep 2026: these two records were typed "other", which the document checker refuses by design. */
describe("the two records that used to have no type", () => {
  it("raises a named test report as a compliance report, which can be checked", () => {
    const [r] = proposedRequirements({
      notice: "Please provide a test report from an accredited laboratory for this product.",
      formInstructions: "",
      revision: 1,
    });
    expect(r?.label).toBe("Test report or compliance certificate");
    expect(requirementEvidenceKind(r!)).toBe("compliance_report");
  });

  it("gives both matrix records a real type on the families that ask for them", () => {
    const blank = { notice: "Please respond.", formInstructions: "", revision: 1 };
    const kinds = [
      ...proposedRequirements(blank, "PRODUCT_SAFETY"),
      ...proposedRequirements(blank, "RELATED_ACCOUNT"),
    ].map((r) => requirementEvidenceKind(r));
    expect(kinds).toContain("compliance_report");
    expect(kinds).not.toContain("other");
  });
});

describe("the union of the notice and the matrix", () => {
  const notice = {
    notice: "Please provide the supplier invoice.",
    formInstructions: "",
    revision: 1,
  };

  it("raises a required record the notice never names", () => {
    const withoutKind = proposedRequirements(notice);
    const withKind = proposedRequirements(notice, "POLICY");
    expect(withoutKind.map((r) => r.label)).toEqual(["Supplier invoice"]);
    expect(withKind.map((r) => r.label).sort()).toEqual([
      "Sales or performance record",
      "Supplier invoice",
    ]);
  });

  it("marks what it inferred, and never attributes it to Amazon", () => {
    const inferred = proposedRequirements(notice, "POLICY").find((r) => r.source === "matrix")!;
    expect(inferred.source).toBe("matrix");
    // The seller must always be able to tell Amazon's words from ours.
    expect(notice.notice).not.toContain(inferred.sourceQuote);
    expect(inferred.sourceQuote).toMatch(/not named in your notice/i);
    const named = proposedRequirements(notice, "POLICY").find((r) => r.source === "notice")!;
    expect(notice.notice).toContain(named.sourceQuote);
  });

  it("does not raise the same record twice when the notice already names it", () => {
    // INAUTHENTIC_DOCUMENTS requires a supplier invoice, which this notice already asks for.
    const all = proposedRequirements(notice, "INAUTHENTIC_DOCUMENTS");
    expect(all.filter((r) => r.label === "Supplier invoice")).toHaveLength(1);
    expect(all.find((r) => r.label === "Supplier invoice")!.source).toBe("notice");
  });

  it("raises only what the matrix calls required", () => {
    // A matrix "optional" is a suggestion; putting one on a seller's list as an obligation would
    // misrepresent it, and the list is what `requirementsConfirmed` asks them to stand behind.
    const labels = proposedRequirements(notice, "POLICY").map((r) => r.label);
    expect(labels).not.toContain("Written procedure");
  });

  it("does not ask for a notice quote it knows cannot exist", () => {
    // `workspaceGaps` checks that a requirement's quote really appears in the seller's own text.
    // An inferred record has no such sentence, and demanding one would show the seller a fault in
    // their notice that is actually ours.
    const w: Workspace = {
      ...documentWorkspace(),
      requirements: proposedRequirements(notice, "POLICY"),
      notice: notice.notice,
    };
    expect(workspaceGaps(w).filter((g) => g.startsWith("Check the source"))).toEqual([]);
  });

  it("survives the schema that guards every save", () => {
    const w = { ...documentWorkspace(), requirements: proposedRequirements(notice, "POLICY") };
    const parsed = WorkspaceSchema.safeParse(w);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    // Stripped `source` would make an inferred record look like one Amazon named, and the gap
    // check would then demand a quote from the notice that was never there.
    expect(parsed.data!.requirements.some((r) => r.source === "matrix")).toBe(true);
  });
});

/**
 * B-06. K12 pre-agreed "classification-confidence display and user override verified working" as
 * the response to a wrong-classification signal, and nothing was ever built. It stopped being
 * cosmetic when B-05 made the violation kind decide which unspoken records get raised: one wrong
 * reading then produced three wrong answers — the guidance, the record list and the severity gate.
 */
describe("correcting the decoded kind", () => {
  it("adds what the new kind requires", () => {
    const existing = proposedRequirements(
      { notice: "Please provide the supplier invoice.", formInstructions: "", revision: 1 },
      "INAUTHENTIC_DOCUMENTS",
    );
    const next = requirementsAfterKindChange(existing, "POLICY");
    expect(next.map((r) => r.label)).toContain("Sales or performance record");
    expect(next.find((r) => r.label === "Sales or performance record")!.source).toBe("matrix");
  });

  it("never removes a record the seller has already worked on", () => {
    // The whole point. Rebuilding the list would delete reviewed records with a linked vault file
    // and the seller's own note — punishing them for telling us we read the notice wrong.
    const reviewed = documentWorkspace().requirements;
    const next = requirementsAfterKindChange(reviewed, "PERFORMANCE_METRIC");
    const invoice = next.find((r) => r.label === "Supplier invoice")!;
    expect(invoice.status).toBe("reviewed");
    expect(invoice.recordId).toBe("file-1");
    expect(invoice.note).toBe(reviewed[0]!.note);
    expect(next.length).toBeGreaterThanOrEqual(reviewed.length);
  });

  it("does not duplicate a record the list already has", () => {
    const reviewed = documentWorkspace().requirements;
    const next = requirementsAfterKindChange(reviewed, "INAUTHENTIC_DOCUMENTS");
    expect(next.filter((r) => r.label === "Supplier invoice")).toHaveLength(1);
  });

  it("adds nothing for a kind the matrix says nothing about", () => {
    const reviewed = documentWorkspace().requirements;
    expect(requirementsAfterKindChange(reviewed, "UNKNOWN")).toHaveLength(reviewed.length);
  });

  it("produces a list the schema still accepts", () => {
    const w = {
      ...documentWorkspace(),
      requirements: requirementsAfterKindChange(documentWorkspace().requirements, "POLICY"),
    };
    const parsed = WorkspaceSchema.safeParse(w);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
  });
});

/**
 * F + E, 23 Sep 2026. Two defects with one cause: the rule "a requirement's quote must appear in
 * the notice" was written twice — once in `workspaceGaps` and once inline in the workspace UI's
 * `changeRequirement` — and only the first copy was ever taught about the exceptions.
 *
 * The consequences were that a matrix-inferred record (B-05), a record the seller added themselves,
 * and any record carried through a reply round (B-03) could all be displayed and described as
 * needed, but could never be marked reviewed, waiting or unobtainable. The seller was told to
 * "update the task's source to an exact sentence from the current notice" — an instruction with no
 * satisfying answer, on records that were correct as they stood.
 *
 * These tests pin the rule, not the sentence, and the negative control at the end matters as much
 * as the rest: the check still has to catch a quote that has genuinely drifted, or the fix has
 * simply deleted the safeguard.
 */
describe("source provenance across revisions", () => {
  function withReply(w: Workspace, text: string): Workspace {
    w.replies.push({ id: "reply-1", at: new Date().toISOString(), text, applied: false });
    return w;
  }

  it("resolves a record we inferred, which quotes no Amazon sentence by design", () => {
    const w = documentWorkspace();
    expect(sourceQuoteResolves(w, { source: "matrix", sourceQuote: MATRIX_SOURCE_NOTE })).toBe(
      true,
    );
  });

  it("resolves a record the seller added from their own knowledge of the case", () => {
    const w = documentWorkspace();
    expect(sourceQuoteResolves(w, { source: "seller", sourceQuote: SELLER_SOURCE_NOTE })).toBe(
      true,
    );
  });

  it("keeps a carried requirement resolvable after a reply replaces the notice", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report for this product.");
    const before = w.requirements.find((r) => r.label === "Supplier invoice")!;
    const next = applyWorkspaceReply(w, "reply-1");

    // The reply is now the notice, so the invoice's quote is no longer in the current request.
    expect(next.notice).not.toContain(before.sourceQuote);

    const carried = next.requirements.find((r) => r.label === "Supplier invoice")!;
    expect(carried.status).toBe("reviewed");
    expect(sourceQuoteResolves(next, carried)).toBe(true);
    // And it is not reported as a defect in the seller's own text.
    expect(workspaceGaps(next)).not.toContain(
      "Check the source of the request for: Supplier invoice",
    );
  });

  it("backfills the revision for a requirement saved before the field existed", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report for this product.");
    // Exactly the shape of a case stored before today: a real notice quote, no `sourceRevision`.
    w.requirements = w.requirements.map(({ sourceRevision: _drop, ...rest }) => rest);
    const next = applyWorkspaceReply(w, "reply-1");
    const carried = next.requirements.find((r) => r.label === "Supplier invoice")!;
    expect(carried.sourceRevision).toBe(1);
    expect(sourceQuoteResolves(next, carried)).toBe(true);
  });

  it("points a reopened requirement at the reply that reopened it, not the old request", () => {
    const w = withReply(
      documentWorkspace(),
      "The document you sent was not sufficient. Please provide the supplier invoice again.",
    );
    const next = applyWorkspaceReply(w, "reply-1");
    const invoice = next.requirements.find((r) => r.label === "Supplier invoice")!;
    expect(invoice.sourceRevision).toBe(next.revision);
    expect(requestTextForRevision(next, invoice.sourceRevision!)).toContain(invoice.sourceQuote);
    expect(sourceQuoteResolves(next, invoice)).toBe(true);
  });

  it("still holds the previous request, so an old quote can be checked rather than assumed", () => {
    const w = withReply(documentWorkspace(), "Please provide the sales report for this product.");
    const original = w.notice;
    const next = applyWorkspaceReply(w, "reply-1");
    expect(requestTextForRevision(next, 1)).toContain(original);
    expect(requestTextForRevision(next, next.revision)).not.toContain(original);
  });

  /**
   * The negative control. If this passes trivially the fix has removed the safeguard rather than
   * scoping it: a requirement claiming to quote Amazon, whose quote is in no request we hold, is
   * still a real problem worth surfacing.
   */
  it("still flags a notice quote that appears in no request revision", () => {
    const w = documentWorkspace();
    const invented = {
      source: "notice" as const,
      sourceQuote: "Amazon never wrote this sentence.",
      sourceRevision: 1,
    };
    expect(sourceQuoteResolves(w, invented)).toBe(false);

    w.requirements = [{ ...w.requirements[0]!, ...invented }];
    expect(workspaceGaps(w)).toContain("Check the source of the request for: Supplier invoice");
  });

  it("treats an empty quote as unresolved rather than vacuously true", () => {
    const w = documentWorkspace();
    expect(
      sourceQuoteResolves(w, { source: "notice", sourceQuote: "   ", sourceRevision: 1 }),
    ).toBe(false);
  });
});

/**
 * J, 23 Sep 2026. `evidenceKindForRequirement` resolved a requirement back to its `EvidenceKind` by
 * matching its label against `REQUIREMENT_CANDIDATES` — the five patterns that detect a request in
 * notice text. But the model defines **eleven** kinds, so six of them resolved to `undefined`.
 *
 * Two consequences, both silent. Guidance (why Amazon wants it, what disqualifies it, the letter
 * that helps obtain it, the alternatives) was unreachable for those six. And `covered` — the set
 * that stops the matrix re-raising a record already on the plan — contained `undefined` in their
 * place, so re-applying a violation kind added them a second time.
 *
 * The cause is one conflation: finding a request in prose and identifying a record are different
 * jobs, and the narrow list was doing both.
 */
describe("evidence kind resolution", () => {
  it("resolves every label the model can produce, not just the five it can detect in prose", () => {
    const unresolved = Object.entries(EVIDENCE_KIND_LABELS).filter(
      ([kind, label]) => evidenceKindForRequirement(label) !== kind,
    );
    expect(unresolved).toEqual([]);
  });

  it("does not duplicate a record when a violation kind is applied twice", () => {
    const once = requirementsAfterKindChange([], "FUNDS");
    const twice = requirementsAfterKindChange(once, "FUNDS");
    expect(twice.map((r) => r.label).sort()).toEqual(once.map((r) => r.label).sort());
  });

  it("does not re-raise a record the notice already named", () => {
    const w = {
      notice: "Please provide your supplier invoice for the affected product.",
      formInstructions: "",
      revision: 1,
    };
    const labels = proposedRequirements(w, "INAUTHENTIC_DOCUMENTS").map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("carries a typed evidence kind rather than relying on the label being unchanged", () => {
    const inferred = requirementsAfterKindChange([], "FUNDS");
    for (const r of inferred) expect(r.evidenceKind).toBeDefined();
    // The typed field wins, so a seller renaming a record does not sever its guidance.
    const renamed = { ...inferred[0]!, label: "Whatever I call this locally" };
    expect(requirementEvidenceKind(renamed)).toBe(inferred[0]!.evidenceKind);
  });

  it("still resolves a requirement saved before the typed field existed", () => {
    expect(requirementEvidenceKind({ label: EVIDENCE_KIND_LABELS.financial_instrument_doc })).toBe(
      "financial_instrument_doc",
    );
  });
});

/**
 * The same "a label is not an identifier" fix, applied to the reply delta. B-03 matched an existing
 * requirement to one the reply asks for by comparing labels, which works only while nobody edits a
 * record's name — and a seller renaming "Supplier invoice" to something they recognise would have
 * made Amazon's repeat request look like a brand-new requirement, orphaning the file, note and
 * page reference already attached to it.
 */
describe("reply delta matches on identity, not display text", () => {
  it("reopens a renamed record when Amazon asks for it again", () => {
    const w = documentWorkspace();
    w.requirements = w.requirements.map((r) => ({ ...r, label: "Acme invoice (scan 3)" }));
    w.replies.push({
      id: "reply-1",
      at: new Date().toISOString(),
      text: "The document you sent was not sufficient. Please provide the supplier invoice again.",
      applied: false,
    });
    const delta = computeReplyDelta(w, "reply-1")!;
    // One item, not two: the rename did not create a duplicate alongside the seller's real work.
    expect(delta.items).toHaveLength(1);
    const item = delta.items[0]!;
    expect(item.change).toBe("reopened");
    expect(item.requirement.label).toBe("Acme invoice (scan 3)");
    expect(item.requirement.recordId).toBe("file-1");
    expect(item.requirement.contentHash).toBe("hash-1");
  });
});

/**
 * 23 Sep 2026. Confirming the request rebuilt the issues every time but the records only when there
 * were none, so a corrected notice kept the old list.
 */
describe("requirementsAfterNoticeChange", () => {
  const fresh = (notice: string) =>
    proposedRequirements({ notice, formInstructions: "", revision: 1 });
  const invoiceNotice = "Please provide invoices from your supplier.";
  const loaNotice = "Please provide a letter of authorization from the brand owner.";

  it("adds a record the corrected notice asks for", () => {
    const before = fresh(invoiceNotice);
    const after = requirementsAfterNoticeChange(before, fresh(`${invoiceNotice} ${loaNotice}`));
    expect(after.map((r) => r.label)).toEqual(
      expect.arrayContaining([before[0]!.label, fresh(loaNotice)[0]!.label]),
    );
    expect(after).toHaveLength(2);
  });

  it("keeps the seller's work on a record the corrected notice still names, with the new quote", () => {
    const [invoice] = fresh("Provide invoices.");
    const worked = {
      ...invoice!,
      status: "reviewed" as const,
      recordId: "f1",
      note: "Covers J-104.",
    };
    const [after] = requirementsAfterNoticeChange([worked], fresh(invoiceNotice));
    expect(after).toMatchObject({ recordId: "f1", note: "Covers J-104.", status: "reviewed" });
    expect(after!.sourceQuote).toBe(invoiceNotice);
  });

  it("drops an untouched record the corrected notice no longer names", () => {
    const after = requirementsAfterNoticeChange(fresh(invoiceNotice), fresh(loaNotice));
    expect(after.map((r) => r.label)).toEqual([fresh(loaNotice)[0]!.label]);
  });

  it("keeps a record the seller worked on even when the corrected notice drops it", () => {
    const [invoice] = fresh(invoiceNotice);
    const worked = { ...invoice!, note: "I asked the supplier on 20 Sep." };
    const after = requirementsAfterNoticeChange([worked], fresh(loaNotice));
    expect(after.map((r) => r.id)).toContain(worked.id);
  });

  it("turns a record we recommended into Amazon's once the notice names it", () => {
    const recommended = {
      ...fresh(invoiceNotice)[0]!,
      source: "matrix" as const,
      sourceQuote: "Recommended.",
      note: "Already have it.",
    };
    const [after] = requirementsAfterNoticeChange([recommended], fresh(invoiceNotice));
    expect(after).toMatchObject({
      source: "notice",
      sourceQuote: invoiceNotice,
      note: "Already have it.",
    });
  });

  it("never raises again a record the seller removed", () => {
    const [invoice] = fresh(invoiceNotice);
    const dismissed = [
      {
        key: requirementKey(invoice!),
        label: invoice!.label,
        reason: "Not asked for.",
        at: "2026-09-23T00:00:00.000Z",
      },
    ];
    expect(requirementsAfterNoticeChange([], fresh(invoiceNotice), dismissed)).toEqual([]);
    expect(
      requirementsAfterKindChange([], "INAUTHENTIC", dismissed).map(requirementKey),
    ).not.toContain(requirementKey(invoice!));
  });

  it("changes nothing when the notice is confirmed again unchanged", () => {
    const before = fresh(invoiceNotice);
    expect(requirementsAfterNoticeChange(before, fresh(invoiceNotice))).toEqual(before);
  });
});

/**
 * 23 Sep 2026 (audit item K). A notice that describes an earlier request, or waives one, created a
 * live requirement — so a seller was asked to find invoices Amazon had just said it no longer needed.
 */
describe("a record the notice waives or describes as past", () => {
  const labels = (notice: string) =>
    proposedRequirements({ notice, formInstructions: "", revision: 1 }).map((r) => r.label);

  it.each([
    "We previously requested invoices, but no further submission is needed.",
    "Invoices were requested earlier. No further action is required.",
    "Thank you for providing your invoices.",
    "Invoices are not needed for this review.",
  ])("raises nothing for %j", (notice) => {
    expect(labels(notice)).toEqual([]);
  });

  it("still raises a record asked for now, after a mention of the past", () => {
    expect(labels("We previously requested invoices; please provide them now.")).toEqual([
      "Supplier invoice",
    ]);
  });

  it("still raises a record asked for in preference to another", () => {
    // "rather than" waives the other record, not this one — so it is not treated as negation here.
    expect(labels("Please provide invoices rather than order confirmations.")).toContain(
      "Supplier invoice",
    );
  });
});

/**
 * 24 Sep 2026: the vault validator strips keys it does not know, and has dropped new fields here
 * before. A saved document check must survive the round trip, or it is lost on the first save.
 */
describe("saved document checks survive the vault validator", () => {
  it("keeps a field reading and an image reading", () => {
    const w = {
      ...documentWorkspace(),
      documentChecks: [
        {
          recordId: "file-1",
          contentHash: "hash-1",
          at: "2026-09-24T10:00:00.000Z",
          contextKey: "[]",
          outcome: {
            kind: "fields" as const,
            result: {
              evidenceKind: "supplier_invoice" as const,
              findings: [
                {
                  field: "issue date (within 365 days)",
                  status: "conflicting" as const,
                  observed: "2 March 2024",
                  note: "Dated more than 365 days before this check.",
                  comparedWith: "today, 24 Sep 2026",
                },
              ],
              triggeredDisqualifiers: [],
              allRequiredFieldsPresent: false,
            },
          },
        },
        {
          recordId: "file-2",
          at: "2026-09-24T10:00:00.000Z",
          contextKey: "[]",
          outcome: {
            kind: "image" as const,
            report: {
              checks: [
                {
                  id: "sharpness" as const,
                  status: "warn" as const,
                  label: "Sharpness",
                  detail: "Soft.",
                },
              ],
              looksReadable: false,
            },
          },
        },
      ],
    };
    const parsed = WorkspaceSchema.parse(w);
    expect(parsed.documentChecks).toEqual(w.documentChecks);
  });
});

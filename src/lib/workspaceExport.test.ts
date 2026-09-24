import { describe, expect, it } from "vitest";
import { buildCaseExport } from "./workspaceExport";
import { createCaseFile } from "@/core/caseFile";
import { documentWorkspace } from "@/core/workspace.fixture";
import { checkContextKey } from "@/core/documentCheck";
import { checkCaseDataForWorkspace } from "./documentChecks/context";
import { answerDraftKey } from "./workspaceDraft";

describe("buildCaseExport", () => {
  it("exports current and earlier questionnaire answers and labels unconfirmed drafts separately", () => {
    const question = "What caused the late shipments?";
    const w = {
      ...documentWorkspace(),
      protocol: "questionnaire" as const,
      formInstructions: question,
      answers: [
        { question, answer: "The collection was missed." },
        { question: "What changed before that?", answer: "We changed our carrier." },
      ],
      draft: {
        [answerDraftKey(question)]: "The carrier cancelled collection.",
        "response.explanation": "",
      },
    };
    const text = buildCaseExport({ ...createCaseFile("POLICY"), workspace: w }, w);
    expect(text).toContain(`Question: ${question}\nAnswer: The collection was missed.`);
    expect(text).toContain(
      "Earlier question: What changed before that?\nAnswer: We changed our carrier.",
    );
    expect(text).toContain("Unconfirmed field drafts — not confirmed response facts");
    expect(text).toContain("The carrier cancelled collection.");
    expect(text).toContain("(field cleared in draft)");
  });
  it("includes the notice, response facts, evidence plan, submissions and replies in full", () => {
    const w = {
      ...documentWorkspace(),
      submissions: [
        {
          id: "s1",
          at: new Date().toISOString(),
          revision: 1,
          protocol: "documents" as const,
          text: "Full response text goes here in full, not summarized.",
          receipt: "REF-123",
          attachments: [
            { recordId: "file-1", filename: "invoice.pdf", contentHash: "hash-1", page: 2 },
          ],
        },
      ],
      replies: [
        { id: "r1", at: new Date().toISOString(), text: "Please also send X.", applied: false },
      ],
    };
    const file = { ...createCaseFile("POLICY"), workspace: w };
    const text = buildCaseExport(file, w);
    expect(text).toContain(w.notice);
    expect(text).toContain(w.formInstructions);
    expect(text).toContain(w.explanation);
    expect(text).toContain("Supplier invoice");
    expect(text).toContain("Product code J-104 appears on the invoice line.");
    expect(text).toContain("Full response text goes here in full, not summarized.");
    expect(text).toContain("REF-123");
    expect(text).toContain("Please also send X.");
    expect(text).toContain("not a submitted response");
  });

  it("carries the business details, labelled as the seller's own statement", () => {
    const w = {
      ...documentWorkspace(),
      caseFacts: { businessName: "Hawlton Trading", suppliers: ["Acme Ltd", "Other Co"] },
    };
    const text = buildCaseExport({ ...createCaseFile("POLICY"), workspace: w }, w);
    expect(text).toContain("== Business details, as the seller stated them ==");
    expect(text).toContain("Registered business name: Hawlton Trading");
    expect(text).toContain("Suppliers: Acme Ltd; Other Co");
    expect(text).not.toContain("Registered business address");
  });

  it("does not claim a submission or reply exists when there are none", () => {
    const w = documentWorkspace();
    const file = { ...createCaseFile("POLICY"), workspace: w };
    const text = buildCaseExport(file, w, null);
    expect(text).toContain("(no submission recorded)");
    expect(text).toContain("(no reply recorded)");
    expect(text).toContain("(no outcome recorded)");
  });
});

/**
 * 23 Sep 2026 (audit item Q). The export called itself complete and left out most of what a
 * specialist asks first. Each assertion here is a field the case already held and the export
 * dropped.
 */
describe("what a specialist needs from the export", () => {
  const base = documentWorkspace();
  const w = {
    ...base,
    revision: 2,
    issues: [{ kind: "LISTING" as const, sourceQuote: "The listing violated detail page rules." }],
    requirements: [
      { ...base.requirements[0]!, source: "notice" as const, sourceRevision: 2 },
      {
        id: "m1",
        label: "Proof of sourcing",
        sourceQuote: "Recommended for this kind of complaint.",
        status: "cannot_obtain" as const,
        note: "",
        source: "matrix" as const,
        declined: { reason: "The supplier has closed.", at: "2026-09-20T00:00:00.000Z" },
      },
      {
        id: "s1",
        label: "Photo of stock",
        sourceQuote: "Added by you.",
        status: "needed" as const,
        note: "",
        source: "seller" as const,
      },
    ],
    previousRequests: [
      {
        revision: 1,
        notice: "The first notice, before Amazon replied.",
        formInstructions: "",
        protocol: "documents" as const,
        requirements: [],
      },
    ],
    history: [{ id: "h1", at: "2026-09-19T00:00:00.000Z", message: "Request confirmed." }],
  };
  const file = {
    ...createCaseFile("LISTING"),
    workspace: w,
    deadlines: [
      {
        kind: "appeal_window" as const,
        dueAt: "2026-10-01T00:00:00.000Z",
        label: "Appeal by 1 Oct 2026",
        dueOn: "2026-10-01",
      },
    ],
  };
  const log = {
    state: "REJECTED" as const,
    attemptCount: 1,
    resolution: { status: "rejected" as const, at: "2026-09-22T00:00:00.000Z" },
  };
  const text = buildCaseExport(file, w, log);

  it("states the deadline as the screen does", () => {
    expect(text).toContain("- Appeal by 1 Oct 2026");
  });

  it("says who asked for each record, instead of filing ours under Amazon's name", () => {
    expect(text).toContain("Requested because (request 2):");
    expect(text).toContain("Recommended because: Recommended for this kind of complaint.");
    expect(text).toContain("Added because: Added by you.");
    expect(text).not.toMatch(/Requested because: Recommended for this kind/);
  });

  it("keeps why a record could not be obtained", () => {
    expect(text).toContain("[cannot be obtained]");
    expect(text).toContain("The supplier has closed.");
  });

  it("includes every issue, the earlier request, the outcome and the history", () => {
    expect(text).toContain("The listing violated detail page rules.");
    expect(text).toContain("The first notice, before Amazon replied.");
    expect(text).toContain("Rejected or denied — recorded by the seller");
    expect(text).toContain("not independently verified");
    expect(text).toContain("Request confirmed.");
  });

  it("says when no document check was run, rather than staying silent", () => {
    expect(text).toContain("Document checks: none run on the files linked here.");
  });

  it("does not report 'no outcome' when the record simply could not be read", () => {
    const unread = buildCaseExport(file, w);
    expect(unread).toContain("could not be read");
    expect(unread).not.toContain("(no outcome recorded)");
  });
});

/** 24 Sep 2026: document checks are saved with the case, so the export carries them. */
describe("saved document checks in the export", () => {
  const base = documentWorkspace();
  const check = (contextKey: string) => ({
    recordId: "file-1",
    contentHash: "hash-1",
    at: "2026-09-24T10:00:00.000Z",
    contextKey,
    outcome: {
      kind: "fields" as const,
      result: {
        evidenceKind: "supplier_invoice" as const,
        findings: [
          {
            field: "supplier business name",
            status: "present" as const,
            observed: "Acme Wholesale Ltd",
            note: "The supplier's name is printed at the top.",
          },
        ],
        triggeredDisqualifiers: [],
        allRequiredFieldsPresent: true,
      },
    },
  });
  const current = checkContextKey(checkCaseDataForWorkspace(base));

  it("writes each finding with the words that were read", () => {
    const w = { ...base, documentChecks: [check(current)] };
    const text = buildCaseExport({ ...createCaseFile("POLICY"), workspace: w }, w);
    expect(text).toContain("supplier business name: Found. “Acme Wholesale Ltd”");
    expect(text).not.toContain("since changed");
  });

  it("marks a check compared with case details that have since changed", () => {
    const w = { ...base, documentChecks: [check("an older key")] };
    const text = buildCaseExport({ ...createCaseFile("POLICY"), workspace: w }, w);
    expect(text).toContain("compared with case details that have since changed");
  });

  it("leaves out a check made on a different file", () => {
    const w = { ...base, documentChecks: [{ ...check(current), contentHash: "hash-2" }] };
    const text = buildCaseExport({ ...createCaseFile("POLICY"), workspace: w }, w);
    expect(text).not.toContain("Acme Wholesale Ltd");
  });
});

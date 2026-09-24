import { describe, expect, it } from "vitest";
import {
  applyWorkspaceReply,
  computeReplyDelta,
  composeWorkspace,
  newWorkspace,
  proposedRequirements,
  replyDeltaCounts,
  requirementEvidenceKind,
  routeWorkspace,
  workspaceGaps,
  type Requirement,
  type Workspace,
} from "./workspace";
import { parseNotice } from "./noticeParser";
import { classifyStage1 } from "./classifier";
import { determineResponseType } from "./responseType";
import { computeDeadlines } from "./deadlinesModel";
import { buildDocumentCheck, type CheckContext, type FieldFinding } from "./documentCheck";
import {
  buildFactsLedger,
  disagreementsFromDocumentCheck,
  entriesFromDocumentCheck,
} from "./factsLedger";
import { isSeverityGated } from "./violationKinds";

/**
 * The evaluation set — ChatGPT audit §12, 24 Sep 2026.
 *
 * Twelve representative cases, each with the answer a correct product must give: how the request
 * is read, what evidence is asked for, what a document check finds, and the seller's next action.
 * Each behaviour below is tested somewhere on its own; this file runs them together through the
 * real pipeline, so a reviewer can read one file and see what AppealDeck does with a case. The
 * notices are synthetic, written from the wording recorded in the research, never a real seller's.
 *
 * Case 12 (a guest case moving into an existing account, documents included) needs a browser and a
 * vault, so it lives in `e2e/integrity.spec.ts`.
 *
 * A failure here means a case now gets a different answer. Either the product regressed, or the
 * expected answer was wrong — decide which before changing this file.
 */

const TODAY = "2026-09-24";
const INVOICE_REQUEST =
  "Date: 20 September 2026\n\nWe received a complaint about the authenticity of ASIN B0ABCDEF12. " +
  "Please provide invoices from your supplier covering the last 365 days. " +
  "You may submit your appeal within 30 days.";

function confirmed(notice: string, formInstructions = "Upload documents"): Workspace {
  const w: Workspace = { ...newWorkspace(), notice, formInstructions };
  const route = routeWorkspace(w);
  const kind = classifyStage1(parseNotice(notice)).kind;
  return {
    ...w,
    protocol: route.protocol,
    confirmed: true,
    requirements: proposedRequirements(w, kind),
  };
}

function reading(fields: Record<string, string>, status: FieldFinding["status"] = "present") {
  return Object.entries(fields).map(([field, observed]) => ({
    field,
    status,
    observed,
    note: "Read from the document.",
  }));
}

const context = (over: Partial<CheckContext> = {}): CheckContext => ({
  today: TODAY,
  asins: ["B0ABCDEF12"],
  referenceIds: [],
  ...over,
});

const reviewed = (r: Requirement): Requirement => ({
  ...r,
  status: "reviewed",
  recordId: "file-1",
  filename: "invoice.pdf",
  contentHash: "hash-1",
  page: 1,
  note: "The invoice lists the product.",
});

describe("the evaluation set", () => {
  it("1. a routine document request: documents, not a Plan of Action, with the invoice and its window", () => {
    const parsed = parseNotice(INVOICE_REQUEST);
    const kind = classifyStage1(parsed).kind;
    expect(kind).toBe("INAUTHENTIC");
    expect(isSeverityGated(kind)).toBe(false);
    expect(determineResponseType(INVOICE_REQUEST, "Upload documents").type).toBe(
      "SUPPORTING_DOCUMENTS",
    );

    const w = confirmed(INVOICE_REQUEST);
    expect(w.protocol).toBe("documents");
    expect(w.requirements.map((r) => requirementEvidenceKind(r))).toContain("supplier_invoice");

    // The window is counted from the notice's own date, not from today.
    const deadlines = computeDeadlines({ parsed, kind });
    const appeal = deadlines.find((d) => d.kind === "appeal_window");
    expect(appeal?.startsOn).toBe("2026-09-20");
    expect(appeal?.dueOn).toBe("2026-10-20");

    // The next action is the evidence, not a draft.
    expect(workspaceGaps(w).join(" ")).toMatch(/Supplier invoice/);
  });

  it("2. missing supplier details: the gap is named, and it is a finding about the document", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC",
      "supplier_invoice",
      [
        ...reading({ "supplier business name": "Acme Trading Ltd" }),
        ...reading({ "supplier phone/contact": "" }, "missing"),
      ],
      context(),
    );
    const phone = check.findings.find((f) => f.field === "supplier phone/contact")!;
    expect(phone.status).toBe("missing");
    expect(check.allRequiredFieldsPresent).toBe(false);
  });

  it("3. a date outside the window is found — the discovery a seller most needs", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC",
      "supplier_invoice",
      reading({ "issue date (within 365 days)": "Invoice date: 03-Mar-2025" }),
      context(),
    );
    const date = check.findings.find((f) => f.field === "issue date (within 365 days)")!;
    expect(date.status).toBe("conflicting");
    expect(date.note).toMatch(/more than 365 days before today/);
    expect(date.comparedWith).toBe("Today's date, 24 Sep 2026");
  });

  it("4. several ASINs: a list, not a contradiction — and an invoice that covers only one says so", () => {
    const check = buildDocumentCheck(
      "INAUTHENTIC",
      "supplier_invoice",
      reading({ "line items mappable to the ASIN(s)": "B0ABCDEF12 Blue widget x 200" }),
      context({ asins: ["B0ABCDEF12", "B0ZZZZZZZ9"] }),
    );
    const lines = check.findings.find((f) => f.field === "line items mappable to the ASIN(s)")!;
    expect(lines.status).toBe("present");
    expect(lines.note).toMatch(/does not show B0ZZZZZZZ9 — that needs its own record/);
  });

  it("5. several invoices: different dates are not a contradiction; a supplier the seller never named is", () => {
    const suppliers = ["Acme Trading Ltd"];
    const a = buildDocumentCheck(
      "INAUTHENTIC",
      "supplier_invoice",
      reading({
        "supplier business name": "Acme Trading Ltd",
        "issue date (within 365 days)": "12 March 2026",
      }),
      context({ suppliers }),
    );
    const b = buildDocumentCheck(
      "INAUTHENTIC",
      "supplier_invoice",
      reading({
        "supplier business name": "Quick Wholesale",
        "issue date (within 365 days)": "5 June 2026",
      }),
      context({ suppliers }),
    );
    const ledger = buildFactsLedger(
      [...entriesFromDocumentCheck("a.pdf", a), ...entriesFromDocumentCheck("b.pdf", b)],
      [
        ...disagreementsFromDocumentCheck("a.pdf", a),
        ...disagreementsFromDocumentCheck("b.pdf", b),
      ],
    );
    expect(ledger.contradictions).toHaveLength(1);
    expect(ledger.contradictions[0]!.entries.map((e) => e.value)).toEqual([
      "Quick Wholesale",
      "Acme Trading Ltd",
    ]);
  });

  it("6. a record the seller cannot obtain: said in their words, and the draft stays a working draft", () => {
    const w = confirmed(INVOICE_REQUEST);
    const invoice = w.requirements.find((r) => requirementEvidenceKind(r) === "supplier_invoice")!;
    const declined: Workspace = {
      ...w,
      requirementsConfirmed: true,
      explanation: "We bought this stock from a supplier who has since closed.",
      requirements: w.requirements.map((r) =>
        r.id === invoice.id
          ? {
              ...r,
              status: "cannot_obtain",
              declined: {
                reason: "The supplier closed in 2025 and issues no invoices.",
                alternativeId: "sourcing_change",
                at: `${TODAY}T00:00:00.000Z`,
              },
            }
          : reviewed(r),
      ),
    };
    const draft = composeWorkspace({ kind: "INAUTHENTIC", workspace: declined }, 1);
    expect(draft.mode.mode).toBe("gap-draft");
    expect(JSON.stringify(draft.sections)).toContain(
      "The supplier closed in 2025 and issues no invoices.",
    );
  });

  it("7. a reply adding one record: that record is added and the reviewed invoice is kept", () => {
    const base = confirmed(INVOICE_REQUEST);
    const w: Workspace = {
      ...base,
      requirements: base.requirements.map(reviewed),
      replies: [
        {
          id: "r1",
          at: `${TODAY}T00:00:00.000Z`,
          text: "Thank you. Please also provide a letter of authorization from the brand owner.",
          applied: false,
        },
      ],
    };
    const counts = replyDeltaCounts(computeReplyDelta(w, "r1")!);
    expect(counts.added).toBe(1);
    expect(counts.reopened).toBe(0);
    const after = applyWorkspaceReply(w, "r1");
    const invoice = after.requirements.find(
      (r) => requirementEvidenceKind(r) === "supplier_invoice",
    );
    expect(invoice?.status).toBe("reviewed");
    expect(invoice?.recordId).toBe("file-1");
  });

  it("8. a reply asking again for the invoice: reopened, with the file still linked", () => {
    const base = confirmed(INVOICE_REQUEST);
    const w: Workspace = {
      ...base,
      requirements: base.requirements.map(reviewed),
      replies: [
        {
          id: "r1",
          at: `${TODAY}T00:00:00.000Z`,
          text: "We could not verify the documents you provided. Please provide the supplier invoice.",
          applied: false,
        },
      ],
    };
    const after = applyWorkspaceReply(w, "r1");
    const invoice = after.requirements.find(
      (r) => requirementEvidenceKind(r) === "supplier_invoice",
    );
    expect(invoice?.status).toBe("needed");
    expect(invoice?.recordId).toBe("file-1");
  });

  it("9. a questionnaire: answered question by question, not as an appeal", () => {
    const notice = "Please complete the questionnaire below so we can review your account.";
    expect(
      routeWorkspace({
        ...newWorkspace(),
        notice,
        formInstructions: "Answer the following questions",
      }).protocol,
    ).toBe("questionnaire");
    expect(determineResponseType(notice, "Answer the following questions").type).toBe(
      "QUESTIONNAIRE",
    );
  });

  it("10. no further action requested: nothing to prepare, and no evidence raised", () => {
    const notice = "Your response remains under review. No additional information is required.";
    expect(
      routeWorkspace({ ...newWorkspace(), notice, formInstructions: "No action requested" })
        .protocol,
    ).toBe("information");
    expect(determineResponseType(notice).type).toBe("NO_ACTION_REQUESTED");
    expect(proposedRequirements({ notice, formInstructions: "", revision: 1 })).toEqual([]);
  });

  it("11. an explicit fabrication allegation: routed to professional help, never drafted", () => {
    const notice = "You have supplied falsified invoices. Please provide your supporting records.";
    const kind = classifyStage1(parseNotice(notice)).kind;
    expect(kind).toBe("INAUTHENTIC_DOCUMENTS");
    expect(isSeverityGated(kind)).toBe(true);
    expect(
      routeWorkspace({ ...newWorkspace(), notice, formInstructions: "Upload documents" }).protocol,
    ).toBe("specialist");
  });
});

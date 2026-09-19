import { describe, expect, it } from "vitest";
import {
  applyWorkspaceReply,
  composeWorkspace,
  newWorkspace,
  proposedRequirements,
  routeWorkspace,
  workspaceCanCompose,
  workspaceGaps,
  type Workspace,
} from "./workspace";
import { composePoa, critiquePoa } from "./composer";
import { createCaseFile } from "./interviewEngine";
import { CaseDataSchema } from "@/lib/caseSchema";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";

export function documentWorkspace(): Workspace {
  const w = {
    ...newWorkspace(),
    notice: "Please provide the supplier invoice for the affected product.",
    formInstructions: "Upload the invoice and explain the product mapping.",
    protocol: "documents" as const,
    confirmed: true,
    requirementsConfirmed: true,
    explanation:
      "The supplied invoice identifies our product by its manufacturer product code and records the purchase.",
  };
  w.requirements = proposedRequirements(w).map((r) => ({
    ...r,
    status: "reviewed",
    recordId: "file-1",
    filename: "invoice.pdf",
    contentHash: "hash-1",
    page: 2,
    note: "Product code J-104 appears on the invoice line.",
  }));
  return w;
}

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
    [
      "Please complete identity verification by providing government-issued identification.",
      "Upload documents",
      "clarification",
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
    [
      "Your selling account is linked to another account with an unresolved issue.",
      "Submit documents",
      "specialist",
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
    expect(next.requirements[0].status).toBe("needed");
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

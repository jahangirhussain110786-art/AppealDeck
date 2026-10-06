import { describe, expect, it } from "vitest";
import {
  applyWorkspaceReply,
  composePayloadWorkspace,
  composeWorkspace,
  latchD6,
  newWorkspace,
  professionalReviewApplies,
  releaseD6Latch,
  rootCauseRewritten,
  routeWorkspace,
  workspaceCanCompose,
  workspaceGaps,
  type Workspace,
} from "./workspace";
import { documentWorkspace } from "./workspace.fixture";
import { STORES } from "@/content/stores";
import { critiquePoa } from "./composer";
import { createCaseFile } from "./caseFile";

const FORGED =
  "Your selling account has been deactivated because we found you submitted forged invoices. Please submit a plan of action describing the root cause, corrective actions and preventive measures.";
const EDITED = FORGED.replace("forged invoices", "documents");

const base = (notice: string): Workspace => ({
  ...newWorkspace(),
  notice,
  confirmed: true,
  protocol: "operational",
});

describe("2. the D6 latch: editing the allegation away does not release the case", () => {
  it("(old behaviour) the text alone would release it", () => {
    // This is the bypass: with no latch, the edited text routes as an ordinary case.
    expect(
      professionalReviewApplies({
        notice: EDITED,
        formInstructions: "",
        professionalReviewRequired: true,
        previousRequests: [],
      }),
    ).toBe(false);
  });

  it("latches when the allegation is in the text a save removes, and routes to specialist", () => {
    const before = base(FORGED);
    const after = latchD6(before, { ...before, notice: EDITED });
    expect(after.d6Latch?.quote).toContain("forged invoices");
    expect(professionalReviewApplies(after)).toBe(true);
    expect(routeWorkspace(after).protocol).toBe("specialist");
    expect(workspaceCanCompose({ ...after, confirmed: true })).toBe(false);
  });

  it("never clears from a later text edit", () => {
    const before = base(FORGED);
    let w = latchD6(before, { ...before, notice: EDITED });
    w = latchD6(w, { ...w, notice: "Something else entirely about a listing policy." });
    w = latchD6(w, { ...w, d6Latch: undefined });
    expect(w.d6Latch).toBeDefined();
    expect(routeWorkspace(w).protocol).toBe("specialist");
  });

  it("an allegation in an unapplied reply latches, even if the reply is never confirmed", () => {
    const w = base("Please submit a plan of action describing the root cause.");
    const next = latchD6(w, {
      ...w,
      replies: [
        {
          id: "r1",
          at: "2026-10-01T00:00:00.000Z",
          text: "We found the invoices you provided were falsified.",
          applied: false,
        },
      ],
    });
    expect(next.d6Latch).toBeDefined();
  });

  it("applying a reply that carries an allegation latches", () => {
    const w: Workspace = {
      ...documentWorkspace(),
      replies: [
        {
          id: "r1",
          at: "2026-10-01T00:00:00.000Z",
          text: "We are investigating allegations of fraud on your account.",
          applied: false,
        },
      ],
    };
    const next = applyWorkspaceReply(w, "r1");
    expect(next.d6Latch).toBeDefined();
    expect(routeWorkspace(next).protocol).toBe("specialist");
  });

  it("a clean notice and reply never latch", () => {
    const w = documentWorkspace();
    expect(
      latchD6(w, { ...w, notice: "Please send the supplier invoice." }).d6Latch,
    ).toBeUndefined();
  });
});

describe("2. releasing the latch", () => {
  const latched = (): Workspace => {
    const before = base(FORGED);
    return latchD6(before, { ...before, notice: EDITED });
  };

  it("refuses the same notice with the words removed", () => {
    const res = releaseD6Latch(latched(), EDITED);
    expect(res).toEqual({ ok: false, reason: STORES.d6Release.sameNotice });
  });

  it("refuses text that is too short to be a notice", () => {
    expect(releaseD6Latch(latched(), "short")).toEqual({
      ok: false,
      reason: STORES.d6Release.tooShort,
    });
  });

  it("accepts a genuinely different notice, writes a history line and unconfirms the case", () => {
    const res = releaseD6Latch(
      latched(),
      "Your listing for the Acme travel mug violates the detail page policy. The title contains promotional wording. Please correct the title and submit a plan of action.",
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.workspace.d6Latch).toBeUndefined();
    expect(res.workspace.confirmed).toBe(false);
    expect(res.workspace.history.at(-1)?.message).toContain(STORES.d6Release.history);
    expect(routeWorkspace(res.workspace).protocol).not.toBe("specialist");
  });

  it("re-gates straight away when the new notice carries an allegation too", () => {
    const res = releaseD6Latch(
      latched(),
      "A different message entirely. You have been accused of fraud by several customers this month.",
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.workspace.d6Latch).toBeDefined();
    expect(routeWorkspace(res.workspace).protocol).toBe("specialist");
  });

  it("a release does not re-latch from the text it is replacing", () => {
    const w = latched();
    const res = releaseD6Latch(
      w,
      "A completely different notice about restricted product categories. Please upload an authorization.",
    );
    if (!res.ok) throw new Error("expected release");
    // The commit path passes the old workspace as `prev`; with `release` it is not read.
    expect(latchD6(w, res.workspace, { release: true }).d6Latch).toBeUndefined();
  });
});

describe("4. the server computes the same route as the client", () => {
  const refusal =
    "Your Plan of Action does not identify the root cause. Please also provide the supplier invoice for the affected product.";
  function refused(): Workspace {
    const w: Workspace = {
      ...newWorkspace(),
      notice:
        "Please submit a Plan of Action explaining the root cause, the corrective actions and the preventive measures for your account.",
      protocol: "operational",
      confirmed: true,
      requirementsConfirmed: true,
      explanation: "A supplier mistake caused the listing problem on our account last month.",
      correctiveActions: "We removed the listing on 2 September and retrained the staff.",
      preventiveMeasures: "Every listing is checked weekly by the owner against the catalogue.",
      replies: [{ id: "r1", at: "2026-10-01T00:00:00.000Z", text: refusal, applied: false }],
    };
    return applyWorkspaceReply(w, "r1");
  }

  it("the exact object generate() posts routes the way the page does", () => {
    const w = { ...refused(), confirmed: true };
    expect(routeWorkspace(w).protocol).toBe("operational");
    const posted = composePayloadWorkspace(w);
    expect(routeWorkspace(posted).protocol).toBe(routeWorkspace(w).protocol);
    expect(workspaceCanCompose(posted)).toBe(true);
  });

  it("(old behaviour) blanking previousRequests changed the route to documents", () => {
    const w = { ...refused(), confirmed: true };
    const old = { ...w, previousRequests: [] };
    expect(routeWorkspace(old).protocol).toBe("documents");
  });

  it("the payload carries the latch, so a gated case is gated on the server too", () => {
    const before = base(FORGED);
    const latched = latchD6(before, { ...before, notice: EDITED });
    const posted = composePayloadWorkspace({ ...latched, confirmed: true });
    expect(posted.d6Latch).toBeDefined();
    expect(routeWorkspace(posted).protocol).toBe("specialist");
  });

  it("history, recorded submissions, saved checks and drafts do not travel", () => {
    const w = {
      ...documentWorkspace(),
      draft: { "response.explanation": "x" },
      history: [{ id: "h", at: "2026-10-01T00:00:00.000Z", message: "m" }],
    };
    const posted = composePayloadWorkspace(w);
    expect(posted.draft).toBeUndefined();
    expect(posted.history).toEqual([]);
    expect(posted.submissions).toEqual([]);
  });
});

describe("5. the root-cause fault gap clears after a real rewrite", () => {
  const sent =
    "## Root Cause\n\nA supplier mistake caused the listing problem on our account last month.\n\n## Corrective Actions\n\nWe removed the listing.";
  const w = (explanation: string): Workspace => ({
    ...newWorkspace(),
    notice: "Your Plan of Action does not identify the root cause. Please try again.",
    revision: 2,
    protocol: "operational",
    confirmed: true,
    requirementsConfirmed: true,
    explanation,
    correctiveActions: "We removed the listing on 2 September and retrained the staff there.",
    preventiveMeasures: "Every listing is checked weekly by the owner against the catalogue.",
    submissions: [
      {
        id: "s1",
        at: "2026-09-20T00:00:00.000Z",
        revision: 1,
        protocol: "operational",
        text: sent,
        receipt: "",
        attachments: [],
      },
    ],
  });

  it("stays raised while the section is unchanged", () => {
    const unchanged = w("A supplier mistake caused the listing problem on our account last month.");
    expect(rootCauseRewritten(unchanged)).toBe(false);
    expect(workspaceGaps(unchanged)).toContain(STORES.rootCauseFaulted);
  });

  it("clears once the section is rewritten", () => {
    const rewritten = w(
      "Our intake checklist had no step that compared the supplier's product code with the listing. A new batch arrived with a changed code. Nobody checked it. The mismatch reached customers for eleven days.",
    );
    expect(rootCauseRewritten(rewritten)).toBe(true);
    expect(workspaceGaps(rewritten)).not.toContain(STORES.rootCauseFaulted);
  });
});

describe("11. quoted or A-to-z 'guarantee' is a warning, the seller's own promise is an error", () => {
  const critique = (text: string) => {
    const w: Workspace = { ...documentWorkspace(), explanation: text };
    const file = { ...createCaseFile("INAUTHENTIC"), workspace: w };
    const draft = composeWorkspace({ kind: file.kind, workspace: w }, 1);
    return critiquePoa(draft, file);
  };
  it("A-to-z Guarantee claims", () => {
    const r = critique(
      "Two A-to-z Guarantee claims were filed and both were resolved in the buyer's favour.",
    );
    const f = r.findings.find((x) => x.code === "BANNED_GUARANTEE");
    expect(f?.severity).toBe("warning");
    expect(r.passed).toBe(true);
  });
  it("a quoted reinstatement phrase", () => {
    const r = critique('Your reply said "your account will be reinstated" but it was not.');
    expect(r.findings.find((x) => x.code === "BANNED_REINSTATEMENT_PROMISE")?.severity).toBe(
      "warning",
    );
  });
  it("the seller promising it stays an error", () => {
    const r = critique("We guarantee this will never happen again.");
    expect(r.findings.find((x) => x.code === "BANNED_GUARANTEE")?.severity).toBe("error");
    expect(r.passed).toBe(false);
  });
});

describe("12. a documents response with no record attached is flagged", () => {
  it("warns when every record is declined with a reason", () => {
    const w = documentWorkspace();
    w.requirements = w.requirements.map((r) => ({
      ...r,
      status: "cannot_obtain" as const,
      recordId: undefined,
      filename: undefined,
      contentHash: undefined,
      page: undefined,
      declined: {
        reason: "The supplier closed and issues no invoices any more.",
        at: "2026-10-01T00:00:00.000Z",
      },
    }));
    expect(workspaceGaps(w)).toEqual([]);
    const file = { ...createCaseFile("INAUTHENTIC"), workspace: w };
    const draft = composeWorkspace({ kind: file.kind, workspace: w }, 1);
    const f = critiquePoa(draft, file).findings.find((x) => x.code === "NO_RECORDS_ATTACHED");
    expect(f?.severity).toBe("warning");
  });
  it("is silent when a record is reviewed", () => {
    const w = documentWorkspace();
    const file = { ...createCaseFile("INAUTHENTIC"), workspace: w };
    const draft = composeWorkspace({ kind: file.kind, workspace: w }, 1);
    expect(critiquePoa(draft, file).findings.some((x) => x.code === "NO_RECORDS_ATTACHED")).toBe(
      false,
    );
  });
});

describe("16. a retraction record answered by a note alone is the seller's statement", () => {
  it("is not printed as a rights owner retraction", () => {
    const w: Workspace = {
      ...documentWorkspace(),
      position: "dispute",
      requirements: [
        {
          id: "x",
          label: "Rights-owner retraction",
          sourceQuote: "n",
          status: "reviewed",
          note: "The brand owner is my supplier and has no complaint.",
          source: "matrix",
          evidenceKind: "rights_owner_retraction",
        },
      ],
    };
    const draft = composeWorkspace({ kind: "INTELLECTUAL_PROPERTY", workspace: w }, 1);
    const body = draft.sections.find((s) => s.heading === "Supporting records")!.body;
    expect(body).toContain("Seller's statement:");
    expect(body).not.toContain("Rights-owner retraction (statement");
  });
});

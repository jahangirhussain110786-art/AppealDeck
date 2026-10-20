import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDecode } from "./index";
import { newWorkspace, proposedRequirements, type Workspace } from "./workspace";

/**
 * The invented seller walk-through of 19 Oct 2026 (`docs/handoffs/2026-10-19-seller-test/`). Each
 * notice was run through the product like a seller would; these are the answers a correct product
 * gave after the defects the walk-through found were fixed.
 */
const read = (f: string) =>
  readFileSync(join(process.cwd(), "docs/handoffs/2026-10-19-seller-test", f), "utf8");
const named = (text: string) => {
  const kind = runDecode(text, {}).classification.kind;
  const w: Workspace = { ...newWorkspace(), notice: text };
  return { kind, labels: proposedRequirements(w, kind).filter((r) => r.source === "notice") };
};

describe("19 Oct 2026 walk-through notices", () => {
  it("D: a children's product safety request is product safety, not authenticity", () => {
    // "If we cannot verify the documents, the listing will remain removed" is a warning, not a finding.
    const { kind, labels } = named(read("notice-D-product-safety.txt"));
    expect(kind).toBe("PRODUCT_SAFETY");
    expect(labels.map((r) => r.label)).toEqual(
      expect.arrayContaining(["Test report or compliance certificate", "Product and label photos"]),
    );
    expect(labels.map((r) => r.label)).not.toContain("Supplier invoice");
  });

  it("E: a related-account notice raises the documents it lists, in spite of 'no longer connected'", () => {
    const { kind, labels } = named(read("notice-E-related-account.txt"));
    expect(kind).toBe("RELATED_ACCOUNT");
    const got = labels.map((r) => r.label);
    expect(got).toEqual(
      expect.arrayContaining([
        "Proof of address",
        "Requested identity record",
        "Linked-account resolution record",
      ]),
    );
  });

  it("F: a funds notice that asks for 'a government-issued photo ID' names the ID itself", () => {
    const { kind, labels } = named(read("notice-F-funds.txt"));
    expect(kind).toBe("FUNDS");
    expect(labels.map((r) => r.label)).toEqual(
      expect.arrayContaining(["Bank or financial record", "Requested identity record"]),
    );
  });
});

describe("19 Oct 2026 walk-through: routing", () => {
  it("E: a related-account appeal that lists an ID still gets a place to write its explanation", async () => {
    const { routeWorkspace } = await import("./workspace");
    const route = routeWorkspace({
      ...newWorkspace(),
      notice: read("notice-E-related-account.txt"),
    });
    expect(route.protocol).not.toBe("verification");
  });

  it("a genuine identity verification request is still a verification", async () => {
    const { routeWorkspace } = await import("./workspace");
    const route = routeWorkspace({
      ...newWorkspace(),
      notice:
        "Please complete identity verification by providing a government-issued ID. Your account will remain blocked until we receive it.",
    });
    expect(route.protocol).toBe("verification");
  });
});

describe("19 Oct 2026 walk-through: where documents go", () => {
  it("F: a funds notice that says to email Amazon names that address", async () => {
    const { submissionEmail } = await import("./workspace");
    expect(submissionEmail(read("notice-F-funds.txt"))).toBe("disbursement-appeals@amazon.com");
  });
  it("an ordinary appeal notice names none", async () => {
    const { submissionEmail } = await import("./workspace");
    expect(submissionEmail(read("notice-A-authenticity.txt"))).toBeNull();
    expect(submissionEmail(read("notice-C-trademark.txt"))).toBeNull();
  });
});

describe("19 Oct 2026 walk-through: restricted, review policy, verification", () => {
  it("G: a supplement approval request asks for the lab, GMP, label and invoice records, and not a 'listing correction'", () => {
    const { kind, labels } = named(read("notice-G-restricted.txt"));
    expect(kind).toBe("RESTRICTED_PRODUCT");
    const w: Workspace = { ...newWorkspace(), notice: read("notice-G-restricted.txt") };
    const all = proposedRequirements(w, kind).map((r) => r.label);
    expect(labels.map((r) => r.label)).toEqual(
      expect.arrayContaining([
        "Certificate of Analysis",
        "Manufacturing (cGMP) certificate",
        "Product and label photos",
        "Supplier invoice",
      ]),
    );
    expect(all).not.toContain("Listing correction record");
  });

  it("H: a review-incentive removal is a policy case, not a listing case", () => {
    expect(named(read("notice-H-reviews.txt")).kind).toBe("POLICY");
  });

  it("I: an identity verification names its three records", () => {
    const { kind, labels } = named(read("notice-I-verification.txt"));
    expect(kind).toBe("VERIFICATION");
    expect(labels.map((r) => r.label)).toEqual(
      expect.arrayContaining([
        "Requested identity record",
        "Bank or financial record",
        "Proof of address",
      ]),
    );
  });
});

describe("19 Oct 2026 walk-through: a verification call has a clock", () => {
  it("I: 'schedule a video call ... within 7 days of this message' is a seven-day window", async () => {
    const { parseNotice } = await import("./noticeParser");
    const p = parseNotice(read("notice-I-verification.txt"));
    expect(p.statedWindowDays).toBe(7);
  });
});

describe("19 Oct 2026 walk-through: a review-incentive notice raises no unrelated records", () => {
  it("H: no order report and no listing correction record", () => {
    const text = read("notice-H-reviews.txt");
    const kind = runDecode(text, {}).classification.kind;
    const w: Workspace = { ...newWorkspace(), notice: text };
    const labels = proposedRequirements(w, kind).map((r) => r.label);
    expect(labels).not.toContain("Sales or performance record");
    expect(labels).not.toContain("Listing correction record");
  });
});

describe("19 Oct 2026 walk-through: round 4", () => {
  const more = JSON.parse(read("more-notices.json")) as Array<{ id: string; text: string }>;
  const get = (id: string) => more.find((n) => n.id === id)!.text;

  it("X: an A-to-z claim rate notice is a performance case, not a listing case", () => {
    expect(runDecode(get("X-a-to-z"), {}).classification.kind).toBe("PERFORMANCE_METRIC");
  });

  it("a funds notice that mentions A-to-z claims stays a funds notice", () => {
    expect(runDecode(read("notice-F-funds.txt"), {}).classification.kind).toBe("FUNDS");
  });

  it("J: an FBA inbound notice does not ask for an order export", () => {
    const text = get("J-fba-inbound");
    const kind = runDecode(text, {}).classification.kind;
    const w: Workspace = { ...newWorkspace(), notice: text };
    expect(proposedRequirements(w, kind).map((r) => r.label)).not.toContain(
      "Sales or performance record",
    );
  });

  it("U: Amazon asking to 'send a copy of the invoice' is a document request", async () => {
    const { analyzeReply } = await import("./responseAnalyzer");
    expect(analyzeReply(get("U-reply-documents")).category).toBe("document_request");
  });
});

describe("19 Oct 2026 walk-through: the invoice one step up the chain", () => {
  const raise = (text: string) =>
    proposedRequirements({ ...newWorkspace(), notice: text, revision: 2 }).map((r) => r.label);

  it("a refusal asking for 'the invoice from the manufacturer that <supplier> bought from' is a new record", async () => {
    const more = JSON.parse(read("more-notices.json")) as Array<{ id: string; text: string }>;
    const labels = raise(more.find((n) => n.id === "U-reply-documents")!.text);
    expect(labels).toContain("Invoice from the supplier's own supplier");
    // The ordinary invoice already attached is not asked for again.
    expect(labels).not.toContain("Supplier invoice");
  });

  it("the ordinary 'invoices for the units you purchased from your supplier' is still one invoice", () => {
    const labels = raise(read("notice-A-authenticity.txt"));
    expect(labels).toContain("Supplier invoice");
    expect(labels).not.toContain("Invoice from the supplier's own supplier");
  });
});

describe("19 Oct 2026 walk-through: a refused questionnaire stays a questionnaire", () => {
  const questionnaire = (
    JSON.parse(read("more-notices.json")) as Array<{ id: string; text: string }>
  ).find((n) => n.id === "N-questionnaire")!.text;
  const refusal =
    "Thank you for your response to the account review questionnaire. We could not reinstate your account because your answer to question 4 does not identify all owners of the business and their share of ownership. Please resubmit your answers.";

  it("keeps the form and its four questions after Amazon's refusal is applied", async () => {
    const { applyWorkspaceReply, routeWorkspace, questionnaireQuestions } =
      await import("./workspace");
    const w0: Workspace = { ...newWorkspace(), notice: questionnaire, protocol: "questionnaire" };
    w0.replies.push({ id: "r1", at: new Date().toISOString(), text: refusal, applied: false });
    const w1 = applyWorkspaceReply(w0, "r1");
    const route = routeWorkspace(w1);
    expect(route.protocol).toBe("questionnaire");
    expect(questionnaireQuestions({ ...w1, protocol: route.protocol })).toHaveLength(4);
  });

  it("a final decision does not reopen the questionnaire", async () => {
    const { applyWorkspaceReply, routeWorkspace } = await import("./workspace");
    const w0: Workspace = { ...newWorkspace(), notice: questionnaire, protocol: "questionnaire" };
    w0.replies.push({
      id: "r1",
      at: new Date().toISOString(),
      text: "Our decision is final and we will not review further appeals. Please do not submit another appeal.",
      applied: false,
    });
    expect(routeWorkspace(applyWorkspaceReply(w0, "r1")).protocol).not.toBe("questionnaire");
  });
});

describe("19 Oct 2026 walk-through: a record the seller adds by hand", () => {
  it("is given the kind its name says, so it can be checked and counted", async () => {
    const { evidenceKindFromName } = await import("./workspace");
    expect(evidenceKindFromName("Supplier invoice, Magnolia Botanicals")).toBe("supplier_invoice");
    expect(evidenceKindFromName("Second supplier invoice (Atlanta)")).toBe("supplier_invoice");
    expect(evidenceKindFromName("Letter of authorization from Trailhead")).toBe(
      "brand_authorization",
    );
    expect(evidenceKindFromName("Invoice from the supplier's own supplier")).toBe(
      "supplier_invoice",
    );
  });
  it("stays unkinded when the name matches nothing we know", async () => {
    const { evidenceKindFromName } = await import("./workspace");
    expect(evidenceKindFromName("Photo of the warehouse")).toBeUndefined();
  });
});

describe("19 Oct 2026 walk-through: a request naming several compliance documents", () => {
  const labelsOf = (text: string) => {
    const kind = runDecode(text, {}).classification.kind;
    return proposedRequirements({ ...newWorkspace(), notice: text }, kind).map((r) => r.label);
  };

  it("hazmat: the safety data sheet and the UN38.3 summary are two records", () => {
    const labels = labelsOf(read("notice-3-hazmat.txt"));
    expect(labels).toEqual(
      expect.arrayContaining(["Safety data sheet (SDS)", "UN38.3 battery test summary"]),
    );
    // The UN38.3 sentence says "test report" too; it is not a third, general record.
    expect(labels).not.toContain("Test report or compliance certificate");
  });

  it("children's product: the certificate and the lab report are two records", () => {
    const labels = labelsOf(read("notice-D-product-safety.txt"));
    expect(labels).toEqual(
      expect.arrayContaining([
        "Children's Product Certificate",
        "Test report or compliance certificate",
      ]),
    );
  });
});

describe("19 Oct 2026 walk-through: a UK VAT and business verification", () => {
  const text = read("notice-4-uk-vat.txt");
  it("is a verification, not a funds notice, and names its four records", () => {
    const kind = runDecode(text, {}).classification.kind;
    expect(kind).toBe("VERIFICATION");
    const labels = proposedRequirements({ ...newWorkspace(), notice: text }, kind)
      .filter((r) => r.source === "notice")
      .map((r) => r.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "VAT registration certificate",
        "Bank or financial record",
        "Proof of address",
        "Requested identity record",
      ]),
    );
  });
});

describe("19 Oct 2026 walk-through: a warning about funds is not a second issue", () => {
  it("UK VAT verification raises one issue, not 'Funds hold' as well", async () => {
    const { detectIssues } = await import("./noticeIssues");
    expect(detectIssues(read("notice-4-uk-vat.txt")).map((i) => i.kind)).toEqual(["VERIFICATION"]);
  });
  it("a funds notice that states the hold still raises it", async () => {
    const { detectIssues } = await import("./noticeIssues");
    expect(detectIssues(read("notice-F-funds.txt")).map((i) => i.kind)).toContain("FUNDS");
  });
});

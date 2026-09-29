import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDecode } from "./index";
import { determineResponseType } from "./responseType";
import { newWorkspace, proposedRequirements, routeWorkspace, type Workspace } from "./workspace";
import { questionsIn } from "./questionnaire";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";
import { analyzeReply } from "./responseAnalyzer";
import { noticeMarkerHits } from "../lib/noticeLikeness";

/**
 * The researched test notices, 29 Sep 2026.
 *
 * Thirteen synthetic notices written from Amazon's real wording (seller-forum quotes and the
 * 19 Sep 2026 research), one per kind of case, kept in
 * `docs/handoffs/2026-09-29-test-notices/notices.json`. They were written *after* the engine, so
 * unlike the fixtures it was built against, running them was a fair test. It failed on seven: the
 * most common deactivation there is read as UNKNOWN, documents listed under "please send us:"
 * were never raised, a product-safety deadline was missed, a questionnaire got one essay box, a
 * genuine trademark notice was flagged as a possible scam, a falsified-documents notice was refused
 * outright, and an Amazon refusal was read as a request that had not been decided.
 *
 * Each assertion below is the answer a correct product gives. A failure means a case now gets a
 * different answer: decide whether the product regressed or the expectation was wrong before
 * changing this file.
 */

type Notice = { id: string; text: string };
const NOTICES: Notice[] = JSON.parse(
  readFileSync(join(process.cwd(), "docs/handoffs/2026-09-29-test-notices/notices.json"), "utf8"),
);
const text = (id: string) => NOTICES.find((n) => n.id === id)!.text;
const decode = (id: string) => runDecode(text(id), {});
const workspaceFor = (id: string): Workspace => ({ ...newWorkspace(), notice: text(id) });
const named = (id: string) =>
  proposedRequirements(workspaceFor(id), decode(id).classification.kind)
    .filter((r) => r.source === "notice")
    .map((r) => r.label);

describe("the researched test notices", () => {
  it("reads a Section 3 authenticity complaint as inauthentic, and raises the invoices it lists", () => {
    expect(decode("t01-inauthentic-section3").classification.kind).toBe("INAUTHENTIC");
    // Listed under "please send us:" on its own line, with no request verb of its own.
    expect(named("t01-inauthentic-section3")).toContain("Supplier invoice");
    expect(determineResponseType(text("t01-inauthentic-section3")).type).toBe("PLAN_OF_ACTION");
  });

  it("reads an Order Defect Rate deactivation as a performance case needing a Plan of Action", () => {
    expect(decode("t02-performance-odr").classification.kind).toBe("PERFORMANCE_METRIC");
    expect(determineResponseType(text("t02-performance-odr")).type).toBe("PLAN_OF_ACTION");
  });

  it("reads a trademark notice as intellectual property, without calling it a possible scam", () => {
    expect(decode("t03-ip-trademark").classification.kind).toBe("INTELLECTUAL_PROPERTY");
    // The rights owner's own email is part of a genuine IP notice.
    expect(assessNoticeAuthenticity(text("t03-ip-trademark")).worthChecking).toBe(false);
    expect(named("t03-ip-trademark")).toEqual(
      expect.arrayContaining(["Supplier invoice", "Authorization letter"]),
    );
    // "If you have a letter of authorization … or an invoice …, you can submit an appeal."
    expect(determineResponseType(text("t03-ip-trademark")).type).toBe("SUPPORTING_DOCUMENTS");
  });

  it("still flags an unlabelled non-Amazon address inside an IP notice", () => {
    const forged = `${text("t03-ip-trademark")}\n\nReply to appeals@amazon-ip-review.example to restore your listing.`;
    expect(assessNoticeAuthenticity(forged).signals.map((s) => s.id)).toContain(
      "non_amazon_sender",
    );
  });

  it("reads the related-account, verification, funds and restricted notices as their own kinds", () => {
    expect(decode("t04-related-account").classification.kind).toBe("RELATED_ACCOUNT");
    expect(decode("t05-verification-video").classification.kind).toBe("VERIFICATION");
    expect(decode("t06-funds-disbursement").classification.kind).toBe("FUNDS");
    expect(decode("t08-restricted-gated").classification.kind).toBe("RESTRICTED_PRODUCT");
  });

  it("reads a funds request as a documents response, with the bank statement Amazon named", () => {
    expect(determineResponseType(text("t06-funds-disbursement")).type).toBe("SUPPORTING_DOCUMENTS");
    expect(named("t06-funds-disbursement")).toContain("Bank or financial record");
  });

  it("reads a product-safety request's list and its last day", () => {
    expect(decode("t07-product-safety").classification.kind).toBe("PRODUCT_SAFETY");
    // Listed under "provide the following by 20 October 2026:", so named by Amazon, not by us.
    expect(named("t07-product-safety")).toContain("Test report or compliance certificate");
    const due = decode("t07-product-safety").deadlines.find((d) => d.kind === "appeal_window");
    expect(due?.dueOn).toBe("2026-10-20");
  });

  it("accepts a short falsified-documents notice and routes it to professional help", () => {
    // Refused as "not an Amazon notice" before: the server kept a narrower marker list.
    expect(noticeMarkerHits(text("t09-forged-documents"))).toBeGreaterThanOrEqual(2);
    const read = decode("t09-forged-documents");
    expect(read.classification.kind).toBe("INAUTHENTIC_DOCUMENTS");
    // "Providing falsified documents is a serious violation" is a rule, not a request.
    expect(determineResponseType(text("t09-forged-documents")).type).not.toBe(
      "SUPPORTING_DOCUMENTS",
    );
    expect(routeWorkspace(workspaceFor("t09-forged-documents")).protocol).toBe("specialist");
  });

  it("gives a numbered appeal form one answer per question", () => {
    expect(determineResponseType(text("t10-questionnaire")).type).toBe("QUESTIONNAIRE");
    expect(routeWorkspace(workspaceFor("t10-questionnaire")).protocol).toBe("questionnaire");
    expect(questionsIn(text("t10-questionnaire"))).toHaveLength(3);
  });

  it("counts a stated window from the email's own date", () => {
    const read = decode("t11-listing-policy-header-date");
    expect(read.classification.kind).toBe("LISTING");
    expect(read.deadlines.find((d) => d.kind === "appeal_window")?.dueOn).toBe("2026-10-03");
  });

  it("raises every warning sign in a fake 'Amazon' email", () => {
    const ids = assessNoticeAuthenticity(text("t12-phishing")).signals.map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(ids).toEqual(expect.arrayContaining(["non_amazon_link", "non_amazon_sender"]));
  });

  it("stays silent on every genuine notice", () => {
    for (const n of NOTICES.filter((x) => x.id !== "t12-phishing")) {
      expect(assessNoticeAuthenticity(n.text).signals, n.id).toEqual([]);
    }
  });

  it("reads Amazon's refusal as a refusal, and still raises the invoices it asks for", () => {
    const reply = analyzeReply(text("t13-reply-refusal"));
    expect(reply.category).toBe("needs_more_information");
    expect(reply.extractedAsks).toContain("supplier_invoice");
    // "…for the ASINs listed in our previous message" names where the ASINs are; it is not history.
    expect(named("t13-reply-refusal")).toContain("Supplier invoice");
  });
});

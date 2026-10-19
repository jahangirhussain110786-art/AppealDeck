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
        "Test report or compliance certificate",
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

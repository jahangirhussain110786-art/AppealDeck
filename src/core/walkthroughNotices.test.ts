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

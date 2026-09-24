import { describe, expect, it } from "vitest";
import { checkWordingLock } from "./wordingLock";

const seller =
  "on 3 sep we found our supplier Acme sent 40 units of B08N5WRWNW without invoices. we stopped selling it and asked Acme for the invoices.";

describe("the wording lock", () => {
  it.each([
    [
      "We have not trained the warehouse team on invoice checks.",
      "We have trained the warehouse team on invoice checks.",
    ],
    [
      "We haven't trained the warehouse team on invoice checks.",
      "We have trained the warehouse team on invoice checks.",
    ],
    [
      "We plan to train the warehouse team on invoice checks.",
      "We trained the warehouse team on invoice checks.",
    ],
    ["We received invoices from our supplier Acme.", "We received invoices from our supplier."],
  ])(
    "rejects a rewrite that removes qualifications or a recognized name: %s",
    (original, rewrite) => {
      expect(checkWordingLock(original, rewrite).ok).toBe(false);
    },
  );
  it("lets a rewrite through when it changes only the wording", () => {
    const rewrite =
      "On 3 Sep we found that our supplier, Acme, had sent 40 units of B08N5WRWNW without invoices. We stopped selling the product and asked Acme for the invoices.";
    expect(checkWordingLock(seller, rewrite)).toEqual({ ok: true, added: [], dropped: [] });
  });

  it("refuses a rewrite that adds a date, a number or an identifier", () => {
    const rewrite =
      "On 3 Sep we found that Acme had sent 40 units of B08N5WRWNW without invoices. On 5 Sep we removed all 120 listings and asked Acme for the invoices.";
    const result = checkWordingLock(seller, rewrite);
    expect(result.ok).toBe(false);
    expect(result.added).toEqual(expect.arrayContaining(["5", "120"]));
  });

  it("refuses a rewrite that drops a fact the seller wrote", () => {
    const rewrite =
      "Recently we found our supplier Acme sent units of a product without invoices. We stopped selling it and asked Acme for the invoices.";
    const result = checkWordingLock(seller, rewrite);
    expect(result.ok).toBe(false);
    expect(result.dropped).toEqual(expect.arrayContaining(["3", "sep", "40", "b08n5wrwnw"]));
  });

  it("refuses a rewrite that names a company or person the seller never mentioned", () => {
    const rewrite =
      "On 3 Sep we found our supplier Acme sent 40 units of B08N5WRWNW without invoices. We engaged Deloitte to audit our supply chain and asked Acme for the invoices.";
    const result = checkWordingLock(seller, rewrite);
    expect(result.ok).toBe(false);
    expect(result.added).toContain("deloitte");
  });

  it("refuses a month the seller did not write, even without a digit", () => {
    const original =
      "We have since checked every listing against the policy and removed the ones that did not comply.";
    const rewrite =
      "In October we checked every listing against the policy and removed the ones that did not comply.";
    expect(checkWordingLock(original, rewrite).added).toContain("october");
  });

  it("allows Amazon's own names and a capital at the start of a sentence", () => {
    const original =
      "we read the policy in seller central and checked account health every day since then.";
    const rewrite =
      "We read the policy in Seller Central. Since then we have checked Account Health every day.";
    expect(checkWordingLock(original, rewrite).ok).toBe(true);
  });

  it("refuses an email or web address the seller did not give", () => {
    const original = "We now keep every supplier invoice in one shared folder and check it weekly.";
    const rewrite =
      "We now keep every supplier invoice in one shared folder at docs.example.com and check it weekly.";
    expect(checkWordingLock(original, rewrite).ok).toBe(false);
  });
});

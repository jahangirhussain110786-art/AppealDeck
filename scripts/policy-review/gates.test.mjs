import { describe, expect, it } from "vitest";
import { validateProposal, wordCount, numericClaims } from "./gates.mjs";

const REPORT_TEXT = `# Policy watch — 2026-11-04

### Selling Partner API changelog (changed)

1 new item(s):

- [October 2026 SP-API Release](https://developer-docs.amazon.com/sp-api/changelog/a) — Wed, 28 Oct 2026

The referral fee for the Home category changes from 15% to 12% on 1 January 2027.
Fulfilment fees for small standard-size units are unchanged this quarter.

Source: https://developer-docs.amazon.com/sp-api/changelog.rss`;

const URLS = [
  "https://developer-docs.amazon.com/sp-api/changelog.rss",
  "https://developer-docs.amazon.com/sp-api/changelog/a",
];

const valid = {
  relevant: true,
  confidence: 0.91,
  category: "fee",
  what_changed: "Amazon changed the referral fee for the Home category from 15% to 12%.",
  seller_impact: "Sellers in that category should check the fee line on their settled orders.",
  areas: ["policy_brief"],
  sources: ["https://developer-docs.amazon.com/sp-api/changelog/a"],
  quoted: ["the Home category changes from 15% to 12%"],
  next_check: "Confirm the effective date on the release note before changing any copy.",
};

const context = { reportText: REPORT_TEXT, reportUrls: URLS };

describe("proposal gates", () => {
  it("accepts a faithful answer with a verbatim quote", () => {
    const verdict = validateProposal(valid, context);
    expect(verdict.errors).toEqual([]);
    expect(verdict.status).toBe("ready");
  });

  it("marks a low-confidence answer for a careful read instead of rejecting it", () => {
    const verdict = validateProposal({ ...valid, confidence: 0.62 }, context);
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe("needs-review");
  });

  it("rejects a quote the report never contained", () => {
    const verdict = validateProposal(
      { ...valid, quoted: ["Amazon will reinstate suspended accounts within seven days"] },
      context,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.errors.join(" ")).toContain("does not appear");
  });

  it("rejects a quote longer than twenty words", () => {
    const longQuote =
      "the Home category changes from 15% to 12% and fulfilment fees for small standard size units are unchanged this quarter and will remain so";
    expect(wordCount(longQuote)).toBeGreaterThan(20);
    const verdict = validateProposal({ ...valid, quoted: [longQuote] }, context);
    expect(verdict.errors.join(" ")).toContain("words (limit 20)");
  });

  it("rejects a source that was not in today's report", () => {
    const verdict = validateProposal(
      { ...valid, sources: ["https://example.com/invented"] },
      context,
    );
    expect(verdict.errors.join(" ")).toContain("not in today's report");
  });

  it("rejects a figure the report does not contain", () => {
    const verdict = validateProposal(
      { ...valid, what_changed: "Amazon raised the referral fee for the Home category to 20%." },
      context,
    );
    expect(verdict.errors.join(" ")).toContain("20%");
  });

  it("accepts a figure when the report states it", () => {
    expect(numericClaims("from 15% to 12%")).toEqual(["15%", "12%"]);
    expect(validateProposal(valid, context).errors).toEqual([]);
  });

  it("treats corporate news as not relevant, without failing the checks", () => {
    const verdict = validateProposal(
      {
        ...valid,
        relevant: false,
        category: "corporate",
        areas: ["none"],
        what_changed: "Amazon announced a pro bono legal programme.",
      },
      context,
    );
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe("not-relevant");
  });

  it("rejects a relevant answer that names no area", () => {
    const verdict = validateProposal({ ...valid, areas: [] }, context);
    expect(verdict.errors.join(" ")).toContain("at least one area");
  });

  it("rejects an area that is not a surface we have", () => {
    const verdict = validateProposal({ ...valid, areas: ["homepage-hero"] }, context);
    expect(verdict.errors.join(" ")).toContain("areas must be a list");
  });

  it("rejects a non-object answer", () => {
    const verdict = validateProposal("yes, relevant", context);
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe("invalid");
  });
});

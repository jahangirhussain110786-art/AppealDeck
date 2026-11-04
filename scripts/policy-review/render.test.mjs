import { describe, expect, it } from "vitest";
import { renderProposal } from "./render.mjs";
import { validateProposal } from "./gates.mjs";

const REPORT = {
  day: "2026-11-04",
  sources: [],
};

const REPORT_TEXT = `- [October 2026 SP-API Release](https://developer-docs.amazon.com/sp-api/changelog/a)
The referral fee for the Home category changes from 15% to 12% on 1 January 2027.`;

const context = {
  reportText: REPORT_TEXT,
  reportUrls: ["https://developer-docs.amazon.com/sp-api/changelog/a"],
};

const answer = {
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

describe("proposal rendering", () => {
  it("says the checks ran even when nothing was proposed", () => {
    const notRelevant = {
      ...answer,
      relevant: false,
      category: "corporate",
      areas: ["none"],
      what_changed: "Amazon announced a pro bono legal programme.",
      sources: [],
      quoted: [],
    };
    const verdict = validateProposal(notRelevant, context);
    const body = renderProposal({ report: REPORT, answer: notRelevant, verdict, model: "groq/x" });

    expect(body).toContain("Why it was classified this way: Amazon announced a pro bono");
    expect(body).toContain("No check failed");
    // A heading followed by nothing reads as a broken template.
    expect(body).not.toMatch(/## Checks\n\n---/);
  });

  it("names the file a ready proposal would land in", () => {
    const verdict = validateProposal(answer, context);
    const body = renderProposal({ report: REPORT, answer, verdict, model: "groq/x" });

    expect(verdict.status).toBe("ready");
    expect(body).toContain("READY for review");
    expect(body).toContain("src/core/policyBrief.ts");
    expect(body).toContain("Nothing in `src/` changed");
  });

  it("prints the failure that rejected an answer instead of the answer", () => {
    const bad = { ...answer, quoted: ["Amazon will reinstate accounts within seven days"] };
    const verdict = validateProposal(bad, context);
    const body = renderProposal({ report: REPORT, answer: bad, verdict, model: "groq/x" });

    expect(verdict.status).toBe("invalid");
    expect(body).toContain("## Failed checks");
    expect(body).toContain("does not appear");
    expect(body).not.toContain("## What changed");
  });
});

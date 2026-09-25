import { describe, expect, it } from "vitest";
import { replyCriticisms } from "./replyFeedback";
import { REPLY_FIXTURES } from "./replyFixtures";

describe("replyCriticisms", () => {
  it("quotes what Amazon says was wrong, word for word", () => {
    const reply =
      "Hello, we reviewed your Plan of Action. We are unable to reinstate your account at this time. Your plan does not explain the root cause. Please also provide invoices dated within the last 365 days.";
    expect(replyCriticisms(reply)).toEqual(["Your plan does not explain the root cause."]);
  });

  it("never quotes the seller's own words back as Amazon's criticism", () => {
    const reply =
      'You wrote: "we did not check the listing". We are unable to reinstate your account. The invoices you sent do not show a completed purchase.';
    expect(replyCriticisms(reply)).toEqual([
      "The invoices you sent do not show a completed purchase.",
    ]);
  });

  it("returns nothing for a reinstatement", () => {
    const reinstated = REPLY_FIXTURES.filter((f) => f.expected.category === "reinstated");
    for (const f of reinstated) expect(replyCriticisms(f.raw), f.id).toEqual([]);
  });

  it("every quote is a real substring of the reply", () => {
    for (const f of REPLY_FIXTURES) {
      const flat = f.raw.replace(/\s+/g, " ");
      for (const q of replyCriticisms(f.raw)) expect(flat, f.id).toContain(q);
    }
  });
});

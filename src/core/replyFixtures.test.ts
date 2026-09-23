import { describe, expect, it } from "vitest";
import { REPLY_FIXTURES } from "./replyFixtures";
import { analyzeReply } from "./responseAnalyzer";
import type { ReplyCategory } from "./caseState";

/**
 * B-02. The analyser decides what an Amazon reply means, and the workspace acts on that decision —
 * it feeds the reply delta, which carries a seller's evidence review forward or reopens it. Before
 * this corpus it had one inline example per category and no adversarial case at all.
 */
describe("reply fixture corpus", () => {
  it("has no duplicate ids and real text in every fixture", () => {
    expect(new Set(REPLY_FIXTURES.map((f) => f.id)).size).toBe(REPLY_FIXTURES.length);
    for (const f of REPLY_FIXTURES) {
      expect(f.raw.trim().length).toBeGreaterThan(40);
      expect(f.source.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers every analyser category with at least two replies", () => {
    const categories: ReplyCategory[] = [
      "reinstated",
      "final_decision_negative",
      "identity_verification",
      "document_request",
      "needs_more_information",
      "funds_decision",
      "unrecognized",
    ];
    for (const c of categories) {
      const count = REPLY_FIXTURES.filter((f) => f.expected.category === c).length;
      expect(count, `category ${c} has only ${count} fixtures`).toBeGreaterThanOrEqual(2);
    }
  });

  it("includes the adversarial case the spec names by hand", () => {
    const traps = REPLY_FIXTURES.filter((f) => f.adversarial);
    expect(traps.length).toBeGreaterThanOrEqual(1);
    for (const t of traps) expect(t.adversarial!.trim().length).toBeGreaterThan(0);
  });

  it("classifies every reply as expected, and pulls out the evidence asked for", () => {
    for (const f of REPLY_FIXTURES) {
      const result = analyzeReply(f.raw);
      expect(result.category, `${f.id} classified as ${result.category}`).toBe(f.expected.category);
      if (f.expected.extractedAsks) {
        expect(result.extractedAsks, f.id).toEqual(f.expected.extractedAsks);
      }
    }
  });

  it("never reports a reinstatement from a message that also refuses", () => {
    // The direction that matters. Being cautious about a genuine reinstatement costs a seller a
    // moment's doubt; reporting a reinstatement that did not happen sends someone back to selling
    // on a deactivated account and stops them answering while their window runs out.
    for (const f of REPLY_FIXTURES.filter((f) => f.adversarial)) {
      expect(analyzeReply(f.raw).category).not.toBe("reinstated");
    }
  });
});

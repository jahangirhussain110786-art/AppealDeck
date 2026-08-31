import { describe, it, expect } from "vitest";
import { FIXTURES, FIXTURE_KINDS, type FixtureExpected } from "./fixtures";
import { isSeverityGated } from "./index";

const validKinds = new Set<string>([
  "INAUTHENTIC_DOCUMENTS",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  "UNKNOWN",
]);

describe("fixture corpus", () => {
  it("has no duplicate fixture ids", () => {
    const ids = new Set(FIXTURES.map((f) => f.id));
    expect(ids.size).toBe(FIXTURES.length);
  });

  it("every fixture has non-empty raw text and a valid expected kind", () => {
    for (const f of FIXTURES) {
      expect(f.raw.trim().length).toBeGreaterThan(20);
      expect(validKinds.has(f.expected.kind)).toBe(true);
    }
  });

  it("severity-gating flag is consistent with the core rule", () => {
    for (const f of FIXTURES) {
      expect(f.expected.severityGated).toBe(isSeverityGated(f.expected.kind));
    }
  });

  it("funds fixtures carry the corrected 60/90-day model, others do not", () => {
    for (const f of FIXTURES) {
      const e: FixtureExpected = f.expected;
      if (f.kind === "FUNDS") {
        expect(e.fundsAppealEligibleDays).toBe(60);
        expect(e.fundsReviewDays).toBe(90);
      } else {
        expect(e.fundsAppealEligibleDays).toBeNull();
        expect(e.fundsReviewDays).toBeNull();
      }
    }
  });

  it("covers every required violation kind with >=4 fixtures each (B-03 / M-3 gate)", () => {
    for (const k of FIXTURE_KINDS) {
      const count = FIXTURES.filter((f) => f.kind === k).length;
      expect(count, `violation kind ${k} has only ${count} fixtures`).toBeGreaterThanOrEqual(4);
    }
  });
});

import { describe, it, expect } from "vitest";
import { assessNoticeLikeness } from "../noticeLikeness";
import { FIXTURES } from "@/core/fixtures";

describe("noticeLikeness", () => {
  it("scores every stored non-adversarial fixture at least 2", () => {
    for (const f of FIXTURES) {
      if (f.id.startsWith("adversarial-")) continue;
      const r = assessNoticeLikeness(f.raw);
      expect(r.score).toBeGreaterThanOrEqual(2);
    }
  });

  it("returns no hint once it looks enough like a notice", () => {
    const fixture = FIXTURES.find((f) => f.id === "policy-1")!.raw;
    expect(assessNoticeLikeness(fixture).hint).toBeNull();
  });

  it("scores short / off-topic text below 2 with a hint", () => {
    const r = assessNoticeLikeness("hi");
    expect(r.score).toBeLessThan(2);
    expect(r.hint).not.toBeNull();
  });

  it("scores a short Amazon-looking snippet as ≤1 with a hint", () => {
    const r = assessNoticeLikeness("Amazon account notice.");
    expect(r.score).toBeLessThan(2);
    expect(r.hint).not.toBeNull();
  });

  it("scores a long but Amazon-less string as 2 with a hint", () => {
    const blob = "a".repeat(500);
    const r = assessNoticeLikeness(blob);
    expect(r.score).toBe(2);
    expect(r.hint).not.toBeNull();
  });
});

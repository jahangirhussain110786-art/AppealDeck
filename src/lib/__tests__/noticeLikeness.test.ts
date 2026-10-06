import { describe, it, expect } from "vitest";
import { assessNoticeLikeness, noticeMarkerHits } from "../noticeLikeness";
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

  it("counts the phrases a short genuine notice carries (6 Oct 2026)", () => {
    const short =
      "To verify your identity, enter the verification code we sent to your phone. Upload a government-issued ID within 7 days.";
    expect(noticeMarkerHits(short)).toBeGreaterThanOrEqual(2);
    for (const phrase of [
      "Please submit a Plan of Action covering the root cause for your seller account.",
      "We will reinstate your listings once your appeal is reviewed.",
    ]) {
      expect(noticeMarkerHits(phrase), phrase).toBeGreaterThanOrEqual(2);
    }
    expect(noticeMarkerHits("Please review this and get back to me when you can.")).toBeLessThan(2);
  });

  it("scores a long but Amazon-less string as 2 with a hint", () => {
    const blob = "a".repeat(500);
    const r = assessNoticeLikeness(blob);
    expect(r.score).toBe(2);
    expect(r.hint).not.toBeNull();
  });
});

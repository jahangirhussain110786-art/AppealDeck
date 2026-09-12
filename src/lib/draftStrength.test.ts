import { describe, it, expect } from "vitest";
import { computeDraftStrength } from "./draftStrength";
import type { ComposerMode, CriticFinding } from "@/core";

const fullDraft: ComposerMode = { mode: "full-draft", reason: "complete" };
const gapDraft: ComposerMode = { mode: "gap-draft", reason: "incomplete", gapReason: "narrative" };

function finding(severity: CriticFinding["severity"]): CriticFinding {
  return { severity, code: "TEST", message: "test" };
}

describe("computeDraftStrength", () => {
  it("is weak whenever the draft is a gap draft, regardless of findings", () => {
    expect(computeDraftStrength(gapDraft, [])).toBe("weak");
  });

  it("is weak when any finding is an error, even on a full draft", () => {
    expect(computeDraftStrength(fullDraft, [finding("error")])).toBe("weak");
  });

  it("is needs_work when the worst finding is a warning", () => {
    expect(computeDraftStrength(fullDraft, [finding("info"), finding("warning")])).toBe(
      "needs_work",
    );
  });

  it("is strong on a full draft with no findings", () => {
    expect(computeDraftStrength(fullDraft, [])).toBe("strong");
  });

  it("is strong on a full draft with only info-level findings", () => {
    expect(computeDraftStrength(fullDraft, [finding("info")])).toBe("strong");
  });
});

import { describe, it, expect } from "vitest";
import { computeDraftStrength, DRAFT_STRENGTH_TONE } from "./draftStrength";
import { WORKSPACE } from "@/content/workspace";
import type { ComposerMode, CriticFinding } from "@/core";

const fullDraft: ComposerMode = { mode: "full-draft", reason: "complete" };
const gapDraft: ComposerMode = { mode: "gap-draft", reason: "incomplete", gapReason: "narrative" };

function finding(severity: CriticFinding["severity"]): CriticFinding {
  return { severity, code: "TEST", message: "test" };
}

describe("computeDraftStrength", () => {
  it("is weak whenever the writing is part of what is unfinished, regardless of findings", () => {
    expect(computeDraftStrength(gapDraft, [])).toBe("weak");
    expect(computeDraftStrength({ ...gapDraft, gapReason: "both" }, [])).toBe("weak");
    // A gap draft that does not say why is treated as the writing's, as before.
    expect(computeDraftStrength({ mode: "gap-draft", reason: "incomplete" }, [])).toBe("weak");
  });

  it("judges the writing on its findings when only a record or a tick is outstanding", () => {
    const evidenceOnly: ComposerMode = { ...gapDraft, gapReason: "evidence" };
    expect(computeDraftStrength(evidenceOnly, [])).toBe("strong");
    expect(computeDraftStrength(evidenceOnly, [finding("warning")])).toBe("needs_work");
    expect(computeDraftStrength(evidenceOnly, [finding("error")])).toBe("weak");
    // The critic restates the missing record as a warning; that is the gap, not the writing.
    const restated: CriticFinding = {
      severity: "warning",
      code: "WORKSPACE_GAP",
      message: "Add the file",
    };
    expect(computeDraftStrength(evidenceOnly, [restated])).toBe("strong");
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

  // Wiring this into ResponseReview on 23 Sep 2026 (A-07) is the whole point: it was built,
  // tested and unreachable for eleven days while the founder's original complaint stayed live in
  // the product. These two pin the render path so a level cannot be added without copy or a tone.
  it("gives every level a tone", () => {
    for (const level of ["strong", "needs_work", "weak"] as const) {
      expect(DRAFT_STRENGTH_TONE[level]).toBeTruthy();
    }
  });

  it("gives every level copy that states nothing about Amazon's decision", () => {
    for (const level of ["strong", "needs_work", "weak"] as const) {
      const copy = WORKSPACE.draftStrength[level];
      expect(copy.length).toBeGreaterThan(0);
      expect(copy).not.toMatch(/amazon|approv|reject|accept|likel|chance|odds/i);
    }
  });
});

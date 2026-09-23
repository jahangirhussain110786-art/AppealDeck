import { describe, it, expect } from "vitest";
import { createCaseFile } from "./caseFile";

/**
 * Carried over from `interviewEngine.test.ts` when that module was deleted on 23 Sep 2026 (A-04).
 * The other 26 tests in that file covered the step engine — `nextStep`, `applyAnswer`,
 * `interviewProgress` — which had no caller after the classic interview was retired and went with
 * it. These three never tested the interview at all; they test the case record every surface reads,
 * so deleting them alongside the surface they happened to share a file with would have dropped real
 * coverage silently. Same reasoning as the three e2e specs rewritten rather than deleted on 22 Sep.
 */
describe("createCaseFile", () => {
  it("creates a file in DECODED state with action items for the kind", () => {
    const file = createCaseFile("POLICY");
    expect(file.state).toBe("DECODED");
    expect(file.kind).toBe("POLICY");
    expect(file.actionItems.length).toBeGreaterThan(0);
    expect(file.timelineEvents).toEqual([]);
    expect(file.priorAppealCount).toBe(0);
  });

  // 14 Sep 2026 multi-case fix: every case now needs a real, permanent identity.
  it("assigns a real id and creation timestamp", () => {
    const file = createCaseFile("POLICY");
    expect(file.id).toBeTruthy();
    expect(typeof file.id).toBe("string");
    expect(file.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("assigns a different id to each new case", () => {
    const a = createCaseFile("POLICY");
    const b = createCaseFile("POLICY");
    expect(a.id).not.toBe(b.id);
  });
});

import { describe, expect, it } from "vitest";
import { KIND_GUIDANCE } from "./guidance";

// G-12 and G-14 (12 Oct 2026): the do-not cards say what a seller in panic is most likely to do
// wrong next: hand a helper the login, and send the same text again.
describe("do-not cards", () => {
  const kinds = Object.entries(KIND_GUIDANCE);

  it("tell the seller to give a helper their own User Permissions account, not the login", () => {
    for (const [kind, g] of kinds) {
      const line = g.triage.doNot.find((l) => /Seller Central login/.test(l));
      expect(line, kind).toBeTruthy();
      expect(line, kind).toMatch(/User Permissions/);
      expect(g.triage.doNot.join(" "), kind).not.toMatch(/credentials/i);
    }
  });

  it("warn against resending the same text on every kind that is answered by an appeal", () => {
    for (const [kind, g] of kinds) {
      const has = g.triage.doNot.some((l) => /resubmit the same text/i.test(l));
      // A verification notice is not an appeal, so "resubmit" is the wrong instruction there.
      if (kind === "VERIFICATION") expect(has, kind).toBe(false);
      else if (g.triage.doNot.some((l) => /hurried one-line appeal/.test(l)))
        expect(has, kind).toBe(true);
    }
  });
});

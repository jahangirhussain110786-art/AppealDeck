import { describe, expect, it } from "vitest";
import { workspaceGaps } from "./workspace";
import { documentWorkspace } from "./workspace.fixture";

/**
 * 25 Sep 2026: with a saved, unread Amazon reply, the case and the dashboard (which shows only the
 * first gap) still led with "Review Supplier invoice". The reply changes what everything else
 * means, so it comes first.
 */
describe("an unread Amazon reply comes first", () => {
  it("puts the reply ahead of every other open item", () => {
    const w = documentWorkspace();
    const withReply = {
      ...w,
      replies: [
        {
          id: "r1",
          text: "We are unable to reinstate your account.",
          receivedAt: "2026-09-25",
          applied: false,
        },
      ],
    } as unknown as typeof w;
    const gaps = workspaceGaps(withReply);
    expect(gaps[0]).toMatch(/^Amazon replied/);
    expect(gaps.filter((g) => /^Amazon replied/.test(g))).toHaveLength(1);
  });

  it("says nothing about a reply once it has been used for the next round", () => {
    const w = documentWorkspace();
    const applied = {
      ...w,
      replies: [{ id: "r1", text: "x", receivedAt: "2026-09-25", applied: true }],
    } as unknown as typeof w;
    expect(workspaceGaps(applied).some((g) => /^Amazon replied/.test(g))).toBe(false);
  });
});

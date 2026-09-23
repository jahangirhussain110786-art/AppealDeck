import { describe, it, expect } from "vitest";
import { computeDeadlines, serializeDeadlines } from "./deadlinesModel";
import type { Deadline } from "./deadlinesModel";
import { parseNotice } from "./noticeParser";

describe("serializeDeadlines", () => {
  it("converts a real due date to an ISO string", () => {
    const dueAt = new Date("2026-09-20T00:00:00.000Z");
    const deadlines: Deadline[] = [
      { kind: "appeal_window", dueAt, label: "Appeal window: 3 days from notice" },
    ];
    const serialized = serializeDeadlines(deadlines);
    expect(serialized).toEqual([
      {
        kind: "appeal_window",
        dueAt: "2026-09-20T00:00:00.000Z",
        label: "Appeal window: 3 days from notice",
      },
    ]);
  });

  it("keeps a null due date as null rather than a string", () => {
    const deadlines: Deadline[] = [
      { kind: "appeal_window", dueAt: null, label: "Appeal window ambiguous" },
    ];
    expect(serializeDeadlines(deadlines)[0].dueAt).toBeNull();
  });

  it("carries isIndefinite through unchanged", () => {
    const deadlines: Deadline[] = [
      { kind: "indefinite_hold", dueAt: null, label: "No countdown", isIndefinite: true },
    ];
    expect(serializeDeadlines(deadlines)[0].isIndefinite).toBe(true);
  });

  it("returns an empty array for no deadlines", () => {
    expect(serializeDeadlines([])).toEqual([]);
  });
});

describe("computeDeadlines", () => {
  /**
   * The previous version of this test was called "replaces the stated appeal window with an
   * indefinite-hold entry", and its notice said *"some of your items are not authentic. Submit your
   * appeal within 17 days."* It asserted that the 17 days were thrown away and the seller shown
   * "No fixed appeal window" instead.
   *
   * Two errors in one: that notice is an ordinary authenticity complaint rather than an allegation
   * of falsified records, and even on a genuinely gated case the window is a fact stated in
   * Amazon's own notice. Deleting it is the one thing here that could actually cost someone their
   * account, because the window is the part of a deactivation that expires.
   *
   * `computeDeadlines` no longer consults severity at all.
   */
  it("keeps a stated appeal window whatever the violation kind", () => {
    const parsed = parseNotice(
      "Your account has been deactivated because we received a report that some of your items are not authentic. Submit your appeal within 17 days.",
    );
    for (const kind of ["INAUTHENTIC", "INAUTHENTIC_DOCUMENTS", "POLICY"] as const) {
      const deadlines = computeDeadlines({
        noticeReceivedAt: new Date("2026-09-19T00:00:00.000Z"),
        parsed,
        kind,
      });
      const window = deadlines.find((d) => d.kind === "appeal_window");
      expect(window?.dueAt?.toISOString().slice(0, 10), kind).toBe("2026-10-06");
      expect(
        deadlines.find((d) => d.kind === "indefinite_hold"),
        kind,
      ).toBeUndefined();
    }
  });

  it("still computes a normal appeal-window deadline for every other kind", () => {
    const parsed = parseNotice(
      "Your account has been deactivated. Submit your appeal within 17 days.",
    );
    const deadlines = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-19T00:00:00.000Z"),
      parsed,
      kind: "POLICY",
    });
    expect(deadlines.some((d) => d.kind === "indefinite_hold")).toBe(false);
    expect(deadlines[0].kind).toBe("appeal_window");
  });
});

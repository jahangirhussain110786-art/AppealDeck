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
  it("replaces the stated appeal window with an indefinite-hold entry for inauthentic-documents cases", () => {
    const parsed = parseNotice(
      "Your account has been deactivated because we received a report that some of your items are not authentic. Submit your appeal within 17 days.",
    );
    const deadlines = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-19T00:00:00.000Z"),
      parsed,
      kind: "INAUTHENTIC_DOCUMENTS",
    });
    expect(deadlines).toEqual([
      {
        kind: "indefinite_hold",
        dueAt: null,
        label: "No fixed appeal window — routed to professional help",
        isIndefinite: true,
      },
    ]);
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

import { describe, it, expect } from "vitest";
import { serializeDeadlines } from "./deadlinesModel";
import type { Deadline } from "./deadlinesModel";

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

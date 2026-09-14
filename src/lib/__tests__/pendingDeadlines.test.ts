import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { stashPendingDeadlines, consumePendingDeadlines } from "@/lib/pendingDeadlines";
import type { DeadlineLike } from "@/components/DeadlineChip";

const SAMPLE: DeadlineLike[] = [
  { kind: "appeal_window", dueAt: "2026-09-20T00:00:00.000Z", label: "Appeal window" },
];

/**
 * This project's default vitest environment is "node" (no DOM, no jsdom dependency) — the
 * function under test already guards `typeof window === "undefined"` for exactly that reason
 * (SSR safety). A minimal in-memory sessionStorage stand-in exercises the real stash/consume
 * logic without pulling in a DOM environment for one small module.
 */
function makeMemorySessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("pendingDeadlines", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    (globalThis as { window?: { sessionStorage: Storage } }).window = {
      sessionStorage: makeMemorySessionStorage(),
    };
  });

  afterEach(() => {
    (globalThis as { window?: typeof originalWindow }).window = originalWindow;
  });

  it("round-trips deadlines stashed at decode time to the case-creation step", () => {
    stashPendingDeadlines(SAMPLE);
    expect(consumePendingDeadlines()).toEqual(SAMPLE);
  });

  it("is one-shot — a second consume finds nothing left", () => {
    stashPendingDeadlines(SAMPLE);
    consumePendingDeadlines();
    expect(consumePendingDeadlines()).toBeUndefined();
  });

  it("returns undefined when nothing was ever stashed", () => {
    expect(consumePendingDeadlines()).toBeUndefined();
  });

  it("normalizes a Date instance to an ISO string before storing", () => {
    const withDate: DeadlineLike[] = [
      {
        kind: "appeal_window",
        dueAt: new Date("2026-09-20T00:00:00.000Z"),
        label: "Appeal window",
      },
    ];
    stashPendingDeadlines(withDate);
    expect(consumePendingDeadlines()).toEqual(SAMPLE);
  });

  it("does not write anything for an empty deadline list", () => {
    stashPendingDeadlines([]);
    expect(consumePendingDeadlines()).toBeUndefined();
  });

  it("no-ops without throwing when window is unavailable (SSR)", () => {
    (globalThis as { window?: unknown }).window = undefined;
    expect(() => stashPendingDeadlines(SAMPLE)).not.toThrow();
    expect(consumePendingDeadlines()).toBeUndefined();
  });
});

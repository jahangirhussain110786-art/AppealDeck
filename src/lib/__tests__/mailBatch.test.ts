import { describe, expect, it } from "vitest";
import { runBatch } from "../mailBatch";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 5));

describe("runBatch", () => {
  it("handles every item", async () => {
    const seen: number[] = [];
    const r = await runBatch(
      [1, 2, 3, 4, 5, 6, 7],
      async (n) => {
        await tick();
        seen.push(n);
      },
      { deadline: Infinity },
    );
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(r).toEqual({ started: 7, unreached: 0 });
  });

  it("never has more than the allowed number in flight, and does use that many", async () => {
    let inFlight = 0;
    let peak = 0;
    await runBatch(
      Array.from({ length: 12 }, (_, i) => i),
      async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await tick();
        inFlight--;
      },
      { deadline: Infinity, concurrency: 3 },
    );
    expect(peak).toBe(3);
  });

  it("starts nothing new once the deadline has passed, and reports what it left", async () => {
    let clock = 0;
    const handled: number[] = [];
    const r = await runBatch(
      [1, 2, 3, 4, 5],
      async (n) => {
        handled.push(n);
        clock += 10;
      },
      { deadline: 25, concurrency: 1, now: () => clock },
    );
    expect(handled).toEqual([1, 2, 3]);
    expect(r).toEqual({ started: 3, unreached: 2 });
  });

  it("lets items already started finish after the deadline", async () => {
    let clock = 0;
    let finished = 0;
    await runBatch(
      [1, 2],
      async () => {
        await tick();
        clock = 100;
        finished++;
      },
      { deadline: 50, concurrency: 2, now: () => clock },
    );
    expect(finished).toBe(2);
  });

  it("copes with no items", async () => {
    expect(await runBatch([], async () => undefined, { deadline: Infinity })).toEqual({
      started: 0,
      unreached: 0,
    });
  });
});

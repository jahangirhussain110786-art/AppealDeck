import { describe, expect, it } from "vitest";
import { checkWordingLock } from "./wordingLock";

/**
 * 8 Oct 2026. The lock counted negation words, so swapping one for another passed. These are the
 * swaps that change what the seller is admitting.
 */
const ORIGINAL =
  "Our supplier shipped 240 units. We have never sold used items and we audit every batch.";

describe("polarity and strength changes", () => {
  it("refuses 'never sold' turned into 'no longer sell', which admits past sales", () => {
    const r = checkWordingLock(
      ORIGINAL,
      "Our supplier shipped 240 units. We no longer sell used items and we audit every batch.",
    );
    expect(r.ok).toBe(false);
    expect(r.added).toContain("a change over time");
  });

  it("refuses 'never' dropped for another negation word", () => {
    const r = checkWordingLock(
      ORIGINAL,
      "Our supplier shipped 240 units. We have not sold used items and we audit every batch.",
    );
    expect(r.ok).toBe(false);
    expect(r.dropped).toContain("never");
  });

  it("refuses an added absolute claim", () => {
    const r = checkWordingLock(
      ORIGINAL,
      "Our supplier shipped 240 units. We have never sold used items and we always audit every batch.",
    );
    expect(r.ok).toBe(false);
    expect(r.added).toContain("an absolute claim");
  });

  it("still accepts the same sentence unchanged", () => {
    expect(checkWordingLock(ORIGINAL, ORIGINAL).ok).toBe(true);
  });

  it("accepts a harmless reordering that keeps every marker", () => {
    expect(
      checkWordingLock(
        ORIGINAL,
        "We have never sold used items, we audit every batch, and our supplier shipped 240 units.",
      ).ok,
    ).toBe(true);
  });
});

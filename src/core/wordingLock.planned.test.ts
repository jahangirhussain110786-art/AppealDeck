import { describe, expect, it } from "vitest";
import { checkWordingLock } from "./wordingLock";

describe("wording lock: planned becomes done", () => {
  it("rejects going to / about to turned into past tense", () => {
    const r = checkWordingLock(
      "We are going to retrain our staff next quarter and are about to update the listing template.",
      "We retrained our staff and updated the listing template.",
    );
    expect(r.ok).toBe(false);
  });
  it("rejects would ... if turned into a present claim", () => {
    const r = checkWordingLock(
      "We would retrain staff if Amazon reinstates us.",
      "We retrain staff.",
    );
    expect(r.ok).toBe(false);
  });
  it("rejects in the process of turned into done", () => {
    const r = checkWordingLock(
      "We are in the process of replacing the supplier.",
      "We replaced the supplier.",
    );
    expect(r.ok).toBe(false);
  });
  it("accepts a rewrite that keeps the planning language", () => {
    const r = checkWordingLock(
      "We are going to replace the supplier next month.",
      "Next month we are going to replace the supplier.",
    );
    expect(r.ok).toBe(true);
  });
});

describe("wording lock: numbers", () => {
  it("treats spelled-out numbers as facts", () => {
    const r = checkWordingLock(
      "We removed ten listings from the catalogue.",
      "We removed twelve listings from the catalogue.",
    );
    expect(r.ok).toBe(false);
    expect(r.added).toContain("twelve");
    expect(r.dropped).toContain("ten");
  });
  it("treats 1,000 and 1000 as the same number", () => {
    expect(
      checkWordingLock("We shipped 1,000 units in May.", "In May we shipped 1000 units.").ok,
    ).toBe(true);
    expect(
      checkWordingLock("We shipped 1000 units in May.", "In May we shipped 1,000 units.").ok,
    ).toBe(true);
  });
  it("still rejects a changed number with a thousands separator", () => {
    expect(checkWordingLock("We shipped 1,000 units.", "We shipped 1,200 units.").ok).toBe(false);
  });
});

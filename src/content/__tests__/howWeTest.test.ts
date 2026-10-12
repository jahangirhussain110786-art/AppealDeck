import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { HOW_WE_TEST } from "../howWeTest";

// G-45 and G-80 (12 Oct 2026). The page makes claims about measured misses and publishes a corpus;
// these keep it honest and keep the published file the same as the one in the repo's own reports.
const everything = JSON.stringify(HOW_WE_TEST);

describe("how we test", () => {
  it("never calls anything about Amazon's decision accurate, and gives no success rate", () => {
    expect(everything).not.toMatch(/accura/i);
    expect(everything).not.toMatch(/win rate|\d+\s?%/i);
    expect(everything).not.toMatch(/guarantee/i);
  });

  it("states the counts it is built on, with their denominators and dates", () => {
    expect(everything).toContain("5 of 12");
    expect(everything).toContain("12 of 12");
    expect(everything).toContain("2 to 4");
    expect(everything).toContain("29 Sep 2026");
    expect(everything).toContain("9 Oct 2026");
  });

  it("publishes the same thirteen notices the report was written about, and no engine code", () => {
    const source = path.join(process.cwd(), "docs/handoffs/2026-09-29-test-notices/notices.json");
    const published = path.join(process.cwd(), "public", HOW_WE_TEST.corpus.file);
    expect(fs.readFileSync(published, "utf8")).toBe(fs.readFileSync(source, "utf8"));
    const notices = JSON.parse(fs.readFileSync(published, "utf8")) as Array<{
      id: string;
      text: string;
      expected: unknown;
    }>;
    expect(notices).toHaveLength(13);
    for (const n of notices) {
      expect(n.text.length).toBeGreaterThan(40);
      expect(n.expected).toBeTruthy();
    }
  });
});

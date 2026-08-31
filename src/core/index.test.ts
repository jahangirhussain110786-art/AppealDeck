import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CORE_VERSION, isSeverityGated } from "./index";

describe("core seed", () => {
  it("exposes a semver core version", () => {
    expect(CORE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("flags inauthentic-document cases as severity-gated", () => {
    expect(isSeverityGated("INAUTHENTIC_DOCUMENTS")).toBe(true);
    expect(isSeverityGated("POLICY")).toBe(false);
  });
});

describe("ethics spine D6 (guard)", () => {
  it("never uses the word 'guarantee' anywhere in src/core", () => {
    const dir = __dirname;
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(join(dir, f), "utf8");
      if (/\bguarantee\b/i.test(text)) hits.push(f);
    }
    expect(hits, `forbidden 'guarantee' found in: ${hits.join(", ")}`).toEqual([]);
  });
});

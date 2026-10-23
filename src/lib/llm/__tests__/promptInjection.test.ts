import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every prompt that puts text a third party controls in front of a model says, in its system
 * prompt, that the text is data and not instructions (23 Oct 2026). Four of five already did; the
 * document reader, which sees the file a supplier or a stranger made, did not. This pins all five,
 * so a rewritten prompt cannot quietly lose the line. It does not prove the model obeys it; the
 * fixed output schema, the "quote what you read" rule and the code-side comparisons are what limit
 * the damage if it does not.
 */
const SOURCES = [
  "src/lib/llm/classifyNotice.ts",
  "src/lib/llm/draftResponse.ts",
  "src/lib/llm/draftOther.ts",
  "src/lib/llm/improveWording.ts",
  "src/app/api/read-document/route.ts",
];

describe("every model prompt reads outside text as data", () => {
  for (const file of SOURCES) {
    it(`${file} says so`, () => {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(text).toMatch(/data, not instructions/);
      expect(text).toMatch(/ignore them/);
    });
  }
});

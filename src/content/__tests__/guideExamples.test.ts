import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "../guides";
import { planOfActionExamples } from "../guideExamples";

describe("the Plan of Action examples", () => {
  const examples = planOfActionExamples.sections.filter((s) => s.example);

  it("is published like every other guide", () => {
    expect(GUIDES.map((g) => g.slug)).toContain("plan-of-action-examples");
  });

  it("has four worked examples, each labelled as an example and each with notes on why it works", () => {
    expect(examples).toHaveLength(4);
    for (const s of examples) {
      expect(s.example!.label).toBe("Example only");
      expect(s.example!.paragraphs.length).toBeGreaterThanOrEqual(3);
      expect(s.points!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps each of the three parts and an attachment list in every example", () => {
    for (const s of examples) {
      const text = s.example!.paragraphs.join("\n");
      expect(text, s.heading).toMatch(/Root cause\./);
      expect(text, s.heading).toMatch(/Corrective actions\./);
      expect(text, s.heading).toMatch(/Preventive measures\./);
      expect(text, s.heading).toMatch(/Attached:/);
    }
  });

  it("uses only made-up identifiers and no contact details", () => {
    const text = examples.map((s) => s.example!.paragraphs.join(" ")).join(" ");
    expect(text).toMatch(/B0EXAMPLE\d/);
    expect(text).toMatch(/C-EXAMPLE-\d+/);
    expect(text).not.toMatch(/@|https?:\/\/|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/);
  });

  it("promises no outcome", () => {
    const all = JSON.stringify(planOfActionExamples);
    expect(all).not.toMatch(/will be reinstated|guaranteed?\b/i);
    expect(all).toMatch(/do not predict what Amazon will do/);
  });

  /**
   * The examples are for people. Showing a model an example is how an example's invented details
   * end up in a real seller's appeal, so no code that talks to the AI may import them.
   */
  it("is never given to the AI that drafts a response", () => {
    const roots = ["src/lib/llm", "src/core"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name) && !entry.name.includes(".test."))
          if (/guideExamples/.test(readFileSync(full, "utf8"))) offenders.push(full);
      }
    };
    for (const r of roots) walk(join(process.cwd(), r));
    expect(offenders).toEqual([]);
  });
});

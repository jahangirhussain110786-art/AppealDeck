import { describe, expect, it } from "vitest";
import { cleanCaseLabel, labelOf, CASE_LABEL_MAX } from "../caseLabel";

describe("cleanCaseLabel (G-60)", () => {
  it("trims and collapses whitespace", () => {
    expect(cleanCaseLabel("  Acme   Co.  UK ")).toBe("Acme Co. UK");
  });

  it("turns line breaks and control characters into spaces", () => {
    expect(cleanCaseLabel("Acme\nCo\t\u0000UK")).toBe("Acme Co UK");
  });

  it("caps the length and never leaves a trailing space", () => {
    const long = `${"a".repeat(CASE_LABEL_MAX - 1)} bbb`;
    const out = cleanCaseLabel(long);
    expect(out.length).toBeLessThanOrEqual(CASE_LABEL_MAX);
    expect(out.endsWith(" ")).toBe(false);
  });

  it("keeps ordinary non-Latin text whole", () => {
    expect(cleanCaseLabel("  Zaid store — کراچی ")).toBe("Zaid store — کراچی");
  });

  it("reads a case's label, empty when it has none", () => {
    expect(labelOf({ label: " Client A " })).toBe("Client A");
    expect(labelOf({})).toBe("");
    expect(labelOf(null)).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { buildClipboardText } from "../poaClipboard";

describe("buildClipboardText", () => {
  const sections = [
    { heading: "Root Cause", body: "Counterfeit items sold." },
    { heading: "Corrective Actions", body: "Removed listings." },
    { heading: "Preventive Measures", body: "Added inspection." },
  ];

  it("includes each heading", () => {
    const result = buildClipboardText(sections, {});
    expect(result).toContain("Root Cause");
    expect(result).toContain("Corrective Actions");
    expect(result).toContain("Preventive Measures");
  });

  it("joins sections with a single blank line", () => {
    const result = buildClipboardText(sections, {});
    const blocks = result.split("\n\n");
    expect(blocks).toHaveLength(3);
  });

  it("uses body text when no edit is provided", () => {
    const result = buildClipboardText(sections, {});
    expect(result).toContain("Counterfeit items sold.");
  });

  it("uses edited text when an edit is provided", () => {
    const result = buildClipboardText(sections, { 0: "Edited root cause." });
    expect(result).toContain("Edited root cause.");
    expect(result).not.toContain("Counterfeit items sold.");
  });

  it("does not include markdown characters (#, *, _, - at start)", () => {
    const result = buildClipboardText(sections, {});
    expect(result).not.toMatch(/#|\*|_\b|^-\s/);
  });
});

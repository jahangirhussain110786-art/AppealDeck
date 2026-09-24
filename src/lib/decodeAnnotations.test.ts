import { describe, expect, it } from "vitest";
import { buildNoticeAnnotations, segmentNoticeText } from "./decodeAnnotations";
import type { AnnotationCopy } from "./decodeAnnotations";

const copy: AnnotationCopy = {
  unverifiableClaims: "Name every specific claim.",
  legacyWindow: "Confirm this window is still current.",
  ambiguousWindow: "Check your Account Health dashboard.",
  statedWindow: "Use the window written on this notice.",
  statedDeadline: "This is the last day the notice gives.",
  clearStructure: "Structure your draft around these headings.",
};

describe("buildNoticeAnnotations", () => {
  it("flags an unverifiable-authenticity phrase for an inauthentic-documents case", () => {
    const raw = "We could not verify the authenticity of your products.";
    const annotations = buildNoticeAnnotations(raw, "INAUTHENTIC", copy);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatchObject({ id: "unverifiable-claims", tag: "risky" });
    expect(raw.slice(annotations[0]!.start, annotations[0]!.end)).toBe(annotations[0]!.matchedText);
  });

  it("also flags it from the parser's own kind hints, not just the passed-in kind", () => {
    const raw = "You are offering items that are not authentic.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    expect(annotations.some((a) => a.id === "unverifiable-claims")).toBe(true);
  });

  it("flags a legacy 17-day window and takes priority over the generic stated-window match", () => {
    const raw = "You have 17 days from the date of this notice to submit a Plan of Action.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    const ids = annotations.map((a) => a.id);
    expect(ids).toContain("legacy-window");
    expect(ids).not.toContain("stated-window");
  });

  it("flags an ambiguous window when no day count is stated but the notice points at Account Health", () => {
    const raw = "Your appeal window shown in your account may vary. Please check.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    expect(annotations.some((a) => a.id === "ambiguous-window")).toBe(true);
    expect(annotations.some((a) => a.id === "stated-window")).toBe(false);
  });

  it("flags the notice's own stated window as a clear (non-risky) fact", () => {
    const raw = "Submit your appeal within 90 days.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    const stated = annotations.find((a) => a.id === "stated-window");
    expect(stated).toMatchObject({
      tag: "clear",
      matchedText: expect.stringMatching(/90\s*days/i),
    });
  });

  it("points at a last day the notice states, ahead of any window reading", () => {
    const raw =
      "Your appeal window shown in your account may vary. Submit your appeal by 1 October 2026.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    const stated = annotations.find((a) => a.id === "stated-deadline");
    expect(stated).toMatchObject({ tag: "clear", matchedText: "1 October 2026" });
    expect(raw.slice(stated!.start, stated!.end)).toBe("1 October 2026");
    // The notice names its last day, so "doesn't state a fixed window" would be untrue.
    expect(annotations.some((a) => a.id === "ambiguous-window")).toBe(false);
  });

  it("flags a clear document-response structure when the notice names root cause", () => {
    const raw = "State your root cause and corrective actions.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy);
    expect(annotations.some((a) => a.id === "clear-structure" && a.tag === "clear")).toBe(true);
  });

  it("degrades to zero annotations rather than inventing one, when nothing matches", () => {
    const raw = "Please contact us for more information.";
    expect(buildNoticeAnnotations(raw, "UNKNOWN", copy)).toEqual([]);
  });

  it("never returns more than 3 annotations, sorted by position in the notice", () => {
    const raw =
      "State your root cause and corrective actions. " +
      "We could not verify the authenticity of your products. " +
      "Submit your appeal within 90 days.";
    const annotations = buildNoticeAnnotations(raw, "INAUTHENTIC", copy);
    expect(annotations.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < annotations.length; i++) {
      expect(annotations[i]!.start).toBeGreaterThanOrEqual(annotations[i - 1]!.end);
    }
  });

  it("every match is a real, exact substring of the seller's own pasted text (D6 — never invented)", () => {
    const raw =
      "We could not verify the authenticity of your products. State your root cause and corrective actions.";
    const annotations = buildNoticeAnnotations(raw, "INAUTHENTIC", copy);
    expect(annotations.length).toBeGreaterThan(0);
    for (const a of annotations) {
      expect(raw.slice(a.start, a.end)).toBe(a.matchedText);
    }
  });
});

describe("segmentNoticeText", () => {
  it("returns the whole text as one untagged segment when there are no annotations", () => {
    expect(segmentNoticeText("Plain notice text.", [])).toEqual([
      { text: "Plain notice text.", tag: null },
    ]);
  });

  it("splits around a single annotation, preserving plain text before and after", () => {
    const raw = "Before ROOT CAUSE after.";
    const annotations = buildNoticeAnnotations(raw, "POLICY", copy).filter(
      (a) => a.id === "clear-structure",
    );
    const segments = segmentNoticeText(raw, annotations);
    expect(segments.map((s) => s.text).join("")).toBe(raw);
    expect(segments.some((s) => s.tag === "clear")).toBe(true);
    expect(segments.filter((s) => s.tag === null).every((s) => s.text.length > 0)).toBe(true);
  });

  it("reassembles to the exact original text for a multi-annotation notice", () => {
    const raw =
      "We could not verify the authenticity of your products. State your root cause and corrective actions.";
    const annotations = buildNoticeAnnotations(raw, "INAUTHENTIC", copy);
    const segments = segmentNoticeText(raw, annotations);
    expect(segments.map((s) => s.text).join("")).toBe(raw);
  });
});

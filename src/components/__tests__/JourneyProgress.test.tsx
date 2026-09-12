import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JourneyProgress } from "@/components/JourneyProgress";

describe("JourneyProgress", () => {
  it("renders every stage as a real, clickable link (nothing locked)", () => {
    const html = renderToStaticMarkup(<JourneyProgress stage="build" />);
    expect(html).toContain('href="/decode"');
    expect(html).toContain('href="/case"');
    expect(html).toContain('href="/compose"');
  });

  it("carries the known violation kind into the Build-your-case link", () => {
    const html = renderToStaticMarkup(<JourneyProgress stage="decode" kind="POLICY" />);
    expect(html).toContain('href="/case?kind=POLICY"');
  });

  it("marks the current stage with aria-current", () => {
    const html = renderToStaticMarkup(<JourneyProgress stage="draft" />);
    expect(html).toContain('aria-current="step"');
  });
});

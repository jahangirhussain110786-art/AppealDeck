import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders the title as a paragraph by default (embedded empty states must not add headings)", () => {
    const html = renderToStaticMarkup(<EmptyState title="No evidence attached yet" />);
    expect(html).toContain("<p class=");
    expect(html).toContain("No evidence attached yet");
    expect(html).not.toContain("<h1");
  });

  it("renders the title as the requested heading level when it is the page's own heading", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        titleAs="h1"
        title="Your encrypted evidence vault"
        description="It opens once you sign in."
      />,
    );
    expect(html).toContain("<h1 class=");
    expect(html).toContain("Your encrypted evidence vault</h1>");
  });
});

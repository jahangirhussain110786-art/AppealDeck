import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { attemptDateRecorded } from "@/core/workspace";

/**
 * 7 Oct 2026: the decode error alert passed a title, a message and a button row as separate
 * children of a flex row, so on a phone they became side-by-side columns a word or two wide. An
 * Alert is an optional icon plus ONE column, whatever is passed.
 */
describe("Alert layout", () => {
  it("stacks every child after the icon in a single column", () => {
    const html = renderToStaticMarkup(
      <Alert variant="destructive">
        <ShieldAlert aria-hidden />
        <AlertTitle>Could not decode</AlertTitle>
        <AlertDescription>Paste the whole notice.</AlertDescription>
        <div>buttons</div>
      </Alert>,
    );
    // Exactly one column wrapper holds the title, the message and the buttons.
    expect(html.match(/min-w-0 flex-1/g)).toHaveLength(1);
    const column = html.slice(html.indexOf("min-w-0 flex-1"));
    expect(column).toContain("Could not decode");
    expect(column).toContain("Paste the whole notice.");
    expect(column).toContain("buttons");
    // The icon stays outside the column, as the row's first child.
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("min-w-0 flex-1"));
  });

  it("works with no icon", () => {
    const html = renderToStaticMarkup(
      <Alert>
        <AlertTitle>One</AlertTitle>
        <AlertDescription>Two</AlertDescription>
      </Alert>,
    );
    expect(html.match(/min-w-0 flex-1/g)).toHaveLength(1);
  });
});

describe("attemptDateRecorded", () => {
  it("is false for the placeholder stored when the seller gave no date", () => {
    expect(attemptDateRecorded(new Date(0).toISOString())).toBe(false);
    expect(attemptDateRecorded("")).toBe(false);
    expect(attemptDateRecorded("2026-09-01T00:00:00.000Z")).toBe(true);
  });
});

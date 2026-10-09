import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AppError from "../(app)/error";

describe("the app error screen", () => {
  const html = renderToStaticMarkup(<AppError error={new Error("boom")} reset={() => undefined} />);

  it("says saved work is kept, and offers a way back to the case", () => {
    expect(html).toContain("What you saved is kept in this browser");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Try again");
  });

  it("shows no technical detail", () => {
    expect(html).not.toContain("boom");
  });
});

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileMenu } from "@/components/ProfileMenu";

describe("ProfileMenu", () => {
  it("renders a labelled account-menu trigger", () => {
    const html = renderToStaticMarkup(<ProfileMenu email="seller@example.com" />);
    expect(html).toContain("Account menu");
  });

  it("renders without an email when none is given", () => {
    const html = renderToStaticMarkup(<ProfileMenu email={null} />);
    expect(html).toContain("Account menu");
  });
});

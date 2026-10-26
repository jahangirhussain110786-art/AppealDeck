import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PassStatusRow } from "../DashboardClient";
import { APP } from "@/content/app";

const none = { status: "none" as const, plan: null, licenseKey: null };

/**
 * F6/F7 (26 Oct 2026). The row used to answer "no Pass" to three different situations: a genuine
 * none, a server that could not be asked, and a seller holding a One Response (invisible to the
 * Pass lookup). Each answer is now its own row, so none of them can be read as another.
 */
describe("Dashboard Pass row", () => {
  it("says the lookup failed rather than claiming there is no Pass", () => {
    const html = renderToStaticMarkup(<PassStatusRow license={null} singles={0} />);
    expect(html).toContain(APP.dashboard.unknown.heading);
    expect(html).not.toContain(APP.dashboard.inactive.heading);
  });

  it("names the One Response held instead of a missing Pass", () => {
    const html = renderToStaticMarkup(<PassStatusRow license={none} singles={1} />);
    expect(html).toContain(APP.dashboard.single.heading);
    expect(html).not.toContain(APP.dashboard.inactive.heading);
  });

  it("still says no Pass when the server answered plainly", () => {
    const html = renderToStaticMarkup(<PassStatusRow license={none} singles={0} />);
    expect(html).toContain(APP.dashboard.inactive.heading);
    expect(html).not.toContain(APP.dashboard.single.heading);
  });

  it("keeps an active Pass ahead of a One Response held on another case", () => {
    const html = renderToStaticMarkup(
      <PassStatusRow
        license={{ status: "active", plan: "appeal_pass", licenseKey: "AD-1" }}
        singles={1}
      />,
    );
    expect(html).toContain(APP.dashboard.active.heading);
    expect(html).not.toContain(APP.dashboard.single.heading);
  });
});

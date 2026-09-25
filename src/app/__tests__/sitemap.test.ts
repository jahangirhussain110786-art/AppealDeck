import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sitemap from "../sitemap";

/**
 * 24 Sep 2026: a crawl found /support missing from the sitemap, added a day after the sitemap was
 * last touched. Every public page is a top-level folder of `src/app` with a `page.tsx` (the
 * signed-in and auth pages live under the `(app)` group, and `dev` is the dev-only gallery), so the
 * list is checked against the folders rather than remembered.
 */
describe("sitemap", () => {
  it("lists every public page", () => {
    const appDir = path.join(__dirname, "..");
    const publicPages = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          !d.name.startsWith("(") &&
          !d.name.startsWith("_") &&
          !["api", "dev"].includes(d.name) &&
          fs.existsSync(path.join(appDir, d.name, "page.tsx")),
      )
      .map((d) => `/${d.name}`);

    const listed = sitemap().map((entry) => new URL(entry.url).pathname.replace(/\/$/, "") || "/");
    expect(listed).toContain("/");
    for (const page of publicPages) expect(listed, `${page} is missing`).toContain(page);
  });

  it("gives only real page dates, never the build time", () => {
    for (const entry of sitemap()) {
      if (entry.lastModified === undefined) continue;
      expect(String(entry.lastModified), entry.url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

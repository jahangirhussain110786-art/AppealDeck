import { expect, test } from "@playwright/test";

/**
 * A shared link needs a preview image. Until 7 Oct 2026 only the home page had one: every page that
 * set its own `openGraph` dropped the inherited file-based image while still declaring a "large
 * image" Twitter card. Found in the launch audit.
 */
const PAGES = [
  "/",
  "/decode",
  "/pricing",
  "/faq",
  "/support",
  "/privacy",
  "/terms",
  "/refund",
  "/guides",
  "/guides/section-3",
  "/guides/plan-of-action-examples",
];

for (const path of PAGES) {
  test(`${path} has one absolute Open Graph image and a Twitter image`, async ({ page }) => {
    await page.goto(path);
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveCount(1);
    expect(await og.getAttribute("content")).toMatch(/^https?:\/\/.+\/.+\.png/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
  });
}

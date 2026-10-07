import { expect, test } from "@playwright/test";

/**
 * WCAG 1.4.10 (reflow): at 320 px wide nothing may force the page to scroll sideways. The test runs
 * at 305 px, which is what a 320 px screen leaves once a classic 15 px scrollbar takes its share (CI's
 * Linux Chromium has one, Windows and phones do not); passing there passes everywhere. Found on
 * 7 Oct 2026 in the launch audit: the pricing comparison table's screen-reader-only labels, in
 * cells scrolled out of view, were not clipped by the table's scroll wrapper and widened the whole
 * page by 11 px. Every public page is checked so the next one is caught too.
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
  "/login",
  "/signup",
  "/forgot-password",
];

test.describe("reflow at 320 px (305 px of content)", () => {
  test.use({ viewport: { width: 305, height: 800 } });

  for (const path of PAGES) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(path);
      await page.waitForLoadState("load");
      const excess = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(excess, `${path} is ${excess}px wider than the screen`).toBeLessThanOrEqual(0);
    });
  }
});

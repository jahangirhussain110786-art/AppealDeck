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
  "/guides/plan-of-action-examples",
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

/**
 * 9 Oct 2026 (launch audit 5.1): the other widths a seller actually uses, in the dark scheme, and
 * the signed-out app pages. A page that is fine at 320 px can still push sideways at a tablet or
 * laptop width, and the app pages were never measured at any width.
 */
const APP_PAGES = ["/case", "/dashboard", "/vault"];

for (const width of [375, 768, 1024, 1440]) {
  test.describe(`no sideways scroll at ${width} px, dark scheme`, () => {
    test.use({ viewport: { width, height: 900 }, colorScheme: "dark" });

    for (const path of [...PAGES, ...APP_PAGES]) {
      test(`${path}`, async ({ page }) => {
        test.setTimeout(60_000);
        await page.goto(path);
        await page.waitForLoadState("load");
        const excess = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(
          excess,
          `${path} is ${excess}px wider than the ${width} px screen`,
        ).toBeLessThanOrEqual(0);
      });
    }
  });
}

test.describe("the open case, every view", () => {
  for (const width of [375, 768, 1440]) {
    test(`does not scroll sideways at ${width} px`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.goto("/case");
      await page
        .getByLabel("Amazon notice", { exact: true })
        .fill(
          "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.",
        );
      await page
        .getByLabel("What the response page asks for")
        .fill("Upload the invoice and explain how the product code matches the affected product.");
      await page.getByRole("button", { name: "Yes, this is right" }).click();
      await expect(page.getByRole("button", { name: "Go to your documents" })).toBeVisible();
      for (const name of ["Overview", "Documents", "Response", "History"]) {
        await page.getByRole("tab", { name, exact: true }).click();
        const excess = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(excess, `${name} view is ${excess}px wider than ${width} px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

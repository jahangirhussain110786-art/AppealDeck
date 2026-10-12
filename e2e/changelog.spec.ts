import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

// P-01 (12 Oct 2026): a dated list of changes. Every entry is dated, the page is findable from the
// footer and the sitemap, and it is accessible.

test("the changelog lists dated entries, newest first, and is accessible", async ({ page }) => {
  await page.goto("/changelog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/what changed/i);
  const dates = page.getByRole("heading", { level: 2 });
  await expect(dates.first()).toHaveText("12 Oct 2026");
  await expect(page.getByText(/plain headings, without the double hash marks/)).toBeVisible();
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
});

test("the changelog is linked from the footer and listed in the sitemap", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "What changed" }).click();
  await expect(page).toHaveURL(/\/changelog$/);
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain("/changelog");
});

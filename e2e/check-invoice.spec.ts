import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

/**
 * The free invoice check (8 Oct 2026): a public page that reads a supplier invoice on the device
 * and shows what it contains. It must work signed out, must not put the file on the wire, and
 * must not claim to know what Amazon will decide.
 */

const DOCS = "docs/handoffs/2026-09-29-test-documents";

test("an invoice is checked on the device, with nothing sent anywhere", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/(read-document|decode|compose)/.test(r.url())) sent.push(r.url());
  });

  await page.goto("/check-invoice");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/supplier invoice/i);

  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/04-supplier-invoice-WITH-PROBLEMS.pdf`);

  // The reading says where it was made, and what it cannot say.
  await expect(page.getByText("Read on this device, without AI", { exact: true })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(/Whether Amazon accepts it is their decision/)).toBeVisible();
  // The problem invoice has no supplier address or phone: something is reported, not passed.
  await expect(page.getByText(/^(Not found|Conflicts)$/).first()).toBeVisible();

  expect(sent).toEqual([]);
});

test("the page is findable, honest about its limits, and accessible", async ({ page }) => {
  await page.goto("/check-invoice");
  await expect(page.getByText("What it does not do")).toBeVisible();
  await expect(page.getByText(/does not tell you whether Amazon will accept/i)).toBeVisible();
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });

  // Linked from the footer, and listed for search engines.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Free invoice check" })).toBeVisible();
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/check-invoice");
});

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
  await expect(page.getByText(/whether Amazon accepts it is their decision/i)).toBeVisible();
  // The problem invoice has no supplier address or phone: something is reported, not passed.
  await expect(page.getByText(/^(Not found|Conflicts)$/).first()).toBeVisible();

  expect(sent).toEqual([]);
});

test("the page is findable, honest about its limits, and accessible", async ({ page }) => {
  await page.goto("/check-invoice");
  await expect(page.getByText("Where this check stops")).toBeVisible();
  await expect(page.getByText(/Amazon may contact your supplier/i)).toBeVisible();
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });

  // Linked from the footer, and listed for search engines.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Free invoice check" })).toBeVisible();
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/check-invoice");
});

test("the invoice's two sums are worked out with the working (G-02)", async ({ page }) => {
  await page.goto("/check-invoice");
  // Typed before the file, so the first reading is already counted from the notice's date.
  // Typed into controlled inputs, so retried until the page has hydrated and keeps the value.
  const date = page.getByLabel("Date on Amazon's notice (optional)");
  const units = page.getByLabel(/Units you sold of this product/);
  await expect(async () => {
    await date.fill("2026-10-09");
    await units.fill("5");
    await page.waitForTimeout(150);
    await expect(date).toHaveValue("2026-10-09");
    await expect(units).toHaveValue("5");
  }).toPass({ timeout: 15_000 });

  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);

  const sums = page.getByRole("region", { name: "The two sums, worked out" });
  await expect(sums).toBeVisible({ timeout: 60_000 });
  // The days: both dates, the count and the limit, said once and in words.
  await expect(sums.getByText("How old is the invoice?")).toBeVisible();
  await expect(sums).toContainText(/your notice is dated 9 Oct 2026/);
  await expect(sums).toContainText(/days against the 365 Amazon usually asks about/);
  // The units: against the figure typed above.
  await expect(sums.getByText("Does it cover what you sold?")).toBeVisible();
  await expect(sums).toContainText(/You sold 5\.|the 5 units you sold/);
  // And it still says what it cannot know.
  await expect(sums).toContainText(/Whether Amazon accepts it stays with Amazon/);
});

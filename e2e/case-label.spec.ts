import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

/**
 * G-60 (12 Oct 2026): a seller who runs several accounts names each case. The name leads in the app
 * bar and the browser tab, stays in the encrypted vault across a reload, and is written into the
 * seller's own export. A name typed as a spreadsheet formula stays text in the CSV.
 */

const NOTICE =
  "Amazon Seller Performance. Your listing for ASIN B0EXAMPLE2 was removed because the detail page violates our product policy. To appeal, submit a Plan of Action in Account Health within 17 days.";

test("a case can be named, and the name survives a reload and leads the tab", async ({ page }) => {
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(NOTICE);
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  const field = page.getByLabel("Name this case (optional)");
  await field.fill("Acme UK");
  await field.press("Enter");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/^Acme UK · .* · AppealDeck$/);

  await page.reload();
  await expect(page.getByLabel("Name this case (optional)")).toHaveValue("Acme UK");
  await expect(page).toHaveTitle(/^Acme UK · /);
});

test("the name is in the seller's own export, never in the index that goes to Amazon", async ({
  page,
}) => {
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(NOTICE);
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByLabel("Name this case (optional)").fill("Client Zulu");
  await page.getByLabel("Name this case (optional)").press("Enter");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "History", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download case notes" }).click();
  const text = await readFile(await (await download).path(), "utf8");
  expect(text).toContain("Case name: Client Zulu");
});

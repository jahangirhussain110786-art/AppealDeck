import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * 7 Oct 2026 (launch audit). The cloud backup is the answer to "what if I lose this browser", so
 * it is proved end to end: a file is added in one browser, backed up, and restored in a second
 * browser that has never seen it. After the restore the second browser used to be left on an
 * "Unlock your vault, enter your passphrase" screen for a passphrase the seller had only typed to
 * restore; it now opens by itself and says what happened.
 *
 * Uses the dev account and its real Supabase storage, so it skips without a dev login.
 */
const PASSPHRASE = "restore-check-passphrase-2026";
const FILE = "docs/handoffs/2026-09-29-test-documents/03-supplier-invoice-t01-authenticity.pdf";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

async function freshBrowserPage(browser: Browser) {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

test("a file backed up in one browser is restored, and opens by itself, in another", async ({
  browser,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(150_000);

  const first = await freshBrowserPage(browser);
  await signIn(first.page);
  await first.page.goto("/vault");
  await first.page.locator("input[type=file]").first().setInputFiles(FILE);
  await expect(first.page.getByText(/03-supplier-invoice/).first()).toBeVisible();
  await first.page.getByRole("tab", { name: /backup/i }).click();
  for (const box of await first.page.locator("input:visible:not([type=file])").all())
    await box.fill(PASSPHRASE);
  // The upload itself, not the page's help text (which also says "backed up").
  const uploaded = first.page.waitForResponse(
    (r) =>
      r.request().method() === "POST" && r.url().includes("/storage/v1/object/appealdeck-vault/"),
    { timeout: 30_000 },
  );
  await first.page.getByRole("button", { name: "Back up now" }).click();
  expect((await uploaded).status()).toBe(200);
  await first.context.close();

  const second = await freshBrowserPage(browser);
  await signIn(second.page);
  await second.page.goto("/vault");
  await expect(second.page.getByText(/03-supplier-invoice/)).toHaveCount(0);
  await second.page.getByRole("tab", { name: /backup/i }).click();
  for (const box of await second.page.locator("input:visible:not([type=file])").all())
    await box.fill(PASSPHRASE);
  await second.page.getByRole("button", { name: /restore latest cloud backup/i }).click();

  // The page reloads. The seller is told what happened, no passphrase is asked for, and the file is there.
  await expect(second.page.getByText("Your vault was restored")).toBeVisible({ timeout: 30_000 });
  await expect(second.page.getByText(/Unlock your vault/)).toHaveCount(0);
  await second.page.getByRole("tab", { name: /^files/i }).click();
  await expect(second.page.getByText(/03-supplier-invoice/).first()).toBeVisible();
  await second.context.close();
});

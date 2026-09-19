import { expect, test } from "@playwright/test";

test("account screens keep a single main landmark and working form controls", async ({ page }) => {
  for (const route of ["/login", "/signup", "/forgot-password"]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  }
  await page.goto("/login");
  await page.getByRole("button", { name: "Email me a sign-in link instead", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Email me a sign-in link", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use password instead", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("policy sections can be reached by keyboard on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/privacy");
  const navigation = page.getByRole("navigation", { name: "On-page", exact: true });
  await navigation.locator("summary").focus();
  await page.keyboard.press("Enter");
  const link = navigation.getByRole("link", { name: /How we use it/ }).first();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#how-we-use$/);
  await expect(page.getByRole("heading", { name: "How we use it", exact: true })).toBeInViewport();
  await page
    .getByRole("navigation", { name: "Policy navigation" })
    .getByRole("link", { name: "Refund policy", exact: true })
    .click();
  await expect(page).toHaveURL(/\/refund$/);
});

test("vault tools retain files and device request failures offer retry", async ({ page }) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);
  await page.goto("/login?next=/vault");
  await page.getByLabel("Email", { exact: true }).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/vault$/);
  await expect(page.getByRole("tab", { name: "Files", exact: true })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "supplier-record.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nSynthetic local layout fixture\n%%EOF"),
    });
  const fileButton = page.getByRole("button", { name: "View supplier-record.pdf", exact: true });
  await expect(fileButton).toBeVisible();
  const files = page.getByRole("tab", { name: "Files", exact: true });
  await files.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Backup", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("button", { name: "Back up now", exact: true })).toBeDisabled();
  await page.getByLabel("Backup passphrase", { exact: true }).fill("test-backup-passphrase");
  await page.getByRole("tab", { name: "Security", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Protect with a passphrase", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Backup", exact: true }).click();
  await expect(page.getByLabel("Backup passphrase", { exact: true })).toHaveValue(
    "test-backup-passphrase",
  );
  await files.click();
  await expect(fileButton).toBeVisible();
  await page.getByRole("searchbox").fill("no-match");
  await expect(page.getByText("No files match", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).first().click();
  await expect(fileButton).toBeVisible();
  await page.reload();
  await expect(fileButton).toBeVisible();

  await page.getByRole("tab", { name: "Security", exact: true }).click();
  await page.getByRole("button", { name: "Protect with a passphrase", exact: true }).click();
  await page.locator("#vault-protect-passphrase").fill("local-layout-test-passphrase");
  await page.locator("#vault-protect-confirm").fill("local-layout-test-passphrase");
  await page.getByRole("button", { name: "Set passphrase", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("tab", { name: "Files", exact: true }).click();
  await page.getByRole("button", { name: "Lock vault", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unlock your vault", exact: true })).toBeVisible();
  await expect(fileButton).toHaveCount(0);
  await page.getByLabel("Passphrase", { exact: true }).fill("local-layout-test-passphrase");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await expect(fileButton).toBeVisible();

  let requests = 0;
  await page.route("**/api/devices", (route) =>
    route.fulfill({
      status: ++requests === 1 ? 503 : 200,
      contentType: "application/json",
      body:
        requests === 1
          ? JSON.stringify({ error: "Unavailable" })
          : JSON.stringify({ devices: [], cap: 5, currentDeviceId: null }),
    }),
  );
  await page.goto("/billing");
  await expect(
    page.getByRole("heading", { name: "Couldn't load your devices", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No active devices recorded yet.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("No active devices recorded yet.", { exact: true })).toBeVisible();
});

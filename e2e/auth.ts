import { test, type Page } from "@playwright/test";

/**
 * The one signed-in fixture for Playwright (24 Oct 2026). Before this, five specs each carried their
 * own copy of the same four steps. The account is the dev fixture seeded by
 * `node scripts/seed-dev-user.mjs`; when its env vars are absent the signed-in tests skip instead of
 * failing, because CI has no dev account.
 */
export const hasDevAccount = Boolean(process.env.DEV_LOGIN_EMAIL && process.env.DEV_LOGIN_PASSWORD);

export function skipWithoutDevAccount(): void {
  test.skip(
    !hasDevAccount,
    "Set DEV_LOGIN_EMAIL and DEV_LOGIN_PASSWORD to run the signed-in check.",
  );
}

export async function signInAsDev(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard/);
}

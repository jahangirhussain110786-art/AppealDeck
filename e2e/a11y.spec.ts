import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * These marketing and auth surfaces gate on serious + critical only; the app specs assert on
 * every violation. The scan itself, including the entry-fade wait, lives in ./axe.ts.
 */
async function assertNoAxeViolations(page: Page, path: string) {
  await page.goto(path);
  await expectNoAxeViolations(page, { impacts: ["critical", "serious"] });
}

test.describe("Marketing + auth surfaces (axe-core, serious + critical)", () => {
  test("home page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/");
  });

  test("pricing page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/pricing");
  });

  test("/decode page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/decode");
  });

  test("/faq page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/faq");
  });

  test("/privacy page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/privacy");
  });

  test("/terms page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/terms");
  });

  test("/refund page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/refund");
  });

  test("/signup page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/signup");
  });

  test("/forgot-password page has no serious or critical a11y violations", async ({ page }) => {
    await assertNoAxeViolations(page, "/forgot-password");
  });

  test("/reset-password redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/reset-password");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});

test.describe("Auth gate", () => {
  test("unauthenticated /dashboard stays on the route", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/dashboard");
  });

  test("unauthenticated /case stays on the route", async ({ page }) => {
    const res = await page.goto("/case");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/case");
  });

  test("unauthenticated /compose redirects to /login", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /vault stays on the route", async ({ page }) => {
    const res = await page.goto("/vault");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/vault");
  });

  test("unauthenticated /billing redirects to /login", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("auth pages have skip-link to main content", async ({ page }) => {
    await page.goto("/login");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeVisible();
  });
});

test.describe("Keyboard navigation (unauthenticated)", () => {
  test("login form is keyboard-navigable", async ({ page }) => {
    await page.goto("/login");
    const email = page.getByLabel(/email/i);
    await email.focus();
    await email.fill("seller@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const password = page.getByLabel(/^password$/i);
    await expect(password).toBeFocused();
    await password.fill("hunter2");
    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeFocused();
  });

  test("signup form is keyboard-navigable", async ({ page }) => {
    await page.goto("/signup");
    const email = page.getByLabel(/email/i);
    await email.focus();
    await email.fill("seller@example.com");
    await page.keyboard.press("Tab");
    const password = page.getByLabel(/^password$/i);
    await expect(password).toBeFocused();
    await password.fill("hunter2");
    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: /create account|sign up/i });
    await expect(submitButton).toBeFocused();
  });
});

import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("Accessibility (axe-core)", () => {
  test("home page has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });

  test("pricing page has no critical a11y violations", async ({ page }) => {
    await page.goto("/pricing");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });

  test("/decode page has no critical a11y violations", async ({ page }) => {
    await page.goto("/decode");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });

  test("legal pages have no critical a11y violations", async ({ page }) => {
    for (const slug of ["/privacy", "/terms", "/refund"]) {
      await page.goto(slug);
      const results = await new AxeBuilder({ page }).analyze();
      const critical = results.violations.filter((v) => v.impact === "critical");
      expect(critical).toEqual([]);
    }
  });

  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/login");
  });

  test("auth pages have skip-link to main content", async ({ page }) => {
    await page.goto("/login");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeVisible();
  });
});

test.describe("Authenticated a11y (dev seed)", () => {
  test("login form is keyboard-navigable", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).focus();
    await page.keyboard.type("test@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("password123");
    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeFocused();
  });
});

import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Wait until every element in the viewport that carries an inline opacity (framer-motion
 * entry fades) has reached opacity 1. axe measures colour contrast on the rendered pixels,
 * so a scan taken mid-fade reports blended foreground colours that never exist in the
 * palette (e.g. #aaabaf for text-foreground on white). Elements below the fold are ignored:
 * scroll-triggered animations stay at opacity 0 until they enter the viewport.
 */
async function waitForEntryAnimations(page: Page) {
  await page.waitForFunction(() => {
    const viewportHeight = window.innerHeight;
    return Array.from(document.querySelectorAll<HTMLElement>('[style*="opacity"]')).every((el) => {
      const rect = el.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.top < viewportHeight;
      return !inViewport || getComputedStyle(el).opacity === "1";
    });
  });
}

async function assertNoAxeViolations(page: Page, path: string) {
  await page.goto(path);
  await waitForEntryAnimations(page);
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    violations,
    JSON.stringify(
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => n.html),
      })),
    ),
  ).toEqual([]);
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
  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.status()).toBe(200);
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /case redirects to /login", async ({ page }) => {
    await page.goto("/case");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /compose redirects to /login", async ({ page }) => {
    await page.goto("/compose");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /vault redirects to /login", async ({ page }) => {
    await page.goto("/vault");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
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

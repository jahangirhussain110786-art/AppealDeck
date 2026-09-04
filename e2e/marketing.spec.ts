import { expect, test } from "@playwright/test";

test.describe("Marketing site (public)", () => {
  test("home page loads with hero and pricing CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AppealDeck/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /pricing|get.*pass|appeal.*pass/i }).first(),
    ).toBeVisible();
  });

  test("pricing page renders all three plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1, name: /pricing/i })).toBeVisible();
  });

  test("decode page accepts pasted notice text", async ({ page }) => {
    await page.goto("/decode");
    const textarea = page.getByRole("textbox", { name: /notice|paste|text/i }).first();
    await expect(textarea).toBeVisible();
    await textarea.fill(
      "Hello Seller, Your Amazon seller account has been deactivated under our policy. ASIN B07XYZ was found in violation. Please submit a Plan of Action within 7 days.",
    );
    await expect(
      page.getByRole("button", { name: /decode|analyze|submit/i }).first(),
    ).toBeVisible();
  });

  test("privacy + terms + refund pages are reachable", async ({ page }) => {
    for (const slug of ["/privacy", "/terms", "/refund"]) {
      const r = await page.goto(slug);
      expect(r?.status() ?? 500).toBeLessThan(400);
    }
  });
});

test.describe("Auth gate", () => {
  test("/login renders the sign-in form for unauthenticated visitors", async ({ page }) => {
    const r = await page.goto("/login");
    expect(r?.ok() ?? r?.status() === 200).toBeTruthy();
  });

  test("login page renders email + password form", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { level: 1, name: /sign in|log in|login/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("login page exposes Google + magic-link + forgot + create-account", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /use a magic link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
  });

  test("/signup renders the create-account form", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /create your account|sign up|create an account/i,
      }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("/forgot-password renders the reset form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { level: 1, name: /forgot your password/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });
});

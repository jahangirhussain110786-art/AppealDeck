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

  test("footer states independence from Amazon", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await expect(page.getByText(/not affiliated with/i)).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /independence from amazon/i })).toBeVisible();
    await page.goto("/faq");
    await expect(page.getByText(/part of amazon/i)).toBeVisible();
  });

  test("pricing page renders the Free, Free account and Appeal Pass columns", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Free", exact: true })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Free account", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Appeal Pass", exact: true }),
    ).toBeVisible();
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

  test("the sample notice loads and decodes to a result card", async ({ page }) => {
    await page.goto("/decode");
    await page.getByRole("button", { name: "Try a sample notice" }).click();
    const textarea = page.getByRole("textbox", { name: /notice/i }).first();
    await expect(textarea).not.toHaveValue("");

    await page.getByRole("button", { name: "Decode", exact: true }).click();

    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await expect(main.getByText("Do now", { exact: true })).toBeVisible();
    await expect(main.getByText("Do not", { exact: true })).toBeVisible();
    await expect(main.getByText("This page hit an error")).toHaveCount(0);
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
    // The header also has a "Sign in" link now (five-slot header, AM-21) — target the
    // page's own "Already have an account? Sign in" cross-link, not the header's.
    await expect(page.getByRole("link", { name: /sign in/i }).last()).toBeVisible();
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

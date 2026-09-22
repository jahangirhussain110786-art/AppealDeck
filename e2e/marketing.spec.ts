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

  /**
   * #87. A newly deactivated seller is the most phishable person online, and this is the one
   * feature where being silently unwired would do real harm rather than merely lose value — so
   * the wiring is asserted end to end, not only the pure function in core.
   */
  test("a message asking for a fee and a password is questioned before the decision", async ({
    page,
  }) => {
    await page.goto("/decode");
    await page
      .getByRole("textbox", { name: /notice/i })
      .first()
      .fill(
        [
          "Subject: Amazon Seller Performance - account deactivation notice",
          "",
          "Your Amazon seller account has been deactivated following a policy review of your listings.",
          "To restore your selling privileges, pay the reinstatement fee of $250.",
          "Submit your appeal at https://amaz0n-seller-appeal.com/restore and reply to",
          "seller-performance@amazon-support-team.net with your password to verify ownership.",
          "For faster resolution contact our specialist on WhatsApp.",
        ].join("\n"),
      );
    await page.getByRole("button", { name: "Decode", exact: true }).click();

    const main = page.locator("main");
    await expect(main.getByText("Check this message before you act on it")).toBeVisible();
    await expect(main.getByText("This message mentions a payment")).toBeVisible();
    await expect(main.getByText("amaz0n-seller-appeal.com")).toBeVisible();
    // It points at Seller Central and reaches no verdict of its own.
    await expect(
      main.getByText(/Open Seller Central yourself and look at Account Health/),
    ).toBeVisible();
    await expect(main.getByText(/is a scam|fraudulent|is genuine/i)).toHaveCount(0);
  });

  test("a genuine notice is not questioned", async ({ page }) => {
    await page.goto("/decode");
    await page.getByRole("button", { name: "Try a sample notice" }).click();
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.locator("main").getByRole("heading", { level: 2 }).first()).toBeVisible();
    // The cost of crying wolf here is a seller who delays answering a real deactivation.
    await expect(
      page.locator("main").getByText("Check this message before you act on it"),
    ).toHaveCount(0);
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
    await expect(
      page.getByRole("button", { name: "Email me a sign-in link instead", exact: true }),
    ).toBeVisible();
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
    // getByLabel(/password/i) is ambiguous since PasswordInput's show/hide
    // toggle button also carries an aria-label containing "password" (Task 2,
    // ed44480) — target the textbox role specifically, pre-existing gap,
    // unrelated to this pass.
    await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();
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

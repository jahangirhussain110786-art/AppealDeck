import { expect, test } from "@playwright/test";

test.describe("Access ladder — signed-out interview, gate, case preview", () => {
  test("signed out: an answer at step one survives a reload", async ({ page }) => {
    await page.goto("/case?kind=POLICY");
    await expect(page.getByText("What happened?", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Type your answer...").fill("A supplier mix-up on one ASIN.");
    await page.getByTestId("interview-continue").click();
    await expect(page.getByText("Key dates", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
  });

  test("signed out: reaching the first document step shows the sign-in gate", async ({
    page,
  }) => {
    await page.goto("/case?kind=POLICY");
    await expect(page.getByText("What happened?", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Type your answer...").fill("A supplier mix-up on one ASIN.");
    await page.getByTestId("interview-continue").click();

    await expect(page.getByText("Key dates", { exact: true })).toBeVisible();
    await page.locator('input[type="date"]').fill("2026-08-01");
    await page.getByTestId("interview-continue").click();

    await expect(page.getByText("Prior appeals", { exact: true })).toBeVisible();
    const firstTimeOption = page.getByRole("button", { name: "No, this is my first" });
    await firstTimeOption.click();
    await expect(firstTimeOption).toHaveClass(/ring-primary/);
    await page.getByTestId("interview-continue").click();

    // Optional "preventive measures" step (founder-issues-fix pass, 6436aba) sits
    // between prior appeals and the first document step. It's optional but the
    // Continue button still requires non-empty text (a separate, pre-existing
    // behavior, not part of this visual pass) — answer it to reach the gate.
    await expect(page.getByText("Preventing this from happening again", { exact: true })).toBeVisible();
    await page
      .getByPlaceholder("Type your answer...")
      .fill("Added a second reviewer on listing edits.");
    await page.getByTestId("interview-continue").click();

    await expect(page.getByText("Save your case to continue")).toBeVisible();
    const signInLink = page.locator("main").getByRole("link", { name: "Sign in", exact: true });
    await expect(signInLink).toHaveAttribute("href", "/login?next=%2Fcase");
  });

  test("a decoded notice shows the case preview", async ({ page }) => {
    await page.goto("/decode");
    await page
      .getByPlaceholder(/paste/i)
      .fill(
        "Performance Notification from Amazon Seller Central: your account has been deactivated " +
          "for policy violation. Your selling privileges have been removed. Submit a Plan of Action " +
          "addressing each ASIN affected and the account health issue described in this notice.",
      );
    await page.getByRole("button", { name: "Decode", exact: true }).click();

    await expect(page.getByText("What this case will need", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start your case/i })).toBeVisible();
  });

  test("signed out: dashboard shows the empty state with no draft", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("No case on this device yet", { exact: true })).toBeVisible();
  });

  test("signed out: dashboard shows the draft summary once a case exists", async ({ page }) => {
    await page.goto("/case?kind=POLICY");
    await expect(page.getByText("What happened?", { exact: true })).toBeVisible();
    await page.getByPlaceholder("Type your answer...").fill("A supplier mix-up on one ASIN.");
    await page.getByTestId("interview-continue").click();
    await expect(page.getByText("Key dates", { exact: true })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("Your case, at a glance", { exact: true })).toBeVisible();
  });

  test("signed out: header shows five nav slots with a lock only on Vault, no Billing", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Decode", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Case", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Vault" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Billing", exact: true })).toHaveCount(0);
    // exactly one lock icon in the nav (on Vault) when signed out
    await expect(nav.locator("svg")).toHaveCount(1);
  });
});

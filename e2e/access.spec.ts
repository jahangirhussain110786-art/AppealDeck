import { expect, test } from "@playwright/test";

test.describe("Access ladder — signed-out workspace, gate, case preview", () => {
  /**
   * The classic interview was retired on 22 Sep 2026, so these were rewritten to drive the case
   * workspace — the only journey now. The guarantees are unchanged: a signed-out seller's work is
   * saved as they type, it survives a reload, it shows on the dashboard, and sign-in is asked for
   * at the point the product needs an account rather than up front.
   */

  /** The workspace autosaves on a 900 ms debounce; this waits past it deterministically. */
  const typeNotice = async (page: import("@playwright/test").Page, text: string) => {
    await page.getByLabel("Amazon notice").fill(text);
    await page.getByLabel("Amazon notice").blur();
    await page.waitForTimeout(1500);
  };

  test("signed out: what you type survives a reload", async ({ page }) => {
    const notice = "A supplier mix-up on one ASIN.";
    await page.goto("/case?kind=POLICY");
    await typeNotice(page, notice);

    await page.reload();
    await expect(page.getByLabel("Amazon notice")).toHaveValue(notice);
  });

  test("signed out: the workspace works as a guest and offers a route to sign in", async ({
    page,
  }) => {
    // The point of the access ladder: a guest can do real work first, and is offered an account
    // rather than made to create one up front. Written against the guest-session affordance that
    // is always present, not the compose gate — that one only appears once a case is complete
    // enough to draft, which is correct behaviour but a poor thing to assert on an empty case.
    await page.goto("/case?kind=POLICY");
    await expect(page.getByLabel("Amazon notice")).toBeVisible();

    const signIn = page.getByRole("link", { name: "Sign in", exact: true }).last();
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute("href", /\/login\?next=/);
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

    await expect(page.getByText("What to gather", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open case workspace", exact: true }),
    ).toBeVisible();
  });

  test("signed out: dashboard shows the empty state with no draft", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("No case on this device yet", { exact: true })).toBeVisible();
  });

  test("signed out: dashboard shows the draft summary once a case exists", async ({ page }) => {
    await page.goto("/case?kind=POLICY");
    await typeNotice(page, "A supplier mix-up on one ASIN.");

    await page.goto("/dashboard");
    await expect(page.getByText("Your case, at a glance", { exact: true })).toBeVisible();
  });

  test("signed out: header shows four nav slots with a lock only on Vault, no Case or Billing", async ({
    page,
  }) => {
    // AM-25 (12 Sep 2026): "Case" is intake, not a nav destination — Dashboard's own
    // start/continue button is the entry point. Billing lives behind the profile menu for a
    // signed-in seller, and there's no profile to hide Pricing behind when signed out.
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Decode", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Case", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Vault" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Billing", exact: true })).toHaveCount(0);
    // exactly one lock icon in the nav (on Vault) when signed out
    await expect(nav.locator("svg")).toHaveCount(1);
  });
});

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("pricing offers a next action and a readable refund policy on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pricing");
  const plans = page.getByRole("list", { name: "Plans for sellers" });
  await expect(plans.getByRole("link", { name: "Decode a notice" })).toHaveAttribute(
    "href",
    "/decode",
  );
  await expect(plans.getByRole("link", { name: "Get the Appeal Pass" })).toHaveAttribute(
    "href",
    "#purchase",
  );
  await expect(page.getByRole("link", { name: "Refund terms" }).first()).toHaveAttribute(
    "href",
    "/refund",
  );
  await expectNoAxeViolations(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a partner statement always requires sign-in", async ({ page }) => {
  await page.goto("/partners/account");
  await expect(page).toHaveURL(/\/login\?next=%2Fpartners%2Faccount/);
  await expect(page.getByText("Balance after payouts")).toHaveCount(0);
});

test("the referral validation endpoint refuses anonymous requests", async ({ request }) => {
  const result = await request.post("/api/referral/validate", { data: { code: "PARTNER25" } });
  expect(result.status()).toBe(401);
});

test("pricing sign-in preserves the selected plan through account creation", async ({ page }) => {
  await page.goto("/pricing");
  await page
    .locator("#purchase")
    .getByRole("link", { name: "Sign in to buy", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?next=%2Fpricing%3Fplan%3Dcase%23purchase/);
  const signup = page.locator('a[href^="/signup?next="]');
  await expect(signup).toHaveAttribute("href", "/signup?next=%2Fpricing%3Fplan%3Dcase%23purchase");
});

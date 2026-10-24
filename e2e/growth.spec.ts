import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("pricing offers a next action and a readable refund policy on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pricing");
  const section = page.getByRole("region", { name: "Choose for the work ahead" });
  await expect(section.getByRole("link", { name: "Decode my notice" })).toHaveAttribute(
    "href",
    "/decode",
  );
  await expect(section.getByRole("link", { name: "Choose the Appeal Pass" })).toHaveAttribute(
    "href",
    "#purchase",
  );
  await expect(section.getByRole("link", { name: "Refund terms" })).toHaveAttribute(
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
  await page.locator("#purchase").getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fpricing%3Fplan%3Dcase%23purchase/);
  const signup = page.locator('a[href^="/signup?next="]');
  await expect(signup).toHaveAttribute("href", "/signup?next=%2Fpricing%3Fplan%3Dcase%23purchase");
});

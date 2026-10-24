import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * One Response (23 Oct 2026): $99, one case, the first response only. `NEXT_PUBLIC_*` values are put
 * into the build, so each half runs against the matching build and is skipped against the other:
 *
 *   normal build (nothing set)  -> the first test: the card says "Opens soon" and cannot be bought
 *   NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE=pri_s npm run build
 *   CI=1 npx playwright test e2e/single-response.spec.ts --project=chromium --retries=0
 *                               -> the second test: the card opens the purchase, the picker has it
 *
 * What the server does with a second response is `compose-gate.test.ts`; the SQL is
 * `paymentSqlSingle.test.ts`.
 */
const ON_SALE = Boolean(process.env.NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE);

test("before it is on sale, the second card is One Response at $99 and says Opens soon", async ({
  page,
}) => {
  test.skip(ON_SALE, "needs a build made without the One Response price");
  await page.goto("/pricing");
  const cards = page.getByRole("list", { name: "Plans for sellers" }).locator("> li");
  if (process.env.NEXT_PUBLIC_PLANS_PREVIEW !== "on") {
    // Unavailable products are hidden unless a preview is switched on deliberately.
    await expect(cards.filter({ hasText: "One Response" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Opens soon" })).toHaveCount(0);
    return;
  }
  await expect(cards.nth(0)).toContainText("For everyone");
  await expect(cards.nth(0).getByRole("heading", { name: "No account" })).toBeVisible();
  await expect(cards.nth(0).getByRole("heading", { name: "With a free account" })).toBeVisible();
  await expect(cards.nth(1)).toContainText("One Response");
  await expect(cards.nth(1)).toContainText("$99");
  await expect(cards.nth(1)).toContainText("No further responses");
  await expect(cards.nth(1).getByRole("button", { name: "Opens soon" })).toBeDisabled();
  await expect(cards.nth(2)).toContainText("Appeal Pass");
  // The free account is the second part of the Free card, not a card of its own.
  await expect(cards.nth(0)).toContainText("Case saved on your device");
  await expect(page.getByRole("columnheader", { name: "One Response", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: /One Response/ })).toHaveCount(0);
  await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });
});

test("on sale, its button opens the purchase with One Response chosen, at $99", async ({
  page,
}) => {
  test.skip(!ON_SALE, "needs a build made with NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE set");
  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Get One Response" })).toBeVisible();
  const picker = page.getByRole("group", { name: "What to buy" });
  await expect(picker.getByRole("radio", { name: /Appeal Pass/ })).toBeChecked();
  await page.getByRole("link", { name: "Get One Response" }).click();
  await expect(picker.getByRole("radio", { name: /One Response/ })).toBeChecked();
  const summary = page.locator("dl").filter({ hasText: "Total, once" });
  await expect(summary.getByText("$99.00").first()).toBeVisible();
  await expect(page.getByText("A response to Amazon's reply, or a second try")).toBeVisible();
  await picker.getByRole("radio", { name: /Appeal Pass/ }).check();
  await expect(summary.getByText("$249.00").first()).toBeVisible();
  await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });
});

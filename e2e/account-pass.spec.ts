import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * The Account Pass as a visitor sees it once it is on sale (22 Oct 2026).
 *
 * `NEXT_PUBLIC_*` values are put into the build, so this can only be checked against a build made
 * with the Account Pass price set. It is skipped otherwise, which is the normal CI build. To run it:
 *
 *   NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS=pri_test npm run build
 *   CI=1 NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS=pri_test npx playwright test e2e/account-pass.spec.ts --project=chromium --retries=0
 *
 * The inverse (nothing shown while it is off) is in audiences.spec.ts and runs on every build.
 */
test.skip(
  !process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS,
  "needs a build made with NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS set",
);

test("pricing shows the Account Pass as a fourth card, with its price and its promise", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByText("Account Pass").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Get the Account Pass" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get the Appeal Pass" })).toBeVisible();
  await expect(page.getByText("As many cases as you have, for 12 months")).toBeVisible();
  await expect(page.getByText("$329", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$249", { exact: true }).first()).toBeVisible();
});

test("the picker starts on the Appeal Pass and the card button moves it to the Account Pass", async ({
  page,
}) => {
  await page.goto("/pricing");
  // The list is called "What to buy" once the AI document review (not a Pass) is in it too.
  const picker = page.getByRole("group", { name: /^(Which Pass\?|What to buy)$/ });
  await expect(picker.getByRole("radio", { name: /Appeal Pass/ })).toBeChecked();
  await expect(picker.getByRole("radio", { name: /Account Pass/ })).not.toBeChecked();
  const summary = page.locator("dl").filter({ hasText: "Total, once" });
  await expect(summary.getByText("$249.00").first()).toBeVisible();
  await expect(summary.getByText("Never")).toBeVisible();

  await page.getByRole("link", { name: "Get the Account Pass" }).click();
  await expect(picker.getByRole("radio", { name: /Account Pass/ })).toBeChecked();
  await expect(summary.getByText("$329.00").first()).toBeVisible();
  await expect(summary.getByText("12 months after you buy")).toBeVisible();
  await expect(page.getByText("Other sellers' cases need their own cover")).toBeVisible();

  // and back: choosing the Appeal Pass again restores its summary
  await picker.getByRole("radio", { name: /Appeal Pass/ }).check();
  await expect(summary.getByText("$249.00").first()).toBeVisible();
  await expect(page.getByText("Other sellers' cases need their own cover")).toHaveCount(0);
});

test("with no database the founding counter says nothing instead of guessing", async ({
  page,
  request,
}) => {
  await page.goto("/pricing");
  await expect(page.getByTestId("founding-note")).toHaveCount(0);
  const res = await request.get("/api/founding");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { spotsLeft: number | null };
  // either no founding code is configured or the count could not be read: never a made-up number
  if (!process.env.NEXT_PUBLIC_FOUNDING_CODE) expect(body.spotsLeft).toBeNull();
});

test("the FAQ, the Terms, the changelog and the partner page now describe it", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.getByText("What is the Account Pass?")).toBeVisible();
  await page.goto("/terms");
  await expect(
    page.getByText("The Account Pass is one licence for one seller's business"),
  ).toBeVisible();
  await page.goto("/changelog");
  await expect(page.getByText("The Account Pass is on sale")).toBeVisible();
  await page.goto("/partners");
  await expect(page.getByText("The same 30 percent applies to the Account Pass")).toBeVisible();
});

test("the pricing page with four cards has no serious accessibility violations and does not scroll sideways", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expectNoAxeViolations(page, { impacts: ["critical", "serious"] });
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
  }
});

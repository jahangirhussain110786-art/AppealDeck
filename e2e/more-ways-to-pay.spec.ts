import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * The products beyond the two Passes, as a visitor sees them once they are on sale (22 Oct 2026):
 * the AI document review, the renewal, case credits and the Pro plan, and the $25 rebate.
 *
 * `NEXT_PUBLIC_*` values are put into the build, so this can only be checked against a build made
 * with the prices set. It is skipped otherwise, which is the normal CI build. To run it:
 *
 *   export NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS=pri_a NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW=pri_r \
 *     NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW=pri_ar NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL=pri_n \
 *     NEXT_PUBLIC_PADDLE_PRICE_PACK_10=pri_p10 NEXT_PUBLIC_PADDLE_PRICE_PACK_30=pri_p30 \
 *     NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN=pri_pro NEXT_PUBLIC_REBATE_ENABLED=true
 *   npm run build
 *   CI=1 npx playwright test e2e/more-ways-to-pay.spec.ts --project=chromium --retries=0
 *
 * The inverse (nothing shown while they are off) is `src/content/__tests__/stage3Content.test.ts`
 * and runs on every build.
 */
test.skip(
  !(
    process.env.NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW &&
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW &&
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PACK_10 &&
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN &&
    process.env.NEXT_PUBLIC_REBATE_ENABLED === "true"
  ),
  "needs a build made with the stage 3 prices and NEXT_PUBLIC_REBATE_ENABLED=true",
);

test("pricing offers the review beside the Passes, and it is not called a Pass", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByRole("link", { name: "Get the AI reading" })).toBeVisible();
  const picker = page.getByRole("group", { name: "What to buy" });
  await expect(picker.getByRole("radio", { name: /AI document review/ })).not.toBeChecked();
  await expect(picker.getByRole("radio", { name: /Appeal Pass/ })).toBeChecked();

  const summary = page.locator("dl").filter({ hasText: "Total, once" });
  await page.getByRole("link", { name: "Get the AI reading" }).click();
  await expect(picker.getByRole("radio", { name: /AI document review/ })).toBeChecked();
  await expect(summary.getByText("$49.00").first()).toBeVisible();
  await expect(page.getByText("Your documents are read on your device for nothing")).toBeVisible();

  await picker.getByRole("radio", { name: /Appeal Pass/ }).check();
  await expect(summary.getByText("$249.00").first()).toBeVisible();
});

test("the professionals' page shows the packs and the Pro plan, and asks a visitor to sign in", async ({
  page,
}) => {
  await page.goto("/for-professionals");
  const cards = page.getByRole("list", { name: "Prices for writers and VA teams" });
  await expect(cards.getByText("10 credits for $390 ($39 a case)")).toBeVisible();
  await expect(cards.getByText("$349", { exact: true })).toBeVisible();
  await expect(cards.getByRole("link", { name: "Start the Pro plan" })).toHaveAttribute(
    "href",
    "#buy",
  );
  await expect(cards.getByRole("button", { name: "Opens soon" })).toHaveCount(0);
  await expect(page.getByText("Professional pricing is not set yet.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in to buy" })).toBeVisible();
  // no pay button until the account is known to be verified
  await expect(page.getByRole("button", { name: /Buy 10 credits|Start the Pro plan/ })).toHaveCount(
    0,
  );
});

test("the FAQ, the Terms, the Privacy policy, the changelog and the partner page describe them", async ({
  page,
}) => {
  await page.goto("/faq");
  await expect(page.getByText("What is the AI document review?")).toBeVisible();
  await expect(page.getByText("How do case credits and the Pro plan work?")).toBeVisible();
  await expect(
    page.getByText("Do I get money back for telling you how my case ended?"),
  ).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByText("A case credit gives one case an Appeal Pass")).toBeVisible();
  await expect(page.getByText("renews every month until you cancel it")).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByText("linked to your account so we know whom to refund")).toBeVisible();
  await page.goto("/changelog");
  await expect(page.getByText("A new AI document review")).toBeVisible();
  await page.goto("/partners");
  await expect(page.getByText("A partner's code applies to the Appeal Pass")).toBeVisible();
});

test("the pages with the new products have no accessibility violations", async ({ page }) => {
  for (const path of ["/pricing", "/for-professionals", "/partners"]) {
    await page.goto(path);
    await expectNoAxeViolations(page, { impacts: ["critical", "serious"] });
  }
});

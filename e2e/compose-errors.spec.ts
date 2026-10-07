import { expect, test, type Page } from "@playwright/test";

/**
 * 7 Oct 2026 (launch audit). Preparing a response is the step a seller has just paid for. When the
 * platform answered with an HTML error page (a gateway timeout), the page read it as JSON and
 * showed the browser's parse error, "Unexpected token '<'". It now says the service is not
 * available, and the seller's answers are untouched.
 */
const NOTICE =
  "Subject: Item condition complaints\nDate: 2 October 2026\n\nHello Seller,\n\nWe removed the following listing because customers complained that the item was used or not in the condition described.\n\nASIN: B09XK3J7QP\n\nItem condition complaints (Used Sold as New) are a violation of our Seller Code of Conduct. Submit a plan of action that explains what caused the complaints and the steps you have taken to prevent them. You may appeal within 30 days.\n\nSeller Performance Team";
const WENT_WRONG =
  "We listed returned items as new. Customer returns were put back into our new-condition stock without anyone opening the packaging, so four customers received opened items between 12 and 28 September.";
const FIXED =
  "Finished: on 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New. Finished: we checked every unit in stock on 3 October and moved 9 more returns to a returns shelf.";
const PREVENT =
  "Our warehouse lead opens and inspects every return before it can go back on sale, and records the result in a returns log. We audit 20 random new-condition units every Friday and the owner signs off the log monthly.";

async function signInAsDev(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test("a platform error page while preparing a response is not shown as a parse error", async ({
  page,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(120_000);
  await signInAsDev(page);

  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(NOTICE);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page
    .getByRole("link", { name: /open case workspace/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.getByRole("tab", { name: /^Response/i }).click();
  await page.getByLabel(/what went wrong/i).fill(WENT_WRONG);
  await page.getByLabel(/what have you fixed/i).fill(FIXED);
  await page.getByLabel(/how will you stop/i).fill(PREVENT);
  await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await expect(page.getByText(/Confirmed by you on/)).toBeVisible();

  // The licence question says "active"; compose then fails the way a gateway timeout does.
  await page.route("**/api/license/status**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "active" }),
    }),
  );
  await page.route("**/api/compose", (route) =>
    route.fulfill({
      status: 504,
      contentType: "text/html",
      body: "<html><body>An error occurred with your deployment</body></html>",
    }),
  );
  await page.getByRole("button", { name: /prepare working draft/i }).click();
  await expect(page.getByText(/not available right now/i)).toBeVisible();
  await expect(page.getByText(/Unexpected token/i)).toHaveCount(0);
  // Nothing the seller wrote was lost.
  await expect(page.getByLabel(/what went wrong/i)).toHaveValue(WENT_WRONG);
});

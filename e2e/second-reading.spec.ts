import { expect, test, type Page } from "@playwright/test";

/**
 * 9 Oct 2026: the AI second reading of a notice the rules could not place. The test server has no
 * AI key, so `/api/decode` is asked for real and the response is given the one field the model would
 * have added; what is under test is what the seller sees and what pressing the button does.
 */
const UNPLACED =
  "Subject: Action required on your seller account\n\nHello,\n\nWe noticed activity on your seller account that does not follow our program rules. Please review the details in Seller Central and respond within 7 days with an explanation of the activity.\n\nSeller Performance, Amazon";
const QUOTE = "does not follow our program rules";

async function withSecondReading(page: Page) {
  await page.route("**/api/decode", async (route) => {
    const real = await route.fetch();
    const body = await real.json();
    if (body.kind === "UNKNOWN") body.suggestedKind = { kind: "POLICY", quote: QUOTE };
    await route.fulfill({ response: real, json: body });
  });
}

test("the decode page shows the second reading in place of 'not clearly classified'", async ({
  page,
}) => {
  await withSecondReading(page);
  await page.goto("/decode");
  await page
    .getByRole("textbox", { name: /notice/i })
    .first()
    .fill(UNPLACED);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  const main = page.getByRole("main");
  await expect(main.getByText("Policy violation").first()).toBeVisible();
  await expect(main.getByText(`Read from: “${QUOTE}”`)).toBeVisible();
  await expect(main.getByText("Notice not clearly classified")).toHaveCount(0);
  // R-3: marked as an AI suggestion, and the record list says it follows that suggestion.
  await expect(main.getByText("AI suggestion: check it against your notice")).toBeVisible();
  await expect(main.getByText(/This list follows the AI suggestion above/)).toBeVisible();
});

test("with no second reading the decode page is exactly as before", async ({ page }) => {
  await page.goto("/decode");
  await page
    .getByRole("textbox", { name: /notice/i })
    .first()
    .fill(UNPLACED);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByRole("main").getByText("Notice not clearly classified")).toBeVisible();
  await expect(page.getByText(/Read from:/)).toHaveCount(0);
  await expect(page.getByText(/AI suggestion/)).toHaveCount(0);
});

test("the case page offers the reading, and applies it only when asked", async ({ page }) => {
  test.setTimeout(90_000);
  await withSecondReading(page);
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(UNPLACED);
  const offer = page.getByText("A closer reading suggests this is: Policy violation.");
  await expect(offer).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(`It says “${QUOTE}”`)).toBeVisible();
  // Not applied by itself: the summary still says the problem is not clear.
  await expect(page.getByText("Not clear yet")).toBeVisible();

  await page.getByRole("button", { name: "Use this reading" }).click();
  await expect(offer).toHaveCount(0);
  await expect(page.getByText("Policy violation").first()).toBeVisible();
});

test("the case page offers nothing when the notice was already placed", async ({ page }) => {
  await withSecondReading(page);
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Subject: Policy violation\n\nWe removed your listings for repeated policy violations. Submit a plan of action within 30 days.",
    );
  await page.waitForTimeout(2500);
  await expect(page.getByText(/A closer reading suggests/)).toHaveCount(0);
});

test("R-4: the case page stops asking once the server says the reading is off", async ({
  page,
}) => {
  test.setTimeout(90_000);
  let asked = 0;
  await page.route("**/api/decode", async (route) => {
    asked += 1;
    await route.fulfill({ json: { kind: "UNKNOWN", secondReading: "off", notes: [] } });
  });
  await page.goto("/case");
  const field = page.getByLabel("Amazon notice", { exact: true });
  await field.fill(UNPLACED);
  await expect.poll(() => asked, { timeout: 15_000 }).toBe(1);
  await field.fill(`${UNPLACED}\n\nRegards.`);
  await page.waitForTimeout(2500);
  expect(asked).toBe(1);
});

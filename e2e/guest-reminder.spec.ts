import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * The email reminder on the free decoder, for a visitor with no account (23 Oct 2026). The server
 * route is stubbed, because this checks what the visitor sees; the rules behind it (double opt-in,
 * one reminder, a stop link, no date today or past) are `guestReminders.test.ts`.
 *
 * The date is far ahead on purpose, so the test does not start failing when the calendar passes it.
 */
test.setTimeout(120_000);

const NOTICE_WITH_DATE =
  "Your selling privileges have been deactivated. You must submit a Plan of Action with your supplier invoices by 15 January 2036 to appeal this decision.";
const NOTICE_WITHOUT_DATE =
  "Your selling privileges have been deactivated because of late shipments. Please submit a Plan of Action explaining the root cause, the corrective actions and the preventive measures.";

async function decode(page: Page, text: string, ready: RegExp = /15 Jan 2036/) {
  await page.goto("/decode");
  await page
    .getByRole("textbox", { name: /notice/i })
    .first()
    .fill(text);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  // The result, not the page's own heading: the deadline chip carries the day the notice states, or
  // the result is still being read (a model, when configured, can take a few seconds).
  await expect(page.locator("main").getByText(ready).first()).toBeVisible({
    timeout: 60_000,
  });
}

test("a notice with a date ahead offers one reminder, asks for consent, and says what happens next", async ({
  page,
}) => {
  let sent: unknown = null;
  await page.route("**/api/guest-reminder", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { status: "pending" } });
  });
  await decode(page, NOTICE_WITH_DATE);

  const box = page.getByTestId("reminder-signup");
  await expect(
    box.getByRole("heading", { name: /Get one email reminder: 15 Jan 2036/ }),
  ).toBeVisible();
  await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });

  const submit = box.getByRole("button", { name: "Email me a reminder" });
  await expect(submit).toBeDisabled();
  await box.getByLabel("Your email address").fill("seller@example.com");
  await expect(submit).toBeDisabled(); // consent not yet given
  await box.getByLabel(/Send me a confirmation email and one reminder/).check();
  await submit.click();

  await expect(box.getByText(/Check your inbox/)).toBeVisible();
  await expect(box.getByText(/The reminder is set once you click it/)).toBeVisible();
  // Only the address, the kind and the day travel; the notice does not.
  expect(sent).toMatchObject({ email: "seller@example.com", dueOn: "2036-01-15", consent: true });
  expect(JSON.stringify(sent)).not.toContain("supplier invoices");
});

test("a refused request says why, and the decode is untouched", async ({ page }) => {
  await page.route("**/api/guest-reminder", (route) =>
    route.fulfill({ status: 503, json: { error: "Email reminders are not available right now." } }),
  );
  await decode(page, NOTICE_WITH_DATE);
  const box = page.getByTestId("reminder-signup");
  await box.getByLabel("Your email address").fill("seller@example.com");
  await box.getByLabel(/Send me a confirmation email/).check();
  await box.getByRole("button", { name: "Email me a reminder" }).click();
  await expect(box.getByRole("alert")).toContainText("not available right now");
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
});

test("a notice with no stated date offers no reminder", async ({ page }) => {
  await decode(page, NOTICE_WITHOUT_DATE, /Do now/);
  await expect(page.getByTestId("reminder-signup")).toHaveCount(0);
});

const TOKEN = "ab".repeat(24);

test("the link in the email confirms only when the button is pressed", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/guest-reminder/confirm", async (route) => {
    calls += 1;
    await route.fulfill({ json: { status: "confirmed" } });
  });
  await page.goto(`/reminder?do=confirm&token=${TOKEN}`);
  await expect(page.getByRole("heading", { name: "Confirm your reminder" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(calls).toBe(0); // opening the link, as a mail scanner would, does nothing
  await page.getByRole("button", { name: "Confirm my reminder" }).click();
  await expect(page.getByRole("status")).toContainText("You will get one reminder");
  expect(calls).toBe(1);
  await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });
});

test("the stop link stops only when pressed, and a bad link changes nothing", async ({ page }) => {
  await page.route("**/api/guest-reminder/stop", (route) =>
    route.fulfill({ json: { status: "stopped" } }),
  );
  await page.goto(`/reminder?do=stop&token=${TOKEN}`);
  await expect(page.getByRole("heading", { name: "Stop reminders" })).toBeVisible();
  await page.getByRole("button", { name: "Stop all reminders" }).click();
  await expect(page.getByRole("status")).toContainText("No more reminders will be sent");

  await page.goto("/reminder?do=confirm&token=not-a-token");
  await expect(page.getByText(/not valid or has already been used up/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Confirm my reminder|Stop all reminders/ }),
  ).toHaveCount(0);
});

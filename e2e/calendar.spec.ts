import { expect, test } from "@playwright/test";

/**
 * The dashboard's deadline card offers a calendar file. The notice is dated relative to today so
 * the test does not stop working when a fixed date passes.
 */
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

test("the dashboard offers the case's dates as a calendar file", async ({ page }) => {
  const due = inDays(20);
  const notice = `Subject: Verify your identity\nDate: ${inDays(-1)}\n\nWe need to verify your identity. Please provide a government-issued photo ID and proof of address by ${due}.`;
  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(notice);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page
    .getByRole("link", { name: /open case workspace/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.goto("/dashboard");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Add these dates to my calendar" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("appealdeck-case-dates.ics");
  const path = await download.path();
  const text = (await import("node:fs")).readFileSync(path, "utf8");
  expect(text).toContain("BEGIN:VEVENT");
  expect(text).toContain("DTSTART;VALUE=DATE:");
  expect(text).toContain("TRIGGER:-P1D");
});

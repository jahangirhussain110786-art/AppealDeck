import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_NOTICE_TEXT } from "../src/content/sampleNotice";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

async function decodeSample(page: Page) {
  await page.goto("/decode");
  await page.getByRole("button", { name: "Try a sample notice" }).click();
  const decoded = page.waitForResponse(
    (response) => response.url().endsWith("/api/decode") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  const result = await (await decoded).json();
  expect(result).toMatchObject({ kind: "POLICY", severityGated: false });
  // The sample carries no header date, so the window is stated relative to receipt rather than
  // dated. Before 23 Sep 2026 this read "90 days from notice" beside "Date not stated".
  expect(result.deadlines).toContainEqual(
    expect.objectContaining({
      dueAt: null,
      label: "Appeal window: 90 days",
      startsOnReceipt: true,
    }),
  );
  await expect(page.getByRole("navigation", { name: "Case workspace views" })).toBeVisible();
  // `.first()` added 22 Sep 2026: AA-39 gave the decode result a "Details we found in your notice"
  // strip that also names the requested record, so this exact-text match now resolves to two
  // elements and fails Playwright's strict mode. Both occurrences are correct; the assertion only
  // cares that the decode result names the record at all.
  await expect(page.getByText("Supplier invoice", { exact: true }).first()).toBeVisible();
}

for (const view of ["Overview", "Evidence", "Response", "History"]) {
  test(`sample → ${view} retains the notice across navigation and immediate reload`, async ({
    page,
  }) => {
    await decodeSample(page);
    if (view === "Overview") {
      await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("html")).toHaveClass(/dark/);
      await page.screenshot({
        path: "test-results/decode-workspace-entry.png",
        fullPage: true,
        animations: "disabled",
      });
    }
    await page
      .getByRole("navigation", { name: "Case workspace views" })
      .getByRole("link", { name: view, exact: true })
      .click();
    await expect(page.getByRole("tab", { name: view, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByText("Your decoded notice is saved in this case", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Overview", exact: true }).click();
    await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(SAMPLE_NOTICE_TEXT);
    await expect(page.getByText("Review your decoded request", { exact: true })).toBeVisible();
    if (view === "Overview") {
      await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
      await page.screenshot({
        path: "test-results/decode-workspace-import.png",
        fullPage: true,
        animations: "disabled",
      });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: "test-results/workspace-import-mobile.png",
        fullPage: true,
        animations: "disabled",
      });
    }
    await expect(page.getByRole("complementary", { name: "Case context" })).toContainText("90");
    await expect(page.getByRole("button", { name: "Add workspace to this case" })).toHaveCount(0);
    await page.getByRole("tab", { name: "Evidence", exact: true }).click();
    await expect(
      page
        .getByRole("tabpanel", { name: "Evidence", exact: true })
        .getByText("Supplier invoice", { exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Response", exact: true }).click();
    await expect(page.getByText("Professional review needed", { exact: true })).toHaveCount(0);
  });
}

test("saved notice can be edited by keyboard without losing edits between workspace views", async ({
  page,
}) => {
  await decodeSample(page);
  await page.getByRole("link", { name: "Open case workspace", exact: true }).click();
  const notice = page.getByLabel("Amazon notice", { exact: true });
  await expect(notice).not.toBeVisible();
  const disclosure = page.locator("summary").filter({ hasText: "Read or edit your notice" });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(notice).toBeVisible();
  const edited = SAMPLE_NOTICE_TEXT + "\nPlease also include the supplier contact details.";
  await notice.fill(edited);
  await expect(page.getByText(/Unsaved notice edits/)).toBeVisible();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(notice).toHaveValue(edited);
  await page.getByRole("button", { name: "Save for later" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(notice).toHaveValue(edited);
});

test("re-entering the same decoded sample resumes edited work and creates no duplicate", async ({
  page,
}) => {
  await decodeSample(page);
  await page.getByRole("link", { name: "Open case workspace", exact: true }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page
    .getByLabel("Your factual explanation")
    .fill("My saved explanation must survive opening this decoded notice again.");
  await page.getByRole("button", { name: "Save response facts" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
  await decodeSample(page);
  await page
    .getByRole("navigation", { name: "Case workspace views" })
    .getByRole("link", { name: "Response", exact: true })
    .click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(/My saved explanation/);
  await page.goto("/dashboard");
  await expect(page.getByText("Your case, at a glance", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Current case")).toHaveCount(0);
});

test("a decoded notice starts a second case without destroying the first", async ({ page }) => {
  // Rewritten 22 Sep 2026: the classic interview was retired, so the older case is now a workspace
  // case rather than an interview one. The guarantee is unchanged and is the point of the test —
  // starting a new case from a decode must never overwrite work already on the device.
  const firstNotice = "The saved earlier case concerns a separate supplier issue.";
  await page.goto("/case?kind=POLICY");
  await page.getByLabel("Amazon notice").fill(firstNotice);
  await page.getByLabel("Amazon notice").blur();
  await page.waitForTimeout(1500);

  await decodeSample(page);
  await page
    .getByRole("navigation", { name: "Case workspace views" })
    .getByRole("link", { name: "Overview", exact: true })
    .click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(SAMPLE_NOTICE_TEXT);

  await page.goto("/dashboard");
  const cases = page.getByRole("region", { name: "Your cases" }).getByRole("button");
  await expect(cases).toHaveCount(2);
  await cases.filter({ hasNotText: "Current" }).click();
  await page.goto("/case");
  await expect(page.getByLabel("Amazon notice")).toHaveValue(firstNotice);
});

/**
 * 23 Sep 2026, founder direction: use the date only when the notice itself carries it, otherwise say
 * the window runs from the day it was received — and never invent one. These check what the seller
 * actually reads, because the defect was in what reached the screen.
 */
test("a window is dated from the notice's own header, and described plainly when there is none", async ({
  page,
}) => {
  const decode = async (text: string) => {
    await page.goto("/decode");
    await page.locator("#notice").fill(text);
    const decoded = page.waitForResponse(
      (r) => r.url().endsWith("/api/decode") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    return (await decoded).json();
  };

  // A copied email carries its date. The window is counted from it, and the date shown can be
  // checked against the seller's own inbox.
  const dated = await decode(
    [
      "From: Amazon Seller Performance",
      "Date: Tue, 1 Sep 2026 09:12:00 -0700",
      "Subject: Your Amazon selling account",
      "",
      "Your Amazon seller account has been deactivated for repeated policy violations.",
      "You may appeal within 30 days. Submit your Plan of Action through Account Health in Seller Central.",
    ].join("\n"),
  );
  expect(dated.deadlines).toContainEqual(
    expect.objectContaining({
      label: "Appeal window: 30 days from 1 Sep 2026",
      startsOn: "2026-09-01",
      dueAt: "2026-10-01T00:00:00.000Z",
    }),
  );
  await expect(page.getByText("Appeal window: 30 days from 1 Sep 2026")).toBeVisible();

  // The same notice without its header. The length is still shown; the start is not invented.
  const undated = await decode(
    [
      "Your Amazon seller account has been deactivated for repeated policy violations.",
      "You may appeal within 30 days. Submit your Plan of Action through Account Health in Seller Central.",
    ].join("\n"),
  );
  expect(undated.deadlines).toContainEqual(
    expect.objectContaining({
      label: "Appeal window: 30 days",
      dueAt: null,
      startsOnReceipt: true,
    }),
  );
  await expect(page.getByText("From the day you received this notice")).toBeVisible();
  await expect(page.getByText("Date not stated")).toHaveCount(0);
});

/**
 * 23 Sep 2026. A notice that names its last day was shown as having no fixed window, because only
 * "within N days" was read. Run from Los Angeles because the date is stored as midnight UTC on its
 * day, and the chip used to format that instant in the seller's own zone — the day before, anywhere
 * west of Greenwich.
 */
test.describe("a last day the notice states as a date", () => {
  test.use({ timezoneId: "America/Los_Angeles" });

  test("is shown as the notice gives it, on the right day", async ({ page }) => {
    await page.goto("/decode");
    await page
      .locator("#notice")
      .fill(
        [
          "Your Amazon seller account has been deactivated for repeated policy violations.",
          "Please submit your Plan of Action through Account Health in Seller Central by 1 October 2026.",
        ].join("\n"),
      );
    const decoded = page.waitForResponse(
      (r) => r.url().endsWith("/api/decode") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    const body = await (await decoded).json();

    expect(body.deadlines).toContainEqual(
      expect.objectContaining({ label: "Appeal by 1 Oct 2026", dueOn: "2026-10-01" }),
    );
    await expect(page.getByText("Appeal by 1 Oct 2026")).toBeVisible();
    await expect(page.getByText(/^1 Oct 2026 ·/)).toBeVisible();
    await expect(page.getByText(/30 Sep 2026/)).toHaveCount(0);
  });
});

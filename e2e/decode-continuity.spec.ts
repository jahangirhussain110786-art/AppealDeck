import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_NOTICE_TEXT } from "../src/content/sampleNotice";
import AxeBuilder from "@axe-core/playwright";

async function decodeSample(page: Page) {
  await page.goto("/decode");
  await page.getByRole("button", { name: "Try a sample notice" }).click();
  const decoded = page.waitForResponse(
    (response) => response.url().endsWith("/api/decode") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  const result = await (await decoded).json();
  expect(result).toMatchObject({ kind: "POLICY", severityGated: false });
  expect(result.deadlines).toContainEqual(
    expect.objectContaining({ dueAt: null, label: "Appeal window: 90 days from notice" }),
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
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
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
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
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

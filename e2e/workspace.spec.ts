import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { composePoa, critiquePoa, renderPoaText } from "../src/core/composer";

const notice =
  "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.";
async function configure(page: Page) {
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(notice);
  await page
    .getByLabel("Current response instructions")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByRole("button", { name: "Review evidence plan" })).toBeVisible();
}
async function reviewEvidence(page: Page) {
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Supplier invoice", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I’m waiting for information" }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Waiting for information", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Draft a request" }).click();
  await expect(page.getByText("Request to the record issuer", { exact: true })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "supplier-invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% fictional test invoice\n%%EOF"),
    });
  await expect(page.getByRole("button", { name: "Read original" })).toBeVisible();
  await page
    .getByLabel("What does this record support or leave unclear?")
    .fill("Page 1 identifies the supplier, the purchase date and product code J-104.");
  await page
    .getByLabel("I checked the original, its page reference and the facts recorded here.")
    .check();
  await page.getByRole("button", { name: "Save evidence review" }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Reviewed by you", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel(
      "I checked the notice and response page, and this list covers all requested records.",
    )
    .click();
  await expect(
    page.getByLabel(
      "I checked the notice and response page, and this list covers all requested records.",
    ),
  ).toBeChecked();
}

test("workspace persists a sourced evidence plan, waiting state and factual review", async ({
  page,
}) => {
  await configure(page);
  await reviewEvidence(page);
  await page.reload();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByText("Reviewed by you", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("What does this record support or leave unclear?")).toHaveValue(
    /J-104/,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "test-results/workspace-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await page.screenshot({
    path: "test-results/workspace-evidence.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/workspace-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Your case, at a glance", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue your case" })).toBeVisible();
});

test("switching views retains unfinished text and a separate case preserves saved work", async ({
  page,
}) => {
  await configure(page);
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page
    .getByLabel("Your factual explanation")
    .fill("My unfinished response facts stay here while I consult the saved request.");
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(
    /unfinished response facts/,
  );
  await page.getByRole("button", { name: "Save response facts" }).click();
  await page.getByRole("button", { name: "New case", exact: true }).click();
  await page.getByRole("button", { name: "Create separate case" }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toBeEmpty();
  await page.goto("/dashboard");
  await expect(page.getByLabel("Current case").locator("option")).toHaveCount(2);
  const options = await page
    .getByLabel("Current case")
    .locator("option")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value));
  const current = await page.getByLabel("Current case").inputValue();
  await page.getByLabel("Current case").selectOption(options.find((id) => id !== current)!);
  await page.getByRole("link", { name: "Continue your case" }).click();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByLabel("Your factual explanation")).toHaveValue(
    /unfinished response facts/,
  );
});

test("unsaved edits are never reported as saved, and survive the sign-in redirect", async ({
  page,
}) => {
  await configure(page);
  await page.reload();
  await page.getByRole("button", { name: "Review the request" }).click();
  const draftText = "Also explain the corrective packaging change made on receipt.";
  await page.getByLabel("Current response instructions").fill(draftText);
  await expect(page.getByText("Unsaved changes", { exact: false })).toBeVisible();
  await expect(page.getByText("Changes saved", { exact: true })).toHaveCount(0);
  await page
    .getByRole("complementary", { name: "Case context" })
    .getByRole("link", { name: "Sign in" })
    .click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goBack();
  await page.getByRole("button", { name: "Review the request" }).click();
  await expect(page.getByLabel("Current response instructions")).toHaveValue(
    new RegExp(draftText.slice(0, 20)),
  );
});

test("informational updates avoid a purchase flow and replies reopen the request", async ({
  page,
}) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your response remains under review. No additional information is required at this stage.",
    );
  await page.getByLabel("Current response instructions").fill("No action requested.");
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("No new response is requested", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByRole("button", { name: "Prepare response", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByLabel("Add Amazon’s next reply").fill(notice);
  await page.getByRole("button", { name: "Save reply for review" }).click();
  await page.getByRole("button", { name: "Use reply for a new revision" }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(notice);
  await expect(page.getByLabel("Current response instructions")).toBeEmpty();
});

test("starting from Decode carries the notice into a separate case", async ({ page }) => {
  await configure(page);
  await page.goto("/decode");
  const nextNotice =
    "Performance Notification from Amazon Seller Central: your account has been deactivated for policy violation. Your selling privileges have been removed. Submit a Plan of Action addressing each ASIN affected and the account health issue described in this notice.";
  await page.getByPlaceholder(/paste/i).fill(nextNotice);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByRole("link", { name: "Open case workspace", exact: true }).click();
  await expect(page.getByLabel("Amazon notice", { exact: true })).toHaveValue(nextNotice);
  await page.goto("/dashboard");
  await expect(page.getByLabel("Current case").locator("option")).toHaveCount(2);
});

test("authenticated workspace preserves the exact response through submission and a new reply", async ({
  page,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  test.setTimeout(90000);
  await configure(page);
  await reviewEvidence(page);
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/case?view=response");
  await page
    .getByLabel("Your factual explanation")
    .fill(
      "The supplier invoice identifies the product by code J-104 and records the purchase. The product code corresponds to the affected listing.",
    );
  await page.getByRole("button", { name: "Save response facts" }).click();
  await page.route("**/api/compose", async (route) => {
    const { caseData, attemptNumber } = route.request().postDataJSON();
    const draft = composePoa(caseData, attemptNumber);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        draft,
        critique: critiquePoa(draft, caseData),
        rendered: renderPoaText(draft),
      }),
    });
  });
  await page.getByRole("button", { name: "Prepare response", exact: true }).click();
  await expect(page.getByText("Review the exact response", { exact: true })).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: "Response to the document request" }),
  ).not.toContainText("Root Cause");
  await page
    .getByLabel(
      "I reviewed the facts, attachment names and page references against the current response form.",
    )
    .check();
  await page
    .getByLabel(
      "I have submitted this exact response and its selected files through the official channel.",
    )
    .check();
  await page.getByRole("button", { name: "Record submission", exact: true }).click();
  await expect(page.getByText(/Attempt 1 ·/)).toBeVisible();
  await page
    .getByLabel("Add Amazon’s next reply")
    .fill(
      "Please provide the sales report for the affected product, showing the relevant sales period.",
    );
  await page.getByRole("button", { name: "Save reply for review" }).click();
  await page.getByRole("button", { name: "Use reply for a new revision" }).click();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByText(/Attempt 1 ·/).click();
  await expect(
    page.locator("pre").filter({ hasText: "Response to the document request" }),
  ).toContainText("J-104");
  await page.reload();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByText(/Attempt 1 ·/)).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";

/**
 * The 12 Oct 2026 growth plan, batches A to C (docs/handoffs/2026-10-10-growth-do-and-not-do.md
 * §0.1): the wording and signals a first-time seller reads on /decode and at the response gate.
 */

async function decode(page: Page, text: string) {
  await page.goto("/decode");
  await page
    .getByRole("textbox", { name: /notice/i })
    .first()
    .fill(text);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.locator("main").getByRole("heading", { level: 2 }).first()).toBeVisible();
}

test("a notice with no date and no window says so instead of calling it ambiguous (G-87)", async ({
  page,
}) => {
  await decode(
    page,
    "Amazon Seller Performance. Your listing for ASIN B0EXAMPLE2 was removed because the detail page violates our product policy. Please submit a Plan of Action in Account Health.",
  );
  const main = page.locator("main");
  await expect(main.getByText(/No deadline is written in this notice/).first()).toBeVisible();
  await expect(main.getByText(/ambiguous/i)).toHaveCount(0);
});

test("a verification notice says first that it is not an appeal (G-100)", async ({ page }) => {
  await decode(
    page,
    "Amazon Seller Support. We do not have sufficient information to complete your identity verification. Please schedule a video call and have your government ID ready. Your selling account is deactivated until verification is complete.",
  );
  await expect(
    page
      .locator("main")
      .getByText(/This is not an appeal\. A Plan of Action is usually the wrong reply/),
  ).toBeVisible();
});

test("a complaint about products that names no ASIN tells the seller to ask which (G-13)", async ({
  page,
}) => {
  await decode(
    page,
    "Amazon Seller Performance. We have received complaints from customers about the authenticity of products you sold. Your selling privileges have been removed. To appeal, submit a Plan of Action with supplier invoices from the last 365 days.",
  );
  await expect(
    page
      .locator("main")
      .getByText(/Your first message should ask Amazon which ASINs and which complaint/),
  ).toBeVisible();
});

test("the guest response gate shows the price where the seller decides (G-30)", async ({
  page,
}) => {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Please send us supplier invoices for ASIN B0EXAMPLE2 issued in the last 365 days. Provide the following by 20 October 2026.",
    );
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByRole("link", { name: /Sign in to prepare your response/ })).toBeVisible();
  await expect(
    page.getByText("Then $249 once for this case. Everything above stays free."),
  ).toBeVisible();
});

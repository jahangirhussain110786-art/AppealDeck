import { expect, test } from "@playwright/test";

for (const path of ["/faq", "/pricing"]) {
  test(`${path}: topics and answers work by keyboard and lead to the free decoder`, async ({
    page,
  }) => {
    await page.goto(path);
    const start = page.getByRole("tab", { name: "Getting started", exact: true });
    await expect(start).toHaveAttribute("aria-selected", "true");
    await start.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Your response", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Files & privacy", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const files = page.getByRole("button", { name: "Where are my files saved?", exact: true });
    await expect(files).toHaveAttribute("aria-expanded", "true");
    const processing = page.getByRole("button", { name: "What leaves my browser?", exact: true });
    await processing.focus();
    await page.keyboard.press("Enter");
    await expect(files).toHaveAttribute("aria-expanded", "false");
    await expect(processing).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("link", { name: "How processing works", exact: true }),
    ).toHaveAttribute("href", "/privacy#how-we-use");

    await page.getByRole("tab", { name: "Pass & refunds", exact: true }).click();
    await expect(page.getByText(/The pass is \$199 once, with no subscription/)).toBeVisible();
    await page.getByRole("button", { name: "What is your refund policy?", exact: true }).click();
    await expect(
      page.getByText("You can request a refund within 7 days of purchase.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Read the refund policy", exact: true }),
    ).toHaveAttribute("href", "/refund");
    await start.click();
    await page.getByRole("link", { name: "Try the free decoder", exact: true }).click();
    await expect(page).toHaveURL(/\/decode$/);
  });
}

test("pricing keeps the expectations visible before an unchecked delivery consent", async ({
  page,
}) => {
  await page.goto("/pricing");
  const expectations = page.getByRole("region", { name: "How AppealDeck helps" });
  await expect(
    expectations.getByText("Amazon decides the outcome. Review times vary.", { exact: true }),
  ).toBeVisible();
  await expect(expectations.getByText(/Decoding sends your notice to AppealDeck/)).toBeVisible();
  await expect(
    expectations.getByText(/An Appeal Pass is required for eligible cases/),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Review delivery consent to continue", exact: true }),
  ).toBeDisabled();
  expect(
    await expectations.evaluate((el) =>
      Boolean(
        el.compareDocumentPosition(document.getElementById("eu-consent")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
  ).toBe(true);
});

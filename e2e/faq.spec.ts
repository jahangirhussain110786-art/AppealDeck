import { expect, test } from "@playwright/test";

/**
 * 25 Sep 2026: the FAQ was tabs holding accordions, which kept 12 of its 13 answers out of the
 * page's HTML, so search engines could read none of them. Every answer must now be in the
 * document before anyone clicks, and each question opens by keyboard.
 */
test("/faq: every answer is in the page before any click, and questions open by keyboard", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/faq")).text();
  for (const answer of [
    "Decode the notice, build the record and write your answers — all free.",
    "Original files are encrypted in your vault on this device.",
    "You can request a refund within 14 days of purchase.",
  ]) {
    expect(html, answer).toContain(answer);
  }
  expect(html).toContain('"@type":"FAQPage"');

  await page.goto("/faq");
  for (const topic of [
    "Getting started",
    "Your response",
    "Files & privacy",
    "Pass, refunds & partners",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: topic, exact: true })).toBeVisible();
  }
  const processing = page.locator("summary", { hasText: "What leaves my browser?" });
  await processing.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "How processing works", exact: true }),
  ).toHaveAttribute("href", "/privacy#how-we-use");

  await page.locator("summary", { hasText: "What can I do for free?" }).click();
  await page.getByRole("link", { name: "Try the free decoder", exact: true }).click();
  await expect(page).toHaveURL(/\/decode$/);
});

test("/pricing shows only the buyer's questions, not the whole FAQ", async ({ page }) => {
  await page.goto("/pricing");
  await expect(
    page.locator("summary", { hasText: "What does the Appeal Pass add?" }),
  ).toBeVisible();
  await page.locator("summary", { hasText: "What is your refund policy?" }).click();
  await expect(
    page.getByRole("link", { name: "Read the refund policy", exact: true }),
  ).toHaveAttribute("href", "/refund");
  await expect(page.locator("summary", { hasText: "How does the decoder work?" })).toHaveCount(0);
});

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
  // Signed out, the page asks for the sign-in that returns here instead of offering a pay button
  // that cannot finish (24 Oct 2026).
  await expect(page.getByRole("link", { name: "Sign in to buy", exact: true })).toHaveAttribute(
    "href",
    "/login?next=%2Fpricing%3Fplan%3Dcase%23purchase",
  );
  expect(
    await expectations.evaluate((el) =>
      Boolean(
        el.compareDocumentPosition(document.getElementById("eu-consent")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
  ).toBe(true);
});

// Paddle review (12 Oct 2026): the box the buyer ticks says they have read the Terms and the Refund
// policy, and both names are links that leave the checkout page where it is.
test("the checkout consent names the Terms and the Refund policy as links", async ({ page }) => {
  await page.goto("/pricing");
  const row = page.locator("label[for='eu-consent']");
  await expect(row).toContainText("I have read the Terms and the Refund policy.");
  const terms = row.getByRole("link", { name: "Terms", exact: true });
  const refund = row.getByRole("link", { name: "Refund policy", exact: true });
  await expect(terms).toHaveAttribute("href", "/terms");
  await expect(terms).toHaveAttribute("target", "_blank");
  await expect(refund).toHaveAttribute("href", "/refund");
  await expect(refund).toHaveAttribute("target", "_blank");
  // Following a link must not tick the box.
  await expect(page.getByRole("checkbox")).not.toBeChecked();
});

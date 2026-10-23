import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * The two comparison pages (23 Oct 2026): each renders, carries its date and the product's limits,
 * is reachable from the guides index and the footer, and stays off the decoder's list of guides to
 * kinds of notice.
 */
const PAGES = [
  { slug: "chatgpt-for-amazon-appeals", h1: "Can ChatGPT write an Amazon appeal?" },
  { slug: "appealspro-alternative", h1: "An AppealsPro alternative: how AppealDeck differs" },
] as const;

for (const p of PAGES) {
  test(`/guides/${p.slug} renders with its date, its limits and no accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`/guides/${p.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: p.h1 })).toBeVisible();
    await expect(page.getByText("Last verified")).toBeVisible();
    await expect(page.getByText("What it does not do")).toBeVisible();
    await expect(page.getByRole("link", { name: "Paste your notice — free" })).toBeVisible();
    await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });
  });
}

test("the guides index lists both, and the decoder's list of notice guides does not", async ({
  page,
}) => {
  await page.goto("/guides");
  for (const p of PAGES)
    await expect(page.locator(`a[href="/guides/${p.slug}"]`).first()).toBeVisible();
  await page.goto("/decode");
  for (const p of PAGES)
    await expect(page.locator(`main a[href="/guides/${p.slug}"]`)).toHaveCount(0);
});

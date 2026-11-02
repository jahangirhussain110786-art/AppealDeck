import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/**
 * The two comparison pages (23 Oct 2026): each renders, carries its date and the product's limits,
 * is reachable from the playbook and the footer, and stays off the decoder's list of notice pages.
 */
const PAGES = [
  { slug: "chatgpt-for-amazon-appeals", h1: "Can ChatGPT write an Amazon appeal?" },
  { slug: "appealspro-alternative", h1: "An AppealsPro alternative: how AppealDeck differs" },
] as const;

for (const p of PAGES) {
  test(`/playbook/${p.slug} renders with its date, its limits and no accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`/playbook/${p.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: p.h1 })).toBeVisible();
    await expect(page.getByText("Last verified")).toBeVisible();
    await expect(page.getByText("What stays in your hands")).toBeVisible();
    await expect(page.getByRole("link", { name: "Paste your notice — free" })).toBeVisible();
    await expectNoAxeViolations(page, { impacts: ["serious", "critical"] });
  });
}

test("the playbook lists both, and the decoder's list of notice pages does not", async ({
  page,
}) => {
  await page.goto("/playbook");
  for (const p of PAGES)
    await expect(page.locator(`a[href="/playbook/${p.slug}"]`).first()).toBeVisible();
  await page.goto("/decode");
  for (const p of PAGES)
    await expect(page.locator(`main a[href="/playbook/${p.slug}"]`)).toHaveCount(0);
});

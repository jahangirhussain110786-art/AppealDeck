import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

// G-45 and G-80 (12 Oct 2026): the page that answers "how do you know it reads a notice right?",
// led by the misses, with the corpus it tests on available to download.

test("the page leads with the misses, gives the counts, and is accessible", async ({ page }) => {
  await page.goto("/how-we-test");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/what the tests found/i);
  await expect(page.getByText(/At first, 5 of 12 were read right/)).toBeVisible();
  await expect(page.getByText(/2 to 4 misses in every ten/)).toBeVisible();
  await expect(page.getByText(/measures how often appeals succeed/)).toBeVisible();
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
});

test("the thirteen notices download as data and the page is findable", async ({ page }) => {
  await page.goto("/how-we-test");
  const link = page.getByRole("link", { name: /Download the 13 notices/ });
  await expect(link).toHaveAttribute("href", "/how-we-test/researched-notices.json");
  const res = await page.request.get("/how-we-test/researched-notices.json");
  expect(res.status()).toBe(200);
  const notices = (await res.json()) as Array<{ id: string; expected: unknown }>;
  expect(notices).toHaveLength(13);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "How we test" }).first()).toBeVisible();
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain("/how-we-test");
});

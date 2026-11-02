import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

/**
 * Notes (2 Nov 2026): short, free pieces beside the guides. Each one must be readable signed out,
 * dated, bounded by the scope notice, and reachable from the footer and the guides index.
 */

test("the notes index lists every note and opens it", async ({ page }) => {
  await page.goto("/notes");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/notes/i);

  const first = page.getByRole("link", { name: /Keep the notice exactly as it arrived/i });
  await expect(first).toBeVisible();
  await expect(
    page.getByRole("link", { name: /When Amazon sends a questionnaire/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /What to keep after you submit an appeal/i }),
  ).toBeVisible();

  // The index hands over to the longer guides.
  await expect(page.getByRole("link", { name: "All guides" })).toHaveAttribute("href", "/guides");

  await first.click();
  await expect(page).toHaveURL(/\/notes\/keep-the-notice-as-it-arrived$/);
});

test("a note is dated, says one thing to remember, and keeps the boundary", async ({ page }) => {
  await page.goto("/notes/answering-a-questionnaire");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/questionnaire/i);
  await expect(page.getByText(/Published/)).toBeVisible();
  await expect(page.getByText("In short")).toBeVisible();
  await expect(page.getByText(/One question, one answer/)).toBeVisible();

  // The way out: the free decoder, the other notes and the guides.
  await expect(page.getByRole("link", { name: "Paste your notice — free" })).toHaveAttribute(
    "href",
    "/decode",
  );
  await expect(page.getByRole("link", { name: "All notes" })).toHaveAttribute("href", "/notes");
  await expect(page.getByRole("link", { name: "All guides" })).toHaveAttribute("href", "/guides");
  await expect(
    page.getByRole("link", { name: /How to write an Amazon Plan of Action/ }),
  ).toBeVisible();

  // The scope notice names the limit in words, and is not typed into the page.
  await expect(
    page.getByText(/These notes are general information, not legal advice/),
  ).toBeVisible();
  await expect(page.getByText(/Amazon decides every appeal/)).toBeVisible();
});

test("notes are reachable from the footer and listed for search engines", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Notes", exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Guides", exact: true })).toBeVisible();

  // The guides index points at the notes, and the notes at the guides.
  await page.goto("/guides");
  await expect(page.getByRole("link", { name: "Read the notes" })).toHaveAttribute(
    "href",
    "/notes",
  );

  const sitemap = await page.request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("/notes");
  expect(xml).toContain("/notes/keep-the-notice-as-it-arrived");
});

test("the index and a note pass the accessibility check", async ({ page }) => {
  await page.goto("/notes");
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  await page.goto("/notes/what-to-keep-after-you-submit");
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
});

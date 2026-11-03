import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

/**
 * The Playbook (2 Nov 2026): one index for every notice page, the comparisons and the short notes.
 * A reader picks by kind of notice, by whether they are weighing a tool, or by the short notes;
 * every row says how long it takes and when it was last checked.
 */

test("the playbook groups the library and opens a note", async ({ page }) => {
  await page.goto("/playbook");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/playbook/i);

  const notices = page.getByRole("region", { name: "By notice type" });
  const choosing = page.getByRole("region", { name: "Weighing your options" });
  const notes = page.getByRole("region", { name: "Notes" });

  await expect(
    notices.getByRole("link", { name: /Your Amazon account was deactivated/ }),
  ).toBeVisible();
  await expect(
    choosing.getByRole("link", { name: /Can ChatGPT write an Amazon appeal/ }),
  ).toBeVisible();

  // Every row carries its length and its date. The kind is the group's, so a row does not
  // repeat it — and the word that devalued the section does not appear on it.
  await expect(notices.getByText("min read").first()).toBeVisible();
  await expect(notices.getByText(/Verified/).first()).toBeVisible();
  await expect(notes.getByText("Added").first()).toBeVisible();
  await expect(notices.getByText("Guide", { exact: true })).toHaveCount(0);

  // The opening card names the one page to start with, and the contents rail points into the groups.
  await expect(page.locator("#start-here").getByRole("link")).toHaveAttribute(
    "href",
    "/playbook/section-3",
  );
  const rail = page.getByRole("navigation", { name: "Playbook sections" });
  await expect(rail.getByRole("link", { name: /Notes/ })).toHaveAttribute("href", "#notes");

  await notes.getByRole("link", { name: /Keep the notice exactly as it arrived/ }).click();
  await expect(page).toHaveURL(/\/playbook\/notes\/keep-the-notice-as-it-arrived$/);
});

test("a guide lists its sections beside the text and links to them", async ({ page }) => {
  await page.goto("/playbook/section-3");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Section 3/);
  await expect(page.getByText(/min read/).first()).toBeVisible();
  await expect(page.getByText(/Last verified/)).toBeVisible();

  const toc = page.getByRole("navigation", { name: "On this page" });
  await expect(toc.getByRole("link", { name: /What to do now/ })).toHaveAttribute(
    "href",
    "#what-to-do-now",
  );
  await expect(page.locator("#what-to-do-now")).toBeVisible();
});

test("a note is dated, says one thing to remember, and keeps the boundary", async ({ page }) => {
  await page.goto("/playbook/notes/answering-a-questionnaire");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/questionnaire/i);
  await expect(page.getByText(/Published/)).toBeVisible();
  await expect(page.getByText("In short")).toBeVisible();
  await expect(page.getByText(/One question, one answer/)).toBeVisible();

  await expect(page.getByRole("link", { name: "Paste your notice — free" })).toHaveAttribute(
    "href",
    "/decode",
  );
  const more = page.getByRole("navigation", { name: "More reading" });
  await expect(more.getByRole("link", { name: "The playbook" })).toHaveAttribute(
    "href",
    "/playbook",
  );
  await expect(
    page.getByRole("link", { name: /How to write an Amazon Plan of Action/ }),
  ).toBeVisible();

  await expect(
    page.getByText(/These notes are general information, not legal advice/),
  ).toBeVisible();
  await expect(page.getByText(/Amazon decides every appeal/)).toBeVisible();
});

test("the header and footer reach the playbook, and the old paths redirect", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Playbook", exact: true })).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Notes", exact: true })).toHaveAttribute(
    "href",
    "/playbook#notes",
  );
  await expect(footer.getByRole("link", { name: "All pages" })).toHaveAttribute(
    "href",
    "/playbook",
  );

  // The redirects keep a link made before the rename working.
  const index = await page.request.get("/notes", { maxRedirects: 0 });
  expect(index.status()).toBe(308);
  expect(index.headers()["location"]).toContain("/playbook");
  const note = await page.request.get("/notes/answering-a-questionnaire", { maxRedirects: 0 });
  expect(note.status()).toBe(308);
  expect(note.headers()["location"]).toContain("/playbook/notes/answering-a-questionnaire");
  const guides = await page.request.get("/guides/section-3", { maxRedirects: 0 });
  expect(guides.status()).toBe(308);
  expect(guides.headers()["location"]).toContain("/playbook/section-3");

  const sitemap = await page.request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("/playbook/notes/keep-the-notice-as-it-arrived");
  expect(xml).not.toMatch(/<loc>[^<]*\/notes<\/loc>/);
  expect(xml).not.toContain("/guides/");
});

test("the index and a note pass the accessibility check", async ({ page }) => {
  await page.goto("/playbook");
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  await page.goto("/playbook/notes/what-to-keep-after-you-submit");
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
});

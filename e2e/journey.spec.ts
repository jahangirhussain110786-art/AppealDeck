import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

/**
 * The parts of a seller's journey no other spec exercised, added 24 Sep 2026 during a full audit:
 * exporting the case, recording an outcome, answering a questionnaire question by question, the
 * verification route, the 404 page, the theme switch and the mobile menu. Each one was built and
 * unit-tested, but nothing proved it worked in the running app.
 */

const invoiceNotice =
  "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.";

async function startCase(page: Page, notice: string, form: string) {
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(notice);
  await page.getByLabel("Current response instructions").fill(form);
  await page.getByRole("button", { name: "Confirm this route" }).click();
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
}

test("a case exports as readable notes and an evidence manifest", async ({ page }) => {
  await startCase(page, invoiceNotice, "Upload the invoice.");
  await page.getByRole("tab", { name: "History", exact: true }).click();

  const [notes] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download case notes" }).click(),
  ]);
  expect(notes.suggestedFilename()).toBe("appealdeck-case-notes.txt");
  const text = await readFile((await notes.path())!, "utf8");
  expect(text).toContain("AppealDeck case export");
  expect(text).toContain(invoiceNotice);
  expect(text).toContain("Supplier invoice");

  const [manifest] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download evidence manifest" }).click(),
  ]);
  expect(manifest.suggestedFilename()).toMatch(/^appealdeck-evidence-manifest-.+\.txt$/);
});

test("an outcome is recorded, survives a reload, and can be taken back", async ({ page }) => {
  await startCase(page, invoiceNotice, "Upload the invoice.");
  await page.goto("/dashboard");
  const outcome = page.getByLabel("What happened with this case?");
  await expect(page.getByText(/^Nothing recorded yet/)).toBeVisible();

  await outcome.selectOption("reinstated");
  await expect(page.getByText(/^Recorded by you on .* not independently verified$/)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("What happened with this case?")).toHaveValue("reinstated");

  // "Still waiting" must clear the record, not merge it back (audit item P).
  await page.getByLabel("What happened with this case?").selectOption("pending");
  await expect(page.getByText(/^Nothing recorded yet/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("What happened with this case?")).toHaveValue("pending");
});

/**
 * The privacy policy says a case stays in the browser until the seller deletes it, and until
 * 24 Sep 2026 nothing could. Deleting takes the attached files with it — the one helper that did
 * exist left them behind.
 */
test("a case can be deleted, and its attached files go with it", async ({ page }) => {
  await startCase(page, invoiceNotice, "Upload the invoice.");
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
  await expect(page.getByText("invoice.pdf").first()).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Delete this case" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/It cannot be undone\./)).toBeVisible();
  // "Keep it" really keeps it.
  await dialog.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByLabel("What happened with this case?")).toBeVisible();

  await page.getByRole("button", { name: "Delete this case" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete this case" }).click();
  await expect(
    page.getByText("Case and 1 attached file(s) deleted from this browser"),
  ).toBeVisible();
  await expect(page.getByLabel("What happened with this case?")).toHaveCount(0);

  await page.goto("/vault");
  await expect(page.getByText("invoice.pdf")).toHaveCount(0);
});

test("a questionnaire gives each of Amazon's questions its own answer box", async ({ page }) => {
  await startCase(
    page,
    "Please complete the questionnaire below so we can review your account.",
    "Answer the following questions.\n1. What caused the late shipments?\n2. What have you changed to prevent this?",
  );
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  const first = page.getByLabel("What caused the late shipments?", { exact: true });
  const second = page.getByLabel("What have you changed to prevent this?", { exact: true });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await first.fill("A carrier missed its collection window for two weeks in August.");
  await expect(second).toHaveValue("");
});

test("a verification request gets a preparation checklist, not a drafting surface", async ({
  page,
}) => {
  await startCase(
    page,
    "Please complete identity verification by providing government-issued identification.",
    "Upload documents",
  );
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByText("Preparing your verification", { exact: true })).toBeVisible();
});

/**
 * 24 Sep 2026: /login rendered the `?error=` text as its error message, so a link to our own
 * domain could make it say anything — a phishing surface aimed at sellers who are already targets.
 * It also decoded the text a second time, so a "%" crashed the page.
 */
test("a crafted sign-in link cannot put its own words on the login page", async ({ page }) => {
  const bait = "Your account is suspended. Call +1 555 0100 to restore it — 100% guaranteed";
  await page.goto(`/login?error=${encodeURIComponent(bait)}`);
  await expect(page.getByText(/That sign-in link did not work/)).toBeVisible();
  await expect(page.getByText(/555 0100/)).toHaveCount(0);
  await expect(page.getByText("This page hit an error")).toHaveCount(0);
});

test("an unknown address shows the 404 page with a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Let's get you back on track.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

/**
 * 24 Sep 2026: the root layout set `canonical: "/"`, which every page inherited — telling search
 * engines that /pricing, /faq and the rest were duplicates of the home page.
 */
test("every public page names itself as canonical, not the home page", async ({ page }) => {
  for (const path of [
    "/",
    "/decode",
    "/pricing",
    "/faq",
    "/support",
    "/privacy",
    "/terms",
    "/refund",
  ]) {
    await page.goto(path);
    const href = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(href!).pathname, path).toBe(path);
  }
});

test("the theme switch changes the colour scheme and remembers it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
});

/**
 * The app's own screens, with a real case loaded — the marketing and auth pages were scanned, and
 * these were not, which is how an unlabelled select on the dashboard went unnoticed. Every
 * violation at WCAG 2.2 AA counts here, not only serious and critical ones.
 */
test.describe("accessibility of the app screens, with a case loaded", () => {
  test.beforeEach(async ({ page }) => {
    await startCase(page, invoiceNotice, "Upload the invoice.");
  });

  for (const tab of ["Overview", "Evidence", "Response", "History"]) {
    test(`/case — ${tab}`, async ({ page }) => {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
    });
  }

  test("/dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByLabel("What happened with this case?")).toBeVisible();
    await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  });

  test("/vault", async ({ page }) => {
    await page.goto("/vault");
    await expect(page.locator("h1")).toBeVisible();
    await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  });

  test("/decode, with a decoded result", async ({ page }) => {
    await page.goto("/decode");
    await page.getByRole("button", { name: "Try a sample notice" }).click();
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.locator("main").getByText("Do now", { exact: true })).toBeVisible();
    await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu opens and its links work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Decode", exact: true }).click();
    await expect(page).toHaveURL(/\/decode$/);
  });
});

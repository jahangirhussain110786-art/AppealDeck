import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS } from "./axe";

/**
 * The free reading on the device (29 Sep 2026): when the AI reading cannot run, and always for a
 * guest, a business document is read in the browser — pdf.js for the words of a PDF, Tesseract.js
 * for a scan or a photo — and never uploaded. These run signed out, so the AI reading is
 * unavailable by construction and the device reading is the only one that can answer.
 */

const DOCS = "docs/handoffs/2026-09-29-test-documents";
const noticeFile = `${DOCS}/paste-notice-t01-inauthentic-section3.txt`;

async function startInvoiceCase(page: Page) {
  const notice = (await readFile(noticeFile, "utf8")).trim();
  await page.goto("/case");
  await page.getByLabel("Amazon notice", { exact: true }).fill(notice);
  await page.getByLabel("What the response page asks for").fill("Upload the supplier invoices.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
}

const documents = (page: Page) => page.getByRole("tabpanel", { name: "Documents", exact: true });

test("a guest's invoice is read on the device, never uploaded, and the reading survives a reload", async ({
  page,
}) => {
  // A guest's file must go nowhere: any request to the reading endpoint fails this test.
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/read-document")) sent.push(r.url());
  });

  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/04-supplier-invoice-WITH-PROBLEMS.pdf`);
  await expect(
    documents(page).getByText("04-supplier-invoice-WITH-PROBLEMS.pdf").first(),
  ).toBeVisible();

  // Said before the button is pressed, so the seller knows where the file goes.
  await expect(
    documents(page).getByText(/^Read on this device, without AI: the file is never uploaded/),
  ).toBeVisible();

  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toBeVisible();
  await expect(documents(page).getByText(/Why not the AI reading:/)).toBeVisible();
  // A screen reader is told the reading has finished (a polite live region, always in the page).
  await expect(
    documents(page)
      .getByRole("status")
      .filter({ hasText: /Reading finished: \d+ of \d+ items found/ }),
  ).toHaveCount(1);
  // The problem invoice is a quotation from 2024 with no supplier address or phone: something
  // must be reported as not found or conflicting, not passed.
  await expect(
    documents(page)
      .getByText(/^(Not found|Conflicts)$/)
      .first(),
  ).toBeVisible();
  await expect(
    documents(page).getByText("The file was never uploaded.", { exact: false }),
  ).toBeVisible();

  // Kept with the case, and still a device reading afterwards — not relabelled as the AI's.
  const savedLine = /^Checked (?!on this device)/;
  await expect(page.getByText(savedLine).first()).toBeVisible();
  await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
  await page.reload();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toBeVisible();
  await expect(documents(page).getByText(/Why not the AI reading:/)).toBeVisible();

  expect(sent).toEqual([]);
});

/** Signs the dev account in, for the tests below. The local AI switch must be off (see the header). */
async function signInAsDev(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

const needsDevAccount = () => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  // With the switch on, this would spend the real AI quota; it is a local-run test of the "off" path.
  test.skip(process.env.GEMINI_PAID_TIER_CONFIRMED === "true", "The AI reading is switched on");
};

// The licence answer is set by the test, not read from the dev account: whether that account's
// Pass is free, or already bound to another case, depends on which walk ran last.
test("a signed-in seller with a Pass whose AI reading is off gets the device reading, and is told the file was sent", async ({
  page,
}) => {
  needsDevAccount();
  test.setTimeout(90_000);
  await signInAsDev(page);
  await page.route("**/api/license/status*", (route) =>
    route.fulfill({ json: { status: "active", plan: "appeal_pass" } }),
  );
  const posted: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/read-document")) posted.push(r.url());
  });

  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);
  // Signed in, the note before the button is the AI's, and says the device reading is the fallback.
  await expect(
    documents(page).getByText(/Without one, the file is read on this device and is not sent/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toBeVisible();
  // The reason is the real one, not the guest's "sign in" message.
  const why = documents(page).getByText(/Why not the AI reading:/);
  await expect(why).toBeVisible();
  await expect(why).not.toContainText("needs you to be signed in");
  // The file was posted before the fallback ran, so the result must not say it was never uploaded.
  expect(posted).toHaveLength(1);
  await expect(
    documents(page).getByText(
      /The file was sent to AppealDeck for the AI reading, which did not run/,
    ),
  ).toBeVisible();
  await expect(documents(page).getByText(/never uploaded/)).toHaveCount(0);
  await expect(documents(page).getByText("Found", { exact: true }).first()).toBeVisible();
});

test("a signed-in seller without a Pass sends nothing, and the result says so", async ({
  page,
}) => {
  needsDevAccount();
  test.setTimeout(90_000);
  await signInAsDev(page);
  await page.route("**/api/license/status*", (route) =>
    route.fulfill({ json: { status: "none", plan: null } }),
  );
  const posted: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/read-document")) posted.push(r.url());
  });

  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);
  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toBeVisible();
  // A free account has no AI reading to send the file to, so it is not sent only to be refused.
  await expect(documents(page).getByText(/part of the Appeal Pass for this case/)).toBeVisible();
  await expect(documents(page).getByText(/The file was never uploaded/)).toBeVisible();
  expect(posted).toEqual([]);
});

test("a password-protected PDF is called protected, not blank, and nothing is uploaded", async ({
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/read-document")) sent.push(r.url());
  });
  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/19-supplier-invoice-PASSWORD-PROTECTED.pdf`);
  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(documents(page).getByText(/protected with a password/)).toBeVisible();
  // It is not offered as a reading, and the sign-in advice (which would not help) is not given.
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toHaveCount(0);
  await expect(documents(page).getByText(/needs you to be signed in/)).toHaveCount(0);
  expect(sent).toEqual([]);
});

// A worker that starts and then never answers is what pdf.js does when something inside it fails
// (a missing browser feature was the real case). Before the time limits, the button read
// "Checking…" for good and the seller could do nothing.
test("a PDF that never finishes reading is stopped, and the seller can try again", async ({
  page,
}) => {
  test.setTimeout(120_000);
  // An empty module: the worker loads, registers no handler, and pdf.js waits for it forever.
  await page.route("**/reader/pdf.worker.compat.mjs", (route) =>
    route.fulfill({ body: "export {};", contentType: "text/javascript" }),
  );
  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);
  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(page.getByRole("button", { name: "Reading your document…" }).first()).toBeVisible();
  await expect(documents(page).getByText(/it took too long and was stopped/)).toBeVisible({
    timeout: 90_000,
  });
  // The button is back, so it can be pressed again.
  await expect(page.getByRole("button", { name: "Check again" }).first()).toBeEnabled();
});

// Safari added Promise.withResolvers in 17.4 and Chrome in 119, and the site supports older ones.
// pdf.js's modern build calls it; the legacy build carries its own. With the page's copy removed
// the modern build fails at once, so this fails if the loader ever goes back to it. (The worker is
// a separate realm this cannot patch, which is exactly why the legacy worker is served too.)
test("the reader works in a browser without Promise.withResolvers", async ({ page }) => {
  await page.addInitScript(() => {
    delete (Promise as unknown as { withResolvers?: unknown }).withResolvers;
  });
  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);
  await page.getByRole("button", { name: "Check this document" }).first().click();
  await expect(
    documents(page).getByText("Read on this device, without AI", { exact: true }),
  ).toBeVisible();
  await expect(documents(page).getByText("Found", { exact: true }).first()).toBeVisible();
});

// The same invoice stored two ways. The second is how Acrobat's ClearScan and many scanners' compact
// PDFs store a page, and pdf.js can only draw it with its wasm decoders: without them the page is
// blank and this comes back "could not make out its text" (30 Sep 2026 review).
for (const [how, file] of [
  ["a picture inside a PDF", "17-supplier-invoice-SCANNED-no-text-layer.pdf"],
  ["a JPEG 2000 picture inside a PDF", "18-supplier-invoice-SCANNED-jpeg2000.pdf"],
  // A few real words (a scanner app's footer) in the text layer made it look readable, so the
  // picture was never read and every field came back "not checked".
  ["a picture with only a page footer as text", "20-supplier-invoice-SCANNED-with-page-footer.pdf"],
] as const) {
  test(`a scanned invoice stored as ${how} is read on the device by OCR`, async ({ page }) => {
    // The first OCR downloads the language data (about 7 MB) from this site.
    test.setTimeout(180_000);
    const sent: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/read-document")) sent.push(r.url());
    });

    await startInvoiceCase(page);
    await page.locator('input[type="file"]').first().setInputFiles(`${DOCS}/${file}`);
    await page.getByRole("button", { name: "Check this document" }).first().click();
    await expect(
      documents(page).getByText("Read on this device, without AI", { exact: true }),
    ).toBeVisible({
      timeout: 150_000,
    });
    // Said, because a scan can be misread (a zero for the letter O, a 5 for an S).
    await expect(documents(page).getByText(/^Read from a picture\./)).toBeVisible();
    // A scan can be misread, so nothing in it is ever reported as absent — only as not readable.
    await expect(documents(page).getByText("Not found", { exact: true })).toHaveCount(0);
    await expect(documents(page).getByText("Found", { exact: true }).first()).toBeVisible();
    expect(sent).toEqual([]);
  });
}

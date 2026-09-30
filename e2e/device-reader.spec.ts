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

test("a signed-in seller whose AI reading is switched off gets the device reading, with the reason", async ({
  page,
}) => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "Dev authentication fixture required",
  );
  // With the switch on, this would spend the real AI quota; it is a local-run test of the "off" path.
  test.skip(process.env.GEMINI_PAID_TIER_CONFIRMED === "true", "The AI reading is switched on");
  test.setTimeout(90_000);

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/dashboard/);

  await startInvoiceCase(page);
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(`${DOCS}/03-supplier-invoice-t01-authenticity.pdf`);
  // Signed in, the note before the button is the AI's, and says the device reading is the fallback.
  await expect(
    documents(page).getByText(
      /If the AI reading is not available, the file is read on this device instead/,
    ),
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
  await expect(
    documents(page).getByText(
      /The file was sent to AppealDeck for the AI reading, which did not run/,
    ),
  ).toBeVisible();
  await expect(documents(page).getByText(/never uploaded/)).toHaveCount(0);
  await expect(documents(page).getByText("Found", { exact: true }).first()).toBeVisible();
});

// The same invoice stored two ways. The second is how Acrobat's ClearScan and many scanners' compact
// PDFs store a page, and pdf.js can only draw it with its wasm decoders: without them the page is
// blank and this comes back "could not make out its text" (30 Sep 2026 review).
for (const [how, file] of [
  ["a picture inside a PDF", "17-supplier-invoice-SCANNED-no-text-layer.pdf"],
  ["a JPEG 2000 picture inside a PDF", "18-supplier-invoice-SCANNED-jpeg2000.pdf"],
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

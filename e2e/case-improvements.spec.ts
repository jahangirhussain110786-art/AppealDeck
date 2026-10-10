import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";
import { crc32 } from "../src/lib/zip";

/**
 * 10 Oct 2026: the root-cause coach and the units-sold figure. (The change report needs a recorded
 * submission and so a paid case; it is in workspace.spec.ts beside the other signed-in test.)
 */

async function openPlanOfAction(page: Page) {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Your account has been deactivated. Please submit a Plan of Action explaining the root cause of the issue and the corrective actions you have taken.",
    );
  await page.getByLabel("What the response page asks for").fill("Submit a Plan of Action.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
}

test("the root-cause coach puts the seller's own answers in the box, and adds nothing", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  // Real keystrokes, checked at once: what is typed must show as it is typed, not after the save.
  const first = page.getByLabel(/^1\. /);
  await first.pressSequentially("Returned items went back on sale as new");
  await expect(first).toHaveValue("Returned items went back on sale as new", { timeout: 300 });
  await page.getByLabel(/^2\. /).fill("B0EXAMPLE1, 12 to 28 Aug 2026.");
  await page.getByRole("button", { name: "Put my answers in the box" }).click();

  const box = page.getByLabel("What went wrong?", { exact: true });
  await expect(box).toHaveValue(
    "Returned items went back on sale as new. B0EXAMPLE1, 12 to 28 Aug 2026.",
  );
  // Used once: the questions start empty again.
  await expect(page.getByLabel(/^1\. /)).toHaveValue("");

  // With text already in the box, the answers are added below it instead of replacing it.
  await page.getByLabel(/^3\. /).fill("Checking returns");
  await expect(
    page.getByRole("button", { name: "Add my answers below what I wrote" }),
  ).toBeVisible();
});

test("the coach's answers survive a reload", async ({ page }) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  await page.getByLabel(/^1\. /).fill("Nobody was assigned to open returns");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByText("Saving…", { exact: true })).toBeHidden();
  await page.reload();
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await page.getByText("Not sure what to write? Answer five short questions.").click();
  await expect(page.getByLabel(/^1\. /)).toHaveValue("Nobody was assigned to open returns");
});

test("a list of causes is flagged, and one clear cause is not", async ({ page }) => {
  test.setTimeout(90_000);
  await openPlanOfAction(page);
  const box = page.getByLabel("What went wrong?", { exact: true });
  await box.fill(
    "There were several factors on 3 Aug 2026: the supplier was late, our packer was new, and our checklist was out of date.",
  );
  await expect(page.getByText("This reads like more than one cause.")).toBeVisible();
  await expect(page.getByText("We noticed: several factors.")).toBeVisible();

  await box.fill(
    "On 3 Aug 2026 our packer shipped 12 returned units of B0EXAMPLE1 as new because no one was assigned to open returns.",
  );
  await expect(page.getByText("This reads like more than one cause.")).toBeHidden();

  await box.fill(
    "We made a mistake with how returned items were handled and did not notice in time.",
  );
  await expect(page.getByText(/No date, number or order is in this answer yet/)).toBeVisible();
});

test("units sold is saved with the business details and appears in the case notes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.",
    );
  await page
    .getByLabel("What the response page asks for")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  const documents = page.getByRole("tabpanel", { name: "Documents", exact: true });
  await documents.getByRole("button", { name: /Your business details/ }).click();
  const units = documents.getByLabel(
    "Units you sold of the products in the notice, in the 365 days before it",
  );
  // Digits only: anything else typed is dropped.
  await units.fill("4a5,0");
  await expect(units).toHaveValue("450");
  await documents.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(
    documents.getByLabel("Units you sold of the products in the notice, in the 365 days before it"),
  ).toHaveValue("450");

  await page.getByRole("tab", { name: "History", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download case notes" }).click(),
  ]);
  const exported = await readFile((await download.path())!, "utf8");
  expect(exported).toContain(
    "Units sold of the products in the notice, over the 365 days before it: 450",
  );
});

/**
 * P-10, 10 Oct 2026: the upload-ready pack. Built on the device from a real file in the vault, with a
 * real picture over the size limit, so the shrinking is proved in a browser and not only in a stub.
 */

/** A valid PNG of random pixels, which does not compress: about 6.8 MB for 1500 by 1500. */
function bigPng(): Buffer {
  const width = 1500;
  const height = 1500;
  const rowLength = 1 + width * 3;
  const raw = randomBytes(rowLength * height);
  for (let y = 0; y < height; y++) raw[y * rowLength] = 0; // filter type: none
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(8 + data.length + 4);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(new Uint8Array(body)), 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8); // bit depth
  header.writeUInt8(2, 9); // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 0 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Reads the stored entries of a zip made by the app's own writer: name to bytes. */
function readZip(zip: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  let at = 0;
  while (at + 30 <= zip.length && zip.readUInt32LE(at) === 0x04034b50) {
    const size = zip.readUInt32LE(at + 18);
    const nameLength = zip.readUInt16LE(at + 26);
    const extra = zip.readUInt16LE(at + 28);
    const name = zip.subarray(at + 30, at + 30 + nameLength).toString("utf8");
    const start = at + 30 + nameLength + extra;
    out.set(name, zip.subarray(start, start + size));
    at = start + size;
  }
  return out;
}

async function reviewedInvoice(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.",
    );
  await page
    .getByLabel("What the response page asks for")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await expect(page.getByRole("button", { name: "Read original" })).toBeVisible({
    timeout: 20_000,
  });
  await page
    .getByLabel("What does this file show? Note anything missing.")
    .fill("Page 1 identifies the supplier, the purchase date and product code J-104.");
  await page.getByLabel("I checked the file, the page number and my note.").check();
  await page.getByRole("button", { name: "Save document" }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Documents", exact: true })
      .getByText("Reviewed by you", { exact: true }),
  ).toBeVisible();
}

async function downloadPack(page: Page): Promise<Map<string, Buffer>> {
  await page.getByRole("tab", { name: "History", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download upload-ready pack" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^appealdeck-evidence-pack-.+-\d{4}-\d{2}-\d{2}\.zip$/,
  );
  return readZip(await readFile((await download.path())!));
}

test("the pack renames a reviewed file, adds an index, and leaves a small file exactly as it was", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const pdf = Buffer.from("%PDF-1.4\n% fictional test invoice\n%%EOF");
  await reviewedInvoice(page, { name: "scan (3).pdf", mimeType: "application/pdf", buffer: pdf });
  const zip = await downloadPack(page);
  expect([...zip.keys()].sort()).toEqual([
    "For your records/pack-record.txt",
    "Upload to Amazon/00 Index of documents.txt",
    "Upload to Amazon/01 Supplier invoice.pdf",
  ]);
  expect(zip.get("Upload to Amazon/01 Supplier invoice.pdf")!.equals(pdf)).toBe(true);
  const index = zip.get("Upload to Amazon/00 Index of documents.txt")!.toString("utf8");
  expect(index).toContain("01 Supplier invoice.pdf");
  expect(index).toContain(
    "Shows: Page 1 identifies the supplier, the purchase date and product code J-104.",
  );
  const record = zip.get("For your records/pack-record.txt")!.toString("utf8");
  expect(record).toContain("Was: scan (3).pdf");
  expect(record).toContain("not a submission");
});

test("a picture over the limit is re-saved as a smaller JPEG, and the record says so", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const png = bigPng();
  expect(png.length).toBeGreaterThan(5 * 1024 * 1024);
  await reviewedInvoice(page, { name: "IMG_2041.png", mimeType: "image/png", buffer: png });
  const zip = await downloadPack(page);
  const names = [...zip.keys()].filter(
    (n) => n.startsWith("Upload to Amazon/0") && !n.includes("Index"),
  );
  expect(names).toEqual(["Upload to Amazon/01 Supplier invoice.jpg"]);
  const jpeg = zip.get(names[0]!)!;
  expect(jpeg.length).toBeLessThanOrEqual(5 * 1024 * 1024);
  expect(jpeg.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
  const record = zip.get("For your records/pack-record.txt")!.toString("utf8");
  expect(record).toContain("CHANGED: Re-saved as a JPEG");
  expect(record).toContain("Was: IMG_2041.png");
  expect(zip.get("Upload to Amazon/00 Index of documents.txt")!.toString("utf8")).toContain(
    "re-saved picture of the original",
  );
});

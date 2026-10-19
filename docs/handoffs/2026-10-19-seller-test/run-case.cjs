// Drives one case through the running app like a seller. Usage:
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/run-case.cjs A|B|C [explore]
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const DIR = __dirname;
const OUT = path.join(DIR, "out");
fs.mkdirSync(OUT, { recursive: true });
const key = process.argv[2];
const explore = process.argv[3] === "explore";
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const doc = (f) => path.join(DIR, "docs", f);
const log = (title, text, n = 4000) => console.log(`\n=== ${title} ===\n${String(text).slice(0, n)}`);

const CASES = {
  A: {
    notice: "notice-A-authenticity.txt",
    form: "Upload the invoices for ASIN B0CK7T2M9R and B0CK7T4L1Q. Add a Plan of Action in the box below (max 5000 characters).",
    files: {
      "Supplier invoice": "A1-supplier-invoice-summit-peak-2026-08.pdf",
      "Authorization letter": "A3-brand-letter-trailhead-authorizing-summit-peak.pdf",
    },
    biz: {
      name: "Ridgeline Outdoor Supply LLC",
      address: "88 Cottonwood Road, Boise, ID 83702, United States",
      suppliers: "Summit Peak Wholesale Inc.",
      units: "180",
    },
    wentWrong:
      "In August we bought 120 Trailhead tents and 120 footprints from Summit Peak Wholesale, an authorized Trailhead distributor, and listed them as B0CK7T2M9R and B0CK7T4L1Q. A customer opened the box and thought the stitching looked different from the tent she owned, and complained it was not genuine. We did not hold the brand authorization letter on file at the time of the complaint, so we could not show where the stock came from.",
    fixed:
      "Finished: on 15 October we got the invoice SP-2026-08817 dated 14 August 2026 and the brand letter from Trailhead Gear Co. dated 1 July 2026 confirming Summit Peak Wholesale is an authorized distributor, and we attach both. Finished: we pulled the remaining 41 units of the tent from stock and checked the label, the lot code and the stitching against the supplier packing list.",
    prevent:
      "Before we list any new brand or supplier, our owner collects the supplier invoice and the brand authorization letter and files them in a shared folder. We keep every invoice for at least two years and match the quantities to our monthly sales report.",
    notes: {
      "Supplier invoice":
        "Invoice SP-2026-08817 from Summit Peak Wholesale dated 14 Aug 2026 for 120 Trailhead tents and 120 footprints, bought for our stock. It shows the supplier address and phone. It does not print the ASIN, the SKUs TH-T3-GRN and TH-FP-3 are on our listings.",
      "Authorization letter":
        "Letter from Trailhead Gear Co. dated 1 July 2026 confirming Summit Peak Wholesale is its authorized distributor in the US.",
    },
  },
  B: {
    notice: "notice-B-performance.txt",
    form: "Plan of Action: root cause, actions taken, preventive measures.",
    files: {},
    wentWrong:
      "In the last week of September our only packer, Tomas, was on leave and we had no cover, so about 8% of orders missed the handling cutoff. At the same time we ran an autumn promotion that doubled order volume without extra staff. 41 parcels were also dropped at a carrier drop-box and scanned the next morning, which is why tracking showed late and the valid tracking rate fell to 88%. Cancellations rose because we oversold three SKUs during the promotion when our inventory sync lagged by about six hours.",
    fixed:
      "Finished: on 10 October we hired a second packer, Lena Ortiz, who starts on 14 October. Finished: we moved our daily shipping cutoff from 3pm to 1pm in Seller Central and set handling time to 2 days. Finished: all parcels are now handed to the carrier at the counter and scanned on pickup. Finished: we now sync inventory every 10 minutes and keep a buffer of 5 units on promoted SKUs.",
    prevent:
      "Our warehouse lead checks the open-order count at 11am and 2pm every day and tells the owner if more than 40 orders are waiting. We will not run promotions unless two packers are on shift. The owner reviews the late shipment and cancel rates every Monday and keeps a log of the numbers.",
  },
  C: {
    notice: "notice-C-trademark.txt",
    form: "Upload documents showing the product is authentic, or ask the rights owner to retract the complaint.",
    files: {
      "Supplier invoice": "C1-distributor-invoice-atlantic-kitchen.pdf",
      "Authorization letter": "C2-letter-of-authorization-vellmore.pdf",
    },
    notes: {
      "Supplier invoice":
        "Invoice AKD-60492 from Atlantic Kitchen Distribution dated 2 Sep 2026 for 96 Vellmore 12-inch acacia cutting boards, item VEL-ACA-12. It shows the distributor address, phone and the Vellmore dealer account number.",
      "Authorization letter":
        "Letter from Vellmore Brands LLC dated 22 January 2026 naming Atlantic Kitchen Distribution as an authorized distributor of this board, valid to 31 December 2026.",
    },
    wentWrong:
      "We list the Vellmore 12-inch acacia cutting board, B0D2QH8N5W, which we buy from Atlantic Kitchen Distribution in Providence, an authorized Vellmore distributor. Vellmore filed a trademark complaint, complaint ID 11840927351, most likely because they did not know we buy through their authorized channel. We had not sent Amazon the distributor invoice or the authorization letter with our listing.",
    fixed:
      "Finished: on 16 October we obtained Vellmore Brands letter dated 22 January 2026 naming Atlantic Kitchen Distribution as its authorized distributor, and invoice AKD-60492 dated 2 September 2026 for 96 boards, and we attach both. Finished: on 17 October we emailed legal@vellmorebrands.example to ask them to review the documents and retract the complaint.",
    prevent:
      "From now on we only buy branded goods from distributors named by the brand, and we ask for the authorization letter before the first purchase. Our owner keeps a folder with the letter and each invoice for every brand we sell, and we check it each quarter.",
  },
};

async function signIn(page) {
  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);
}
const snap = (page, name) =>
  page.screenshot({ path: path.join(OUT, `${key}-${name}.png`), fullPage: true });
const dump = async (page, name) => {
  const t = await page.locator("main").innerText().catch(() => page.locator("body").innerText());
  fs.writeFileSync(path.join(OUT, `${key}-${name}.txt`), t);
  return t;
};
const tab = async (page, name) => {
  await page.getByRole("tab", { name, exact: true }).click();
  await page.waitForTimeout(700);
};

(async () => {
  const c = CASES[key];
  if (process.env.A_INVOICE) c.files = { "Supplier invoice": process.env.A_INVOICE };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 200)));
  await signIn(page);

  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(read(c.notice));
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.waitForTimeout(2500);
  await snap(page, "1-decode");
  log("DECODE", await dump(page, "1-decode"), 1500);

  await page.getByRole("link", { name: /start my case/i }).first().click();
  await page.waitForURL(/\/case/);
  const form = page.getByLabel("What the response page asks for");
  if (await form.isVisible().catch(() => false)) await form.fill(c.form);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1500);
  log("OVERVIEW", await dump(page, "3-overview"), 2500);

  await tab(page, "Documents");
  await snap(page, "4-documents");
  log("DOCUMENTS (before)", await dump(page, "4-documents"), 5000);
  if (explore) return browser.close();

  // Upload each file against its card, like a seller would.
  for (const [label, file] of Object.entries(c.files ?? {})) {
    const card = page.getByRole("region", { name: new RegExp(`^${label}`) });
    const openBtn = card.getByRole("button", { name: /^open$/i });
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();
      await page.waitForTimeout(500);
    }
    const input = card.locator('input[type="file"]').first();
    await input.setInputFiles(doc(file));
    await page.waitForTimeout(1500);
    console.log(`uploaded ${file} for ${label}`);
    const check = card.getByRole("button", { name: /check this document/i }).first();
    if (await check.isVisible().catch(() => false)) {
      await check.click();
      await page.waitForTimeout(9000);
      await snap(page, `5-check-${label.replace(/\W+/g, "-")}`);
      log(`CHECK RESULT (${label})`, await dump(page, `5-check-${label.replace(/\W+/g, "-")}`), 4500);
    }
    const note = card.getByLabel(/what does this file show/i).first();
    await note.fill(c.notes?.[label] ?? `This is the ${label.toLowerCase()} for the affected product.`);
    await card.getByLabel(/i checked the file/i).first().check();
    await card.getByRole("button", { name: /save document/i }).first().click();
    await page.waitForTimeout(1500);
    await page.waitForTimeout(700);
  }
  await snap(page, "5-documents-after");
  log("DOCUMENTS (after upload)", await dump(page, "5-documents-after"), 2500);

  // Business details, like a careful seller would.
  const biz = page.getByRole("button", { name: /your business details/i }).first();
  if (await biz.isVisible().catch(() => false)) {
    await biz.click();
    await page.waitForTimeout(600);
    if (c.biz) {
      await page.getByLabel(/business name, exactly/i).fill(c.biz.name);
      await page.getByLabel(/registered business address/i).fill(c.biz.address);
      await page.getByLabel(/your suppliers/i).fill(c.biz.suppliers);
      if (c.biz.units) await page.getByLabel(/units you sold/i).fill(c.biz.units);
      await page.getByRole("button", { name: /save business details/i }).click();
      await page.waitForTimeout(1200);
    }
    log("BUSINESS DETAILS", await dump(page, "6-business"), 6000);
    console.log(
      "LABELS:",
      await page.locator("label").allInnerTexts().then((a) => a.filter((t) => t.length < 90)),
    );
  }
  const done = page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i });
  if (await done.isVisible().catch(() => false)) await done.check();
  await tab(page, "Response");
  await snap(page, "7-response");
  log("RESPONSE", await dump(page, "7-response"), 5000);
  if (!c.wentWrong) return browser.close();
  await page.getByLabel("What went wrong?").fill(c.wentWrong);
  await page.getByLabel("What have you fixed already?").fill(c.fixed);
  await page.getByLabel("How will you stop it happening again?").fill(c.prevent);
  await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  const complete = page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i });
  if (await complete.isVisible().catch(() => false)) await complete.check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1500);
  await snap(page, "8-answers-saved");
  log("BEFORE YOU SEND", await dump(page, "8-answers-saved"), 4000);
  const prepare = page.getByRole("button", { name: /prepare (working )?(draft|response)/i }).first();
  console.log("prepare enabled:", await prepare.isEnabled());
  await prepare.click();
  await page.waitForTimeout(500);
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    const t = await page.locator("main").innerText();
    if (/Copy (the )?(response|draft|text)|Download|Changes since|Your facts, checked/i.test(t)) break;
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(3000);
  await snap(page, "9-prepared");
  log("PREPARED RESPONSE", await dump(page, "9-prepared"), 12000);
  if (process.argv[3] === "reply") {
    await page.getByLabel(/i reviewed the facts/i).check();
    await page.getByLabel(/i sent the response exactly as prepared/i).check().catch(() => {});
    await page.getByLabel(/i have submitted this exact response/i).check();
    await page.getByRole("button", { name: /record submission/i }).click();
    await page.waitForTimeout(1500);
    await tab(page, "History");
    await page.getByLabel(/add amazon.s next reply/i).fill(read("reply-B-refusal.txt"));
    await snap(page, "10-reply-filled");
    log("HISTORY (before analyse)", await dump(page, "10-reply-filled"), 2500);
    const analyse = page.locator("#workspace-reply").locator("xpath=following::button[1]");
    console.log("analyse button:", await analyse.innerText());
    await analyse.click();
    await page.waitForTimeout(12000);
    await snap(page, "11-reply-read");
    log("AFTER REPLY", await dump(page, "11-reply-read"), 7000);
  }
  await browser.close();
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});

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
const log = (title, text, n = 4000) =>
  console.log(`\n=== ${title} ===\n${String(text).slice(0, n)}`);

const CASES = {
  S2: {
    notice: "notice-2-design-patent.txt",
    form: "Upload documents or ask the rights owner to withdraw the report.",
    dispute: true,
    files: { "Supplier invoice": "2A-commercial-invoice-shenzhen-aluminium.pdf" },
    notes: {
      "Supplier invoice":
        "Commercial invoice SZ-AL-260933 from Shenzhen Brightway Metal Products dated 14 June 2026 for 800 AL-114 laptop stands, which we list as B0DM7X3PF2.",
    },
    explanation:
      "We disagree with the report. Our stand, model AL-114, is made by Shenzhen Brightway Metal Products, which designed it in 2022 and published it in its catalogue on 2 April 2022. The attached commercial invoice SZ-AL-260933 dated 14 June 2026 shows we bought 800 of them. The manufacturer's statement of 10 October 2026 says it has no agreement with Orbis Ergonomics Inc. and does not copy its designs.",
  },
  S3: {
    notice: "notice-3-hazmat.txt",
    form: "Upload the SDS and the UN38.3 test summary.",
    files: {
      "Safety data sheet (SDS)": "3A-safety-data-sheet-voltridge-20k.pdf",
      "UN38.3 battery test summary": "3B-un38-3-test-summary-voltridge.pdf",
    },
    notes: {
      "Safety data sheet (SDS)":
        "SDS for the VR-20K power bank, revision 2 issued 5 February 2025, 16 sections.",
      "UN38.3 battery test summary":
        "UN38.3 test summary for model VR-20K, report ZBS-2025-01877 dated 24 January 2025, 74 Wh, 6 cells, tests T1 to T8 passed.",
    },
    explanation:
      "The attached safety data sheet for the VoltRidge VR-20K power bank was issued on 5 February 2025 and covers all 16 sections. The attached UN38.3 test summary is for the same model, report ZBS-2025-01877 dated 24 January 2025 from Zhejiang Battery Safety Testing Center. The battery is 74 Wh with 6 cells.",
  },
  S4: {
    notice: "notice-4-uk-vat.txt",
    form: "Send the documents through Account Health.",
    files: {
      "Other requested record": "4A-vat-registration-certificate-hmrc.pdf",
      "Bank or financial record": "4B-bank-statement-cotswold-tea.pdf",
      "Proof of address": "4C-council-tax-bill-or-utility.pdf",
      "Requested identity record":
        "../../2026-09-29-test-documents/12-id-card-specimen-GOOD-photo.jpg",
    },
    notes: {
      "Other requested record":
        "HMRC VAT registration certificate, VAT number GB 412 8830 57, effective 1 February 2022.",
      "Bank or financial record":
        "September 2026 statement for Cotswold Tea Merchants Ltd, account ending 6615.",
      "Proof of address":
        "Water and power bill dated 14 September 2026 for The Old Maltings, Stow-on-the-Wold.",
      "Requested identity record": "Photo ID of the primary contact on the account.",
    },
    explanation:
      "The attached documents verify Cotswold Tea Merchants Ltd: the HMRC VAT certificate for GB 412 8830 57 effective 1 February 2022, the September 2026 bank statement for the account ending 6615, a bill dated 14 September 2026 for The Old Maltings, Church Lane, Stow-on-the-Wold GL54 1BN, and the photo ID of the primary contact.",
  },
  G: {
    notice: "notice-G-restricted.txt",
    form: "Submit the COA, GMP certificate, label photos and invoice.",
    files: {
      "Test report or compliance certificate": "G1-certificate-of-analysis-turmeric.pdf",
      "Product and label photos": "G4-supplement-facts-label.png",
      "Supplier invoice": "G3-supplier-invoice-evergreen.pdf",
    },
    notes: {
      "Test report or compliance certificate":
        "Certificate of Analysis from Cascade Analytical Laboratories (ISO/IEC 17025), report date 2 September 2026, batch AM-TUR-0826, for our turmeric and black pepper capsules.",
      "Product and label photos":
        "Photo of the label with the Supplement Facts panel, ingredient list and net quantity of 120 capsules.",
      "Supplier invoice":
        "Invoice EN-70418 from Evergreen Nutraceutical Manufacturing dated 28 August 2026 for 1,200 bottles of AM-TUR-120, batch AM-TUR-0826.",
    },
    explanation:
      "We ask for approval to sell Alder & Moss Turmeric and Black Pepper Capsules, ASIN B0DE4M8RT3. The attached Certificate of Analysis is from Cascade Analytical Laboratories, ISO/IEC 17025 accredited, for batch AM-TUR-0826, report date 2 September 2026. The label photo shows the Supplement Facts panel, ingredients and net quantity. The invoice EN-70418 from our manufacturer Evergreen Nutraceutical Manufacturing is dated 28 August 2026 for the same batch. Evergreen's cGMP certificate PNQC-2026-5530 is valid until 10 March 2027.",
  },
  H: {
    notice: "notice-H-reviews.txt",
    form: "Plan of Action: root cause, corrective actions, preventive measures.",
    files: {},
    wentWrong:
      "We put a card in every parcel from June to October 2026 that offered a 10 dollar gift card to customers who left a five-star review of our shoes. Our marketing contractor, Dale Hobbs, designed the card, and I approved it without checking Amazon's review policy. About 1,400 cards were still in stock when Amazon wrote to us on 14 October.",
    fixed:
      "Finished: on 15 October 2026 we stopped using the card, took it out of the packing line and destroyed the remaining 1,400 cards. Finished: on 16 October we wrote a customer communication procedure and ended the contract with the contractor who designed the card. Finished: on 16 October we read Amazon's Customer Product Reviews policy as a team.",
    prevent:
      "From 16 October 2026 every insert or message to customers must be read and approved by me, Hannah Quist, before printing, and I keep a dated file of approved inserts. We use only Amazon's Request a Review button, for every customer. I re-read the review policy every quarter.",
  },
  I: {
    notice: "notice-I-verification.txt",
    form: "Schedule a video call.",
    files: {
      "Requested identity record":
        "../../2026-09-29-test-documents/12-id-card-specimen-GOOD-photo.jpg",
      "Bank or financial record": "I1-bank-statement-tidewater-pottery.pdf",
      "Proof of address": "../../2026-09-29-test-documents/11-utility-bill-proof-of-address.jpg",
    },
    notes: {
      "Requested identity record": "Photo ID of the primary contact on the account.",
      "Bank or financial record":
        "September 2026 statement for Tidewater Pottery Studio LLC, account ending 3391.",
      "Proof of address": "Utility bill for the business address at 9 Quay Street, Gloucester.",
    },
  },
  // Harder case J (20 Oct 2026): a vague deactivation, and a seller who truly does not know why.
  J: {
    notice: "notice-J-vague-deactivation.txt",
    form: "Appeal text, in the Account Health page.",
    files: {},
    wentWrong:
      "I do not know what activity Amazon means. We sell candles and home decor and I have not changed anything in the last month. Two weeks ago I lowered prices on about 30 listings and added a new supplier's candles. I have had a few customer messages asking where their orders were.",
    fixed:
      "Finished: on 17 October I paused all 30 listings whose prices I changed. In progress: I am checking every listing and every customer message from the last 60 days.",
    prevent:
      "I will read the seller policies for each category before changing a listing and I will check the Account Health page every day.",
  },
  // Harder case I2 (20 Oct 2026): the same verification, but the seller photographs the ID badly
  // and sends a scan of the utility bill that is a picture with no text.
  I2: {
    notice: "notice-I-verification.txt",
    form: "Schedule a video call.",
    files: {
      "Requested identity record":
        "../../2026-09-29-test-documents/13-id-card-specimen-BAD-photo.jpg",
      "Bank or financial record": "I1-bank-statement-tidewater-pottery.pdf",
      "Proof of address":
        "../../2026-09-29-test-documents/17-supplier-invoice-SCANNED-no-text-layer.pdf",
    },
    notes: {
      "Requested identity record": "Photo of the ID of the primary contact, taken on my phone.",
      "Bank or financial record": "September 2026 statement for Tidewater Pottery Studio LLC.",
      "Proof of address": "Scan of a bill for the studio address.",
    },
  },
  D: {
    notice: "notice-D-product-safety.txt",
    form: "Upload the CPC, test report and photos.",
    files: {
      "Test report or compliance certificate": "D2-lab-test-report-astm-f963.pdf",
      "Product and label photos": "D3-label-photo-tracking-label.png",
    },
    notes: {
      "Test report or compliance certificate":
        "Pacific Rim Product Testing Lab report PRL-2026-77431 dated 24 June 2026 for our 48-inch play tent, batch NW48-0626-A. It covers ASTM F963-23 and 16 CFR 1303 (lead 12 ppm) and 16 CFR 1501, all pass.",
      "Product and label photos":
        "Photo of the product label and tracking label. It shows the manufacturer, the date of manufacture 2 June 2026 and batch NW48-0626-A.",
    },
    explanation:
      "The attached test report is from Pacific Rim Product Testing Lab, a CPSC-accepted laboratory, dated 24 June 2026, and covers ASTM F963-23 and 16 CFR 1303 for the Northwind Pop-Up Play Tent, batch NW48-0626-A. The Children's Product Certificate dated 1 July 2026 lists the same rules. The photo shows the tracking label with the manufacturer, the 2 June 2026 date of manufacture and the batch number.",
  },
  E: {
    notice: "notice-E-related-account.txt",
    form: "Appeal text and supporting documents.",
    files: {
      "Requested identity record":
        "../../2026-09-29-test-documents/12-id-card-specimen-GOOD-photo.jpg",
      "Proof of address": "E3-utility-bill-cedar-lane-candles.pdf",
      "Linked-account resolution record": "E1-statement-former-partner-closure.pdf",
    },
    notes: {
      "Requested identity record": "Photo ID of the owner of Cedar Lane Candles LLC.",
      "Proof of address":
        "Electricity bill dated 1 October 2026 for Cedar Lane Candles LLC at Unit 4, 31 Hawthorn Road, Asheville.",
      "Linked-account resolution record":
        "Signed statement of Marcus Telford dated 8 October 2026, former co-owner of Wickwood Home Co., saying he left in April 2025 and has no access to our account.",
    },
    explanation:
      "I own Cedar Lane Candles LLC. The other account belonged to Wickwood Home Co., which I co-founded with Marcus Telford. He left on 30 April 2025, the company was dissolved on 20 May 2025, its bank account ending 4417 was closed on 15 May 2025 and its seller account was closed on 22 May 2025. We shared an office at Riverside Workspace, 12 Mill Street, Asheville, which explains the shared IP address. Cedar Lane Candles has had its own bank account since 2025 and now operates from Unit 4, 31 Hawthorn Road, Asheville. The attached statement, the dissolution papers, my ID and the utility bill support this.",
  },
  F: {
    notice: "notice-F-funds.txt",
    form: "Email disbursement-appeals@amazon.com with the documents.",
    files: {
      "Bank or financial record": "F1-bank-statement-maple-birch-textiles.pdf",
      "Requested identity record":
        "../../2026-09-29-test-documents/12-id-card-specimen-GOOD-photo.jpg",
    },
    notes: {
      "Bank or financial record":
        "Lakeshore Community Bank business checking statement for September 2026, in the name of Maple & Birch Textiles LLC, account ending 6082.",
      "Requested identity record": "Photo ID of the primary contact on the seller account.",
    },
    explanation:
      "My seller account was deactivated on 6 July 2026 and the 90-day review period has ended. The attached September 2026 statement from Lakeshore Community Bank is in the name of Maple & Birch Textiles LLC, account ending 6082, the account registered on the seller account. The attached photo ID is for the primary contact. I ask for a review of my remaining balance.",
  },
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
  const t = await page
    .locator("main")
    .innerText()
    .catch(() => page.locator("body").innerText());
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
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
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

  await page
    .getByRole("link", { name: /start my case/i })
    .first()
    .click();
  await page.waitForURL(/\/case/);
  const form = page.getByLabel("What the response page asks for");
  if (await form.isVisible().catch(() => false)) await form.fill(c.form);
  if (c.dispute) {
    await page
      .getByText(/Something wrong\? Change it/)
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);
    const labelsHere = await page
      .locator("label, [role=radio], [role=combobox], select")
      .allInnerTexts();
    console.log("FIRST-SCREEN CONTROLS:", labelsHere.filter((t) => t.length < 90).join(" | "));
    const dis = page.getByLabel(/i disagree|dispute|no, i disagree/i).first();
    if (await dis.isVisible().catch(() => false)) await dis.check().catch(() => dis.click());
  }
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1500);
  log("OVERVIEW", await dump(page, "3-overview"), 2500);

  await tab(page, "Documents");
  await snap(page, "4-documents");
  log("DOCUMENTS (before)", await dump(page, "4-documents"), 5000);
  if (explore) return browser.close();

  // Upload each file against its card, like a seller would.
  for (const [label, file] of Object.entries(c.files ?? {})) {
    const card = page.getByRole("region", {
      name: new RegExp(
        "^" +
          label
            .split("")
            .map((ch) => (/[A-Za-z0-9 ,']/.test(ch) ? ch : "."))
            .join(""),
      ),
    });
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
      await card
        .getByText(/Reading finished|Checked d|could not read|Nothing to compare/i)
        .first()
        .waitFor({ timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `5-check-${label.replace(/\W+/g, "-")}`);
      log(
        `CHECK RESULT (${label})`,
        await dump(page, `5-check-${label.replace(/\W+/g, "-")}`),
        4500,
      );
    }
    const note = card.getByLabel(/what does this file show/i).first();
    await note.fill(
      c.notes?.[label] ?? `This is the ${label.toLowerCase()} for the affected product.`,
    );
    await card
      .getByLabel(/i checked the file/i)
      .first()
      .check();
    await card
      .getByRole("button", { name: /save document/i })
      .first()
      .click();
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
      await page
        .locator("label")
        .allInnerTexts()
        .then((a) => a.filter((t) => t.length < 90)),
    );
  }
  const done = page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i });
  if (await done.isVisible().catch(() => false)) await done.check();
  await tab(page, "Response");
  await snap(page, "7-response");
  log("RESPONSE", await dump(page, "7-response"), 5000);
  if (!c.wentWrong && !c.explanation) return browser.close();
  if (c.explanation) {
    await page.getByLabel("Your explanation, in your own words").fill(c.explanation);
    const every = page.getByLabel("My response addresses every issue listed above.");
    if (await every.isVisible().catch(() => false)) await every.check();
  } else {
    await page.getByLabel("What went wrong?").fill(c.wentWrong);
    await page.getByLabel("What have you fixed already?").fill(c.fixed);
    await page.getByLabel("How will you stop it happening again?").fill(c.prevent);
    await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  }
  const complete = page.getByRole("checkbox", {
    name: /i checked the notice and the appeal page/i,
  });
  if (await complete.isVisible().catch(() => false)) await complete.check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1500);
  await snap(page, "8-answers-saved");
  log("BEFORE YOU SEND", await dump(page, "8-answers-saved"), 4000);
  const prepare = page
    .getByRole("button", { name: /prepare (working )?(draft|response)/i })
    .first();
  console.log("prepare enabled:", await prepare.isEnabled());
  await prepare.click();
  await page.waitForTimeout(500);
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    const t = await page.locator("main").innerText();
    if (/Copy (the )?(response|draft|text)|Download|Changes since|Your facts, checked/i.test(t))
      break;
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(3000);
  await snap(page, "9-prepared");
  log("PREPARED RESPONSE", await dump(page, "9-prepared"), 12000);
  if (process.argv[3] === "reply") {
    await page.getByLabel(/i reviewed the facts/i).check();
    await page
      .getByLabel(/i sent the response exactly as prepared/i)
      .check()
      .catch(() => {});
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

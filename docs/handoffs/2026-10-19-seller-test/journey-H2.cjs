// Harder case H2, Pinecrest Home & Outdoor: an authenticity notice answered by a seller who has NO
// supplier invoice (they bought stock at a warehouse club) and no brand letter. Tests what the
// product says about a retail receipt, how "I can't get it" reads, and what the draft claims.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-H2.cjs
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const DIR = __dirname;
const OUT = path.join(DIR, "out");
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const doc = (f) => path.join(DIR, "docs", f);
const NL = String.fromCharCode(10);
const log = (t, s, n = 2500) => console.log(`${NL}=== ${t} ===${NL}${String(s).slice(0, n)}`);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  const main = async () => (await page.locator("main").innerText()).replace(/\n{2,}/g, NL);
  const dump = async (name) => {
    const t = await main();
    fs.writeFileSync(path.join(OUT, `H2-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `H2-${name}.png`), fullPage: true });
    return t;
  };
  const tab = async (n) => {
    await page.getByRole("tab", { name: n, exact: true }).click();
    await page.waitForTimeout(700);
  };

  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);

  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(read("notice-A-authenticity.txt"));
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByText("The problem").first().waitFor();
  await page
    .getByRole("link", { name: /start my case/i })
    .first()
    .click();
  await page.waitForURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1500);
  await tab("Documents");

  // 1. The seller drops a warehouse-club receipt on the invoice card, as many would.
  const card = page.getByRole("region", { name: /^Supplier invoice/ });
  const open = card.getByRole("button", { name: /^open$/i });
  if (await open.isVisible().catch(() => false)) await open.click();
  await card
    .locator("input[type=file]")
    .first()
    .setInputFiles(doc("1C-retail-receipt-warehouse-club.pdf"));
  await page.waitForTimeout(1500);
  await card
    .getByRole("button", { name: /check this document/i })
    .click()
    .catch(() => {});
  await card
    .getByText(/Reading finished|Could not check|Checked d/)
    .first()
    .waitFor({ timeout: 90000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  log("RECEIPT CHECK", await dump("1-receipt-check"), 5000);

  // 2. They realise it is a retail receipt and say they cannot get a supplier invoice.
  const dont = card.getByText(/i don.t have it/i).first();
  if (await dont.isVisible().catch(() => false)) await dont.click();
  await page.waitForTimeout(600);
  const cant = page.getByRole("button", { name: /i can.t get it/i }).first();
  console.log("cant visible:", await cant.isVisible().catch(() => false));
  if (await cant.isVisible().catch(() => false)) {
    await cant.click();
    await page.waitForTimeout(600);
    log("CANNOT OBTAIN PANEL", await dump("2-cannot-obtain"), 5500);
    await page
      .getByLabel(/why can you not obtain it/i)
      .fill(
        "We bought the stock at Costco and Dick's Sporting Goods stores in August and September. The stores only give retail receipts and have no wholesale invoices. We have no supplier.",
      );
    await page.getByRole("button", { name: /record that you cannot obtain this/i }).click();
    await page.waitForTimeout(1200);
  }
  log("AFTER CANNOT OBTAIN", await dump("3-after"), 3500);
  await tab("Response");
  log("RESPONSE TAB", await dump("4-response"), 3500);
  await page
    .getByLabel("What went wrong?")
    .fill(
      "In August and September we bought 41 Trailhead tents and 38 footprints from Costco and Dick's Sporting Goods stores to resell. A customer said the stitching on her tent looked different and complained it was not genuine. We cannot get a supplier invoice because we bought at retail and only have store receipts.",
    );
  await page
    .getByLabel("What have you fixed already?")
    .fill(
      "Finished: on 16 October we stopped selling both ASINs and pulled the remaining 22 tents and 20 footprints from stock. Finished: on 17 October we refunded the customer who complained.",
    );
  await page
    .getByLabel("How will you stop it happening again?")
    .fill(
      "We will only buy branded goods directly from the brand or an authorized distributor and keep the invoice and the brand's authorization letter in one folder before we list anything.",
    );
  await page
    .getByRole("checkbox", { name: /every action i describe as done/i })
    .check()
    .catch(() => {});
  const done = page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i });
  if (await done.isVisible().catch(() => false)) await done.check().catch(() => {});
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1500);
  log("BEFORE YOU SEND", await dump("5-answers"), 3500);
  const prepare = page
    .getByRole("button", { name: /prepare (working )?(draft|response)/i })
    .first();
  await prepare.click();
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    if (
      /Your facts, checked|Copy (the )?(response|draft|text)/i.test(
        await page.locator("main").innerText(),
      )
    )
      break;
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(3000);
  log("PREPARED RESPONSE", await dump("6-prepared"), 14000);
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

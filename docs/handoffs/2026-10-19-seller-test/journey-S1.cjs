// New case 1, Larkspur & Fern Gifts: a Section 3 deactivation answered with invoices from two
// suppliers (and a retail receipt), where the invoices cover fewer units than were sold.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-S1.cjs [stopAfter]
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const DIR = __dirname;
const OUT = path.join(DIR, "out");
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const doc = (f) => path.join(DIR, "docs", f);
const stop = process.argv[2] ?? "end";
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
    fs.writeFileSync(path.join(OUT, `S1-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `S1-${name}.png`), fullPage: true });
    return t;
  };
  const tab = async (n) => {
    await page.getByRole("tab", { name: n, exact: true }).click();
    await page.waitForTimeout(700);
  };
  async function attach(label, file, note) {
    const card = page.getByRole("region", { name: new RegExp("^" + label.replace(/[()]/g, ".")) });
    const open = card.getByRole("button", { name: /^open$/i });
    if (await open.isVisible().catch(() => false)) await open.click();
    await card.locator("input[type=file]").first().setInputFiles(doc(file));
    await card
      .getByRole("button", { name: /check this document/i })
      .click()
      .catch(() => {});
    await card
      .getByText(/Reading finished|Could not check/)
      .first()
      .waitFor({ timeout: 90000 })
      .catch(() => {});
    await card.getByLabel(/what does this file show/i).fill(note);
    await card.getByLabel(/i checked the file/i).check();
    await card.getByRole("button", { name: /save document/i }).click();
    await page.waitForTimeout(1200);
    return card;
  }

  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(read("notice-1-section3.txt"));
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByText("The problem").first().waitFor();
  const dec = await dump("1-decode");
  log("DECODE", dec.split("Your notice, marked up")[0], 1800);
  await page
    .getByRole("link", { name: /start my case/i })
    .first()
    .click();
  await page.waitForURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1200);

  await tab("Documents");
  // the first invoice goes on the card the notice raised
  await attach(
    "Supplier invoice",
    "1A-invoice-lowcountry-wax-2026-07.pdf",
    "Invoice LWS-31877 from Lowcountry Wax & Wick Supply dated 8 Jul 2026 for 120 soy gift sets and 60 beeswax taper packs.",
  );
  // a seller with a second supplier looks for where to put the second invoice
  const body0 = await main();
  log("AFTER FIRST INVOICE: controls", body0.slice(0, 900), 900);
  await page.getByText(/Amazon asked for something else\? Add it/).click();
  await page.waitForTimeout(500);
  log(
    "ADD-OTHER FORM",
    (await page.locator("label").allInnerTexts()).filter((t) => t.length < 80).join(" | "),
    700,
  );
  await page.getByLabel("Document name").fill("Supplier invoice, Magnolia Botanicals");
  await page
    .getByRole("button", { name: /^add$|add document|add to my list/i })
    .first()
    .click()
    .catch(async () => {
      await page.getByRole("button", { name: /add/i }).last().click();
    });
  await page.waitForTimeout(1200);
  await dump("2-after-add-other");
  log(
    "CARDS NOW",
    (await page.getByRole("region").allInnerTexts())
      .map((t) => t.split(NL).slice(0, 2).join(" / "))
      .join(NL),
    800,
  );
  if (stop === "cards") return browser.close();
  await attach(
    "Supplier invoice, Magnolia Botanicals",
    "1B-invoice-magnolia-botanicals-2026-08.pdf",
    "Invoice MB-2026-0562 from Magnolia Botanicals Wholesale dated 19 Aug 2026 for 120 linen room sprays.",
  );

  // business details: units sold
  await page
    .getByText(/^Your business details$/)
    .first()
    .click()
    .catch(() => {});
  await page.getByLabel(/business name, exactly/i).fill("Larkspur & Fern Gifts LLC");
  await page
    .getByLabel(/registered business address/i)
    .fill("412 Bull Street, Suite 6, Savannah, GA 31401");
  await page
    .getByLabel(/your suppliers/i)
    .fill("Lowcountry Wax & Wick Supply Inc." + NL + "Magnolia Botanicals Wholesale LLC");
  await page.getByLabel(/units you sold/i).fill("340");
  await page.getByRole("button", { name: /save business details/i }).click();
  await page.waitForTimeout(1500);
  const biz = await dump("3-business");
  log(
    "COVERAGE",
    biz.slice(
      biz.indexOf("Your invoices against what you sold") - 50,
      biz.indexOf("Your invoices against what you sold") + 500,
    ),
    700,
  );
  await page.screenshot({ path: path.join(OUT, "S1-3-business-top.png") });
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

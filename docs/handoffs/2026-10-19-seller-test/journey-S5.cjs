// New case 5, Brindle Hollow Pet Co.: an Order Defect Rate deactivation that arrives after the seller
// already appealed alone and was refused twice. Tests prior attempts with wording (#91), pasting
// Amazon's second refusal, the change-of-approach panel, an order log as the record, and a new
// Plan of Action that names orders.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-S5.cjs [stopAfter]
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

const FIRST_ATTEMPT =
  "Dear Seller Performance Team, we are sorry for the problems. We take customer satisfaction very seriously and our ODR went up because of some unhappy customers. We have improved our processes and will make sure it never happens again. Please reinstate our account.";

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
    fs.writeFileSync(path.join(OUT, `S5-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `S5-${name}.png`), fullPage: true });
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

  // The seller pastes the FIRST notice, as they have it.
  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(read("notice-5-odr-refused-twice.txt"));
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByText("The problem").first().waitFor();
  log("DECODE", (await dump("1-decode")).split("Your notice, marked up")[0], 1800);
  await page
    .getByRole("link", { name: /start my case/i })
    .first()
    .click();
  await page.waitForURL(/\/case/);
  const first = await dump("2-first-screen");
  log("FIRST SCREEN", first, 3500);

  // #91: record the earlier attempt with its wording.
  await page.waitForTimeout(1500);
  const yes = page.getByRole("button", { name: /yes, i already responded/i }).first();
  if (await yes.isVisible().catch(() => false)) {
    await yes.click();
    await page
      .getByRole("button", { name: "2", exact: true })
      .click()
      .catch(() => {});
  }
  const date = page.getByLabel(/when did you send it/i).first();
  if (await date.isVisible().catch(() => false)) await date.fill("2026-09-24").catch(() => {});
  const text = page.getByLabel(/what did you send/i).first();
  if (await text.isVisible().catch(() => false)) {
    await text.fill(FIRST_ATTEMPT);
    await page
      .getByRole("button", { name: /record this response/i })
      .first()
      .click();
    await page.waitForTimeout(1200);
  } else {
    console.log("NO prior-attempt text box visible on the first screen");
  }
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1500);
  log("OVERVIEW AFTER PRIOR ATTEMPT", await dump("3-overview"), 3000);

  // Amazon's second refusal arrives; the seller pastes it into History.
  await tab("History");
  log("HISTORY (before)", await dump("4-history-before"), 2500);
  await page.getByLabel(/add amazon.s next reply/i).fill(read("reply-5-second-refusal.txt"));
  const analyse = page.locator("#workspace-reply").locator("xpath=following::button[1]");
  console.log("analyse button:", await analyse.innerText());
  await analyse.click();
  await page.waitForTimeout(14000);
  log("AFTER SECOND REFUSAL", await dump("5-after-refusal"), 7000);
  if (stop === "reply") return browser.close();

  // The record Amazon now asks for: the affected orders. Upload the order log against its card.
  await tab("Documents");
  log("DOCUMENTS", await dump("6-documents"), 4500);
  const cards = await page.getByRole("region").allInnerTexts();
  console.log("CARDS:", cards.map((t) => t.split(NL)[0]).join(" | "));
  if (stop === "docs") return browser.close();

  // Start the next round from the reply, upload the order log, write the new plan.
  await tab("History");
  await page.getByRole("button", { name: /start the next round with this reply/i }).click();
  await page.waitForTimeout(1500);
  log("AFTER START NEXT ROUND", await dump("7-next-round"), 3500);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1500);
  await tab("Documents");
  const card = page.getByRole("region", { name: /^Sales or performance record/ });
  const open = card.getByRole("button", { name: /^open$/i });
  if (await open.isVisible().catch(() => false)) await open.click();
  await card
    .locator("input[type=file]")
    .first()
    .setInputFiles(doc("5A-affected-orders-log-brindle-hollow.pdf"));
  await card
    .getByRole("button", { name: /check this document/i })
    .click()
    .catch(() => {});
  await card
    .getByText(/Reading finished|Could not check|Checked d/)
    .first()
    .waitFor({ timeout: 90000 })
    .catch(() => {});
  log("ORDER LOG CHECK", await dump("8-orderlog-check"), 4500);
  await card
    .getByLabel(/what does this file show/i)
    .fill(
      "Log of the 31 orders from 22 July to 20 September 2026 that caused our defects: 13 negative feedback, 11 A-to-z claims and 4 chargebacks, each with order number, ASIN, date, defect type and cause.",
    );
  await card.getByLabel(/i checked the file/i).check();
  await card.getByRole("button", { name: /save document/i }).click();
  await page.waitForTimeout(1500);
  const done = page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i });
  if (await done.isVisible().catch(() => false)) await done.check();
  await tab("Response");
  log("RESPONSE TAB", await dump("9-response"), 4500);
  await page
    .getByLabel("What went wrong?")
    .fill(
      "Of the 31 defect orders (see the attached log), 14 were dog harness orders delivered with the wrong size label because our warehouse relabelled the S and M bags in August. Those caused 9 of the 11 A-to-z claims and 8 of the 13 negative feedback. 9 orders were shipped late during the August bank holiday week with no cover. 4 chargebacks came from one customer who disputed three orders and one fraudulent order.",
    );
  await page
    .getByLabel("What have you fixed already?")
    .fill(
      "Finished: on 28 September 2026 we replaced the S and M bag labels and relabelled all 212 units in stock, checked against the size chart. Finished: on 30 September we set handling cover so two people pack orders on every bank holiday. Finished: on 1 October we contacted all 14 customers with a wrong-size order and refunded or replaced each.",
    );
  await page
    .getByLabel("How will you stop it happening again?")
    .fill(
      "A second person checks the size label against the product on every new batch before it goes on sale, and we keep a dated checklist. Our owner reviews the defect orders every Monday.",
    );
  await page
    .getByRole("checkbox", { name: /every action i describe as done/i })
    .check()
    .catch(() => {});
  if (await done.isVisible().catch(() => false)) await done.check().catch(() => {});
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1500);
  log("BEFORE YOU SEND", await dump("10-answers"), 3500);
  const prepare = page
    .getByRole("button", { name: /prepare (working )?(draft|response)/i })
    .first();
  console.log("prepare enabled:", await prepare.isEnabled());
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
  log("PREPARED RESPONSE", await dump("11-prepared"), 14000);
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

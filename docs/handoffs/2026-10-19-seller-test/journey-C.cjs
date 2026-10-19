// Case C, whole journey: an account-review questionnaire, answered question by question, Amazon says
// one answer is not enough, and the seller revises only that one.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-C.cjs [stopAfter]
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const DIR = __dirname;
const OUT = path.join(DIR, "out");
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const stop = process.argv[2] ?? "end";
const NL = String.fromCharCode(10);
const log = (t, s, n = 2500) => console.log(`${NL}=== ${t} ===${NL}${String(s).slice(0, n)}`);
const notice = JSON.parse(read("more-notices.json")).find((n) => n.id === "N-questionnaire").text;

const ANSWERS = [
  "We sell kitchen tools and small appliances. We buy from two US distributors, Harbor Goods in Providence and Summit Supply in Salt Lake City, and keep every invoice. We ship from our warehouse in Burlington, Vermont.",
  "No. This is the only Amazon seller account I have operated.",
  "We bought the 120 units of B0CR8T4NV2 from Harbor Goods on 14 August 2026. Invoice HG-2088 shows the quantity.",
  "The owner is the founder, Redfern.",
];
const REPLY =
  "Hello Redfern Kitchen Supply,\n\nThank you for your response to the account review questionnaire. We could not reinstate your account because your answer to question 4 does not identify all owners of the business and their share of ownership. Please resubmit your answers, with the full legal name and ownership percentage of each owner.\n\nAccount Review Team\nAmazon.com";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  const main = async () => (await page.locator("main").innerText()).replace(/\n{2,}/g, NL);
  const dump = async (name) => {
    const t = await main();
    fs.writeFileSync(path.join(OUT, `JC-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `JC-${name}.png`), fullPage: true });
    return t;
  };
  const tab = async (n) => {
    await page.getByRole("tab", { name: n, exact: true }).click();
    await page.waitForTimeout(700);
  };
  const boxes = () => page.locator("textarea[id^=workspace-answer-]");
  const prepare = async () => {
    await page.getByRole("button", { name: /prepare (working )?(draft|response)/i }).first().click();
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) {
      if (/Record submission/.test(await main())) break;
      await page.waitForTimeout(3000);
    }
    await page.waitForTimeout(1500);
  };

  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(notice);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByText("The problem").first().waitFor();
  await page.getByRole("link", { name: /start my case/i }).first().click();
  await page.waitForURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1200);
  await dump("1-overview");

  // a reminder date, like a seller who wants to be told
  await tab("Response");
  const n = await boxes().count();
  console.log("answer boxes:", n);
  for (let i = 0; i < Math.min(n, ANSWERS.length); i++) await boxes().nth(i).fill(ANSWERS[i]);
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  const before = await dump("2-answers");
  log("BEFORE YOU SEND", before.slice(before.indexOf("Before you send")), 1200);
  await tab("Documents");
  await page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i }).check().catch(() => {});
  await tab("Response");
  await prepare();
  const r1 = await dump("3-round1");
  log("ROUND 1 RESPONSE", r1.slice(r1.indexOf("Review the exact response")), 4200);
  if (stop === "r1") return browser.close();
  await page.getByLabel(/i reviewed the facts/i).check();
  await page.getByLabel(/i sent the response exactly/i).check().catch(() => {});
  await page.getByLabel(/i have submitted this exact response/i).check();
  await page.getByRole("button", { name: /record submission/i }).click();
  await page.waitForTimeout(1500);

  await tab("History");
  await page.getByLabel(/add amazon.s next reply/i).fill(REPLY);
  await page.locator("#workspace-reply").locator("xpath=following::button[1]").click();
  await page.waitForTimeout(7000);
  const rr = await dump("4-reply");
  log("REPLY READ", rr.slice(rr.indexOf("Review before")), 2200);
  await page.getByRole("button", { name: /start the next round with this reply/i }).click();
  await page.waitForTimeout(2000);
  await tab("Overview");
  const yes = page.getByRole("button", { name: /yes, this is right/i });
  if (await yes.isVisible().catch(() => false)) await yes.click();
  await page.waitForTimeout(1200);
  await tab("Response");
  const r2form = await dump("5-round2-form");
  log("ROUND 2 FORM", r2form.slice(0, 3200), 3200);
  const vals = [];
  for (let i = 0; i < (await boxes().count()); i++) vals.push((await boxes().nth(i).inputValue()).slice(0, 50));
  console.log("ANSWERS KEPT IN ROUND 2:", JSON.stringify(vals));
  if (stop === "r2form") return browser.close();

  await boxes().nth(3).fill(
    "The business has two owners. Dana Redfern, 70 percent, and Marcus Ibarra, 30 percent, as shown in our registration of 3 March 2021.",
  );
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  await prepare();
  const r2 = await dump("6-round2");
  log("ROUND 2 RESPONSE", r2.slice(r2.indexOf("Review the exact response")), 5200);
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

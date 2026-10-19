// Case B, whole journey: a Plan of Action, a refusal asking for records, a resubmission that changes
// nothing, a real revision, then Amazon's final decision.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-B.cjs [stopAfter]
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

const ROUND1 = {
  wentWrong:
    "In the last week of September our only packer, Tomas, was on leave and we had no cover, so about 8% of orders missed the handling cutoff. At the same time we ran an autumn promotion that doubled order volume without extra staff. 41 parcels were also dropped at a carrier drop-box and scanned the next morning, which is why tracking showed late and the valid tracking rate fell to 88%.",
  fixed:
    "Finished: on 10 October we hired a second packer, Lena Ortiz, who starts on 14 October. Finished: we moved our daily shipping cutoff from 3pm to 1pm in Seller Central. Finished: all parcels are now handed to the carrier at the counter and scanned on pickup.",
  prevent:
    "Our warehouse lead checks the open-order count at 11am and 2pm every day and tells the owner if more than 40 orders are waiting. The owner reviews the late shipment and cancel rates every Monday and keeps a log of the numbers.",
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  const main = async () => (await page.locator("main").innerText()).replace(/\n{2,}/g, NL);
  const dump = async (name) => {
    const t = await main();
    fs.writeFileSync(path.join(OUT, `JB-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `JB-${name}.png`), fullPage: true });
    return t;
  };
  const tab = async (n) => {
    await page.getByRole("tab", { name: n, exact: true }).click();
    await page.waitForTimeout(700);
  };
  const prepare = async () => {
    await page.getByRole("button", { name: /prepare (working )?(draft|response)/i }).first().click();
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) {
      if (/Record submission/.test(await main())) break;
      await page.waitForTimeout(3000);
    }
    await page.waitForTimeout(1500);
  };
  const record = async () => {
    await page.getByLabel(/i reviewed the facts/i).check();
    await page.getByLabel(/i sent the response exactly/i).check().catch(() => {});
    await page.getByLabel(/i have submitted this exact response/i).check();
    await page.getByRole("button", { name: /record submission/i }).click();
    await page.waitForTimeout(1500);
  };
  const addReply = async (text) => {
    await tab("History");
    await page.getByLabel(/add amazon.s next reply/i).fill(text);
    await page.locator("#workspace-reply").locator("xpath=following::button[1]").click();
    await page.waitForTimeout(7000);
  };

  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(read("notice-B-performance.txt"));
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByText("The problem").first().waitFor();
  await page.getByRole("link", { name: /start my case/i }).first().click();
  await page.waitForURL(/\/case/);
  await page.getByRole("button", { name: /yes, this is right/i }).click();
  await page.waitForTimeout(1200);

  // ---- ROUND 1: a Plan of Action, no documents ----
  await tab("Documents");
  await page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i }).check();
  await tab("Response");
  await page.getByLabel("What went wrong?").fill(ROUND1.wentWrong);
  await page.getByLabel("What have you fixed already?").fill(ROUND1.fixed);
  await page.getByLabel("How will you stop it happening again?").fill(ROUND1.prevent);
  await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  await prepare();
  const r1 = await dump("1-round1");
  log("ROUND 1", r1.slice(r1.indexOf("ROOT CAUSE") - 100), 3600);
  await record();

  // ---- AMAZON REFUSES, ASKING FOR RECORDS ----
  await addReply(read("reply-B-refusal.txt"));
  const rp = await dump("2-refusal-read");
  log("REFUSAL READ", rp.slice(rp.indexOf("Review before")), 2600);
  await page.getByRole("button", { name: /start the next round with this reply/i }).click();
  await page.waitForTimeout(2000);
  await tab("Overview");
  const ov = await dump("3-round2-overview");
  log("ROUND 2 OVERVIEW", ov, 2600);
  const yes = page.getByRole("button", { name: /yes, this is right/i });
  if (await yes.isVisible().catch(() => false)) await yes.click();
  await page.waitForTimeout(1200);
  await tab("Documents");
  const d2 = await dump("4-round2-docs");
  log("ROUND 2 DOCUMENTS", d2.slice(0, 2400), 2400);
  if (stop === "docs2") return browser.close();

  // ---- ROUND 2, STEP 1: resubmit with nothing changed ----
  await tab("Response");
  const labels = await page.locator("label").allInnerTexts();
  log("ROUND 2 RESPONSE LABELS", labels.filter((t) => t.length < 90).join(" | "), 800);
  await page.getByRole("button", { name: /save my answers/i }).click().catch(() => {});
  await page.waitForTimeout(800);
  await prepare();
  const same = await dump("5-round2-unchanged");
  log("UNCHANGED RESUBMISSION", same.slice(same.indexOf("Before you submit")), 2400);
  if (stop === "same") return browser.close();

  // ---- ROUND 2, STEP 2: a real revision with the carrier record ----
  await tab("Documents");
  const rec = page.getByRole("region", { name: /^Sales or performance record/ });
  if (await rec.getByRole("button", { name: /^open$/i }).isVisible().catch(() => false))
    await rec.getByRole("button", { name: /^open$/i }).click();
  await rec.locator("input[type=file]").first().setInputFiles(doc("B1-carrier-pickup-delays-summary.pdf"));
  await rec.getByRole("button", { name: /check this document/i }).click().catch(() => {});
  await rec.getByText(/Reading finished/).first().waitFor({ timeout: 90000 }).catch(() => {});
  log("CARRIER RECORD CHECK", await rec.innerText(), 2800);
  await rec.getByLabel(/what does this file show/i).fill(
    "Warehouse summary of weekly orders and late shipments from 15 Sep to 8 Oct 2026, with the main reason for each week. Weeks of 22 and 29 Sep had 21 and 27 late orders.",
  );
  await rec.getByLabel(/i checked the file/i).check();
  await rec.getByRole("button", { name: /save document/i }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i }).check().catch(() => {});
  await tab("Response");
  await page.getByLabel("What went wrong?").fill(
    ROUND1.wentWrong +
      " The attached summary shows 21 of 248 orders late in the week of 22 September and 27 of 301 in the week of 29 September, the two weeks with no cover for the packer and the promotion.",
  );
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  await prepare();
  const rev = await dump("6-round2-revised");
  log("REVISED RESPONSE", rev.slice(rev.indexOf("Review the exact response")), 6200);
  if (stop === "r2") return browser.close();
  await record();

  // ---- FINAL DECISION ----
  await addReply(
    read("more-notices.json") && JSON.parse(read("more-notices.json")).find((n) => n.id === "T-reply-final").text.replace("Brightline Imports", "Pinecrest Pet Supply"),
  );
  const fin = await dump("7-final");
  log("FINAL DECISION READ", fin.slice(fin.indexOf("Submissions and replies")), 2600);
  await page.goto(BASE + "/dashboard");
  await page.waitForTimeout(2500);
  log("DASHBOARD AFTER FINAL", await dump("8-dashboard"), 3200);
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

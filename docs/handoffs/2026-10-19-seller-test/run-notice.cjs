// Pastes one notice from more-notices.json into /decode, starts the case and dumps what a seller sees.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/run-notice.cjs M-multi-issue
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const id = process.argv[2];
const notices = JSON.parse(fs.readFileSync(path.join(__dirname, "more-notices.json"), "utf8"));
const n = notices.find((x) => x.id === id);
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(BASE + "/decode");
  await page.getByLabel("Your notice").fill(n.text);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  const t0 = Date.now();
  await page.getByText(/The problem|Could not decode|This message|This is a warning|needs professional/).first().waitFor({ timeout: 90000 }).catch(() => {});
  console.log("decode took ms:", Date.now() - t0);
  await page.waitForTimeout(800);
  const main = async () => (await page.locator("main").innerText()).replace(/\n{2,}/g, "\n");
  const decode = await main();
  fs.writeFileSync(path.join(OUT, `${id}-decode.txt`), decode);
  await page.screenshot({ path: path.join(OUT, `${id}-decode.png`), fullPage: true });
  console.log("=== DECODE ===\n" + decode.split("Your notice, marked up")[0].slice(0, 2600));
  const after = decode.split("Your notice, marked up")[1] ?? "";
  console.log("=== DECODE (after notice) ===\n" + after.slice(after.indexOf("What to gather") >= 0 ? after.indexOf("What to gather") : 0).slice(0, 1800));

  const start = page.getByRole("link", { name: /start my case/i }).first();
  if (await start.isVisible().catch(() => false)) {
    await start.click();
    await page.waitForURL(/\/case/);
    const ok = page.getByRole("button", { name: /yes, this is right/i });
    if (await ok.isVisible().catch(() => false)) await ok.click();
    await page.waitForTimeout(1500);
    const overview = await main();
    fs.writeFileSync(path.join(OUT, `${id}-case.txt`), overview);
    console.log("=== CASE ===\n" + overview.slice(0, 2600));
    const resp = page.getByRole("tab", { name: "Response", exact: true });
    if (await resp.isVisible().catch(() => false)) {
      await resp.click();
      await page.waitForTimeout(800);
      const r = await main();
      fs.writeFileSync(path.join(OUT, `${id}-response.txt`), r);
      console.log("=== RESPONSE TAB ===\n" + r.slice(0, 2200));
    }
  } else {
    console.log("(no Start my case link)");
  }
  await browser.close();
})().catch((e) => {
  console.error("FAILED", e.message);
  process.exit(1);
});

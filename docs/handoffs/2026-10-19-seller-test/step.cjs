// Runs one step of a live session: node step.cjs <file.js>. The file is the body of an async function
// that receives { page, say, shot }. Prints what a person would see afterwards.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[ctx.pages().length - 1];
  const say = (...a) => console.log(...a);
  let n = 0;
  const shot = (name) => page.screenshot({ path: path.join(__dirname, "out", `live-${name || ++n}.png`), fullPage: true });
  const body = fs.readFileSync(path.resolve(process.argv[2]), "utf8");
  const fn = new Function("ctx", "return (async ({ page, say, shot, ctx, require }) => {" + body + "\n})")(ctx);
  try {
    await fn({ page, say, shot, ctx, require });
  } catch (e) {
    console.log("STEP ERROR:", String(e.message).split("\n").slice(0, 3).join(" | "));
  }
  const txt = await page.locator("main").innerText().catch(() => page.locator("body").innerText());
  console.log("URL:", page.url());
  console.log("---- SCREEN ----");
  console.log(txt.replace(/\n{2,}/g, "\n").slice(0, Number(process.env.MAX ?? 3500)));
  process.exit(0);
})();

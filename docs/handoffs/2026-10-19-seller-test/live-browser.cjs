// A visible browser that stays open, so a session can be driven one step at a time like a person
// would: node live-browser.cjs   (leave running), then connect with connectOverCDP on port 9333.
const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ headless: false, args: ["--remote-debugging-port=9333", "--window-size=1300,950"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.newPage();
  console.log("LIVE BROWSER READY");
  await new Promise(() => {});
})();

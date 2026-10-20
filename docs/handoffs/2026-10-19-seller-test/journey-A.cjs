// Case A, whole journey: round 1 with a document the seller cannot get, Amazon's reply, round 2.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/journey-A.cjs [stopAfter]
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
const log = (t, s, n = 2500) => console.log(`\n=== ${t} ===\n${String(s).slice(0, n)}`);

const reply = (
  JSON.parse(read("more-notices.json")).find((n) => n.id === "U-reply-documents") ?? {}
).text;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  const main = async () => (await page.locator("main").innerText()).replace(/\n{2,}/g, "\n");
  const dump = async (name) => {
    const t = await main();
    fs.writeFileSync(path.join(OUT, `JA-${name}.txt`), t);
    await page.screenshot({ path: path.join(OUT, `JA-${name}.png`), fullPage: true });
    return t;
  };
  const tab = async (n) => {
    await page.getByRole("tab", { name: n, exact: true }).click();
    await page.waitForTimeout(700);
  };

  // sign in, decode, start the case
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
  await page.waitForTimeout(1200);

  // ---- ROUND 1 ----
  await tab("Documents");
  const inv = page.getByRole("region", { name: /^Supplier invoice/ });
  if (
    await inv
      .getByRole("button", { name: /^open$/i })
      .isVisible()
      .catch(() => false)
  )
    await inv.getByRole("button", { name: /^open$/i }).click();
  await inv
    .locator('input[type="file"]')
    .first()
    .setInputFiles(doc("A1-supplier-invoice-summit-peak-2026-08.pdf"));
  await inv.getByRole("button", { name: /check this document/i }).click();
  await inv
    .getByText(/Reading finished/)
    .first()
    .waitFor({ timeout: 90000 })
    .catch(() => {});
  await inv
    .getByLabel(/what does this file show/i)
    .fill(
      "Invoice SP-2026-08817 from Summit Peak Wholesale dated 14 Aug 2026 for 120 Trailhead tents and 120 footprints.",
    );
  await inv.getByLabel(/i checked the file/i).check();
  await inv.getByRole("button", { name: /save document/i }).click();
  await page.waitForTimeout(1200);

  // the brand letter cannot be obtained yet
  const letter = page.getByRole("region", { name: /^Authorization letter/ });
  if (
    await letter
      .getByRole("button", { name: /^open$/i })
      .isVisible()
      .catch(() => false)
  )
    await letter.getByRole("button", { name: /^open$/i }).click();
  await page.waitForTimeout(500);
  log("LETTER CARD", await letter.innerText(), 2500);
  if (process.env.EXPLORE) return browser.close();
  const dont = letter.getByText(/^I don.t have it$/);
  if (await dont.isVisible().catch(() => false)) {
    await dont.click();
    await page.waitForTimeout(500);
    log("I DON'T HAVE IT MENU", await letter.innerText(), 2200);
  }
  await letter.getByText(/^I can.t get it$/).click();
  await page.waitForTimeout(500);
  log("CANNOT-OBTAIN PANEL", await letter.innerText(), 1800);
  await letter
    .getByLabel(/why can you not obtain it/i)
    .fill(
      "Trailhead Gear Co. only answers dealer requests by post and has not replied to my email of 12 October.",
    );
  await letter.getByRole("button", { name: /record that you cannot obtain/i }).click();
  await page.waitForTimeout(1200);
  await dump("1-docs-after-cannot");

  await page.getByRole("checkbox", { name: /i checked the notice and the appeal page/i }).check();
  await tab("Response");
  await page
    .getByLabel("What went wrong?")
    .fill(
      "In August we bought 120 Trailhead tents and 120 footprints from Summit Peak Wholesale and listed them as B0CK7T2M9R and B0CK7T4L1Q. A customer thought the stitching looked different and complained the tent was not genuine. We held the supplier invoice but not the brand's authorization letter for Summit Peak.",
    );
  await page
    .getByLabel("What have you fixed already?")
    .fill(
      "Finished: on 15 October we attached invoice SP-2026-08817 dated 14 August 2026. Finished: on 12 October we asked Trailhead Gear Co. by email for the authorization letter. In progress: waiting for the letter.",
    );
  await page
    .getByLabel("How will you stop it happening again?")
    .fill(
      "Before we list a new supplier's stock, the owner files the invoice and the brand's letter together. We match invoiced quantities to our sales report every month.",
    );
  await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: /prepare (working )?(draft|response)/i })
    .first()
    .click();
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    if (/Record submission/.test(await main())) break;
    await page.waitForTimeout(3000);
  }
  const prepared = await dump("2-round1-prepared");
  log("ROUND 1 RESPONSE", prepared.slice(prepared.indexOf("ROOT CAUSE") - 200), 5200);
  if (stop === "r1") return browser.close();

  await page.getByLabel(/i reviewed the facts/i).check();
  await page
    .getByLabel(/i sent the response exactly/i)
    .check()
    .catch(() => {});
  await page.getByLabel(/i have submitted this exact response/i).check();
  await page.getByRole("button", { name: /record submission/i }).click();
  await page.waitForTimeout(1500);

  // ---- AMAZON REPLIES ----
  await tab("History");
  await page.getByLabel(/add amazon.s next reply/i).fill(reply);
  await page.locator("#workspace-reply").locator("xpath=following::button[1]").click();
  await page.waitForTimeout(8000);
  const afterReply = await dump("3-reply-read");
  log("REPLY READ", afterReply.slice(afterReply.indexOf("Review before changing")), 3200);
  if (stop === "reply") return browser.close();

  await page.getByRole("button", { name: /start the next round with this reply/i }).click();
  await page.waitForTimeout(2000);
  await dump("4-round2-start");
  await tab("Documents");
  const d2 = await dump("5-round2-docs");
  log(
    "ROUND 2 DOCUMENT CARDS",
    (await page.getByRole("region").allInnerTexts())
      .map((t) => t.split(String.fromCharCode(10)).slice(0, 3).join(" / "))
      .join(String.fromCharCode(10)),
    1500,
  );
  if (stop === "r2docs") return browser.close();

  // new upstream invoice
  const up = page.getByRole("region", { name: /^Invoice from the supplier/ });
  if (
    await up
      .getByRole("button", { name: /^open$/i })
      .isVisible()
      .catch(() => false)
  )
    await up.getByRole("button", { name: /^open$/i }).click();
  await up
    .locator("input[type=file]")
    .first()
    .setInputFiles(doc("A4-manufacturer-invoice-trailhead-to-summit-peak.pdf"));
  await up.getByRole("button", { name: /check this document/i }).click();
  await up
    .getByText(/Reading finished/)
    .first()
    .waitFor({ timeout: 90000 })
    .catch(() => {});
  await up
    .getByLabel(/what does this file show/i)
    .fill(
      "Invoice TG-55120 from Trailhead Gear Co. to Summit Peak Wholesale dated 22 Jul 2026 for 400 tents and 400 footprints.",
    );
  await up.getByLabel(/i checked the file/i).check();
  await up.getByRole("button", { name: /save document/i }).click();
  await page.waitForTimeout(1200);

  // the brand letter arrived after all
  const letter2 = page.getByRole("region", { name: /^Authorization letter/ });
  if (
    await letter2
      .getByRole("button", { name: /^open$/i })
      .isVisible()
      .catch(() => false)
  )
    await letter2.getByRole("button", { name: /^open$/i }).click();
  await page.waitForTimeout(500);
  log("LETTER CARD (round 2)", await letter2.innerText(), 1800);
  const reopen = letter2.getByRole("button", { name: /i can obtain it after all/i });
  if (await reopen.isVisible().catch(() => false)) {
    await reopen.click();
    await page.waitForTimeout(600);
  }
  await letter2
    .locator("input[type=file]")
    .first()
    .setInputFiles(doc("A3-brand-letter-trailhead-authorizing-summit-peak.pdf"));
  await letter2
    .getByRole("button", { name: /check this document/i })
    .click()
    .catch(() => {});
  await letter2
    .getByText(/Reading finished/)
    .first()
    .waitFor({ timeout: 90000 })
    .catch(() => {});
  await letter2
    .getByLabel(/what does this file show/i)
    .fill(
      "Letter from Trailhead Gear Co. dated 1 July 2026 naming Summit Peak Wholesale as its authorized US distributor.",
    );
  await letter2.getByLabel(/i checked the file/i).check();
  await letter2.getByRole("button", { name: /save document/i }).click();
  await page.waitForTimeout(1200);
  await dump("7-round2-docs-done");
  await page
    .getByRole("checkbox", { name: /i checked the notice and the appeal page/i })
    .check()
    .catch(() => {});

  // confirm the new request, then revise the answers
  await tab("Overview");
  const yes = page.getByRole("button", { name: /yes, this is right/i });
  if (await yes.isVisible().catch(() => false)) await yes.click();
  await page.waitForTimeout(1200);
  await tab("Response");
  log(
    "ROUND 2 RESPONSE TAB LABELS",
    (await page.locator("label").allInnerTexts()).filter((t) => t.length < 90).join(" | "),
    900,
  );
  const expl = page.getByLabel("Your explanation, in your own words");
  if (await expl.isVisible().catch(() => false)) {
    await expl.fill(
      "Summit Peak Wholesale bought these tents from Trailhead Gear Co. The attached invoice TG-55120, dated 22 July 2026, is from Trailhead Gear Co. to Summit Peak Wholesale for 400 tents and 400 footprints. Our own invoice SP-2026-08817 dated 14 August 2026 is for 120 tents and 120 footprints from Summit Peak. The attached letter from Trailhead Gear Co., dated 1 July 2026, names Summit Peak Wholesale as its authorized distributor in the US.",
    );
    const every = page.getByLabel("My response addresses every issue listed above.");
    if (await every.isVisible().catch(() => false)) await every.check();
  } else {
    await page
      .getByLabel("What have you fixed already?")
      .fill(
        "Finished: on 15 October we attached invoice SP-2026-08817. Finished: on 19 October we received the authorization letter and attach it.",
      );
    await page.getByRole("checkbox", { name: /every action i describe as done/i }).check();
  }
  await page.getByRole("button", { name: /save my answers/i }).click();
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: /prepare (working )?(draft|response)/i })
    .first()
    .click();
  const t1 = Date.now();
  while (Date.now() - t1 < 150000) {
    if (/Record submission/.test(await main())) break;
    await page.waitForTimeout(3000);
  }
  const r2p = await dump("8-round2-prepared");
  log("ROUND 2 RESPONSE", r2p.slice(r2p.indexOf("Review the exact response")), 5600);
  if (stop === "r2") return browser.close();

  // evidence pack
  await tab("History");
  const [pack] = await Promise.all([
    page.waitForEvent("download", { timeout: 60000 }),
    page.getByRole("button", { name: /download upload-ready pack/i }).click(),
  ]);
  const zipPath = path.join(OUT, "JA-pack.zip");
  await pack.saveAs(zipPath);
  console.log("PACK", pack.suggestedFilename(), fs.statSync(zipPath).size, "bytes");
  console.log(
    require("node:child_process")
      .execFileSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          "Add-Type -A System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::OpenRead((Resolve-Path JA-pack.zip)).Entries | ForEach-Object { $_.FullName }",
        ],
        { cwd: OUT },
      )
      .toString(),
  );
  await tab("Response");
  await page.getByLabel(/i reviewed the facts/i).check();
  await page
    .getByLabel(/i sent the response exactly/i)
    .check()
    .catch(() => {});
  await page.getByLabel(/i have submitted this exact response/i).check();
  await page.getByRole("button", { name: /record submission/i }).click();
  await page.waitForTimeout(1500);

  // Amazon reinstates
  await tab("History");
  const reinstated = JSON.parse(read("more-notices.json"))
    .find((n) => n.id === "S-reply-reinstated")
    .text.replace("Pinecrest Pet Supply", "Ridgeline Outdoor Supply");
  await page.getByLabel(/add amazon.s next reply/i).fill(reinstated);
  await page.locator("#workspace-reply").locator("xpath=following::button[1]").click();
  await page.waitForTimeout(6000);
  const fin = await dump("9-reinstated");
  log("REINSTATED REPLY READ", fin.slice(fin.indexOf("Review before")), 2200);
  await page.goto(BASE + "/dashboard");
  await page.waitForTimeout(2500);
  const dash = await dump("10-dashboard");
  log("DASHBOARD", dash, 3500);
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(String.fromCharCode(10)).slice(0, 5).join(" | "));
  process.exit(1);
});

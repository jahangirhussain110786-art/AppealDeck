// Calls every AI-backed API route with invented material and prints what came back, so a provider
// (Gemini or the Groq fallback) can be judged on its answers rather than on a status code.
//   node --env-file=.env.local docs/handoffs/2026-10-19-seller-test/ai-probe.cjs [decode|reply|wording|all]
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { request, chromium } = require("@playwright/test");

const BASE = process.env.BASE ?? "http://localhost:3100";
const DIR = __dirname;
const what = process.argv[2] ?? "all";
const NL = String.fromCharCode(10);
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");

(async () => {
  // Sign in through the page so the session cookies are exactly what the app sets.
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 90000 });
  const api = ctx.request;
  const post = async (url, data) => {
    const t0 = Date.now();
    const r = await api.post(BASE + url, { data, timeout: 120000 });
    let body;
    try {
      body = await r.json();
    } catch {
      body = { raw: (await r.text()).slice(0, 200) };
    }
    return { status: r.status(), ms: Date.now() - t0, body };
  };

  if (what === "all" || what === "decode") {
    const files = fs.readdirSync(DIR).filter((f) => /^notice-.*\.txt$/.test(f));
    for (const f of files) {
      const r = await post("/api/decode", { text: read(f) });
      const b = r.body;
      console.log(
        `DECODE ${f.padEnd(34)} ${r.status} ${String(r.ms).padStart(5)}ms kind=${b.kind ?? b.classification?.kind ?? "?"} second=${b.secondReading ?? (b.secondReadingKind ? "kind:" + b.secondReadingKind : "-")} ${b.error ? "ERR " + b.error : ""}`,
      );
      if (process.env.VERBOSE) console.log(JSON.stringify(b).slice(0, 700));
    }
  }

  if (what === "all" || what === "reply") {
    const files = fs.readdirSync(DIR).filter((f) => /^reply-.*\.txt$/.test(f));
    for (const f of files) {
      const r = await post("/api/analyze-reply", { reply: read(f) });
      console.log(`REPLY  ${f.padEnd(34)} ${r.status} ${String(r.ms).padStart(5)}ms ${JSON.stringify(r.body).slice(0, 500)}`);
    }
  }

  if (what === "all" || what === "wording") {
    const caseId = crypto.randomUUID();
    const samples = [
      ["explanation", "PRODUCT_SAFETY", "i uploaded the sds and the un38 3 report the battery is 74 Wh. we sell it since march 2025 and sold 412 units"],
      ["correctiveActions", "INAUTHENTIC", "We stopped buying from the cheap supplier on 3 August 2026 and now only buy from Lowcountry Wax & Wick Supply Inc."],
      ["preventiveMeasures", "PERFORMANCE_METRIC", "our team checks every order before it ships and we keep a log, owner reviews it weekly"],
      ["answer", "RELATED_ACCOUNT", "I have one account. My brother has his own account at the same address but we never share anything, 2 accounts total."],
    ];
    for (const [section, kind, text] of samples) {
      const r = await post("/api/improve-wording", { caseId, kind, section, text });
      console.log(`WORD   ${section.padEnd(20)} ${r.status} ${String(r.ms).padStart(5)}ms ${JSON.stringify(r.body).slice(0, 600)}`);
    }
  }
  await browser.close();
})().catch((e) => {
  console.error("FAILED", String(e.message).split(NL).slice(0, 5).join(" | "));
  process.exit(1);
});

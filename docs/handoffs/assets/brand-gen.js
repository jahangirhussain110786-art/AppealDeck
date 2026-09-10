// AppealDeck brand asset generator (reviewing AI, 9 Sep 2026, v2 — mark options + value-first OG copy).
// Prerequisites (scratch, outside the repo): `npm i opentype.js@1.3.4` in this folder and an Inter SemiBold
// font file next to this script (Inter-600.ttf/woff or Inter-SemiBold.otf). Uses the repo's own Playwright Chromium.
// Outputs: V:/AppealDeck1/public/brand/* and V:/AppealDeck1/docs/handoffs/assets/*.
// Usage: node brand-gen.js [A|B|C]   (mark option; default A)
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "V:/AppealDeck1";
const OUT = path.join(REPO, "public/brand");
const PREVIEW_OUT = path.join(REPO, "docs/handoffs/assets");
const HERE = __dirname;
const MARK = (process.argv[2] || "E2").toUpperCase();

const opentype = require(path.join(HERE, "node_modules/opentype.js"));
const { chromium } = require(path.join(REPO, "node_modules/playwright"));

// ---- brand constants (must match docs/handoffs/2026-09-09-visual-refresh-spec.md §1–§2) ----
const GREEN = "#1C7D5E"; // hsl(161 64% 30%)
const MINT = "#6CD0AF"; // hsl(160 52% 62%)
const NAVY = "#0D1017"; // hsl(224 28% 7%)
const INK = "#13182A"; // hsl(224 32% 11%)
const PAPER = "#F3F5F9";
const CARD = "#151A28";
const CARD_BORDER = "#26304A";
const MUTED = "#9AA3B5";

// ---- mark options (all on a 32-unit grid, white glyph on the green tile) ----
const GLYPHS = {
  // E2 — LOCKED 9 Sep 2026: "the deck, checked" — three sheets stepping back in perspective, check on the front sheet.
  E2: [
    `<rect x="14" y="5.5" width="12" height="15" rx="2.6" fill="#FFFFFF" fill-opacity="0.38"/>`,
    `<rect x="10.5" y="8" width="12.5" height="15.5" rx="2.6" fill="#FFFFFF" fill-opacity="0.66"/>`,
    `<rect x="6.5" y="10.5" width="13.5" height="16.5" rx="2.8" fill="#FFFFFF"/>`,
    `<path d="M9.9 19.4l2.8 2.8 5.3-5.8" fill="none" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  ].join(""),
  // A — "an A built from three cards": two leaning cards form the letter, a short card is the crossbar.
  A: [
    `<g transform="translate(11.7 17.2) rotate(19)"><rect x="-4.1" y="-9.8" width="8.2" height="19.6" rx="2.4" fill="#FFFFFF"/></g>`,
    `<g transform="translate(20.3 17.2) rotate(-19)"><rect x="-4.1" y="-9.8" width="8.2" height="19.6" rx="2.4" fill="#FFFFFF"/></g>`,
    `<rect x="10.2" y="19.4" width="11.6" height="3.8" rx="1.9" fill="#FFFFFF"/>`,
  ].join(""),
  // D — "stacked deck": three cards of growing width stacked into an A-shaped silhouette.
  D: [
    `<rect x="12" y="7" width="8" height="4.2" rx="1.6" fill="#FFFFFF" fill-opacity="0.55"/>`,
    `<rect x="9" y="13.4" width="14" height="4.6" rx="1.8" fill="#FFFFFF" fill-opacity="0.8"/>`,
    `<rect x="6" y="20.2" width="20" height="5" rx="2" fill="#FFFFFF"/>`,
  ].join(""),
  // B — "fanned deck": three cards fanned from one pivot, the front card carries the check.
  B: [
    `<g transform="translate(16 26.5)">`,
    `<g transform="rotate(-18)"><rect x="-5" y="-17" width="10" height="16" rx="2.4" fill="#FFFFFF" fill-opacity="0.45"/></g>`,
    `<g transform="rotate(18)"><rect x="-5" y="-17" width="10" height="16" rx="2.4" fill="#FFFFFF" fill-opacity="0.45"/></g>`,
    `<rect x="-5" y="-20" width="10" height="16" rx="2.4" fill="#FFFFFF"/>`,
    `<path d="M-2.6 -12.4l1.9 1.9 3.6-3.8" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    `</g>`,
  ].join(""),
  // C — "monogram A": a geometric letter A in one continuous stroke.
  C: `<path d="M8.5 25.5L16 7.5l7.5 18M11.7 19.6h8.6" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// single-colour (currentColor) outline versions for print / monochrome contexts
const MONO = {
  E2: [
    `<rect x="6.9" y="10.9" width="12.7" height="15.7" rx="2.6"/>`,
    `<path d="M10.9 10.9V10.5a2.4 2.4 0 0 1 2.4-2.4h7.4a2.4 2.4 0 0 1 2.4 2.4v10.6a2.4 2.4 0 0 1-2.4 2.4h-1"/>`,
    `<path d="M14.4 8.1V7.8a2.4 2.4 0 0 1 2.4-2.4h6.9a2.4 2.4 0 0 1 2.4 2.4v10.3a2.4 2.4 0 0 1-2.4 2.4h-1"/>`,
    `<path d="M10 19.3l2.7 2.7 5.2-5.6" stroke-linecap="round"/>`,
  ].join(""),
  A: `<path d="M8.6 25.6L16 7.6l7.4 18M11.6 19.8h8.8" stroke-width="3.2" stroke-linecap="round"/>`,
  D: [
    `<rect x="12" y="7" width="8" height="4.2" rx="1.6"/>`,
    `<rect x="9" y="13.4" width="14" height="4.6" rx="1.8"/>`,
    `<rect x="6" y="20.2" width="20" height="5" rx="2"/>`,
  ].join(""),
  B: [
    `<g transform="translate(16 26.5)">`,
    `<g transform="rotate(-18)"><rect x="-5" y="-17" width="10" height="16" rx="2.4"/></g>`,
    `<g transform="rotate(18)"><rect x="-5" y="-17" width="10" height="16" rx="2.4"/></g>`,
    `<rect x="-5" y="-20" width="10" height="16" rx="2.4"/>`,
    `</g>`,
  ].join(""),
  C: `<path d="M8.5 25.5L16 7.5l7.5 18M11.7 19.6h8.6"/>`,
};

const glyphOf = (opt) => GLYPHS[opt] || GLYPHS.A;
const GLYPH = glyphOf(MARK);

const tile = (size, rx, glyph) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="${rx}" fill="${GREEN}"/>${glyph}</svg>`;
const markSvg = (size, rx) => tile(size, rx, GLYPH);
const maskableSvg = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" fill="${GREEN}"/><g transform="translate(16 16) scale(0.62) translate(-16 -16)">${GLYPH}</g></svg>`;
const monoSvg = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round">${MONO[MARK] || MONO.A}</svg>`;

function withTitle(svg) {
  return svg.replace("<svg ", `<svg role="img" aria-labelledby="t" `).replace("viewBox=\"0 0 32 32\">", `viewBox="0 0 32 32"><title id="t">AppealDeck</title>`);
}

function findFont() {
  for (const f of ["Inter-600.ttf", "Inter-SemiBold.otf", "Inter-SemiBold.ttf"]) {
    const p = path.join(HERE, f);
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Inter SemiBold font file not found in " + HERE);
}

// Outlined wordmark: "Appeal" + "Deck" as two paths so the two-tone colouring survives as vector.
function wordmark(font, size, x, baseline) {
  const opts = { kerning: true, letterSpacing: -0.02 };
  const wA = font.getAdvanceWidth("Appeal", size, opts);
  const wD = font.getAdvanceWidth("Deck", size, opts);
  const pathA = font.getPath("Appeal", x, baseline, size, opts).toPathData(2);
  const pathD = font.getPath("Deck", x + wA, baseline, size, opts).toPathData(2);
  return { pathA, pathD, width: wA + wD - 0.02 * size };
}

function horizontalLogo(font, variant, glyph = GLYPH) {
  const size = 46;
  const textX = 64 + 18;
  const baseline = 32 + Math.round((0.727 * size) / 2);
  const { pathA, pathD, width } = wordmark(font, size, textX, baseline);
  const total = Math.ceil(textX + width + 2);
  const fgA = variant === "dark" ? PAPER : INK;
  const fgD = variant === "dark" ? MINT : GREEN;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="64" viewBox="0 0 ${total} 64" role="img" aria-labelledby="t">` +
    `<title id="t">AppealDeck</title>` +
    `<g transform="scale(2)"><rect width="32" height="32" rx="8" fill="${GREEN}"/>${glyph}</g>` +
    `<path d="${pathA}" fill="${fgA}"/><path d="${pathD}" fill="${fgD}"/></svg>`;
  return { svg, width: total, height: 64 };
}

function wordmarkOnly(font, variant) {
  const size = 64;
  const baseline = Math.round(0.727 * size) + 4;
  const { pathA, pathD, width } = wordmark(font, size, 2, baseline);
  const total = Math.ceil(width + 6);
  const h = Math.round(size * 0.95);
  const fgA = variant === "dark" ? PAPER : INK;
  const fgD = variant === "dark" ? MINT : GREEN;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${h}" viewBox="0 0 ${total} ${h}" role="img" aria-labelledby="t"><title id="t">AppealDeck</title><path d="${pathA}" fill="${fgA}"/><path d="${pathD}" fill="${fgD}"/></svg>`;
}

// ---- rasterisation helpers ----
const page_ = (inner, bg) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${bg};}svg{display:block}</style></head><body>${inner}</body></html>`;

async function shot(browser, html, width, height, dpr, opts = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  // Network stalls (Google Fonts) must not break generation: settle on DOM, then give fonts a bounded wait.
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (opts.fonts) {
    try {
      await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 8000))]);
      await page.waitForTimeout(400);
    } catch {}
  }
  const buf = await page.screenshot({ omitBackground: !!opts.transparent, type: "png", fullPage: !!opts.fullPage });
  await page.close();
  return buf;
}

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirs = [];
  const datas = [];
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    dirs.push(e);
    datas.push(buf);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dirs, ...datas]);
}

// Inter embedded from the local WOFF files (deterministic, offline); falls back to the Google Fonts link only if none exist.
function interCss() {
  const faces = [400, 500, 600, 700]
    .map((w) => ({ w, p: path.join(HERE, `Inter-${w}.ttf`) }))
    .filter((f) => fs.existsSync(f.p))
    .map((f) => {
      const b64 = fs.readFileSync(f.p).toString("base64");
      const fmt = fs.readFileSync(f.p).slice(0, 4).toString("ascii") === "wOFF" ? "woff" : "truetype";
      return `@font-face{font-family:Inter;font-style:normal;font-weight:${f.w};src:url(data:font/${fmt};base64,${b64}) format("${fmt}");}`;
    });
  if (faces.length === 0) return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap">`;
  return `<style>${faces.join("")}</style>`;
}
const INTER_LINK = interCss();
const LABEL = `font:600 11px/1 Inter,system-ui;letter-spacing:.1em;text-transform:uppercase;color:#8A93A6`;

// Value-first copy (founder direction 9 Sep evening): say what the tool does, never what it cannot promise.
function ogHtml() {
  const chip = (icon, label, date) =>
    `<div style="display:flex;align-items:center;gap:12px;border:1px solid ${CARD_BORDER};background:#1B2133;border-radius:10px;padding:12px 14px">` +
    `<span style="color:${MUTED};display:flex">${icon}</span>` +
    `<div style="display:flex;flex-direction:column;gap:3px;line-height:1.2"><span style="font-size:15px;font-weight:600;color:#E6E9F0">${label}</span><span style="font-size:14px;color:${MUTED};font-variant-numeric:tabular-nums">${date}</span></div></div>`;
  const cal = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  const info = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
  const shield = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${MINT}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
  const check = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${MINT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  const bullet = (t) => `<div style="display:flex;align-items:flex-start;gap:10px;font-size:18px;line-height:1.35;color:#D8DDE8"><span style="display:flex;margin-top:3px">${check}</span><span>${t}</span></div>`;
  return (
    `<!doctype html><html><head><meta charset="utf-8">${INTER_LINK}<style>html,body{margin:0}body{width:1200px;height:630px;background:${NAVY};position:relative;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#E6E9F0;-webkit-font-smoothing:antialiased}</style></head><body>` +
    `<div style="position:absolute;inset:0;background:radial-gradient(760px 460px at 12% -4%, rgba(108,208,175,0.20), transparent 70%)"></div>` +
    `<div style="position:absolute;inset:0;background:radial-gradient(520px 380px at 96% 110%, rgba(28,125,94,0.25), transparent 70%)"></div>` +
    `<div style="position:absolute;left:80px;top:84px;display:flex;align-items:center;gap:20px">${markSvg(72, 8)}<div style="font-size:60px;font-weight:600;letter-spacing:-0.03em;line-height:1;color:${PAPER}">Appeal<span style="color:${MINT}">Deck</span></div></div>` +
    `<div style="position:absolute;left:80px;top:206px;width:520px;font-size:34px;font-weight:600;letter-spacing:-0.02em;line-height:1.18;color:${PAPER}">Understand your Amazon notice today. Draft a Plan of Action Amazon can act on.</div>` +
    `<div style="position:absolute;left:80px;top:392px;width:520px;display:flex;flex-direction:column;gap:12px">${bullet("Free decoder that runs in your browser")}${bullet("Deadlines and a do-now list for your case type")}${bullet(`<span style="white-space:nowrap">$199 one-time</span> Appeal Pass: drafted POA, evidence checklist, critic review`)}</div>` +
    `<div style="position:absolute;right:80px;top:112px;width:440px;background:${CARD};border:1px solid ${CARD_BORDER};border-radius:20px;padding:26px 28px;box-shadow:0 40px 80px -40px rgba(0,0,0,.7)">` +
    `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:600">Decoded notice<span style="display:inline-flex;align-items:center;gap:6px;color:${MINT};text-transform:none;letter-spacing:0;font-weight:500;font-size:13px">${shield}In your browser</span></div>` +
    `<div style="margin-top:22px;display:flex;gap:8px;align-items:center"><span style="border:1px solid ${CARD_BORDER};background:#1B2133;color:#C9D0DD;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:600">Low</span><span style="border:1px solid rgba(108,208,175,.35);background:rgba(108,208,175,.12);color:${MINT};border-radius:999px;padding:4px 10px;font-size:13px;font-weight:600">Policy violation</span></div>` +
    `<div style="margin-top:18px;font-size:16px;line-height:1.5;color:#D8DDE8">Your account was deactivated for one or more policy violations (for example listing practices or product-condition claims).</div>` +
    `<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">${chip(cal, "Appeal window", "23 Sep 2026 · in 18 days")}${chip(info, "Funds appeal becomes available", "5 Nov 2026 · in 61 days")}</div>` +
    `</div></body></html>`
  );
}

function sheetHtml(font) {
  const sizes = [16, 24, 32, 48, 64, 96];
  const row = () => sizes.map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">${markSvg(s, 8)}<span style="font:500 11px/1 Inter,system-ui;color:#8A93A6">${s}</span></div>`).join("");
  const panel = (bg, fg, dark) => {
    const logo = horizontalLogo(font, dark ? "dark" : "light").svg;
    const word = wordmarkOnly(font, dark ? "dark" : "light");
    return (
      `<section style="flex:1;background:${bg};color:${fg};padding:48px 56px;display:flex;flex-direction:column;gap:40px">` +
      `<div><div style="${LABEL};margin-bottom:18px">Mark · sizes</div><div style="display:flex;align-items:flex-end;gap:28px">${row()}</div></div>` +
      `<div><div style="${LABEL};margin-bottom:18px">Horizontal logo</div>${logo.replace(/width="\d+" height="64"/, `width="312" height="58"`)}</div>` +
      `<div><div style="${LABEL};margin-bottom:18px">Wordmark · mono mark</div><div style="display:flex;align-items:center;gap:36px">${word.replace(/width="\d+" height="\d+"/, `width="260" height="38"`)}<span style="color:${fg};display:flex">${monoSvg(40)}</span></div></div>` +
      `<div style="display:flex;gap:40px;align-items:flex-start">` +
      `<div><div style="${LABEL};margin-bottom:18px">Browser tab</div><div style="display:inline-flex;align-items:center;gap:8px;background:${dark ? "#1B2133" : "#EDEFF3"};border-radius:10px 10px 0 0;padding:9px 14px;font:500 13px/1 Inter,system-ui;color:${fg}">${markSvg(16, 8)}AppealDeck — Amazon suspension notice decoder</div></div>` +
      `<div><div style="${LABEL};margin-bottom:18px">iOS home screen</div><div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:80px"><div style="width:60px;height:60px;border-radius:14px;overflow:hidden">${markSvg(60, 0)}</div><span style="font:500 11px/1 Inter,system-ui;color:${fg}">AppealDeck</span></div></div>` +
      `<div><div style="${LABEL};margin-bottom:18px">Maskable (Android)</div><div style="width:60px;height:60px;border-radius:50%;overflow:hidden">${maskableSvg(60)}</div></div>` +
      `</div></section>`
    );
  };
  return (
    `<!doctype html><html><head><meta charset="utf-8">${INTER_LINK}<style>html,body{margin:0}body{width:1440px;display:flex;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>` +
    panel("#FFFFFF", INK, false) +
    panel(NAVY, PAPER, true) +
    `</body></html>`
  );
}

// Comparison sheet of the three mark options, each with sizes on light + dark and the horizontal logo.
function optionsHtml(font) {
  const meta = {
    A: ["Option A — a heavy A built from three cards", "Two leaning cards form the letter, a short card is the crossbar. Bold, geometric, ownable; reads at 16 px; the card shapes carry “deck”. Recommended."],
    B: ["Option B — fanned deck", "Three cards fanned from one point, the front one checked. Friendly and product-like; the check reads as “cleared”. Slightly busier at 16 px."],
    C: ["Option C — monogram A (stroke)", "A single-stroke geometric A. Very clean, lighter than A; a plain letter tile carries less story."],
    D: ["Option D — stacked deck", "Three cards of growing width stacked into an A-shaped silhouette: the deck, the hierarchy of a Plan of Action, the letter. Quiet and structural."],
  };
  const block = (opt) => {
    const g = glyphOf(opt);
    const sizes = [16, 24, 32, 64];
    const strip = (bg, fg) =>
      `<div style="display:flex;align-items:flex-end;gap:22px;background:${bg};border-radius:12px;padding:18px 22px">${sizes
        .map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${tile(s, 8, g)}<span style="font:500 10px/1 Inter,system-ui;color:${fg}">${s}</span></div>`)
        .join("")}</div>`;
    const logo = horizontalLogo(font, "light", g).svg.replace(/width="\d+" height="64"/, `width="258" height="48"`);
    return (
      `<section style="display:grid;grid-template-columns:320px 1fr;gap:28px;align-items:center;padding:28px 0;border-top:1px solid #E5E8EE">` +
      `<div><div style="font:600 18px/1.3 Inter,system-ui;color:${INK}">${meta[opt][0]}</div><div style="margin-top:8px;font:400 13px/1.5 Inter,system-ui;color:#5F6573">${meta[opt][1]}</div></div>` +
      `<div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">${strip("#F4F6F9", "#5F6573")}${strip(NAVY, "#9AA3B5")}<div style="padding:10px 0">${logo}</div></div>` +
      `</section>`
    );
  };
  return (
    `<!doctype html><html><head><meta charset="utf-8">${INTER_LINK}<style>html,body{margin:0}body{width:1440px;background:#FFFFFF;padding:44px 56px 40px;box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>` +
    `<div style="${LABEL}">AppealDeck · mark options · 9 Sep 2026</div>` +
    `<div style="margin:10px 0 24px;font:600 26px/1.2 Inter,system-ui;letter-spacing:-0.02em;color:${INK}">Four candidates on the one brand green. Same tile, same wordmark.</div>` +
    block("A") +
    block("B") +
    block("C") +
    block("D") +
    `</body></html>`
  );
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PREVIEW_OUT, { recursive: true });
  const font = opentype.loadSync(findFont());
  console.log("mark option:", MARK);

  // vector files
  const light = horizontalLogo(font, "light");
  const dark = horizontalLogo(font, "dark");
  const w = (name, text) => fs.writeFileSync(path.join(OUT, name), text + "\n", "utf8");
  w("logo-horizontal-light.svg", light.svg);
  w("logo-horizontal-dark.svg", dark.svg);
  w("wordmark-light.svg", wordmarkOnly(font, "light"));
  w("wordmark-dark.svg", wordmarkOnly(font, "dark"));
  w("favicon.svg", withTitle(markSvg(32, 8)));
  w("mark.svg", withTitle(markSvg(32, 8)));
  w("mark-square.svg", withTitle(markSvg(32, 0)));
  w("mark-maskable.svg", withTitle(maskableSvg(32)));
  w("mark-mono.svg", withTitle(monoSvg(32)));

  const browser = await chromium.launch();
  const write = (name, buf) => {
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log("wrote", name, buf.length, "bytes");
  };

  const fav = {};
  for (const s of [16, 32, 48]) {
    fav[s] = await shot(browser, page_(markSvg(s, 8), "transparent"), s, s, 1, { transparent: true });
    write(`favicon-${s}.png`, fav[s]);
  }
  write("favicon.ico", buildIco([16, 32, 48].map((s) => ({ size: s, buf: fav[s] }))));
  write("apple-icon-180.png", await shot(browser, page_(markSvg(180, 0), GREEN), 180, 180, 1));
  write("icon-192.png", await shot(browser, page_(markSvg(192, 0), GREEN), 192, 192, 1));
  write("icon-512.png", await shot(browser, page_(markSvg(512, 0), GREEN), 512, 512, 1));
  write("icon-512-maskable.png", await shot(browser, page_(maskableSvg(512), GREEN), 512, 512, 1));
  write("logo-horizontal-light@2x.png", await shot(browser, page_(light.svg, "transparent"), light.width, 64, 2, { transparent: true }));
  write("logo-horizontal-dark@2x.png", await shot(browser, page_(dark.svg, "transparent"), dark.width, 64, 2, { transparent: true }));
  write("og-1200x630.png", await shot(browser, ogHtml(), 1200, 630, 1, { fonts: true }));

  const sheet = await shot(browser, sheetHtml(font), 1440, 760, 2, { fonts: true });
  fs.writeFileSync(path.join(PREVIEW_OUT, "2026-09-09-brand-sheet.png"), sheet);
  const options = await shot(browser, optionsHtml(font), 1440, 600, 2, { fonts: true, fullPage: true });
  fs.writeFileSync(path.join(PREVIEW_OUT, "2026-09-09-mark-options.png"), options);
  console.log("wrote preview sheets", sheet.length, options.length);

  await browser.close();
  console.log("logo width:", light.width);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

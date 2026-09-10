// Mark exploration sheet v2 — renders candidate marks at 16/24/32/64 on light + dark, with the lockup.
// Standalone; writes only docs/handoffs/assets/2026-09-09-mark-options-v2.png. Does not touch the kit.
"use strict";
const fs = require("fs");
const path = require("path");
const REPO = "V:/AppealDeck1";
const HERE = __dirname;
const opentype = require(path.join(HERE, "node_modules/opentype.js"));
const { chromium } = require(path.join(REPO, "node_modules/playwright"));

const GREEN = "#1C7D5E", MINT = "#6CD0AF", NAVY = "#0D1017", INK = "#13182A";
const W = "#FFFFFF";
const S = (d, w = 2.4, extra = "") => `<path d="${d}" fill="none" stroke="${GREEN}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

// Each candidate: glyph markup on the 32 grid; `tile:false` draws no square behind it.
const C = {
  v1: {
    name: "Current (v1) — for reference",
    note: "Two stacked sheets, translucent back sheet, check on the front. Reads well; back sheet a little muddy at 24–32 px.",
    g: `<rect x="12" y="6" width="13" height="16" rx="2.5" fill="${W}" fill-opacity="0.45"/><rect x="7" y="10" width="13" height="16" rx="2.5" fill="${W}"/>${S("M10.4 18.3l2.3 2.3 4.7-4.9", 2)}`,
  },
  E1: {
    name: "E1 — Deck, checked (refined)",
    note: "Same idea, professionally tuned: bigger front sheet, back sheet as a crisp hairline instead of a translucent fill, heavier check, optically centred.",
    g: `<rect x="12.5" y="6.5" width="13" height="16" rx="3" fill="none" stroke="${W}" stroke-opacity="0.75" stroke-width="1.7"/><rect x="6.5" y="10" width="14" height="17" rx="3" fill="${W}"/>${S("M9.9 19.1l2.9 2.9 5.5-6")}`,
  },
  E2: {
    name: "E2 — Deck, checked (three sheets)",
    note: "Three sheets fanned back in perspective; depth without translucency (each sheet solid, stepped tints). Says “a whole case file”, not one document.",
    g: `<rect x="14" y="5.5" width="12" height="15" rx="2.6" fill="${W}" fill-opacity="0.38"/><rect x="10.5" y="8" width="12.5" height="15.5" rx="2.6" fill="${W}" fill-opacity="0.66"/><rect x="6.5" y="10.5" width="13.5" height="16.5" rx="2.8" fill="${W}"/>${S("M9.9 19.4l2.8 2.8 5.3-5.8")}`,
  },
  E3: {
    name: "E3 — Folded notice, checked",
    note: "One document with a folded corner (the notice) and a bold check. The most conventional; instantly legible at 16 px; least ownable.",
    g: `<path d="M9.5 6.5h9l6 6v13a2.5 2.5 0 0 1-2.5 2.5h-12.5A2.5 2.5 0 0 1 7 25.5V9a2.5 2.5 0 0 1 2.5-2.5z" fill="${W}"/><path d="M18.5 6.5v6h6" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linejoin="round"/>${S("M11.2 19.2l2.8 2.8 5.6-6")}`,
  },
  F1: {
    name: "F1 — A-tick",
    note: "The letter A whose left leg is a check stroke: monogram and “cleared” in one continuous line. Geometric, ownable, no document cliché.",
    g: `<path d="M7.5 18.5l5 6L19 7.5l6.5 17" fill="none" stroke="${W}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  F2: {
    name: "F2 — A-tick with crossbar",
    note: "F1 plus the crossbar, so the A is unmistakable at every size.",
    g: `<path d="M7.5 18.5l5 6L19 7.5l6.5 17M15.9 17.6h7" fill="none" stroke="${W}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  G: {
    name: "G — Card with an A cut out",
    note: "A single white card carrying the letter A in negative space. Letter + document merged; very clear at 32 px+, the counters close up a little at 16 px.",
    g: `<rect x="8" y="6" width="16" height="20" rx="3.4" fill="${W}"/>${S("M11.6 21.6L16 10.4l4.4 11.2M13.5 17.4h5", 2.5)}`,
  },
  H: {
    name: "H — Rising deck",
    note: "Three equal cards stepping up diagonally: the deck, the plan’s steps, and “appeal = rising”. Dynamic yet still geometric.",
    g: `<rect x="16.5" y="6" width="9" height="11" rx="2" fill="${W}" fill-opacity="0.4"/><rect x="11.8" y="10.5" width="9" height="11" rx="2" fill="${W}" fill-opacity="0.7"/><rect x="7" y="15" width="9" height="11" rx="2" fill="${W}"/>`,
  },
  I: {
    name: "I — Card-shield",
    note: "A card whose base becomes a shield point, with the check: the vault and the protected case. The trust cliché of the category, made card-like.",
    g: `<path d="M9 6.5h14a2.5 2.5 0 0 1 2.5 2.5v8.4c0 4.6-3.7 7.6-9.5 9.9C10.2 25 6.5 22 6.5 17.4V9A2.5 2.5 0 0 1 9 6.5z" fill="${W}"/>${S("M11.6 16.6l2.9 2.9 5.7-6.1")}`,
  },
  J: {
    name: "J — The card is the mark (no tile)",
    note: "A portrait green card with two text lines and a check: the decoded notice itself. Distinctive silhouette in a tab bar full of squares and circles.",
    tile: false,
    g: `<rect x="6" y="2" width="20" height="28" rx="5" fill="${GREEN}"/><path d="M11 10.5h10M11 15h7" fill="none" stroke="${W}" stroke-opacity="0.85" stroke-width="2.2" stroke-linecap="round"/><path d="M11.2 22.2l2.9 2.9 6.4-6.8" fill="none" stroke="${W}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  K: {
    name: "K — Decoded lines",
    note: "A card where the middle line resolves into a check: the notice decoded into a clear answer. Quiet, systematic, reads at 16 px.",
    g: `<rect x="7" y="6.5" width="18" height="19" rx="3" fill="${W}"/><path d="M10.5 11.5h11M10.5 21h6" fill="none" stroke="${GREEN}" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>${S("M10.7 16.3l2.4 2.4 4.9-5.2", 2.3)}`,
  },
};

const tile = (size, c) =>
  c.tile === false
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${c.g}</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${GREEN}"/>${c.g}</svg>`;

function findFont() {
  for (const f of ["Inter-600.ttf", "Inter-SemiBold.otf"]) if (fs.existsSync(path.join(HERE, f))) return path.join(HERE, f);
  throw new Error("font missing");
}
function lockup(font, c) {
  const size = 46, textX = 64 + 18, baseline = 32 + Math.round((0.727 * size) / 2);
  const opts = { kerning: true, letterSpacing: -0.02 };
  const wA = font.getAdvanceWidth("Appeal", size, opts);
  const pA = font.getPath("Appeal", textX, baseline, size, opts).toPathData(2);
  const pD = font.getPath("Deck", textX + wA, baseline, size, opts).toPathData(2);
  const total = 344;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="258" height="48" viewBox="0 0 ${total} 64"><g transform="scale(2)">${c.tile === false ? c.g : `<rect width="32" height="32" rx="8" fill="${GREEN}"/>${c.g}`}</g><path d="${pA}" fill="${INK}"/><path d="${pD}" fill="${GREEN}"/></svg>`;
}

function html(font) {
  const LABEL = `font:600 11px/1 Inter,system-ui;letter-spacing:.1em;text-transform:uppercase;color:#8A93A6`;
  const sizes = [16, 24, 32, 64];
  const strip = (c, bg, fg) =>
    `<div style="display:flex;align-items:flex-end;gap:20px;background:${bg};border-radius:12px;padding:16px 20px">${sizes
      .map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${tile(s, c)}<span style="font:500 10px/1 Inter,system-ui;color:${fg}">${s}</span></div>`)
      .join("")}</div>`;
  const row = (key) => {
    const c = C[key];
    return (
      `<section style="display:grid;grid-template-columns:330px 1fr;gap:26px;align-items:center;padding:22px 0;border-top:1px solid #E5E8EE">` +
      `<div><div style="font:600 17px/1.3 Inter,system-ui;color:${INK}">${c.name}</div><div style="margin-top:6px;font:400 12.5px/1.5 Inter,system-ui;color:#5F6573">${c.note}</div></div>` +
      `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">${strip(c, "#F4F6F9", "#5F6573")}${strip(c, NAVY, "#9AA3B5")}<div style="padding:6px 0">${lockup(font, c)}</div></div>` +
      `</section>`
    );
  };
  return (
    `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap"><style>html,body{margin:0}body{width:1440px;background:#fff;padding:40px 56px 36px;box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>` +
    `<div style="${LABEL}">AppealDeck · mark exploration v2 · 9 Sep 2026</div>` +
    `<div style="margin:10px 0 6px;font:600 25px/1.2 Inter,system-ui;letter-spacing:-0.02em;color:${INK}">Eleven candidates. Same tile, same green, same wordmark — judge the glyph.</div>` +
    `<div style="margin:0 0 18px;font:400 13px/1.5 Inter,system-ui;color:#5F6573;max-width:960px">Tests applied to each: legible at 16 px · one idea · one colour · works as a silhouette · says something true about the product (case file, decoding, clearance, structure). Category clichés to avoid or subvert: gavel, scales, magnifier, generic shield, speech bubble, arrow.</div>` +
    Object.keys(C).map(row).join("") +
    `</body></html>`
  );
}

(async () => {
  const font = opentype.loadSync(findFont());
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 }, deviceScaleFactor: 1.6 });
  await page.setContent(html(font), { waitUntil: "domcontentloaded", timeout: 20000 });
  try { await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 8000))]); await page.waitForTimeout(400); } catch {}
  const buf = await page.screenshot({ type: "png", fullPage: true });
  fs.writeFileSync(path.join(REPO, "docs/handoffs/assets/2026-09-09-mark-options-v2.png"), buf);
  console.log("wrote mark-options-v2", buf.length);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

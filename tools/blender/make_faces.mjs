// Draws Dex's face with the same code the website uses and saves it as PNGs for Blender.
//   node tools/blender/make_faces.mjs <out_dir>
// Needs the dev server on http://localhost:3000.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] ?? "tools/blender/out/faces";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.goto("http://localhost:3000/dev/dex-3d?still");
await page.waitForFunction(() => Boolean(window.__dex), null, { timeout: 60000 });

for (const mood of ["hello", "cheer", "think", "calm", "explain", "steady"]) {
  const png = await page.evaluate(async (m) => {
    window.__dex.setMood(m);
    await new Promise((r) => setTimeout(r, 400));
    return window.__dex.faceImage();
  }, mood);
  writeFileSync(join(out, `face_${mood}.png`), Buffer.from(png.split(",")[1], "base64"));
  console.log("wrote", mood);
}
await browser.close();

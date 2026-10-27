#!/usr/bin/env node
/*
 * build-credit-logos.mjs — vendors the brand glyphs the home-page credits row shows.
 *
 * Source: the `simple-icons` package (dev dependency, CC0 1.0 for the SVG files; every mark is still
 * the trademark of its owner and is used here to identify the tool, nothing more). The generator
 * writes white, single-path SVGs into `public/credits/` so the row needs no runtime dependency and no
 * network fetch.
 *
 * Vendors who asked Simple Icons to remove their mark (OpenAI, Microsoft) are not available; those
 * names stand as text in the row, set in a typeface chosen to read like their wordmark. Re-run with
 * `node scripts/build-credit-logos.mjs` after a `simple-icons` upgrade.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { siClaude, siLinux, siNextdotjs, siPaddle, siPlausibleanalytics, siReact, siResend, siSupabase, siTailwindcss, siTypescript, siUpstash, siVercel } from "simple-icons";

const ICONS = {
  claude: siClaude,
  linux: siLinux,
  nextjs: siNextdotjs,
  paddle: siPaddle,
  plausible: siPlausibleanalytics,
  react: siReact,
  resend: siResend,
  supabase: siSupabase,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
  upstash: siUpstash,
  vercel: siVercel,
};

const OUT = path.join(process.cwd(), "public", "credits");
mkdirSync(OUT, { recursive: true });

const VERSION = JSON.parse(
  readFileSync(path.join(process.cwd(), "node_modules", "simple-icons", "package.json"), "utf8"),
).version;

for (const [slug, icon] of Object.entries(ICONS)) {
  const svg = `<!-- ${icon.title} mark, generated from simple-icons ${VERSION} (CC0 1.0). The mark is a trademark of its owner; it identifies the tool, nothing more. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="#ffffff" d="${icon.path}"/></svg>
`;
  writeFileSync(path.join(OUT, `${slug}.svg`), svg);
  console.log(`public/credits/${slug}.svg  ${icon.title}`);
}

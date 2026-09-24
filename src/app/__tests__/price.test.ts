import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRICING } from "@/content/marketing";

/**
 * 24 Sep 2026: the price moved from $199 to $249 on 21 Sep and reached `src/content/` only. The web
 * manifest — linked from the root layout, so read by every browser and crawler — still said $199,
 * and the Paddle sandbox script still created a $199 price, so a checkout test would have tested a
 * price the site does not show. These are the places outside `src/content/` that carry the price to
 * someone; each is pinned to the one source.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const cents = String(Number(PRICING.price.replace(/[^0-9.]/g, "")) * 100);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(json|webmanifest|mjs|js|md|txt|svg)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("the price outside src/content", () => {
  it("the web manifest states the current price", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest")) as { description: string };
    expect(manifest.description).toContain(PRICING.price);
  });

  it("the Paddle sandbox script creates the current price", () => {
    const script = read("scripts/setup-paddle-sandbox.mjs");
    expect(script).toContain(`amount: "${cents}"`);
    expect(script.match(/amount === "(\d+)"/)?.[1]).toBe(cents);
  });

  it("no shipped asset or script still names the old price", () => {
    const hits = [...walk(path.join(ROOT, "public")), ...walk(path.join(ROOT, "scripts"))].filter(
      (f) =>
        // The sandbox script's header explains the move from the old price, which is history.
        !f.endsWith("setup-paddle-sandbox.mjs") && readFileSync(f, "utf8").includes("$199"),
    );
    expect(hits.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});

/**
 * The palette's accessibility gate.
 *
 * Colour contrast used to be checked only by axe inside one Playwright test, which meant it
 * was found late, reported without the failing colours, and only on whichever states that
 * test happened to render. Three token pairs were failing WCAG AA in the shipped palette and
 * the suite surfaced one of them.
 *
 * This reads the real `globals.css` and computes the ratios directly, so a palette change
 * that breaks legibility fails in milliseconds with the exact pair and ratio named. It
 * checks the composition the app actually renders — small text in a semantic colour on a
 * 5-10% tint of the same colour — not just the colour against a plain page.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "../globals.css"), "utf8");

type Hsl = [number, number, number];
type Rgb = [number, number, number];

/** Reads one theme's `--token: H S% L%;` declarations. */
function themeTokens(marker: string): Record<string, Hsl> {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`theme block not found: ${marker}`);
  const body = css.slice(start, css.indexOf("color-scheme", start));
  const out: Record<string, Hsl> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%;/g)) {
    out[m[1]!] = [Number(m[2]), Number(m[3]) / 100, Number(m[4]) / 100];
  }
  return out;
}

function hslToRgb([h, s, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

/** WCAG 2.x relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** What the browser composites for `bg-<colour>/<alpha>` sitting on a surface. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((v, i) => v * alpha + bg[i]! * (1 - alpha)) as Rgb;
}

const AA_NORMAL_TEXT = 4.5;

/** The semantic colours, and the tint alphas Badge / Alert / IconTile actually use. */
const SEMANTICS = ["primary", "warning", "success", "info", "destructive"] as const;
const TINT_ALPHAS = [0.05, 0.07, 0.08, 0.1];
const SURFACES = ["background", "surface-1", "surface-2", "muted"] as const;

const THEMES = [
  ["light", "--- Colour: light"],
  ["dark", "--- Colour: dark"],
] as const;

describe.each(THEMES)("%s palette", (themeName, marker) => {
  const t = themeTokens(marker);

  it("defines a reading-grade ink for every semantic colour", () => {
    for (const s of SEMANTICS) {
      expect(t[`${s}-ink`], `--${s}-ink missing from the ${themeName} theme`).toBeDefined();
    }
  });

  /**
   * The case that was actually broken: a Badge or IconTile renders `text-<s>` on
   * `bg-<s>/<alpha>`, and that tint sits on whichever surface the card uses.
   */
  it("keeps semantic text legible on its own tint over every surface", () => {
    const failures: string[] = [];
    for (const s of SEMANTICS) {
      const ink = hslToRgb(t[`${s}-ink`]!);
      const fill = hslToRgb(t[s]!);
      for (const surfaceName of SURFACES) {
        for (const alpha of TINT_ALPHAS) {
          const bg = over(fill, hslToRgb(t[surfaceName]!), alpha);
          const ratio = contrast(ink, bg);
          if (ratio < AA_NORMAL_TEXT) {
            failures.push(
              `text-${s} on bg-${s}/${Math.round(alpha * 100)} over ${surfaceName}: ${ratio.toFixed(2)}:1`,
            );
          }
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("keeps body and secondary text legible on every surface", () => {
    const failures: string[] = [];
    for (const fg of ["foreground", "muted-foreground"]) {
      for (const surfaceName of SURFACES) {
        const ratio = contrast(hslToRgb(t[fg]!), hslToRgb(t[surfaceName]!));
        if (ratio < AA_NORMAL_TEXT) {
          failures.push(`text-${fg} on bg-${surfaceName}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("keeps the label on a solid semantic fill legible", () => {
    const failures: string[] = [];
    for (const s of SEMANTICS) {
      const ratio = contrast(hslToRgb(t[`${s}-foreground`]!), hslToRgb(t[s]!));
      if (ratio < AA_NORMAL_TEXT) {
        failures.push(`text-${s}-foreground on bg-${s}: ${ratio.toFixed(2)}:1`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  /**
   * Guards the split itself. An ink that drifted away from its fill's hue would be a
   * different colour wearing the same name, which is not what this change did: only
   * lightness was allowed to move.
   */
  it("derives each ink from its fill's own hue and saturation", () => {
    for (const s of SEMANTICS) {
      const [fillH, fillS] = t[s]!;
      const [inkH, inkS] = t[`${s}-ink`]!;
      expect(Math.abs(inkH - fillH), `--${s}-ink hue drifted from --${s}`).toBeLessThanOrEqual(4);
      expect(
        Math.abs(inkS - fillS),
        `--${s}-ink saturation drifted from --${s}`,
      ).toBeLessThanOrEqual(0.05);
    }
  });
});

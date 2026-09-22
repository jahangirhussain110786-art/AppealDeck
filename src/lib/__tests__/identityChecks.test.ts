import { describe, it, expect } from "vitest";
import { analyzeIdentityPixels } from "@/lib/documentChecks/identity";

/** Builds RGBA pixels from a per-pixel value function. */
function makePixels(
  width: number,
  height: number,
  value: (x: number, y: number) => number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = value(x, y);
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  }
  return out;
}

/** High-frequency checkerboard — the sharpest possible image. */
const sharp = (x: number, y: number) => ((x + y) % 2 === 0 ? 20 : 235);
/** A smooth ramp — no high-frequency detail, i.e. out of focus. */
const blurry = (x: number, _y: number) => 110 + Math.round(Math.sin(x / 40) * 8);

function check(report: ReturnType<typeof analyzeIdentityPixels>, id: string) {
  return report.checks.find((c) => c.id === id)!;
}

describe("identity image checks", () => {
  it("passes a large, sharp, evenly lit image", () => {
    const report = analyzeIdentityPixels(makePixels(1200, 900, sharp), 1200, 900);
    expect(check(report, "resolution").status).toBe("ok");
    expect(check(report, "sharpness").status).toBe("ok");
    expect(report.looksReadable).toBe(true);
  });

  it("warns when the image is too small for small print", () => {
    const report = analyzeIdentityPixels(makePixels(400, 300, sharp), 400, 300);
    expect(check(report, "resolution").status).toBe("warn");
    expect(check(report, "resolution").detail).toMatch(/400 by 300/);
    expect(report.looksReadable).toBe(false);
  });

  it("warns when the image is out of focus", () => {
    const report = analyzeIdentityPixels(makePixels(1200, 900, blurry), 1200, 900);
    expect(check(report, "sharpness").status).toBe("warn");
    expect(check(report, "sharpness").detail).toMatch(/soft or out of focus/i);
  });

  it("warns when the image is washed out by glare", () => {
    const report = analyzeIdentityPixels(
      makePixels(1200, 900, () => 255),
      1200,
      900,
    );
    expect(check(report, "exposure").status).toBe("warn");
    expect(check(report, "exposure").detail).toMatch(/washed out/i);
  });

  it("warns when the image is far too dark", () => {
    const report = analyzeIdentityPixels(
      makePixels(1200, 900, () => 0),
      1200,
      900,
    );
    expect(check(report, "exposure").status).toBe("warn");
    expect(check(report, "exposure").detail).toMatch(/very dark/i);
  });

  it("warns when flat borders suggest the document runs off the frame", () => {
    // Uniform edges, textured centre — the signature of a document cropped at the edges.
    const report = analyzeIdentityPixels(
      makePixels(1200, 900, (x, y) => (x < 6 || y < 6 || x > 1193 || y > 893 ? 128 : sharp(x, y))),
      1200,
      900,
    );
    expect(check(report, "framing").status).toBe("warn");
  });

  it("reports unknown rather than guessing on an image too small to judge", () => {
    const report = analyzeIdentityPixels(makePixels(2, 2, sharp), 2, 2);
    expect(check(report, "sharpness").status).toBe("unknown");
    expect(check(report, "framing").status).toBe("unknown");
  });

  /** The whole point of doing this locally: these checks describe the picture, never the document.
   * Nothing here may read a name, a date, or conclude anything about validity. */
  it("never claims anything about what the document says or whether it is acceptable", () => {
    const report = analyzeIdentityPixels(makePixels(1200, 900, sharp), 1200, 900);
    const allText = report.checks.map((c) => `${c.label} ${c.detail}`).join(" ");
    for (const banned of [
      /authentic/i,
      /genuine/i,
      /valid/i,
      /verified/i,
      /expired/i,
      /accepted/i,
      /name/i,
    ]) {
      expect(allText).not.toMatch(banned);
    }
  });

  it("only reports readable when nothing is flagged", () => {
    const bad = analyzeIdentityPixels(makePixels(400, 300, blurry), 400, 300);
    expect(bad.looksReadable).toBe(false);
  });
});

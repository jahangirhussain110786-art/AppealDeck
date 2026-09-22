/**
 * AA-41 (AM-26): identity-document checks that run on the seller's own device.
 *
 * `/api/read-document` refuses these types. The reason is liability rather than ethics — the
 * founder is personally liable as an individual in Pakistan, and a breach of a thousand invoices
 * and a breach of a thousand passports are not the same event. The practical observation that
 * makes the trade cheap: almost every identity-document rejection is caused by something no
 * language model is needed to spot. A blurry photo, a cut-off corner, glare across the name, a
 * file so small it cannot be legible. Those are measurable in the browser from pixels alone.
 *
 * What this deliberately does NOT do: read the document, extract a name, or check a date. It never
 * decodes text, so it cannot be wrong about what the document says — it only reports whether the
 * image is good enough to be read by a human at Amazon.
 */

export type ImageCheckStatus = "ok" | "warn" | "unknown";

export interface ImageCheck {
  id: "resolution" | "sharpness" | "framing" | "exposure";
  status: ImageCheckStatus;
  label: string;
  detail: string;
}

export interface IdentityImageReport {
  checks: ImageCheck[];
  /** True when nothing is flagged. Never means the document will be accepted. */
  looksReadable: boolean;
}

/** Below this, a scan of an A4 page or a card is too coarse for small print to survive. */
const MIN_LONG_EDGE = 1000;
/** Laplacian-style variance below this reads as a soft or out-of-focus photo. */
const MIN_SHARPNESS = 90;
/** Fraction of pixels at the extremes before an image is called blown out or too dark. */
const CLIPPED_FRACTION = 0.18;
/** A near-uniform border strip suggests the document runs past the edge of the frame. */
const EDGE_UNIFORMITY = 0.97;

/**
 * Runs every check against already-decoded pixels. Pure and synchronous so it is unit-testable
 * without a DOM; `analyzeIdentityImage` below is the browser-facing wrapper that decodes a file.
 */
export function analyzeIdentityPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): IdentityImageReport {
  const checks: ImageCheck[] = [
    resolutionCheck(width, height),
    sharpnessCheck(pixels, width, height),
    exposureCheck(pixels),
    framingCheck(pixels, width, height),
  ];
  return { checks, looksReadable: checks.every((c) => c.status !== "warn") };
}

function resolutionCheck(width: number, height: number): ImageCheck {
  const longEdge = Math.max(width, height);
  const ok = longEdge >= MIN_LONG_EDGE;
  return {
    id: "resolution",
    status: ok ? "ok" : "warn",
    label: "Size",
    detail: ok
      ? `${width} by ${height} pixels — large enough for small print to stay legible.`
      : `${width} by ${height} pixels. Small print is likely to be unreadable. Retake it closer, or scan at a higher setting.`,
  };
}

/** Mean absolute Laplacian over a grayscale conversion — the standard cheap focus measure. */
function sharpnessCheck(pixels: Uint8ClampedArray, width: number, height: number): ImageCheck {
  if (width < 3 || height < 3) {
    return {
      id: "sharpness",
      status: "unknown",
      label: "Focus",
      detail: "The image is too small to judge focus.",
    };
  }
  const gray = toGray(pixels, width, height);
  let total = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = 4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - width]! - gray[i + width]!;
      total += lap * lap;
      count++;
    }
  }
  const variance = count > 0 ? total / count : 0;
  const ok = variance >= MIN_SHARPNESS;
  return {
    id: "sharpness",
    status: ok ? "ok" : "warn",
    label: "Focus",
    detail: ok
      ? "The image looks sharp enough to read."
      : "The image looks soft or out of focus. Rest the document on a flat surface and retake it.",
  };
}

function exposureCheck(pixels: Uint8ClampedArray): ImageCheck {
  let dark = 0;
  let bright = 0;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const v = (pixels[i]! + pixels[i + 1]! + pixels[i + 2]!) / 3;
    if (v <= 8) dark++;
    else if (v >= 247) bright++;
    total++;
  }
  if (total === 0) {
    return { id: "exposure", status: "unknown", label: "Lighting", detail: "No pixels to check." };
  }
  const blownOut = bright / total > CLIPPED_FRACTION;
  const tooDark = dark / total > CLIPPED_FRACTION;
  return {
    id: "exposure",
    status: blownOut || tooDark ? "warn" : "ok",
    label: "Lighting",
    detail: blownOut
      ? "Large areas are washed out, usually glare from a flash or a window. Retake it in even light without flash."
      : tooDark
        ? "Large areas are very dark. Retake it somewhere brighter."
        : "Lighting looks even enough to read.",
  };
}

/**
 * Looks for a near-uniform border. A document photographed with its edges inside the frame leaves
 * a varied background; one that runs off the edge tends to leave a flat strip of the document
 * itself. This is a hint rather than a measurement, so it warns and explains rather than asserting.
 */
function framingCheck(pixels: Uint8ClampedArray, width: number, height: number): ImageCheck {
  if (width < 20 || height < 20) {
    return {
      id: "framing",
      status: "unknown",
      label: "Framing",
      detail: "The image is too small to judge framing.",
    };
  }
  const gray = toGray(pixels, width, height);
  const strips = [
    sample(gray, width, height, "top"),
    sample(gray, width, height, "bottom"),
    sample(gray, width, height, "left"),
    sample(gray, width, height, "right"),
  ];
  const flat = strips.filter((s) => s >= EDGE_UNIFORMITY).length;
  return {
    id: "framing",
    status: flat >= 2 ? "warn" : "ok",
    label: "Framing",
    detail:
      flat >= 2
        ? "The document may run past the edge of the picture. All four corners need to be inside the frame."
        : "All four edges appear to be inside the frame.",
  };
}

/** Fraction of a border strip within a narrow band of its own mean — 1 means perfectly uniform. */
function sample(
  gray: Float32Array,
  width: number,
  height: number,
  side: "top" | "bottom" | "left" | "right",
): number {
  const values: number[] = [];
  const depth = 3;
  if (side === "top" || side === "bottom") {
    const yStart = side === "top" ? 0 : height - depth;
    for (let y = yStart; y < yStart + depth; y++)
      for (let x = 0; x < width; x++) values.push(gray[y * width + x]!);
  } else {
    const xStart = side === "left" ? 0 : width - depth;
    for (let y = 0; y < height; y++)
      for (let x = xStart; x < xStart + depth; x++) values.push(gray[y * width + x]!);
  }
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const within = values.filter((v) => Math.abs(v - mean) <= 6).length;
  return within / values.length;
}

function toGray(pixels: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; p < width * height; i += 4, p++) {
    gray[p] = 0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!;
  }
  return gray;
}

/**
 * Browser wrapper: decodes the file and runs the checks. The bytes never leave this function.
 *
 * Returns null for anything that is not a decodable image — a PDF identity document is a perfectly
 * reasonable thing for a seller to hold, and claiming to have checked it when we have not would be
 * worse than saying nothing.
 */
export async function analyzeIdentityImage(file: Blob): Promise<IdentityImageReport | null> {
  if (!file.type.startsWith("image/")) return null;
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
    return null;
  }
  try {
    const bitmap = await createImageBitmap(file);
    // Captured before `close()` below — an ImageBitmap's width and height are not guaranteed to
    // survive it, and the resolution check is judged on these originals, not the downscaled copy.
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    // Large scans are downscaled before analysis: the checks measure proportions, and a 40-megapixel
    // photo would otherwise block the main thread for seconds.
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    bitmap.close();
    const report = analyzeIdentityPixels(data, width, height);
    // The resolution verdict must come from the original dimensions, and `looksReadable` has to be
    // recomputed afterwards — deriving it from the downscaled copy would let the summary contradict
    // the very check displayed beside it.
    const checks = report.checks.map((c) =>
      c.id === "resolution" ? resolutionCheck(sourceWidth, sourceHeight) : c,
    );
    return { checks, looksReadable: checks.every((c) => c.status !== "warn") };
  } catch {
    return null;
  }
}

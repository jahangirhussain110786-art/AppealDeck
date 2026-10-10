import type { Shrinker } from "./evidencePackFile";

/**
 * Re-saves a picture as a JPEG small enough to upload (10 Oct 2026), for the evidence pack.
 *
 * Tries the largest size and best quality first and steps down, so a file is made only as small as
 * it must be: the longest side from 3200 pixels down to 1600, and the quality from 0.9 to 0.6. A
 * transparent picture is put on white first, because JPEG has no transparency and a black page
 * behind dark text would make it unreadable. Returns null when the picture cannot be decoded, or
 * when nothing in that range fits, and the pack then keeps the original and flags it.
 *
 * Runs in the browser only; the pack builder takes it as a parameter so the rest is testable.
 */
const SIZES = [3200, 2600, 2000, 1600];
const QUALITIES = [0.9, 0.8, 0.7, 0.6];

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export const shrinkImage: Shrinker = async (bytes, mime, limit) => {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: mime }));
  } catch {
    return null;
  }
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    // Never enlarge: only sizes at or below the picture's own.
    const sizes = [...new Set(SIZES.map((s) => Math.min(s, longest)))];
    for (const size of sizes) {
      const scale = size / longest;
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, quality);
        if (blob && blob.size <= limit) {
          return {
            bytes: new Uint8Array(await blob.arrayBuffer()),
            mime: "image/jpeg",
            note: `Re-saved as a JPEG, ${width} by ${height} pixels, to fit under ${(limit / (1024 * 1024)).toFixed(0)} MB. Check the text is still readable.`,
          };
        }
      }
      canvas.width = 0;
      canvas.height = 0;
    }
    return null;
  } finally {
    bitmap.close();
  }
};

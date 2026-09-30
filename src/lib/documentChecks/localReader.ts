/**
 * The words of a document, read on the seller's own device (29 Sep 2026). Nothing here uploads the
 * file: pdf.js and Tesseract.js run in the browser, and their code and language data are served
 * from this site (`public/reader/`, copied from node_modules by `scripts/copy-reader-assets.mjs`),
 * so a reading needs no other service either.
 *
 * - A PDF with a text layer gives its own words, which are exactly the document's.
 * - A scanned PDF has no text layer; its first pages are drawn and read by OCR.
 * - A photo or a scan saved as an image is read by OCR.
 *
 * Both libraries are loaded only when a reading is asked for, so no page pays for them otherwise.
 */

import { hasReadableText, type TextSource } from "@/core/localReading";
import { pdfDocumentText } from "./pdfText";

const ASSETS = "/reader";
/** Pages read from a PDF's text layer, and pages read by OCR when it has none. */
const MAX_TEXT_PAGES = 10;
const MAX_OCR_PAGES = 3;
/** OCR is slow on huge photos and no more accurate past this. */
const MAX_OCR_EDGE = 2400;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const DEVICE_READABLE = ["application/pdf", ...IMAGE_TYPES];

export interface DeviceText {
  text: string;
  source: TextSource;
}

/** Null when there is nothing legible to read, or the file is not a type this can open. */
export async function readTextOnDevice(
  bytes: Uint8Array,
  mimeType: string,
): Promise<DeviceText | null> {
  if (mimeType === "application/pdf") return readPdf(bytes);
  if (IMAGE_TYPES.includes(mimeType)) {
    const canvas = await imageCanvas(bytes, mimeType);
    const text = canvas ? await ocr([canvas]) : "";
    return hasReadableText(text) ? { text, source: "ocr" } : null;
  }
  return null;
}

async function readPdf(bytes: Uint8Array): Promise<DeviceText | null> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `${ASSETS}/pdf.worker.min.mjs`;
  // A copy: pdf.js takes ownership of the buffer it is given.
  // `wasmUrl` (a directory, with the trailing slash) is where pdf.js finds its image decoders.
  // Without it a JPEG 2000 or JBIG2 scan draws as a blank page and yields no text.
  const task = pdfjs.getDocument({ data: bytes.slice(), verbosity: 0, wasmUrl: `${ASSETS}/wasm/` });
  const doc = await task.promise;
  try {
    const text = await pdfDocumentText(doc, MAX_TEXT_PAGES);
    if (hasReadableText(text)) return { text, source: "pdf_text" };
    // A scan: no text layer. Draw the first pages and read them.
    const canvases: HTMLCanvasElement[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, MAX_OCR_PAGES); n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(2.5, MAX_OCR_EDGE / Math.max(base.width, base.height)),
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      canvases.push(canvas);
    }
    const ocrText = await ocr(canvases);
    return hasReadableText(ocrText) ? { text: ocrText, source: "ocr" } : null;
  } finally {
    await task.destroy();
  }
}

async function imageCanvas(bytes: Uint8Array, mimeType: string): Promise<HTMLCanvasElement | null> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const bitmap = await createImageBitmap(new Blob([copy.buffer], { type: mimeType })).catch(
    () => null,
  );
  if (!bitmap) return null;
  const scale = Math.min(1, MAX_OCR_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

async function ocr(canvases: readonly HTMLCanvasElement[]): Promise<string> {
  if (canvases.length === 0) return "";
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: `${ASSETS}/tesseract/worker.min.js`,
    corePath: `${ASSETS}/tesseract/core`,
    langPath: `${ASSETS}/tesseract/lang`,
    workerBlobURL: false,
    gzip: true,
  });
  try {
    const texts: string[] = [];
    for (const canvas of canvases) texts.push((await worker.recognize(canvas)).data.text);
    return texts.join("\n");
  } finally {
    await worker.terminate();
  }
}

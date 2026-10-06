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
 *
 * pdf.js is the LEGACY build (30 Sep 2026), which is also what the tests run. It still calls
 * `Promise.withResolvers` unguarded, in the page and in its worker, and Safari added that in 17.4
 * and Chrome in 119 while the site supports browsers back to Safari 16.4. So the page polyfills it
 * before loading pdf.js, and the worker is loaded through a wrapper that does the same in its own
 * realm (`pdf.worker.compat.mjs`, written by `scripts/copy-reader-assets.mjs`). Without both, an
 * older browser told the seller only that we "could not make out" their document.
 */

import { hasReadableText, wordCount, type TextSource } from "@/core/localReading";
import { pdfDocumentText } from "./pdfText";
import { ensurePromiseWithResolvers } from "./promiseWithResolvers";

const ASSETS = "/reader";
/** Pages read from a PDF's text layer, and pages read by OCR when it has none. */
const MAX_TEXT_PAGES = 10;
const MAX_OCR_PAGES = 3;
/** OCR is slow on huge photos and no more accurate past this. */
const MAX_OCR_EDGE = 2400;
/**
 * Everything OCR does, from fetching its language data to the last page. A stalled connection or a
 * wedged worker used to leave the button reading "Checking…" for good; after this the seller is
 * told, and can try again.
 */
const OCR_TIMEOUT_MS = 120_000;
/** Each step of reading a PDF (opening it, its text, drawing a page) on its own. */
const PDF_STEP_TIMEOUT_MS = 45_000;
/** Fewer words a page than this in a PDF's text layer is furniture on a picture, not a document. */
const THIN_WORDS_PER_PAGE = 20;
/** OCR replaces a thin text layer only if it finds this many times as many words. */
const OCR_MUST_ADD = 1.5;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export interface DeviceText {
  text: string;
  source: TextSource;
}

/** Why a file could not be read on the device, when there is something specific to tell the seller. */
export type DeviceReadFailure = "protected" | "timeout" | "load";

export class DeviceReadError extends Error {
  readonly reason: DeviceReadFailure;
  constructor(reason: DeviceReadFailure) {
    super(reason);
    this.name = "DeviceReadError";
    this.reason = reason;
  }
}

/** The promise's result, or a `timeout` failure if it takes longer than `ms`. */
function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DeviceReadError("timeout")), ms);
  });
  return Promise.race([promise, expired]).finally(() => clearTimeout(timer));
}

/** Null when there is nothing legible to read, or the file is not a type this can open. */
export async function readTextOnDevice(
  bytes: Uint8Array,
  mimeType: string,
): Promise<DeviceText | null> {
  try {
    return await readTextOnDeviceUnchecked(bytes, mimeType);
  } catch (error) {
    // The reader's own files could not be fetched (offline): that is not "could not make out its
    // text". Only asked after a failure, so a normal reading adds no request.
    if (error instanceof DeviceReadError) throw error;
    if (!(await readerAssetsReachable())) throw new DeviceReadError("load");
    throw error;
  }
}

async function readerAssetsReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${ASSETS}/pdf.worker.compat.mjs`, {
      method: "HEAD",
      cache: "no-cache",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function readTextOnDeviceUnchecked(
  bytes: Uint8Array,
  mimeType: string,
): Promise<DeviceText | null> {
  if (mimeType === "application/pdf") return readPdf(bytes);
  if (IMAGE_TYPES.includes(mimeType)) {
    const canvas = await imageCanvas(bytes, mimeType);
    if (!canvas) return null;
    const text = await ocr([canvas]);
    return hasReadableText(text) ? { text, source: "ocr" } : null;
  }
  return null;
}

async function readPdf(bytes: Uint8Array): Promise<DeviceText | null> {
  // Before pdf.js is evaluated: it calls Promise.withResolvers, which older browsers lack.
  ensurePromiseWithResolvers();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Not pdf.worker.min.mjs itself but a wrapper that adds the same polyfill inside the worker first.
  pdfjs.GlobalWorkerOptions.workerSrc = `${ASSETS}/pdf.worker.compat.mjs`;
  // A copy: pdf.js takes ownership of the buffer it is given. `wasmUrl` (a directory, with the
  // trailing slash) is where pdf.js finds its image decoders; without it a JPEG 2000 or JBIG2
  // scan draws as a blank page and yields no text.
  const task = pdfjs.getDocument({ data: bytes.slice(), verbosity: 0, wasmUrl: `${ASSETS}/wasm/` });
  const canvases: HTMLCanvasElement[] = [];
  try {
    // Every step has a limit. Without the wrapper that adds Promise.withResolvers, pdf.js does not
    // throw on a browser that lacks it: its worker fails inside and the load simply never finishes,
    // which left the button on "Checking…" for good (found by removing the function in a worker).
    const doc = await within(
      task.promise.catch((error: unknown) => {
        // A password-protected PDF cannot be opened here or by the AI reading. Say so, rather than
        // "could not make out its text", which reads as a blank page.
        if ((error as { name?: string } | null)?.name === "PasswordException")
          throw new DeviceReadError("protected");
        throw error;
      }),
      PDF_STEP_TIMEOUT_MS,
    );
    const text = await within(pdfDocumentText(doc, MAX_TEXT_PAGES), PDF_STEP_TIMEOUT_MS);
    // A page with a real text layer has a page of words. A few words per page are page furniture
    // ("Page 1 of 3", "Scanned with CamScanner") on top of a picture, and passed for "readable", so
    // a scan with a footer was never OCR'd and every field came back "not checked".
    const words = wordCount(text);
    const thin = words / Math.max(1, Math.min(doc.numPages, MAX_TEXT_PAGES)) < THIN_WORDS_PER_PAGE;
    if (hasReadableText(text) && !thin) return { text, source: "pdf_text" };
    // A scan: no text layer, or next to none. Draw the first pages and read them.
    for (let n = 1; n <= Math.min(doc.numPages, MAX_OCR_PAGES); n++) {
      const page = await within(doc.getPage(n), PDF_STEP_TIMEOUT_MS);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(2.5, MAX_OCR_EDGE / Math.max(base.width, base.height)),
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvases.push(canvas);
      await within(page.render({ canvas, viewport }).promise, PDF_STEP_TIMEOUT_MS);
    }
    const ocrText = await ocr(canvases);
    // The thin text layer stands unless the picture really holds much more: a short typed letter
    // has few words, and OCR of it would only add doubt.
    const layerIsAnswer = hasReadableText(text) && wordCount(ocrText) <= words * OCR_MUST_ADD;
    if (layerIsAnswer) return { text, source: "pdf_text" };
    if (hasReadableText(ocrText)) return { text: ocrText, source: "ocr" };
    return hasReadableText(text) ? { text, source: "pdf_text" } : null;
  } finally {
    // Also when the file could not be opened: a failed load left its worker running. And the pages
    // already drawn are millions of pixels each, which a failure partway would otherwise keep.
    for (const canvas of canvases) {
      canvas.width = 0;
      canvas.height = 0;
    }
    // Not awaited: destroying waits on the worker to answer, and a worker that has stopped
    // answering is exactly when this runs. Waiting here kept the reading "in progress" for good.
    void task.destroy().catch(() => undefined);
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
  try {
    return await withOcrWorker(canvases);
  } finally {
    // A drawn page is millions of pixels; let the browser have them back.
    for (const canvas of canvases) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

async function withOcrWorker(canvases: readonly HTMLCanvasElement[]): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  type Worker = Awaited<ReturnType<typeof createWorker>>;
  let worker: Worker | undefined;
  let abandoned = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abandoned = true;
      reject(new DeviceReadError("timeout"));
    }, OCR_TIMEOUT_MS);
  });

  const work = (async () => {
    const created = await createWorker("eng", 1, {
      workerPath: `${ASSETS}/tesseract/worker.min.js`,
      corePath: `${ASSETS}/tesseract/core`,
      langPath: `${ASSETS}/tesseract/lang`,
      workerBlobURL: false,
      gzip: true,
    });
    worker = created;
    // The wait ended while it was still loading: do not leave a worker running for nobody.
    if (abandoned) {
      await created.terminate().catch(() => undefined);
      throw new DeviceReadError("timeout");
    }
    const texts: string[] = [];
    for (const canvas of canvases) texts.push((await created.recognize(canvas)).data.text);
    return texts.join("\n");
  })();

  try {
    return await Promise.race([work, timedOut]);
  } finally {
    clearTimeout(timer);
    // Not awaited, for the same reason as the PDF task: cleanup must not hold up the answer.
    void worker?.terminate().catch(() => undefined);
  }
}

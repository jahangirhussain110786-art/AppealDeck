#!/usr/bin/env node
// Copies the on-device document reader's files from node_modules into public/reader/ (29 Sep 2026),
// so the site serves them itself and a reading needs no other service. Runs before `next dev` and
// `next build`, so the copies always match the installed versions. public/reader/ is not committed.
//
//   pdf.worker.min.mjs          pdf.js's worker, which reads a PDF's text
//   wasm/*                      pdf.js's image decoders (JPEG 2000, JBIG2, colour profiles). A scanner's
//                               "compact PDF" is JBIG2 and Acrobat's is JPEG 2000; without these the
//                               page draws blank and the scan cannot be read (30 Sep 2026 review).
//                               Their licences travel with them.
//   tesseract/worker.min.js     Tesseract.js's worker
//   tesseract/core/*.wasm.js    the OCR engine; the browser loads the one variant it supports
//   tesseract/lang/eng.traineddata.gz   English, the "best_int" model Tesseract.js uses by default

import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "reader");
const modules = join(root, "node_modules");

const files = [
  ["pdfjs-dist/build/pdf.worker.min.mjs", "pdf.worker.min.mjs"],
  ["pdfjs-dist/wasm/openjpeg.wasm", "wasm/openjpeg.wasm"],
  ["pdfjs-dist/wasm/openjpeg_nowasm_fallback.js", "wasm/openjpeg_nowasm_fallback.js"],
  ["pdfjs-dist/wasm/jbig2.wasm", "wasm/jbig2.wasm"],
  ["pdfjs-dist/wasm/jbig2_nowasm_fallback.js", "wasm/jbig2_nowasm_fallback.js"],
  ["pdfjs-dist/wasm/qcms_bg.wasm", "wasm/qcms_bg.wasm"],
  ["pdfjs-dist/wasm/LICENSE_OPENJPEG", "wasm/LICENSE_OPENJPEG"],
  ["pdfjs-dist/wasm/LICENSE_PDFJS_OPENJPEG", "wasm/LICENSE_PDFJS_OPENJPEG"],
  ["pdfjs-dist/wasm/LICENSE_JBIG2", "wasm/LICENSE_JBIG2"],
  ["pdfjs-dist/wasm/LICENSE_PDFJS_JBIG2", "wasm/LICENSE_PDFJS_JBIG2"],
  ["pdfjs-dist/wasm/LICENSE_QCMS", "wasm/LICENSE_QCMS"],
  ["pdfjs-dist/wasm/LICENSE_PDFJS_QCMS", "wasm/LICENSE_PDFJS_QCMS"],
  ["tesseract.js/dist/worker.min.js", "tesseract/worker.min.js"],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract/core/tesseract-core-lstm.wasm.js"],
  [
    "tesseract.js-core/tesseract-core-simd-lstm.wasm.js",
    "tesseract/core/tesseract-core-simd-lstm.wasm.js",
  ],
  [
    "tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    "tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js",
  ],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "tesseract/lang/eng.traineddata.gz"],
];

rmSync(out, { recursive: true, force: true });
for (const [from, to] of files) {
  const target = join(out, to);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(modules, from), target);
}
console.log(`copy-reader-assets: ${files.length} files into public/reader/`);

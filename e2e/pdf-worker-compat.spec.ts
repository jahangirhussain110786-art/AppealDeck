import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

/**
 * The worker half of the older-browser fix. `device-reader.spec.ts` removes Promise.withResolvers
 * from the page, but pdf.js's work happens in a worker, a separate realm with its own copy, and
 * that copy is native in the browser this runs in - so that test cannot tell whether the worker
 * would have worked without it.
 *
 * This builds a worker that deletes the function first, then loads the same wrapper the app serves
 * (`/reader/pdf.worker.compat.mjs`), and reads a real PDF through pdf.js with it. With the plain
 * worker in its place, pdf.js fails with "Promise.withResolvers is not a function" (checked when
 * this was written), so this fails if the wrapper stops adding it.
 */
test("pdf.js's worker reads a PDF in a realm that lacks Promise.withResolvers", async ({
  page,
  baseURL,
}) => {
  const pdfjsMain = await readFile("node_modules/pdfjs-dist/legacy/build/pdf.mjs", "utf8");
  const invoice = await readFile(
    "docs/handoffs/2026-09-29-test-documents/03-supplier-invoice-t01-authenticity.pdf",
  );
  // A same-origin page and two files it may import: the real legacy pdf.js, and the PDF.
  await page.route("**/__test/pdf.mjs", (route) =>
    route.fulfill({ body: pdfjsMain, contentType: "text/javascript" }),
  );
  await page.route("**/__test/invoice.pdf", (route) =>
    route.fulfill({ body: invoice, contentType: "application/pdf" }),
  );
  await page.goto("/support");

  const result = await page.evaluate(
    async ({ origin }) => {
      // The worker removes the function, THEN loads the wrapper, in that order: a data: import is
      // evaluated first because static imports run in the order they are written.
      const workerSource = `
        import "data:text/javascript,delete%20Promise.withResolvers%3B";
        import "${origin}/reader/pdf.worker.compat.mjs";
      `;
      const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
      const pdfjs = await import(/* webpackIgnore: true */ `${origin}/__test/pdf.mjs`);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const data = new Uint8Array(
        await (await fetch(`${origin}/__test/invoice.pdf`)).arrayBuffer(),
      );
      const task = pdfjs.getDocument({ data, verbosity: 0 });
      try {
        const doc = await task.promise;
        const content = await (await doc.getPage(1)).getTextContent();
        return { ok: true, text: content.items.map((i: { str: string }) => i.str).join(" ") };
      } catch (error) {
        return { ok: false, error: String(error) };
      } finally {
        await task.destroy();
      }
    },
    { origin: new URL(baseURL!).origin },
  );

  expect(result.error ?? "").toBe("");
  expect(result.ok).toBe(true);
  expect(result.text).toContain("Crestline Trade Supply Co.");
});

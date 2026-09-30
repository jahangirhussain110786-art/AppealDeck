/**
 * The words of a PDF, one document line per line (29 Sep 2026), for the on-device reading.
 *
 * pdf.js returns text as pieces in the order the file draws them, which for invoices is section by
 * section ("FROM (SUPPLIER)", its lines, then "BILL TO", its lines). A piece ends a line when pdf.js
 * says so (`hasEOL`) or when the next piece starts on a different line of the page. Kept apart from
 * the loader so it runs the same in the browser and in tests.
 */

export interface PdfTextPiece {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
}

export function linesFromTextPieces(pieces: readonly PdfTextPiece[]): string {
  let out = "";
  let lastY: number | undefined;
  for (const piece of pieces) {
    if (typeof piece.str !== "string") continue;
    const y = piece.transform?.[5];
    if (lastY !== undefined && y !== undefined && Math.abs(y - lastY) > 2 && !out.endsWith("\n"))
      out += "\n";
    out += piece.str;
    if (piece.hasEOL) out += "\n";
    if (y !== undefined) lastY = y;
  }
  return out
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** The parts of a pdf.js document this needs, so tests can pass pdf.js's Node build. */
export interface PdfDocumentLike {
  numPages: number;
  getPage(n: number): Promise<{ getTextContent(): Promise<{ items: readonly unknown[] }> }>;
}

export async function pdfDocumentText(doc: PdfDocumentLike, maxPages: number): Promise<string> {
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(linesFromTextPieces(content.items as PdfTextPiece[]));
  }
  return pages.join("\n");
}

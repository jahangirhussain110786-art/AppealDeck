import type { PoaDraft } from "@/core/composer";
import { zipStore } from "./zip";

/**
 * The prepared response as a document a person can keep, send to a colleague, or print.
 *
 * Copying the text into Seller Central stays the primary path. A file is for the other cases: a
 * consultant or assistant who works in Word, a dated record of exactly what was prepared, and a
 * PDF for anyone who wants paper. The Word file is built here with no library, and the PDF is the
 * browser's own "save as PDF" on a clean print page, so nothing is uploaded and nothing is added
 * to what every visitor downloads.
 *
 * It says what it is: a working document the seller reviews and submits themselves. It adds no
 * claim about the outcome, and the draft's own "not ready to submit" watermark and unresolved-items
 * section travel with it unchanged.
 */
export type DocBlock =
  | { kind: "title"; text: string }
  | { kind: "note"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string };

const FOOTNOTE =
  "Prepared with AppealDeck from the seller's own answers. A working document: the seller reviews it, checks every fact against their records, and submits it through Amazon's own page. AppealDeck does not submit anything and cannot predict Amazon's decision.";

export function responseBlocks(draft: PoaDraft, generatedAt: Date): DocBlock[] {
  const title = draft.docType === "poa" ? "Plan of Action" : "Response to Amazon";
  const blocks: DocBlock[] = [
    { kind: "title", text: title },
    {
      kind: "note",
      text: `Prepared ${generatedAt.toISOString().slice(0, 10)}. Attempt ${draft.metadata.attemptNumber}.`,
    },
  ];
  if (draft.watermark) blocks.push({ kind: "note", text: draft.watermark });
  for (const section of draft.sections) {
    blocks.push({ kind: "heading", text: section.heading });
    for (const para of section.body.split(/\r?\n/)) {
      if (para.trim()) blocks.push({ kind: "paragraph", text: para });
    }
  }
  blocks.push({ kind: "note", text: FOOTNOTE });
  return blocks;
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Characters XML 1.0 cannot carry would make Word refuse the file.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

function paragraphXml(block: DocBlock): string {
  const text = escapeXml(block.text);
  const run = (props: string) =>
    `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
  switch (block.kind) {
    case "title":
      return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${run('<w:b/><w:sz w:val="36"/>')}</w:p>`;
    case "heading":
      return `<w:p><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="80"/></w:pPr>${run('<w:b/><w:sz w:val="26"/>')}</w:p>`;
    case "note":
      return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${run('<w:i/><w:color w:val="555555"/><w:sz w:val="20"/>')}</w:p>`;
    default:
      return `<w:p><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr>${run('<w:sz w:val="22"/>')}</w:p>`;
  }
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  "</Types>";

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  "</Relationships>";

export function buildDocx(blocks: readonly DocBlock[]): Uint8Array {
  const encoder = new TextEncoder();
  const body = blocks.map(paragraphXml).join("");
  const document =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>' +
    "</w:sectPr></w:body></w:document>";
  return zipStore([
    { name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: encoder.encode(ROOT_RELS) },
    { name: "word/document.xml", data: encoder.encode(document) },
  ]);
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A self-contained page that prints cleanly: nothing from the app around it. */
export function buildPrintHtml(blocks: readonly DocBlock[]): string {
  const title = blocks.find((b) => b.kind === "title")?.text ?? "Response";
  const body = blocks
    .map((b) => {
      const t = escapeHtml(b.text);
      switch (b.kind) {
        case "title":
          return `<h1>${t}</h1>`;
        case "heading":
          return `<h2>${t}</h2>`;
        case "note":
          return `<p class="note">${t}</p>`;
        default:
          return `<p>${t}</p>`;
      }
    })
    .join("\n");
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    "<style>" +
    "body{font:12pt/1.5 Georgia,'Times New Roman',serif;color:#000;max-width:42rem;margin:2rem auto;padding:0 1rem}" +
    "h1{font-size:20pt;margin:0 0 .25rem}h2{font-size:14pt;margin:1.5rem 0 .25rem;break-after:avoid}" +
    "p{margin:0 0 .6rem;white-space:pre-wrap}.note{font-style:italic;color:#555;font-size:10pt}" +
    "@page{margin:18mm}" +
    "</style></head><body>" +
    body +
    "</body></html>"
  );
}

function saveBlob(bytes: Uint8Array, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadResponseDocx(draft: PoaDraft): void {
  saveBlob(
    buildDocx(responseBlocks(draft, new Date())),
    "appealdeck-response.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
}

/** Opens the clean page and the browser's print dialog, from which "Save as PDF" is one choice. */
export function printResponse(draft: PoaDraft): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(buildPrintHtml(responseBlocks(draft, new Date())));
  win.document.close();
  win.focus();
  win.print();
  return true;
}

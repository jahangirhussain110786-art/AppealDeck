import { describe, expect, it } from "vitest";
import { crc32, zipStore } from "../zip";
import { buildDocx, buildPrintHtml, responseBlocks } from "../responseDocument";
import type { PoaDraft } from "@/core/composer";

const draft: PoaDraft = {
  docType: "poa",
  mode: { mode: "gap-draft", reason: "Resolve the listed items before submitting." },
  watermark: "WORK IN PROGRESS — NOT READY TO SUBMIT",
  sections: [
    {
      heading: "Root Cause",
      body: "We listed returned items as new.\nFour customers were affected & <told>.",
    },
    { heading: "Unresolved items — working notes", body: "Add the file: Sales record" },
  ],
  metadata: {
    generatedAt: "2026-10-07T00:00:00.000Z",
    kind: "POLICY",
    evidenceComplete: false,
    attemptNumber: 2,
    aiDrafted: false,
  },
};

describe("zip", () => {
  it("computes the standard CRC-32 check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes a central directory that points at every entry", () => {
    const bytes = zipStore([
      { name: "a.txt", data: new TextEncoder().encode("hello") },
      { name: "dir/b.txt", data: new TextEncoder().encode("world") },
    ]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const centralStart = view.getUint32(end + 16, true);
    expect(view.getUint32(centralStart, true)).toBe(0x02014b50);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
  });
});

describe("the response document", () => {
  const blocks = responseBlocks(draft, new Date("2026-10-07T12:00:00Z"));

  it("carries the watermark, every section, and says what the document is", () => {
    const text = blocks.map((b) => b.text).join("\n");
    expect(text).toContain("Plan of Action");
    expect(text).toContain("Prepared 2026-10-07. Attempt 2.");
    expect(text).toContain("WORK IN PROGRESS");
    expect(text).toContain("Unresolved items");
    expect(text).toMatch(/does not submit anything and cannot predict/);
    expect(text).not.toMatch(/guarantee|approved|likely/i);
  });

  it("escapes markup in the Word file and the print page", () => {
    const html = buildPrintHtml(blocks);
    expect(html).toContain("&amp; &lt;told&gt;");
    expect(html).not.toContain("<told>");
    const docx = new TextDecoder().decode(buildDocx(blocks));
    expect(docx).toContain("&amp; &lt;told&gt;");
    expect(docx).not.toContain("<told>");
  });

  it("writes a docx with the three parts Word requires", () => {
    const text = new TextDecoder().decode(buildDocx(blocks));
    for (const name of ["[Content_Types].xml", "_rels/.rels", "word/document.xml"])
      expect(text).toContain(name);
  });
});

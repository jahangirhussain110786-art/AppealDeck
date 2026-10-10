import { describe, expect, it } from "vitest";
import {
  buildEvidencePack,
  buildIndex,
  INDEX_NAME,
  PACK_FILE_LIMIT_BYTES,
  RECORD_NAME,
  safeNamePart,
  type PackVaultFile,
  type Shrinker,
} from "../evidencePackFile";
import { createCaseFile } from "@/core/caseFile";
import type { Requirement, Workspace } from "@/core/workspace";

/** Reads a zip made by `zipStore` (stored entries): name to bytes. */
function readZip(zip: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const out = new Map<string, Uint8Array>();
  let at = 0;
  while (at + 30 <= zip.length && view.getUint32(at, true) === 0x04034b50) {
    const size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true);
    const extra = view.getUint16(at + 28, true);
    const name = new TextDecoder().decode(zip.slice(at + 30, at + 30 + nameLength));
    const start = at + 30 + nameLength + extra;
    out.set(name, zip.slice(start, start + size));
    at = start + size;
  }
  return out;
}
const text = (b: Uint8Array | undefined) => new TextDecoder().decode(b);

const bytesOf = (n: number, fill = 7) => new Uint8Array(n).fill(fill);

const vaultFile = (
  id: string,
  name: string,
  mime: string,
  size: number,
  fill = 7,
): PackVaultFile => ({
  id,
  name,
  mimeType: mime,
  sizeBytes: size,
  plaintextHash: `v1.hash-${id}`,
  createdAt: "2026-10-01T09:00:00.000Z",
  bytes: bytesOf(size, fill),
});

const req = (over: Partial<Requirement>): Requirement =>
  ({
    id: "r",
    label: "Supplier invoice",
    sourceQuote: "Please provide the supplier invoice.",
    status: "reviewed",
    note: "",
    ...over,
  }) as Requirement;

const ws = (requirements: Requirement[]) =>
  ({ requirements, submissions: [] }) as unknown as Workspace;
const caseFile = () => ({ ...createCaseFile("INAUTHENTIC"), id: "case-1" });
const NOW = new Date("2026-10-10T09:00:00.000Z");

describe("safeNamePart", () => {
  it("removes characters a file name or a web form may refuse", () => {
    expect(safeNamePart('Invoice: "Q3" <final>/v2?')).toBe("Invoice Q3 final v2");
    expect(safeNamePart("   ...  ")).toBe("Document");
    expect(safeNamePart("x".repeat(100))).toHaveLength(60);
  });
});

describe("buildEvidencePack", () => {
  it("includes only reviewed files, numbered and named by what they answer, in the case's order", async () => {
    const files = [
      vaultFile("a", "IMG_2041.jpg", "image/jpeg", 1000),
      vaultFile("b", "scan (1).pdf", "application/pdf", 2000),
      vaultFile("c", "ignored.pdf", "application/pdf", 3000),
    ];
    const requirements = [
      req({
        id: "1",
        label: "Supplier invoice",
        recordId: "a",
        note: "Page 1 shows the supplier and the date.",
        page: 1,
      }),
      req({ id: "2", label: "Brand authorization", recordId: "b" }),
      req({ id: "3", label: "Test report", status: "waiting", recordId: "c" }),
    ];
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws(requirements),
      files,
      now: NOW,
    });
    expect(pack.entries.map((e) => e.name)).toEqual([
      "01 Supplier invoice.jpg",
      "02 Brand authorization.pdf",
    ]);
    const zip = readZip(pack.bytes);
    expect([...zip.keys()].sort()).toEqual([
      "For your records/pack-record.txt",
      "Upload to Amazon/00 Index of documents.txt",
      "Upload to Amazon/01 Supplier invoice.jpg",
      "Upload to Amazon/02 Brand authorization.pdf",
    ]);
    // The seller's original bytes, untouched when under the limit.
    expect(zip.get("Upload to Amazon/01 Supplier invoice.jpg")).toEqual(bytesOf(1000));
    expect(pack.notIncluded).toEqual([{ label: "Test report", why: "Still waiting for it." }]);
    expect(pack.filename).toBe("appealdeck-evidence-pack-case-1-2026-10-10.zip");
  });

  it("puts Amazon's asks first, then ours, then the seller's", async () => {
    const files = [
      vaultFile("a", "a.pdf", "application/pdf", 10),
      vaultFile("b", "b.pdf", "application/pdf", 10),
      vaultFile("c", "c.pdf", "application/pdf", 10),
    ];
    const requirements = [
      req({ id: "1", label: "Added by seller", source: "seller", recordId: "c" }),
      req({ id: "2", label: "Recommended record", source: "matrix", recordId: "b" }),
      req({ id: "3", label: "Named in notice", source: "notice", recordId: "a" }),
    ];
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws(requirements),
      files,
      now: NOW,
    });
    expect(pack.entries.map((e) => e.name)).toEqual([
      "01 Named in notice.pdf",
      "02 Recommended record.pdf",
      "03 Added by seller.pdf",
    ]);
  });

  it("numbers several files under one label, and lists one file once when it answers two records", async () => {
    const files = [
      vaultFile("a", "one.pdf", "application/pdf", 10, 1),
      vaultFile("b", "two.pdf", "application/pdf", 10, 2),
      vaultFile("c", "shared.pdf", "application/pdf", 10, 3),
    ];
    const requirements = [
      req({ id: "1", label: "Supplier invoice", recordId: "a" }),
      req({ id: "2", label: "Supplier invoice", recordId: "b" }),
      req({ id: "3", label: "Packing list", recordId: "c" }),
      req({ id: "4", label: "Delivery proof", recordId: "c" }),
    ];
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws(requirements),
      files,
      now: NOW,
    });
    expect(pack.entries.map((e) => e.name)).toEqual([
      "01 Supplier invoice (1 of 2).pdf",
      "02 Supplier invoice (2 of 2).pdf",
      "03 Packing list.pdf",
    ]);
    expect(pack.entries[2]!.answers).toEqual(["Packing list", "Delivery proof"]);
  });

  it("re-saves a picture over the limit, says so, and never touches one under it", async () => {
    const big = vaultFile("a", "photo.png", "image/png", PACK_FILE_LIMIT_BYTES + 10);
    const small = vaultFile("b", "ok.png", "image/png", 500);
    const shrink: Shrinker = async (_bytes, _mime, limit) => ({
      bytes: bytesOf(Math.floor(limit / 2), 9),
      mime: "image/jpeg",
      note: "Re-saved as a JPEG to fit.",
    });
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([
        req({ id: "1", label: "Photo", recordId: "a" }),
        req({ id: "2", label: "Small", recordId: "b" }),
      ]),
      files: [big, small],
      shrink,
      now: NOW,
    });
    expect(pack.entries.map((e) => e.name)).toEqual(["01 Photo.jpg", "02 Small.png"]);
    expect(pack.reducedCount).toBe(1);
    expect(pack.overLimitCount).toBe(0);
    const zip = readZip(pack.bytes);
    expect(zip.get("Upload to Amazon/02 Small.png")).toEqual(bytesOf(500));
    expect(text(zip.get("For your records/pack-record.txt"))).toContain(
      "CHANGED: Re-saved as a JPEG to fit.",
    );
    expect(text(zip.get("Upload to Amazon/00 Index of documents.txt"))).toContain(
      "re-saved picture of the original",
    );
  });

  it("includes a large PDF as it is and flags it, because a PDF cannot be shrunk here", async () => {
    const big = vaultFile("a", "scan.pdf", "application/pdf", PACK_FILE_LIMIT_BYTES + 1);
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([req({ id: "1", label: "Scan", recordId: "a" })]),
      files: [big],
      shrink: async () => {
        throw new Error("must not be asked to shrink a PDF");
      },
      now: NOW,
    });
    expect(pack.overLimitCount).toBe(1);
    expect(pack.entries[0]!.overLimit).toBe(true);
    expect(text(readZip(pack.bytes).get("For your records/pack-record.txt"))).toContain(
      "OVER 5.0 MB",
    );
  });

  it("keeps the original when the picture cannot be made small enough", async () => {
    const big = vaultFile("a", "photo.png", "image/png", PACK_FILE_LIMIT_BYTES + 10);
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([req({ id: "1", label: "Photo", recordId: "a" })]),
      files: [big],
      shrink: async () => null,
      now: NOW,
    });
    expect(pack.entries[0]!.name).toBe("01 Photo.png");
    expect(pack.entries[0]!.overLimit).toBe(true);
    expect(pack.reducedCount).toBe(0);
  });

  it("flags a file type we could not confirm Amazon takes", async () => {
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([req({ id: "1", label: "Photo", recordId: "a" })]),
      files: [vaultFile("a", "photo.heic", "image/heic", 100)],
      now: NOW,
    });
    expect(pack.entries[0]!.typeWarning).toMatch(/\.heic/);
  });

  it("lists, in the seller's record and not the index, what has no file and why", async () => {
    const requirements = [
      req({ id: "1", label: "Supplier invoice", status: "needed" }),
      req({
        id: "2",
        label: "Brand authorization",
        status: "cannot_obtain",
        declined: { reason: "The brand does not reply", at: "2026-10-02T00:00:00.000Z" },
      }),
      req({ id: "3", label: "Test report", status: "reviewed", recordId: "gone" }),
    ];
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws(requirements),
      files: [],
      now: NOW,
    });
    const zip = readZip(pack.bytes);
    const record = text(zip.get("For your records/pack-record.txt"));
    expect(record).toContain("Supplier invoice: No file added yet.");
    expect(record).toContain(
      "Brand authorization: You said you cannot get it: The brand does not reply",
    );
    expect(record).toContain("Test report: Marked as reviewed, but its file is no longer");
    const index = text(zip.get(`Upload to Amazon/${INDEX_NAME}`));
    expect(index).toContain("No documents are listed.");
    expect(index).not.toContain("Supplier invoice");
  });

  it("keeps the index to what a reviewer needs: no hashes, sizes or product internals", async () => {
    const files = [vaultFile("a", "x.pdf", "application/pdf", 10)];
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([
        req({
          id: "1",
          label: "Supplier invoice",
          recordId: "a",
          note: "Shows the supplier and the date.",
          page: 2,
        }),
      ]),
      files,
      now: NOW,
    });
    const index = text(readZip(pack.bytes).get(`Upload to Amazon/${INDEX_NAME}`));
    expect(index).toContain("01 Supplier invoice.pdf");
    expect(index).toContain("Shows: Shows the supplier and the date.");
    expect(index).toContain("Refer to page 2.");
    expect(index).not.toMatch(/hash|v1\.|AppealDeck|MB|KB/i);
    const record = text(readZip(pack.bytes).get(`For your records/${RECORD_NAME}`));
    expect(record).toContain("v1.hash-a");
    expect(record).toContain("not a submission");
  });

  it("refuses a case too large to hold in one pack", async () => {
    const huge = {
      ...vaultFile("a", "x.pdf", "application/pdf", 10),
      bytes: { length: 200 * 1024 * 1024 } as unknown as Uint8Array,
    };
    await expect(
      buildEvidencePack({ file: caseFile(), workspace: ws([]), files: [huge], now: NOW }),
    ).rejects.toThrow(/too large/);
  });

  it("says nothing about outcomes anywhere in its text", async () => {
    const pack = await buildEvidencePack({
      file: caseFile(),
      workspace: ws([req({ id: "1", recordId: "a" })]),
      files: [vaultFile("a", "x.pdf", "application/pdf", 10)],
      now: NOW,
    });
    const zip = readZip(pack.bytes);
    for (const name of ["For your records/pack-record.txt", `Upload to Amazon/${INDEX_NAME}`])
      expect(text(zip.get(name))).not.toMatch(
        /\b(?:guarantee|will be accepted|approved by|likely to)\b/i,
      );
    expect(buildIndex([], NOW)).toContain("No documents are listed.");
  });
});

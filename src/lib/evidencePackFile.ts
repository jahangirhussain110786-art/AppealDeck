/**
 * P-10: the upload-ready evidence pack (10 Oct 2026, released by the founder's exact phrase).
 *
 * `buildEvidenceManifest` gave a seller a text record of their files. What a seller about to upload
 * to Amazon's response page needs is the files themselves, tidy: the ones they reviewed and linked,
 * in the order the case lists them, with names a reviewer can follow, each small enough to upload,
 * and a one-page index saying what each shows. This builds that as one zip, on the device. Nothing
 * is sent anywhere, and the seller still uploads every file to Amazon themselves.
 *
 * Rules, each there because the opposite would mislead or lose something:
 *
 * - **Only reviewed files go in.** A file the seller linked and checked is one they chose to rely
 *   on. A record still being waited for, or one declined, has no file; it is listed in the seller's
 *   own record, never in the index that may go to a reviewer.
 * - **Original names are not used.** `IMG_2041.jpg` tells a reviewer nothing. The name is the
 *   number, then the record's label ("01 Supplier invoice.pdf"), and "(2 of 3)" when one label has
 *   several files. The seller's own file is untouched in the vault; this is a copy.
 * - **A file is changed only if it is over the limit, and only if it is a picture.** A picture is
 *   re-saved as a JPEG, scaled and compressed until it fits. A PDF cannot be shrunk honestly in a
 *   browser, so it is included as it is and flagged. Whatever was changed is said in the seller's
 *   record, because a seller must always know when a document is not the original.
 * - **The limit is ours, not Amazon's.** Amazon publishes no upload limit we could confirm (third
 *   party sources say 6 to 10 MB), so 5 MB is a safe margin. The record says so.
 * - **The index is for a reviewer; the record is for the seller.** The index carries what each file
 *   is and what the seller says it shows. Hashes, sizes, what was reduced and what is missing stay
 *   in `For your records/`, so the folder to upload holds nothing that is not meant for Amazon.
 * - **It claims nothing about outcomes.** Tidy files do not make a response accepted, and the text
 *   says that it is a copy of the seller's own documents, not a submission.
 */

import type { CaseFile } from "@/core/caseFile";
import type { Requirement, Workspace } from "@/core/workspace";
import { zipStore, type ZipEntry } from "./zip";
import { buildEvidenceManifest, REQUIREMENT_GROUPS, type PackRecord } from "./evidencePack";
import { formatDate } from "./format";

/** Each file is kept under this. Amazon's own limit is not published, so this is a margin. */
export const PACK_FILE_LIMIT_BYTES = 5 * 1024 * 1024;
/** A pack bigger than this in memory is refused rather than risk the tab. */
export const PACK_TOTAL_LIMIT_BYTES = 150 * 1024 * 1024;

const UPLOAD_DIR = "Upload to Amazon";
const RECORD_DIR = "For your records";
export const INDEX_NAME = "00 Index of documents.txt";
export const RECORD_NAME = "pack-record.txt";

/** A file from the vault, decrypted, with the record that describes it. */
export interface PackVaultFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  plaintextHash: string;
  createdAt: string;
  bytes: Uint8Array;
}

/** Makes a picture smaller, or returns null when it cannot. Injected: needs a browser. */
export type Shrinker = (
  bytes: Uint8Array,
  mime: string,
  limit: number,
) => Promise<{ bytes: Uint8Array; mime: string; note: string } | null>;

export interface PackEntry {
  /** 1-based position, also the number in the file's name. */
  number: number;
  /** The name inside the zip's upload folder. */
  name: string;
  /** The record's label, and any other record this same file also answers. */
  answers: string[];
  /** What the seller wrote about it when they checked it. */
  note: string;
  page?: number;
  originalName: string;
  originalBytes: number;
  finalBytes: number;
  hash: string;
  /** Set when the file is a re-saved copy: what was done. */
  reduced?: string;
  /** Over the limit and could not be made smaller. */
  overLimit: boolean;
  /** A file type Amazon may not take, in plain words. */
  typeWarning?: string;
}

export interface NotIncluded {
  label: string;
  why: string;
}

export interface EvidencePack {
  filename: string;
  bytes: Uint8Array;
  entries: PackEntry[];
  notIncluded: NotIncluded[];
  /** Files that were re-saved smaller. */
  reducedCount: number;
  /** Files still over the limit. */
  overLimitCount: number;
}

const COMMON_TYPES = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "txt",
  "tif",
  "tiff",
  "bmp",
  "xls",
  "xlsx",
  "csv",
]);

const MIME_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tif",
  "text/plain": "txt",
};

/** Only pictures a browser can decode are worth trying to shrink. */
const SHRINKABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]);

/** A label as a file name: no characters Windows or a web form may refuse, a sane length. */
export function safeNamePart(text: string): string {
  const cleaned = text
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return (cleaned.length > 60 ? cleaned.slice(0, 60).trim() : cleaned) || "Document";
}

function extensionOf(name: string, mime: string): string {
  const fromName = /\.([A-Za-z0-9]{1,5})$/.exec(name)?.[1]?.toLowerCase();
  return fromName ?? MIME_EXTENSION[mime] ?? "bin";
}

function megabytes(n: number): string {
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");

export interface BuildPackInput {
  file: CaseFile;
  workspace: Workspace;
  /** Every document in the vault for this case, decrypted. */
  files: readonly PackVaultFile[];
  shrink?: Shrinker;
  now?: Date;
}

/** The requirements in the order the case lists them: Amazon's asks, then ours, then the seller's. */
function inCaseOrder(workspace: Workspace): Requirement[] {
  return REQUIREMENT_GROUPS.flatMap((group) => workspace.requirements.filter(group.match));
}

export async function buildEvidencePack(input: BuildPackInput): Promise<EvidencePack> {
  const { file, workspace, files, shrink, now = new Date() } = input;
  const byId = new Map(files.map((f) => [f.id, f]));
  const total = files.reduce((n, f) => n + f.bytes.length, 0);
  if (total > PACK_TOTAL_LIMIT_BYTES)
    throw new Error("The files in this case are too large to put in one pack.");

  type Draft = {
    source: PackVaultFile;
    label: string;
    answers: string[];
    note: string;
    page?: number;
  };
  const drafts: Draft[] = [];
  const byHash = new Map<string, Draft>();
  const notIncluded: NotIncluded[] = [];

  for (const req of inCaseOrder(workspace)) {
    const source = req.status === "reviewed" && req.recordId ? byId.get(req.recordId) : undefined;
    if (!source) {
      notIncluded.push({
        label: req.label,
        why:
          req.status === "cannot_obtain"
            ? `You said you cannot get it${req.declined?.reason ? `: ${req.declined.reason}` : "."}`
            : req.status === "waiting"
              ? "Still waiting for it."
              : req.status === "reviewed"
                ? "Marked as reviewed, but its file is no longer in this browser's vault."
                : "No file added yet.",
      });
      continue;
    }
    // The same file answering two records is one file, listed once with both labels.
    const seen = byHash.get(source.plaintextHash);
    if (seen) {
      seen.answers.push(req.label);
      continue;
    }
    const draft: Draft = {
      source,
      label: req.label,
      answers: [req.label],
      note: req.note.trim(),
      ...(req.page ? { page: req.page } : {}),
    };
    byHash.set(source.plaintextHash, draft);
    drafts.push(draft);
  }

  // "(2 of 3)" only where one label has several files.
  const perLabel = new Map<string, number>();
  for (const d of drafts)
    perLabel.set(safeNamePart(d.label), (perLabel.get(safeNamePart(d.label)) ?? 0) + 1);
  const seenLabel = new Map<string, number>();
  const width = Math.max(2, String(drafts.length).length);

  const entries: PackEntry[] = [];
  const zipEntries: ZipEntry[] = [];
  for (const [i, d] of drafts.entries()) {
    const part = safeNamePart(d.label);
    const k = (seenLabel.get(part) ?? 0) + 1;
    seenLabel.set(part, k);
    const many = perLabel.get(part)! > 1;
    let bytes = d.source.bytes;
    let mime = d.source.mimeType;
    let reduced: string | undefined;
    if (bytes.length > PACK_FILE_LIMIT_BYTES && shrink && SHRINKABLE.has(mime)) {
      const smaller = await shrink(bytes, mime, PACK_FILE_LIMIT_BYTES).catch(() => null);
      if (smaller && smaller.bytes.length <= PACK_FILE_LIMIT_BYTES) {
        bytes = smaller.bytes;
        mime = smaller.mime;
        reduced = smaller.note;
      }
    }
    const ext = reduced ? extensionOf("", mime) : extensionOf(d.source.name, mime);
    const name = `${pad(i + 1, width)} ${part}${many ? ` (${k} of ${perLabel.get(part)})` : ""}.${ext}`;
    entries.push({
      number: i + 1,
      name,
      answers: d.answers,
      note: d.note,
      ...(d.page ? { page: d.page } : {}),
      originalName: d.source.name,
      originalBytes: d.source.bytes.length,
      finalBytes: bytes.length,
      hash: d.source.plaintextHash,
      ...(reduced ? { reduced } : {}),
      overLimit: bytes.length > PACK_FILE_LIMIT_BYTES,
      ...(COMMON_TYPES.has(ext)
        ? {}
        : {
            typeWarning: `We could not confirm Amazon accepts .${ext} files. If the upload is refused, save it as a PDF or a JPG.`,
          }),
    });
    zipEntries.push({ name: `${UPLOAD_DIR}/${name}`, data: bytes });
  }

  const reducedCount = entries.filter((e) => e.reduced).length;
  const overLimitCount = entries.filter((e) => e.overLimit).length;
  const encoder = new TextEncoder();
  zipEntries.unshift({
    name: `${UPLOAD_DIR}/${INDEX_NAME}`,
    data: encoder.encode(buildIndex(entries, now)),
  });

  // The seller's own record: the manifest of everything in the vault, then what this pack did.
  const manifest = buildEvidenceManifest({
    file,
    workspace,
    records: files.map((f): PackRecord => ({
      filename: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      contentHash: f.plaintextHash,
      addedAt: f.createdAt,
      answers: workspace.requirements.find((q) => q.recordId === f.id)?.label,
      page: workspace.requirements.find((q) => q.recordId === f.id)?.page,
    })),
  });
  zipEntries.push({
    name: `${RECORD_DIR}/${RECORD_NAME}`,
    data: encoder.encode(buildRecord(entries, notIncluded, manifest, now)),
  });

  const date = now.toISOString().slice(0, 10);
  const safeId = file.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "case";
  return {
    filename: `appealdeck-evidence-pack-${safeId}-${date}.zip`,
    bytes: zipStore(zipEntries),
    entries,
    notIncluded,
    reducedCount,
    overLimitCount,
  };
}

/** The page a reviewer may be given: what each file is and what it shows, and nothing else. */
export function buildIndex(entries: readonly PackEntry[], now: Date): string {
  const lines: string[] = [];
  lines.push("INDEX OF SUPPORTING DOCUMENTS");
  lines.push(`Prepared ${formatDate(now.toISOString())}`);
  lines.push("");
  if (entries.length === 0) {
    lines.push("No documents are listed.");
    return lines.join("\n");
  }
  lines.push(
    `${entries.length} ${entries.length === 1 ? "file" : "files"}, in the order listed. Each entry says what the document is and what it shows.`,
  );
  lines.push("");
  for (const e of entries) {
    lines.push(e.name);
    lines.push(`  Document: ${e.answers.join("; ")}`);
    if (e.note) lines.push(`  Shows: ${e.note.replace(/\s+/g, " ")}`);
    if (e.page) lines.push(`  Refer to page ${e.page}.`);
    if (e.reduced)
      lines.push("  This is a re-saved picture of the original document, made smaller to upload.");
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

/** What the seller needs and a reviewer does not: sizes, hashes, what changed, what is missing. */
function buildRecord(
  entries: readonly PackEntry[],
  notIncluded: readonly NotIncluded[],
  manifest: string,
  now: Date,
): string {
  const lines: string[] = [];
  lines.push("AppealDeck evidence pack: your own record");
  lines.push(`Built ${formatDate(now.toISOString())}, on your device. Nothing was sent anywhere.`);
  lines.push("");
  lines.push(
    "The folder 'Upload to Amazon' holds copies of the files you reviewed, renamed and numbered, and an index. Your originals are unchanged in your vault. You upload the files to Amazon yourself; this pack is not a submission.",
  );
  lines.push("");
  lines.push(`== What is in the upload folder (${entries.length}) ==`);
  for (const e of entries) {
    lines.push(`${e.name}`);
    lines.push(`  Was: ${e.originalName} (${megabytes(e.originalBytes)})`);
    lines.push(`  Now: ${megabytes(e.finalBytes)}`);
    lines.push(`  Content hash of your original: ${e.hash}`);
    if (e.reduced) lines.push(`  CHANGED: ${e.reduced}`);
    if (e.overLimit)
      lines.push(
        `  OVER ${megabytes(PACK_FILE_LIMIT_BYTES)}: we could not make this smaller here. Reduce it before uploading (a PDF viewer's "reduce file size", or print to PDF).`,
      );
    if (e.typeWarning) lines.push(`  CHECK: ${e.typeWarning}`);
  }
  lines.push("");
  lines.push(`== Not in the upload folder (${notIncluded.length}) ==`);
  if (notIncluded.length === 0) lines.push("Every record on your list has a file here.");
  for (const n of notIncluded) lines.push(`- ${n.label}: ${n.why}`);
  lines.push("");
  lines.push("== About the size limit ==");
  lines.push(
    `We kept each file under ${megabytes(PACK_FILE_LIMIT_BYTES)}. Amazon publishes no upload limit we could confirm; third-party sources say between 6 and 10 MB, so this leaves a margin. Check the limit on the upload page itself.`,
  );
  lines.push("");
  lines.push("== Your full manifest ==");
  lines.push(manifest);
  return lines.join("\n");
}

/**
 * AA-42 (AM-26): the evidence pack manifest.
 *
 * `buildCaseExport` already produced a readable dump of a case. What it did not produce is the
 * thing the 21 Sep 2026 commercial review identified as the only durable differentiator: an
 * **independent record** of what the seller sent, when, and exactly which file backed each claim.
 * Amazon's own assistant can explain a notice; it cannot give a seller a record that survives
 * outside Amazon's account, which is precisely what a seller needs when a case drags on for months
 * or when they need to show a consultant or a lawyer what has already been tried.
 *
 * The manifest is plain text on purpose. No archive format, no dependency: the seller already has
 * their own files, and what is missing is the index — names, sizes, content hashes, and the
 * requirement each file answers. A hash lets them prove months later that the file they still hold
 * is the file they sent.
 *
 * Nothing here is generated or inferred. Every line comes from the vault's own records.
 */

import type { CaseFile } from "@/core/caseFile";
import type { Workspace } from "@/core/workspace";
import { formatDate } from "./format";

export interface PackRecord {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** The vault's own content hash of the plaintext, e.g. "v1.<sha256>". */
  contentHash: string;
  addedAt: string;
  /** The requirement this file was linked to, when the seller linked it. */
  answers?: string;
  page?: number;
}

export interface EvidencePackInput {
  file: CaseFile;
  workspace: Workspace;
  records: readonly PackRecord[];
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildEvidenceManifest(input: EvidencePackInput): string {
  const { file, workspace, records } = input;
  const lines: string[] = [];

  lines.push("AppealDeck evidence manifest — your own record, not a submission");
  lines.push(`Generated ${formatDate(new Date().toISOString())}`);
  lines.push(`Case ${file.id} · ${file.kind.replaceAll("_", " ")}`);
  lines.push("");
  lines.push(
    "This lists the files held in your vault for this case. AppealDeck has not sent any of them to Amazon — you submit what you choose, yourself.",
  );
  lines.push("");

  lines.push(`== Files (${records.length}) ==`);
  if (records.length === 0) {
    lines.push("(no files in the vault for this case)");
  }
  records.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.filename}`);
    lines.push(`   Type: ${r.mimeType || "unknown"} · Size: ${bytes(r.sizeBytes)}`);
    lines.push(`   Added: ${formatDate(r.addedAt)}`);
    if (r.answers) lines.push(`   Answers: ${r.answers}${r.page ? ` · page ${r.page}` : ""}`);
    // The hash is what makes this a record rather than a list — it lets the seller show, later,
    // that the file they still hold is byte-for-byte the file this manifest describes.
    lines.push(`   Content hash: ${r.contentHash}`);
  });
  lines.push("");

  lines.push(`== Requirements Amazon asked for (${workspace.requirements.length}) ==`);
  if (workspace.requirements.length === 0) lines.push("(none recorded yet)");
  for (const req of workspace.requirements) {
    const linked = req.filename
      ? `${req.filename}${req.page ? ` · page ${req.page}` : ""}`
      : "none";
    lines.push(`- ${req.label} [${req.status}] · file: ${linked}`);
    lines.push(`  Requested because: ${req.sourceQuote}`);
  }
  lines.push("");

  lines.push(`== What was sent, and when (${workspace.submissions.length}) ==`);
  if (workspace.submissions.length === 0) {
    lines.push("(nothing recorded as sent yet)");
  }
  workspace.submissions.forEach((s, i) => {
    lines.push(
      `Attempt ${i + 1} · ${formatDate(s.at)} · revision ${s.revision}${
        s.receipt ? ` · reference ${s.receipt}` : ""
      }`,
    );
    if (s.attachments.length === 0) {
      lines.push("  Attachments recorded: none");
    }
    for (const a of s.attachments) {
      lines.push(`  Attachment: ${a.filename}${a.page ? ` · page ${a.page}` : ""}`);
      lines.push(`    Content hash at the time it was sent: ${a.contentHash}`);
    }
  });
  lines.push("");

  lines.push("== How to check a file against this manifest ==");
  lines.push(
    "Each content hash is taken from the file's contents, not its name. If a hash here matches the file you still hold, the contents are unchanged since it was added.",
  );
  lines.push("");
  lines.push(
    "This manifest is for your own records. It is not a submission and was not sent to Amazon.",
  );

  return lines.join("\n");
}

/** Filename for the downloaded manifest. Dated so successive exports do not overwrite each other. */
export function manifestFilename(caseId: string, now = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  const safeId = caseId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "case";
  return `appealdeck-evidence-manifest-${safeId}-${date}.txt`;
}

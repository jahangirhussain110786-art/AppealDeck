import type { CaseFile } from "@/core/interviewEngine";
import type { Workspace } from "@/core/workspace";
import { PROTOCOL_LABELS, workspaceGaps } from "@/core/workspace";
import { formatDate } from "./format";

/**
 * A complete, plainly labelled readable record of a workspace case — every requested record,
 * every review note, every submission and reply in full, not just the notice and top-level
 * explanation. Explicitly not a submission and not sent to Amazon; the case's own vault-backed
 * data is the only source (nothing here is invented or summarized away).
 */
export function buildCaseExport(file: CaseFile, w: Workspace): string {
  const gaps = workspaceGaps(w);
  const lines: string[] = [];
  lines.push("AppealDeck case export — not a submission, not sent to Amazon");
  lines.push(`Exported ${formatDate(new Date().toISOString())}`);
  lines.push(
    `Case ${file.id} · ${file.kind.replaceAll("_", " ")} · ${PROTOCOL_LABELS[w.protocol]}`,
  );
  lines.push(`Marketplace: ${w.marketplace === "US" ? "Amazon US" : "Not confirmed"}`);
  lines.push("");
  lines.push("== Amazon notice ==");
  lines.push(w.notice || "(none saved)");
  lines.push("");
  lines.push("== Response-page instructions ==");
  lines.push(w.formInstructions || "(none saved)");
  lines.push("");
  lines.push("== Seller's response facts ==");
  lines.push(`Explanation:\n${w.explanation || "(not written yet)"}`);
  if (w.protocol === "operational") {
    lines.push(`\nCorrective actions:\n${w.correctiveActions || "(not written yet)"}`);
    lines.push(`\nPreventive measures:\n${w.preventiveMeasures || "(not written yet)"}`);
  }
  lines.push("");
  lines.push(
    `== Evidence plan (${w.requirements.length} record${w.requirements.length === 1 ? "" : "s"}) ==`,
  );
  if (w.requirements.length === 0) lines.push("(none added yet)");
  for (const r of w.requirements) {
    lines.push(`- ${r.label} [${r.status}]`);
    lines.push(`  Requested because: ${r.sourceQuote}`);
    lines.push(
      `  Linked file: ${r.filename ?? "(none attached)"}${r.page ? ` · page ${r.page}` : ""}`,
    );
    if (r.note) lines.push(`  What it supports: ${r.note}`);
  }
  lines.push("");
  lines.push(`== Submissions (${w.submissions.length}) ==`);
  if (w.submissions.length === 0) lines.push("(no submission recorded)");
  w.submissions.forEach((s, i) => {
    lines.push(`--- Attempt ${i + 1} · ${formatDate(s.at)} · revision ${s.revision} ---`);
    lines.push(s.text);
    if (s.receipt) lines.push(`Reference: ${s.receipt}`);
    for (const a of s.attachments) lines.push(`Attachment: ${a.filename} · page ${a.page}`);
    lines.push("");
  });
  lines.push(`== Replies (${w.replies.length}) ==`);
  if (w.replies.length === 0) lines.push("(no reply recorded)");
  for (const r of w.replies) {
    lines.push(
      `--- ${formatDate(r.at)} · ${r.applied ? "used for a revision" : "not yet applied"} ---`,
    );
    lines.push(r.text);
    lines.push("");
  }
  lines.push("== Unresolved items ==");
  lines.push(gaps.length ? gaps.join("\n") : "(none)");
  lines.push("");
  lines.push("This export is case notes for your own records — it is not a submitted response.");
  return lines.join("\n");
}

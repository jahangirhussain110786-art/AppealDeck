import type { CaseFile } from "@/core/caseFile";
import type { Requirement, Workspace } from "@/core/workspace";
import { PROTOCOL_LABELS, workspaceGaps, requirementEvidenceKind } from "@/core/workspace";
import { alternativesFor } from "@/core/requirementGuidance";
import { formatDay } from "@/core/noticeDate";
import type { SerializedDeadline } from "@/core/deadlinesModel";
import type { CaseLog } from "./caseStore";
import { REQUIREMENT_GROUPS } from "./evidencePack";
import { formatDate } from "./format";
import {
  checkContextKey,
  FINDING_LABELS,
  savedCheckFor,
  summarizeCheck,
} from "@/core/documentCheck";
import { checkCaseDataForWorkspace } from "./documentChecks/context";

const STATUS_LABELS: Record<Requirement["status"], string> = {
  needed: "still needed",
  waiting: "waiting on someone else",
  reviewed: "reviewed and linked",
  cannot_obtain: "cannot be obtained",
};

const OUTCOME_LABELS: Record<NonNullable<CaseLog["resolution"]>["status"], string> = {
  reinstated: "Reinstated or approved",
  rejected: "Rejected or denied",
  withdrawn: "Withdrawn by the seller",
};

/** A deadline as the seller's screen describes it, so the export never states a date the page did not. */
function describeDeadline(d: SerializedDeadline): string {
  if (d.setBy === "seller") return `${d.label} (entered by the seller from Account Health)`;
  if (d.dueOn) return d.startsOn ? `${d.label}, closes ${formatDay(d.dueOn)}` : d.label;
  if (d.startsOnReceipt) return `${d.label}, from the day the notice was received`;
  if (d.dueAt) return `${d.label}: ${formatDate(d.dueAt)}`;
  return d.label;
}

function requirementLines(r: Requirement, reason: string): string[] {
  const lines = [`- ${r.label} [${STATUS_LABELS[r.status]}]`];
  const revision =
    r.source === "notice" && r.sourceRevision ? ` (request ${r.sourceRevision})` : "";
  lines.push(`  ${reason}${revision}: ${r.sourceQuote}`);
  lines.push(
    `  Linked file: ${r.filename ?? "(none attached)"}${r.page ? ` · page ${r.page}` : ""}`,
  );
  if (r.contentHash) lines.push(`  Content hash: ${r.contentHash}`);
  if (r.note) lines.push(`  What it supports: ${r.note}`);
  if (r.status === "cannot_obtain" && r.declined) {
    const kind = requirementEvidenceKind(r) ?? "other";
    const path = alternativesFor(kind).find((a) => a.id === r.declined!.alternativeId)?.label;
    lines.push(`  Why it cannot be obtained (${formatDate(r.declined.at)}): ${r.declined.reason}`);
    if (path) lines.push(`  Path chosen instead: ${path}`);
  }
  return lines;
}

/**
 * The document checks saved with the case, one per record still linked to it. Each finding is
 * written the way the page shows it — what was read, in quotes, and what it was compared with —
 * and a check compared with case details that have since changed says so, so a specialist does not
 * take an old comparison for a current one.
 */
function documentCheckLines(w: Workspace): string[] {
  const keyNow = checkContextKey(checkCaseDataForWorkspace(w));
  const checked = w.requirements.flatMap((r) => {
    const saved = savedCheckFor(w.documentChecks, r.recordId, r.contentHash);
    return saved ? [{ r, saved }] : [];
  });
  if (checked.length === 0) return ["Document checks: none run on the files linked here."];
  const lines = ["Document checks (what could be read; never a judgment of the document):"];
  for (const { r, saved } of checked) {
    const stale =
      saved.contextKey !== keyNow ? " — compared with case details that have since changed" : "";
    lines.push(`- ${r.filename ?? r.label} · checked ${formatDate(saved.at)}${stale}`);
    if (saved.outcome.kind === "fields") {
      lines.push(`  ${summarizeCheck(saved.outcome.result)}`);
      for (const f of saved.outcome.result.findings) {
        const read = f.observed ? ` “${f.observed}”` : "";
        const against = f.comparedWith ? ` (compared with ${f.comparedWith})` : "";
        lines.push(`  ${f.field}: ${FINDING_LABELS[f.status]}.${read}${against} ${f.note}`);
      }
      for (const d of saved.outcome.result.triggeredDisqualifiers) lines.push(`  Note: ${d}`);
    } else {
      for (const c of saved.outcome.report.checks) lines.push(`  ${c.label}: ${c.detail}`);
    }
  }
  return lines;
}

/**
 * A readable record of a workspace case, complete enough to hand to a specialist.
 *
 * Widened 23 Sep 2026 (audit item Q). It said "complete" and left out most of what a specialist
 * asks first: the deadline, every issue the notice raised, which records Amazon asked for as
 * opposed to ones we recommended (every record was labelled "Requested because"), why a record
 * could not be obtained, the earlier versions of the request, the file hashes, what the seller
 * confirmed doing, the outcome they recorded and the case's own history.
 *
 * Explicitly not a submission and not sent to Amazon. Every line comes from the case's own saved
 * data; nothing is summarized away or inferred. Document checks are saved with the case since
 * 24 Sep 2026 and are included, each dated, with the ones compared against since-changed case
 * details marked as such.
 */
export function buildCaseExport(
  file: CaseFile,
  w: Workspace,
  /** `null`: the case has no log yet. Omitted: the log could not be read, and the export says so. */
  log?: CaseLog | null,
): string {
  const gaps = workspaceGaps(w);
  const lines: string[] = [];
  lines.push("AppealDeck case export — not a submission, not sent to Amazon");
  lines.push(`Exported ${formatDate(new Date().toISOString())}`);
  lines.push(
    `Case ${file.id} · ${file.kind.replaceAll("_", " ")}${file.kindSetBy === "seller" ? " (chosen by the seller)" : ""} · ${PROTOCOL_LABELS[w.protocol]}`,
  );
  lines.push(`Marketplace: ${w.marketplace === "US" ? "Amazon US" : "Not confirmed"}`);
  lines.push(`Current request: revision ${w.revision}`);
  lines.push("");

  lines.push("== Deadlines ==");
  if (!file.deadlines?.length) lines.push("(none recorded)");
  for (const d of file.deadlines ?? []) lines.push(`- ${describeDeadline(d)}`);
  lines.push("");

  lines.push("== Amazon notice ==");
  lines.push(w.notice || "(none saved)");
  lines.push("");
  lines.push("== Response-page instructions ==");
  lines.push(w.formInstructions || "(none saved)");
  lines.push("");

  if (w.issues?.length) {
    lines.push(
      `== Issues the notice raises (${w.issues.length}) · ${w.issuesConfirmed ? "seller confirmed the response covers each" : "not yet confirmed as covered"} ==`,
    );
    for (const issue of w.issues) {
      lines.push(`- ${issue.kind.replaceAll("_", " ")}: ${issue.sourceQuote}`);
    }
    lines.push("");
  }

  lines.push("== Seller's response facts ==");
  lines.push(`Explanation:\n${w.explanation || "(not written yet)"}`);
  if (w.protocol === "operational") {
    lines.push(`\nCorrective actions:\n${w.correctiveActions || "(not written yet)"}`);
    lines.push(
      w.correctiveActionsAttested
        ? `(Confirmed by the seller as done, ${formatDate(w.correctiveActionsAttested.at)})`
        : "(Not confirmed by the seller as done)",
    );
    lines.push(`\nPreventive measures:\n${w.preventiveMeasures || "(not written yet)"}`);
  }
  lines.push("");

  // G, 24 Sep 2026. Stated by the seller, and labelled as such: a specialist reading the export
  // needs to know these came from the seller, not from a document or from Amazon.
  const facts = w.caseFacts;
  if (facts && (facts.businessName || facts.businessAddress || facts.suppliers?.length)) {
    lines.push("== Business details, as the seller stated them ==");
    if (facts.businessName) lines.push(`Registered business name: ${facts.businessName}`);
    if (facts.businessAddress) lines.push(`Registered business address: ${facts.businessAddress}`);
    if (facts.suppliers?.length) lines.push(`Suppliers: ${facts.suppliers.join("; ")}`);
    lines.push("");
  }

  lines.push(
    `== Evidence plan (${w.requirements.length} record${w.requirements.length === 1 ? "" : "s"}) ==`,
  );
  if (w.requirements.length === 0) lines.push("(none added yet)");
  for (const group of REQUIREMENT_GROUPS) {
    const items = w.requirements.filter(group.match);
    if (items.length === 0) continue;
    lines.push(`${group.heading}:`);
    for (const r of items) lines.push(...requirementLines(r, group.reason));
  }
  lines.push(...documentCheckLines(w));
  lines.push("");

  lines.push(`== Submissions (${w.submissions.length}) ==`);
  if (w.submissions.length === 0) lines.push("(no submission recorded)");
  w.submissions.forEach((s, i) => {
    const when = s.source === "prior" ? "sent before using AppealDeck" : formatDate(s.at);
    lines.push(`--- Attempt ${i + 1} · ${when} · revision ${s.revision} ---`);
    if (s.preparedText)
      lines.push("(The seller changed this from the prepared response before sending.)");
    lines.push(s.text);
    if (s.receipt) lines.push(`Reference: ${s.receipt}`);
    if (s.unresolved?.length) {
      lines.push("Still open when it was sent:");
      for (const item of s.unresolved) lines.push(`  - ${item}`);
    }
    if (s.preparedText) lines.push(`Prepared response, for comparison:\n${s.preparedText}`);
    for (const a of s.attachments) {
      lines.push(`Attachment: ${a.filename} · page ${a.page} · content hash ${a.contentHash}`);
    }
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

  if (w.previousRequests.length > 0) {
    lines.push(`== Earlier versions of the request (${w.previousRequests.length}) ==`);
    for (const p of w.previousRequests) {
      lines.push(`--- Request ${p.revision} · ${PROTOCOL_LABELS[p.protocol]} ---`);
      lines.push(p.notice || "(no notice text saved)");
      if (p.formInstructions) lines.push(`Response-page instructions:\n${p.formInstructions}`);
      for (const r of p.requirements) lines.push(`- ${r.label} [${STATUS_LABELS[r.status]}]`);
      lines.push("");
    }
  }

  lines.push("== Outcome ==");
  if (log === undefined) {
    lines.push("(not included: the case's outcome record could not be read)");
  } else if (log?.resolution) {
    lines.push(
      `${OUTCOME_LABELS[log.resolution.status]} — recorded by the seller on ${formatDate(log.resolution.at)}, not independently verified`,
    );
  } else {
    lines.push("(no outcome recorded)");
  }
  if (log?.reminderAt && !log.resolution) {
    lines.push(`Follow-up date set by the seller: ${formatDate(log.reminderAt)}`);
  }
  if (log?.waitingOn) {
    lines.push(
      `Waiting on: ${log.waitingOn.party}, since ${formatDate(log.waitingOn.since)}${log.waitingOn.followUpAt ? `, chase on ${formatDate(log.waitingOn.followUpAt)}` : ""}`,
    );
  }
  lines.push("");

  lines.push("== Unresolved items ==");
  lines.push(gaps.length ? gaps.join("\n") : "(none)");
  lines.push("");

  if (w.history.length > 0) {
    lines.push(`== Case history (${w.history.length}) ==`);
    for (const h of w.history) lines.push(`${formatDate(h.at)} · ${h.message}`);
    lines.push("");
  }

  lines.push("This export is case notes for your own records — it is not a submitted response.");
  return lines.join("\n");
}

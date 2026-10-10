import type { CaseFile } from "@/core/caseFile";
import type { Requirement, Workspace } from "@/core/workspace";
import {
  PROTOCOL_LABELS,
  attemptDateRecorded,
  workspaceGaps,
  requirementEvidenceKind,
  questionnaireQuestions,
  answerFor,
} from "@/core/workspace";
import { alternativesFor } from "@/core/requirementGuidance";
import { formatDay } from "@/core/noticeDate";
import { coverageSentence, invoiceCoverage } from "@/core/invoiceCoverage";
import type { SerializedDeadline } from "@/core/deadlinesModel";
import type { CaseLog } from "./caseStore";
import { REQUIREMENT_GROUPS } from "./evidencePack";
import { formatDate } from "./format";
import { APP } from "@/content/app";
import {
  checkContextKey,
  FINDING_LABELS,
  savedCheckFor,
  summarizeCheck,
} from "@/core/documentCheck";
import { checkCaseDataForWorkspace } from "./documentChecks/context";
import { deviceReadingNotes } from "./documentChecks/deviceNotes";
import { migrateAnswerDrafts } from "./workspaceDraft";

const STATUS_LABELS: Record<Requirement["status"], string> = {
  needed: "still needed",
  waiting: "waiting on someone else",
  reviewed: "reviewed and linked",
  cannot_obtain: "cannot be obtained",
};

const POSITION_LABELS: Record<Workspace["position"], string> = {
  unsure: "not stated",
  accept: "accepts the finding",
  dispute: "disagrees with the finding",
};

/**
 * What a tab was about to save when another window had changed the case, so the seller can keep it
 * (6 Oct 2026). A refused save leaves the typed words in the form, but a reload to see the other
 * window's version throws them away; this is the text to put somewhere safe first.
 */
export function unsavedText(
  next: Pick<
    Workspace,
    "explanation" | "correctiveActions" | "preventiveMeasures" | "answers" | "draft"
  >,
  pending: Iterable<[string, string | undefined]> = [],
): string {
  const parts: string[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value && value.trim()) parts.push(`${label}:\n${value.trim()}`);
  };
  add("What went wrong", next.explanation);
  add("What you have fixed", next.correctiveActions);
  add("How you will stop it happening again", next.preventiveMeasures);
  for (const a of next.answers ?? []) add(`Answer to: ${a.question}`, a.answer);
  const seen = new Set<string>();
  for (const [key, value] of pending) {
    seen.add(key);
    add(key, value);
  }
  for (const [key, value] of Object.entries(next.draft ?? {})) if (!seen.has(key)) add(key, value);
  return parts.join("\n\n");
}

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
    const saved = savedCheckFor(
      w.documentChecks,
      r.recordId,
      r.contentHash,
      requirementEvidenceKind(r),
    );
    return saved ? [{ r, saved }] : [];
  });
  if (checked.length === 0) return ["Document checks: none run on the files linked here."];
  const lines = ["Document checks (what could be read; never a judgment of the document):"];
  for (const { r, saved } of checked) {
    const stale =
      saved.contextKey !== keyNow ? " — compared with case details that have since changed" : "";
    lines.push(`- ${r.filename ?? r.label} · checked ${formatDate(saved.at)}${stale}`);
    if (saved.outcome.kind === "fields") {
      // A reading made by label and pattern matching on the device is not the AI reading, and a
      // specialist reading this cannot tell them apart by the findings alone (30 Sep 2026 review).
      const device = deviceReadingNotes(saved.outcome.result);
      if (device) {
        lines.push(`  ${device.title}.`);
        if (device.picture) lines.push(`  ${device.picture}`);
        lines.push(`  ${device.where}`);
      }
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
    `Case ${file.id} · ${file.kind === "UNKNOWN" ? "type not identified" : APP.violationKinds[file.kind]}${file.kindSetBy === "seller" ? " (chosen by the seller)" : ""} · ${PROTOCOL_LABELS[w.protocol]}`,
  );
  // "another store" is a choice the seller made, not an unconfirmed one (6 Oct 2026).
  lines.push(`Marketplace: ${w.marketplace === "US" ? "Amazon US" : "another Amazon store"}`);
  lines.push(`Position: ${POSITION_LABELS[w.position]}`);
  lines.push(`Current request: revision ${w.revision}`);
  if (w.d6Latch)
    lines.push(
      `Held for qualified help: the notice carries an allegation we do not prepare responses to. Quoted: "${w.d6Latch.quote}"`,
    );
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
      lines.push(`- ${APP.violationKinds[issue.kind] ?? issue.kind}: ${issue.sourceQuote}`);
    }
    lines.push("");
  }

  lines.push("== Seller's response facts ==");
  const questions = questionnaireQuestions(w);
  for (const question of questions) {
    lines.push(`Question: ${question}`);
    lines.push(`Answer: ${answerFor(w, question) || "(not answered yet)"}`);
  }
  for (const answer of w.answers ?? []) {
    if (questions.includes(answer.question)) continue;
    lines.push(`Earlier question: ${answer.question}`);
    lines.push(`Answer: ${answer.answer || "(not answered yet)"}`);
  }
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

  const drafts = Object.entries(migrateAnswerDrafts(w) ?? {});
  if (drafts.length) {
    const labels: Record<string, string> = {
      "request.notice": "Amazon notice",
      "request.formInstructions": "Response-page instructions",
      "response.explanation": "Explanation",
      "response.correctiveActions": "Corrective actions",
      "response.preventiveMeasures": "Preventive measures",
      "history.replyText": "Reply not yet added to history",
      ...Object.fromEntries(
        w.requirements.map((r) => [`evidence.${r.id}.note`, `Evidence note: ${r.label}`]),
      ),
    };
    lines.push("== Unconfirmed field drafts — not confirmed response facts ==");
    for (const [key, value] of drafts) {
      const label = key.startsWith("response.answer.question:")
        ? `Answer to: ${key.slice("response.answer.question:".length)}`
        : (labels[key] ?? "Other unfinished field");
      lines.push(`${label}:\n${value || "(field cleared in draft)"}`);
    }
    lines.push("");
  }

  // G, 24 Sep 2026. Stated by the seller, and labelled as such: a specialist reading the export
  // needs to know these came from the seller, not from a document or from Amazon.
  const facts = w.caseFacts;
  if (
    facts &&
    (facts.businessName || facts.businessAddress || facts.suppliers?.length || facts.unitsSold)
  ) {
    lines.push("== Business details, as the seller stated them ==");
    if (facts.businessName) lines.push(`Registered business name: ${facts.businessName}`);
    if (facts.businessAddress) lines.push(`Registered business address: ${facts.businessAddress}`);
    if (facts.suppliers?.length) lines.push(`Suppliers: ${facts.suppliers.join("; ")}`);
    if (facts.unitsSold)
      lines.push(
        `Units sold of the products in the notice, over the 365 days before it: ${facts.unitsSold}`,
      );
    const coverage = invoiceCoverage(w.documentChecks, facts.unitsSold);
    if (coverage) lines.push(`Invoices against units sold: ${coverageSentence(coverage)}`);
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
  if (w.dismissed?.length) {
    // A record the seller took off the list is part of the case's story: a specialist asks why.
    lines.push(`== Records the seller removed (${w.dismissed.length}) ==`);
    for (const d of w.dismissed)
      lines.push(`- ${d.label} · removed ${formatDate(d.at)}: ${d.reason || "(no reason given)"}`);
  }
  lines.push(...documentCheckLines(w));
  lines.push("");

  lines.push(`== Submissions (${w.submissions.length}) ==`);
  if (w.submissions.length === 0) lines.push("(no submission recorded)");
  w.submissions.forEach((s, i) => {
    const when =
      s.source === "prior"
        ? "sent before using AppealDeck"
        : attemptDateRecorded(s.at)
          ? formatDate(s.at)
          : "date not recorded";
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
    // A picked day, stored as midnight UTC: `formatDate` would print the day before west of UTC.
    lines.push(`Follow-up date set by the seller: ${formatDay(log.reminderAt.slice(0, 10))}`);
  }
  // What a specialist needs to see first: whether anything was sent, and how Amazon last answered.
  if (log?.markedSentAt) {
    lines.push(
      `Response marked as sent by the seller on ${formatDate(log.markedSentAt)} (sent outside this tool, not verified)`,
    );
  }
  if (log && log.attemptCount > 0) lines.push(`Attempts recorded: ${log.attemptCount}`);
  if (log?.lastReply) {
    lines.push(
      `Amazon's last reply, as classified here: ${log.lastReply.category.replaceAll("_", " ")} (${formatDate(log.lastReply.at)})`,
    );
  }
  if (log?.waitingOn) {
    lines.push(
      `Waiting on: ${log.waitingOn.party}, since ${formatDate(log.waitingOn.since)}${log.waitingOn.followUpAt ? `, chase on ${formatDay(log.waitingOn.followUpAt.slice(0, 10))}` : ""}`,
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

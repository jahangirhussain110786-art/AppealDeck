import type { CaseFile } from "@/core/caseFile";
import { deadlinesForDisplay } from "@/core/deadlinesModel";
import { formatDay } from "@/core";
import { workspaceCanCompose } from "@/core/workspace";
import { analyzeReply } from "@/core/responseAnalyzer";
import { STORES } from "@/content/stores";
import {
  listCases,
  loadCaseFile,
  loadCaseLog,
  type CaseIndexEntry,
  type CaseLog,
} from "@/lib/caseStore";
import type { Vault } from "@/core/vault/vault";
import { daysUntilDay } from "@/lib/format";
import { APP } from "@/content/app";

/**
 * One case as the dashboard lists it (v5, 26 Sep 2026): who needs to act, the next thing to do,
 * how far the checklist has got, and the date that matters. Every line is read from the seller's
 * own case. A date appears only when the notice or the seller supplied it; a window with no start
 * date is described, never counted down.
 */
export interface CaseSummary {
  id: string;
  title: string;
  current: boolean;
  archived: boolean;
  status: "act" | "waiting" | "closed";
  /** Set when the case is waiting on Amazon's reply rather than on a record from someone else. */
  waitingAmazon?: boolean;
  next: string;
  done: number;
  total: number;
  due?: {
    label: string;
    /** Whole days from today to the stated day. Absent when the notice gives no date. */
    days?: number;
    day?: string;
  };
}

const S = APP.dashboard.cases;

export function caseTitle(entry: Pick<CaseIndexEntry, "id" | "kind">): string {
  // The id suffix keeps same-kind, same-day cases distinguishable from each other in the list.
  return `${APP.violationKinds[entry.kind] ?? entry.kind} · #${entry.id.slice(0, 6)}`;
}

export function summarizeCase(
  entry: CaseIndexEntry,
  file: CaseFile | null,
  now: Date,
  activeId: string | null,
  /** The case's own log, when the caller has it: the seller's recorded outcome lives there. */
  log?: CaseLog | null,
): CaseSummary {
  const base = {
    id: entry.id,
    title: caseTitle(entry),
    current: entry.id === activeId,
    archived: Boolean(entry.archived),
  };
  const w = file?.workspace;
  const done = w ? w.requirements.filter((r) => r.status === "reviewed").length : 0;
  const total = w ? w.requirements.length : 0;
  const shown = file?.deadlines?.length ? deadlinesForDisplay(file.deadlines) : [];
  const dated = shown.find((d) => d.dueOn && !d.isIndefinite);
  const due = dated?.dueOn
    ? { label: dated.label, day: dated.dueOn, days: daysUntilDay(dated.dueOn, now) }
    : shown[0]
      ? {
          label: shown[0].startsOnReceipt ? `${shown[0].label}, ${S.fromReceipt}` : shown[0].label,
        }
      : undefined;

  if (entry.archived) return { ...base, status: "closed", next: S.closed, done, total, due };
  /*
    A recorded outcome ends the story. Until 6 Oct 2026 the summary ignored `resolution`, so a case
    the seller had marked reinstated kept saying "waiting on Amazon" and counting down to a date in
    the notice. The date is dropped too: nothing is due on a settled case.
  */
  if (log?.resolution)
    return {
      ...base,
      status: "closed",
      next: STORES.outcomeLine[log.resolution.status],
      done,
      total,
    };
  if (!w) return { ...base, status: "act", next: S.openToContinue, done, total, due };

  if (w.replies.some((r) => !r.applied)) {
    const unread = w.replies.filter((r) => !r.applied).at(-1)!;
    return {
      ...base,
      status: "act",
      next: analyzeReply(unread.text).category === "reinstated" ? STORES.recordOutcome : S.replied,
      done,
      total,
      due,
    };
  }
  if (file.state === "SUBMITTED") {
    const last = [...w.submissions].reverse().find((s) => s.source !== "prior");
    return {
      ...base,
      status: "waiting",
      waitingAmazon: true,
      next: last ? S.sent.replace("{date}", formatDay(last.at.slice(0, 10))) : S.sentUndated,
      done,
      total,
      due,
    };
  }
  if (!w.confirmed) return { ...base, status: "act", next: S.confirm, done, total, due };
  /*
    A case that cannot be answered here has nothing to review or send, so "a final review before you
    send" and "review Supplier invoice" were instructions for a step that does not exist. Verification
    keeps its record list (the records are real work) but never reaches "a final review".
  */
  if (w.protocol === "specialist" || w.protocol === "dispute" || w.protocol === "information")
    return {
      ...base,
      status: "act",
      next: STORES.nextStep[w.protocol],
      done,
      total,
      due,
    };
  const pending = w.requirements.find((r) => r.status !== "reviewed");
  if (pending?.status === "waiting")
    return {
      ...base,
      status: "waiting",
      next: S.waitingFor.replace("{label}", pending.label),
      done,
      total,
      due,
    };
  if (pending)
    return {
      ...base,
      status: "act",
      next: S.review.replace("{label}", pending.label),
      done,
      total,
      due,
    };
  return {
    ...base,
    status: "act",
    next: workspaceCanCompose(w)
      ? S.write
      : w.protocol === "verification"
        ? STORES.nextStep.verification
        : w.protocol === "clarification"
          ? STORES.nextStep.clarification
          : S.finalReview,
    done,
    total,
    due,
  };
}

/** Every case on this device, summarised. A case that cannot be read is listed by name only. */
export async function loadCaseSummaries(
  vault: Vault,
  activeId: string | null,
  now = new Date(),
): Promise<CaseSummary[]> {
  const index = await listCases(vault);
  return Promise.all(
    index.map(async (entry) =>
      summarizeCase(
        entry,
        await loadCaseFile(vault, entry.id).catch(() => null),
        now,
        activeId,
        // The recorded outcome is in the log. A log that cannot be read leaves the row as it was.
        await loadCaseLog(vault, entry.id).catch(() => null),
      ),
    ),
  );
}

/** The dashboard's one sentence: how many cases need the seller, and by when. */
export function dashboardHeadline(summaries: CaseSummary[]): { lead: string; accent: string } {
  const open = summaries.filter((s) => !s.archived);
  if (summaries.length === 0) return { lead: S.headline.none, accent: S.headline.noneAccent };
  if (open.length === 0) return { lead: S.headline.allClosed, accent: "" };
  const act = open.filter((s) => s.status === "act");
  if (act.length === 0) return { lead: S.headline.nothing, accent: S.headline.today };
  const who =
    act.length === 1 ? S.headline.one : S.headline.many.replace("{n}", String(act.length));
  const soonest = act
    .map((s) => s.due)
    .filter((d): d is NonNullable<CaseSummary["due"]> => d?.days !== undefined)
    .sort((a, b) => a.days! - b.days!)[0];
  if (!soonest) return { lead: who, accent: S.headline.you };
  if (soonest.days! <= 0)
    return { lead: `${who} ${S.headline.youBefore}`, accent: S.headline.today };
  const date = new Date(`${soonest.day}T12:00:00Z`);
  const when =
    soonest.days! <= 6
      ? new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date)
      : formatDay(soonest.day!);
  return { lead: `${who} ${S.headline.youBefore} ${S.headline.before}`, accent: `${when}.` };
}

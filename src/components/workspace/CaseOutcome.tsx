"use client";
import { useState } from "react";
import { Archive, ClipboardCheck } from "lucide-react";
import { ReminderControl } from "@/components/ReminderControl";
import { OutcomeShareCard } from "@/components/OutcomeShareCard";
import { workspaceOutcomeRecord } from "@/lib/submissionRecord";
import { syncCaseReminder } from "@/lib/reminderSync";
import { toast } from "sonner";
import { APP } from "@/content/app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hadSubmission, type CaseLog } from "@/lib/caseStore";
import type { CaseFile } from "@/core/caseFile";
import { stateForOutcome } from "@/core/caseState";
import { formatDate } from "@/lib/format";

const RESOLUTION_LABEL: Record<NonNullable<CaseLog["resolution"]>["status"], string> = {
  reinstated: "Reinstated or approved",
  rejected: "Rejected or denied",
  withdrawn: "Withdrawn",
};

const selectStyle =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto";

type ResolutionStatus = NonNullable<CaseLog["resolution"]>["status"];

/**
 * The log to write when the seller picks an outcome, or `null` when nothing would change.
 *
 * Pulled out of the `onChange` handler on 23 Sep 2026 so the rule is a tested function rather
 * than inline spread arithmetic, because inline spread arithmetic is where it broke: choosing
 * "Still waiting on Amazon" built a log without `resolution` and then merged it back over the
 * original with `{ ...current, ...rest }`. `rest` merely lacked the key, so the spread changed
 * nothing and the recorded outcome stayed. A seller who recorded "rejected" by mistake could never
 * take it back.
 *
 * Clearing is done by leaving the key out of a log built from scratch, never by merging.
 */
export function logWithOutcome(
  current: CaseLog,
  choice: ResolutionStatus | "pending",
  at: string,
  /** The case's workspace, so a recorded submission counts the same here as in the file state. */
  workspace?: { submissions: readonly { source?: string }[] },
): CaseLog | null {
  // The one shared definition (caseStore.hadSubmission), which also counts a response the seller
  // marked as sent outside the product. This used to be computed here without it, so recording an
  // outcome and taking it back on such a case lost "waiting on Amazon".
  const sent = hadSubmission(current, workspace);
  if (choice === "pending") {
    if (!current.resolution) return null;
    const { resolution: _cleared, ...rest } = current;
    // The outcome moved the case to a terminal state; taking it back must move it out again.
    return { ...rest, state: stateForOutcome("pending", rest.state, sent) };
  }
  if (current.resolution?.status === choice) return null;
  return {
    ...current,
    // The state follows the outcome, so the clock, reminders and the dashboard stop treating a
    // settled case as one still waiting on Amazon.
    state: stateForOutcome(choice, current.state, sent),
    resolution: { status: choice, at },
  };
}

/**
 * The log to save when an outcome is recorded, and whether the server's email reminder could not be
 * cancelled. The cancel is attempted whenever an email reminder was ever switched on — not only for a
 * signed-in session — and the switch is recorded as off only once the server agreed; if it did not,
 * the log keeps it on (the only memory that a row may still exist). The outcome itself is always
 * saved, and nothing here blocks on the cancel failing.
 */
export async function logAfterOutcome(
  current: Pick<CaseLog, "emailReminder">,
  next: CaseLog,
  cancel: () => Promise<boolean>,
): Promise<{ log: CaseLog; cancelFailed: boolean }> {
  const settles = Boolean(next.resolution) && current.emailReminder === true;
  if (!settles) return { log: next, cancelFailed: false };
  const stopped = await cancel();
  return stopped
    ? { log: { ...next, emailReminder: false }, cancelFailed: false }
    : { log: next, cancelFailed: true };
}

/**
 * A workspace case has no server-side record of what Amazon ultimately decided — the seller is
 * the only source. This gives that an explicit, honestly-labelled place to live (never implied to
 * be independently verified), plus a real ending: a follow-up reminder while waiting, and an
 * archive action once the case is settled.
 */
export function CaseOutcome({
  file,
  log,
  busy,
  signedIn,
  onSaveLog,
  onArchive,
}: {
  file: CaseFile;
  log: CaseLog | null;
  busy: boolean;
  signedIn: boolean;
  onSaveLog: (log: CaseLog) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);
  const w = file.workspace!;
  const awaitingReply = file.state === "SUBMITTED" && !w.replies.some((r) => !r.applied);
  const current: CaseLog = log ?? { state: file.state, attemptCount: w.submissions.length };
  const resolution = current.resolution;
  const shareRecord = workspaceOutcomeRecord(file, log);

  /** Writes the log exactly as given. Clearing a field means passing a log without it. */
  const write = async (next: CaseLog) => {
    setSaving(true);
    try {
      await onSaveLog(next);
    } finally {
      setSaving(false);
    }
  };
  /*
    A settled case stops emailing. The follow-up date is hidden once an outcome is recorded, so an
    email left scheduled would arrive about a case the seller has already closed, with no control on
    the page to stop it. The switch is turned off in the log as well as on the server, so reverting
    to "still waiting" shows it off rather than claiming an email the server no longer has.
  */
  const recordOutcome = async (next: CaseLog) => {
    // 6 Oct 2026: the server's row was cancelled only `if (signedIn)`, so an outcome recorded after
    // the sign-in had lapsed left an email scheduled about a case the seller had closed.
    const { log: toSave, cancelFailed } = await logAfterOutcome(current, next, () =>
      syncCaseReminder({ caseRef: file.id, kind: file.kind, enabled: false }),
    );
    await write(toSave);
    if (cancelFailed) toast.error(APP.dashboard.clock.emailFailed);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-5 shrink-0 text-primary" aria-hidden />
          <CardTitle id="case-outcome-title" className="text-base">
            What happened with this case?
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {resolution ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={resolution.status === "reinstated" ? "success" : "secondary"}>
              {RESOLUTION_LABEL[resolution.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Recorded by you on {formatDate(resolution.at)} · not independently verified
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nothing recorded yet. This is your own record — AppealDeck does not check with Amazon.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {/* Named by the card heading: until 24 Sep 2026 this was an unlabelled select. */}
          <select
            aria-labelledby="case-outcome-title"
            className={selectStyle}
            disabled={busy || saving}
            value={resolution?.status ?? "pending"}
            onChange={(e) => {
              const next = logWithOutcome(
                current,
                e.target.value as ResolutionStatus | "pending",
                new Date().toISOString(),
                w,
              );
              if (next) void recordOutcome(next);
            }}
          >
            <option value="pending">Still waiting on Amazon</option>
            <option value="reinstated">Reinstated or approved</option>
            <option value="rejected">Rejected or denied</option>
            <option value="withdrawn">I withdrew this case</option>
          </select>
          {resolution && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy || saving}
              onClick={() => void onArchive()}
            >
              <Archive className="mr-2 h-4 w-4" aria-hidden />
              Archive this case
            </Button>
          )}
        </div>
        {/*
          EF-5's opt-in, offered where a workspace case records its outcome. Signed-in only: the
          endpoint needs an account, and asking a guest would end in a refusal. Answered once —
          declining is a real choice and the card never comes back.
        */}
        {signedIn && shareRecord && !current.outcomePromptResolved && (
          <OutcomeShareCard
            record={shareRecord}
            onResolved={async () => {
              await write({ ...current, outcomePromptResolved: true });
            }}
          />
        )}
        {!resolution && awaitingReply && (
          <ReminderControl
            caseId={file.id}
            kind={file.kind}
            log={current}
            signedIn={signedIn}
            disabled={busy || saving}
            onSaveLog={onSaveLog}
          />
        )}
      </CardContent>
    </Card>
  );
}

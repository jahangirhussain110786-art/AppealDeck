"use client";
import { useState } from "react";
import { Archive, CalendarClock, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CaseLog } from "@/lib/caseStore";
import type { CaseFile } from "@/core/caseFile";
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
): CaseLog | null {
  if (choice === "pending") {
    if (!current.resolution) return null;
    const { resolution: _cleared, ...rest } = current;
    return rest;
  }
  if (current.resolution?.status === choice) return null;
  return { ...current, resolution: { status: choice, at } };
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
  onSaveLog,
  onArchive,
}: {
  file: CaseFile;
  log: CaseLog | null;
  busy: boolean;
  onSaveLog: (log: CaseLog) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);
  const w = file.workspace!;
  const awaitingReply = file.state === "SUBMITTED" && !w.replies.some((r) => !r.applied);
  const current: CaseLog = log ?? { state: file.state, attemptCount: w.submissions.length };
  const resolution = current.resolution;

  /** Writes the log exactly as given. Clearing a field means passing a log without it. */
  const write = async (next: CaseLog) => {
    setSaving(true);
    try {
      await onSaveLog(next);
    } finally {
      setSaving(false);
    }
  };
  const save = (patch: Partial<CaseLog>) => write({ ...current, ...patch });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-5 shrink-0 text-primary" aria-hidden />
          <CardTitle className="text-base">What happened with this case?</CardTitle>
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
          <select
            className={selectStyle}
            disabled={busy || saving}
            value={resolution?.status ?? "pending"}
            onChange={(e) => {
              const next = logWithOutcome(
                current,
                e.target.value as ResolutionStatus | "pending",
                new Date().toISOString(),
              );
              if (next) void write(next);
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
        {!resolution && awaitingReply && (
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              Your follow-up reminder date
            </span>
            <input
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="date"
              disabled={busy || saving}
              value={current.reminderAt?.slice(0, 10) ?? ""}
              onChange={(e) => {
                const reminderAt = e.target.value ? `${e.target.value}T00:00:00Z` : undefined;
                void save({ reminderAt });
              }}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              A date to remind yourself to check back — AppealDeck does not send this reminder.
            </span>
          </label>
        )}
      </CardContent>
    </Card>
  );
}

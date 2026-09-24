"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { APP } from "@/content/app";
import type { CaseLog } from "@/lib/caseStore";
import type { ViolationKind } from "@/core/violationKinds";
import {
  fetchReminderDelivery,
  reminderDeliveryState,
  setEmailReminder,
  setReminderDate,
  syncCaseReminder,
  type ReminderDelivery,
  type ReminderDeliveryState,
  type ReminderResult,
} from "@/lib/reminderSync";
import { formatDay } from "@/core/noticeDate";

/**
 * The seller's follow-up date and the per-case email switch (AA-40), in one place.
 *
 * Extracted 23 Sep 2026. The email switch lived only in the dashboard's classic-case branch, and
 * every case created since the workspace replaced the interview renders a different card
 * (`CaseOutcome`) — which had its own date field, never told the server about it, and said
 * "AppealDeck does not send this reminder". So no seller could turn email reminders on at all, and
 * one who had turned them on earlier and then changed the date there would be emailed on the old
 * one. There is now one control, and both cards use it.
 *
 * The order of each step — so the screen never claims what the server does not do — lives in
 * `setReminderDate` and `setEmailReminder` (lib/reminderSync.ts), where it is tested.
 */
export function ReminderControl({
  caseId,
  kind,
  log,
  signedIn,
  disabled,
  onSaveLog,
}: {
  caseId: string;
  kind: ViolationKind;
  log: CaseLog;
  signedIn: boolean;
  disabled?: boolean;
  onSaveLog: (log: CaseLog) => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const [delivery, setDelivery] = useState<ReminderDelivery | null | undefined>(undefined);
  const copy = APP.dashboard.clock;
  const emailOn = log.emailReminder === true;

  // Read back what the server did, whenever the switch or the date changes — including after this
  // control changed them, so the line never describes the reminder as it was before the click.
  useEffect(() => {
    if (!signedIn || !emailOn || !log.reminderAt) {
      setDelivery(undefined);
      return;
    }
    let live = true;
    void fetchReminderDelivery(caseId).then((d) => {
      if (live) setDelivery(d);
    });
    return () => {
      live = false;
    };
  }, [signedIn, emailOn, log.reminderAt, caseId]);

  const deliveryLine = describeDelivery(
    reminderDeliveryState(delivery, { emailOn, reminderAt: log.reminderAt }),
    copy.delivery,
  );

  const deps = { saveLog: onSaveLog, sync: syncCaseReminder };

  const run = async (step: () => Promise<ReminderResult>) => {
    setPending(true);
    try {
      // "not-saved" has already been reported by `onSaveLog`.
      if ((await step()) === "email-not-updated") toast.error(copy.emailFailed);
    } finally {
      setPending(false);
    }
  };

  const changeDate = (reminderAt: string | undefined) =>
    run(() => setReminderDate(log, reminderAt, { caseRef: caseId, kind, signedIn }, deps));

  const toggleEmail = () =>
    run(() => setEmailReminder(log, !emailOn, { caseRef: caseId, kind }, deps));

  const busy = disabled || pending;

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 flex items-center gap-2 font-medium text-foreground">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          {copy.reminderLabel}
        </span>
        <input
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="date"
          disabled={busy}
          value={log.reminderAt?.slice(0, 10) ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            void changeDate(value ? `${value}T00:00:00Z` : undefined);
          }}
        />
        <span className="mt-1 block text-xs text-muted-foreground">{copy.reminderHint}</span>
      </label>
      {/* AA-40: opt-in, per case, and the copy states exactly what leaves the device. */}
      <div className="rounded-lg border border-border bg-surface-2/40 p-4">
        <p className="text-sm font-medium text-foreground">{copy.emailTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.emailBody}</p>
        {signedIn ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant={emailOn ? "outline" : "default"}
              disabled={busy || (!emailOn && !log.reminderAt)}
              onClick={() => void toggleEmail()}
            >
              {emailOn ? copy.emailDisable : copy.emailEnable}
            </Button>
            <span className="text-xs text-muted-foreground">
              {/* "On" with no date would promise an email that nothing will send. */}
              {!log.reminderAt ? copy.emailNeedsDate : emailOn ? copy.emailOn : copy.emailOff}
            </span>
            {deliveryLine && (
              <p className="w-full text-xs text-muted-foreground" role="status">
                {deliveryLine}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{copy.emailSignedOut}</p>
        )}
      </div>
    </div>
  );
}

function describeDelivery(
  status: ReminderDeliveryState | null,
  copy: (typeof APP)["dashboard"]["clock"]["delivery"],
): string | null {
  if (!status) return null;
  switch (status.state) {
    case "scheduled":
      return copy.scheduled.replace("{date}", formatDay(status.day));
    case "sent":
      return copy.sent.replace("{date}", formatDay(status.day));
    default:
      return copy[status.state];
  }
}

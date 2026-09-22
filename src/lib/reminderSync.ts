/**
 * AA-40 (AM-26): keeps the server's reminder row in step with the local case log.
 *
 * Failure here is deliberately soft. The reminder date itself lives in the vault and the dashboard
 * shows it regardless; the server row only controls whether an email is also sent. So a network
 * failure returns `false` and the caller tells the seller email could not be changed — it never
 * blocks saving the date, and never implies the case is at risk.
 */

import type { ViolationKind } from "@/core/violationKinds";

export interface ReminderSyncInput {
  caseRef: string;
  kind: ViolationKind;
  /** ISO date, or undefined when there is no reminder to send. */
  dueAt?: string;
  /** The seller's per-case opt-in. */
  enabled: boolean;
}

/**
 * Returns true when the server now reflects the seller's intent. Clears the row whenever email is
 * off or the date has been removed, so turning the toggle off actually stops the email rather than
 * merely hiding the control.
 */
export async function syncCaseReminder(input: ReminderSyncInput): Promise<boolean> {
  const shouldSend = input.enabled && Boolean(input.dueAt);
  try {
    const res = shouldSend
      ? await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseRef: input.caseRef,
            kind: input.kind,
            dueAt: input.dueAt,
          }),
        })
      : await fetch("/api/reminders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseRef: input.caseRef }),
        });
    return res.ok;
  } catch {
    return false;
  }
}

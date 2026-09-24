/**
 * AA-40 (AM-26): keeps the server's reminder row in step with the local case log.
 *
 * Failure here is deliberately soft. The reminder date itself lives in the vault and the dashboard
 * shows it regardless; the server row only controls whether an email is also sent. So a network
 * failure returns `false` and the caller tells the seller email could not be changed — it never
 * blocks saving the date, and never implies the case is at risk.
 */

import type { ViolationKind } from "@/core/violationKinds";
import type { CaseLog } from "@/lib/caseStore";

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

export interface ReminderDeps {
  /** Writes the case log to the vault. Resolves false when it failed, having told the seller. */
  saveLog: (log: CaseLog) => Promise<boolean>;
  sync: (input: ReminderSyncInput) => Promise<boolean>;
}

export type ReminderResult = "saved" | "not-saved" | "email-not-updated";

/**
 * The seller changed their follow-up date. The date is saved first — it is theirs, and it shows on
 * the dashboard whether or not email is on — then an email already switched on is moved to it.
 * `email-not-updated` means the date saved and the email is still on the old one, which the seller
 * must be told.
 */
export async function setReminderDate(
  log: CaseLog,
  reminderAt: string | undefined,
  target: { caseRef: string; kind: ViolationKind; signedIn: boolean },
  deps: ReminderDeps,
): Promise<ReminderResult> {
  // Cleared by building the log without the key, never by merging `undefined` over it.
  const { reminderAt: _previous, ...rest } = log;
  void _previous;
  if (!(await deps.saveLog(reminderAt ? { ...rest, reminderAt } : rest))) return "not-saved";
  if (log.emailReminder !== true || !target.signedIn) return "saved";
  const synced = await deps.sync({
    caseRef: target.caseRef,
    kind: target.kind,
    dueAt: reminderAt,
    enabled: true,
  });
  return synced ? "saved" : "email-not-updated";
}

/**
 * The seller turned email on or off. The server is asked first and the switch recorded only if it
 * agreed: a switch saved ahead of a failed request would read "Email reminders are on" with no email
 * coming. If the server agreed and the vault write then failed, the server is put back, so the
 * switch on screen stays the truth.
 */
export async function setEmailReminder(
  log: CaseLog,
  enabled: boolean,
  target: { caseRef: string; kind: ViolationKind },
  deps: ReminderDeps,
): Promise<ReminderResult> {
  const request = { caseRef: target.caseRef, kind: target.kind, dueAt: log.reminderAt };
  if (!(await deps.sync({ ...request, enabled }))) return "email-not-updated";
  if (await deps.saveLog({ ...log, emailReminder: enabled })) return "saved";
  await deps.sync({ ...request, enabled: log.emailReminder === true });
  return "not-saved";
}

/**
 * What the server has done with this case's reminder — the shape `GET /api/reminders` returns.
 * Declared here rather than imported from `caseReminders.ts`, which is server-only.
 */
export interface ReminderDelivery {
  dueAt: string;
  sentAt: string | null;
  attempts: number;
  gaveUp: boolean;
}

/**
 * Reads the server's record of this case's reminder. `undefined` when it could not be read, which
 * the caller shows as nothing at all: a network blip is not a delivery failure, and saying one
 * would alarm a seller about an email that may be fine.
 */
export async function fetchReminderDelivery(
  caseRef: string,
): Promise<ReminderDelivery | null | undefined> {
  try {
    const res = await fetch(`/api/reminders?caseRef=${encodeURIComponent(caseRef)}`);
    if (!res.ok) return undefined;
    const body = (await res.json()) as { reminder?: ReminderDelivery | null };
    return body.reminder ?? null;
  } catch {
    return undefined;
  }
}

export type ReminderDeliveryState =
  | { state: "scheduled"; day: string }
  | { state: "sent"; day: string }
  | { state: "retrying" }
  | { state: "failed" }
  | { state: "missing" };

/**
 * One plain line about whether the email actually went, from the server's record and the seller's
 * own switch. Added 24 Sep 2026 (ChatGPT audit item O): "Email reminders are on" said only that the
 * seller had asked, never whether anything was sent or had failed.
 *
 * Null when there is nothing honest to add — email off, no date, or the record unreadable.
 * `day` is a calendar day (YYYY-MM-DD): the due date is stored as that day at midnight UTC, and the
 * send time is shown on the seller's own calendar.
 */
export function reminderDeliveryState(
  delivery: ReminderDelivery | null | undefined,
  local: { emailOn: boolean; reminderAt?: string },
): ReminderDeliveryState | null {
  if (!local.emailOn || !local.reminderAt || delivery === undefined) return null;
  if (delivery === null) return { state: "missing" };
  if (delivery.sentAt) return { state: "sent", day: localDay(new Date(delivery.sentAt)) };
  if (delivery.gaveUp) return { state: "failed" };
  if (delivery.attempts > 0) return { state: "retrying" };
  return { state: "scheduled", day: delivery.dueAt.slice(0, 10) };
}

function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

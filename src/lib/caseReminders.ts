/**
 * AA-40 (AM-26): server-side reminder rows and their delivery.
 *
 * The case file is in the seller's encrypted browser vault, so the server cannot know a follow-up
 * date exists unless the client tells it. This module is that narrow channel: a due date and a
 * coarse violation kind, nothing else. See `supabase/migrations/0011_case_reminders.sql` for what
 * is deliberately absent, and `src/content/legal.ts` for the disclosure that ships with it.
 */

import { supabaseAdmin } from "./supabase/server";
import { sendCaseReminderEmail } from "./email";
import { APP } from "@/content/app";
import { RUN_BUDGET_MS, runBatch } from "./mailBatch";
import { SITE_URL } from "./urls";
import type { ViolationKind } from "@/core/violationKinds";

/** Stop retrying a row after this many failures, so one dead address is not chased forever. */
const MAX_ATTEMPTS = 3;
/** Most reminder emails one seller can receive in one cron run, however many cases are due. */
export const MAX_PER_USER_PER_RUN = 5;
/** Most unsent reminders one account may hold, so the table cannot be filled from one login. */
export const MAX_OPEN_REMINDERS_PER_USER = 50;
/** A claim older than this is treated as a crashed run and may be taken again. */
const CLAIM_LEASE_MS = 10 * 60 * 1000;

/** Thrown by `upsertCaseReminder` when the account already holds the maximum of open reminders. */
export class ReminderLimitError extends Error {
  readonly code = "reminder_limit";
  constructor() {
    super("Too many open reminders");
    this.name = "ReminderLimitError";
  }
}

export interface UpsertReminderInput {
  userId: string;
  /** Opaque case id from the seller's vault. */
  caseRef: string;
  kind: ViolationKind;
  dueAt: string;
}

/**
 * Creates or replaces this seller's reminder for one case. Re-setting a date clears `sent_at` and
 * the failure counter, because a seller who moves the date forward is asking to be told again.
 */
export async function upsertCaseReminder(input: UpsertReminderInput): Promise<void> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  // Re-setting this case's own date never counts against the cap; only a new case can hit it.
  const { count, error: countError } = await supabaseAdmin
    .from("case_reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .is("sent_at", null)
    .neq("case_ref", input.caseRef);
  if (countError) throw new Error("Could not save reminder");
  if ((count ?? 0) >= MAX_OPEN_REMINDERS_PER_USER) throw new ReminderLimitError();
  const { error } = await supabaseAdmin.from("case_reminders").upsert(
    {
      user_id: input.userId,
      case_ref: input.caseRef,
      kind: input.kind,
      due_at: input.dueAt,
      sent_at: null,
      attempts: 0,
      last_error: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,case_ref" },
  );
  if (error) throw new Error("Could not save reminder");
}

export async function deleteCaseReminder(userId: string, caseRef: string): Promise<void> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const { error } = await supabaseAdmin
    .from("case_reminders")
    .delete()
    .eq("user_id", userId)
    .eq("case_ref", caseRef);
  if (error) throw new Error("Could not clear reminder");
}

/**
 * What the server has done with one case's reminder. `gaveUp` is computed here so the client never
 * needs to know the retry limit — the limit is a server policy, and a copy of it would drift.
 */
export interface ReminderDelivery {
  dueAt: string;
  sentAt: string | null;
  attempts: number;
  gaveUp: boolean;
}

export async function getCaseReminder(
  userId: string,
  caseRef: string,
): Promise<ReminderDelivery | null> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const { data, error } = await supabaseAdmin
    .from("case_reminders")
    .select("due_at, sent_at, attempts")
    .eq("user_id", userId)
    .eq("case_ref", caseRef)
    .maybeSingle();
  if (error) throw new Error("Could not read reminder");
  if (!data) return null;
  const attempts = Number(data.attempts ?? 0);
  return {
    dueAt: data.due_at,
    sentAt: data.sent_at,
    attempts,
    gaveUp: !data.sent_at && attempts >= MAX_ATTEMPTS,
  };
}

/**
 * Sends every reminder whose date has arrived. Called by the cron route.
 *
 * Each row is marked sent before its own failure can affect the next one, and a failure increments
 * `attempts` rather than retrying immediately — one seller's bounced address must not stop every
 * other seller's reminder in the same run.
 *
 * 27 Oct 2026 audit, three changes:
 * - A row is written back only while it is still the row this run claimed (same due date, same
 *   claim). A seller who moves the date while the old email is in flight used to have the new
 *   reminder marked sent by the old send.
 * - Rows whose address nobody has confirmed are stamped as looked-at and sorted behind fresh rows, so
 *   200 of them can no longer fill every day's batch and starve the sellers behind them.
 * - The run has a time budget and sends five at a time; see `mailBatch.ts`.
 */
export async function deliverCaseReminders(
  now = new Date(),
  options: { budgetMs?: number } = {},
): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  /** Due rows this run did not get to; they go first next time. */
  unreached: number;
}> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const db = supabaseAdmin;
  const deadline = Date.now() + (options.budgetMs ?? RUN_BUDGET_MS);

  const claimStamp = now.toISOString();
  const staleBefore = new Date(now.getTime() - CLAIM_LEASE_MS).toISOString();
  const { data, error } = await db
    .from("case_reminders")
    .select("id, user_id, case_ref, kind, due_at, attempts")
    .is("sent_at", null)
    .lte("due_at", claimStamp)
    .lt("attempts", MAX_ATTEMPTS)
    .or(`claimed_at.is.null,claimed_at.lt.${staleBefore}`)
    // Never-looked-at rows first, then the ones looked at longest ago: a row that cannot be sent
    // today (an unconfirmed address) goes to the back instead of holding its place every day.
    .order("claimed_at", { ascending: true, nullsFirst: true })
    .order("due_at", { ascending: true })
    .limit(200);
  if (error) throw new Error("Reminder queue unavailable");

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const deferred: string[] = [];
  const perUser = new Map<string, number>();
  type Who = { to: string | null; confirmed: boolean; lookupFailed: boolean };
  const addresses = new Map<string, Promise<Who>>();
  const lookup = (userId: string): Promise<Who> => {
    let pending = addresses.get(userId);
    if (!pending) {
      pending = db.auth.admin.getUserById(userId).then(({ data: userData, error: userError }) => ({
        to: userData?.user?.email ?? null,
        confirmed: Boolean(userData?.user?.email_confirmed_at),
        lookupFailed: Boolean(userError),
      }));
      addresses.set(userId, pending);
    }
    return pending;
  };

  const handle = async (row: {
    id: string;
    user_id: string;
    kind: string;
    due_at: string;
    attempts: number;
  }) => {
    // Flood guard: a seller with many due cases gets a few emails per run, the rest next run. The
    // slot is taken before any await, because rows now run side by side.
    const used = perUser.get(row.user_id) ?? 0;
    if (used >= MAX_PER_USER_PER_RUN) {
      skipped++;
      return;
    }
    perUser.set(row.user_id, used + 1);
    const giveBackSlot = () => perUser.set(row.user_id, (perUser.get(row.user_id) ?? 1) - 1);

    let emailSent = false;
    try {
      // The address is read from auth at send time, never stored alongside the reminder — one
      // fewer copy of a seller's email, and it stays correct if they change it.
      const who = await lookup(row.user_id);
      if (who.lookupFailed || !who.to) {
        skipped++;
        giveBackSlot();
        await markFailed(row, claimStamp, "No address on file");
        return;
      }
      // An address nobody has confirmed may belong to someone else; never mail it. Not counted as a
      // failed attempt, so the reminder still goes once the seller confirms.
      if (!who.confirmed) {
        skipped++;
        giveBackSlot();
        deferred.push(row.id);
        return;
      }

      // Claim before sending: a conditional update only one of two overlapping runs can win. It also
      // names the due date it read, so a row moved since the select is not claimed for its old date.
      const { data: claimed, error: claimError } = await db
        .from("case_reminders")
        .update({ claimed_at: claimStamp })
        .eq("id", row.id)
        .eq("due_at", row.due_at)
        .is("sent_at", null)
        .or(`claimed_at.is.null,claimed_at.lt.${staleBefore}`)
        .select("id");
      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) {
        skipped++;
        giveBackSlot();
        return;
      }

      await sendCaseReminderEmail({
        to: who.to,
        kindLabel: labelForKind(row.kind),
        dueAt: row.due_at,
        dashboardUrl: `${SITE_URL}/dashboard`,
        // Keyed on the due date too, so moving the date and being reminded again is not
        // suppressed as a duplicate by the provider.
        idempotencyKey: `reminder/${row.id}/${row.due_at}`,
      });

      emailSent = true;
      // The email is out. Recording that is retried, and a failure to record it is never treated as
      // a failed delivery: that would clear the claim and mail the seller the same reminder again
      // at the next run, which falls outside the provider's duplicate window. Only this run's own
      // claim is written: if the seller moved the date meanwhile, the row is theirs again and the
      // new reminder is left pending.
      let updateError: unknown = null;
      for (let tryNo = 0; tryNo < 3; tryNo++) {
        const res = await db
          .from("case_reminders")
          .update({ sent_at: new Date().toISOString(), last_error: null, claimed_at: null })
          .eq("id", row.id)
          .eq("due_at", row.due_at)
          .eq("claimed_at", claimStamp);
        updateError = res.error;
        if (!updateError) break;
      }
      if (updateError) console.error("case reminder sent but not recorded", row.id);
      sent++;
    } catch {
      if (emailSent) {
        sent++;
        return;
      }
      failed++;
      await markFailed(row, claimStamp, "Delivery failed; retry pending");
    }
  };

  const { unreached } = await runBatch(data ?? [], handle, { deadline });

  // Stamp the unconfirmed rows so tomorrow's batch reaches the rows behind them first. Best effort:
  // if this write fails the only cost is today's ordering.
  if (deferred.length > 0) {
    await db
      .from("case_reminders")
      .update({ claimed_at: claimStamp })
      .in("id", deferred)
      .is("sent_at", null);
  }

  return { sent, failed, skipped, unreached };
}

/** A failure is recorded only against the row this run claimed, never against a moved one. */
async function markFailed(
  row: { id: string; due_at: string; attempts: number },
  claimStamp: string,
  message: string,
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("case_reminders")
    .update({ attempts: row.attempts + 1, last_error: message, claimed_at: null })
    .eq("id", row.id)
    .eq("due_at", row.due_at)
    // A row that failed before it could be claimed (no address) has no claim of this run to match.
    .or(`claimed_at.is.null,claimed_at.eq.${claimStamp}`);
}

/** Falls back to the raw kind rather than throwing, so an unknown value still produces an email. */
function labelForKind(kind: string): string {
  const labels: Record<string, string> = APP.violationKinds;
  return (labels[kind] ?? kind.replaceAll("_", " ")).toLowerCase();
}

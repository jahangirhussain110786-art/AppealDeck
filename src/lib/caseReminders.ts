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
import { SITE_URL } from "./urls";
import type { ViolationKind } from "@/core/violationKinds";

/** Stop retrying a row after this many failures, so one dead address is not chased forever. */
const MAX_ATTEMPTS = 3;

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
  const { error } = await supabaseAdmin.from("case_reminders").upsert(
    {
      user_id: input.userId,
      case_ref: input.caseRef,
      kind: input.kind,
      due_at: input.dueAt,
      sent_at: null,
      attempts: 0,
      last_error: null,
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
 */
export async function deliverCaseReminders(now = new Date()): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  if (!supabaseAdmin) throw new Error("Database unavailable");

  const { data, error } = await supabaseAdmin
    .from("case_reminders")
    .select("id, user_id, case_ref, kind, due_at, attempts")
    .is("sent_at", null)
    .lte("due_at", now.toISOString())
    .lt("attempts", MAX_ATTEMPTS)
    .limit(200);
  if (error) throw new Error("Reminder queue unavailable");

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    try {
      // The address is read from auth at send time, never stored alongside the reminder — one
      // fewer copy of a seller's email, and it stays correct if they change it.
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        row.user_id,
      );
      const to = userData?.user?.email;
      if (userError || !to) {
        skipped++;
        await markFailed(row.id, row.attempts, "No address on file");
        continue;
      }

      await sendCaseReminderEmail({
        to,
        kindLabel: labelForKind(row.kind),
        dueAt: row.due_at,
        dashboardUrl: `${SITE_URL}/dashboard`,
        // Keyed on the due date too, so moving the date and being reminded again is not
        // suppressed as a duplicate by the provider.
        idempotencyKey: `reminder/${row.id}/${row.due_at}`,
      });

      const { error: updateError } = await supabaseAdmin
        .from("case_reminders")
        .update({ sent_at: new Date().toISOString(), last_error: null })
        .eq("id", row.id);
      if (updateError) throw updateError;
      sent++;
    } catch {
      failed++;
      await markFailed(row.id, row.attempts, "Delivery failed; retry pending");
    }
  }

  return { sent, failed, skipped };
}

async function markFailed(id: string, attempts: number, message: string): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("case_reminders")
    .update({ attempts: attempts + 1, last_error: message })
    .eq("id", id);
}

/** Falls back to the raw kind rather than throwing, so an unknown value still produces an email. */
function labelForKind(kind: string): string {
  const labels: Record<string, string> = APP.violationKinds;
  return (labels[kind] ?? kind.replaceAll("_", " ")).toLowerCase();
}

/**
 * An opt-in email reminder for a visitor who has decoded a notice and has no account (23 Oct 2026).
 * The table and its reasons are in `supabase/migrations/0022_guest_reminders.sql`.
 *
 * The rules live here, behind a small `Store`, so they are tested without a database:
 * - double opt-in: nothing but one confirmation email goes to an address until its owner clicks;
 * - one reminder, three days before the date (or the next day when that has passed);
 * - at most three open reminders per address, and the confirmation is not re-sent within an hour;
 * - one link in every email stops every reminder to that address;
 * - a date that is today or past is never offered a reminder;
 * - rows are deleted 30 days after the date they refer to.
 * Nothing about the notice, only its date, a short label of ours and its coarse kind, is stored.
 */
import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabase/server";
import { sendGuestReminderEmail, sendGuestReminderConfirmEmail } from "./guestReminderEmail";
import { APP } from "@/content/app";
import type { ViolationKind } from "@/core/violationKinds";

export const MAX_OPEN_PER_EMAIL = 3;
export const CONFIRM_RESEND_MS = 60 * 60 * 1000;
export const MAX_ATTEMPTS = 3;
/** A row is kept this many days after its date, then deleted. */
export const KEEP_DAYS_AFTER_DUE = 30;
/** A claim older than this is a crashed run and may be taken again. */
const CLAIM_LEASE_MS = 10 * 60 * 1000;

export type GuestReminderRow = {
  id: string;
  email: string;
  kind: string;
  due_on: string;
  remind_on: string;
  label: string;
  token: string;
  confirm_sent_at: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  sent_at: string | null;
  attempts: number;
  claimed_at: string | null;
};

export interface GuestReminderStore {
  find(email: string, kind: string, dueOn: string): Promise<GuestReminderRow | null>;
  /** Rows for this address that could still send something: not stopped, not sent, date not past. */
  countOpen(email: string, today: string): Promise<number>;
  insert(row: Omit<GuestReminderRow, "id">): Promise<GuestReminderRow>;
  update(id: string, patch: Partial<GuestReminderRow>): Promise<void>;
  byToken(token: string): Promise<GuestReminderRow | null>;
  stopAll(email: string, at: string): Promise<void>;
  /** Confirmed, not stopped, not sent, due to send today or before, date not past, retries left. */
  due(today: string, staleBefore: string, limit: number): Promise<GuestReminderRow[]>;
  purge(beforeDay: string): Promise<void>;
}

// ---- days, as plain YYYY-MM-DD strings in UTC ---------------------------------------------------

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n)).toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string): number {
  const f = from.split("-").map(Number);
  const t = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(t[0]!, t[1]! - 1, t[2]!) - Date.UTC(f[0]!, f[1]! - 1, f[2]!)) / 86_400_000,
  );
}
export const isDay = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
  new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

/**
 * The day to send the reminder: three days before the date, or the next day when that is already
 * past, and never later than the date itself. `null` when the date is today or past: a reminder on
 * the day it is due, or after, is not a reminder.
 */
export function remindOnFor(dueOn: string, today: string): string | null {
  if (daysBetween(today, dueOn) < 1) return null;
  const threeBefore = addDays(dueOn, -3);
  return threeBefore > today ? threeBefore : addDays(today, 1) <= dueOn ? addDays(today, 1) : dueOn;
}

export const newToken = () => randomBytes(24).toString("hex");

export type RequestResult =
  | { status: "pending" }
  | { status: "already_confirmed" }
  | { status: "too_late" }
  | { status: "limit" };

export interface RequestInput {
  email: string;
  kind: ViolationKind;
  dueOn: string;
  label: string;
}

type Deps = {
  store?: GuestReminderStore;
  now?: Date;
  sendConfirm?: typeof sendGuestReminderConfirmEmail;
  sendReminder?: typeof sendGuestReminderEmail;
};

const todayOf = (now: Date) => now.toISOString().slice(0, 10);

/** Records the request and sends the confirmation email. Sends nothing else, ever, without a click. */
export async function requestGuestReminder(
  input: RequestInput,
  deps: Deps = {},
): Promise<RequestResult> {
  const store = deps.store ?? supabaseStore();
  const now = deps.now ?? new Date();
  const today = todayOf(now);
  const email = input.email.trim().toLowerCase();
  const remindOn = remindOnFor(input.dueOn, today);
  if (!remindOn) return { status: "too_late" };

  let row = await store.find(email, input.kind, input.dueOn);
  if (row?.unsubscribed_at) {
    // They asked to stop: a new request from this form is a new, deliberate opt-in.
    await store.update(row.id, {
      unsubscribed_at: null,
      confirmed_at: null,
      sent_at: null,
      attempts: 0,
      remind_on: remindOn,
      confirm_sent_at: null,
    });
    row = {
      ...row,
      unsubscribed_at: null,
      confirmed_at: null,
      sent_at: null,
      confirm_sent_at: null,
    };
  }
  if (row?.confirmed_at) return { status: "already_confirmed" };

  if (!row) {
    if ((await store.countOpen(email, today)) >= MAX_OPEN_PER_EMAIL) return { status: "limit" };
    row = await store.insert({
      email,
      kind: input.kind,
      due_on: input.dueOn,
      remind_on: remindOn,
      label: input.label.slice(0, 80),
      token: newToken(),
      confirm_sent_at: null,
      confirmed_at: null,
      unsubscribed_at: null,
      sent_at: null,
      attempts: 0,
      claimed_at: null,
    });
  }

  // A second tap, or someone retyping an address, does not send a second confirmation within the hour.
  const last = row.confirm_sent_at ? Date.parse(row.confirm_sent_at) : 0;
  if (now.getTime() - last >= CONFIRM_RESEND_MS) {
    await (deps.sendConfirm ?? sendGuestReminderConfirmEmail)({
      to: email,
      token: row.token,
      label: row.label,
      dueOn: row.due_on,
      kindLabel: labelForKind(row.kind),
    });
    await store.update(row.id, { confirm_sent_at: now.toISOString() });
  }
  return { status: "pending" };
}

export type ConfirmResult = "confirmed" | "already" | "stopped" | "expired" | "unknown";

export async function confirmGuestReminder(token: string, deps: Deps = {}): Promise<ConfirmResult> {
  const store = deps.store ?? supabaseStore();
  const now = deps.now ?? new Date();
  const row = token.length === 48 ? await store.byToken(token) : null;
  if (!row) return "unknown";
  if (row.unsubscribed_at) return "stopped";
  if (row.confirmed_at) return "already";
  if (daysBetween(todayOf(now), row.due_on) < 1) return "expired";
  await store.update(row.id, { confirmed_at: now.toISOString() });
  return "confirmed";
}

/** Stops every reminder to the address this token belongs to. Idempotent. */
export async function stopGuestReminders(token: string, deps: Deps = {}): Promise<boolean> {
  const store = deps.store ?? supabaseStore();
  const now = deps.now ?? new Date();
  const row = token.length === 48 ? await store.byToken(token) : null;
  if (!row) return false;
  await store.stopAll(row.email, now.toISOString());
  return true;
}

/** Sends every reminder whose day has come, then deletes rows past their keep date. */
export async function deliverGuestReminders(
  deps: Deps = {},
): Promise<{ sent: number; failed: number; purged: true }> {
  const store = deps.store ?? supabaseStore();
  const now = deps.now ?? new Date();
  const today = todayOf(now);
  const rows = await store.due(today, new Date(now.getTime() - CLAIM_LEASE_MS).toISOString(), 200);
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    await store.update(row.id, { claimed_at: now.toISOString() });
    try {
      await (deps.sendReminder ?? sendGuestReminderEmail)({
        to: row.email,
        token: row.token,
        label: row.label,
        dueOn: row.due_on,
        daysLeft: daysBetween(today, row.due_on),
        kindLabel: labelForKind(row.kind),
      });
      await store.update(row.id, { sent_at: now.toISOString(), claimed_at: null });
      sent++;
    } catch {
      failed++;
      await store.update(row.id, { attempts: row.attempts + 1, claimed_at: null });
    }
  }
  await store.purge(addDays(today, -KEEP_DAYS_AFTER_DUE));
  return { sent, failed, purged: true };
}

function labelForKind(kind: string): string {
  const labels: Record<string, string> = APP.violationKinds;
  return (labels[kind] ?? kind.replaceAll("_", " ")).toLowerCase();
}

// ---- the Supabase store -------------------------------------------------------------------------

function supabaseStore(): GuestReminderStore {
  const db = supabaseAdmin;
  if (!db) throw new Error("Database unavailable");
  const T = "guest_reminders";
  const fail = (e: unknown) => {
    if (e) throw new Error("Reminders are unavailable");
  };
  return {
    async find(email, kind, dueOn) {
      const { data, error } = await db
        .from(T)
        .select("*")
        .eq("email", email)
        .eq("kind", kind)
        .eq("due_on", dueOn)
        .maybeSingle();
      fail(error);
      return (data as GuestReminderRow | null) ?? null;
    },
    async countOpen(email, today) {
      const { count, error } = await db
        .from(T)
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .is("sent_at", null)
        .is("unsubscribed_at", null)
        .gte("due_on", today);
      fail(error);
      return count ?? 0;
    },
    async insert(row) {
      const { data, error } = await db.from(T).insert(row).select("*").single();
      fail(error);
      return data as GuestReminderRow;
    },
    async update(id, patch) {
      const { error } = await db.from(T).update(patch).eq("id", id);
      fail(error);
    },
    async byToken(token) {
      const { data, error } = await db.from(T).select("*").eq("token", token).maybeSingle();
      fail(error);
      return (data as GuestReminderRow | null) ?? null;
    },
    async stopAll(email, at) {
      const { error } = await db
        .from(T)
        .update({ unsubscribed_at: at })
        .eq("email", email)
        .is("unsubscribed_at", null);
      fail(error);
    },
    async due(today, staleBefore, limit) {
      const { data, error } = await db
        .from(T)
        .select("*")
        .not("confirmed_at", "is", null)
        .is("sent_at", null)
        .is("unsubscribed_at", null)
        .lte("remind_on", today)
        .gte("due_on", today)
        .lt("attempts", MAX_ATTEMPTS)
        .or(`claimed_at.is.null,claimed_at.lt.${staleBefore}`)
        .order("remind_on", { ascending: true })
        .limit(limit);
      fail(error);
      return (data as GuestReminderRow[]) ?? [];
    },
    async purge(beforeDay) {
      const { error } = await db.from(T).delete().lt("due_on", beforeDay);
      fail(error);
    },
  };
}

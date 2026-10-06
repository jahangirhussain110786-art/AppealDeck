import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 6 Oct 2026 review: delivery was unordered, unbounded per seller, mailed unconfirmed addresses
 * and could double-send when two cron runs overlapped. An in-memory table stands in for Supabase.
 */
type Row = Record<string, any>;
const h = vi.hoisted(() => ({
  rows: [] as Row[],
  users: {} as Record<string, { email: string | null; email_confirmed_at: string | null }>,
  sent: [] as string[],
  orderedBy: [] as string[],
  openCount: 0,
}));

function builder(table: Row[]) {
  const filters: Array<(r: Row) => boolean> = [];
  let patch: Row | null = null;
  let isCount = false;
  const api: any = {
    select(_c?: string, opts?: { count?: string; head?: boolean }) {
      if (opts?.count) isCount = true;
      return api;
    },
    update(p: Row) {
      patch = p;
      return api;
    },
    upsert(p: Row) {
      const hit = table.find((r) => r.user_id === p.user_id && r.case_ref === p.case_ref);
      if (hit) Object.assign(hit, p);
      else table.push({ id: `n${table.length}`, ...p });
      return Promise.resolve({ error: null });
    },
    eq(f: string, v: any) {
      filters.push((r) => r[f] === v);
      return api;
    },
    neq(f: string, v: any) {
      filters.push((r) => r[f] !== v);
      return api;
    },
    is(f: string, v: any) {
      filters.push((r) => (v === null ? r[f] == null : r[f] === v));
      return api;
    },
    lte(f: string, v: any) {
      filters.push((r) => r[f] <= v);
      return api;
    },
    lt(f: string, v: any) {
      filters.push((r) => r[f] < v);
      return api;
    },
    or(expr: string) {
      // Only the claim lease filter is used: "claimed_at.is.null,claimed_at.lt.<iso>".
      const stale = expr.split("claimed_at.lt.")[1]!;
      filters.push((r) => r.claimed_at == null || r.claimed_at < stale);
      return api;
    },
    order(col: string) {
      h.orderedBy.push(col);
      return api;
    },
    limit() {
      return api;
    },
    then(res: any, rej?: any) {
      const matched = table.filter((r) => filters.every((f) => f(r)));
      if (patch) {
        for (const r of matched) Object.assign(r, patch);
        return Promise.resolve({ data: matched.map((r) => ({ id: r.id })), error: null }).then(
          res,
          rej,
        );
      }
      if (isCount) return Promise.resolve({ count: matched.length, error: null }).then(res, rej);
      const sorted = [...matched].sort((a, b) => a.due_at.localeCompare(b.due_at));
      return Promise.resolve({ data: sorted, error: null }).then(res, rej);
    },
  };
  return api;
}

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => builder(h.rows),
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: { user: h.users[id] ?? null },
          error: null,
        }),
      },
    },
  },
}));
vi.mock("@/lib/email", () => ({
  sendCaseReminderEmail: vi.fn(async (a: { to: string }) => {
    h.sent.push(a.to);
  }),
}));

import {
  deliverCaseReminders,
  upsertCaseReminder,
  ReminderLimitError,
  MAX_OPEN_REMINDERS_PER_USER,
  MAX_PER_USER_PER_RUN,
} from "../caseReminders";

const NOW = new Date("2026-10-06T08:00:00Z");
let n = 0;
function row(over: Row = {}): Row {
  n++;
  return {
    id: `r${n}`,
    user_id: "u1",
    case_ref: `c${n}`,
    kind: "POLICY",
    due_at: `2026-10-0${1 + (n % 5)}T00:00:00Z`,
    attempts: 0,
    sent_at: null,
    claimed_at: null,
    ...over,
  };
}

beforeEach(() => {
  h.rows = [];
  h.sent = [];
  h.orderedBy = [];
  h.users = { u1: { email: "a@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" } };
});

describe("deliverCaseReminders", () => {
  it("asks for the oldest due first", async () => {
    h.rows.push(row());
    await deliverCaseReminders(NOW);
    expect(h.orderedBy).toContain("due_at");
  });

  it("sends at most MAX_PER_USER_PER_RUN per seller per run and leaves the rest for the next", async () => {
    for (let i = 0; i < 8; i++) h.rows.push(row());
    const r = await deliverCaseReminders(NOW);
    expect(r.sent).toBe(MAX_PER_USER_PER_RUN);
    expect(r.skipped).toBe(3);
    expect(h.rows.filter((x) => x.sent_at).length).toBe(MAX_PER_USER_PER_RUN);
    expect(await deliverCaseReminders(NOW)).toMatchObject({ sent: 3 });
  });

  it("never mails an unconfirmed address, and keeps the reminder for later", async () => {
    h.users.u1 = { email: "a@example.com", email_confirmed_at: null };
    h.rows.push(row());
    const r = await deliverCaseReminders(NOW);
    expect(r).toMatchObject({ sent: 0, skipped: 1, failed: 0 });
    expect(h.sent).toEqual([]);
    expect(h.rows[0]!.attempts).toBe(0);
    expect(h.rows[0]!.sent_at).toBeNull();
  });

  it("does not double-send a reminder another run has claimed", async () => {
    h.rows.push(row({ claimed_at: "2026-10-06T07:59:00Z" }));
    const r = await deliverCaseReminders(NOW);
    expect(r.sent).toBe(0);
    expect(h.sent).toEqual([]);
  });

  it("takes over a stale claim from a crashed run", async () => {
    h.rows.push(row({ claimed_at: "2026-10-06T06:00:00Z" }));
    expect((await deliverCaseReminders(NOW)).sent).toBe(1);
  });

  it("clears the claim after sending, so moving the date later can send again", async () => {
    h.rows.push(row());
    await deliverCaseReminders(NOW);
    expect(h.rows[0]!.claimed_at).toBeNull();
    expect(h.rows[0]!.sent_at).toBeTruthy();
  });
});

describe("upsertCaseReminder cap", () => {
  const input = (caseRef: string) => ({
    userId: "u1",
    caseRef,
    kind: "POLICY" as const,
    dueAt: "2026-12-01T00:00:00Z",
  });

  it("refuses a new case once the account holds the maximum of open reminders", async () => {
    for (let i = 0; i < MAX_OPEN_REMINDERS_PER_USER; i++) h.rows.push(row({ case_ref: `x${i}` }));
    await expect(upsertCaseReminder(input("brand-new"))).rejects.toBeInstanceOf(ReminderLimitError);
  });

  it("still lets the seller move the date on a case that already has a reminder", async () => {
    for (let i = 0; i < MAX_OPEN_REMINDERS_PER_USER; i++) h.rows.push(row({ case_ref: `x${i}` }));
    await expect(upsertCaseReminder(input("x3"))).resolves.toBeUndefined();
  });

  it("does not count other sellers' reminders or already-sent ones", async () => {
    for (let i = 0; i < MAX_OPEN_REMINDERS_PER_USER; i++)
      h.rows.push(row({ case_ref: `x${i}`, user_id: "u2" }));
    for (let i = 0; i < 10; i++) h.rows.push(row({ case_ref: `s${i}`, sent_at: "2026-09-01" }));
    await expect(upsertCaseReminder(input("brand-new"))).resolves.toBeUndefined();
  });
});

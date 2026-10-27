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
  /** Runs inside the next email send, to stand in for something the seller does meanwhile. */
  duringSend: null as null | (() => void),
}));

function builder(table: Row[]) {
  const filters: Array<(r: Row) => boolean> = [];
  let patch: Row | null = null;
  let isCount = false;
  let cap = Infinity;
  const orders: Array<{ col: string; asc: boolean; nullsFirst?: boolean }> = [];
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
    in(f: string, values: any[]) {
      filters.push((r) => values.includes(r[f]));
      return api;
    },
    or(expr: string) {
      // Only claimed_at conditions are used: "claimed_at.is.null", "claimed_at.lt.<iso>" and
      // "claimed_at.eq.<iso>".
      const parts = expr.split(",");
      filters.push((r) =>
        parts.some((part) => {
          if (part === "claimed_at.is.null") return r.claimed_at == null;
          if (part.startsWith("claimed_at.lt.")) {
            return r.claimed_at == null || r.claimed_at < part.slice("claimed_at.lt.".length);
          }
          if (part.startsWith("claimed_at.eq.")) {
            return r.claimed_at === part.slice("claimed_at.eq.".length);
          }
          throw new Error(`unsupported filter ${part}`);
        }),
      );
      return api;
    },
    order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
      h.orderedBy.push(col);
      orders.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst });
      return api;
    },
    limit(n: number) {
      cap = n;
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
      const specs = orders.length ? orders : [{ col: "due_at", asc: true, nullsFirst: undefined }];
      const sorted = [...matched].sort((a, b) => {
        for (const { col, asc, nullsFirst } of specs) {
          const x = a[col] ?? null;
          const y = b[col] ?? null;
          if (x === y) continue;
          // Postgres default: nulls last when ascending, first when descending.
          const first = nullsFirst ?? !asc;
          if (x === null) return first ? -1 : 1;
          if (y === null) return first ? 1 : -1;
          return (x < y ? -1 : 1) * (asc ? 1 : -1);
        }
        return 0;
      });
      return Promise.resolve({
        data: sorted.slice(0, cap).map((r) => ({ ...r })),
        error: null,
      }).then(res, rej);
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
    h.duringSend?.();
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
  h.duringSend = null;
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

describe("deliverCaseReminders, 27 Oct 2026 audit", () => {
  it("does not mark a reminder sent that the seller moved while its old email was going out", async () => {
    const moved = row({ id: "moved" });
    h.rows.push(moved);
    // What upsertCaseReminder does when the seller sets a new date mid-send.
    h.duringSend = () =>
      Object.assign(moved, {
        due_at: "2026-10-20T00:00:00Z",
        sent_at: null,
        claimed_at: null,
        attempts: 0,
      });
    expect(await deliverCaseReminders(NOW)).toMatchObject({ sent: 1 });
    expect(moved.sent_at).toBeNull();
    expect(moved.due_at).toBe("2026-10-20T00:00:00Z");
  });

  it("does not put an old failure on a reminder moved while its email failed", async () => {
    const { sendCaseReminderEmail } = await import("@/lib/email");
    vi.mocked(sendCaseReminderEmail).mockImplementationOnce(async () => {
      Object.assign(h.rows[0]!, { due_at: "2026-10-20T00:00:00Z", claimed_at: null, attempts: 0 });
      throw new Error("provider down");
    });
    h.rows.push(row());
    await deliverCaseReminders(NOW);
    expect(h.rows[0]!.attempts).toBe(0);
    expect(h.rows[0]!.last_error ?? null).toBeNull();
  });

  it("is not starved by two hundred reminders whose address nobody has confirmed", async () => {
    h.users.stuck = { email: "x@example.com", email_confirmed_at: null };
    for (let i = 0; i < 200; i++) {
      h.rows.push(row({ user_id: "stuck", due_at: "2026-09-01T00:00:00Z", id: `stuck${i}` }));
    }
    h.rows.push(row({ id: "waiting", due_at: "2026-10-05T00:00:00Z" }));
    // The first run's batch is all unconfirmed rows, so the confirmed seller waits one run...
    expect((await deliverCaseReminders(NOW)).sent).toBe(0);
    // ...but those rows are now stamped and sort behind fresh ones, so the next run reaches her.
    const tomorrow = new Date(NOW.getTime() + 24 * 3_600_000);
    expect((await deliverCaseReminders(tomorrow)).sent).toBe(1);
    expect(h.rows.find((r) => r.id === "waiting")!.sent_at).toBeTruthy();
  });

  it("stops starting new emails when the time budget is spent, and says how many it left", async () => {
    for (let i = 0; i < 4; i++) {
      h.rows.push(row({ user_id: `v${i}` }));
      h.users[`v${i}`] = { email: `v${i}@example.com`, email_confirmed_at: "2026-01-01T00:00:00Z" };
    }
    const r = await deliverCaseReminders(NOW, { budgetMs: -1 });
    expect(r).toMatchObject({ sent: 0, unreached: 4 });
    expect(h.sent).toEqual([]);
    // Left untouched, so the next run takes them first.
    expect(h.rows.every((x) => x.claimed_at == null && x.sent_at == null)).toBe(true);
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

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: null }));
vi.mock("@/lib/guestReminderEmail", () => ({
  sendGuestReminderConfirmEmail: vi.fn(),
  sendGuestReminderEmail: vi.fn(),
}));

import {
  CONFIRM_RESEND_MS,
  KEEP_DAYS_AFTER_DUE,
  MAX_ATTEMPTS,
  MAX_OPEN_PER_EMAIL,
  addDays,
  confirmGuestReminder,
  daysBetween,
  deliverGuestReminders,
  isDay,
  remindOnFor,
  requestGuestReminder,
  stopGuestReminders,
  type GuestReminderRow,
  type GuestReminderStore,
} from "../guestReminders";

/**
 * The guest deadline reminder (23 Oct 2026), against an in-memory store so the rules are tested
 * without a database: double opt-in, one reminder, a cap per address, a stop link that stops all of
 * them, and nothing sent for a date that is today or past.
 */
function memoryStore() {
  const rows: GuestReminderRow[] = [];
  let n = 0;
  let purged: string | null = null;
  const store: GuestReminderStore = {
    async find(email, kind, dueOn) {
      return rows.find((r) => r.email === email && r.kind === kind && r.due_on === dueOn) ?? null;
    },
    async countOpen(email, today) {
      return rows.filter(
        (r) => r.email === email && !r.sent_at && !r.unsubscribed_at && r.due_on >= today,
      ).length;
    },
    async insert(row) {
      const r = { ...row, id: `id${++n}` };
      rows.push(r);
      return r;
    },
    async update(id, patch) {
      Object.assign(
        rows.find((r) => r.id === id)!,
        patch,
      );
    },
    async byToken(token) {
      return rows.find((r) => r.token === token) ?? null;
    },
    async stopAll(email, at) {
      for (const r of rows) if (r.email === email && !r.unsubscribed_at) r.unsubscribed_at = at;
    },
    async due(today, staleBefore, limit) {
      return rows
        .filter(
          (r) =>
            r.confirmed_at &&
            !r.sent_at &&
            !r.unsubscribed_at &&
            r.remind_on <= today &&
            r.due_on >= today &&
            r.attempts < MAX_ATTEMPTS &&
            (!r.claimed_at || r.claimed_at < staleBefore),
        )
        .slice(0, limit);
    },
    async purge(beforeDay) {
      purged = beforeDay;
    },
  };
  return { store, rows, purged: () => purged };
}

const NOW = new Date("2026-10-23T10:00:00Z");
const input = {
  email: "Seller@Example.com",
  kind: "POLICY" as const,
  dueOn: "2026-11-10",
  label: "L",
};

function deps() {
  const m = memoryStore();
  const sendConfirm = vi.fn(async () => {});
  const sendReminder = vi.fn(async () => {});
  return {
    m,
    d: { store: m.store, now: NOW, sendConfirm, sendReminder },
    sendConfirm,
    sendReminder,
  };
}

describe("days", () => {
  it("adds and counts days and recognises a real calendar day", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-23", "2026-11-10")).toBe(18);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("2026-10-23")).toBe(true);
    expect(isDay("tomorrow")).toBe(false);
  });
});

describe("remindOnFor", () => {
  it("is three days before the date", () => {
    expect(remindOnFor("2026-11-10", "2026-10-23")).toBe("2026-11-07");
  });
  it("is the next day when three days before has passed, and never after the date", () => {
    expect(remindOnFor("2026-10-25", "2026-10-23")).toBe("2026-10-24");
    expect(remindOnFor("2026-10-24", "2026-10-23")).toBe("2026-10-24");
  });
  it("offers nothing for a date that is today or past", () => {
    expect(remindOnFor("2026-10-23", "2026-10-23")).toBeNull();
    expect(remindOnFor("2026-10-01", "2026-10-23")).toBeNull();
  });
});

describe("requesting a reminder", () => {
  it("stores one row for a lower-cased address and sends only the confirmation", async () => {
    const { m, d, sendConfirm, sendReminder } = deps();
    expect(await requestGuestReminder(input, d)).toEqual({ status: "pending" });
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]).toMatchObject({
      email: "seller@example.com",
      remind_on: "2026-11-07",
      confirmed_at: null,
    });
    expect(m.rows[0]!.token).toHaveLength(48);
    expect(sendConfirm).toHaveBeenCalledTimes(1);
    expect(sendReminder).not.toHaveBeenCalled();
  });

  it("does not send a second confirmation within the hour, but does after it", async () => {
    const { m, d, sendConfirm } = deps();
    await requestGuestReminder(input, d);
    await requestGuestReminder(input, d);
    expect(sendConfirm).toHaveBeenCalledTimes(1);
    expect(m.rows).toHaveLength(1);
    await requestGuestReminder(input, {
      ...d,
      now: new Date(NOW.getTime() + CONFIRM_RESEND_MS + 1),
    });
    expect(sendConfirm).toHaveBeenCalledTimes(2);
  });

  it("refuses a date that is today or past, and stores nothing", async () => {
    const { m, d } = deps();
    expect(await requestGuestReminder({ ...input, dueOn: "2026-10-23" }, d)).toEqual({
      status: "too_late",
    });
    expect(m.rows).toHaveLength(0);
  });

  it("caps the open reminders for one address", async () => {
    const { d } = deps();
    for (let i = 0; i < MAX_OPEN_PER_EMAIL; i++)
      await requestGuestReminder({ ...input, dueOn: addDays("2026-11-10", i) }, d);
    expect(await requestGuestReminder({ ...input, dueOn: "2026-12-30" }, d)).toEqual({
      status: "limit",
    });
  });

  it("says a confirmed reminder is already there and sends nothing", async () => {
    const { m, d, sendConfirm } = deps();
    await requestGuestReminder(input, d);
    await confirmGuestReminder(m.rows[0]!.token, d);
    expect(await requestGuestReminder(input, d)).toEqual({ status: "already_confirmed" });
    expect(sendConfirm).toHaveBeenCalledTimes(1);
  });

  it("treats a request after a stop as a new, deliberate opt-in that needs a new confirmation", async () => {
    const { m, d, sendConfirm } = deps();
    await requestGuestReminder(input, d);
    await confirmGuestReminder(m.rows[0]!.token, d);
    await stopGuestReminders(m.rows[0]!.token, d);
    const later = { ...d, now: new Date(NOW.getTime() + 2 * CONFIRM_RESEND_MS) };
    expect(await requestGuestReminder(input, later)).toEqual({ status: "pending" });
    expect(m.rows[0]).toMatchObject({ unsubscribed_at: null, confirmed_at: null });
    expect(sendConfirm).toHaveBeenCalledTimes(2);
  });
});

describe("confirming and stopping", () => {
  it("confirms once, says so the second time, and refuses an unknown or malformed token", async () => {
    const { m, d } = deps();
    await requestGuestReminder(input, d);
    const token = m.rows[0]!.token;
    expect(await confirmGuestReminder(token, d)).toBe("confirmed");
    expect(await confirmGuestReminder(token, d)).toBe("already");
    expect(await confirmGuestReminder("a".repeat(48), d)).toBe("unknown");
    expect(await confirmGuestReminder("short", d)).toBe("unknown");
  });

  it("will not confirm a date that has passed, or one that was stopped", async () => {
    const { m, d } = deps();
    await requestGuestReminder(input, d);
    const token = m.rows[0]!.token;
    expect(await confirmGuestReminder(token, { ...d, now: new Date("2026-11-11T10:00:00Z") })).toBe(
      "expired",
    );
    await stopGuestReminders(token, d);
    expect(await confirmGuestReminder(token, d)).toBe("stopped");
  });

  it("stops every reminder to the address with one token, and is idempotent", async () => {
    const { m, d } = deps();
    await requestGuestReminder(input, d);
    await requestGuestReminder({ ...input, dueOn: "2026-11-20" }, d);
    expect(await stopGuestReminders(m.rows[0]!.token, d)).toBe(true);
    expect(await stopGuestReminders(m.rows[0]!.token, d)).toBe(true);
    expect(m.rows.every((r) => r.unsubscribed_at)).toBe(true);
    expect(await stopGuestReminders("b".repeat(48), d)).toBe(false);
  });
});

describe("delivering", () => {
  const confirmed = async (dueOn = "2026-11-10") => {
    const x = deps();
    await requestGuestReminder({ ...input, dueOn }, x.d);
    await confirmGuestReminder(x.m.rows[0]!.token, x.d);
    return x;
  };
  const onDay = (x: ReturnType<typeof deps>, day: string) => ({
    ...x.d,
    now: new Date(`${day}T08:30:00Z`),
  });

  it("sends nothing before the day, one reminder on it, and never a second", async () => {
    const x = await confirmed();
    expect((await deliverGuestReminders(onDay(x, "2026-11-06"))).sent).toBe(0);
    expect((await deliverGuestReminders(onDay(x, "2026-11-07"))).sent).toBe(1);
    expect(x.sendReminder).toHaveBeenCalledWith(
      expect.objectContaining({ daysLeft: 3, dueOn: "2026-11-10" }),
    );
    expect((await deliverGuestReminders(onDay(x, "2026-11-08"))).sent).toBe(0);
    expect(x.sendReminder).toHaveBeenCalledTimes(1);
  });

  it("sends nothing to an address that was never confirmed or that was stopped", async () => {
    const x = deps();
    await requestGuestReminder(input, x.d);
    expect((await deliverGuestReminders(onDay(x, "2026-11-07"))).sent).toBe(0);
    await confirmGuestReminder(x.m.rows[0]!.token, x.d);
    await stopGuestReminders(x.m.rows[0]!.token, x.d);
    expect((await deliverGuestReminders(onDay(x, "2026-11-07"))).sent).toBe(0);
  });

  it("does not send once the date has passed", async () => {
    const x = await confirmed();
    expect((await deliverGuestReminders(onDay(x, "2026-11-11"))).sent).toBe(0);
  });

  it("counts a failure, retries up to the limit, and then stops", async () => {
    const x = await confirmed();
    x.sendReminder.mockRejectedValue(new Error("down"));
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++)
      await deliverGuestReminders(onDay(x, `2026-11-0${7 + (i % 3)}`));
    expect(x.m.rows[0]!.attempts).toBe(MAX_ATTEMPTS);
    expect(x.m.rows[0]!.sent_at).toBeNull();
    expect(x.sendReminder).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it("deletes rows once they are past their keep date", async () => {
    const x = deps();
    await deliverGuestReminders({ ...x.d, now: new Date("2026-12-01T08:30:00Z") });
    expect(x.m.purged()).toBe(addDays("2026-12-01", -KEEP_DAYS_AFTER_DUE));
  });
});

import { describe, expect, it, vi } from "vitest";
import { setEmailReminder, setReminderDate, type ReminderDeps } from "@/lib/reminderSync";
import type { CaseLog } from "@/lib/caseStore";

/**
 * 23 Sep 2026. The email-reminder switch existed only for classic cases, and the workspace's own
 * date field never told the server anything. These pin the order of each step, because the failure
 * each order prevents is a screen that says an email is coming when none is — or the reverse.
 */
const target = { caseRef: "case-1", kind: "POLICY" as const, signedIn: true };
const base: CaseLog = { state: "SUBMITTED", attemptCount: 1 };

function deps(over: Partial<{ save: boolean; sync: boolean[] }> = {}) {
  const syncResults = [...(over.sync ?? [true, true])];
  const saved: CaseLog[] = [];
  const d = {
    saveLog: vi.fn(async (log: CaseLog) => {
      saved.push(log);
      return over.save ?? true;
    }),
    sync: vi.fn(async () => syncResults.shift() ?? true),
  } satisfies ReminderDeps;
  return { d, saved };
}

describe("setReminderDate", () => {
  it("saves the date and moves an email that is already on", async () => {
    const { d, saved } = deps();
    const log = { ...base, reminderAt: "2026-10-01T00:00:00Z", emailReminder: true };
    expect(await setReminderDate(log, "2026-10-05T00:00:00Z", target, d)).toBe("saved");
    expect(saved[0]!.reminderAt).toBe("2026-10-05T00:00:00Z");
    expect(d.sync).toHaveBeenCalledWith({
      caseRef: "case-1",
      kind: "POLICY",
      dueAt: "2026-10-05T00:00:00Z",
      enabled: true,
    });
  });

  it("stops the email when the date is cleared", async () => {
    const { d, saved } = deps();
    const log = { ...base, reminderAt: "2026-10-01T00:00:00Z", emailReminder: true };
    await setReminderDate(log, undefined, target, d);
    expect(saved[0]).not.toHaveProperty("reminderAt");
    // `enabled: true` with no date is the request that deletes the server row.
    expect(d.sync).toHaveBeenCalledWith(expect.objectContaining({ dueAt: undefined }));
  });

  it("does not touch the server when email is off", async () => {
    const { d } = deps();
    await setReminderDate(base, "2026-10-05T00:00:00Z", target, d);
    expect(d.sync).not.toHaveBeenCalled();
  });

  it("does not move the email when the date itself did not save", async () => {
    const { d } = deps({ save: false });
    const log = { ...base, reminderAt: "2026-10-01T00:00:00Z", emailReminder: true };
    expect(await setReminderDate(log, "2026-10-05T00:00:00Z", target, d)).toBe("not-saved");
    expect(d.sync).not.toHaveBeenCalled();
  });

  it("reports an email left on the old date, so the seller is told", async () => {
    const { d } = deps({ sync: [false] });
    const log = { ...base, reminderAt: "2026-10-01T00:00:00Z", emailReminder: true };
    expect(await setReminderDate(log, "2026-10-05T00:00:00Z", target, d)).toBe("email-not-updated");
  });
});

describe("setEmailReminder", () => {
  const dated = { ...base, reminderAt: "2026-10-01T00:00:00Z" };

  it("records the switch only after the server has agreed", async () => {
    const { d, saved } = deps({ sync: [false] });
    expect(await setEmailReminder(dated, true, target, d)).toBe("email-not-updated");
    // Saving "on" here would show "Email reminders are on" with nothing scheduled.
    expect(saved).toHaveLength(0);
  });

  it("turns it on", async () => {
    const { d, saved } = deps();
    expect(await setEmailReminder(dated, true, target, d)).toBe("saved");
    expect(d.sync).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(saved[0]!.emailReminder).toBe(true);
  });

  it("puts the server back when the vault write fails", async () => {
    const { d } = deps({ save: false });
    expect(await setEmailReminder(dated, true, target, d)).toBe("not-saved");
    expect(d.sync).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  });
});

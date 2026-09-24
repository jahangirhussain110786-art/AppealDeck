import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * 24 Sep 2026 (ChatGPT audit item O). The reminder record now reports how many delivery attempts
 * failed and whether the server has stopped trying, so the page can say whether the email went.
 */
const row = vi.fn();

vi.mock("@/lib/supabase/server", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => row(),
  };
  return { supabaseAdmin: { from: () => chain } };
});
vi.mock("@/lib/email", () => ({ sendCaseReminderEmail: vi.fn() }));

import { getCaseReminder } from "../caseReminders";

beforeEach(() => row.mockReset());

describe("getCaseReminder", () => {
  it("reports a scheduled reminder with no failures", async () => {
    row.mockResolvedValue({
      data: { due_at: "2026-10-01T00:00:00+00:00", sent_at: null, attempts: 0 },
      error: null,
    });
    expect(await getCaseReminder("u1", "c1")).toEqual({
      dueAt: "2026-10-01T00:00:00+00:00",
      sentAt: null,
      attempts: 0,
      gaveUp: false,
    });
  });

  it("says it has stopped trying once the retry limit is reached", async () => {
    row.mockResolvedValue({
      data: { due_at: "2026-10-01T00:00:00+00:00", sent_at: null, attempts: 3 },
      error: null,
    });
    expect((await getCaseReminder("u1", "c1"))?.gaveUp).toBe(true);
  });

  it("never reports a sent reminder as given up", async () => {
    row.mockResolvedValue({
      data: { due_at: "2026-10-01T00:00:00+00:00", sent_at: "2026-10-01T08:00:00Z", attempts: 3 },
      error: null,
    });
    expect((await getCaseReminder("u1", "c1"))?.gaveUp).toBe(false);
  });

  it("returns null when nothing is scheduled", async () => {
    row.mockResolvedValue({ data: null, error: null });
    expect(await getCaseReminder("u1", "c1")).toBeNull();
  });
});

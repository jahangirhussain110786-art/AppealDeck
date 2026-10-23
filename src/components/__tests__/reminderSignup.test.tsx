import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReminderSignup, reminderDate } from "../ReminderSignup";

/**
 * The reminder offer on the decoder (23 Oct 2026): only for a cut-off the notice itself states and
 * that is still ahead. The date a funds appeal opens, an indefinite hold and a window with no stated
 * day never offer one, because there is nothing true to count to.
 */
const now = new Date(2026, 9, 23, 12, 0, 0);
const d = (over: Record<string, unknown>) =>
  ({ kind: "appeal_window", label: "Appeal window", dueAt: null, ...over }) as never;

describe("reminderDate", () => {
  it("is the soonest stated day still ahead", () => {
    expect(
      reminderDate(
        [d({ dueOn: "2026-12-01" }), d({ dueOn: "2026-11-10" }), d({ dueOn: "2026-10-01" })],
        now,
      ),
    ).toBe("2026-11-10");
  });
  it("is null for today, the past, no stated day, an indefinite hold, or the day a funds appeal opens", () => {
    expect(reminderDate([d({ dueOn: "2026-10-23" })], now)).toBeNull();
    expect(reminderDate([d({ dueOn: "2026-10-01" })], now)).toBeNull();
    expect(reminderDate([d({})], now)).toBeNull();
    expect(reminderDate([d({ dueOn: "2027-01-01", isIndefinite: true })], now)).toBeNull();
    expect(
      reminderDate([d({ kind: "funds_appeal_eligible", dueOn: "2027-01-01" })], now),
    ).toBeNull();
    expect(reminderDate([], now)).toBeNull();
  });
});

describe("ReminderSignup", () => {
  it("renders nothing when there is no date to remind about", () => {
    expect(renderToStaticMarkup(<ReminderSignup deadlines={[d({})]} kind="POLICY" />)).toBe("");
  });

  it("asks for consent and says what is kept, in the form itself", () => {
    const future = new Date(Date.now() + 30 * 86_400_000);
    const day = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
    const html = renderToStaticMarkup(
      <ReminderSignup deadlines={[d({ dueOn: day })]} kind="POLICY" />,
    );
    expect(html).toContain("Get one email reminder");
    expect(html).toContain('type="email"');
    expect(html).toContain("one reminder about this date");
    expect(html).toContain("deletes them");
    expect(html).toContain("never the notice itself");
    expect(html).toContain("disabled");
    expect(html).not.toMatch(/hurry|last chance|act now|guarantee/i);
  });
});

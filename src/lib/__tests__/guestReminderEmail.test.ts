import { describe, expect, it } from "vitest";
import { buildGuestConfirmEmail, buildGuestReminderEmail } from "../guestReminderEmail";

/**
 * The two guest reminder emails (23 Oct 2026). They reach a person in a crisis, so they state the
 * date, add no urgency of their own, make no prediction, say plainly what is kept, and always carry
 * the link that stops everything. The confirmation must say nothing is sent unless it is clicked.
 */
const base = {
  to: "seller@example.com",
  token: "ab".repeat(24),
  label: "The date your notice states",
  dueOn: "2026-11-10",
  kindLabel: "policy violation",
};

describe("the confirmation email", () => {
  const e = buildGuestConfirmEmail(base);
  it("names the date, links to confirm and to stop, and says nothing is sent unless confirmed", () => {
    expect(e.subject).toContain("November 10, 2026");
    expect(e.text).toContain(`/reminder?do=confirm&token=${base.token}`);
    expect(e.text).toContain(`/reminder?do=stop&token=${base.token}`);
    expect(e.text).toMatch(/Nothing will be sent to you unless you confirm/);
    expect(e.text).toMatch(/30 days after it/);
  });
  it("says what is kept, and that it is not the notice", () => {
    expect(e.text).toMatch(/keep only the date and the kind of notice, never the notice itself/);
  });
});

describe("the reminder email", () => {
  it.each([
    [3, "is in 3 days"],
    [1, "is tomorrow"],
    [0, "is today"],
  ])("says how far away the date is (%s days)", (daysLeft, phrase) => {
    const e = buildGuestReminderEmail({ ...base, daysLeft });
    expect(e.subject).toContain(phrase);
    expect(e.text).toContain(phrase);
  });

  it("carries the stop link, points to Account Health, and promises or predicts nothing", () => {
    const e = buildGuestReminderEmail({ ...base, daysLeft: 3 });
    expect(e.text).toContain(`/reminder?do=stop&token=${base.token}`);
    expect(e.text).toMatch(/Account Health page is the one to go by/);
    expect(e.text).toMatch(/Amazon decides/);
    expect(e.text).toMatch(/never sign in to your account/);
    expect(`${e.subject} ${e.text}`).not.toMatch(
      /hurry|last chance|act now|expires|running out|guarantee|will be (approved|reinstated)/i,
    );
  });

  it("escapes anything in the html", () => {
    const e = buildGuestReminderEmail({ ...base, daysLeft: 3, kindLabel: "<script>x</script>" });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
  });
});

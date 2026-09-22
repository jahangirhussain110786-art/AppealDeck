import { describe, it, expect } from "vitest";
import { buildCaseReminderEmail } from "@/lib/email";

const base = {
  to: "seller@example.com",
  kindLabel: "policy violation",
  dueAt: "2026-10-01T00:00:00Z",
  dashboardUrl: "https://appealdeck.com/dashboard",
};

describe("buildCaseReminderEmail", () => {
  it("states only the date the seller set", () => {
    const email = buildCaseReminderEmail(base);
    expect(email.subject).toBe("The follow-up date you set has arrived");
    expect(email.text).toContain("policy violation");
    expect(email.text).toContain("https://appealdeck.com/dashboard");
  });

  /**
   * This email lands unprompted on someone whose livelihood is suspended. These assertions are the
   * tone contract from D6, not style preferences — each one is a specific way this message could
   * do harm.
   */
  it("never implies Amazon has been in touch or that anything changed", () => {
    const { text } = buildCaseReminderEmail(base);
    expect(text).toContain("Nothing about your case has changed on our side");
    expect(text).toMatch(/Amazon does not notify us/i);
  });

  it("makes no prediction and no promise about the outcome", () => {
    const { text, subject } = buildCaseReminderEmail(base);
    for (const banned of [
      /guarantee/i,
      /will be reinstated/i,
      /your chances/i,
      /approv(al|ed) odds/i,
      /likely/i,
    ]) {
      expect(`${subject} ${text}`).not.toMatch(banned);
    }
  });

  it("does not manufacture urgency", () => {
    const { text, subject } = buildCaseReminderEmail(base);
    for (const banned of [/urgent/i, /act now/i, /immediately/i, /running out/i, /last chance/i]) {
      expect(`${subject} ${text}`).not.toMatch(banned);
    }
  });

  it("tells the seller how to stop receiving it", () => {
    expect(buildCaseReminderEmail(base).text).toMatch(/turn off email reminders/i);
  });

  it("carries no case content beyond the coarse kind", () => {
    const { text, html } = buildCaseReminderEmail(base);
    // A caller can only supply a label and a date; there is no field for notice text at all.
    expect(text).not.toMatch(/ASIN/i);
    expect(html).toContain("policy violation");
  });

  it("escapes HTML so a label can never inject markup", () => {
    const { html } = buildCaseReminderEmail({
      ...base,
      kindLabel: '<img src=x onerror="alert(1)">',
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("omits the date phrase rather than printing an invalid one", () => {
    const { text } = buildCaseReminderEmail({ ...base, dueAt: "not a date" });
    expect(text).not.toContain("Invalid");
    expect(text).not.toContain("NaN");
  });
});

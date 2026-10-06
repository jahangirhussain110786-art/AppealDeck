import { describe, expect, it } from "vitest";
import { parseNotice, genericWindowsOf } from "./noticeParser";

const days = (t: string) => {
  const p = parseNotice(t);
  return [p.statedWindowDays, p.statedBusinessDays] as const;
};

/**
 * 6 Oct 2026. Windows worded around a duty rather than around "appeal" were never read, so a
 * verification notice with a seven-day clock showed "no stated window".
 */
describe("windows worded around a duty", () => {
  it.each([
    ["Please upload a government-issued ID within 7 days.", 7],
    ["Please verify your identity within seven (7) days.", 7],
    ["Verify your payment method within 5 days.", 5],
    ["Respond within 14 days.", 14],
    ["You can appeal this decision within 30 days.", 30],
    ["If you do not respond within 14 days, your account will be closed.", 14],
    ["You will have 17 days from the date of this email to submit a plan of action.", 17],
    ["You have 10 calendar days to upload a document.", 10],
    ["Amazon may close your account if you do not respond within 14 days.", 14],
    ["Please respond within two weeks.", 14],
  ])("reads %s", (text, expected) => {
    expect(days(text)).toEqual([expected, null]);
  });

  it("reports a business-day window as business days and never as a calendar window", () => {
    expect(days("Please respond within 3 business days with a Plan of Action.")).toEqual([null, 3]);
    expect(days("You have 5 working days to provide the invoices.")).toEqual([null, 5]);
    expect(parseNotice("Respond within 3 business days.").windowAmbiguous).toBe(true);
  });

  it("does not read Amazon's own timetable as the seller's window", () => {
    for (const t of [
      "We will review your appeal within 5 days.",
      "Funds will be released within 14 days after you provide documents.",
      "Amazon will review your plan and respond within 5 days.",
      "We will respond within 2 business days.",
    ]) {
      expect(days(t), t).toEqual([null, null]);
    }
  });

  it("does not read a handling-time rule as a notice deadline", () => {
    expect(days("Orders must ship within 2 days of purchase.")).toEqual([null, null]);
  });

  it("never overrules an appeal-worded window with a generic one, and leaves two clocks ambiguous", () => {
    expect(days("You may appeal within 90 days. Please upload your ID within 7 days.")).toEqual([
      90,
      null,
    ]);
    expect(days("Verify your identity within 7 days. Upload the invoice within 14 days.")).toEqual([
      null,
      null,
    ]);
  });

  it("exposes the distinct windows it found", () => {
    expect(genericWindowsOf("Respond within 14 days. Reply within 3 business days.")).toEqual({
      calendar: [14],
      business: [3],
    });
  });
});

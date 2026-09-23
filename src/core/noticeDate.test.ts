import { describe, it, expect } from "vitest";
import { receiptDateOf, statedDeadlineOf, formatDay } from "./noticeDate";

/**
 * The receipt date is only ever read from the notice itself, and only when the notice states it
 * without ambiguity. Every refusal below is deliberate: a wrong start date produces a deadline that
 * is wrong by days, and the honest fallback — "from the day you received this notice" — is always
 * available instead.
 */
describe("receiptDateOf", () => {
  it.each([
    ["an Outlook copy", "From: Amazon\nSent: Monday, September 1, 2026 10:23 AM\nSubject: Account"],
    ["an RFC 2822 header", "Date: Mon, 1 Sep 2026 10:23:00 -0700\nSubject: Your account"],
    [
      "a Gmail forward",
      "---------- Forwarded message ---------\nFrom: Amazon\nDate: Mon, Sep 1, 2026 at 10:23 AM",
    ],
    ["an ISO date", "Received: 2026-09-01\n\nYour account has been deactivated."],
    ["a quoted forward", "> Date: 1 September 2026\n> Subject: Account health"],
  ])("reads the date from %s", (_, raw) => {
    expect(receiptDateOf(raw)).toBe("2026-09-01");
  });

  it("keeps the day as written rather than converting it to UTC", () => {
    // 23:30 at -0700 is already 2 September in UTC. The seller received it on the 1st.
    expect(receiptDateOf("Date: Mon, 1 Sep 2026 23:30:00 -0700")).toBe("2026-09-01");
  });

  it("treats two header lines naming the same day as one date", () => {
    expect(receiptDateOf("Date: 1 Sep 2026\nSent: September 1, 2026 9:00 AM")).toBe("2026-09-01");
  });

  it("ignores dates in the body, however date-like", () => {
    // Every one of these is a real date in a real notice, and none of them is when it arrived.
    const raw = [
      "Your account has been deactivated.",
      "We received a complaint on September 1, 2026 about an order placed 2026-08-20.",
      "Submit your appeal by 1 October 2026.",
    ].join("\n");
    expect(receiptDateOf(raw)).toBeNull();
  });

  it("refuses an all-numeric date, which reads differently by country", () => {
    expect(receiptDateOf("Date: 03/04/2026")).toBeNull();
  });

  it("refuses to choose between two different days", () => {
    // A forward carries the forwarder's date and Amazon's; we cannot tell which the seller means.
    expect(receiptDateOf("Sent: 5 September 2026\n\nDate: 1 September 2026")).toBeNull();
  });

  it("refuses an impossible date instead of rolling it forward", () => {
    expect(receiptDateOf("Date: 31 February 2026")).toBeNull();
  });

  it("returns nothing for a notice with no header at all", () => {
    expect(
      receiptDateOf("Your account has been deactivated. You may appeal within 30 days."),
    ).toBeNull();
  });
});

/**
 * A last day the notice names as a date. The positives are the phrasings Amazon and email clients
 * actually produce; the negatives are the dates a notice is full of that are not the seller's
 * deadline. Every refusal falls back to the counted window, or to "confirm it in Account Health" —
 * never to a date that might be the wrong one.
 */
describe("statedDeadlineOf", () => {
  const day = (raw: string, sentOn: string | null = null) =>
    statedDeadlineOf(raw, sentOn)?.day ?? null;

  it.each([
    ["by, day-month-year", "Please submit your appeal by 1 October 2026."],
    ["no later than, month-day-year", "Submit a Plan of Action no later than October 1, 2026."],
    ["on or before, with a weekday", "You must respond on or before Thursday, October 1, 2026."],
    [
      "an abbreviation with a full stop",
      "To reactivate, submit an appeal by Oct. 1, 2026 11:59 PM PDT.",
    ],
    [
      "an ordinal",
      "If you do not appeal by the 1st of October 2026, your account stays deactivated.",
    ],
    ["an ISO date", "Reply before 2026-10-01 with the requested documents."],
    ["the action after the date", "You have until 1 Oct 2026 to submit an appeal."],
    ["an appeal deadline label", "Appeal deadline: October 1, 2026"],
    [
      "a clause between action and date",
      "Please submit your appeal, including invoices, by 1 October 2026.",
    ],
  ])("reads %s", (_, raw) => {
    expect(day(raw)).toBe("2026-10-01");
  });

  it("points at the date exactly as written, for the decoder to highlight", () => {
    const raw = "Please submit your appeal by 1 October 2026.";
    const found = statedDeadlineOf(raw, null)!;
    expect(raw.slice(found.start, found.end)).toBe("1 October 2026");
  });

  it.each([
    ["Amazon's own timetable", "We will review your appeal by 5 October 2026."],
    ["money held", "If you do not appeal, funds will be held until 1 December 2026."],
    ["a condition on a record", "Submit invoices dated before 1 March 2026 for the listed ASINs."],
    ["the seller's history", "Your previous appeal was reviewed before 1 September 2026."],
    ["a date with no responding in the sentence", "The listing was removed by 3 September 2026."],
    ["an all-numeric date", "Please submit your appeal by 01/10/2026."],
  ])("refuses %s", (_, raw) => {
    expect(day(raw)).toBeNull();
  });

  it("refuses two different last days rather than choosing one", () => {
    expect(
      day("Submit your appeal by 1 October 2026. Reply no later than 5 October 2026."),
    ).toBeNull();
  });

  it("accepts the same last day stated twice", () => {
    expect(day("Submit your appeal by 1 October 2026. Appeal deadline: October 1, 2026")).toBe(
      "2026-10-01",
    );
  });

  it("places a date written without a year against the notice's own date", () => {
    expect(day("Submit your appeal by October 1.", "2026-09-03")).toBe("2026-10-01");
    // Across the new year: a notice sent in December naming "January 5" means next January.
    expect(day("Submit your appeal by January 5.", "2026-12-20")).toBe("2027-01-05");
  });

  it("gives a yearless date no year when the notice carries no date of its own", () => {
    expect(day("Submit your appeal by October 1.")).toBeNull();
  });

  it("refuses a last day that falls before the notice was sent", () => {
    expect(day("Submit your appeal by 1 August 2026.", "2026-09-03")).toBeNull();
  });

  it("refuses an impossible day rather than rolling it into the next month", () => {
    expect(day("Submit your appeal by 31 February 2027.")).toBeNull();
  });

  it("finds nothing in a notice that gives only a length", () => {
    expect(day("You may appeal within 30 days.")).toBeNull();
  });
});

describe("formatDay", () => {
  it("writes a day that cannot be misread in any country", () => {
    expect(formatDay("2026-09-01")).toBe("1 Sep 2026");
    expect(formatDay("2026-12-25")).toBe("25 Dec 2026");
  });
});

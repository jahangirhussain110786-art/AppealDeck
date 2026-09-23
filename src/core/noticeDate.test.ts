import { describe, it, expect } from "vitest";
import { receiptDateOf, formatDay } from "./noticeDate";

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

describe("formatDay", () => {
  it("writes a day that cannot be misread in any country", () => {
    expect(formatDay("2026-09-01")).toBe("1 Sep 2026");
    expect(formatDay("2026-12-25")).toBe("25 Dec 2026");
  });
});

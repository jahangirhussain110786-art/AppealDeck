import { describe, expect, it } from "vitest";
import { daysLeftLabel } from "@/components/workspace/deadlineText";

// Noon local time, so the calendar day is the same in every time zone the suite runs in.
const NOW = new Date(2026, 9, 6, 12, 0, 0);

describe("daysLeftLabel (B4)", () => {
  it("counts the days once the date is under a week away", () => {
    expect(daysLeftLabel("2026-10-09", NOW)).toBe("3 days left");
    expect(daysLeftLabel("2026-10-12", NOW)).toBe("6 days left");
  });

  it("says tomorrow and today in words", () => {
    expect(daysLeftLabel("2026-10-07", NOW)).toBe("tomorrow");
    expect(daysLeftLabel("2026-10-06", NOW)).toBe("today");
  });

  it("says the date has passed rather than a negative count", () => {
    expect(daysLeftLabel("2026-10-01", NOW)).toBe("the date has passed");
  });

  it("is silent for a date a week or more away, and for anything that is not a day", () => {
    expect(daysLeftLabel("2026-10-13", NOW)).toBeNull();
    expect(daysLeftLabel("2027-01-01", NOW)).toBeNull();
    expect(daysLeftLabel(undefined, NOW)).toBeNull();
    expect(daysLeftLabel("soon", NOW)).toBeNull();
  });
});

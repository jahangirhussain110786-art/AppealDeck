import { describe, expect, it } from "vitest";
import { formatDate, formatRelativeDays, formatDateWithRelative, formatBytes } from "@/lib/format";

describe("formatDate", () => {
  it("formats a Date as 14 Sep 2026", () => {
    expect(formatDate(new Date(2026, 8, 14))).toBe("14 Sep 2026");
  });
  it("formats a date string", () => {
    expect(formatDate("2026-09-14T14:02:00Z")).toBe("14 Sep 2026");
  });
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("formatRelativeDays", () => {
  const now = new Date(2026, 8, 4, 12, 0, 0);
  it("shows 'in N days' for future dates", () => {
    expect(formatRelativeDays(new Date(2026, 8, 14, 12, 0, 0), now)).toBe("in 10 days");
  });
  it("shows 'tomorrow' for 1 day ahead", () => {
    expect(formatRelativeDays(new Date(2026, 8, 5, 12, 0, 0), now)).toBe("tomorrow");
  });
  it("shows 'today' for same day", () => {
    expect(formatRelativeDays(new Date(2026, 8, 4, 20, 0, 0), now)).toBe("today");
  });
  it("shows 'yesterday' for 1 day ago", () => {
    expect(formatRelativeDays(new Date(2026, 8, 3, 12, 0, 0), now)).toBe("yesterday");
  });
  it("shows 'N days ago' for past dates", () => {
    expect(formatRelativeDays(new Date(2026, 7, 11, 12, 0, 0), now)).toBe("24 days ago");
  });
  it("shows verify message for null", () => {
    expect(formatRelativeDays(null, now)).toBe("verify in your Account Health dashboard");
  });
});

describe("formatDateWithRelative", () => {
  it("combines date and relative with middle dot", () => {
    expect(
      formatDateWithRelative(new Date(2026, 8, 14, 12, 0, 0), new Date(2026, 8, 4, 12, 0, 0)),
    ).toBe("14 Sep 2026 · in 10 days");
  });
});

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("formats 1023 bytes", () => {
    expect(formatBytes(1023)).toBe("1023 B");
  });
  it("formats 2.3 MB", () => {
    expect(formatBytes(2_411_725)).toBe("2.3 MB");
  });
});

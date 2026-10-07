import { describe, expect, it } from "vitest";
import { buildIcs, calendarEventsFor } from "../calendar";
import type { ClockItem } from "@/core/clock";

const NOW = new Date("2026-10-07T09:00:00Z");
const item = (over: Partial<ClockItem>): ClockItem => ({
  caseId: "c1",
  kind: "INAUTHENTIC",
  source: "deadline",
  label: "Appeal window closes",
  dueAt: "2026-11-01T00:00:00.000Z",
  urgency: "scheduled",
  daysRemaining: 25,
  newSinceLastSeen: false,
  ...over,
});

describe("buildIcs", () => {
  const ics = buildIcs(
    [
      {
        uid: "a",
        day: "2026-11-01",
        title: "AppealDeck: Window, closes; soon",
        description: "Line one\nLine two",
      },
    ],
    NOW,
  );

  it("is a well-formed calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("makes an all-day event that ends the next day, with a day-before alert", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261101");
    expect(ics).toContain("DTEND;VALUE=DATE:20261102");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("UID:a@appealdeck");
  });

  it("escapes commas, semicolons and newlines", () => {
    expect(ics).toContain("SUMMARY:AppealDeck: Window\\, closes\\; soon");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
  });

  it("rolls a month end over correctly", () => {
    const e = buildIcs([{ uid: "b", day: "2026-12-31", title: "t", description: "d" }], NOW);
    expect(e).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("folds long lines at 75 octets without splitting a character", () => {
    const long = buildIcs(
      [{ uid: "c", day: "2026-11-01", title: "é".repeat(100), description: "d" }],
      NOW,
    );
    for (const line of long.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(long.replace(/\r\n /g, "")).toContain("é".repeat(100));
  });
});

describe("calendarEventsFor", () => {
  it("keeps today and later, drops dates that have passed, and uses a stable id", () => {
    const events = calendarEventsFor(
      [
        item({}),
        item({ urgency: "overdue", dueAt: "2026-10-01T00:00:00.000Z" }),
        item({ urgency: "today", source: "reminder" }),
      ],
      "Where the date came from",
    );
    expect(events).toHaveLength(2);
    expect(events[0]!.uid).toBe("c1-deadline-2026-11-01");
    expect(events[0]!.title).toBe("AppealDeck: Appeal window closes");
    expect(events[0]!.day).toBe("2026-11-01");
  });
});

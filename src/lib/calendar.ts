import type { ClockItem } from "@/core/clock";

/**
 * A calendar file (.ics) for the dates a case is counting down to.
 *
 * An email reminder needs an address, a mail key and the seller reading mail. A calendar entry sits
 * on the phone they already look at in a panic, works offline, and needs nothing from us after the
 * download. Entries are all-day (the dates are days, never times), each carries an alert the day
 * before, and the text says where the date came from. Nothing is sent anywhere: the file is built
 * in the browser from what the dashboard already shows.
 */
export interface CalendarEvent {
  /** Stable, so importing the same file twice updates instead of duplicating. */
  uid: string;
  /** The calendar day, YYYY-MM-DD. */
  day: string;
  title: string;
  description: string;
}

/** RFC 5545 text escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Lines are folded at 75 octets, continuation lines start with one space. */
function fold(line: string): string[] {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return [line];
  const out: string[] = [];
  let current = "";
  const flush = () => out.push(out.length === 0 ? current : " " + current);
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (encoder.encode(current + ch).length > limit) {
      flush();
      current = ch;
    } else current += ch;
  }
  flush();
  return out;
}

const compact = (day: string) => day.replace(/-/g, "");

function nextDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function stamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function buildIcs(events: readonly CalendarEvent[], now: Date): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AppealDeck//Case dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@appealdeck`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(e.day)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.day))}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(e.title)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.flatMap(fold).join("\r\n") + "\r\n";
}

/** The clock items worth putting in a calendar: today and later. A date that has passed is not an event. */
export function calendarEventsFor(
  items: readonly ClockItem[],
  description: string,
): CalendarEvent[] {
  return items
    .filter((i) => i.urgency !== "overdue")
    .map((i) => ({
      uid: `${i.caseId}-${i.source}-${i.dueAt.slice(0, 10)}`,
      day: i.dueAt.slice(0, 10),
      title: `AppealDeck: ${i.label}`,
      description,
    }));
}

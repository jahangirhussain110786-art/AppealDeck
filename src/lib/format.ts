const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(d: Date | string, { tz = true }: { tz?: boolean } = {}): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: tz ? "short" : undefined,
  }).format(date);
}

export function formatDateTime(d: Date | string | null): string {
  if (!d) return "";
  return `${formatDate(d)}, ${formatTime(d)}`;
}

export function formatRelativeDays(target: Date | string | null, now: Date): string {
  if (!target) return "verify in your Account Health dashboard";
  const t = typeof target === "string" ? new Date(target) : target;
  const ms = t.getTime() - now.getTime();
  return describeDayCount(Math.round(ms / 86_400_000));
}

/**
 * Whole calendar days from the seller's own today to a YYYY-MM-DD day. Counted on the calendar,
 * not in hours: a deadline of "1 October" is "tomorrow" all through 30 September, wherever the
 * seller is, rather than flipping part-way through the day.
 */
export function daysUntilDay(isoDay: string, now: Date): number {
  const [y, m, d] = isoDay.split("-").map(Number);
  const target = Date.UTC(y!, m! - 1, d!);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

export function formatRelativeToDay(isoDay: string, now: Date): string {
  return describeDayCount(daysUntilDay(isoDay, now));
}

function describeDayCount(days: number): string {
  if (days > 1) return `in ${days} days`;
  if (days === 1) return "tomorrow";
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}

export function formatDateWithRelative(target: Date | string | null, now: Date): string {
  if (!target) return "";
  return `${formatDate(target)} · ${formatRelativeDays(target, now)}`;
}

/** Long-form, locale-fixed date ("September 19, 2026") for formal external documents (email
 * receipts) where a compact/local-timezone-flavoured formatDate() would read oddly. */
export function formatLongDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

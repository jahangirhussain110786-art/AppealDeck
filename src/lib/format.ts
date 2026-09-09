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
  const days = Math.round(ms / 86_400_000);
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

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

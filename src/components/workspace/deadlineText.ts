import { WORKSPACE as C } from "@/content/workspace";

/**
 * "3 days left" for a date the seller has to act by, but only when it is close enough to matter.
 *
 * A far-off date reads better as a date alone; a near one needs the count, because the calendar
 * arithmetic is the thing a frightened seller does worst. Compared as calendar days in the
 * seller's own time zone, which is how they read the date on their own notice.
 *
 * Returns `null` for a date a week or more away, and for anything that is not a `YYYY-MM-DD` day.
 */
export const SOON_DAYS = 7;

export function daysLeftLabel(dueOn: string | undefined, now: Date = new Date()): string | null {
  if (!dueOn || !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) return null;
  const [y, m, d] = dueOn.split("-").map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = Date.UTC(y!, m! - 1, d!);
  const days = Math.round((due - today) / 86_400_000);
  if (days < 0) return C.deadlineCount.passed;
  if (days === 0) return C.deadlineCount.today;
  if (days === 1) return C.deadlineCount.tomorrow;
  if (days < SOON_DAYS) return C.deadlineCount.days.replace("{n}", String(days));
  return null;
}

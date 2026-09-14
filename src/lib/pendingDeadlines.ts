import type { SerializedDeadline } from "@/core";
import type { DeadlineLike } from "@/components/DeadlineChip";

const PENDING_DEADLINES_KEY = "appealdeck-pending-deadlines";

/**
 * Bridges the real deadlines `/decode` just computed across the plain-link navigation to
 * `/case?kind=...` — there is no shared request/case object between those two pages, so without
 * this the deadlines a seller just saw (with real due dates) would simply not exist by the time
 * a case file is created, and Dashboard would have nothing but a placeholder to show (14 Sep
 * 2026 fix). `sessionStorage` is deliberately short-lived and one-shot: `consumePendingDeadlines`
 * removes the entry it reads, so a later, unrelated case-start never picks up a stale set.
 */
export function stashPendingDeadlines(deadlines: readonly DeadlineLike[]): void {
  if (typeof window === "undefined" || deadlines.length === 0) return;
  try {
    const serialized: SerializedDeadline[] = deadlines.map((d) => ({
      ...d,
      dueAt: d.dueAt ? new Date(d.dueAt).toISOString() : null,
    }));
    window.sessionStorage.setItem(PENDING_DEADLINES_KEY, JSON.stringify(serialized));
  } catch {
    // Storage unavailable (private browsing, quota) — the case still starts, just without a
    // carried-over deadline; never block navigation over this.
  }
}

export function consumePendingDeadlines(): SerializedDeadline[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(PENDING_DEADLINES_KEY);
    if (!raw) return undefined;
    window.sessionStorage.removeItem(PENDING_DEADLINES_KEY);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SerializedDeadline[]) : undefined;
  } catch {
    return undefined;
  }
}

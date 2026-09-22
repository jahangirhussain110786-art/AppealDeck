/**
 * AA-40 (AM-26): the clock speaks first.
 *
 * The product stored `reminderAt` and computed `reminderDue`, and then never told anyone. Nothing
 * in the repo delivered a reminder; the only scheduled job sent purchase receipts. A seller's case
 * sat silent until they happened to open the dashboard, which is the opposite of what an agency
 * does and the founder's exact complaint: "nothing ever speaks first".
 *
 * This module is the deterministic half — it decides what is due and what moved while the seller
 * was away. It is pure: no storage, no network, no `Date.now()` (the caller passes `now`), so every
 * case below is directly testable.
 *
 * Honest scope, stated because it would otherwise be easy to oversell: **nothing about a case
 * changes while the seller is away.** The case file is local and Amazon does not talk to us. What
 * changes is the passage of time against dates the seller themselves set. So "since you were here"
 * reports what the clock did, never a pretend update from Amazon.
 */

import type { ViolationKind } from "./violationKinds";
import type { CaseState } from "./caseState";

export type ClockUrgency = "overdue" | "today" | "soon" | "scheduled";

export type ClockSource = "reminder" | "deadline" | "third_party";

/** Days ahead that still counts as "soon" rather than merely scheduled. */
export const SOON_WINDOW_DAYS = 7;

export interface ClockDeadline {
  /** Stable identifier from the deadline engine, e.g. "appeal_window". */
  kind: string;
  label: string;
  /** ISO string, or null when the date could not be established — those are skipped, not guessed. */
  dueAt: string | null;
}

export interface ClockCaseInput {
  caseId: string;
  kind: ViolationKind;
  state: CaseState;
  /** Follow-up date the seller set themselves. */
  reminderAt?: string;
  /** Set when the case is blocked on someone who is not Amazon and not the seller. */
  waitingOn?: { party: string; since: string; followUpAt?: string };
  deadlines?: readonly ClockDeadline[];
  /** When this case was last opened. Absent for a case the seller has never returned to. */
  lastSeenAt?: string;
}

export interface ClockItem {
  caseId: string;
  kind: ViolationKind;
  source: ClockSource;
  /** Plain-language description of what is due. Safe to show verbatim. */
  label: string;
  dueAt: string;
  urgency: ClockUrgency;
  /** Whole days from `now` to `dueAt`. Negative when overdue, 0 on the due day. */
  daysRemaining: number;
  /** True when this crossed into due or overdue since the seller last opened the case. */
  newSinceLastSeen: boolean;
}

export interface ClockBrief {
  /** Everything outstanding, most urgent first. */
  items: ClockItem[];
  /** The subset that became due or overdue while the seller was away. */
  newItems: ClockItem[];
  /** True when at least one item is already overdue. */
  hasOverdue: boolean;
}

const DAY_MS = 86_400_000;

/** Whole days between two instants, counted on calendar days in UTC so a due date is not "1 day
 * away" at one minute past midnight. */
function daysBetween(now: number, due: number): number {
  return Math.floor(due / DAY_MS) - Math.floor(now / DAY_MS);
}

function urgencyFor(daysRemaining: number): ClockUrgency {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining === 0) return "today";
  if (daysRemaining <= SOON_WINDOW_DAYS) return "soon";
  return "scheduled";
}

const URGENCY_ORDER: Record<ClockUrgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  scheduled: 3,
};

function parse(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function buildItem(
  input: ClockCaseInput,
  source: ClockSource,
  label: string,
  dueIso: string,
  now: number,
): ClockItem | null {
  const due = parse(dueIso);
  if (due === null) return null;
  const daysRemaining = daysBetween(now, due);
  const lastSeen = parse(input.lastSeenAt);
  return {
    caseId: input.caseId,
    kind: input.kind,
    source,
    label,
    dueAt: new Date(due).toISOString(),
    urgency: urgencyFor(daysRemaining),
    daysRemaining,
    // "New" means it came due in the gap. A seller who has never opened the case sees nothing
    // marked new, because everything would be — which is noise, not news.
    newSinceLastSeen: daysRemaining <= 0 && lastSeen !== null && due > lastSeen,
  };
}

/**
 * Builds the brief for one case. Terminal cases produce nothing: a reinstated or closed case has
 * no clock left to run, and chasing a seller about a case they have already won is the kind of
 * thing that makes a product feel automated rather than attentive.
 */
export function clockItemsForCase(input: ClockCaseInput, now: number): ClockItem[] {
  if (input.state === "APPROVED" || input.state === "CLOSED") return [];

  const items: ClockItem[] = [];

  if (input.reminderAt) {
    const item = buildItem(input, "reminder", "Your follow-up reminder", input.reminderAt, now);
    if (item) items.push(item);
  }

  if (input.waitingOn?.followUpAt) {
    const item = buildItem(
      input,
      "third_party",
      `Chase ${input.waitingOn.party}`,
      input.waitingOn.followUpAt,
      now,
    );
    if (item) items.push(item);
  }

  for (const deadline of input.deadlines ?? []) {
    // A deadline with no established date is skipped rather than shown with a guessed one. The
    // decoder deliberately returns null when a notice does not state a date (AM-03).
    if (!deadline.dueAt) continue;
    const item = buildItem(input, "deadline", deadline.label, deadline.dueAt, now);
    if (item) items.push(item);
  }

  return items;
}

/** Builds the whole-account brief across every case, most urgent first. */
export function buildClockBrief(cases: readonly ClockCaseInput[], now: number): ClockBrief {
  const items = cases
    .flatMap((c) => clockItemsForCase(c, now))
    .sort((a, b) => {
      const byUrgency = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      if (byUrgency !== 0) return byUrgency;
      return a.daysRemaining - b.daysRemaining;
    });

  return {
    items,
    newItems: items.filter((i) => i.newSinceLastSeen),
    hasOverdue: items.some((i) => i.urgency === "overdue"),
  };
}

/**
 * One plain sentence for an item. Kept here rather than in a component so the same wording is used
 * by the dashboard, the email, and any future surface — a reminder that says one thing on screen
 * and another in an email reads as two different products.
 */
export function describeClockItem(item: ClockItem): string {
  const { label, daysRemaining } = item;
  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);
    return `${label} — ${days} ${days === 1 ? "day" : "days"} ago`;
  }
  if (daysRemaining === 0) return `${label} — today`;
  if (daysRemaining === 1) return `${label} — tomorrow`;
  return `${label} — in ${daysRemaining} days`;
}

/** The single most urgent thing, or null when nothing is outstanding. */
export function mostUrgent(brief: ClockBrief): ClockItem | null {
  return brief.items[0] ?? null;
}

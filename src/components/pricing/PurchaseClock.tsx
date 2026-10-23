"use client";

import { CalendarClock } from "lucide-react";
import { formatDay } from "@/core/noticeDate";
import { formatRelativeToDay } from "@/lib/format";

/**
 * The seller's own Amazon deadline, shown beside the buy button (23 Oct 2026). It is real urgency:
 * the date comes from the notice (or the one the seller entered from Account Health) and is counted
 * on their calendar. It appears only while the date is still ahead and only when the case has one;
 * `upcomingDeadline` returns null for a window with no stated date, so nothing here is ever guessed
 * or reset. It states the date and what is left, and promises nothing about the outcome.
 */
export function PurchaseClock({
  deadline,
  now = new Date(),
}: {
  deadline: { label: string; day: string } | null | undefined;
  now?: Date;
}) {
  if (!deadline) return null;
  return (
    <p
      className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground"
      data-testid="purchase-clock"
    >
      <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      <span>
        <span className="font-medium">{deadline.label}:</span>{" "}
        <span className="tabular-nums">
          {formatDay(deadline.day)}, {formatRelativeToDay(deadline.day, now)}
        </span>
        <span className="block text-xs text-muted-foreground">
          The date from your notice. Amazon decides what happens after it.
        </span>
      </span>
    </p>
  );
}

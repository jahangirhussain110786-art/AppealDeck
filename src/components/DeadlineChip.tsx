"use client";

import { useMemo } from "react";
import { CalendarClock, CircleAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { daysUntilDay, formatDate, formatRelativeDays, formatRelativeToDay } from "@/lib/format";
import { formatDay } from "@/core/noticeDate";
import type { Deadline } from "@/core";

type Tone = "neutral" | "warn" | "destructive" | "info";

/**
 * A core `Deadline` whose `dueAt` may still be an ISO string — the shape it has after a JSON
 * round trip through `/api/decode` or the vault. The chip normalises it; callers need not.
 */
export type DeadlineLike = Omit<Deadline, "dueAt"> & { dueAt: Date | string | null };

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Days left: on the calendar when the notice gave the day, otherwise from the stored instant. */
function daysLeft(deadline: DeadlineLike, dueAt: Date | null, now: Date): number | null {
  if (deadline.dueOn) return daysUntilDay(deadline.dueOn, now);
  if (!dueAt) return null;
  return Math.round((dueAt.getTime() - now.getTime()) / 86_400_000);
}

function toneFor(days: number | null, kind: Deadline["kind"]): Tone {
  if (kind === "funds_review" || kind === "indefinite_hold") return "info";
  if (kind === "funds_appeal_eligible") return "info";
  if (kind === "seller_challenge") return "info";
  if (days === null) return "neutral";
  if (days < 0) return "destructive";
  if (days <= 3) return "warn";
  return "neutral";
}

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-surface-2 text-foreground",
  warn: "border-warning/40 bg-warning/10 text-foreground",
  destructive: "border-destructive/40 bg-destructive/10 text-foreground",
  info: "border-info/40 bg-info/10 text-foreground",
};

const toneIcon: Record<Tone, React.ComponentType<{ className?: string }>> = {
  neutral: CalendarClock,
  warn: CircleAlert,
  destructive: CircleAlert,
  info: Info,
};

export interface DeadlineChipProps {
  deadline: DeadlineLike;
  now?: Date;
  className?: string;
}

const toneIconColor: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  warn: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

function DeadlineChipContent({ deadline, now }: { deadline: DeadlineLike; now: Date }) {
  const dueAt = toDate(deadline.dueAt);
  const tone = toneFor(daysLeft(deadline, dueAt, now), deadline.kind);
  const Icon = toneIcon[tone];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs",
        toneClasses[tone],
      )}
      data-tn
    >
      <Icon className={cn("size-4 shrink-0", toneIconColor[tone])} aria-hidden />
      <div className="flex flex-col text-left">
        <span className="font-medium text-foreground">{deadline.label}</span>
        {/*
          The notice says how long, not since when. Shown as a plain instruction rather than
          "Date not stated", which would read as though Amazon had given no window at all — and
          rather than a countdown, which would need a start date we do not have.
        */}
        {deadline.startsOnReceipt && !dueAt ? (
          <span className="text-muted-foreground">From the day you received this notice</span>
        ) : deadline.dueOn ? (
          // The day as the notice gives it. Formatting `dueAt` instead would show the day before
          // to anyone west of Greenwich, since it is midnight UTC on this day.
          <span className="tabular-nums text-muted-foreground">
            {formatDay(deadline.dueOn)} · {formatRelativeToDay(deadline.dueOn, now)}
          </span>
        ) : (
          <span className="tabular-nums text-muted-foreground">
            {formatDate(dueAt) || "Date not stated"} · {formatRelativeDays(dueAt, now)}
          </span>
        )}
      </div>
    </div>
  );
}

function caveatFor(deadline: DeadlineLike): string | null {
  const kind = deadline.kind;
  if (deadline.setBy === "seller") return "The date you entered from Account Health.";
  // Where to find the start date, pointed at the notice's own date rather than the day the seller
  // happened to open it — a window counted from a later day would end later than Amazon's does.
  if (kind === "appeal_window" && deadline.startsOnReceipt) {
    return "Check the date on Amazon's email or in Account Health. The window runs from that day.";
  }
  if (kind === "appeal_window" && deadline.startsOn) {
    return "Counted from the date shown on your notice.";
  }
  if (kind === "appeal_window" && deadline.dueOn) {
    return "The date your notice gives. If Account Health shows a different one, go by Account Health.";
  }
  if (kind === "funds_review") {
    return "Typical, not automatic. The 90-day checkpoint is a review, not an automatic release.";
  }
  if (kind === "funds_appeal_eligible") {
    return "Funds appeal becomes available at this point. Submit when you can include evidence.";
  }
  if (kind === "indefinite_hold") {
    return "Severity-gated - no countdown. Routed to professional help rather than self-serve.";
  }
  if (kind === "seller_challenge") {
    return "Account Health Assurance only: 3 uses per 180 days, ~48h decision.";
  }
  return null;
}

export function DeadlineChip({ deadline, now, className }: DeadlineChipProps) {
  const at = useMemo(() => now ?? new Date(), [now]);
  const caveat = caveatFor(deadline);

  const inner = (
    <div className={cn("inline-flex items-center", className)}>
      <DeadlineChipContent deadline={deadline} now={at} />
    </div>
  );

  if (!caveat) return inner;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block cursor-help">{inner}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left text-xs">
          <p className="font-medium">Rule: {deadline.label}</p>
          <p className="mt-1 text-muted-foreground">{caveat}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DeadlineChipList({
  deadlines,
  now,
  className,
}: {
  deadlines: DeadlineLike[];
  now?: Date;
  className?: string;
}) {
  if (deadlines.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {deadlines.map((d, i) => (
        <DeadlineChip key={`${d.kind}-${i}`} deadline={d} now={now} />
      ))}
    </div>
  );
}

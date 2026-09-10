"use client";

import { useMemo } from "react";
import { CalendarClock, CircleAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeDays } from "@/lib/format";
import type { Deadline } from "@/core";

type Tone = "neutral" | "warn" | "destructive" | "info";

function toneFor(dueAt: Date | null, now: Date, kind: Deadline["kind"]): Tone {
  if (kind === "funds_review" || kind === "indefinite_hold") return "info";
  if (kind === "funds_appeal_eligible") return "info";
  if (kind === "seller_challenge") return "info";
  if (!dueAt) return "neutral";
  const days = Math.round((dueAt.getTime() - now.getTime()) / 86_400_000);
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
  deadline: Deadline;
  now?: Date;
  className?: string;
}

const toneIconColor: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  warn: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

function DeadlineChipContent({ deadline, now }: { deadline: Deadline; now: Date }) {
  const tone = toneFor(deadline.dueAt, now, deadline.kind);
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
        <span className="tabular-nums text-muted-foreground">
          {formatDate(deadline.dueAt) || "Date not stated"} ·{" "}
          {formatRelativeDays(deadline.dueAt, now)}
        </span>
      </div>
    </div>
  );
}

function caveatFor(kind: Deadline["kind"]): string | null {
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
  const caveat = caveatFor(deadline.kind);

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
  deadlines: Deadline[];
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

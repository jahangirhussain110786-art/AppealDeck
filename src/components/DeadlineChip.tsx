"use client";

import { useMemo } from "react";
import { CalendarClock, CircleAlert, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Deadline } from "@/core";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatAbsolute(dueAt: Date | null): string {
  if (!dueAt) return "Date not stated";
  return dateFmt.format(dueAt);
}

function formatRelative(dueAt: Date | null, now: Date): string {
  if (!dueAt) return "verify in your Account Health dashboard";
  const ms = dueAt.getTime() - now.getTime();
  const days = Math.round(ms / 86_400_000);
  if (days > 1) return `in ${days} days`;
  if (days === 1) return "tomorrow";
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}

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

function DeadlineChipContent({ deadline, now }: { deadline: Deadline; now: Date }) {
  const tone = toneFor(deadline.dueAt, now, deadline.kind);
  const Icon = toneIcon[tone];
  const caveat = caveatFor(deadline.kind);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
        toneClasses[tone],
      )}
      data-tn
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex flex-col text-left">
        <span className="font-medium text-foreground">{deadline.label}</span>
        <span className="text-muted-foreground">
          {formatAbsolute(deadline.dueAt)} | {formatRelative(deadline.dueAt, now)}
        </span>
      </div>
    </div>
  );
}

function caveatFor(kind: Deadline["kind"]): string | null {
  if (kind === "funds_review") {
    return "Typical, not guaranteed. The 90-day checkpoint is a review, not an automatic release.";
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

"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { describeClockItem, type ClockBrief, type ClockItem } from "@/core";
import { APP } from "@/content/app";
import { cn } from "@/lib/utils";
import { DeadlineChipList, type DeadlineLike } from "@/components/DeadlineChip";

/**
 * AA-40: the part of "the clock speaks first" that works with no infrastructure at all.
 *
 * Email reaches a seller who is not here (that is the other half, `/api/jobs/case-reminders`), but
 * it depends on a key and a migration the founder has to apply. This card depends on nothing, and
 * it is what a returning seller sees before anything else on the page.
 *
 * It never invents urgency. Every line is a date the seller set themselves or a date their own
 * notice states, and the footnote says so — implying Amazon had been in touch would be the kind of
 * manufactured pressure D6 rules out. Notice dates joined on 23 Sep 2026; before that the clock
 * accepted them and the dashboard never passed any.
 */
export function ClockBriefCard({
  brief,
  undated = [],
}: {
  brief: ClockBrief | null;
  /**
   * Windows the notice states with no date to count from ("90 days from the day you received
   * this notice"). 25 Sep 2026: these were invisible here, so a case with a live appeal window
   * opened on "Nothing is due" — the one message a seller must never read by mistake.
   */
  undated?: DeadlineLike[];
}) {
  if (!brief) return null;

  const { items, newItems, hasOverdue } = brief;

  if (items.length === 0 && undated.length > 0) {
    return (
      <Card className="border-warning/40">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CalendarClock className="size-5 text-warning" aria-hidden />
          <CardTitle className="text-base">{APP.dashboard.clock.titleUndated}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DeadlineChipList deadlines={undated} />
          <p className="text-sm text-muted-foreground">{APP.dashboard.clock.undatedBody}</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CheckCircle2 className="size-5 text-success" aria-hidden />
          <CardTitle className="text-base">{APP.dashboard.clock.titleClear}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{APP.dashboard.clock.clearBody}</p>
        </CardContent>
      </Card>
    );
  }

  const lead = items[0]!;
  const title =
    lead.urgency === "overdue"
      ? lead.source === "deadline"
        ? APP.dashboard.clock.titleNoticeDatePassed
        : APP.dashboard.clock.titleOverdue
      : lead.urgency === "today"
        ? APP.dashboard.clock.titleDue
        : APP.dashboard.clock.titleUpcoming;
  const Icon = hasOverdue ? AlertTriangle : lead.urgency === "today" ? Clock : CalendarClock;

  return (
    <Card className={cn(hasOverdue && "border-warning/40")}>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Icon className={cn("size-5", hasOverdue ? "text-warning" : "text-primary")} aria-hidden />
        <CardTitle className="text-base">{title}</CardTitle>
        {newItems.length > 0 && (
          <Badge variant="warning">{APP.dashboard.clock.newSinceLastVisit}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {items.map((item) => (
            <ClockRow key={`${item.caseId}-${item.source}-${item.dueAt}`} item={item} />
          ))}
        </ul>
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          {APP.dashboard.clock.sinceNote}
        </p>
      </CardContent>
    </Card>
  );
}

function ClockRow({ item }: { item: ClockItem }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span
        className={cn(
          "font-medium",
          item.urgency === "overdue"
            ? "text-warning"
            : item.urgency === "today"
              ? "text-foreground"
              : "text-muted-foreground",
        )}
      >
        {describeClockItem(item)}
      </span>
      {item.newSinceLastSeen && (
        <Badge variant="outline" className="text-xs">
          {APP.dashboard.clock.newBadgeShort}
        </Badge>
      )}
    </li>
  );
}

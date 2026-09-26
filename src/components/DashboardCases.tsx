"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccentWord } from "@/components/ui/accent-word";
import { StatusPill } from "@/components/workspace/CaseOverview";
import { dashboardHeadline, type CaseSummary } from "@/lib/caseSummary";
import { APP } from "@/content/app";
import { cn } from "@/lib/utils";

const S = APP.dashboard.cases;

/**
 * The dashboard's navy greeting (v5, 26 Sep 2026, prototype dashboard.html): today's date and one
 * sentence about what needs the seller. Until the cases are read it says only "Your cases", so the
 * page never claims nothing is due before it knows.
 */
export function DashboardWelcome({ summaries }: { summaries: CaseSummary[] | null }) {
  const headline = summaries ? dashboardHeadline(summaries) : null;
  return (
    <section
      aria-labelledby="dashboard-today"
      className="next-card dark flex items-center justify-between gap-6 px-6 py-6 text-foreground sm:px-8 sm:py-7"
    >
      <div className="min-w-0">
        {summaries && (
          <p className="text-[0.8125rem] text-muted-foreground">
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
        )}
        <h1
          id="dashboard-today"
          className="mt-1 text-balance text-[clamp(1.5rem,1.2rem+1vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.035em]"
        >
          {headline ? (
            <>
              {headline.lead}
              {headline.accent && (
                <>
                  {" "}
                  <AccentWord className="text-primary">{headline.accent}</AccentWord>
                </>
              )}
            </>
          ) : (
            S.headline.loading
          )}
        </h1>
      </div>
      <Image
        src="/illustrations/step-calendar.svg"
        alt=""
        width={150}
        height={120}
        className="-my-5 hidden h-auto w-[9.375rem] shrink-0 sm:block"
        unoptimized
      />
    </section>
  );
}

/**
 * Every case on this device, one card each. Choosing a card makes it the current case, which is
 * what the rest of the dashboard and the case page then show.
 */
export function DashboardCases({
  summaries,
  busy,
  switching,
  onSelect,
  onReopen,
}: {
  summaries: CaseSummary[];
  busy: boolean;
  switching: string | null;
  onSelect: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const open = summaries.filter((s) => !s.archived);
  const closed = summaries.filter((s) => s.archived);
  const [view, setView] = useState<"open" | "closed">("open");
  const shown = view === "open" ? open : closed;
  return (
    <section aria-labelledby="dashboard-cases" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dashboard-cases" className="text-xl font-semibold tracking-[-0.02em]">
          {S.heading}
        </h2>
        {closed.length > 0 && (
          <div
            role="group"
            aria-label={S.filter}
            className="inline-flex rounded-full bg-muted p-1 text-[0.8125rem] ring-1 ring-inset ring-border"
          >
            {(["open", "closed"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "h-8 rounded-full px-3.5 font-medium transition-colors",
                  view === v
                    ? "bg-surface-1 text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {(v === "open" ? S.open : S.closedTab).replace(
                  "{n}",
                  String(v === "open" ? open.length : closed.length),
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <div role="region" aria-label={S.heading} className="flex flex-col gap-3">
        {shown.length === 0 && (
          <p className="rounded-[18px] bg-card px-5 py-4 text-sm text-muted-foreground ring-1 ring-inset ring-border">
            {view === "open" ? S.noneOpen : S.noneClosed}
          </p>
        )}
        {shown.map((s) =>
          s.archived ? (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-[18px] bg-card px-5 py-4 ring-1 ring-inset ring-border"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{s.title}</span>
                <span className="text-[0.8125rem] text-muted-foreground">{S.closed}</span>
              </span>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onReopen(s.id)}>
                {S.reopen}
              </Button>
            </div>
          ) : (
            <CaseCard
              key={s.id}
              summary={s}
              disabled={busy}
              switching={switching === s.id}
              onSelect={() => onSelect(s.id)}
            />
          ),
        )}
      </div>
    </section>
  );
}

function CaseCard({
  summary: s,
  disabled,
  switching,
  onSelect,
}: {
  summary: CaseSummary;
  disabled: boolean;
  switching: boolean;
  onSelect: () => void;
}) {
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={s.current ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "relative grid w-full grid-cols-[4rem_minmax(0,1fr)_1.125rem] items-center gap-5 overflow-hidden rounded-[18px] bg-card py-4 pl-5 pr-4 text-left shadow-card ring-1 ring-inset transition-shadow hover:shadow-lift disabled:opacity-70 md:grid-cols-[4rem_minmax(0,1fr)_13rem_1.125rem]",
        s.current ? "ring-2 ring-primary/50" : "ring-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          s.status === "act" ? "bg-primary" : "bg-info/60",
        )}
      />
      <Dial summary={s} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2.5">
          <strong className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{s.title}</strong>
          <StatusPill tone={s.status === "act" ? "need" : "new"} dot>
            {s.status === "act" ? S.act : s.waitingAmazon ? S.waitingAmazon : S.waiting}
          </StatusPill>
          {(s.current || switching) && (
            <StatusPill tone="mute">{switching ? S.opening : S.current}</StatusPill>
          )}
        </span>
        <span className="text-sm text-foreground/80">{s.next}</span>
        {s.due && <span className="text-xs text-muted-foreground md:hidden">{s.due.label}</span>}
      </span>
      <span className="hidden flex-col gap-2 md:flex">
        <span className="flex justify-between text-[0.8125rem] tabular-nums text-muted-foreground">
          <span>{S.checklist}</span>
          <span>{S.of.replace("{done}", String(s.done)).replace("{total}", String(s.total))}</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className={cn(
              "block h-full rounded-full",
              s.status === "act" ? "bg-foreground" : "bg-info/70",
            )}
            style={{ width: `${pct}%` }}
          />
        </span>
        {s.due && <span className="text-xs text-muted-foreground">{s.due.label}</span>}
      </span>
      <ChevronRight aria-hidden className="size-[18px] text-muted-foreground/70" />
    </button>
  );
}

/**
 * The ring at the left of a case card. With a stated date it counts the days left, filled by how
 * much of a month remains; a case waiting on someone else shows the waiting drawing; otherwise it
 * shows how far the checklist has got.
 */
function Dial({ summary: s }: { summary: CaseSummary }) {
  if (s.status === "waiting")
    return (
      <span
        aria-hidden
        className="inline-flex size-16 items-center justify-center rounded-full bg-info/10 ring-1 ring-inset ring-info/25"
      >
        <Image src="/illustrations/waiting.svg" alt="" width={38} height={38} unoptimized />
      </span>
    );
  const days = s.due?.days;
  const dated = days !== undefined;
  const fraction = dated ? Math.max(0, Math.min(1, days / 30)) : s.total ? s.done / s.total : 0;
  const c = 2 * Math.PI * 19;
  const label = dated
    ? days <= 0
      ? days === 0
        ? S.today
        : S.past
      : S.days.replace("{n}", String(days))
    : `${s.done}/${s.total}`;
  return (
    <span aria-hidden className="relative inline-flex size-16 items-center justify-center">
      <svg viewBox="0 0 46 46" className="absolute inset-0 size-16 -rotate-90">
        <circle
          cx="23"
          cy="23"
          r="19"
          fill="none"
          strokeWidth="4"
          className={dated ? "stroke-primary/20" : "stroke-muted"}
        />
        <circle
          cx="23"
          cy="23"
          r="19"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          className={dated ? "stroke-primary" : "stroke-foreground"}
        />
      </svg>
      <span className="text-sm font-bold tabular-nums">{label}</span>
    </span>
  );
}

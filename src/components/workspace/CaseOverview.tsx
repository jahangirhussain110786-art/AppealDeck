"use client";

import { Fragment, type ReactNode } from "react";
import { ChevronRight, CircleDot, Mail, Send, Circle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDay } from "@/core";
import { formatDate } from "@/lib/format";
import { replyCriticisms } from "@/core/replyFeedback";
import type { Requirement, Workspace } from "@/core/workspace";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * The case overview in the v5 layout (26 Sep 2026, docs/handoffs/2026-09-26-prototype-v5/case.html):
 * one navy card for the next step, one checklist, and the case's story on the side. Every line is
 * the seller's own case data; the prototype's sample invoice and dates are never rendered.
 */

export type PillTone = "need" | "new" | "ok" | "mute";

const PILL: Record<PillTone, string> = {
  need: "bg-primary/10 text-primary",
  new: "bg-info/10 text-info",
  ok: "bg-success/10 text-success",
  mute: "bg-muted text-foreground/80",
};

export function StatusPill({
  tone,
  dot = false,
  children,
  className,
}: {
  tone: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[0.71875rem] font-semibold",
        PILL[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** The navy card at the top of the case: what to do next, why, and the way in. */
export function NextStepCard({
  due,
  title,
  body,
  actions,
  aside,
}: {
  due?: string;
  title: string;
  body: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="case-next-step"
      className={cn(
        "next-card dark grid items-center gap-6 p-6 text-foreground sm:p-7",
        aside && "md:grid-cols-[minmax(0,1fr)_16rem]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-primary/25 px-2.5 text-[0.71875rem] font-semibold text-primary">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {C.overview.nextStep}
          </span>
          {due && (
            <span className="text-[0.8125rem] tabular-nums text-muted-foreground">{due}</span>
          )}
        </div>
        <h2
          id="case-next-step"
          className="text-balance text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.035em]"
        >
          {title}
        </h2>
        <p className="max-w-[34em] text-[0.95rem] leading-relaxed text-muted-foreground">{body}</p>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
      {aside}
    </section>
  );
}

/**
 * The paper card beside the next step: the record it is about, quoted from Amazon, with the file
 * the seller has linked so far. Tilted a little, as in the prototype, and hidden from assistive
 * technology because the checklist below says the same thing in order.
 */
export function NextRecordPaper({ requirement }: { requirement: Requirement }) {
  return (
    <div
      aria-hidden
      className="light hidden rotate-[1.5deg] flex-col gap-2 rounded-[14px] bg-surface-1 p-4 text-xs text-foreground shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] md:flex"
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="text-[0.8125rem] leading-snug">{requirement.label}</strong>
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
      {requirement.sourceQuote && (
        <p className="line-clamp-3 rounded-md bg-primary/10 px-2 py-1.5 font-accent text-[0.8125rem] italic leading-snug ring-1 ring-inset ring-primary/40">
          “{requirement.sourceQuote}”
        </p>
      )}
      <div
        className={cn(
          "flex justify-between rounded-md px-2 py-1.5 font-medium ring-1 ring-inset",
          requirement.filename
            ? "bg-success/10 text-success ring-success/40"
            : "bg-muted text-muted-foreground ring-border",
        )}
      >
        <span className={cn("truncate", requirement.filename && "font-mono")}>
          {requirement.filename ?? C.overview.noFile}
        </span>
      </div>
    </div>
  );
}

export interface ChecklistRow {
  id: string;
  title: string;
  sub?: string;
  tone: "ok" | "need" | "new" | "todo";
  pill: { tone: PillTone; label: string; dot?: boolean };
  detail?: string;
  mono?: boolean;
  onOpen: () => void;
}

export function CaseChecklist({ rows }: { rows: ChecklistRow[] }) {
  const done = rows.filter((r) => r.tone === "ok").length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
  return (
    <section
      aria-labelledby="case-checklist"
      className="overflow-hidden rounded-[18px] bg-card shadow-card ring-1 ring-inset ring-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 id="case-checklist" className="text-[0.9375rem] font-semibold">
          {C.overview.checklist}
        </h2>
        <span className="flex items-center gap-2.5 text-[0.8125rem] tabular-nums text-muted-foreground">
          {C.overview.done.replace("{done}", String(done)).replace("{total}", String(rows.length))}
          <span
            role="progressbar"
            aria-label={C.overview.checklist}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:w-[7.5rem]"
          >
            <span
              className="block h-full rounded-full bg-foreground"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={row.onOpen}
              className={cn(
                "grid w-full grid-cols-[1.375rem_minmax(0,1fr)_auto_1.25rem] items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[1.375rem_minmax(0,1fr)_9.5rem_7rem_1.25rem]",
                row.tone === "need" && "bg-primary/[0.035]",
              )}
            >
              <span className="check-mark" data-tone={row.tone} aria-hidden />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block",
                    row.tone === "ok" ? "font-medium text-foreground/80" : "font-semibold",
                  )}
                >
                  {row.title}
                </span>
                {row.sub && (
                  <span className="block truncate text-[0.8125rem] text-muted-foreground">
                    {row.sub}
                  </span>
                )}
              </span>
              <span>
                <StatusPill tone={row.pill.tone} dot={row.pill.dot}>
                  {row.pill.label}
                </StatusPill>
              </span>
              <span
                className={cn(
                  "hidden truncate text-xs text-muted-foreground sm:block",
                  row.mono && "font-mono",
                )}
              >
                {row.detail ?? "—"}
              </span>
              <ChevronRight aria-hidden className="size-4 text-muted-foreground/70" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface TimelineDeadline {
  text: string;
  hot: boolean;
}

/**
 * The case's story, newest first: what is due, what Amazon said, what the seller sent, and when
 * the case began. A reply is represented by Amazon's own first objection, quoted exactly.
 */
export function CaseTimeline({
  workspace,
  createdAt,
  deadlines,
  action,
  children,
}: {
  workspace: Workspace;
  createdAt?: string;
  deadlines: TimelineDeadline[];
  action?: ReactNode;
  children?: ReactNode;
}) {
  type Event = { key: string; at: string; node: ReactNode };
  const events: Event[] = [];
  workspace.replies.forEach((reply) => {
    const quote = replyCriticisms(reply.text)[0];
    events.push({
      key: `reply-${reply.id}`,
      at: reply.at,
      node: (
        <Item icon={<Mail className="size-2.5" />} title={C.overview.timeline.replied}>
          {quote && (
            <span className="block font-accent text-[0.90625rem] italic text-foreground/85">
              “{quote}”
            </span>
          )}
          <When>{formatDate(reply.at)}</When>
        </Item>
      ),
    });
  });
  let sent = 0;
  workspace.submissions.forEach((submission) => {
    const prior = submission.source === "prior";
    if (!prior) sent += 1;
    events.push({
      key: `sent-${submission.id}`,
      at: submission.at,
      node: (
        <Item
          icon={<Send className="size-2.5" />}
          title={
            prior
              ? C.overview.timeline.prior
              : C.overview.timeline.sent.replace("{n}", String(sent))
          }
        >
          <When>{formatDate(submission.at)}</When>
        </Item>
      ),
    });
  });
  events.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section
      aria-labelledby="case-timeline"
      className="overflow-hidden rounded-[18px] bg-card shadow-card ring-1 ring-inset ring-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 id="case-timeline" className="text-[0.9375rem] font-semibold">
          {C.overview.timeline.title}
        </h2>
        {action}
      </div>
      <ol className="case-timeline px-5 pb-4 pt-2">
        {deadlines.length === 0 ? (
          <Item icon={<CircleDot className="size-2.5" />} title={C.overview.timeline.noDeadline} />
        ) : (
          deadlines.map((d) => (
            <Item
              key={d.text}
              hot={d.hot}
              icon={<CircleDot className="size-2.5" />}
              title={d.text}
            />
          ))
        )}
        {events.map((e) => (
          <Fragment key={e.key}>{e.node}</Fragment>
        ))}
        {createdAt && (
          <Item icon={<Circle className="size-2.5" />} title={C.overview.timeline.started}>
            <When>{formatDay(createdAt.slice(0, 10))}</When>
          </Item>
        )}
      </ol>
      {children && <div className="border-t border-border px-5 py-4">{children}</div>}
    </section>
  );
}

function Item({
  icon,
  title,
  hot = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  hot?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[1.125rem_minmax(0,1fr)] gap-3 py-2.5 text-[0.84375rem]">
      <span
        aria-hidden
        className={cn(
          "mt-px inline-flex size-[18px] items-center justify-center rounded-full ring-1 ring-inset",
          hot
            ? "bg-primary/10 text-primary ring-primary/40"
            : "bg-muted text-foreground/70 ring-border",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="font-semibold">{title}</strong>
        {children}
      </span>
    </li>
  );
}

function When({ children }: { children: ReactNode }) {
  return <span className="block text-xs text-muted-foreground">{children}</span>;
}

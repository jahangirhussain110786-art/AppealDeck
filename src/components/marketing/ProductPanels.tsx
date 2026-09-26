import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { HOME } from "@/content/marketing";
import { cn } from "@/lib/utils";

/*
 * Product visuals for the public pages (v5, 26 Sep 2026). Everything here is sample data drawn
 * with the app's own tokens and badges, and each composition is labelled as a sample for screen
 * readers. They are pictures of the product, not claims about any seller's case.
 */

type Mark = "need" | "new" | "ok" | "todo";

export function CheckMark({ state, className }: { state: Mark; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
        state === "ok" && "bg-success",
        state === "need" && "ring-2 ring-inset ring-primary",
        state === "new" && "ring-2 ring-inset ring-info",
        state === "todo" && "ring-[1.5px] ring-inset ring-input",
        className,
      )}
    >
      {state === "ok" && (
        <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="white" strokeWidth={4}>
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function Ring({ size = 46, tone = "orange" }: { size?: number; tone?: "orange" | "stage" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden className="-rotate-90">
      <circle
        cx="23"
        cy="23"
        r="19"
        fill="none"
        strokeWidth="5"
        className={tone === "stage" ? "stroke-white/15" : "stroke-primary/25"}
      />
      <circle
        cx="23"
        cy="23"
        r="19"
        fill="none"
        className="stroke-[hsl(var(--action-hi))]"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="119.4"
        strokeDashoffset="29"
      />
    </svg>
  );
}
export { Ring as CountdownRing };

function Row({
  state,
  title,
  meta,
  hot,
}: {
  state: Mark;
  title: string;
  meta?: ReactNode;
  hot?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 border-b border-border/70 px-3.5 py-2.5 last:border-b-0",
        hot && "bg-primary/[0.05]",
      )}
    >
      <CheckMark state={state} />
      <span
        className={cn(
          "flex-1 truncate",
          state === "ok" ? "text-muted-foreground" : "font-semibold text-foreground",
        )}
      >
        {title}
      </span>
      {meta}
    </div>
  );
}

/** The hero composition: the case workspace in a browser frame, with three floating details. */
export function HeroComposition() {
  const c = HOME.composition;
  return (
    <div className="light relative mx-auto w-full max-w-[40rem] text-[13px] leading-snug text-foreground lg:mt-2">
      <p className="sr-only">{c.label}</p>
      <div aria-hidden className="relative pt-6">
        <div className="window-frame">
          <div className="window-bar">
            <i />
            <i />
            <i />
            <span className="ml-3 inline-flex h-6 items-center rounded-md bg-card px-3 text-xs text-muted-foreground ring-1 ring-inset ring-border">
              appealdeck.com/case
            </span>
          </div>
          <div className="flex">
            <div className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-surface-2 p-2.5 sm:flex">
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold text-muted-foreground">
                Cases
              </p>
              <span className="flex h-7 items-center justify-between rounded-md bg-muted px-2 font-semibold">
                Inauthentic item <Badge size="sm">2d</Badge>
              </span>
              <span className="flex h-7 items-center justify-between px-2 text-muted-foreground">
                Held funds{" "}
                <Badge size="sm" variant="secondary">
                  Sent
                </Badge>
              </span>
              <p className="px-2 pb-1 pt-3 text-[11px] font-semibold text-muted-foreground">
                This case
              </p>
              {["Checklist", "Response", "Replies", "Files"].map((l) => (
                <span key={l} className="flex h-7 items-center px-2 text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-muted-foreground">case_7f3a · US</p>
                  <p className="truncate text-base font-semibold tracking-tight">
                    Inauthentic item · Northline Trading
                  </p>
                </div>
                <Badge size="sm">Due Mon 28 Sep</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/[0.06] px-4 py-3 ring-1 ring-inset ring-primary/20">
                <div>
                  <p className="text-[11px] font-semibold text-primary">{c.nextStep}</p>
                  <p className="font-semibold">{c.nextAction}</p>
                </div>
                <span className="btn-action inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold">
                  {c.start}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-border">
                <div className="flex justify-between border-b border-border/70 px-3.5 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.checklist}</span>
                  <span className="tabular-nums">4 of 7</span>
                </div>
                <Row
                  state="need"
                  title="Supplier invoices, both ASINs"
                  hot
                  meta={<Badge size="sm">Asked again</Badge>}
                />
                <Row
                  state="new"
                  title="Proof of delivery"
                  meta={
                    <Badge size="sm" variant="info">
                      New
                    </Badge>
                  }
                />
                <Row
                  state="ok"
                  title="Root cause, in your words"
                  meta={<span className="text-[11px] text-muted-foreground">Kept</span>}
                />
                <Row
                  state="ok"
                  title="Prevention steps, dated"
                  meta={<span className="text-[11px] text-muted-foreground">Kept</span>}
                />
                <Row state="todo" title="Write and check your response" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -left-4 bottom-2 hidden w-60 items-center gap-3.5 rounded-2xl bg-card p-4 shadow-stage sm:flex lg:-left-10">
          <Ring />
          <div>
            <p className="text-[11px] font-semibold text-primary">{c.dueIn}</p>
            <p className="text-2xl font-semibold leading-tight tracking-tight tabular-nums">
              1d 19h
            </p>
            <p className="text-[11px] text-muted-foreground">{c.reminder}</p>
          </div>
        </div>

        <div className="absolute -right-3 bottom-16 hidden w-64 rounded-2xl bg-card p-3.5 shadow-stage md:block lg:-right-8">
          <p className="border-b border-border/70 pb-2.5 font-mono text-[11px] text-muted-foreground">
            inv_0412.pdf
          </p>
          <div className="flex flex-col gap-2 pt-2.5">
            <span className="flex items-center justify-between">
              Date · 196 days old{" "}
              <Badge size="sm" variant="success">
                Found
              </Badge>
            </span>
            <span className="flex items-center justify-between">
              Your business name{" "}
              <Badge size="sm" variant="success">
                Found
              </Badge>
            </span>
            <span className="flex items-center justify-between">
              ASINs · 1 of 2 <Badge size="sm">Missing</Badge>
            </span>
          </div>
        </div>

        <div className="absolute right-6 top-0 hidden items-center gap-2.5 rounded-full bg-card px-3.5 py-2 text-xs shadow-stage md:flex">
          <span className="size-2 rounded-full bg-primary" />
          <strong>{c.replied}</strong>
          <span className="text-muted-foreground">{c.repliedDetail}</span>
        </div>
      </div>
    </div>
  );
}

/** Panel 2: the case checklist. */
export function ChecklistPanel() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-lift" aria-label="Sample checklist">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <strong className="text-[15px]">What this case needs</strong>
        <span className="text-sm tabular-nums text-muted-foreground">2 of 4</span>
      </div>
      <div className="text-[14.5px]">
        <Row
          state="ok"
          title="Supplier invoices, under 365 days"
          meta={<span className="font-mono text-xs text-muted-foreground">inv_0412.pdf</span>}
        />
        <Row
          state="ok"
          title="Root cause, in your words"
          meta={<span className="text-xs text-muted-foreground">312 words</span>}
        />
        <Row
          state="need"
          title="Prevention steps, each dated"
          hot
          meta={<Badge size="sm">Next</Badge>}
        />
        <Row
          state="todo"
          title="Supplier contact details"
          meta={
            <Badge size="sm" variant="secondary">
              Often asked next
            </Badge>
          }
        />
      </div>
    </div>
  );
}

/** Panel 3: a document checked against the notice. */
export function DocumentPanel() {
  const hl = "rounded-md px-2 py-1.5";
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2" aria-label="Sample document check">
      <div className="flex -rotate-1 flex-col gap-2.5 rounded-xl bg-card p-5 text-[12.5px] text-muted-foreground shadow-lift">
        <div className="flex justify-between text-foreground">
          <strong>Harbor Goods Ltd</strong>
          <strong>INVOICE 0412</strong>
        </div>
        <div className={cn(hl, "bg-success/10 ring-1 ring-inset ring-success/40")}>
          Issued 14 March 2026
        </div>
        <div className={cn(hl, "bg-success/10 ring-1 ring-inset ring-success/40")}>
          Bill to: Northline Trading LLC
        </div>
        <div className={cn(hl, "font-mono bg-success/10 ring-1 ring-inset ring-success/40")}>
          B0SAMPLE01 · 40 · $1,120
        </div>
        <div
          className={cn(
            hl,
            "bg-primary/[0.06] font-semibold text-primary ring-1 ring-inset ring-primary/40",
          )}
        >
          B0SAMPLE02 not on this invoice
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-card shadow-lift text-sm">
        <p className="border-b border-border/70 px-4 py-3 text-muted-foreground">
          Checked against the notice
        </p>
        {[
          ["Invoice date", "Found", "success"],
          ["Your business name", "Found", "success"],
          ["Both ASINs", "1 of 2", "default"],
          ["Supplier phone", "Not found", "secondary"],
        ].map(([k, v, tone]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-border/70 px-4 py-3 last:border-b-0"
          >
            <span>{k}</span>
            <Badge size="sm" variant={tone as "success" | "default" | "secondary"}>
              {v}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Panel 4: what Amazon's reply changed. */
export function RepliesPanel() {
  const tiles: [string, string, string][] = [
    ["1", "Asked again", "bg-primary/[0.07] text-primary"],
    ["1", "New", "bg-info/10 text-info"],
    ["0", "Still open", "bg-muted text-muted-foreground"],
    ["3", "Kept", "bg-success/10 text-success"],
  ];
  return (
    <div className="rounded-2xl bg-card p-5 shadow-lift sm:p-6" aria-label="Sample reply summary">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-[15px]">Amazon&apos;s reply of Thu 24 Sep</strong>
        <Badge size="sm" variant="secondary">
          Not a final decision
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map(([n, l, cls]) => (
          <div key={l} className={cn("rounded-xl p-4", cls)}>
            <p className="text-3xl font-semibold leading-none tabular-nums">{n}</p>
            <p className="mt-1.5 text-sm text-foreground">{l}</p>
          </div>
        ))}
      </div>
      <blockquote className="mt-4 rounded-xl px-4 py-3 ring-1 ring-inset ring-border">
        <p className="text-xs text-muted-foreground">Amazon wrote</p>
        <p className="mt-1 font-accent text-base italic text-foreground">
          &ldquo;The invoice provided does not meet our requirements.&rdquo;
        </p>
      </blockquote>
    </div>
  );
}

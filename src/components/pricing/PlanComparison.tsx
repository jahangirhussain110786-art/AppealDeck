import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccentWord } from "@/components/ui/accent-word";
import { HOME, PRICING } from "@/content/marketing";
import { PRODUCTS } from "@/content/purchases";
import { listedPaidPlans } from "@/lib/plans";
import { splitAccent } from "@/lib/splitAccent";
import { cn } from "@/lib/utils";

type ColumnKey = "free" | "single" | "pass" | "accountPass";

type Column = {
  key: ColumnKey;
  name: string;
  price: string;
  featured?: boolean;
};

/**
 * The detail table behind the plan cards (24 Oct 2026). Rows are grouped by the work a case moves
 * through and say what the seller ends up with, not which switch a plan flips. The four things every
 * plan includes sit above the table, so the free column reads as a real starting point; the table
 * below spends its rows on what actually changes. Column availability and order come from
 * `listedPaidPlans()`, the same source as the cards and the fit strip.
 */
export function PlanComparison() {
  const [free, single, pass] = HOME.plans.items;
  const listed = listedPaidPlans();
  const title = splitAccent(PRICING.compareTitle, PRICING.compareAccent);

  const columns: Column[] = [
    { key: "free", name: PRICING.tableHeadings.free, price: free.price },
    ...(listed.includes("single")
      ? [{ key: "single" as const, name: PRICING.tableHeadings.single, price: single.price }]
      : []),
    {
      key: "pass",
      name: PRICING.tableHeadings.pass,
      price: pass.price,
      featured: true,
    },
    ...(listed.includes("account")
      ? [
          {
            key: "accountPass" as const,
            name: PRICING.tableHeadings.accountPass,
            price: PRICING.account.price,
          },
        ]
      : []),
  ];

  return (
    <section id="compare" aria-labelledby="compare-title" className="scroll-mt-24 py-16">
      <h2
        id="compare-title"
        className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
      >
        {title ? (
          <>
            {title.pre}
            <AccentWord className="text-primary-ink">{title.accent}</AccentWord>
            {title.post}
          </>
        ) : (
          PRICING.compareTitle
        )}
      </h2>
      <p className="mt-3 max-w-prose text-lg text-muted-foreground">{PRICING.compareLead}</p>

      <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
        <p className="text-eyebrow text-muted-foreground">{PRICING.compareEveryPlan.label}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING.compareEveryPlan.items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-success"
                strokeWidth={3.5}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 hidden sm:block">
        <Card className="overflow-hidden rounded-[20px] p-0 shadow-lift">
          <Table aria-label={PRICING.compareTitle} className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 w-[38%] min-w-[220px] bg-card">
                  {PRICING.tableHeadings.feature}
                </TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "min-w-[104px] text-center align-top",
                      column.featured && "bg-[hsl(var(--stage-2))] text-white",
                    )}
                  >
                    <span className="block">{column.name}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs font-normal tabular-nums",
                        column.featured ? "text-white/75" : "text-muted-foreground",
                      )}
                    >
                      {column.price}
                    </span>
                    {column.featured && (
                      <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                        {PRODUCTS.recommended}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRICING.compareGroups.map((group) => (
                <ComparisonGroup key={group.label} group={group} columns={columns} />
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <MobileComparison columns={columns} />

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
        <Link href="/decode" className="text-link underline underline-offset-4">
          Decode a notice, free
        </Link>
        <Link href="#purchase" className="text-link underline underline-offset-4">
          {PRICING.jumpToPurchase}
        </Link>
      </div>
    </section>
  );
}

function ComparisonGroup({
  group,
  columns,
}: {
  group: (typeof PRICING.compareGroups)[number];
  columns: Column[];
}) {
  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableHead
          colSpan={columns.length + 1}
          className="bg-muted/50 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          {group.label}
        </TableHead>
      </TableRow>
      {group.rows.map((row) => (
        <TableRow key={row.feature}>
          <TableHead
            scope="row"
            className="sticky left-0 z-10 h-auto max-w-[20rem] bg-card py-3.5 align-top font-medium text-foreground"
          >
            <span className="block">{row.feature}</span>
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
              {row.detail}
            </span>
          </TableHead>
          {columns.map((column) => (
            <TableCell
              key={column.key}
              className={cn("text-center align-top", column.featured && "bg-primary/[0.05]")}
            >
              <ComparisonValue value={row[column.key]} featured={!!column.featured} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function ComparisonValue({
  value,
  featured,
  withText = false,
}: {
  value: string;
  featured: boolean;
  withText?: boolean;
}) {
  if (value === "Yes") {
    if (withText) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Check aria-hidden className="size-3.5 shrink-0 text-success" strokeWidth={3.5} />
          {PRICING.included}
        </span>
      );
    }
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-success/15">
        <Check aria-hidden className="size-3 text-success" strokeWidth={3.5} />
        <span className="sr-only">{PRICING.included}</span>
      </span>
    );
  }
  if (value === "—") {
    if (withText) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Minus aria-hidden className="size-3.5 shrink-0" />
          {PRICING.notIncluded}
        </span>
      );
    }
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-muted">
        <Minus aria-hidden className="size-3 text-muted-foreground" />
        <span className="sr-only">{PRICING.notIncluded}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-block text-xs font-medium leading-snug",
        featured ? "text-foreground" : "text-foreground/85",
      )}
    >
      {value}
    </span>
  );
}

/**
 * The same rows as cards below `sm`, where the table would leave one plan column half off-screen
 * behind a sticky name column (24 Oct 2026). Each feature keeps its detail and lists every plan by
 * name, so a phone reads down one feature at a time instead of scrolling sideways.
 */
function MobileComparison({ columns }: { columns: Column[] }) {
  return (
    <div className="sm:hidden">
      <dl className="mt-6 grid grid-cols-2 gap-2">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              column.featured ? "border-primary/30 bg-primary/[0.06]" : "border-border bg-card",
            )}
          >
            <dt className="text-sm font-semibold tracking-[-0.01em] text-foreground">
              {column.name}
            </dt>
            <dd className="mt-0.5 text-xs tabular-nums text-muted-foreground">{column.price}</dd>
            {column.featured && (
              <dd className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-ink">
                {PRODUCTS.recommended}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-4 space-y-4">
        {PRICING.compareGroups.map((group) => (
          <Card key={group.label} className="overflow-hidden rounded-[20px] p-0 shadow-lift">
            <p className="border-b border-border/70 bg-muted/50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </p>
            {group.rows.map((row) => (
              <div
                key={row.feature}
                className="border-b border-border/70 px-5 py-4 last:border-b-0"
              >
                <p className="text-sm font-medium text-foreground">{row.feature}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>
                <dl className="mt-3 space-y-1">
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        "flex items-start justify-between gap-4 rounded-lg px-3 py-2",
                        column.featured ? "bg-primary/[0.06]" : "bg-muted/40",
                      )}
                    >
                      <dt
                        className={cn(
                          "text-xs font-medium",
                          column.featured ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {column.name}
                      </dt>
                      <dd className="text-right">
                        <ComparisonValue
                          value={row[column.key]}
                          featured={!!column.featured}
                          withText
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

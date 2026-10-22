"use client";

import { PurchasePanel } from "@/components/pricing/PurchasePanel";
import { PRICING } from "@/content/marketing";
import { setPlanChoice, usePlanChoice } from "@/lib/planChoice";
import type { PassPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * The right-hand side of the purchase section: which Pass, the order summary, and the pay button.
 * With only the Appeal Pass on sale (the Account Pass not configured) it is exactly the summary and
 * button /pricing has always had; the picker appears only when there is a second Pass to choose.
 */
/** The order summary for a Pass: its title, its three rows and the total. */
export function orderFor(plan: PassPlan): {
  title: string;
  total: string;
  rows: [string, string, boolean][];
} {
  const order = plan === "account" ? PRICING.account.order : PRICING.order;
  return {
    title: order.title,
    total: order.amount,
    rows: [
      [order.line, order.amount, false],
      [PRICING.order.tax, PRICING.order.taxValue, true],
      [
        PRICING.order.expires,
        plan === "account" ? PRICING.account.order.expiresValue : PRICING.order.expiresValue,
        true,
      ],
    ],
  };
}

export function PurchaseSection({ accountEnabled }: { accountEnabled: boolean }) {
  const choice = usePlanChoice();
  const plan: PassPlan = accountEnabled ? choice : "case";
  const { title, total, rows } = orderFor(plan);
  return (
    <div className="space-y-4">
      {accountEnabled && <PlanPicker plan={plan} />}
      <div className="rounded-[20px] bg-card p-6 shadow-lift ring-1 ring-inset ring-border">
        <p className="pb-3 text-lg font-semibold tracking-[-0.02em]">{title}</p>
        <dl className="divide-y divide-border border-t border-border text-[0.9375rem]">
          {rows.map(([k, v, quiet]) => (
            <div
              key={k}
              className={cn(
                "flex justify-between py-3",
                quiet ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <dt>{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between py-3 text-lg font-semibold">
            <dt>{PRICING.order.total}</dt>
            <dd className="tabular-nums">{total}</dd>
          </div>
        </dl>
        {plan === "account" && (
          <p className="mt-3 text-xs text-muted-foreground">{PRICING.account.fairUse}</p>
        )}
      </div>
      <PurchasePanel plan={plan} />
      <p className="text-center text-[0.84375rem] text-muted-foreground">
        {PRICING.order.paidThrough}
      </p>
    </div>
  );
}

function PlanPicker({ plan }: { plan: PassPlan }) {
  const c = PRICING.account.choice;
  const options: { value: PassPlan; label: string; detail: string; price: string }[] = [
    { value: "case", ...c.case },
    { value: "account", ...c.account },
  ];
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{c.legend}</legend>
      <div className="grid gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 text-sm has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              type="radio"
              name="pass-plan"
              value={o.value}
              checked={plan === o.value}
              onChange={() => setPlanChoice(o.value)}
              className="size-4 accent-[hsl(var(--primary))]"
            />
            <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
              <span>
                <span className="font-medium text-foreground">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.detail}</span>
              </span>
              <span className="font-semibold tabular-nums text-foreground">{o.price}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

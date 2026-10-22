"use client";

import { useState } from "react";
import { PurchasePanel } from "@/components/pricing/PurchasePanel";
import { PRICING } from "@/content/marketing";
import { PRODUCTS } from "@/content/purchases";
import { setPlanChoice, usePlanChoice } from "@/lib/planChoice";
import type { PassPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** The order summary for a product: its title, its rows and the total. */
export function orderFor(
  plan: PassPlan,
  options: { credited?: boolean } = {},
): {
  title: string;
  total: string;
  rows: [string, string, boolean][];
} {
  if (plan === "review") {
    const o = PRODUCTS.review;
    return {
      title: o.order.title,
      total: o.amount,
      rows: [
        [o.order.line, o.amount, false],
        [PRICING.order.tax, PRICING.order.taxValue, true],
        [PRICING.order.expires, o.order.expires, true],
      ],
    };
  }
  if (plan === "case" && options.credited) {
    return {
      title: PRICING.order.title,
      total: PRODUCTS.review.creditedPassAmount,
      rows: [
        [PRICING.order.line, PRICING.order.amount, false],
        [PRODUCTS.review.creditLine, `−${PRODUCTS.review.amount}`, true],
        [PRICING.order.tax, PRICING.order.taxValue, true],
        [PRICING.order.expires, PRICING.order.expiresValue, true],
      ],
    };
  }
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

/**
 * The right-hand side of the purchase section: which product, the order summary, and the pay
 * button. With only the Appeal Pass on sale it is exactly the summary and button /pricing has always
 * had; the picker appears only when there is a second product to choose.
 */
export function PurchaseSection({
  accountEnabled,
  reviewEnabled = false,
}: {
  accountEnabled: boolean;
  reviewEnabled?: boolean;
}) {
  const choice = usePlanChoice();
  // The panel learns from the licence lookup whether this case already has a document review, which
  // takes the review's price off the Appeal Pass.
  const [hasReview, setHasReview] = useState(false);
  const available: PassPlan[] = [
    "case",
    ...(accountEnabled ? (["account"] as const) : []),
    ...(reviewEnabled ? (["review"] as const) : []),
  ];
  const plan: PassPlan = available.includes(choice) ? choice : "case";
  const { title, total, rows } = orderFor(plan, { credited: reviewEnabled && hasReview });
  return (
    <div className="space-y-4">
      {available.length > 1 && <PlanPicker plan={plan} available={available} />}
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
        {plan === "review" && (
          <p className="mt-3 text-xs text-muted-foreground">{PRODUCTS.review.reading}</p>
        )}
      </div>
      <PurchasePanel plan={plan} onReviewState={setHasReview} />
      <p className="text-center text-[0.84375rem] text-muted-foreground">
        {PRICING.order.paidThrough}
      </p>
    </div>
  );
}

function PlanPicker({ plan, available }: { plan: PassPlan; available: PassPlan[] }) {
  const c = PRICING.account.choice;
  const all: Record<string, { label: string; detail: string; price: string }> = {
    case: c.case,
    account: c.account,
    review: {
      label: PRODUCTS.review.name,
      detail: PRODUCTS.review.note,
      price: PRODUCTS.review.price,
    },
  };
  const options = available.map((value) => ({ value, ...all[value]! }));
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">
        {available.includes("review") ? c.legendWithReview : c.legend}
      </legend>
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

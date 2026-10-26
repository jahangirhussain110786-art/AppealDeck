"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { setPlanChoice } from "@/lib/planChoice";
import type { PassPlan } from "@/lib/plans";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/analytics";

/**
 * A plan card's button for a paid Pass. It is a plain link to the purchase section, so it works
 * without script, and it also records which Pass was chosen so the picker beside the pay button
 * already shows it. On a page without that section (the home page) `href` points at /pricing's.
 */
export function PlanCta({
  plan,
  featured,
  children,
  href = "#purchase",
}: {
  plan: PassPlan;
  featured: boolean;
  children: ReactNode;
  href?: string;
}) {
  return (
    <Button asChild size="lg" variant={featured ? "default" : "outline"} className="w-full">
      <a
        href={href}
        onClick={() => {
          setPlanChoice(plan);
          trackFunnelEvent(FUNNEL_EVENTS.planSelected, { plan, where: "card" });
        }}
      >
        {children}
      </a>
    </Button>
  );
}

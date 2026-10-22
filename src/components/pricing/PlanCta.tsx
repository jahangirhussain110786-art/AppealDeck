"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { setPlanChoice } from "@/lib/planChoice";
import type { PassPlan } from "@/lib/plans";

/**
 * A plan card's button for a paid Pass. It is a plain link to the purchase section, so it works
 * without script, and it also records which Pass was chosen so the picker beside the pay button
 * already shows it.
 */
export function PlanCta({
  plan,
  featured,
  children,
}: {
  plan: PassPlan;
  featured: boolean;
  children: ReactNode;
}) {
  return (
    <Button asChild size="lg" variant={featured ? "default" : "outline"} className="w-full">
      <a href="#purchase" onClick={() => setPlanChoice(plan)}>
        {children}
      </a>
    </Button>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import type { PassPlan } from "@/lib/plans";

/**
 * Which Pass the visitor has chosen on /pricing: the cards at the top and the picker beside the pay
 * button both read and set it. It is only what is on screen, kept for this page view and never
 * stored: it starts as the Appeal Pass, so nobody is ever moved to the dearer Pass without choosing it.
 */
let current: PassPlan = "case";
const listeners = new Set<() => void>();

export function setPlanChoice(plan: PassPlan): void {
  if (plan === current) return;
  current = plan;
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function usePlanChoice(): PassPlan {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "case",
  );
}

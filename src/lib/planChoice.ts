"use client";

import { useSyncExternalStore } from "react";
import type { PassPlan } from "@/lib/plans";

/**
 * Which Pass the visitor has chosen on /pricing: the cards at the top and the picker beside the pay
 * button both read and set it. It is only what is on screen, kept for this page view and never
 * stored: it starts as the Appeal Pass, so nobody is ever moved to a dearer product without choosing
 * it. A link may start it on another product (`/pricing?plan=review`, used from inside a case); the
 * page still offers it only if that product is on sale.
 */
const FROM_LINK: readonly PassPlan[] = ["case", "single", "account", "review"];

let current: PassPlan | null = null;
// undefined: not read yet. Read once, on the client, so the server and the first paint agree.
let fromUrl: PassPlan | null | undefined;
const listeners = new Set<() => void>();

function initial(): PassPlan {
  if (fromUrl === undefined) {
    fromUrl = null;
    try {
      const plan = new URLSearchParams(window.location.search).get("plan");
      if (plan && (FROM_LINK as readonly string[]).includes(plan)) fromUrl = plan as PassPlan;
    } catch {
      // an address that cannot be read: start on the Appeal Pass
    }
  }
  return fromUrl ?? "case";
}

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
    () => current ?? initial(),
    () => "case",
  );
}

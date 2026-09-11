// D10's funnel measurement: "decoder session → decode completed → intake started → purchase →
// (opt-in) outcome. Analytics: Plausible or Umami + backend counts." This wires the client-side
// half using Plausible's script (cookieless, no personal data, counts page visits and named
// events only). No-ops safely when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset — same fail-open pattern
// as every other optional integration in this codebase (Gemini, Upstash, Resend).
//
// Backend counts (the other half of D10) already exist independently: Supabase row counts for
// licenses/outcome_events, and Upstash rate-limiter analytics. This module is only the four named
// client-side funnel events.

/** The exact four named funnel events D10 asks to measure, beyond the free pageview tracking
 * Plausible already does for "decoder session." Keep this list in sync with D10's wording. */
export const FUNNEL_EVENTS = {
  decodeCompleted: "Decode Completed",
  intakeStarted: "Intake Started",
  purchaseCompleted: "Purchase Completed",
  outcomeShared: "Outcome Shared",
} as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

/**
 * Fires a named funnel event. Safe to call unconditionally from any client component — it is a
 * no-op when the Plausible script isn't loaded (analytics not configured, or the viewer blocks
 * it), and never throws.
 */
export function trackFunnelEvent(
  name: FunnelEventName,
  props?: Record<string, string | number>,
): void {
  try {
    window.plausible?.(name, props ? { props } : undefined);
  } catch {
    // Analytics must never break the feature it's measuring.
  }
}

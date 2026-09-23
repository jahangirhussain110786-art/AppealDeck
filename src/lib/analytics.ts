// D10's funnel measurement: "decoder session → decode completed → intake started → purchase →
// (opt-in) outcome. Analytics: Plausible or Umami + backend counts." This wires the client-side
// half using Plausible's script (cookieless, no personal data, counts page visits and named
// events only). No-ops safely when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset — same fail-open pattern
// as every other optional integration in this codebase (Gemini, Upstash, Resend).
//
// Backend counts (the other half of D10) already exist independently: Supabase row counts for
// licenses/outcome_events, and Upstash rate-limiter analytics. This module is only the four named
// client-side funnel events.

/**
 * The canonical funnel event names, verbatim from `Planning/06-OPERATIONS/03-ANALYTICS-AND-METRICS.md`
 * §1, which states the requirement plainly: "use these strings verbatim in code, sheets, and
 * conversation — renaming events later poisons every historical comparison."
 *
 * Corrected 23 Sep 2026 (B-12). This module previously shipped four events under invented
 * title-case names ("Decode Completed", "Intake Started", "Purchase Completed", "Outcome Shared"),
 * `intake_started` was defined but fired from nowhere, and `checkout_opened` — the step that tells
 * a pricing problem apart from a checkout problem — did not exist at all. Renaming costs an hour
 * today and is impossible after the first month of data, so it is done before any deploy.
 *
 * `decoder_session` and `decode_completed` are deliberately two events rather than one: the first
 * fires on submit, the second when a classification is shown, so the gap between them is the API
 * failure rate rather than something that has to be inferred.
 *
 * Not implemented here, with reasons: `nano_availability` and `decode_path` are the extension's
 * supporting series and the extension has not started (B-27); `refund_requested` has no in-product
 * trigger because refunds run by email under D8. All three keep their spec names for whoever adds
 * them, and none is renamed here.
 */
export const FUNNEL_EVENTS = {
  decoderSession: "decoder_session",
  decodeCompleted: "decode_completed",
  intakeStarted: "intake_started",
  checkoutOpened: "checkout_opened",
  passPurchased: "pass_purchased",
  outcomeReported: "outcome_reported",
  /** Web-only supplements, never replacements for the canonical six. */
  gatedScreenShown: "gated_screen_shown",
  poaGenerated: "poa_generated",
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

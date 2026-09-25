// Copy for the thin announcement bar above the header on the public pages (AM-30, 25 Sep 2026).
//
// Edit this file, not the component, to change what the bar says or how it moves.
//
// Rules, because this bar is the first line a frightened seller reads:
// - every message must be true today. No invented deals, countdowns or "limited time" offers;
//   the price is a flat $249 and a discount that does not exist is a false claim (D6);
// - one short sentence per message, with at most one link;
// - a real offer (a launch discount, a partner deal) goes here only when it exists in Paddle.

export type AnnouncementMode =
  /** One message, standing still. */
  | "static"
  /** One message at a time, changing every `intervalMs`. */
  | "rotate"
  /** All messages scrolling past continuously, like a news ticker. */
  | "ticker";

/** How a message enters in `rotate` mode. */
export type AnnouncementEffect = "fade" | "slide-up" | "slide-left";

export interface Announcement {
  id: string;
  /** Shown in the brand orange before the text, e.g. "New". Optional. */
  tag?: string;
  text: string;
  href?: string;
  linkLabel?: string;
  /** Overrides the bar's `effect` for this one message in `rotate` mode. */
  effect?: AnnouncementEffect;
}

export const ANNOUNCEMENT_BAR = {
  enabled: true,
  mode: "rotate" as AnnouncementMode,
  effect: "slide-up" as AnnouncementEffect,
  intervalMs: 6000,
  /** Seconds for one full pass in `ticker` mode. */
  tickerSeconds: 40,
  labels: {
    region: "Announcements",
    pause: "Pause announcements",
    play: "Play announcements",
    previous: "Previous announcement",
    next: "Next announcement",
    dismiss: "Dismiss announcements",
  },
  items: [
    {
      id: "free-decoder",
      tag: "Free",
      text: "Paste your Amazon notice and see what it asks for. No account needed.",
      href: "/decode",
      linkLabel: "Decode your notice",
    },
    {
      id: "one-pass",
      text: "One Appeal Pass covers every revision of its case. $249, one time, no subscription.",
      href: "/pricing",
      linkLabel: "See pricing",
    },
    {
      id: "guide-section-3",
      tag: "New guide",
      text: "Deactivated under Section 3? What it means and what to do first.",
      href: "/guides/section-3",
      linkLabel: "Read the guide",
    },
    {
      id: "refund",
      text: "Changed your mind? Refunds within 7 days, no questions asked.",
      href: "/refund",
      linkLabel: "Refund policy",
    },
  ] satisfies Announcement[],
};

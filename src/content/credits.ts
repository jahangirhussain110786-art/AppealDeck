/**
 * The home page's acknowledgment of the tools behind AppealDeck (27 Oct 2026).
 *
 * Names only, never logo artwork. A name in our own type is a factual reference a reader can check;
 * an unlicensed logo is a claim the brands' guidelines ask us not to make, and Anthropic, Google,
 * OpenAI and Microsoft all gate their marks behind permission we do not hold. The row is deliberately
 * uniform: a mixed strip of some logos and some words reads as "we only got the small ones cleared".
 *
 * There is no expanded list anywhere. The founder asked for the acknowledgment and nothing else, so
 * the row is the whole statement; the one place a tool is named in full is the licences page, where
 * the open-source notices make it a legal requirement rather than a description.
 *
 * `SERVICES` must stay reconciled with the provider disclosure in `legal.ts` — a test enforces it, so
 * a service cannot appear in the row while staying unmentioned on the privacy page.
 */

export const CREDITS = {
  heading: "With thanks to:",
  line: "The tools and technologies behind AppealDeck.",
  disclaimer:
    "Names identify tools we used. All trademarks belong to their owners; no partnership, sponsorship or endorsement is implied.",
} as const;

/**
 * The services we run on, by the names the privacy policy uses. Test-only: it keeps the row and the
 * disclosure from drifting apart in either direction.
 */
export const SERVICES = [
  "Vercel",
  "Supabase",
  "Paddle",
  "Upstash",
  "Resend",
  "Google Gemini",
  "Groq",
  "Plausible",
] as const;

/**
 * The names in the moving row, in the order they read: the ones used to build it, then the ones it
 * runs on. Long enough that the loop has no gap on a wide screen.
 */
export const MARQUEE_NAMES = [
  "Claude",
  "ChatGPT",
  "Qoder",
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Microsoft",
  "Linux",
  ...SERVICES,
] as const;

export const CREDITS_LABELS = {
  region: "Tools and technologies used",
  pause: "Pause the moving names",
  play: "Resume the moving names",
} as const;

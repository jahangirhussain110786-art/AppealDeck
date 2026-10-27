/**
 * The home page's acknowledgment of the tools behind AppealDeck (27 Oct 2026, revised the same day
 * at the founder's direction).
 *
 * Each name carries the tool's own glyph where a free, re-usable copy of it exists — the monochrome
 * marks in `public/credits/`, generated from Simple Icons by `scripts/build-credit-logos.mjs`. Where
 * the owner asked Simple Icons to remove the mark (OpenAI, Microsoft), the name stands as text in a
 * typeface that reads like its wordmark. The glyphs are white and single-path so the row is one
 * consistent strip rather than a collage of different brand guidelines.
 *
 * The marks remain the trademarks of their owners. They identify the tools this site uses; the
 * disclaimer under the row says the rest, and nothing here claims a partnership.
 *
 * `SERVICES` must stay reconciled with the provider disclosure in `legal.ts` — a test enforces it, so
 * a service cannot appear in the row while staying unmentioned on the privacy page.
 */

export type CreditFace = "serif" | "grotesque" | "humanist";

export type CreditName = {
  name: string;
  /** A monochrome SVG under `public/credits/`, if the brand publishes one we can reuse. */
  logo?: string;
  /** A substitute typeface for names without a glyph. */
  face?: CreditFace;
};

export const CREDITS = {
  heading: "With thanks to:",
  /** The phrase set in the italic serif accent face, like every other heading on the site. */
  accent: "thanks to:",
  line: "The tools and technologies behind AppealDeck.",
  disclaimer:
    "Names and marks identify tools we used; all trademarks belong to their owners. No partnership, sponsorship or endorsement is implied.",
} as const;

/** The services we run on, by the names the privacy policy uses. */
export const SERVICE_NAMES: CreditName[] = [
  { name: "Vercel", logo: "/credits/vercel.svg" },
  { name: "Supabase", logo: "/credits/supabase.svg" },
  { name: "Paddle", logo: "/credits/paddle.svg" },
  { name: "Upstash", logo: "/credits/upstash.svg" },
  { name: "Resend", logo: "/credits/resend.svg" },
  { name: "Google Gemini", logo: "/credits/gemini.svg", face: "grotesque" },
  { name: "Groq" },
  { name: "Plausible", logo: "/credits/plausible.svg" },
];

/** Service names as plain strings, for the reconciliation test. */
export const SERVICES = SERVICE_NAMES.map((entry) => entry.name);

/**
 * The moving row, in the order it reads: the ones used to build it, then the ones it runs on.
 */
export const MARQUEE: CreditName[] = [
  { name: "Next.js", logo: "/credits/nextjs.svg" },
  { name: "React", logo: "/credits/react.svg" },
  { name: "TypeScript", logo: "/credits/typescript.svg" },
  { name: "ChatGPT", face: "grotesque" },
  { name: "Claude", logo: "/credits/claude.svg", face: "serif" },
  { name: "Microsoft", face: "humanist" },
  { name: "Qoder" },
  { name: "Tailwind CSS", logo: "/credits/tailwindcss.svg" },
  { name: "Linux", logo: "/credits/linux.svg" },
  ...SERVICE_NAMES,
];

export const MARQUEE_NAMES = MARQUEE.map((entry) => entry.name);

export const CREDITS_LABELS = {
  region: "Tools and technologies used",
} as const;

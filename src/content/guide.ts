/**
 * Copy for Dex, the small guide who sits in the corner of every page (20 Oct 2026).
 *
 * Dex is not a chat window and answers nothing: each page gets one fixed line of 8 words at most and
 * one mood. The rules, each there because the opposite would hurt a seller:
 * - He never cheers on a page where a seller may be reading bad news: the case, the decoder's result,
 *   the dashboard, the vault, billing and sign-in. Those pages only ever get calm or explaining.
 * - A line never promises, predicts or says what Amazon will decide.
 * - A line states no fact: no price, number, time or policy. A fact in the corner would drift away
 *   from the page that owns it, and would repeat the page's own sentence to a screen reader.
 */

export type GuideMood = "hello" | "happy" | "cheering" | "explaining" | "thinking" | "calm";

export type GuideEntry = { mood: GuideMood; line: string };

type Route = GuideEntry & { path: string; exact?: boolean };

/** Pages where a seller may be reading bad news: never a cheerful mood here. */
export const SOBER_PREFIXES = [
  "/case",
  "/decode",
  "/dashboard",
  "/vault",
  "/billing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
] as const;

export const CHEERFUL: readonly GuideMood[] = ["happy", "cheering"];

/** Paths that never get a guide. */
const NONE = ["/dev", "/api"] as const;

export const GUIDE = {
  label: "Dex, your guide",
  tipToggle: "Show Dex's tip",
  show: "Show Dex, your guide",
  hide: "Hide Dex",
  fallback: { mood: "hello", line: "Need a hand? I am Dex." } satisfies GuideEntry,
  routes: [
    { path: "/", exact: true, mood: "hello", line: "Paste a notice and I will mark it." },
    { path: "/decode", mood: "explaining", line: "Paste your notice. I mark what matters." },
    { path: "/case", mood: "explaining", line: "One step at a time." },
    { path: "/dashboard", mood: "explaining", line: "Pick a case to continue." },
    { path: "/vault", mood: "calm", line: "Take your time." },
    { path: "/billing", mood: "explaining", line: "Your Pass and receipts are here." },
    { path: "/login", mood: "hello", line: "Welcome back." },
    { path: "/signup", mood: "hello", line: "Let us get you set up." },
    { path: "/forgot-password", mood: "calm", line: "It happens. Reset it here." },
    { path: "/reset-password", mood: "calm", line: "Choose a new password." },
    { path: "/pricing", mood: "explaining", line: "Compare the plans, then choose." },
    { path: "/faq", mood: "thinking", line: "Looking for an answer?" },
    { path: "/guides", mood: "thinking", line: "Read one guide at a time." },
    { path: "/how-we-test", mood: "explaining", line: "Here is how we test." },
    { path: "/check-invoice", mood: "explaining", line: "Check an invoice before you send it." },
    { path: "/support", mood: "calm", line: "Questions? Write to us." },
    { path: "/changelog", mood: "happy", line: "What changed lately." },
    { path: "/terms", mood: "calm", line: "Take your time reading." },
    { path: "/privacy", mood: "calm", line: "Take your time reading." },
    { path: "/refund", mood: "calm", line: "Take your time reading." },
  ] satisfies Route[],
} as const;

/** The guide for a page, or null where there is none. Longest matching path wins. */
export function guideFor(pathname: string | null): GuideEntry | null {
  const path = (pathname ?? "/").split("?")[0] ?? "/";
  if (NONE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  const match = [...GUIDE.routes]
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) =>
      "exact" in r && r.exact ? path === r.path : path === r.path || path.startsWith(`${r.path}/`),
    );
  return match ? { mood: match.mood, line: match.line } : GUIDE.fallback;
}

/** The picture widths we ship for every mood (see scripts/build-mascot-set.mjs). */
export const GUIDE_WIDTHS = [160, 320, 640] as const;
export const GUIDE_ASPECT = { width: 1170, height: 1113 } as const;

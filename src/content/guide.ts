/**
 * Copy for Dex, the small guide who sits in the corner of every page (20 Oct 2026).
 *
 * Dex is not a chat window and answers nothing: each page gets one fixed line of 8 words at most and
 * one mood. The rules, each there because the opposite would hurt a seller:
 * - He never cheers on a page where a seller may be reading bad news: the case, the decoder's result,
 *   the dashboard, the vault, billing and sign-in. Those pages never get happy, cheering, idea or
 *   encourage. Confused is only for our own failures (a save or a decode that did not work), never
 *   for anything Amazon decided.
 * - A line never promises, predicts or says what Amazon will decide.
 * - A line states no fact: no price, number, time or policy. A fact in the corner would drift away
 *   from the page that owns it, and would repeat the page's own sentence to a screen reader.
 */

export type GuideMood =
  | "hello"
  | "happy"
  | "cheering"
  | "explaining"
  | "thinking"
  | "calm"
  | "confused"
  | "idea"
  | "reassure"
  | "encourage";

/** A small gesture that goes with a line: a nod to say "that step is done", a hop for a happy moment. */
export type GuideMotion = "nod" | "hop";

export type GuideEntry = { mood: GuideMood; line: string; motion?: GuideMotion };

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

/** Moods that celebrate or push: never on a page where a seller may be reading bad news. */
export const CHEERFUL: readonly GuideMood[] = ["happy", "cheering", "idea", "encourage"];

/** Paths that never get a guide. */
const NONE = ["/dev", "/api"] as const;

export const GUIDE = {
  label: "Dex, your guide",
  tipToggle: "Show Dex's tip",
  show: "Show Dex, your guide",
  hide: "Hide Dex",
  // the only paths without an entry of their own are ones that do not exist: the 404
  fallback: { mood: "confused", line: "I cannot find that page." } satisfies GuideEntry,
  routes: [
    { path: "/", exact: true, mood: "hello", line: "Paste a notice and I will mark it." },
    { path: "/decode", mood: "explaining", line: "Paste your notice. I mark what matters." },
    { path: "/case", mood: "explaining", line: "One step at a time." },
    { path: "/dashboard", mood: "explaining", line: "Pick a case to continue." },
    { path: "/vault", mood: "calm", line: "Take your time." },
    { path: "/billing", mood: "explaining", line: "Your Pass and receipts are here." },
    { path: "/login", mood: "hello", line: "Welcome back." },
    { path: "/signup", mood: "hello", line: "Let us get you set up." },
    { path: "/forgot-password", mood: "reassure", line: "It happens. Reset it here." },
    { path: "/reset-password", mood: "calm", line: "Choose a new password." },
    { path: "/pricing", mood: "explaining", line: "Compare the plans, then choose." },
    { path: "/faq", mood: "thinking", line: "Looking for an answer?" },
    { path: "/guides", mood: "idea", line: "Read one guide at a time." },
    { path: "/how-we-test", mood: "explaining", line: "Here is how we test." },
    { path: "/check-invoice", mood: "explaining", line: "Check an invoice before you send it." },
    { path: "/support", mood: "calm", line: "Questions? Write to us." },
    { path: "/changelog", mood: "happy", line: "What changed lately." },
    { path: "/terms", mood: "calm", line: "Take your time reading." },
    { path: "/privacy", mood: "calm", line: "Take your time reading." },
    { path: "/refund", mood: "calm", line: "Take your time reading." },
  ] satisfies Route[],
} as const;

/**
 * What Dex says when the page tells him what the visitor is doing (see `src/lib/guideSignal.ts`).
 * The same rules as the page lines hold: eight words at most, no promise, no number or price, and on a
 * page where a seller may be reading bad news only a calm or explaining mood. A motion is a small
 * gesture, never a celebration, wherever the page is sober.
 */
export const SITUATIONS = {
  // the home page's paste box
  "home.typing": { mood: "explaining", line: "Press Decode when it is all pasted." },
  // the decoder
  "decode.typing": { mood: "explaining", line: "Press Decode when it is all pasted." },
  "decode.partial": { mood: "thinking", line: "Paste the whole email, top to bottom." },
  "decode.reading": { mood: "thinking", line: "Reading it now." },
  "decode.result": { mood: "calm", line: "Start with what Amazon asks for.", motion: "nod" },
  "decode.reply": { mood: "calm", line: "This is Amazon's reply. Read it closely.", motion: "nod" },
  "decode.scam": { mood: "calm", line: "Check this in Account Health first." },
  "decode.error": { mood: "confused", line: "That did not work. Try again." },
  // the case
  "case.new": { mood: "explaining", line: "Paste the notice to begin." },
  "case.confirm": { mood: "explaining", line: "Check how I read it." },
  "case.documents": { mood: "explaining", line: "One record at a time." },
  "case.checking": { mood: "thinking", line: "Reading your document." },
  "case.response": { mood: "explaining", line: "Say it plainly, in your words." },
  "case.ready": { mood: "calm", line: "Read it once more, then send.", motion: "nod" },
  "case.reply": { mood: "explaining", line: "Paste Amazon's reply to continue." },
  "case.waiting": { mood: "reassure", line: "Waiting on Amazon. Take a breath." },
  "case.gated": { mood: "calm", line: "This one needs professional help." },
  "case.save_failed": { mood: "confused", line: "Your last change did not save." },
  // the dashboard and the vault
  "dashboard.empty": { mood: "explaining", line: "No case yet. Paste a notice." },
  "vault.empty": { mood: "calm", line: "Nothing here yet. Take your time." },
  // pricing is not a page of bad news, so a warmer mood is fine once the buyer has agreed to the terms
  "pricing.ready": { mood: "encourage", line: "Ready when you are.", motion: "nod" },
  // the payment went through and the Pass is being switched on
  "pricing.activating": { mood: "cheering", line: "Thank you. Setting things up." },
} satisfies Record<string, GuideEntry>;

export type SituationKey = keyof typeof SITUATIONS;

/** Which page each kind of situation belongs to, so a stale one can never leak onto another page. */
const SITUATION_PAGE: Record<string, { path: string; exact?: boolean }> = {
  home: { path: "/", exact: true },
  decode: { path: "/decode" },
  case: { path: "/case" },
  dashboard: { path: "/dashboard" },
  vault: { path: "/vault" },
  pricing: { path: "/pricing" },
};

function situationFor(path: string, key: string | null | undefined): GuideEntry | null {
  if (!key || !(key in SITUATIONS)) return null;
  const page = SITUATION_PAGE[key.split(".")[0] ?? ""];
  if (!page) return null;
  const onPage = page.exact
    ? path === page.path
    : path === page.path || path.startsWith(`${page.path}/`);
  return onPage ? SITUATIONS[key as SituationKey] : null;
}

/** The guide for a page, or null where there is none. Longest matching path wins. */
export function guideFor(pathname: string | null, situation?: string | null): GuideEntry | null {
  const path = (pathname ?? "/").split("?")[0] ?? "/";
  if (NONE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  const now = situationFor(path, situation);
  if (now) return now;
  const match = [...GUIDE.routes]
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) =>
      "exact" in r && r.exact ? path === r.path : path === r.path || path.startsWith(`${r.path}/`),
    );
  return match ? { mood: match.mood, line: match.line } : GUIDE.fallback;
}

/** The picture widths we ship for every mood (see scripts/build-mascot-set.mjs). */
export const GUIDE_WIDTHS = [160, 320, 640] as const;
export const GUIDE_ASPECT = { width: 1000, height: 979 } as const;

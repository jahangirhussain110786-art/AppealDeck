# 06-PREMIUM-UI-UX-SPEC — design system v2, motion, state quartet, page-by-page polish, and the pre-deploy UI wave

**Why this file exists / when to use it.** Founder direction (4 Sep 2026): most of the engine and shell is built; before first deployment the product must *feel* premium — "a good, modern, supported, simple, fantastic UI/UX is what makes a product feel premium or cheap." This file is the single spec for that work: an audit of what the UI is today (§0), what "premium" concretely means for a trust-critical tool used by sellers in panic (§1), design tokens v2 (§2), the missing primitive/pattern library (§3–§4), the motion system (§5), the mandatory state quartet (§6), page-by-page requirements (§7), shell/navigation (§8), accessibility/performance/metadata gates (§9), microcopy rules (§10), trust surfaces without social proof (§11), **how to structure the work** (§12), the wave plan (§13), a verdict register on the external coding agent's 22 suggestions (§14), and the definition of done (§15). Checkboxes live in `02-BUILD-PLAN-AMENDMENTS.md` **AM-18**; the spec lives here (same split as AM-16/`04-…` and AM-17/`05-…`).

**Scope guard (binding).** This is presentation, interaction states, copy, accessibility, and perceived performance. It adds **no engine behaviour, no routes that call the LLM, no new product capabilities**. The post-AM-17 feature freeze stands. Any item that turns out to need core logic (new state, new field, new backend route) is written up as an amendment first and is *not* built under this spec.

**Terms.** *Primitive* = a generic UI component in `src/components/ui/` (Button, Badge…). *Pattern* = a product-specific composition in `src/components/patterns/` (HonestExpectationsCard, DeadlineChip…). *Surface* = a route/page. *State quartet* = loading · empty · error · success — every async surface ships all four. *Wave* = a shippable PR-sized batch (§13).

---

## 0. Audit — what the UI is on 4 Sep 2026 (verified by reading `src/`)

| Area | Today | Gap |
|---|---|---|
| Tokens | shadcn-style HSL vars in `src/app/globals.css`; one accent (green 160/70); `--radius: .75rem`; two shadows (`soft`, `soft-lg`); one keyframe (`fade-up`); single radial header gradient | No type scale, no spacing/width tokens, no surface tiers, no motion tokens, no `info` status, shadows untinted, dark mode relies on shadows (should rely on tone + border) |
| Typography | System font stack; no `next/font` | No brand typeface, no tabular numerals for deadlines/amounts, no long-form prose styles for `/privacy` `/terms` `/refund` (no typography plugin) |
| Primitives | Button (5 variants/4 sizes), Card, Input, Textarea, Toaster (sonner) | **Missing:** Badge, Skeleton, Alert/Callout, Progress, Stepper, Tabs, Accordion, Dialog/Sheet, Tooltip, Separator, Breadcrumb, Kbd, EmptyState |
| Motion | framer-motion 13 in `InterviewFlow` (AnimatePresence), `ComposeView`, `VaultView` (layout); CSS `animate-fade-up` on `PageShell` | Reduced-motion honoured only in CSS — framer needs `MotionConfig reducedMotion="user"`; no shared variants/duration tokens; no `LazyMotion` (bundle) |
| Theme | next-themes, `defaultTheme="dark"`, class strategy | Sonner `theme="system"` ignores the app's resolved theme (mismatch when the user toggles); dark default is unusual for a legal-tech reading tool → `system` |
| Shell | `SiteHeader` and `AppShell` duplicate the sticky/backdrop header; mobile nav is a plain toggled block | One header component with a marketing/app variant; Sheet-based mobile nav; app breadcrumb |
| Next.js surfaces | `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`, rich `metadata` | **No** `loading.tsx` (root or `(app)`), no `opengraph-image`, no `manifest`, no `public/` (icons) |
| `/` | h1 + 2 CTAs + 3 feature cards (83 lines) | No product-as-artwork hero, no how-it-works, no honest-expectations strip, no founder note |
| `/decode` | textarea → result with `aria-live`; deadline + severity sections; CTA | No sample notice, no notice-likeness feedback, no skeleton/reveal choreography, no "what happens next" |
| `/pricing` | one plan card + 6 bullets + 1-sentence disclaimer (55 lines) | No Free-vs-Pass table, no FAQ, trust block buried in one line; EU-withdrawal consent copy (D8) not visible at the CTA |
| `(app)/` dashboard | "Appeal Pass active / none" card | Should be the `caseState` home: current state · next best actions · next deadline (05-spec §1 "UI consequence") |
| `/case` | Interview: progress bar, "Step x of y", why-drawer, typed inputs; `sessionStorage` case file | No resume prompt, no stepper rail, no save-and-exit; progress persistence not through the encrypted store |
| `/compose` | read-only mono `pre-wrap` POA; Copy → toast only | PoaEditor (already M-4 scope) not yet in the UI; no inline "Copied ✓"; no before-you-submit checklist; critic flags not attached to sections |
| `/vault` | drop zone + text list; 1-line empty state | Teaching empty state, file-type icons, search/filter, record count |
| Legal pages | `PageShell` + raw paragraphs | No prose styles, no "last updated", no on-page TOC |

---

## 1. Principles — what "premium" means here

1. **Calm authority, not SaaS theatre.** The seller has just lost their income. Premium = quiet, high-contrast type, generous whitespace, one accent colour, tinted-not-black shadows, no gradients-on-everything, no decorative animation, nothing that moves unless the user caused it. Reference class: Linear, Vercel, Stripe docs, Mercury — restraint reads as competence.
2. **Honesty is the aesthetic (D6 rendered).** No countdown timers, no "12 sellers bought today", no fake scarcity, no testimonials until they are real and opt-in, no celebration of a *draft* (a POA draft is not a win — celebrating it is the banned "readiness-as-approval" framing). The honest-expectations card is a *designed* component, not a footnote.
3. **Product is the artwork.** Hero and marketing visuals are real UI (a decoded notice, a deadline chip, a POA section with a critic flag) — never stock illustration. This also demonstrates local-first decoding in one glance.
4. **Panic-hour ergonomics.** One primary action per screen. Large tap targets. The next step is always visible without scrolling on mobile (sticky bottom action bar in the interview). Reading width ≤ 70ch for anything the seller must understand.
5. **Every surface has its state quartet (§6).** Missing empty/loading/error states are what make a product feel unfinished.
6. **Respect the system.** Theme follows the OS by default; reduced motion honoured everywhere; keyboard-complete; WCAG 2.2 AA including the 24 px minimum target size.
7. **Simple > clever.** No command palette, no onboarding tours, no i18n, no A/B rig (agreed with the external agent). Fewer, better components.

### 1.1 Simplicity budget (binding) — and what makes screens loved

- **Budget per screen:** one primary action, at most one secondary; ≤ 3 cards above the fold; ≤ 7 navigation items; no modal for information (inline or Accordion instead — Dialog only for confirms and the sample POA); details behind "why?"/Accordion, never in the first paint. Every element must answer "what does the seller do next?" or be removed.
- **What screen-lovers notice, and why they stay:** a real type scale with consistent rhythm; optical alignment on a 4 px grid; one icon family at one stroke width (lucide, 1.5 px, 16/20 px); surface tiers and tinted shadows instead of borders everywhere; feedback within 100 ms on every interaction they cause; skeletons shaped like the content they replace; empty states that look designed, not forgotten; dark and light modes each tuned, not inverted; a hero that *is* the product. Delight is craft in these details — never confetti, effects, or clever copy.
- **The test:** a stressed seller on a phone at 2 a.m. sees one obvious next step and nothing that competes with it.

---

## 2. Design tokens v2 (`src/app/globals.css` + `tailwind.config.ts`)

- **Typography (via `next/font`, self-hosted, `display: swap`, `adjustFontFallback`):** one variable sans for UI + headings (Inter or Geist Sans — both open-licensed; pick one, never two), one mono for quoted notice text and the POA body (Geist Mono or JetBrains Mono). Enable `font-variant-numeric: tabular-nums` on every deadline, date, count, and price. Fluid scale with `clamp()`: `--text-display` (2.5–3.5rem), `--text-h1` (2–2.75rem), `--text-h2` (1.5–1.875rem), `--text-h3` 1.25rem, body 1rem/1.6, small .875rem, micro .75rem. Headings use `text-balance`; body paragraphs `text-pretty` (Tailwind 3.4 has both).
- **Colour:** keep the single green accent — it is already the brand and reads as trust/legal. Add `--info` (blue, for neutral callouts) so warning/destructive stop being overused. Add **surface tiers**: `--surface-1` (cards), `--surface-2` (nested/muted panels), `--surface-inverse`. Dark mode: elevation by tone (`surface-2` lighter than `surface-1`) + 1 px border at ~12 % alpha, *not* by shadow. Light-mode shadows tinted with the foreground hue (`hsl(222 30% 10% / .06–.12)`), never pure black. Contrast-check every token pair at AA (muted-foreground on background, primary-foreground on primary, badge text on badge tint) — automate it (§9).
- **Radius scale:** `--radius-sm` 6 px (chips, inputs) · `--radius-md` 10 px (buttons) · `--radius-lg` 14 px (cards) · `--radius-xl` 20 px (hero panels, dialogs). Replaces the single `--radius` derivation.
- **Spacing/width tokens:** 4 px base; content widths `--w-reading` 65ch (legal/prose), `--w-form` 40rem (auth/interview), `--w-app` 72rem (dashboard/vault), `--w-marketing` 80rem. Section rhythm 4/6/8 rem.
- **Motion tokens:** `--dur-fast` 120 ms (hover/press), `--dur-base` 200 ms (enter/exit), `--dur-slow` 320 ms (layout/progress); easings `--ease-out` cubic-bezier(.16,1,.3,1), `--ease-in-out` cubic-bezier(.65,0,.35,1). Stagger 40 ms.
- **Z-index scale:** base 0 · sticky 10 · dropdown 20 · sheet 30 · dialog 40 · toast 50.
- **Not now:** Tailwind v4 / OKLCH migration (separate decision; v3.4 + HSL is fine), custom illustration system, brand redesign.

---

## 3. Primitive library — copy from shadcn/ui (MIT; build-plan §6 donor class) into `src/components/ui/`

| Primitive | Radix dep (MIT) | Used where |
|---|---|---|
| Badge (neutral, info, success, warning, destructive, outline) | — | severity, case state, evidence status, device status |
| Skeleton | — | every `loading.tsx`, decode reveal, vault list, compose |
| Alert / Callout (icon + title + body; info/warning/destructive) | — | honest-expectations, gated-pro-help, deadline warnings, error states |
| Progress | `react-progress` | interview progress, readiness "case-file completeness — not a prediction" |
| Tabs | `react-tabs` | case view tabs (Notice / Interview / POA / Evidence / Timeline) when the caseState home lands |
| Accordion | `react-accordion` | pricing FAQ, "why does Amazon want this?", vault "what goes here" |
| Dialog + Sheet | `react-dialog` | mobile nav, sample-POA viewer, destructive confirms |
| Tooltip | `react-tooltip` | icon-only buttons (theme toggle, copy, delete) — never for essential info |
| Separator, Breadcrumb, Kbd, Label | `react-separator`, `react-label` | app pages, shortcuts, forms |
| Sonner (existing) | — | wire `theme` to next-themes `resolvedTheme` |

Rules: primitives are unbranded and stateless; `cva` variants only; every interactive primitive has a `:focus-visible` ring and a ≥ 24 px hit area; icon-only buttons carry `aria-label`.

## 4. Patterns — product compositions in `src/components/patterns/`

- **HonestExpectationsCard** — the D6 card (what we do / don't do / typical-not-guaranteed). Appears before checkout, on compose success, and in the decode result. Copy sourced from `guidance.ts`, never hand-typed per page.
- **SeverityBadge / CaseStateBadge / EvidenceStatusBadge** — thin wrappers over Badge mapping engine enums → tone + label. Single source of colour semantics.
- **DeadlineChip** — date + relative time (tabular), tone by proximity, tooltip with the rule it derives from (deadlinesModel), "typical, not guaranteed" caveat where the model says so.
- **Stepper** — vertical rail on desktop, compact pill on mobile; states todo / current / done / skipped-with-reason; reads from interview `progress`.
- **EmptyState** — icon, one-line what, one-line why, one primary action, optional "what goes here" Accordion.
- **VerifiedStamp** — "Policy checked · 2 Sep 2026" chip for guidance cards (EF-5 quarterly re-check made visible).
- **LocalFirstBadge** — "Decoded in your browser · nothing sent" with a "how to verify" tooltip (open DevTools → Network). A claim the seller can check beats a claim the seller must trust.
- **CopyButton** — copies, swaps to "Copied ✓" for 2 s inline, *and* toasts; used in compose and vault.
- **PoaSection** — Root cause / Corrective actions / Preventive measures blocks with critic flags rendered in the margin (severity badge + one-line fix). Home of the M-4 PoaEditor.
- **BeforeYouSubmitChecklist** — deterministic list from readiness + guidance (evidence attached, no template phrases, novelty on attempt 2+, seller submits themselves).

---

## 5. Motion system (`src/lib/motion.ts`)

- Wrap the app in `<MotionConfig reducedMotion="user">` and use `LazyMotion` + `m.*` to trim the bundle. Export shared variants: `fadeUp`, `fadeIn`, `scaleIn`, `listStagger` (40 ms), `stepSwap` (AnimatePresence `mode="wait"`, x ±12 px, 200 ms). Durations/easings from §2 tokens only.
- **Allowed:** enter/exit of content the user just requested; layout animations on lists; progress bars; button press (scale .98, already present). **Forbidden:** looping/idle animation, parallax, confetti, hover-lift on non-interactive cards, animations > 320 ms, animation on initial marketing paint beyond a single stagger.
- Skeleton, never spinner, for anything > 150 ms. Decode is local and deterministic → render instantly; never fake a delay.
- Theme toggle: keep `disableTransitionOnChange`; no colour flash on hydration (class strategy is already correct).

## 6. State quartet + feedback policy

Every async or data-bearing surface ships **loading · empty · error · success**. Empty states *teach* (what goes here, why, one action). Errors state what happened and what to do next, keep the user's input, and offer retry. Success pairs an inline confirmation at the point of action with at most one toast. Toasts: bottom-right, ≤ 4 s, one at a time, action button for undo where reversible, never used for errors that block the flow (those are inline Alerts). Destructive actions (delete record, revoke device, sign out everywhere) confirm via Dialog naming the object. Forms validate on blur with inline messages tied by `aria-describedby`; a disabled submit button is never the only feedback.

---

## 7. Page-by-page requirements

### 7.1 Marketing (`/`, `/decode`, `/pricing`, `/privacy`, `/terms`, `/refund`, `/faq`)
- **`/` home:** hero = one-sentence promise + honest sub-line + primary CTA "Decode my notice — free" + secondary "See what the Appeal Pass includes"; hero artwork = a real decoded-notice mock (SeverityBadge, two DeadlineChips, LocalFirstBadge). Then **How it works** (3 numbered steps with real component thumbnails). Then a **What we do / don't do** strip (HonestExpectationsCard). Then a **founder note** in the founder's own true words (individual seller, Pakistan — no invented story, no outcome claims). Footer: Privacy · Terms · Refund · FAQ · "AppealDeck never submits to Amazon on your behalf."
- **`/decode`:** add "Try a sample notice" (fixture from the `src/core` test fixtures, clearly labelled *sample*); character count + notice-likeness hint from the AM-17 deterministic prefilter ("this doesn't look like an Amazon notice yet — paste the full email"); result reveals in one stagger: SeverityBadge → plain-English summary → DeadlineChips (funds +60 d where applicable) → DO-NOW / DO-NOT triage cards → HonestExpectationsCard → CTA. Gated kinds render the pro-help route with no purchase CTA (D6).
- **`/pricing`:** price hero (one price, no strikethrough, no timers) → **Free vs Appeal Pass table** (decode/explain/deadlines/triage free; interview, evidence checklist, gap/full draft, critic, vault, 5 devices paid) → trust card (never submits · decodes in-browser · encrypted vault we cannot read · 7-day refund) → **FAQ Accordion** (7 items, copy through the claims gate) → EU-withdrawal explicit-consent checkbox + confirmation-email note visible at the CTA (D8) → HonestExpectationsCard. Sample-POA viewer in a Dialog, fictional, watermarked "illustrative".
- **Legal pages:** prose styles (hand-rolled `.prose` or `@tailwindcss/typography`, MIT), 65ch, "Last updated" stamp, sticky on-page TOC at ≥ lg.
- **`/faq` (new, static):** the pricing items plus process/privacy/technical groups; each answer passes the `guarantee`-free and banned-numbers grep. SEO surface for long-tail queries.

### 7.2 Auth (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
One `AuthCard` layout (`--w-form`), consistent heading/sub-line, inline validation, password rules shown before the error, Google button with equal weight and spacing, clear "no account yet?" cross-links, loading state inside the button (the one allowed spinner), success screens for reset/forgot with what-to-do-next.

### 7.3 App (`(app)/`, `/case`, `/compose`, `/vault`, `/billing`)
- **Dashboard = "what should I do right now?"** Render `caseState`: CaseStateBadge, next best actions (from the engine), next DeadlineChip, readiness Progress labelled exactly "case-file completeness — not a prediction". No-pass users see the same layout with the paid steps locked and one HonestExpectationsCard + CTA.
- **`/case` interview:** Stepper rail; **resume prompt** when a saved case file exists ("Resume case? · Start over"); **save & exit** — persist the in-progress case file through the vault's encrypted store (`lib/vault/browser.ts`), *not* plain `localStorage` (local-first-encrypted spine; the step log is already specified as vault-stored in 05-spec §4). Sticky bottom action bar on mobile with the step's primary action. Why-drawer gets a first-step inline hint (one-time, dismissed on open). Decline-with-reason UI shows the alternatives as cards with "declined ≠ claimed" copy.
- **`/compose`:** PoaSection ×3 with critic flags in the margin; gap-draft vs full-draft banner (Alert info); CopyButton; BeforeYouSubmitChecklist; HonestExpectationsCard; "You submit this yourself in Seller Central" line. No confetti, ever.
- **`/vault`:** teaching EmptyState; file-type icon by MIME; search + type filter; record count and total size; delete via Dialog; encrypted badge per record.
- **`/billing`:** device list as cards with last-seen (tabular), current device marked, revoke via Dialog; Pass status card; refund link.

---

## 8. Shell, navigation, mobile

One `AppHeader` with a marketing/app variant replaces the `SiteHeader` + `AppShell` header duplication. Active-route underline, `aria-current="page"`. Mobile nav as Sheet with focus trap. App breadcrumb ("Case → Compose"). Shared footer. Safe-area insets on sticky bars. Skip link retained. Widths from §2 tokens; no page scrolls horizontally.

**Deployment topology (decided 4 Sep 2026): single host for the first deploy.** Marketing, auth, and the app ship on one origin (the Vercel-provided URL, later the apex domain) with path-based routing: `/`, `/decode`, `/pricing`, legal pages; `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`; `/case`, `/compose`, `/vault`, `/billing`. UI consequences: all nav links are relative; the header switches variant by route, not by host; breadcrumbs start at "Home"; sitemap, robots, and OG URLs use `NEXT_PUBLIC_SITE_URL` only; no cross-origin auth hop (one fewer place for the seller to get lost). Implemented: `src/lib/urls.ts` (`APP_URL` → `SITE_URL`), `src/middleware.ts` single-host mode (default when `NEXT_PUBLIC_APP_HOST` is unset or equals the marketing host). The `app.` subdomain split stays available behind env vars; the switch checklist lives in `AGENTS.md` → "Domain topology" and is run only when the real domain is connected.

## 9. Accessibility, performance, metadata — gates, not advice

- **A11y (WCAG 2.2 AA):** axe (Playwright or `@axe-core/react` in dev) = 0 serious/critical on every route; all targets ≥ 24 px; focus order = visual order; every icon button labelled; `aria-live` on decode result and interview step change; heading levels sequential; colour never the only signal (badges carry text).
- **Performance budgets (mobile, Lighthouse CI on the Vercel preview):** Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95, LCP < 2.5 s, CLS < 0.1, INP < 200 ms. `next/font` self-hosted; `LazyMotion`; no client component where a server component works (marketing pages stay server-rendered).
- **Next.js surfaces:** `loading.tsx` at root and in `(app)`; `opengraph-image.tsx` (dynamic, brand + honest tagline); `icon.tsx`/`apple-icon.tsx`; `manifest.ts`; `metadata` per route (title/description/OG). Theme-colour meta for both schemes.

## 10. Content & voice system — every word earns its place

**10.1 Voice.** Calm, specific, plain. We write like a competent colleague who has read the policy, not like a brand. Short sentences. Concrete nouns (the notice, the invoice, the 60-day window) — no abstractions ("solutions", "journey", "empower"). First person plural only for things we actually do ("We decode the notice in your browser"), never for feelings ("we care"). Second person for the seller. Present tense. No exclamation marks, no emoji in product copy, no jokes — the reader may be losing their income.

**10.2 Trust is shown, never requested.** A tool that keeps saying "trust us" reads as cheap. Banned patterns (case-insensitive lint, §10.5): *trust us · trusted by · secure / 100 % secure / bank-grade / military-grade · privacy-first · peace of mind · rest assured · don't worry · hassle-free · seamless · effortless · powerful · AI-powered · revolutionary · instantly · simply / just* (minimisers). Replacement rule: state the **mechanism**, and where possible **how the seller can verify it**.

| Instead of | Write |
|---|---|
| "Your data is 100 % secure" | "Your evidence is encrypted in this browser (AES-GCM). We hold no key and cannot read it." |
| "Privacy-first analytics" (`src/app/privacy/page.tsx`) | "Analytics without cookies: page counts only. Notice text and drafts never leave your browser." |
| "Opening secure checkout…" (`src/components/CheckoutButton.tsx`) | "Opening Paddle checkout…" — name the merchant of record |
| "We never submit to Amazon on your behalf" (assertion) | "You submit the appeal yourself in Seller Central. AppealDeck has no access to your Amazon account." |
| "Trusted by sellers" | nothing — until opt-in outcome data exists (EF-5) |
| "Get reinstated fast" | "Understand the notice today. Draft a Plan of Action Amazon can act on." |
| "Don't worry, we've got you" | "Here is what to do in the next hour." (DO-NOW card) |

**10.3 Surface grammar.** Headline = what the seller gets today (an outcome they control). Sub-line = the boundary (what we do not do). Button = verb + object ("Decode my notice", "Copy Plan of Action", "Add evidence") — never "Submit", "Get started", "Learn more". Labels name the thing ("Deactivation date"), not the action. Errors = what happened, then what to do next — no apology theatre ("Oops!"). Empty states = what goes here, why it matters, one action. Dates absolute plus relative ("14 Sep · in 10 days"), numbers tabular with units. Amazon terms defined on first use per page (POA, AHR, funds hold, Seller Challenge). Sentence case everywhere; Amazon product names keep Amazon's casing.

**10.4 Copy lives in one place.** Move user-facing strings out of JSX into typed modules `src/content/{marketing,app,auth,legal,errors}.ts`; components import them. One place for the claims grep, the consultant review (B-16), and the banned-pattern lint — no ad-hoc rewording per component. `guidance.ts` stays the source for expectations and triage copy. **Copy audit (AA-29):** inventory every string in `src/` (script extracts JSX text and string props), review each against §10.1–10.3 and the D6 grep set, rewrite into the content modules, and attach the before/after table to the PR. Known hits on 4 Sep 2026: "privacy-first" ×2 in the privacy page, "secure checkout" in the checkout button. Everything else already passes the trust-assertion grep — the audit is about precision and consistency, not a rewrite.

**10.5 Lint gate (CI).** Case-insensitive grep over `src/`: `guarantee|trust us|trusted by|100 ?%|bank-grade|military-grade|privacy-first|peace of mind|rest assured|hassle|seamless|effortless|revolutionary|ai-powered|instantly` = 0, with an allow-list file for the rare legitimate use (a quoted Amazon phrase). No percentages or hour counts in user-facing copy (banned-numbers rule); exceptions only via `guidance.ts` with a provenance stamp.

## 11. Trust without social proof

We have no testimonials and will not fabricate any. Trust is built by **showing the mechanism**: LocalFirstBadge with a verifiable claim; VerifiedStamp dates on every guidance card; the honest-expectations card at every commitment point; the refund policy and EU consent stated plainly at checkout; a true founder note; a `/changelog` (later) showing the product is maintained. Opt-in outcome data (EF-5) is the only future source of any results statement.

## 12. How to structure the work (answers "how should I structure this all")

```
src/app/globals.css            tokens v2 (§2) — the only place colours/radii/durations are defined
src/lib/motion.ts              variants + MotionConfig + LazyMotion wrapper
src/components/ui/*            primitives (§3) — generic, unbranded
src/components/patterns/*      product patterns (§4) — the brand lives here
src/components/marketing/*     Hero, HowItWorks, PricingTable, Faq, FounderNote, TrustCard
src/components/app/*           AppHeader, Breadcrumb, CaseHome, Stepper wiring, VaultList
src/app/dev/ui/page.tsx        dev-only kitchen-sink gallery (404 in production) — no Storybook for a solo founder
docs/DESIGN-SYSTEM.md          1-page living index: token names, primitive list, do/don't — points back here
```
Rules: tokens before primitives before patterns before pages (never style a page ad hoc); one PR per wave; every PR runs the §15 gates; copy changes go through the claims grep in CI; screenshots of both themes at 375/768/1280 attached to each wave PR.

## 13. Waves (ship order; effort is founder+AI working time)

| Wave | Content | Effort |
|---|---|---|
| **A — Foundation** | tokens v2, `next/font`, primitives (§3), `motion.ts` + MotionConfig, sonner theme fix, `defaultTheme="system"`, AppHeader unification + Sheet nav, `loading.tsx` ×2, EmptyState/CopyButton/Badge patterns, dev gallery, single-host routing mode (shipped 4 Sep), `src/content/` copy-module scaffold | 2–3 days |
| **B — Marketing conversion** | `/` hero-as-product + how-it-works + expectations strip + founder note; `/decode` sample notice + likeness hint + reveal; `/pricing` table + FAQ + trust card + D8 consent; legal prose + TOC; `/faq`; OG image, icons, manifest; **full copy audit + lint gate (§10.4–10.5, AA-29)** | 2–3 days |
| **C — App confidence** | dashboard = caseState home; interview Stepper + resume + encrypted save-and-exit + mobile action bar; compose PoaSection + critic margin + checklist (hosts the M-4 PoaEditor); vault teaching state + icons + search/filter; billing/device polish; auth AuthCard | 3–4 days |
| **D — Polish (optional, post-launch)** | `/changelog`, VerifiedStamp everywhere, Lighthouse CI budgets tightened, micro-copy pass with the consultant | 1–2 days |

Waves A+B are the pre-deploy minimum. Wave C ships with M-W closure. Nothing here adds a milestone.

## 14. Register — external coding agent's 22 suggestions (verdicts, independently reviewed)

| # | Suggestion | Verdict | Reason |
|---|---|---|---|
| 1 | How-it-works on `/` | **Adopt** (B) | Comprehension in seconds; use real component thumbnails |
| 2 | Sample notice on `/decode` | **Adopt** (B) | Zero-friction demo; label as sample; use a core fixture |
| 3 | Trust block on `/pricing` | **Adopt** (B) | Fold into TrustCard + HonestExpectationsCard |
| 4 | Inline FAQ on `/pricing` | **Adopt** (B) | Copy through the claims gate; drop the unverified "10–20 % lift" framing |
| 5 | "Copied ✓" inline state | **Adopt** (A) | CopyButton pattern |
| 6 | Preview card on `/case` | **Adopt-modified** (C) | Becomes the caseState home, not a static card |
| 7 | Founder-intro card | **Adopt-modified** (B) | Only the founder's true story; the agent's "denied twice" narrative is invented — never publish it; no outcome claim |
| 8 | Free vs Pass table | **Adopt** (B) | Highest-value pricing element |
| 9 | Resume prompt | **Adopt** (C) | Pair with encrypted persistence |
| 10 | Breadcrumbs | **Adopt** (A/C) | Part of AppHeader |
| 11 | Save & exit to `localStorage` | **Adopt-modified** (C) | Persist via the encrypted vault store, not plaintext `localStorage` (local-first-encrypted spine) |
| 12 | Analytics consent banner | **Reject for now** | D10 picks Plausible/Umami (cookieless, no personal data) — verify at deploy; if confirmed, disclose in Privacy + a footer line instead of a banner |
| 13 | `/faq` route | **Adopt** (B) | SEO surface; claims-gated copy |
| 14 | Sample POA viewer | **Adopt** (B) | Fictional, watermarked, Dialog |
| 15 | Vault teaching empty state | **Adopt** (C) | EmptyState pattern |
| 16 | Vault icons/search/filter | **Adopt** (C) | — |
| 17 | Inline POA editor | **Already planned** (M-4 PoaEditor) | Hosted by PoaSection; not new scope |
| 18 | Why-drawer discoverability | **Adopt** (C) | One-time inline hint, no auto-fading tooltip |
| 19 | First-time tour | **Reject** | Tours get skipped; the Stepper + inline hints do the job |
| 20 | Confetti on first POA | **Reject (D6)** | A draft is not a win; it celebrates readiness-as-approval (banned framing) |
| 21 | Theme screenshots on marketing | **Reject** | Toggle already exists; low value |
| 22 | `/changelog` | **Adopt** (D) | Trust via a maintenance signal |

Agreed deprioritisations: search/⌘K, i18n, live chat, video, A/B rig.

## 15. Definition of done (AM-18 gates)

- [ ] Tokens v2 live; no hard-coded colours/radii/durations in components (grep gate: hex colours and `duration-[0-9]` in `src/components` = 0 outside tokens).
- [ ] `next/font` self-hosted; tabular numerals on all dates/amounts; prose styles on legal pages.
- [ ] Every §3 primitive present with focus ring and ≥ 24 px targets; every §4 pattern used on at least one surface.
- [ ] `MotionConfig reducedMotion="user"`; no looping/decorative animation (grep: `animate-bounce|animate-spin|animate-pulse` only inside Skeleton and the in-button spinner).
- [ ] State quartet verified per route (checklist table in the wave PR).
- [ ] One AppHeader; Sheet mobile nav; breadcrumbs in app; `defaultTheme="system"`; sonner follows the resolved theme.
- [ ] `loading.tsx` ×2, `opengraph-image`, `icon`, `manifest`, per-route metadata.
- [ ] axe 0 serious/critical on all routes; Lighthouse mobile ≥ 90/100/95/95; CLS < 0.1.
- [ ] Claims grep on UI strings: `guarantee` = 0; no percentages/hours; no countdowns/scarcity/fake social proof anywhere (manual review in the PR template).
- [ ] Screenshots light+dark at 375/768/1280 attached to each wave PR; founder sign-off on Waves A+B before first deploy.
- [ ] Single-host mode verified on the Vercel preview: every route serves on one origin; magic-link and OAuth callbacks return to the same origin; zero cross-host redirects in the network log.
- [ ] Copy audit (AA-29) complete: all user-facing strings in `src/content/`, before/after table in the PR, §10.5 lint gate green, §1.1 budget checked per screen.

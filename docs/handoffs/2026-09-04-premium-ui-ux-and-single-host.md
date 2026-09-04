# Handoff prompt — 4 Sep 2026 session: Premium UI/UX spec (AM-18) + single-host topology

> Paste everything below the line into the working coding agent. It is self-contained; the originating chat no longer exists.

---

You are continuing work on AppealDeck (`V:\AppealDeck1`, branch `master`). Read `CLAUDE.md` first (auto-loaded), then this prompt in full before touching anything. A planning-and-hardening session on **4 Sep 2026** produced the files listed in §1. Your job: verify them, commit them, then execute the plan they define (§4), under the constraints in §5.

## 1. What the 4 Sep 2026 session created and changed (all uncommitted in the working tree)

**Created**
- `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` — the single spec for the pre-deploy UI/UX wave. Sections: §0 audit of the live UI; §1 principles + **§1.1 binding simplicity budget**; §2 design tokens v2; §3 primitive library (shadcn/ui MIT donors); §4 product patterns; §5 motion system; §6 state quartet (loading/empty/error/success mandatory per surface); §7 page-by-page requirements (marketing, auth, app); §8 shell/navigation + **single-host deployment topology**; §9 a11y/perf/metadata gates; **§10 content & voice system** (trust shown by mechanism, never requested; banned-pattern lint; copy in `src/content/`); §11 trust without social proof; §12 folder structure for the work; §13 waves A–D; §14 verdict register on an external agent's 22 suggestions (some rejected — do not reintroduce them); §15 definition of done.
- `src/lib/urls.ts` — exports `SITE_URL` and `APP_URL` (`APP_URL` falls back to `SITE_URL`; single-host by default).
- `docs/handoffs/2026-09-04-premium-ui-ux-and-single-host.md` — this file.

**Modified**
- `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` — new **AM-18** (provenance, scope guard, what changes, single-host bullet, content-system bullet, **M-W gate amended** with UI/copy gates) and action items **AA-26** (Wave A), **AA-27** (Wave B), **AA-28** (Wave C + founder ratification), **AA-29** (copy audit + content modules + lint). Definition-of-done count is now 29.
- `CLAUDE.md` — §4 "ALSO DONE 4 Sep 2026" bullet (with the later-session addendum), IN FLIGHT and NEXT 4 ACTIONS updated; §5 link to the 06 spec.
- `docs/DECISIONS.md` — two entries dated 2026-09-04 (AM-18; single-host topology + content system).
- `AGENTS.md` — deploy-readiness step 6 (domains not needed for first deploy); new section **"Domain topology — single host now, split later"** with the ordered checklist for when the apex domain is connected and the optional later `app.` split; "Hosting architecture" bullet updated; "Design & UI/UX Standards" aligned to the 06 spec (theme follows system; motion only on user-caused events; copy source of truth).
- `docs/DEPLOYMENT.md` — §2 host env rows (leave `NEXT_PUBLIC_APP_HOST`/`NEXT_PUBLIC_APP_URL` unset), §3 rewritten for single host, §4 Supabase redirect URL wording.
- `.env.example` — hosts block: `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_MARKETING_HOST` set; `APP_HOST`/`APP_URL` commented out.
- `src/middleware.ts` — **single-host mode**: when `NEXT_PUBLIC_APP_HOST` is unset or equals the marketing host, the middleware returns `NextResponse.next()` for everything (no cross-host redirects). Split mode retained behind env vars; `APP_PREFIXES` now lists the real app routes (`/case`, `/compose`, `/vault`, `/billing`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, plus legacy `/app`, `/auth`).
- `src/app/(app)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx` — `import { APP_URL } from "@/lib/urls"` replaces the hard-coded `app.appealdeck.com` fallback.
- `src/app/(app)/billing/page.tsx`, `src/app/(app)/page.tsx` — `import { SITE_URL as MARKETING_URL } from "@/lib/urls"`.

**Verified state at handoff:** `npm run typecheck` clean, `npm run lint` clean, `vitest run` = 21 files / 237 tests green. Nothing committed.

## 2. Decisions made on 4 Sep 2026 (settled — do not reopen)

1. **Single-host topology for the first deploy.** Marketing, auth, and the app ship on ONE origin (the Vercel `*.vercel.app` URL now, the apex domain later), path-routed. Reason: the old host split would have redirected `/auth/callback` on a `vercel.app` deploy to a non-existent `app.` host, and the middleware prefixes no longer matched the real routes after commit 882ed39. The `app.` split is an env-var switch for later, only if a concrete need appears.
2. **Premium = calm authority + honesty + craft, not effects.** One accent colour, restraint, no decorative motion, no scarcity/countdowns/fake social proof, no celebration of a POA draft. Rejected outright (spec §14): confetti, onboarding tour, analytics consent banner (D10 cookieless analytics — verify at deploy), marketing theme screenshots, plaintext-`localStorage` "save & exit" (must persist via the encrypted vault store), and any invented founder story.
3. **Content & voice system.** Every user-facing word is reviewed; trust is *shown by mechanism* and never requested. Banned patterns (case-insensitive): `guarantee|trust us|trusted by|100 ?%|bank-grade|military-grade|privacy-first|peace of mind|rest assured|hassle|seamless|effortless|revolutionary|ai-powered|instantly`. Copy moves to typed modules in `src/content/{marketing,app,auth,legal,errors}.ts`. Known hits to fix: "privacy-first" ×2 in `src/app/privacy/page.tsx`, "Opening secure checkout…" in `src/components/CheckoutButton.tsx` (→ "Opening Paddle checkout…").
4. **Scope guard.** Presentation, states, copy, a11y, perceived performance only. No engine behaviour, no new LLM-calling routes, no new capabilities. The post-AM-17 feature freeze stands.

## 3. Read in this order before building

1. `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` (entire file).
2. `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` → AM-18 and AA-26…AA-29.
3. `AGENTS.md` → "Domain topology" and "Design & UI/UX Standards".
4. `docs/DECISIONS.md` → the two 2026-09-04 entries.
5. `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` §1 (the dashboard must render `caseState`) and `04-EVIDENCE-FIRST-HARDENING.md` (readiness wording: "case-file completeness — not a prediction").

## 4. Your tasks, in order

**Task 0 — Verify and commit the 4 Sep work.** Run `npm run typecheck && npm run lint && npx vitest run`. Review `git diff` for the files in §1. Commit as two commits: (a) `feat(routing): single-host topology by default (urls.ts, middleware single-host mode, docs)` covering `src/middleware.ts`, `src/lib/urls.ts`, the five `(app)` pages, `.env.example`, `docs/DEPLOYMENT.md`, the AGENTS.md hosting/topology edits; (b) `docs(plan): AM-18 premium UI/UX spec + content system, AA-26…AA-29` covering the 06 spec, amendments, CLAUDE.md, DECISIONS.md, the AGENTS.md design-standards edit, and this handoff. Do not push unless the founder asks.

**Task 1 — Wave A (AA-26, foundation).** Per spec §2, §3, §4, §5, §8, §12:
- Tokens v2 in `src/app/globals.css` + `tailwind.config.ts` (type scale, `--info`, surface tiers, radius/width/motion/z-index scales, tinted shadows; dark elevation by tone + border).
- `next/font` self-hosted pair (one variable sans, one mono); `tabular-nums` on dates/amounts; `text-balance` headings.
- Primitives into `src/components/ui/`: Badge, Skeleton, Alert, Progress, Tabs, Accordion, Dialog, Sheet, Tooltip, Separator, Breadcrumb, Kbd, Label (shadcn/ui, MIT; pin Radix versions; grep any copied file for "superpower" per CLAUDE.md §3 before commit).
- `src/lib/motion.ts` with shared variants; wrap the app in `MotionConfig reducedMotion="user"` + `LazyMotion`.
- Fix sonner: `theme` follows next-themes `resolvedTheme`. Set `defaultTheme="system"` in `src/app/layout.tsx`.
- One `AppHeader` (marketing/app variant by route) replacing the duplicated headers in `SiteHeader.tsx`/`AppShell.tsx`; Sheet mobile nav; breadcrumb in app pages.
- `loading.tsx` at root and in `(app)`.
- Patterns: EmptyState, CopyButton (inline "Copied ✓" 2 s + toast), Badge wrappers (Severity/CaseState/EvidenceStatus), HonestExpectationsCard (copy from `guidance.ts`).
- Scaffold `src/content/` modules and a dev-only `/dev/ui` gallery route (404 in production).
- Gates (spec §15): no hard-coded colours/radii/durations in components; reduced-motion respected; axe 0 serious/critical; screenshots light+dark at 375/768/1280 in the PR.

**Task 2 — Wave B (AA-27 + AA-29, marketing conversion + copy audit).** Per spec §7.1, §9, §10, §11:
- `/`: product-as-artwork hero (real decoded-notice mock), How-it-works (3 steps), honest-expectations strip, founder note (**placeholder until the founder supplies the true text — never invent it**), footer line "AppealDeck never submits to Amazon on your behalf."
- `/decode`: "Try a sample notice" (core fixture, labelled sample), character count + notice-likeness hint (deterministic prefilter), staged reveal (severity → summary → deadlines → DO-NOW/DO-NOT → expectations → CTA); gated kinds show pro-help with no purchase CTA.
- `/pricing`: single price (no strikethrough/timers), Free-vs-Appeal-Pass table, trust card, 7-item FAQ Accordion, EU-withdrawal explicit-consent checkbox + confirmation-email note at the CTA (D8), fictional watermarked sample POA in a Dialog.
- Legal pages: prose styles, 65ch, "Last updated", TOC. New static `/faq`.
- `opengraph-image.tsx`, `icon.tsx`/`apple-icon.tsx`, `manifest.ts`, per-route metadata; sitemap/robots/OG use `SITE_URL` only.
- **Copy audit (AA-29):** inventory every user-facing string in `src/`, move into `src/content/*`, rewrite per spec §10.1–10.3, fix the known hits, add the §10.5 banned-pattern grep to CI with an allow-list, attach a before/after table to the PR.
- Gates: Lighthouse mobile ≥ 90/100/95/95, CLS < 0.1; claims grep = 0; every route has its state quartet.

**Task 3 — Wave C (AA-28, app confidence) — with M-W closure.** Per spec §7.2–7.3: dashboard renders `caseState` (state badge, next best actions, next DeadlineChip, readiness Progress with the exact label above); interview Stepper + resume prompt + save-and-exit **through the encrypted vault store** (`src/lib/vault/browser.ts`) + sticky mobile action bar + one-time why-drawer hint; compose PoaSection ×3 with critic flags in the margin + BeforeYouSubmitChecklist (hosts the M-4 PoaEditor); vault teaching EmptyState + MIME icons + search/filter + Dialog delete; billing device cards; AuthCard for the four auth pages.

**Task 4 — Deploy verification (single host).** On the Vercel preview with `NEXT_PUBLIC_APP_HOST`/`NEXT_PUBLIC_APP_URL` unset: every route serves on one origin; magic-link and Google callbacks return to the same origin; zero cross-host redirects in the network log; `/sitemap.xml` and `/robots.txt` show the deploy origin. Then run `docs/DEPLOYMENT.md` §9 smoke tests. The apex-domain checklist in `AGENTS.md` → "Domain topology" is **founder-triggered** — do not run it unprompted.

**After each wave:** tick the AA item in `02-BUILD-PLAN-AMENDMENTS.md` with a "DONE <date>" note, update `CLAUDE.md` §4 and `AGENTS.md` "Current Project State", append a `docs/DECISIONS.md` entry only if a decision changed, and write `docs/handoffs/<date>-wave-<x>.md`.

## 5. Constraints (non-negotiable)

- CLAUDE.md §2 decisions D1–D10 and §3 FORBIDDEN SOURCES apply. Grep every copied file for "superpower" before committing.
- D6 ethics spine in UI: `guarantee` = 0 in user-facing copy; no win rates, percentages, or hour estimates; severity-gated kinds never get a purchase CTA; read-only and local-first always.
- No `/chat` route; no new routes that call the LLM; `src/core/` behaviour unchanged by this work.
- Do not reintroduce anything rejected in spec §14. Do not publish any founder story the founder has not written.
- Keep the simplicity budget (spec §1.1): one primary action per screen, ≤ 3 cards above the fold, no modal for information.
- Commit or push only when asked; one PR per wave; each PR runs the §15 gates and includes light+dark screenshots at 375/768/1280.

## 6. Founder-gated items (surface them; do not do them yourself)

- True founder-note text for `/` (spec §7.1).
- Ratify AM-18 (rides AA-28) and sign off Wave A+B screenshots before first deploy.
- Run the apex-domain checklist when the domain is connected.
- Phase-0 blockers from CLAUDE.md §4 remain open (credential rotation, Paddle/Polar/Wise/CWS accounts, Agent-Policy text B-08, AM-16/AM-17 ratification).

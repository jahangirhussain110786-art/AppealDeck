# AppealDeck Project Context

## Current Project State
- **Last updated:** 31 Aug 2026
- **Repo layout:** app code lives at repo root (`src/`, `package.json`, `legal/`, `docs/`); all playbook/planning docs in `Planning/`. `.agents/` + `.claude/` skills stay at root. CI runs at repo root.
- **Recent changes:** App kept at repo root (restructure into `Execution/` reverted at founder's request). `src/core/` M-1 platform-agnostic modules built + tested (noticeParser, classifier stage-1, deadlinesModel AM-03, fixtures corpus ≥4/type + adversarial, `runDecode` pipeline barrel) — 20 Vitest tests green on Node 20, D6 "guarantee"=0 guard in place. `@types/node` added to toolchain. `legal/` drafts (privacy/terms/refund/withdrawal-consent). CI green locally via `npm` at repo root. **Founder-action kit drafted in `Planning/`:** service-account cheat-sheet, Paddle application draft, founder identity checklist, external/recruitment/public outreach drafts, master action checklist — so the founder only does logins/payments/posting. **Web base scaffolded (Next.js App Router at repo root):** `/`, `/decode` wired to `runDecode`, `/pricing`, `/privacy`, `/terms`, `/refund`, plus Paddle checkout + webhook API stubs reading env-var names (`PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`). `npm run build` green (11 routes), 20 tests green.
**Supabase integrated via PAT + Management API** (no dashboard/VPN needed for ops): fresh project `dtddptwudzovcchaciwt` (eu-west-1, org `AppealDeck`) with `public.licenses` table (RLS on). Keys in git-ignored `.env.local`; env names in `.env.example`; `src/lib/supabase/{client,server}.ts` wired; schema migration at `supabase/migrations/0001_licenses.sql`. Leaked `fogvzjtxbqgfppdrxqra` not in this account — delete that separate account via VPN. CLAUDE.md §4 tracks live milestone state.
- **Web completeness pass (local-only, no accounts/secrets touched):** added `src/core/guidance.ts` (`KIND_GUIDANCE` per-violation explainer, exported + 2 new tests); rewrote `/decode` with empty/error states, human dates + days-left, guidance panel, and Appeal Pass CTA; added `/not-found`, `/error`, `/robots.txt`, `/sitemap.xml`, richer metadata (title template, OpenGraph, robots), focus/selection a11y in `globals.css`, Refund link in footer, and HMAC-SHA256 signature verification in the Paddle webhook. 22 Vitest tests green; `next build` green (13 routes).
- **Pending (founder):** rotate leaked Supabase creds (`fogvzjtxbqgfppdrxqra`); open CWS/domain/Supabase/Cloudflare/Gemini/Wise/Paddle/Polar accounts; apply to Paddle behind live site + legal pages; retrieve BSA §19 text; engage accountant + E&O + consultant.
- **Blocked:** (none at repo level — build M-1 waits on founder's Phase-0 account/credential actions).

## What This Is
AppealDeck is a Chrome extension + web SaaS for suspended Amazon sellers (notice decoder → POA composer → deadline tracker → encrypted local vault; $199 one-time Appeal Pass). Planning docs in `Planning/`; Paddle billing skills in `.agents/`; Kilo config in `kilo.json`.

## Founder & Entity (settled — do not re-litigate)
- **Founder:** Jhangir Hussain, solo, based in Pakistan.
- **Entity:** Individual seller (not a company). Hawlton is a brand/trading name only ("AppealDeck by Hawlton"); no corporate legal entity is claimed as the contracting party at this stage.
- **Incorporation trigger:** ~PKR 5–10M/yr retained profit or a material liability change. Paddle supports entity changes that carry subscriptions/customers over.
- **Payout:** Personal Payoneer or Wise personal account. No SECP paperwork, company bank account, or NTN required for the Individual stage.

## Payment Rails (settled — D2)
- **Primary:** Paddle (5% + $0.50/txn, tax-inclusive, MoR handles VAT). Apply as Individual; category = "Digital products or SaaS" only. Never tick "Human services."
- **Warm fallback:** Polar (free tier 5% + 50¢; Pro $20/mo 3.8% + 40¢). **Mandatory verify-at-signup step:** confirm Pakistan payout via Stripe Connect before counting on this rail.
- **Plan-C:** Dodo Payments (4% + 40¢, MoR built for Pakistan-region sellers). Application-ready only; no account until triggered.
- **Not available:** Stripe direct and PayPal do not support Pakistan entities. Lemon Squeezy is sunsetting.

## Tech Stack (Modern Web-Stack)
- **Frontend**: React 18+ with TypeScript, Next.js App Router
- **Styling**: Tailwind CSS (utility-first, no inline styles)
- **Components**: shadcn/ui primitives as base components
- **Animations**: Framer Motion (subtle, purposeful motion)
- **Icons**: Lucide icons
- **State**: React hooks + Context (Zustand if complex state needed)
- **API**: Server Actions, Route Handlers, Paddle SDK for billing

## Design & UI/UX Standards
- **Aesthetic**: Clean, modern, premium feel — whitespace-driven, subtle depth
- **Dark mode first**, light mode via system preference
- **Mobile-first responsive**: 320px → 768px → 1024px → 1440px
- **Micro-interactions**: hover lift, card scale, button feedback
- **Loading/empty/error states required** on every screen
- **Accessibility**: semantic HTML, ARIA labels, keyboard nav, focus rings, WCAG AA contrast
- **Component patterns**: composable, `cn()` for conditional classes, forward refs

## Setup And Commands
- Dependencies: `npm install` at repo root (where package.json lives)
- Dev: `npm run dev` (from repo root)
- Build: `npm run build` (from repo root)
- Tests: `npm test` (Vitest, from repo root) — 20 tests green on Node 20
- Typecheck: `npm run typecheck` (from repo root)
- CI: `.github/workflows/ci.yml` runs typecheck + test at repo root on Node 20
- Git: repo is initialized with initial commit on `master`

## Boundaries
- Do not edit files in `07-REFERENCE/` without asking
- Do not commit secrets or API keys
- Do not push to remote unless explicitly asked
- Do not run destructive git commands (`push --force`, hard reset, etc.)

## Sensitive Files
- `.env`, `.env.*`, `credentials.json`, any file with `secret` or `key` in name

## Coding Style
- Match existing conventions in whatever file you edit
- Prefer minimal, surgical changes
- Do not add comments unless asked
- Use `edit` tool for existing files (never re-paste unchanged code)

## Expected Handoff
- After non-trivial work, summarize what changed and what was validated
- If something failed, state the exact error and the most likely fix

## When To Stop And Ask
- Ambiguous requirements with broad blast radius
- Changes to auth, billing, encryption, migrations, or deployment
- Any external send, purchase, or deletion
- Multiple valid approaches with no clear best choice

## Kilo Behavior Rules (how this agent thinks)
- **Step-by-step reasoning first:** For non-trivial decisions, use sequentialthinking — plan in ≤5 bullets, weigh 2-3 options, pick one, then act.
- **Verify before claiming:** Use duckduckgo (web search) + fetch (URL content) for any factual claim about APIs, prices, docs, or live behavior. Never state unverified facts.
- **Modular output:** When generating large code/config, deliver in scoped chunks — one logical change per turn. Stop and report; don't chain silently.
- **Token awareness:** Compaction kicks in at 80%. Use `kilo_local_recall` to pull past context by session name instead of re-reading full files.
- **No local LLM hosting:** All reasoning runs via cloud APIs (kilo-auto/free model). No Ollama or local GPU overhead.

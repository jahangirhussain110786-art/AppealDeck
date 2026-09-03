# AppealDeck Project Context

## Current Project State

- **Last updated:** 3 Sep 2026 (late evening — first LLM call site + UX wire-up shipped)
- **7 NEW commits pushed to origin/master this session, on top of the 4 from earlier today:**
  - `76c425f` supabase: 0007_audit_fixes.sql — 1 file, +137 (additive, idempotent): `licenses_status_check`, `licenses_plan_check`, `licenses_email_format_check`; vault bucket `allowed_mime_types` cleared (Supabase JS sends `application/octet-stream` by default); `license_events.license_id` FK + scoped RLS; composite `(email, status)` index. Deferred (logged in commit body): `transaction.completed` Paddle webhook falls back to `data.id` for `provider_subscription_id`; first cancel may fail to UPDATE. Separate `provider_transaction_id` column in a future migration. **APPLIED by founder 3 Sep 2026.**
  - `15a6b5e` Gemini wrapper (REST, breaker-wrapped) + env docs — 3 files, +242/-4: `src/lib/llm/gemini.ts` (fetch-based, no SDK dep, 8s timeout, 512 max output tokens, `GeminiCallResult` typed, `withGeminiBreaker` wrapper, 8 unit tests on `isGeminiConfigured` + `getGeminiModel` + `parseGeminiResponse`); `.env.example` cleaned (single `GEMINI_API_KEY` + `GEMINI_MODEL`).
  - `3633dbb` gemini: fix deprecated model + tighten breaker to free-tier ceiling — 3 files, +11/-6: default model `gemini-1.5-flash` → `gemini-2.5-flash` (verified via web search 3 Sep 2026: 1.5-flash deprecated; 2.5-flash free tier is 10 RPM, 250 RPD, 1M context); `breakerOptions` `spendCapPerDay` 5000 → 240, `perMinuteLimit` 20 → 9 (~90-95% of free tier ceiling, leaves buffer for the documented "actual capacity may vary below the official limit" gap). `.env.example` now comments which free-tier models are safe (2.5-flash, 2.5-flash-lite) and which to avoid (1.5-flash deprecated, 3.x paid only).
  - `6a56c65` Add /api/extract-field (first LLM call site, breaker-wrapped) — 2 files, +272: `src/app/api/extract-field/route.ts` (`handleExtractField(req, deps?)` inner + `POST = withGeminiBreaker(requireUser + handleExtractField)` wrapper; Zod schema `ExtractFieldSuggestions`; code-fence-stripping parser; rules-only fallback returns 200 with `{ok:false, reason:"rules_only"}`); `src/app/api/__tests__/extract-field.test.ts` (11 tests via `vi.mock` of `@/lib/llm/gemini.callGemini`).
  - `f3aa436` Wire /api/extract-field into InterviewFlow — 3 files, +248: `src/components/FieldSuggester.tsx` (state machine: idle/loading/suggested/rules_only/error; calls `/api/extract-field`; disabled until text ≥ 20 chars; read-only suggestion card with kind label lookup, severity badge, timeline line — no Accept/Dismiss because the case file doesn't store structured suggestions and a fake "captured" toast would lie to the seller); `src/components/InterviewFlow.tsx` (renders `<FieldSuggester>` only on `step.kind === "intake_root_cause" && step.inputType === "short_text"`); `src/components/__tests__/FieldSuggester.test.ts` (6 tests on `canSuggest`).
- **Validation after all 7 new commits:** typecheck/lint/build all green; **224/224 Vitest across 20 files** (was 199 → 207 → 218 → 224); 20 routes + middleware; First Load JS shared unchanged; /case page bundle 7.61 kB / 155 kB First Load JS. Playwright: 11/12 (1 pre-existing `marketing.spec.ts:39` failure still).
- **Founder action items (3 Sep 2026 late evening, status):**
  - ✅ `0006_device_activations.sql` applied to live Supabase (earlier today).
  - ✅ `0007_audit_fixes.sql` applied to live Supabase (this session).
  - ⏸ `GEMINI_MODEL` in `.env.local`: change `gemini-1.5-flash` → `gemini-2.5-flash` before next LLM call. Same in Vercel deployment env. `GEMINI_API_KEY` already set in `.env.local` this session.
  - ⏸ Upstash: create account, paste `UPSTASH_REDIS_REST_URL` (https form, NOT `rediss://`) + `UPSTASH_REDIS_REST_TOKEN` into deployment env. Until then, the breaker is a no-op (safe but doesn't enforce the 240 RPD cap).
  - ⏸ Gate 2 hard items unchanged: BSA §19 full text, E&O insurance, GDPR Art. 30 + DPAs, CWS unlisted submission, 3 design partners through full flow, 10k-record Dexie migration drill end-to-end on live data.
- **Pending audit items (3 Sep 2026, late-evening status):**
  - AM-12 circuit breaker — **wired to first consumer (`/api/extract-field`) as of `6a56c65`**. Rules-only fallback is `{ok:false, reason:"rules_only"}` 200 OK so the client UX never breaks. ✅ no longer a scaffolded-only item.
  - AM-17 first LLM call site — **shipped as `/api/extract-field`**. Schema-bounded (Zod), 2KB input cap, 256 max output tokens, 8s timeout, temp 0.1. Returns either `{ok:true, suggestions:{...}}` or `{ok:false, reason:"rules_only", message}` (200 status in both cases). ✅ done.
  - AM-14 / AA-17 remote-settings kill switch + drill — **not in code**. ⛔ not done. This is the next "B" task.
  - AM-15 / AA-18 crxjs pin + WXT fallback — **not in code**. The extension itself doesn't exist; this is M-7/M-8 work. ⛔ N/A until then.
  - AM-07 LLM inversion (cloud paid tier is the primary quality path) — **partially delivered**: Gemini wrapper is in, breaker is in, /api/extract-field is in, InterviewFlow is wired. The "paid tier" half of this is the founder's `GEMINI_API_KEY` decision (currently free tier per the breaker ceiling 240 RPD). ⏸ founder's call when to enable billing.
  - License lookup is still `email`-based; the "user_id" migration (per the audit) would require the Paddle webhook to also resolve + store `user_id`, and is independent of AM-11. ⏸ founder to schedule.
  - Playwright e2e has no auth setup — specs never log in, so changing `requireUser()` has no test signal. ⏸ next on the list after AM-14.
  - `/api/analyze-reply` is unauthenticated + rate-limit-less — ✅ closed in `63e6359`.
  - `/decode` marketing page runs `runDecode()` in-browser; the `/api/decode` route is reachable only via e2e. ⏸ schema of choice — keep client-side (current) or move to server (Gate 2 §28 wants real server traffic for analytics).
  - **D9 tension noted**: free-tier Gemini means Google may train on user data per default AI Studio ToS. First paying customers should be moved to Tier 1 billing (~$0.75/M input tokens, 1000 RPD) BEFORE significant real case data flows. ⏸ founder's call.
- **Infra cleanups (3 Sep 2026):** `vitest.config.ts` created — Vitest now scopes to `src/**/*.{test,spec}.{ts,tsx}` and excludes `e2e/**` (the 2 Playwright spec files used to be picked up by Vitest and fail with a `Cannot find module '@playwright/test'` error). `.gitignore` now also ignores `.mcp-bridge-*.cmd` and `appealdeck.md` (stray workspace artifacts). 10 stale `.claude/skills/paddle-*/SKILL.md` deletions shipped in `6461111` (the real skills are in `.agents/skills/paddle-*/`). **Branch is now in sync with `origin/master`** as of `3def404`.
- **6-PR 'amazing webapp' tool pass (3 Sep 2026):** 6 reviewable commits ship the highest-ROI items from the 2026-09-03 audit (other-AI advice was verified, 12 of 20 items rejected as over-engineering for solo founder in Pakistan). Commits in order: `88bed46` Zod 4 schemas in all 4 API routes (170→**180** tests, +11 new), `951b32e` Sonner toasts across VaultView/ComposeView/SignOutButton/CheckoutButton (replaces silent inline status with rich toasts), `272d493` `@next/bundle-analyzer` opt-in via `npm run analyze`, `6ddf62a` Upstash Ratelimit on `/api/compose` (30/min) + `/api/interview` (60/min) — bypasses cleanly when env unset so dev/CI never need an account, `e983c0c` Playwright e2e (12 tests, 2 specs covering marketing + auth gate + 4 API routes), `85615cb` Lighthouse CI (4 URLs, perf≥0.9 warn + a11y/bp/seo≥0.95 error) + new `e2e` and `lighthouse` CI jobs. **Total: 173 Vitest tests across 15 files, 19 routes + middleware, First Load JS shared 87.3 kB unchanged.** Rejected items (kept as DEFER): Storybook, MSW, TanStack Query, TanStack Table, TipTap/Lexical, Liveblocks, Style Dictionary, Partytown, Cloudinary, Next.js 15 + Turbopack (one planned PR after M-7/M-8). Rejected items (SKIP entirely): Zustand/Jotai, React Hook Form, Vercel Image (built-in). Founders action: create Upstash account, paste `UPSTASH_REDIS_REST_URL` (https form, not the `rediss://` URL) + `UPSTASH_REDIS_REST_TOKEN` into deployment env. Run `npm run dev && npx playwright test` locally to see the 12 e2e specs pass. CI: 3 jobs (build / e2e / lighthouse) on every PR.
- **M-6 encrypted evidence vault (3 Sep 2026):** Ships on `/app/vault` (license-gated). Browser-only — Dexie (IndexedDB) + WebCrypto. Envelope v1: AES-GCM 256-bit, 12-byte IV, optional AD, base64-iv/ct. Key model (TRC-03): PBKDF2-SHA-256 (310K iters) → KEK → wraps random DEK → DEK encrypts records. Wrapped DEK stored on disk; KEK never persisted; passphrase is the only secret. Two-mode supported in core (`initWithPassphrase` / `initWrapped`) but UI ships passphrase-only. Cloud sync uploads ciphertext-only JSON to `appealdeck-vault` Storage bucket, owner-scoped via RLS policies on `storage.objects` (`vault_owner_select/insert/update/delete`, folder prefix = `auth.uid()::text`). 10 MB per-record cap. Evidence slots from case file merged with vault records on compose load (reads from vault when unlocked, maps `evidenceKind` → `present: true`). `src/core/vault/{envelope,crypto,schema,db,vault}.ts` + `src/lib/vault/browser.ts` + `src/components/{VaultView,EvidenceSlotPanel}.tsx`. `src/app/(app)/vault/page.tsx` is server-component, gates on `requireUser()` + active license; `isLicenseActive` helper in `src/lib/license.ts`. AppShell nav has "Vault" entry. `requireUser()` now returns `{ id, email? }` (Supabase user id propagated for storage paths). 159 Vitest tests across 13 test files (133 prior + 26 new: 10 crypto, 15 vault, 1 10k migration). `docs/MIGRATIONS.md` written (AA-16 contract). `supabase/migrations/0005_vault_storage.sql` adds bucket + RLS.
- **Production-readiness pass (2 Sep 2026):** 8 fixes shipped in one shot — (1) migration `0004_license_lifecycle.sql` adds `canceled_at`/`paused_at` columns + `provider_subscription_id` index (webhook UPDATE path was crashing); (2) `/api/compose` now gated with `requireUser()` + active-license check (was fully open); (3) `/app/compose` page is now a server component that gates on auth+license, client logic split into `src/components/ComposeView.tsx`; (4) `warning` + `success` Tailwind colors + CSS vars added (9 elements in `case/page.tsx`, `compose/page.tsx`, `InterviewFlow.tsx` were using dead classes); (5) `(app)/layout.tsx` + `src/lib/auth.ts` `requireUser()` now wrap `supabase.auth.getUser()` in try/catch (was 500-ing the app shell on any auth error); (6) ESLint + Prettier added — `npm run lint` / `npm run format:check` / `npm run format`, CI updated, `next.config.mjs` no longer suppresses ESLint; (7) `LICENSE` file (proprietary, all-rights-reserved) added; (8) `sitemap.ts` + `robots.ts` default to `.com` (was `.app`). Validation: typecheck, lint, format:check, 133 tests, build (18 routes + middleware) all green.
- **M-W web surface (built 2 Sep 2026):** Interactive Guided Interview ships on `/app/case` for licensed users — `src/components/InterviewFlow.tsx` renders typed per-step inputs (enum chips, date/number/short-text fields, file-upload placeholder, decline-with-reason + alternatives) with NO persistent input box, deterministic-first routing via `src/app/api/interview/route.ts` (start + answer actions, input-capped, schema-validated, no `/chat` route). On completion the case file persists to sessionStorage and the user is sent to `/app/compose` (`src/app/(app)/compose/page.tsx`, server-component gate + `src/components/ComposeView.tsx` client UI, reads case file from URL param or sessionStorage, calls `/api/compose`, renders POA text + critic findings + gap-draft watermark + copy-to-clipboard). `npm run build` passes: 18 routes + middleware. 133 tests still green.
- **Plan files added (2 Sep 2026):** `03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md` (EF-1…EF-5 spec), `02-BUILD-PLAN-AMENDMENTS.md` (AM-16/AM-17 added to index, AA-19…AA-25 action items), `03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` (state machine + Guided Interview spec), `reference/2026-09-02-POLICY-FACTCHECK.md` (archived research), `reference/2026-09-02-COMPETITOR-RECHECK.md` (archived research).
- **Google Drive MCP (HTTP transport, 1-call ready, applied 1 Sep 2026):** Migrated from stdio to Streamable HTTP. `kilo.json` now declares `google-drive` as `type: "remote"` at `http://127.0.0.1:3100/mcp`. Lifecycle managed by `npm run drive:up` (start, idempotent, polls readiness) and `npm run drive:down` (stop, also kills stragglers by port + command line). Scripts in `scripts/drive-mcp-{up,down}.mjs` + `scripts/drive-mcp-up.cmd` (the .cmd fully detaches on Windows so `npm` doesn't hang). 116 tools enumerate over the long-lived HTTP server — every Drive call is one TCP round-trip (~100ms), no per-call 3-5s npx startup. **Before doing any Drive work, ensure the server is up: `npm run drive:up`.** If native `google-drive_*` tools don't appear in the session tool list, restart the Kilo CLI after running drive:up so tool discovery re-runs.
- **Drive skills (2, intent-driven, applied 1 Sep 2026):** `.agents/skills/drive-quick/SKILL.md` — 1-call markdown/text note creation (the common case). `.agents/skills/drive-workflow/SKILL.md` — every other Drive intent (read, structured create, share, organize, template fill, update) with 8 intent playbooks. Both are file-arg-only (rejects inline JSON). Templates folder at `Planning/templates/` (currently empty — add a `.md`/`.json` only when a real recurring need appears; do NOT add a new skill per template).
- **MCP-Windows playbook (settled):** All new MCP servers on Windows should prefer `type: "remote"` against a long-lived local HTTP endpoint over stdio. If stdio is unavoidable, use `cmd /c npx ...` AND verify with a fresh session — silent stdio failures on Windows were the root cause of the 1-Sep issue. See `.agents/skills/google-drive/SKILL.md` and `Planning/04-BUILD/MCP-ON-WINDOWS.md` for the full decision record.
- **Google Drive artifacts:** `Appealdeck-Budget` Google Sheet was created 1 Sep 2026 (ID `1pM6UpK_dCRVaI9XnPveWFVqcDvdglLV2wIaIduqFXG4`) but **deleted (trashed) 1 Sep 2026** at founder's request. **Google Sheets API is enabled on project 322861054648.**
- **Hosting architecture (settled):** ONE Next.js app at repo root, host-routed via `src/middleware.ts`. Marketing at `appealdeck.com` (routes `/`, `/decode`, `/pricing`, `/privacy`, `/terms`, `/refund`); authenticated webapp at `app.appealdeck.com` (route group `src/app/(app)/` → `/app` dashboard, `/app/login`, `/app/billing`, `/auth/callback`). Middleware redirects marketing-only paths off the app host and `/app*` off the marketing host. Env hosts: `NEXT_PUBLIC_MARKETING_HOST` / `NEXT_PUBLIC_APP_HOST` (defaults `appealdeck.com` / `app.appealdeck.com`).
- **Auth + app (built):** Supabase Auth via `@supabase/ssr` (`src/lib/supabase/{client,server}.ts` rewritten for cookies; `src/lib/auth.ts` `requireUser()`). App shell `src/components/AppShell.tsx` + `SignOutButton.tsx`. Dashboard + Billing read `public.licenses` by `auth.email()` via the `service_role` admin client and show active/plan/key. Email+password and magic-link login implemented; `/auth/callback` exchanges the code.
- **Billing integration (built, founder creds pending):** Paddle webhook `src/app/api/webhooks/paddle/route.ts` now verifies HMAC, parses `transaction.completed` / `subscription.activated|created|canceled|paused`, and upserts a `licenses` row (generated key) via `supabaseAdmin`. Checkout is client-side Paddle.js v2 overlay via `src/components/CheckoutButton.tsx`, wired into the pricing CTA (replaces the old dead-end `/api/checkout` stub, which was deleted). Env: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_APPEAL_PASS`/`PADDLE_PRICE_GUARDIAN_SUB`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_ENV`.
- **RLS (migration written, APPLIED by founder 31 Aug 2026):** `supabase/migrations/0001_licenses.sql` creates the table (RLS on, no policies). `supabase/migrations/0002_rls.sql` adds `licenses_select_own` / `licenses_update_own` policies (authenticated user matches `email = auth.email()`); inserts remain service_role-only. Webhook + dashboard use service_role so they work regardless.
- **Core + UI:** `src/core/` M-1 decode pipeline + `guidance.ts` + evidence model + case state machine + response analyzer + readiness + letters + interview engine + composer/critic (133 Vitest tests green). UI aligned to global `frontend-specialist` (shadcn primitives, Framer subtle motion, Lucide, `cn()`, dark-first + system, a11y, mobile 320→1440, `PageShell`, skip-link, `icon.svg`). `npm run typecheck`, `npm test` (133), and `npm run build` (16 routes + middleware) all green.
- **Repo layout:** app code at repo root (`src/`, `package.json`, `legal/`, `docs/`); planning docs in `Planning/`; `.agents/` + `.claude/` skills at root; CI at root. `.env.example` documents all env-var names (real values live in deployment env stores only).
- **Drive skill folder cleaned (2 Sep 2026):** Deleted stale `one-shot.cjs` and `persistent-mcp.cjs` (legacy npx-stdio wrappers, zero references). Moved `Planning/google-drive-mcp-health-check.md` → `.agents/skills/google-drive/troubleshooting.md` (updated stale stdio→remote HTTP references). Final folder: `SKILL.md`, `gdrive.cjs`, `gdrive.ps1`, `troubleshooting.md`. Architecture: long-lived HTTP server on `http://127.0.0.1:3100/mcp` (started with `npm run drive:up`); Kilo's MCP loader connects to it as `type: "remote"` and exposes all 116 tools as `google-drive_*`. If native tools are missing in a new session, run `npm run drive:up` then restart the Kilo CLI. Wrappers (`.agents/skills/google-drive/gdrive.{cjs,ps1}`) are file-arg-only fallbacks for non-Kilo callers. Account: jahangirhussain110786@gmail.com.
- **MCP decision record:** `Planning/04-BUILD/MCP-ON-WINDOWS.md` — why we use Streamable HTTP over stdio on Windows, and the playbook for adding any new MCP. **Read this before adding another MCP server.**
- **MCP future-reference (operational):** `Planning/04-BUILD/MCP-FUTURE-REFERENCE.md` — decision tree, lifecycle script template, verify checklist, and debugging matrix for any new or broken MCP. Read this when the founder asks to add an MCP, when an MCP stops working, or when tools are missing in a session.
- **Blocked:** M-6 vault, M-W web surface (interactive interview UI, composer view, analyze-reply view — API routes and case page scaffold done), M-7/M-8 extension not yet built (dashboard currently shows license status only). Local testing of Supabase/Paddle blocked from PK without VPN.
- **.gitignore hardened (2 Sep 2026):** Added `skills-lock.json` (Kilo auto-generated lock file) to root `.gitignore`; added `run-script.ps1` + `setup-script.ps1` to `.kilo/.gitignore` (Kilo Agent Manager internal scripts). Untracked both from git index. Runtime files `.drive-mcp.{pid,log}` were already ignored. `npm run drive:up/down` + Drive skill files in `.agents/skills/` remain tracked (they are project-relevant).

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

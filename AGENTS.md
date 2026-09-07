# AppealDeck Project Context

## Current Project State

- **Last updated:** 7 Sep 2026 (Wave C complete — Tasks 0-7: Dashboard as CaseState home, InterviewFlow vault save + Stepper, Compose PoaSection+checklist, VaultView teaching state + search + delete Dialog, Billing content strings + refund link + DeviceManager Dialog revoke, AuthCard shared component + content/auth.ts, axe-core a11y e2e spec + lighthouse a11y 1.0, lighthouserc + CI updates. All gates green: typecheck 0 errors, lint 0 warnings, lint:copy PASS, format:check PASS, build 27 routes + middleware, vitest 261/261.)

## Wave C — Completed (Tasks 0-7)

See `Planning/03-PHASE-2-BUILD/08-WAVE-C-HANDOFF.md` for full detail.

- **NEW pending commit (this session):**
  - **Vercel-free-tier readiness — 6 files, +283/-74.** `vercel.json` (build/install/dev commands, `iad1` region, security headers: HSTS/X-Content-Type-Options/X-Frame-Options/Referrer-Policy/Permissions-Policy, `maxDuration: 30` on `paddle` webhook, `maxDuration: 15` on `extract-field` — both at the Vercel Hobby ceiling). `docs/DEPLOYMENT.md` (single source of truth for getting to prod: Vercel project import, env vars per-scope, Supabase + Paddle + Upstash one-time setup, the 8-post-deploy smoke tests, Vercel Hobby constraints table, "when to leave Hobby" gate). `.github/workflows/deploy-preview.yml` (PR-only; runs typecheck+lint+build then `vercel deploy --prebuilt` and comments the preview URL on the PR via sticky-pull-request-comment). `.env.example` rewritten — removed ~10 unused vars flagged by deployment audit (PADDLE_API_KEY, POLAR__, PAYMENTS_PROVIDER, SUPABASE_PROJECT_REF, SUPABASE_DB_DUMP_ENCRYPTION_KEY, ANALYTICS__, 9 MCP-only vars) into a "NOT USED BY THE APP" section; kept the 11 runtime vars organized by source. `src/components/AppShell.tsx` — dropped duplicate "Dashboard" + "Case" nav links (both pointed to `/case`); added `usePathname` active-route highlight via `aria-current="page"`; added a "skip to main content" link for keyboard/screen-reader users; added `"use client"` (parent layout stays a server component, only this subtree hydrates — no page-level regression). `vitest.config.ts` — `testTimeout: 15_000` + `hookTimeout: 30_000` (vault tests now reliably pass under parallel load; the "changes passphrase" test took 1.66s after first PBKDF2 spike — the 5s default was flaky when vitest parallelized across the vault+migration files). **Validation:** typecheck ✅, lint ✅, build ✅ (23 routes + middleware; `/case` 7.61 kB, `/billing` 2.47 kB unchanged), vitest 237/237 ✅. 2 pre-existing format warnings in `analyze-reply/route.ts` and `ratelimit.ts` (not introduced by this commit). **Audit context:** ran 4 specialist audits in parallel (architecture, deployment, code-skeptic, frontend-specialist). 2 subagents hit `ProviderModelNotFoundError` and were re-run inline via direct file reads. Final tier-0 CRITICAL: 0 issues (no security holes, no missing await, no PII log, no secret leak, license gates all real, Paddle HMAC verified). Tier-1 HIGH items addressed: env-var noise, no deployment guide, no Vercel config, no deploy-preview CI. Tier-2 deferred: no `/api/health` endpoint, no Sentry, no analytics integration, license `user_id` migration, M-6 vault cloud sync UI, Paddle production env vars, E&O insurance, GDPR Art. 30 — all logged in the post-audit synthesis.

## Vercel-free-tier deploy readiness — what the founder still needs to click

1. **Vercel → New Project** → import `appealdeck` repo → set `vercel.json` is auto-applied
2. **Vercel → Settings → Environment Variables** — copy the 11 runtime vars from `.env.example` "USED BY THE APP AT RUNTIME" section (scopes: Production, Preview, Development). Sensitive ones (service_role, API keys, webhook secret, Upstash token) need the "Sensitive" toggle.
3. **Supabase dashboard** → already configured; copy URL + anon + service_role into Vercel env
4. **Paddle dashboard** → create 2 products + 2 prices + live client token + webhook secret → into Vercel env
5. **Upstash** → free database, copy `UPSTASH_REDIS_REST_URL` (https form) + `_TOKEN` into Vercel env
6. **Domains — not needed for the first deploy.** Ship on the Vercel-provided URL in single-host mode (see "Domain topology" below). When the apex domain is connected, run that section's checklist. No `app.` subdomain for now.
7. `git push origin master` → auto-deploys to production
8. Run the 8 post-deploy smoke tests in `docs/DEPLOYMENT.md` §9

## Domain topology — single host now, split later (decided 4 Sep 2026)

**Now (first deploy):** marketing + auth + app on ONE origin — the Vercel `*.vercel.app` URL until the apex domain is connected. Path-based routing only. `NEXT_PUBLIC_APP_HOST` unset (or equal to `NEXT_PUBLIC_MARKETING_HOST`) → `src/middleware.ts` runs in single-host mode (no cross-host redirects). `NEXT_PUBLIC_APP_URL` unset → `src/lib/urls.ts` resolves `APP_URL` to `SITE_URL`. Supabase redirect URL = `<origin>/auth/callback`. Paddle webhook = `<origin>/api/webhooks/paddle`.

**When the real domain is connected (run in this order, ~30 min, keep single host):**

1. Vercel → Settings → Domains: add the apex + `www` (redirect `www` → apex). Set `NEXT_PUBLIC_SITE_URL=https://appealdeck.com` and `NEXT_PUBLIC_MARKETING_HOST=appealdeck.com` in all three env scopes. Leave `NEXT_PUBLIC_APP_HOST` / `NEXT_PUBLIC_APP_URL` unset.
2. Supabase → Authentication → URL Configuration: Site URL = apex; Redirect URLs = `https://appealdeck.com/auth/callback` (+ `http://localhost:3000/auth/callback` for dev). Remove the `vercel.app` entry only after step 4 passes.
3. Paddle → Notifications: webhook destination → apex `/api/webhooks/paddle`; replay one sandbox `transaction.completed`.
4. Smoke: signup → magic link → callback lands on apex; Google sign-in returns to apex; checkout → `licenses` row; `/sitemap.xml`, `/robots.txt`, and the OG image URL all show the apex.
5. **Optional later split to `app.appealdeck.com`** — only for a concrete need (cookie isolation, separate caching, a marketing CMS): set `NEXT_PUBLIC_APP_HOST=app.appealdeck.com` + `NEXT_PUBLIC_APP_URL=https://app.appealdeck.com`; add the subdomain in Vercel; add `https://app.appealdeck.com/auth/callback` to Supabase; make marketing → app links absolute via `APP_URL`; verify the middleware redirects (`/case` on apex → app host; `/pricing` on app host → apex); add e2e coverage for both redirects. `APP_PREFIXES` in the middleware now lists the real app routes (no `/app` prefix since 882ed39) — keep it in sync if routes move.

## When to leave Vercel Hobby (do NOT skip this)

- ≥ 1 paying customer + need team seats + commercial SLA = upgrade to Vercel Pro ($20/mo per member)
- Free tier is fine for the first 20 customers and the 100GB bandwidth / 1M invocations / 1000 concurrent executions limits are not a problem at that scale
- DO NOT run a paid SaaS on Hobby long-term — Vercel ToS allows it technically, but the lack of audit log + team seats is an operational risk for any business that takes real money.
- **Pending commits (not yet pushed; will be one commit before session end):**
  - **Dashboard refactor — 9 files, +/-.**`DashboardClient.tsx` violations fixed: removed percentage/Progress bar, removed `animate-spin` in loading state, added `license` prop, added `HonestExpectationsCard`, fixed `buildContext attemptCount`. New server component at `src/app/(app)/dashboard/page.tsx` (gate: `requireUser()` + fetch license by email → pass to `DashboardClient`). Deleted old `src/app/(app)/page.tsx`. Updated `src/middleware.ts` (`/dashboard` added to `APP_PREFIXES`), `src/components/AppHeader.tsx` (Dashboard link in `APP_NAV`, logo → `/dashboard` in app mode), `src/components/AppBreadcrumb.tsx` (/dashboard link, `/case` link), `src/components/LoginForm.tsx` + `src/app/(app)/signup/page.tsx` (redirect `/` → `/dashboard` post-login), `src/components/HonestExpectationsCard.tsx` (new component), `src/content/app.ts` (added `dashboard.noPass` strings), `src/app/(app)/login/page.tsx` (redirect to `/dashboard`), `src/app/(app)/signup/page.tsx` (redirect to `/dashboard`). New: `src/lib/caseStore.ts` + `src/lib/__tests__/caseStore.test.ts` (caseStore with vault test harness pattern). New: `src/components/ReplyCategoryLabel.tsx`. New: `docs/handoffs/wave-c-working-context.md`. **Validation:** typecheck ✅, lint ✅, build ✅ (24 routes + middleware; `/dashboard` 10.7 kB / 298 kB First Load JS), vitest 261/261 across 24 files ✅.
  - **Auth pages + dev seed script (4 new pages, callback refactor, seed script rotation) — 9 files, +/−.** New: `src/app/(app)/{signup,forgot-password,reset-password}/page.tsx`; updated: `login/page.tsx` (Google + Forgot + Create account + magic-link toggle, all wrapped in `<Suspense>` to satisfy Next 14 prerender), `auth/callback/route.ts` (`type=recovery` → `/reset-password`, error → `/login?error=`, `?next=` honored only when not recovery), `src/lib/__tests__/auth-callback.test.ts` (6 tests, moved to `src/lib/__tests__/` because vitest on Windows can't resolve parens in paths), `e2e/marketing.spec.ts` (+4 cases), `scripts/seed-dev-user.mjs` (now idempotent: lists users → deletes match → creates fresh), `.env.example` (added `DEV_LOGIN_EMAIL`/`DEV_LOGIN_PASSWORD` placeholders). Dev user rotated: `dev@appealdeck.com` / `Dev-aoH4VZcpqToYU98u-9!Aa` (user id `20f36041-11ce-4b80-ab88-4a52e40239e5`). Vitest 224 → 230 (+6); 23 routes + middleware; 4 new auth pages each ~3 kB.
  - **Routing leftovers — 2 files, +2/-2.** `src/components/SignOutButton.tsx` `router.push("/app/login")` → `"/login"`; `src/components/EvidenceSlotPanel.tsx` `<a href="/app/vault">` → `"/vault"`. Both were missed by `882ed39`. Without this fix, signing out 404s. Caught during end-to-end Playwright smoke test of the full auth flow. 230/230 vitest still green.
  - **Gemini LLM live call now returns `ok:true` — 5 files, +87/-21.** Root cause of "Suggest fields (AI)" returning `rules_only` was three-layered: (1) `GEMINI_MODEL=gemini-2.5-flash` 404'd for new keys ("no longer available to new users — use gemini-3.6-flash"); (2) the wrapper sent `responseMimeType: "text/plain"` even when the caller asked for JSON, so the model returned text the Zod parser couldn't accept; (3) the new Gemini 3.5 Flash defaults to a thinking budget that ate the 256-token output cap. Fix: (a) `DEFAULT_MODEL` → `gemini-3.5-flash` (verified 200 OK on the same key; `gemini-2.5-flash` + `-lite` both 404 for new users; `gemini-flash-latest` 503s; safe fallbacks: `gemini-3.5-flash-lite`, `gemini-flash-lite-latest`); (b) `callGemini` now accepts `responseJsonSchema?: object` + `responseJson?: boolean` and maps to `generationConfig.responseMimeType: "application/json"` + `responseSchema` + `thinkingConfig: { thinkingBudget: 0 }` (so 256 output tokens are reserved for the answer, not thinking); (c) `extract-field` route now passes the Zod-derived `RESPONSE_JSON_SCHEMA` to `callGemini` and the system prompt is shorter. Live e2e through dev server returns `{ok:true, suggestions:{suggestedKind:"INAUTHENTIC_DOCUMENTS", suggestedSeverity:"high", suggestedTimelineSummary:"..."}}`. 3 new unit tests assert the request-body shape (text/plain vs application/json+schema vs application/json no-schema). 230 → 233 vitest, +1 model family in `.env.example` comments. `.env.local` updated in place. **Action-item revoked**: "Gemini LLM breaker returning ok:false" is now resolved. **Watch this**: free-tier limits shift frequently; if `gemini-3.5-flash` gets deprecated, fall back to `gemini-flash-lite-latest` (the `latest` alias) without code changes.
  - **Per-task model picker — 4 files, +96/-15.** `LlmTask` enum + `TASK_MODELS` map in `gemini.ts` (`extract-field` / `critique-poa` / `phrase-engine-output` / `triage-router` → recommended free-tier model per use case). `callGemini` now takes `task?: LlmTask`; the resolver checks `GEMINI_MODEL_<TASK_UPPER_SNAKE>` first, then the table, then falls back to the legacy `GEMINI_MODEL` env var. `extract-field` route passes `task: "extract-field"` so it picks the per-task default. Spec doc `02-BUILD-PLAN-AMENDMENTS.md` gains an "LLM model matrix" subsection at the end of AM-17 with the table, override knob, free-tier budget math (3 RPD/case at 20-client target = 80+ cases/day headroom), and 5 tactical rules (no Pro, always schema, always thinkingBudget:0, no /chat, always breaker-wrapped). 233 → 237 vitest (+4 new on per-task selection). Live e2e through dev server: extract-field still returns `ok:true` with `gemini-3.5-flash`.
- **Dev user (ROTATED 4 Sep 2026; original created 3 Sep 2026):**
  - **Email:** `dev@appealdeck.com`
  - **Password:** `Dev-aoH4VZcpqToYU98u-9!Aa` (founder: save to local password manager; do NOT commit)
  - **User ID:** `20f36041-11ce-4b80-ab88-4a52e40239e5`
  - **How to sign in:** `npm run dev`, open `http://localhost:3000/login`, paste email + password, click Sign in. You land on the marketing home (`/`) — there is no `/app` route yet. To get to `/case`, type `/case` in the address bar after sign-in (auth gate lets you through).
  - **To rotate the password (idempotent now):** `node --env-file=.env.local scripts/seed-dev-user.mjs` — the script now lists users, deletes any existing match, then creates a fresh one with a new random password. Safe to re-run.
  - **DO NOT commit this password to the repo.** It's a dev fixture. AGENTS.md is the only place it lives, and this is intentional.
  - **For production:** design partners go through the normal `/signup` flow with their own email + Google. The dev account is for local testing only.
- **Founder action items (NEW from this auth session, status):**
  - ✅ **Supabase dashboard → Authentication → URL Configuration → Redirect URLs:** added `http://localhost:3000/auth/callback` (and prod). Email magic links + Google sign-in both confirmed working in Playwright smoke test.
  - ✅ **Supabase dashboard → Authentication → Providers → Google:** enabled with OAuth client ID/secret from Google Cloud Console; verified end-to-end — clicking "Continue with Google" redirects to `accounts.google.com/v3/signin/identifier?client_id=...` with the Supabase callback as the `redirect_uri`. Reverse direction also correct: Google Cloud Console has ONLY the Supabase callback in its Authorized redirect URIs (not `localhost:3000/auth/callback` — that would be wrong; the localhost URL belongs in Supabase's allowlist, not Google's).
  - ✅ **Supabase dashboard → Authentication → Email → Confirm email:** **OFF**. Decision: paid-tool path. Email ownership is verified at Paddle checkout; the redundant Supabase confirmation step adds zero security and would burn through Supabase's free-tier email rate limit (~3-4 emails/hour project-wide) under even mild sign-up load. `/forgot-password` still works for recovery (low volume). Caveat logged in AGENTS.md so a future free tier is a conscious decision, not an oversight.
  - ✅ `NEXT_PUBLIC_APP_URL=http://localhost:3000` + `NEXT_PUBLIC_SITE_URL=http://localhost:3000` set in `.env.local`.
  - ✅ Dev user `dev@appealdeck.com` created and confirmed.
  - ✅ License row for `dev@appealdeck.com` inserted via SQL `UPDATE ... RETURNING` + `INSERT WHERE NOT EXISTS` (the more robust upsert pattern; `ON CONFLICT` misbehaved in the founder's first attempt). Status `active`, plan `appeal_pass`, key `DEV-LOCAL-001`. License id `b20ac771-8511-477c-a702-dc0b40b2b557`.
- **Validation:** typecheck/lint/build all green; **237/237 Vitest across 21 files**; 23 routes + middleware; dev server serves 200 on `/`, `/decode`, `/pricing`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/case` (redirects to `/login` when unauthed), `/compose`, `/billing`, `/vault`. Playwright end-to-end smoke test (4 Sep 2026, after license row + Google config + Gemini fix + per-task model picker): signed in as `dev@appealdeck.com`; `/case` shows the full Guided Interview (7 enforcement-type chips, "How this works" section, no license gate); `/billing` shows "Appeal Pass — active" + AM-11 device panel; `/vault` shows the passphrase setup screen; "Suggest fields (AI)" fires `/api/extract-field` which now returns `ok:true` with real AI suggestions via `task: "extract-field"` → `gemini-3.5-flash`; "Continue with Google" correctly redirects to `accounts.google.com` with the Supabase callback + state. Sign-out 404'd on `/app/login` (bug from `882ed39` round 2), fixed in `89df3fd`.
- **9 NEW commits pushed to origin/master this session, on top of the 4 from earlier today:**
  - `76c425f` supabase: 0007_audit_fixes.sql — 1 file, +137 (additive, idempotent): `licenses_status_check`, `licenses_plan_check`, `licenses_email_format_check`; vault bucket `allowed_mime_types` cleared (Supabase JS sends `application/octet-stream` by default); `license_events.license_id` FK + scoped RLS; composite `(email, status)` index. Deferred (logged in commit body): `transaction.completed` Paddle webhook falls back to `data.id` for `provider_subscription_id`; first cancel may fail to UPDATE. Separate `provider_transaction_id` column in a future migration. **APPLIED by founder 3 Sep 2026.**
  - `15a6b5e` Gemini wrapper (REST, breaker-wrapped) + env docs — 3 files, +242/-4: `src/lib/llm/gemini.ts` (fetch-based, no SDK dep, 8s timeout, 512 max output tokens, `GeminiCallResult` typed, `withGeminiBreaker` wrapper, 8 unit tests on `isGeminiConfigured` + `getGeminiModel` + `parseGeminiResponse`); `.env.example` cleaned (single `GEMINI_API_KEY` + `GEMINI_MODEL`).
  - `3633dbb` gemini: fix deprecated model + tighten breaker to free-tier ceiling — 3 files, +11/-6: default model `gemini-1.5-flash` → `gemini-2.5-flash` (verified via web search 3 Sep 2026: 1.5-flash deprecated; 2.5-flash free tier is 10 RPM, 250 RPD, 1M context); `breakerOptions` `spendCapPerDay` 5000 → 240, `perMinuteLimit` 20 → 9 (~90-95% of free tier ceiling, leaves buffer for the documented "actual capacity may vary below the official limit" gap). `.env.example` now comments which free-tier models are safe (2.5-flash, 2.5-flash-lite) and which to avoid (1.5-flash deprecated, 3.x paid only).
  - `6a56c65` Add /api/extract-field (first LLM call site, breaker-wrapped) — 2 files, +272: `src/app/api/extract-field/route.ts` (`handleExtractField(req, deps?)` inner + `POST = withGeminiBreaker(requireUser + handleExtractField)` wrapper; Zod schema `ExtractFieldSuggestions`; code-fence-stripping parser; rules-only fallback returns 200 with `{ok:false, reason:"rules_only"}`); `src/app/api/__tests__/extract-field.test.ts` (11 tests via `vi.mock` of `@/lib/llm/gemini.callGemini`).
  - `f3aa436` Wire /api/extract-field into InterviewFlow — 3 files, +248: `src/components/FieldSuggester.tsx` (state machine: idle/loading/suggested/rules_only/error; calls `/api/extract-field`; disabled until text ≥ 20 chars; read-only suggestion card with kind label lookup, severity badge, timeline line — no Accept/Dismiss because the case file doesn't store structured suggestions and a fake "captured" toast would lie to the seller); `src/components/InterviewFlow.tsx` (renders `<FieldSuggester>` only on `step.kind === "intake_root_cause" && step.inputType === "short_text"`); `src/components/__tests__/FieldSuggester.test.ts` (6 tests on `canSuggest`).
  - `882ed39` **Fix (app) route group: URL prefix mismatch with UI links** — 7 files, +14/-18. **Pre-existing bug** that survived every prior audit because the app was never run end-to-end: the `(app)` route group is transparent in Next.js, so `src/app/(app)/{billing,case,compose,login,vault}/page.tsx` map to `/billing`, `/case`, `/compose`, `/login`, `/vault` — NOT `/app/billing`, `/app/case`, etc. The UI's AppShell, InterviewFlow, ComposeView, SignOutButton, and EvidenceSlotPanel all linked to `/app/...` with the planning-docs prefix, so the entire protected area was unreachable from the UI. The `/app` (dashboard) at `src/app/(app)/page.tsx` collided with `/` (marketing home) in the build and was silently dropped. **Fix:** stripped `/app/` from the 11 client-side hrefs and replaced the AppShell logo + Dashboard link with destinations that exist (`/`, `/case`). Mismatches the planning docs but unblocks testing in one commit instead of moving 5 directories + updating the Supabase Site URL. **Revert path:** see "Routing fix revert" section below. Manual smoke test: dev server serves 200 on `/`, `/decode`, `/pricing`, `/login`, `/case` (redirects to `/login` when unauthed), `/compose`, `/billing`, `/vault`. Playwright verified via `kilo-playwright_browser_navigate` snapshots for `/`, `/decode`, `/login`, and the auth gate.
- **Validation after all 9 new commits:** typecheck/lint/build all green; **224/224 Vitest across 20 files**; 20 routes + middleware. /case page bundle 7.61 kB / 155 kB First Load JS. Playwright: previously 11/12 (the 1 pre-existing `marketing.spec.ts:39` failure on `/app` is now fixed in `882ed39` — new marketing.spec.ts replaces it with a direct `/login` render test).**

*Wave C update (7 Sep 2026): All gates green after Wave C — typecheck 0 errors, lint 0 warnings, lint:copy PASS, format:check PASS, build 27 routes + middleware, vitest 261/261 across 24 files. See `08-WAVE-C-HANDOFF.md`.

- **Founder action items (3 Sep 2026 late evening, status):**
  - ✅ `0006_device_activations.sql` applied to live Supabase.
  - ✅ `0007_audit_fixes.sql` applied to live Supabase.
  - ✅ `GEMINI_MODEL` set to `gemini-2.5-flash` in `.env.local` (founder pre-emptively updated after the model-fix commit).
  - ✅ Upstash credentials set in `.env.local` (`https://rare-lynx-127598.upstash.io` + token). **Still needs to be set in Vercel deployment env** before production traffic.
  - ✅ `GEMINI_API_KEY` set in `.env.local`.
  - ⏸ Gate 2 hard items unchanged: BSA §19 full text, E&O insurance, GDPR Art. 30 + DPAs, CWS unlisted submission, 3 design partners through full flow, 10k-record Dexie migration drill end-to-end on live data.
- **Pending audit items (3 Sep 2026, late-evening status):**
  - AM-12 circuit breaker — **wired to first consumer (`/api/extract-field`) as of `6a56c65`**. Rules-only fallback is `{ok:false, reason:"rules_only"}` 200 OK so the client UX never breaks. ✅ no longer a scaffolded-only item.
  - AM-17 first LLM call site — **shipped as `/api/extract-field`**. Schema-bounded (Zod), 2KB input cap, 256 max output tokens, 8s timeout, temp 0.1. Returns either `{ok:true, suggestions:{...}}` or `{ok:false, reason:"rules_only", message}` (200 status in both cases). ✅ done.
  - **AM-14 / AA-17 remote-settings kill switch + drill — scope is Chrome-extension-specific (service worker fetches remote config daily, minSupportedVersion, staged CWS rollout). The extension doesn't exist yet. Founder decision (3 Sep 2026) on B scope: defer the full AM-14 spec until M-7/M-8 exists; in the meantime, the user explicitly asked to test the webapp end-to-end first. ⛔ not done.**
  - AM-15 / AA-18 crxjs pin + WXT fallback — **not in code**. The extension itself doesn't exist; this is M-7/M-8 work. ⛔ N/A until then.
  - AM-07 LLM inversion (cloud paid tier is the primary quality path) — **partially delivered**: Gemini wrapper is in, breaker is in, /api/extract-field is in, InterviewFlow is wired. The "paid tier" half of this is the founder's `GEMINI_API_KEY` decision (currently free tier per the breaker ceiling 240 RPD). ⏸ founder's call when to enable billing.
  - License lookup is still `email`-based; the "user_id" migration (per the audit) would require the Paddle webhook to also resolve + store `user_id`, and is independent of AM-11. ⏸ founder to schedule.
  - Playwright e2e has no auth setup — specs never log in, so changing `requireUser()` has no test signal. ⏸ next on the list after B (if webapp version) or after AM-14 (if extension version).
  - `/api/analyze-reply` is unauthenticated + rate-limit-less — ✅ closed in `63e6359`.
  - `/decode` marketing page runs `runDecode()` in-browser; the `/api/decode` route is reachable only via e2e. ⏸ schema of choice — keep client-side (current) or move to server (Gate 2 §28 wants real server traffic for analytics).
  - **D9 tension noted**: free-tier Gemini means Google may train on user data per default AI Studio ToS. First paying customers should be moved to Tier 1 billing (~$0.75/M input tokens, 1000 RPD) BEFORE significant real case data flows. ⏸ founder's call.

## Routing fix revert (882ed39 — restore `/app/...` URLs)

**Context.** Commit `882ed39` fixed the URL prefix mismatch by stripping `/app/` from the UI. The "right" fix per the planning docs is the inverse: move the page files into `src/app/(app)/app/` so the URLs are `/app/case`, `/app/compose`, etc., then update the Supabase Site URL + Redirect URLs.

**Revert steps (in order):**

1. Move 5 directories + 2 files into the deeper path:
   - `src/app/(app)/login/page.tsx` → `src/app/(app)/app/login/page.tsx`
   - `src/app/(app)/billing/page.tsx` → `src/app/(app)/app/billing/page.tsx`
   - `src/app/(app)/case/page.tsx` → `src/app/(app)/app/case/page.tsx`
   - `src/app/(app)/compose/page.tsx` → `src/app/(app)/app/compose/page.tsx`
   - `src/app/(app)/vault/page.tsx` → `src/app/(app)/app/vault/page.tsx`
   - `src/app/(app)/auth/callback/route.ts` → `src/app/(app)/app/auth/callback/route.ts`
2. Re-add `/app/` to the 11 client-side hrefs (search `/app/\{login,billing,case,compose,vault,auth\}` in the 7 files listed in the `882ed39` commit message).
3. Update `src/app/(app)/login/page.tsx` line 46 `emailRedirectTo` to `${APP_URL}/app/auth/callback`.
4. Update Supabase dashboard → Authentication → URL Configuration:
   - Site URL: `https://appealdeck.com` (unchanged)
   - Redirect URLs: add `https://app.appealdeck.com/app/auth/callback` and `http://localhost:3000/app/auth/callback`
5. Move `src/app/(app)/page.tsx` (the unused dashboard) to `src/app/(app)/app/page.tsx` to make `/app` (the dashboard) reachable.
6. Update `e2e/marketing.spec.ts` to test the real redirect (`/app` → `/login`).
7. Update `src/middleware.ts` if needed — the existing `APP_PREFIXES` matcher already includes `/app` and `/auth`, so no change.

**Estimated cost:** 1 commit, 7 file moves, 11 href restores, 1 env var update (Supabase dashboard), ~30 min.

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
- **Hosting architecture (updated 4 Sep 2026):** ONE Next.js app at repo root, **single host for the first deploy** — marketing + auth + app on one origin, path-routed (see "Domain topology" section; `src/lib/urls.ts`). The host-split mode in `src/middleware.ts` is retained behind env vars for a later `app.` subdomain; the rest of this bullet describes that split mode. Marketing at `appealdeck.com` (routes `/`, `/decode`, `/pricing`, `/privacy`, `/terms`, `/refund`); authenticated webapp at `app.appealdeck.com` (route group `src/app/(app)/` → `/app` dashboard, `/app/login`, `/app/billing`, `/auth/callback`). Middleware redirects marketing-only paths off the app host and `/app*` off the marketing host. Env hosts: `NEXT_PUBLIC_MARKETING_HOST` / `NEXT_PUBLIC_APP_HOST` (defaults `appealdeck.com` / `app.appealdeck.com`).
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
- **Theme follows the system** by default; light and dark are each tuned (06-spec §2, §5)
- **Mobile-first responsive**: 320px → 768px → 1024px → 1440px
- **Motion**: only on user-caused events, ≤ 320 ms, reduced-motion honoured in CSS _and_ framer-motion; no hover-lift on non-interactive cards, no decorative or looping animation (06-spec §5)
- **Loading/empty/error states required** on every screen
- **Accessibility**: semantic HTML, ARIA labels, keyboard nav, focus rings, WCAG AA contrast
- **Component patterns**: composable, `cn()` for conditional classes, forward refs
- **Source of truth for UI/UX and copy:** `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` — tokens v2, primitives, patterns, state quartet, simplicity budget (§1.1), content & voice (§10). User-facing copy lives in `src/content/`; trust is shown by mechanism, never requested; banned-pattern lint (§10.5) must stay green.

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

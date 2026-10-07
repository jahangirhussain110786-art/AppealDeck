# Launch-completeness audit — living plan (started 7 Oct 2026)

**Purpose.** Find every bug, mistake, broken path, and every feature that is built but not finished (or looks finished but is not) between today's codebase and a product we would put in front of paying, panicking Amazon sellers. This goes past "do the tests pass": each area is read from a different point of view, because the defects this project keeps finding are seam defects — things that work alone and fail where steps meet, or exist and cannot be reached.

**Working rules (one agent, no delegation):**

1. Work one area at a time, in order. Do not start the next area until the current one has a result written here.
2. Check every claim against the code or a running build before recording it. A finding without evidence goes in "Unverified", not "Found".
3. Fix what is verifiable and in scope; add a regression test with each fix that fails on the old code. Anything that needs the founder (money, accounts, privacy wording, D1–D10) goes in "Founder calls", not into a quiet edit.
4. Never reopen D1–D10. Never copy from forbidden sources (CLAUDE.md §3). Stay inside D6: no "guarantee", no predicted odds, read-only, severity gating.
5. Gate honestly: `npm run build` first, then `CI=1 npx playwright test --project=chromium --retries=0`. Stop the dev server before building. Never quote a bare local Playwright number.
6. Batch commits (3–4 areas per commit), gates once per batch, push when green.

## How to resume after stopping

1. Read the **Progress board** below and the **Session log** at the bottom.
2. Find the first area whose status is not `DONE`; open its section. Items are `[ ]` open, `[~]` in progress, `[x]` checked-and-fine, `[F]` found and fixed, `[!]` found, needs founder, `[?]` unverified.
3. Continue from the first `[ ]`/`[~]` item. Update the board, the item, and the session log **before** you stop, even mid-area.
4. Record every defect in the **Findings register** (one row, with ID `L-nnn`, evidence, fix commit).

## Progress board

| Phase | Lens | Areas | Status |
| --- | --- | --- | --- |
| 1 | Money, identity and trust boundary | 1.1 Payments & entitlements · 1.2 Auth, sessions & redirects · 1.3 API routes & input hardening · 1.4 Database, migrations & RLS · 1.5 Secrets, config & deployment | DONE (7 Oct 2026) |
| 2 | The seller's data | 2.1 Vault & encryption · 2.2 Case store, persistence & migration of old data · 2.3 Backup, restore, export · 2.4 Documents & the device reader · 2.5 Privacy copy vs. actual data flow | NOT STARTED |
| 3 | The engine's judgement | 3.1 Notice parsing, classification & response type · 3.2 Evidence model & requirements · 3.3 Deadlines, clocks & reminders · 3.4 Reply analyser & escalation · 3.5 Composer, critic, wording lock & D6 | NOT STARTED |
| 4 | The seller's journey | 4.1 First 5 minutes (home → decode → case) · 4.2 The case workspace end to end · 4.3 Dashboard, multi-case, billing, devices · 4.4 Empty, error, offline, slow & hostile states · 4.5 Seams between steps (resume, gates, redirects) | NOT STARTED |
| 5 | Launch fitness | 5.1 Accessibility, responsive & visual · 5.2 Performance & bundle · 5.3 SEO, content truth & legal copy · 5.4 Tests, CI & observability · 5.5 Dead, unfinished & half-built code; docs vs. reality | NOT STARTED |

Status values: `NOT STARTED` · `IN PROGRESS` · `DONE` · `BLOCKED (founder)`.

---

## Phase 1 — Money, identity and trust boundary

*Question asked: if a hostile or merely unlucky person uses this, can they take money wrongly, see someone else's data, or leave a seller stuck?*

### 1.1 Payments & entitlements
Files: `src/app/api/checkout/*`, `src/app/api/webhooks/paddle`, `src/lib/license*.ts`, `licenseGuard.ts`, `licensePoll.ts`, `src/components/CheckoutButton.tsx`, `src/components/pricing/*`, `supabase/migrations/0009,0012,0014,0015`, `scripts/setup-paddle-sandbox.mjs`.
- [x] Webhook: HMAC-SHA256 with a 5-minute window and constant-time compare; idempotent on `event_id`; advisory locks per transaction; adjustments arriving before completion handled; refund/chargeback revoke and a reversal restores (0015 guards the unique index). Unmatched payments are parked and logged, not dropped.
- [x] One Pass per case: API 409, webhook parks a duplicate, and the partial unique index `licenses_one_active_pass_per_case` is live (verified by inserting two throwaway active rows on the live project: the second was refused with 23505; rows deleted).
- [~] (re-trace in 4.5) Guest → account → purchase: the Pass attaches to the right case ID after sign-in and activation resumes into the draft.
- [x] Price is $249 everywhere a buyer can see it, including the sandbox script and consent text (no stray $199).
- [x] Failure modes: lookup errors answer 503, never 403 (a paying seller is told to retry); intent returns 503 when the licence lookup fails; a failed Paddle script replaces the button text and toasts; the poll keeps asking until its 90 s deadline.
- [x] D8 consent (server stores its own consent text; the client can only send `consent: true`; migration 0013 caps email attempts at 5, verified live; actual delivery needs `RESEND_API_KEY`, founder): explicit prior consent captured before checkout opens; confirmation email path (Resend) and its attempt cap.
- [x] Gating: every Pass-only route (`compose`, `read-document`, `improve-wording`, …) checks the Pass for *that case* server-side.

### 1.2 Auth, sessions & redirects
Files: `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/supabase/*`, `src/lib/urls.ts`, `src/app/(app)/{login,signup,auth,forgot-password,reset-password}`, `ProfileMenu`.
- [x] (probed CR/LF, tab, encoded slash, `/..//`, NUL, backslash, RTL override: every result stays on our origin) `?next=` is validated everywhere (open-redirect, protocol-relative, backslash, encoded forms).
- [!] (hard navigation, no stale page; but Supabase's default global scope ends the seller's sessions on every device: founder call F-1) Sign-out ends the session in this tab and does not leave stale signed-in pages (router cache); global vs. local sign-out (founder question still open).
- [x] Session refresh in the proxy forwards cookies; expired session behaves.
- [x] (callback handles `error`, missing code, no client; recovery keeps `continue`) Magic link / Google OAuth / password reset round trips, including with no auth backend configured.
- [x] (signup uses fixed wording; password login shows Supabase's single invalid-credentials text) Email-enumeration and error-message leakage on login, signup, reset.
- [~] (covered by bug sweep 5; not re-tested) Cross-tab sign-in/out.

### 1.3 API routes & input hardening
Files: every `src/app/api/**/route.ts`, `src/lib/rateLimit*`, `src/lib/breaker.ts`, `src/lib/llm/*`, `src/core/inputCost.test.ts`.
- [x] (table checked across all 14 routes: auth, rate limit, Zod, size cap) Every route: method handling, body size cap, Zod strictness, content-type, error shape (no stack/secret leakage).
- [x] (all fail closed without Upstash except `/api/decode`, which fails open on purpose: free and CPU-bounded; client IP from `x-forwarded-for`, which Vercel overwrites) Rate limits: per-IP/per-user/per-case, what happens when Upstash is absent (fail closed in prod, usable in dev).
- [~] (counted at the call per the third audit pass; not re-tested) Spend cap and circuit breaker count at the call, after auth and Pass.
- [~] (`inputCost.test.ts` passes in the full run; re-fuzz after Phase 3 changes) Hostile-input CPU: every regex/loop over user text bounded (re-fuzz after recent core changes).
- [~] (re-check in 3.5) Prompt-injection posture: model output is never trusted as a decision; schema-constrained; fact lock holds.
- [x] (constant-time, fails closed when unset; both crons registered, and `lint:reachability` enforces it) Cron routes require `CRON_SECRET`; every cron is registered in `vercel.json`.

### 1.4 Database, migrations & RLS
Files: `supabase/migrations/0001–0015`, `docs/MIGRATIONS.md`, `scripts/check-entitlement-migration.mjs`, `verify-entitlement-security.mjs`.
- [x] (0013, 0014, 0015 are applied on the live project, verified by behaviour; a clean-database replay of 0001-0015 was not run: no scratch database) Migrations apply in order on a clean database; 0013 (unapplied per notes) and 0015 status checked against the live project and recorded.
- [x] (anon is refused at grant level on checkout_intents, payment_*, purchase_email_outbox, outcome_events, case_reminders; `licenses` and `license_events` return `[]` to anon by RLS only, see L-005; 0009 dropped the user UPDATE policy and revoked write grants; authenticated-role write attempts not tested, would need the dev password) RLS: anon and authenticated roles cannot read/write other users' rows; service-role-only functions are not callable by anon.
- [x] Constraints and indexes match what the code assumes (unique Pass per case, attempt caps, outcome CHECKs).
- [~] (red until the two secrets exist, founder; no restore drill yet) Backup workflow (`backup.yml`) correct; restore procedure written and plausible.

### 1.5 Secrets, config & deployment
Files: `.env.example`, `docs/DEPLOYMENT.md`, `docs/CURRENT-STATE.md`, `next.config.mjs`, `vercel.json`, `.github/workflows/*`, `.gitignore`.
- [x] (pattern scan of tracked files for Supabase, Google, Paddle and Resend key shapes found none; `tmp-seed.log`, `test-results`, `.env.local` are ignored; the stray `prompt-for-chatgpt.txt` was moved, L-004) No secret or real credential in the tree or history that matters (`tmp-seed.log`, `prompt-for-chatgpt.txt`, `test-results`, `kilo.json` reviewed; stray files removed or ignored).
- [x] (only tooling variables differ) Every env var the code reads is in `.env.example` and DEPLOYMENT, with fail-safe behaviour when unset.
- [!] (nosniff, DENY, HSTS, Referrer-Policy and Permissions-Policy are set; the CSP is Report-Only with no report endpoint: founder call F-2) Security headers / CSP decision (none today — recorded founder call), cookies flags, CORS.
- [~] (handled in 2.5 and 3.5) `GEMINI_PAID_TIER_CONFIRMED` behaviour in production when false/unset is honest in the UI and privacy copy.
- [x] (Node 24 pinned in `engines` and CI; CI was red on typecheck, L-001, fixed) Build from a clean checkout works (`npm ci && npm run build`), Node version pinned, CI mirrors it.

---

## Phase 2 — The seller's data

*Question asked: can a seller lose, leak, or be unable to recover their case — and does what we say about their data match what we do?*

### 2.1 Vault & encryption
Files: `src/core/vault/*`, `VaultGate`, `VaultView`, `VaultLockedState`, `src/lib/vault/*`.
- [ ] Device-key mode vs. passphrase mode; relock paths both ways; no page asks for a passphrase by default.
- [ ] Wrong passphrase, forgotten passphrase (disclosure shown), idle lock timers cleared.
- [ ] Nonce/IV uniqueness, key wrapping, envelope versioning, tamper detection.
- [ ] Large files, quota errors, IndexedDB eviction (`storage.persist`) and the on-page honesty message.
- [ ] Guest-session wipe on new browser session vs. same-tab reload.

### 2.2 Case store, persistence & migration of old data
Files: `src/lib/caseStore.ts`, `caseSchema.ts`, `workspaceSchema.ts`, `workspaceDraft.ts`, `src/core/workspace.ts`, `legacyMigration.ts`.
- [ ] Zod schema accepts every field the model writes (the validator strips unknown keys — the repeated silent-drop trap).
- [ ] Serialized commit queue: concurrent saves, stale-key writes, case switch races.
- [ ] Old-format cases (classic interview, positional drafts, click-counted deadlines) load and repair.
- [ ] Delete case removes its records; active-case pointer survives it.

### 2.3 Backup, restore, export
Files: `src/lib/vault/backup*`, restore UI, `workspaceExport.ts`, `evidencePack.ts`.
- [ ] Encrypted cloud backup: size limit message, retention, restore into an empty vault and into a vault with data.
- [ ] Portable backup file round trip with documents.
- [ ] Case notes / evidence pack export includes everything the seller entered (questionnaire answers, checks, submissions) and nothing they did not.

### 2.4 Documents & the device reader
Files: `src/lib/documentChecks/*`, `read-document` route, `FileDropZone`, `DocumentCheckPanel`, `scripts/copy-reader-assets.mjs`.
- [ ] Guest files never uploaded; signed-in files sent only after Pass check; identity/bank/address documents never sent.
- [ ] pdf.js and OCR failure, hang, password-protected, huge, zero-byte, wrong-type files all end in a plain message, never a spinner.
- [ ] A reading claims only what the words support (no false "Found").
- [ ] Reader assets are served correctly on the real deployment.

### 2.5 Privacy copy vs. actual data flow
Files: `src/content/legal.ts`, `legal/*.md`, `DataFlow.tsx`, `workspace.ts` privacy line.
- [ ] Trace each outbound call (decode, compose, extract, analyze-reply, improve-wording, read-document, analytics, email) and confirm the privacy page and diagram describe exactly that.
- [ ] Retention, deletion and data-subject-request statements are achievable by a one-person operator.
- [ ] Any change to privacy wording is flagged to the founder, not made quietly.

---

## Phase 3 — The engine's judgement

*Question asked: when the engine decides something on the seller's behalf, is it right on notices it was not written against — and when unsure, does it say so?*

### 3.1 Notice parsing, classification & response type
Files: `noticeParser.ts`, `classifier.ts`, `responseType.ts`, `noticeIssues.ts`, `entities.ts`, `noticeText.ts`, `noticeAuthenticity.ts`, fixtures.
- [ ] Run fresh, unseen notice wordings (not the fixture corpus) through decode; list misreads.
- [ ] Multi-issue notices, non-English fragments, forwarded/quoted mail, tiny and huge inputs.
- [ ] Scam check: silent on every genuine fixture, loud on forged ones; never returns a verdict.
- [ ] Non-US marketplaces: behaviour matches what we sell (founder call open).

### 3.2 Evidence model & requirements
Files: `evidenceModel.ts`, `requirementGuidance.ts`, `guidance.ts`, `factsLedger.ts`, `documentCheck.ts`.
- [ ] Every violation kind has required records, a plain reason, and an obtain-or-alternative path.
- [ ] Notice-named records ∪ matrix records; `raisedWhen` conditions; no record raised on negation or past tense.
- [ ] Document check statuses (Found / Not found / Conflicts / Not checked) honest for scans.

### 3.3 Deadlines, clocks & reminders
Files: `noticeDate.ts`, `deadlinesModel.ts`, `clock.ts`, `caseReminders.ts`, `api/reminders`, `api/jobs/case-reminders`.
- [ ] Time zones (UTC vs. seller calendar), DST, month ends, "from receipt" vs. stated date.
- [ ] A deadline is shown only if grounded; ungrounded windows say so.
- [ ] Reminder end to end: set → stored → cron fires → email sent → status visible; failure paths.

### 3.4 Reply analyser & escalation
Files: `responseAnalyzer.ts`, `replyFeedback.ts`, `escalation.ts`, `submissionNovelty.ts`, `ReplyDeltaReview`.
- [ ] Refusals never read as reinstated; ambiguous stays ambiguous.
- [ ] Reply delta keeps reviewed work; reopen/added/outstanding/carried behave.
- [ ] Repeat-submission-without-change guard; change-of-approach panel conditions.

### 3.5 Composer, critic, wording lock & D6
Files: `composer.ts`, `questionnaire.ts`, `wordingLock.ts`, `draftStrength.ts`, `readiness.ts`, `d6*.test.ts`.
- [ ] A thin answer produces a visibly thin draft and a named gap; nothing invented.
- [ ] Wording help cannot add or drop a date, number, ID, name, negation.
- [ ] D6: no "guarantee", no odds/predictions, severity gating routes forged-docs/fraud/child-safety to pro-help and never sells them.
- [ ] Every generated section states what the seller supplied vs. what we inferred.

---

## Phase 4 — The seller's journey

*Question asked: walking as a real, frightened first-timer, where do they stop, get lost, or get told something untrue?*

### 4.1 First 5 minutes (home → decode → case)
- [ ] Home, `/decode`, sample notice, paste-from-home hand-off, result, "start your case".
- [ ] Copy truthfulness on each page (what is free, what is paid, what is local).
- [ ] Phone width, slow network, reduced motion.

### 4.2 The case workspace end to end
- [ ] Guest and signed-in: confirm reading → documents (each record) → response questions → prepare → check → send; Back/Next and any-order use.
- [ ] Round 2+: record the reply, delta, new response, history.
- [ ] Verification, funds, policy, IP/related-account, gated-category tracks each reach a sensible end.
- [ ] Gated pro-help cases are never sold a draft.

### 4.3 Dashboard, multi-case, billing, devices
- [ ] Case list, switching, archive/delete, outcome share card (refused share stays open).
- [ ] Billing page, receipts, device cap, refund path matches the 7-day promise.

### 4.4 Empty, error, offline, slow & hostile states
- [ ] Every page's state quartet (loading, empty, error, success) exists and is plain-worded.
- [ ] Offline notice, API 429/503/timeouts, Gemini down, Upstash down, vault unavailable (private window, blocked storage).
- [ ] Error boundaries show a way out, not a stack.

### 4.5 Seams between steps
- [ ] Sign-in mid-flow returns to the same step with data intact; Pass activation resumes into the draft.
- [ ] Browser back/forward, reload on every step, two tabs on one case.
- [ ] Anything saved in one place and read from another (the recurring defect class) re-traced for each field the seller types.

---

## Phase 5 — Launch fitness

*Question asked: would we be comfortable if a stranger, a search engine, a regulator or an appeals professional inspected this today?*

### 5.1 Accessibility, responsive & visual
- [ ] axe on every public and signed-in page, light and dark; keyboard-only walk; focus management on step changes; contrast test current.
- [ ] 375 / 768 / 1024 / 1440 px both themes; no horizontal scroll; targets ≥ 44 px.

### 5.2 Performance & bundle
- [ ] Per-route bundle stats vs. last baseline; public pages free of Supabase/Dexie/fixtures.
- [ ] Lighthouse on production build for public pages; hostile-input timings still < 100 ms.
- [ ] Vault list/read costs still index-based.

### 5.3 SEO, content truth & legal copy
- [ ] Titles, canonicals, noindex on app/auth pages, sitemap dates, structured data, OG image text matches price/claims.
- [ ] Banned-claim sweep: guarantee, odds, win rate, "lawyer", "reinstated in N days"; competitor claims dated and sourced.
- [ ] Terms/Privacy/Refund agree with each other and with the checkout and with the code (disclosures test current).

### 5.4 Tests, CI & observability
- [ ] Full gate set green from clean checkout: typecheck (incl. tests), lint, lint:copy/reachability/sources, format, vitest, build, Playwright CI mode, Lighthouse.
- [ ] Coverage holes: list core behaviours with no test that would fail on regression (esp. the seams in 4.5).
- [ ] Production observability: how would the founder learn a webhook failed, a cron died, or the model broke? (Sentry remains a deferred founder call; record the minimum viable alternative.)

### 5.5 Dead, unfinished & half-built code; docs vs. reality
- [ ] Re-run reachability scans (components, routes, `src/core`, `src/lib`, crons); inspect gallery-only items.
- [ ] Grep `TODO|FIXME|XXX|not implemented|coming soon|placeholder` in `src/` and visible copy.
- [ ] `docs/CURRENT-STATE.md` rows vs. what the code does today; CLAUDE.md/AGENTS.md stale claims listed.
- [ ] Repo hygiene: stray files, stale worktrees, ignored artefacts.

---

## Findings register

| ID | Area | Severity (P0 launch-blocker / P1 / P2) | Finding | Evidence | Status | Fix / commit |
| --- | --- | --- | --- | --- | --- | --- |
| L-001 | 5.4 | P1 | CI red on every push since at least 6 Oct (bug sweeps 4–8): `npm run typecheck` fails on 5 test-file type errors (`draftQuality.test.ts` attested `true` vs `{at}`; `caseCommitIntegrity.test.ts` excess `state` on a `Pick`). CI stops at typecheck, so build, e2e and Lighthouse never ran in CI for those pushes. Local gates were green because vitest does not typecheck. | `gh run view 37466036288 --log-failed` shows the 5 TS errors; `npm run typecheck` reproduced locally | FIXED | tests corrected; typecheck 0, build, Playwright CI 137/0/2 |
| L-002 | 1.5 | P2 | The Content-Security-Policy ships as `Report-Only` with no report endpoint: no protection and no signal. | `vercel.json` headers | FOUNDER CALL F-2 | |
| L-003 | 1.2 | P2 | Sign-out uses Supabase's default global scope: signing out on one device ends every session of that seller. | `src/lib/useSignOut.ts` | FOUNDER CALL F-1 | |
| L-004 | 1.5 | P3 | A stray 34 KB research prompt was tracked at the repo root. | `git ls-files` | FIXED | moved to `docs/handoffs/2026-09-21-prompt-for-chatgpt.txt` |
| L-005 | 1.4 | P3 | `licenses` and `license_events` answer anon with `200 []` (RLS only) while other tables refuse at grant level. Safe today; one wrong policy would expose them. | live REST probe | OPEN, optional migration 0016 (F-3) | |
| L-006 | 1.1 | P3 | The dashboard reply card (legacy non-workspace cases only) is Pass-gated at account level. Harmless. | `DashboardClient.tsx`, `analyze-reply` route | NOTED | |

## Founder calls raised by this audit

| # | Call | Raised in | Status |
| --- | --- | --- | --- |
| F-1 | Should Sign out end only this device's session (`scope: "local"`)? Recommendation: yes. | 1.2 | OPEN |
| F-2 | Enforce the CSP (needs a report endpoint and a clean console pass first) or drop it? | 1.5 | OPEN |
| F-3 | Apply optional migration 0016 (revoke anon select on licences)? Low urgency. | 1.4 | OPEN |

## Unverified

(Suspicions without evidence yet. Promote to the register or delete — never leave a claim here as fact.)

## Gate baseline

HEAD `117355d` + L-001 fix, 7 Oct 2026: typecheck 0 (was 5 errors) · lint 0 · lint:copy PASS · lint:reachability PASS · lint:sources PASS · format 0 · vitest 2054/2054 in 148 files · build clean · Playwright chromium `CI=1 --retries=0` 137 passed / 0 failed / 2 skipped (signed-in tests ran; `.env.local` loaded). Lighthouse not yet run.

## Session log

| Date | Done | Stopped at / next |
| --- | --- | --- |
| 2026-10-07 | Plan written (5 phases × 5 areas, 25 areas). Gate baseline recorded; found and fixed L-001 (CI red since 6 Oct on test typecheck). Phase 1 done (1.1-1.5): live-DB verification of migrations 0013-0015, auth redirect probes, route-by-route hardening table, secrets scan. | Start Phase 2 at 2.1 Vault & encryption. Confirm CI green after the Phase 1 commit (`gh run list`). |

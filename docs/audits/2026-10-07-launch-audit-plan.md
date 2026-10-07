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
| 1 | Money, identity and trust boundary | 1.1 Payments & entitlements · 1.2 Auth, sessions & redirects · 1.3 API routes & input hardening · 1.4 Database, migrations & RLS · 1.5 Secrets, config & deployment | NOT STARTED |
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
- [ ] Webhook: signature check, replay/idempotency, out-of-order events, unknown event types, refund (`adjustment.*`) revokes the Pass.
- [ ] One Pass per case enforced in DB and API; double-purchase refused (409) and page says so.
- [ ] Guest → account → purchase: the Pass attaches to the right case ID after sign-in and activation resumes into the draft.
- [ ] Price is $249 everywhere a buyer can see it, including the sandbox script and consent text (no stray $199).
- [ ] Failure modes: Paddle down, webhook late, license-status lookup failing (fail open vs. closed chosen deliberately and documented).
- [ ] D8 consent: explicit prior consent captured before checkout opens; confirmation email path (Resend) and its attempt cap.
- [ ] Gating: every Pass-only route (`compose`, `read-document`, `improve-wording`, …) checks the Pass for *that case* server-side.

### 1.2 Auth, sessions & redirects
Files: `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/supabase/*`, `src/lib/urls.ts`, `src/app/(app)/{login,signup,auth,forgot-password,reset-password}`, `ProfileMenu`.
- [ ] `?next=` is validated everywhere (open-redirect, protocol-relative, backslash, encoded forms).
- [ ] Sign-out ends the session in this tab and does not leave stale signed-in pages (router cache); global vs. local sign-out (founder question still open).
- [ ] Session refresh in the proxy forwards cookies; expired session behaves.
- [ ] Magic link / Google OAuth / password reset round trips, including with no auth backend configured.
- [ ] Email-enumeration and error-message leakage on login, signup, reset.
- [ ] Cross-tab sign-in/out.

### 1.3 API routes & input hardening
Files: every `src/app/api/**/route.ts`, `src/lib/rateLimit*`, `src/lib/breaker.ts`, `src/lib/llm/*`, `src/core/inputCost.test.ts`.
- [ ] Every route: method handling, body size cap, Zod strictness, content-type, error shape (no stack/secret leakage).
- [ ] Rate limits: per-IP/per-user/per-case, what happens when Upstash is absent (fail closed in prod, usable in dev).
- [ ] Spend cap and circuit breaker count at the call, after auth and Pass.
- [ ] Hostile-input CPU: every regex/loop over user text bounded (re-fuzz after recent core changes).
- [ ] Prompt-injection posture: model output is never trusted as a decision; schema-constrained; fact lock holds.
- [ ] Cron routes require `CRON_SECRET`; every cron is registered in `vercel.json`.

### 1.4 Database, migrations & RLS
Files: `supabase/migrations/0001–0015`, `docs/MIGRATIONS.md`, `scripts/check-entitlement-migration.mjs`, `verify-entitlement-security.mjs`.
- [ ] Migrations apply in order on a clean database; 0013 (unapplied per notes) and 0015 status checked against the live project and recorded.
- [ ] RLS: anon and authenticated roles cannot read/write other users' rows; service-role-only functions are not callable by anon.
- [ ] Constraints and indexes match what the code assumes (unique Pass per case, attempt caps, outcome CHECKs).
- [ ] Backup workflow (`backup.yml`) correct; restore procedure written and plausible.

### 1.5 Secrets, config & deployment
Files: `.env.example`, `docs/DEPLOYMENT.md`, `docs/CURRENT-STATE.md`, `next.config.mjs`, `vercel.json`, `.github/workflows/*`, `.gitignore`.
- [ ] No secret or real credential in the tree or history that matters (`tmp-seed.log`, `prompt-for-chatgpt.txt`, `test-results`, `kilo.json` reviewed; stray files removed or ignored).
- [ ] Every env var the code reads is in `.env.example` and DEPLOYMENT, with fail-safe behaviour when unset.
- [ ] Security headers / CSP decision (none today — recorded founder call), cookies flags, CORS.
- [ ] `GEMINI_PAID_TIER_CONFIRMED` behaviour in production when false/unset is honest in the UI and privacy copy.
- [ ] Build from a clean checkout works (`npm ci && npm run build`), Node version pinned, CI mirrors it.

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

## Founder calls raised by this audit

| # | Call | Raised in | Status |
| --- | --- | --- | --- |
| — | none yet | — | — |

## Unverified

(Suspicions without evidence yet. Promote to the register or delete — never leave a claim here as fact.)

## Gate baseline

HEAD `117355d` + L-001 fix, 7 Oct 2026: typecheck 0 (was 5 errors) · lint 0 · lint:copy PASS · lint:reachability PASS · lint:sources PASS · format 0 · vitest 2054/2054 in 148 files · build clean · Playwright chromium `CI=1 --retries=0` 137 passed / 0 failed / 2 skipped (signed-in tests ran; `.env.local` loaded). Lighthouse not yet run.

## Session log

| Date | Done | Stopped at / next |
| --- | --- | --- |
| 2026-10-07 | Plan written (5 phases × 5 areas, 25 areas). Gate baseline recorded; found and fixed L-001 (CI red since 6 Oct on test typecheck). | Start at 1.1 Payments & entitlements. After pushing, confirm CI is green (`gh run list`). |

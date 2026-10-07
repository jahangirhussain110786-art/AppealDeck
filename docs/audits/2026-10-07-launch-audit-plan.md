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
| 2 | The seller's data | 2.1 Vault & encryption · 2.2 Case store, persistence & migration of old data · 2.3 Backup, restore, export · 2.4 Documents & the device reader · 2.5 Privacy copy vs. actual data flow | IN PROGRESS (read-through done; live walk in Phase 4) |
| 3 | The engine's judgement | 3.1 Notice parsing, classification & response type · 3.2 Evidence model & requirements · 3.3 Deadlines, clocks & reminders · 3.4 Reply analyser & escalation · 3.5 Composer, critic, wording lock & D6 | IN PROGRESS: 3.1-3.4 done; 3.5 pending |
| 4 | The seller's journey | 4.1 First 5 minutes (home → decode → case) · 4.2 The case workspace end to end · 4.3 Dashboard, multi-case, billing, devices · 4.4 Empty, error, offline, slow & hostile states · 4.5 Seams between steps (resume, gates, redirects) | IN PROGRESS: 4.1, 4.2, 4.5 partly walked |
| 5 | Launch fitness | 5.1 Accessibility, responsive & visual · 5.2 Performance & bundle · 5.3 SEO, content truth & legal copy · 5.4 Tests, CI & observability · 5.5 Dead, unfinished & half-built code; docs vs. reality | IN PROGRESS: 5.1 reflow, 5.5 TODO scan done |

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
- [~] (code read: guest vault secret is tab-session only by design; crypto parameters bounded; covered by 4 vault test files; live walk in 4.5) Device-key mode vs. passphrase mode; relock paths both ways; no page asks for a passphrase by default.
- [x] (idle-lock warning and lock timers are cleared on activity and unmount) Wrong passphrase, forgotten passphrase (disclosure shown), idle lock timers cleared.
- [x] (fresh random 12-byte IV per encryption, 256-bit AES-GCM, PBKDF2 310k, stored KDF params bounded 1k..2M iterations and salt >= 16 bytes) Nonce/IV uniqueness, key wrapping, envelope versioning, tamper detection.
- [~] (`storage.persist()` and the on-page message exist; abandoned guest databases are pruned after 7 days; 15 MB/60 MB read costs measured 30 Sep) Large files, quota errors, IndexedDB eviction (`storage.persist`) and the on-page honesty message.
- [x] (guest vault name and secret live in `sessionStorage`; reload keeps it, a new browser session cannot read the old one) Guest-session wipe on new browser session vs. same-tab reload.

### 2.2 Case store, persistence & migration of old data
Files: `src/lib/caseStore.ts`, `caseSchema.ts`, `workspaceSchema.ts`, `workspaceDraft.ts`, `src/core/workspace.ts`, `legacyMigration.ts`.
- [F] (L-007: added a compile-time two-way parity test, `workspaceSchema.parity.test.ts`; no field is dropped today) Zod schema accepts every field the model writes (the validator strips unknown keys — the repeated silent-drop trap).
- [~] (covered by caseStore tests and bug sweeps 6-8; not re-fuzzed) Serialized commit queue: concurrent saves, stale-key writes, case switch races.
- [~] (`legacyMigration` tests pass; not re-tested live) Old-format cases (classic interview, positional drafts, click-counted deadlines) load and repair.
- [~] (covered by `journey.spec.ts`) Delete case removes its records; active-case pointer survives it.

### 2.3 Backup, restore, export
Files: `src/lib/vault/backup*`, restore UI, `workspaceExport.ts`, `evidencePack.ts`.
- [~] (`backup.test.ts` passes: size limit message, retention of 3; live restore walk pending) Encrypted cloud backup: size limit message, retention, restore into an empty vault and into a vault with data.
- [~] (portable restore covered by `integrity.spec.ts`) Portable backup file round trip with documents.
- [~] (`workspaceExport.test.ts`, `evidencePack.test.ts`) Case notes / evidence pack export includes everything the seller entered (questionnaire answers, checks, submissions) and nothing they did not.

### 2.4 Documents & the device reader
Files: `src/lib/documentChecks/*`, `read-document` route, `FileDropZone`, `DocumentCheckPanel`, `scripts/copy-reader-assets.mjs`.
- [~] (device-reader e2e passes in the full run, 10 tests) Guest files never uploaded; signed-in files sent only after Pass check; identity/bank/address documents never sent.
- [~] (device-reader and pdf-worker-compat e2e) pdf.js and OCR failure, hang, password-protected, huge, zero-byte, wrong-type files all end in a plain message, never a spinner.
- [~] (`localReading.test.ts`) A reading claims only what the words support (no false "Found").
- [ ] Reader assets are served correctly on the real deployment (re-check against appealdeck.vercel.app).

### 2.5 Privacy copy vs. actual data flow
Files: `src/content/legal.ts`, `legal/*.md`, `DataFlow.tsx`, `workspace.ts` privacy line.
- [x] (traced: decode, compose, analyze-reply, improve-wording, read-document, analytics, email, reminders, outcome. No route logs request content; Gemini warnings log task/model/reason only. One gap: L-008) Trace each outbound call (decode, compose, extract, analyze-reply, improve-wording, read-document, analytics, email) and confirm the privacy page and diagram describe exactly that.
- [~] (billing@ and privacy@ mailboxes must exist: founder, DEPLOYMENT 6a) Retention, deletion and data-subject-request statements are achievable by a one-person operator.
- [x] Any change to privacy wording is flagged to the founder, not made quietly.

---

## Phase 3 — The engine's judgement

*Question asked: when the engine decides something on the seller's behalf, is it right on notices it was not written against — and when unsure, does it say so?*

### 3.1 Notice parsing, classification & response type
Files: `noticeParser.ts`, `classifier.ts`, `responseType.ts`, `noticeIssues.ts`, `entities.ts`, `noticeText.ts`, `noticeAuthenticity.ts`, fixtures.
- [F] (14 fresh wordings run; four families misread as UNKNOWN: fixed, L-009) Run fresh, unseen notice wordings (not the fixture corpus) through decode; list misreads.
- [F] (hostile-input timing: two quadratic paths found and fixed, L-010, L-011) Multi-issue notices, non-English fragments, forwarded/quoted mail, tiny and huge inputs.
- [x] (the fresh corpus: the forged 'verify your account within 24 hours' notice was flagged, the other 13 were silent) Scam check: silent on every genuine fixture, loud on forged ones; never returns a verdict.
- [!] (still the founder call from 29 Sep: the case route dead-ends outside the US store while the Pass is sold worldwide) Non-US marketplaces: behaviour matches what we sell (founder call open).

### 3.2 Evidence model & requirements
Files: `evidenceModel.ts`, `requirementGuidance.ts`, `guidance.ts`, `factsLedger.ts`, `documentCheck.ts`.
- [~] (SDS and exemption sheets now name a record; UNKNOWN still has an empty matrix by design) Every violation kind has required records, a plain reason, and an obtain-or-alternative path.
- [ ] Notice-named records ∪ matrix records; `raisedWhen` conditions; no record raised on negation or past tense.
- [ ] Document check statuses (Found / Not found / Conflicts / Not checked) honest for scans.

### 3.3 Deadlines, clocks & reminders
Files: `noticeDate.ts`, `deadlinesModel.ts`, `clock.ts`, `caseReminders.ts`, `api/reminders`, `api/jobs/case-reminders`.
- [x] (full core + lib suite, 1856 tests, passes under TZ = Kiritimati, Los Angeles, Karachi and Pago Pago) Time zones (UTC vs. seller calendar), DST, month ends, "from receipt" vs. stated date.
- [x] (every fresh notice without a stated date shows 'Appeal window ambiguous - verify...'; stated dates are counted) A deadline is shown only if grounded; ungrounded windows say so.
- [ ] Reminder end to end: set → stored → cron fires → email sent → status visible; failure paths.

### 3.4 Reply analyser & escalation
Files: `responseAnalyzer.ts`, `replyFeedback.ts`, `escalation.ts`, `submissionNovelty.ts`, `ReplyDeltaReview`.
- [F] (15 fresh replies; 5 clear refusals/requests read 'unrecognized': fixed, L-012; none read 'reinstated') Refusals never read as reinstated; ambiguous stays ambiguous.
- [ ] Reply delta keeps reviewed work; reopen/added/outstanding/carried behave.
- [ ] Repeat-submission-without-change guard; change-of-approach panel conditions.

### 3.5 Composer, critic, wording lock & D6
Files: `composer.ts`, `questionnaire.ts`, `wordingLock.ts`, `draftStrength.ts`, `readiness.ts`, `d6*.test.ts`.
- [ ] A thin answer produces a visibly thin draft and a named gap; nothing invented.
- [x] (24 adversarial pairs: all caught except a short invented sentence, L-026) Wording help cannot add or drop a date, number, ID, name, negation.
- [ ] D6: no "guarantee", no odds/predictions, severity gating routes forged-docs/fraud/child-safety to pro-help and never sells them.
- [ ] Every generated section states what the seller supplied vs. what we inferred.

---

## Phase 4 — The seller's journey

*Question asked: walking as a real, frightened first-timer, where do they stop, get lost, or get told something untrue?*

### 4.1 First 5 minutes (home → decode → case)
- [x] (walked with 5 fresh notices: product safety, policy, warning, reply, non-notice; each gives the right headline, due date, records, and next step) Home, `/decode`, sample notice, paste-from-home hand-off, result, "start your case".
- [ ] Copy truthfulness on each page (what is free, what is paid, what is local).
- [~] (320/375/768 reflow swept on 16 pages, L-013; slow network and reduced motion covered by existing e2e only) Phone width, slow network, reduced motion.

### 4.2 The case workspace end to end
- [x] (guest and signed-in dev account walked from decode to a prepared response with a real Pass: L-014, L-027, L-028 found and fixed; the response uses the seller's own words, is watermarked while a record is missing, lists what is unresolved, and the per-case Pass gate and $249 consent are right) Guest and signed-in: confirm reading → documents (each record) → response questions → prepare → check → send; Back/Next and any-order use.
- [ ] Round 2+: record the reply, delta, new response, history.
- [ ] Verification, funds, policy, IP/related-account, gated-category tracks each reach a sensible end.
- [ ] Gated pro-help cases are never sold a draft.

### 4.3 Dashboard, multi-case, billing, devices
- [ ] Case list, switching, archive/delete, outcome share card (refused share stays open).
- [ ] Billing page, receipts, device cap, refund path matches the 7-day promise.

### 4.4 Empty, error, offline, slow & hostile states
- [ ] Every page's state quartet (loading, empty, error, success) exists and is plain-worded.
- [~] (decoder: 6 failure modes probed and fixed, L-022/L-023; compose and checkout: L-024; the other call sites already catch and word their own failures; Gemini down, Upstash down and blocked storage covered by existing unit/e2e tests, not re-probed live) Offline notice, API 429/503/timeouts, Gemini down, Upstash down, vault unavailable (private window, blocked storage).
- [ ] Error boundaries show a way out, not a stack.

### 4.5 Seams between steps
- [ ] Sign-in mid-flow returns to the same step with data intact; Pass activation resumes into the draft.
- [ ] Browser back/forward, reload on every step, two tabs on one case.
- [ ] Anything saved in one place and read from another (the recurring defect class) re-traced for each field the seller types.

---

## Phase 5 — Launch fitness

*Question asked: would we be comfortable if a stranger, a search engine, a regulator or an appeals professional inspected this today?*

### 5.1 Accessibility, responsive & visual
- [~] (axe runs in `a11y.spec.ts` and passed in the full CI-mode run; keyboard-only walk not done) axe on every public and signed-in page, light and dark; keyboard-only walk; focus management on step changes; contrast test current.
- [~] (320/375/768 no horizontal scroll after L-013; 1024/1440 and dark mode not re-swept; targets: L-015) 375 / 768 / 1024 / 1440 px both themes; no horizontal scroll; targets ≥ 44 px.

### 5.2 Performance & bundle
- [~] (home 881 KB and `/faq` 843 KB uncompressed, up from 788 KB on 30 Sep; Supabase still appears in two small chunks that the header loads only with an auth cookie: L-018) Per-route bundle stats vs. last baseline; public pages free of Supabase/Dexie/fixtures.
- [~] (6 pages: accessibility 100, best practices 100, SEO 100 everywhere; performance desktop 100, mobile-lab 69-86: L-018; hostile-input timing now covered by growth tests) Lighthouse on production build for public pages; hostile-input timings still < 100 ms.
- [ ] Vault list/read costs still index-based.

### 5.3 SEO, content truth & legal copy
- [x] (15 pages checked on a production build: unique titles, own canonicals on public pages, `noindex, follow` on app/auth pages, sitemap dates only where real, JSON-LD on `/` and `/faq`; share images fixed, L-019; OG image text was regenerated 25 Sep with the right price) Titles, canonicals, noindex on app/auth pages, sitemap dates, structured data, OG image text matches price/claims.
- [ ] Banned-claim sweep: guarantee, odds, win rate, "lawyer", "reinstated in N days"; competitor claims dated and sourced.
- [ ] Terms/Privacy/Refund agree with each other and with the checkout and with the code (disclosures test current).

### 5.4 Tests, CI & observability
- [x] (typecheck incl. tests 0, lint 0, lint:copy/reachability/sources PASS, format 0, vitest 2079/2079 in 153 files, build, Playwright chromium CI 149 passed / 0 failed / 2 skipped; Lighthouse not run locally) Full gate set green from clean checkout: typecheck (incl. tests), lint, lint:copy/reachability/sources, format, vitest, build, Playwright CI mode, Lighthouse.
- [ ] Coverage holes: list core behaviours with no test that would fail on regression (esp. the seams in 4.5).
- [ ] Production observability: how would the founder learn a webhook failed, a cron died, or the model broke? (Sentry remains a deferred founder call; record the minimum viable alternative.)

### 5.5 Dead, unfinished & half-built code; docs vs. reality
- [ ] Re-run reachability scans (components, routes, `src/core`, `src/lib`, crons); inspect gallery-only items.
- [x] (none in shipped code or copy) Grep `TODO|FIXME|XXX|not implemented|coming soon|placeholder` in `src/` and visible copy.
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
| L-007 | 2.2 | P3 | Nothing stopped `Workspace` and its server-side validator drifting apart; the validator silently strips unknown keys, which has dropped fields before. | compile-time probe showed parity today | FIXED | `workspaceSchema.parity.test.ts` fails the typecheck on drift |
| L-008 | 2.5 | P3 | The privacy page says a licence record is "email, plan, status"; it also carries the case identifier of the case it covers (an opaque random ID). | `licenses.case_id`, `checkout_intents.case_id` | FOUNDER CALL F-4 (wording) | |
| L-009 | 3.1 | P2 | Four ordinary notice families read as `UNKNOWN`: a dangerous-goods review asking for a Safety Data Sheet (the sheet was never raised as a record), an 'approval required' category, 'used sold as new' item-condition complaints, and review-manipulation removals. UNKNOWN costs the family's guidance and record list. | 14 fresh notices through `runDecode` | FIXED | patterns in `noticeParser.ts`/`workspace.ts`; `freshNotices.test.ts` incl. negatives |
| L-010 | 3.1/1.3 | P2 | `/api/decode` is public: the OCR damage check and repair were quadratic on one long unbroken string (400 ms and 540 ms each on 50 KB; 1.6 s in the old suite under load), so a script inside the rate limit could burn serverless CPU. | per-pass timing probe | FIXED | `identifierContext` remembers the word start (7 ms and 12 ms now); differential test against the old search on random text |
| L-011 | 3.1/1.3 | P2 | Un-hyphenating wrapped lines was quadratic on text made of hyphen breaks (303 ms on 50 KB). | per-pass timing across every hostile shape | FIXED | search limited to the last 40 characters; tight 150 ms budgets added to `noticeText.cost.test.ts` |
| L-012 | 3.4 | P2 | Common refusals and requests read as `unrecognized`: 'does not contain enough information', 'we will not be reinstating', 'has not been reinstated', 'send a new plan of action', 'we need the following ... reply with the documents'. Honest fallback, but the seller got no help. None ever read as reinstated. | 15 fresh replies through `analyzeReply` | FIXED | rules added; `responseAnalyzer.fresh.test.ts` pins both directions |
| L-013 | 5.1 | P2 | `/pricing` scrolled sideways by 11 px at 320 px wide (WCAG reflow). The comparison table's screen-reader-only "Included" labels, in cells scrolled out of view, are absolutely positioned and the scroll wrapper was not their containing block, so they widened the page. | Playwright overflow sweep over 16 pages x 3 widths; hide-and-measure isolated the table | FIXED | `relative` on the shared `Table` wrapper; `e2e/reflow.spec.ts` covers all 12 public pages at 320 px and was shown failing (11 px) on the old code |
| L-014 | 4.2 | P2 | The Response tab told a seller who had not yet pressed "Yes, this is right" that "We cannot prepare a response for this kind of notice here", for a policy case that can get a Plan of Action. It contradicts the Overview ("$249 once, only if you want us to prepare the response"). | signed-in and guest walks of a policy case | FIXED | `workspaceAwaitsConfirmation` + a "Confirm your notice first" alert; `workspace.confirmation.test.ts` (4 cases incl. specialist notices not nagged); verified in the built app |
| L-015 | 5.1 | P3 | The Checkbox control is 20 x 20 px (below the 24 px WCAG 2.5.8 minimum for the control itself; its label row is clickable). Announcement-bar buttons are 28 px, the show-password toggle 24 px: all pass. | `/pricing` small-target scan | FIXED | the checkbox's clickable area is 24 px via an `after` layer; the 20 px box is unchanged |
| L-016 | 4.1 | P3 | Pasting an Amazon *reply* into `/decode` still shows the tiles "The problem: Notice not clearly classified" and "Reply due: No date stated", which do not apply to a reply. The reply banner itself is right. | decode walk | FIXED | tiles hidden for a reply (scam check stays); e2e in `decode-errors.spec.ts` |
| L-017 | 5.4 | P3 | My own first version of the quadratic-path regression test used absolute budgets and flaked under the full suite's parallel load (218 ms vs 150 ms). | full vitest run | FIXED | now compares growth from 5 KB to 50 KB (linear about 10x, quadratic about 100x); each test shown failing on the old code and passing 3 times on the new |
| L-018 | 5.2 | P2 | Mobile Lighthouse (slow-4G, 4x CPU) scores performance 69-86 on the public pages, LCP about 4 s; desktop is 100 and unthrottled LCP is 0.6 s. With the script chunks blocked LCP is 2.4 s and the score 98, so the cost is script weight: every page ships about 820 KB uncompressed (react-dom 223 KB, a 157 KB client runtime, Radix 56 KB, lucide 42 KB, Sonner 38 KB, framer-motion, Paddle 27 KB); `/` 881 KB, `/pricing` 1.39 MB. CI runs the desktop preset and only warns. Preloading fewer fonts was tried and changed nothing (reverted). | 3 mobile runs per page; no-JS run; chunk inspection | OPEN, not a launch blocker | candidates: load the Toaster and framer-motion lazily, trim `/pricing`; needs a before/after run per change |
| L-019 | 5.3 | P2 | Only the home page had a share-preview image. Every page that sets its own `openGraph` (all of them, through `pageMetadata`) dropped the inherited file-based image while still declaring a "large image" Twitter card, so a guide posted in a seller forum or the pricing page shared as a bare link. | `og:image` count per page via curl: 0 on 9 of 10 public pages | FIXED | `pageMetadata` now carries the image (a byte-identical copy already in `public/brand/`); `pageMetadata.test.ts` fails if the two copies drift; `e2e/share-cards.spec.ts` checks 10 pages; built app shows one absolute og:image and twitter:image per page, one (not two) on the home page |
| L-020 | 5.3 | P3 | `/dev/ui` (internal component gallery) answers HTTP 200 on a production build but renders the 404 page (the page's `notFound()` runs after `loading.tsx` has started the response). Nothing leaks, `robots.txt` disallows `/dev/`, and real 404s elsewhere return 404. | curl on a production build | NOTED | fix by blocking the route in `proxy.ts` or deleting the page from production builds if it ever matters |
| L-021 | 5.1 | P2 | On a 305 px content width (a 320 px phone with a classic scrollbar, which CI's Linux Chromium has) the home page scrolled sideways by 12 px: the plan cards' "Decode my notice - free" button is `whitespace-nowrap` and wider than its card. CI caught it at 2 px; Windows runs and phones with overlay scrollbars did not. | CI log of run 37594909239; 305 px sweep of 12 public pages and 7 app views | FIXED | the three plan buttons fill the card and may wrap; `reflow.spec.ts` now runs at 305 px so Windows and Linux agree; all 12 public pages and the dashboard, case (4 tabs), vault and billing measure 0 |
| L-022 | 4.4 | P2 | When the decoder itself failed (503, rate limit, a platform HTML error page) the page still said "If this is a letter you wrote to Amazon, it is not a notice. Paste the message Amazon sent you." under the error, and an HTML 500 showed "Paste the full Amazon notice and try again". Nothing was wrong with the seller's paste. | decode failure probe (6 failure modes) | FIXED | server-side statuses suppress the hint and use "The decoder is not available right now. Your notice is fine and is still in the box."; e2e for 503, 429 and an HTML 500 |
| L-023 | 4.4 | P2 | The decode request had no timeout: a stalled connection left the button spinning for good with no message. | probe: a request that never answers, 12 s later no alert | FIXED | 30 s abort with "This is taking longer than it should. Your notice is still in the box." (fake-clock e2e) |
| L-024 | 4.4 | P2 | Preparing a response and opening checkout read the reply as JSON unguarded, so a platform HTML error (a gateway timeout) showed the seller the browser's parse error, "Unexpected token '<'", right after paying or while buying. Other call sites already handled it. | code inventory of 17 client fetch sites | FIXED | `apiErrorMessage` helper (3 unit tests) used by `CaseWorkspace` compose and `CheckoutButton`; `compose-errors.spec.ts` fails on the old code and passes on the new |
| L-025 | 5.4 | P3 | `journey.spec.ts` "theme switch" failed once in the full parallel run: the click landed before hydration and was dropped. 3/3 alone. | full run | FIXED | waits for `networkidle` first |
| L-026 | 3.5 | P3 | The wording-help lock lets a rewrite grow by 35% plus 6 words, so a short invented sentence ("We also replaced our supplier and passed an independent audit") can pass. Everything else probed was caught: changed or dropped dates, numbers, money, percentages, units, ASINs, names, weekdays, negation, planning language. Disclosed on the page. | 24 adversarial pairs | NOTED (founder-adjustable) | tighten `1.35 + 6` in `wordingLock.ts` if sellers should see fewer, more conservative suggestions |
| L-027 | 4.3 | P1 | A seller at the five-device limit who pressed "Prepare" saw "Action not completed: device_cap_reached", a raw machine code, though the server had sent a readable sentence in `message`; and the sentence said "Revoke one" without saying where. The Pass was already claimed for the case by then. | signed-in walk hit the cap (dev account), then a mocked 403 with the real body | FIXED | `apiErrorMessage` reads `message` before `error`; the sentence now says "Open Billing and remove one, then try again."; unit test and `compose-errors.spec.ts` (mocked 403) |
| L-028 | 4.2 | P1 | After a seller wrote three complete, specific answers, the prepared response said "The writing itself: This draft is thin." The label was driven by any gap at all (a record still to attach, a tick to give) and by the critic restating each gap as a warning, so a missing file made good writing read as bad writing. This is the reverse of the 12 Sep complaint and just as untrue. | paid walk of a policy case; `computeDraftStrength` reading | FIXED | `writtenPartGaps` split out of `workspaceGaps` (same lines, same order); `composeWorkspace` reports `gapReason`; strength judges the writing on its own findings when only a record or tick is outstanding and ignores `WORKSPACE_GAP` restatements; 7 unit tests; verified live ("Nothing flagged in how this draft reads.") |

## Founder calls raised by this audit

| # | Call | Raised in | Status |
| --- | --- | --- | --- |
| F-1 | Should Sign out end only this device's session (`scope: "local"`)? Recommendation: yes. | 1.2 | OPEN |
| F-2 | Enforce the CSP (needs a report endpoint and a clean console pass first) or drop it? | 1.5 | OPEN |
| F-4 | Mention the case identifier in the privacy page's licence-record sentence? Recommendation: yes. | 2.5 | OPEN |
| F-3 | Apply optional migration 0016 (revoke anon select on licences)? Low urgency. | 1.4 | OPEN |

## Unverified

(Suspicions without evidence yet. Promote to the register or delete — never leave a claim here as fact.)

## Method notes (learned during this audit)

- A Windows-only local run can miss what Linux CI sees: Linux headless Chromium has 15 px classic scrollbars, so a 320 px viewport has 305 px of content. Test layout at 305 px, and check `gh run list` after every push.
- The dev account's Appeal Pass binds to the first case that prepares a response, and each distinct browser identity takes a device slot (cap 5). After a walk, restore it: unbind the licence (`case_id = null`) and delete its `license_devices` rows (service key, dev account only).
- Never write a regex through a shell heredoc or `node -e` string: `\b` became a literal backspace in `responseAnalyzer.ts` and the new rule silently never matched. Use the Edit tool, then scan: `grep -nP "[\x00-\x08\x0b\x0c\x0e-\x1f]" src/core/*.ts src/lib/*.ts`.
- `grep -r` over the repo stalls on `node_modules` and old worktrees; use `git grep`.
- A passing unit test of a regex literal proves nothing about the same regex inside the module: test through the exported function.

## Gate baseline

HEAD `117355d` + L-001 fix, 7 Oct 2026 (superseded below by the 7 Oct end-of-batch figures): typecheck 0 (was 5 errors) · lint 0 · lint:copy PASS · lint:reachability PASS · lint:sources PASS · format 0 · vitest 2054/2054 in 148 files · build clean · Playwright chromium `CI=1 --retries=0` 137 passed / 0 failed / 2 skipped (signed-in tests ran; `.env.local` loaded). Lighthouse not yet run.

After the Phase 2-5 fixes (7 Oct 2026, end of session): typecheck 0 (incl. tests) · lint 0 · lint:copy/reachability/sources PASS · format 0 · vitest 2082/2082 in 154 files · build clean · Playwright chromium `CI=1 --retries=0` 166 passed / 0 failed / 2 skipped (reflow spec moved to 305 px after CI caught L-021; one flaky theme test fixed, L-025) · vitest 2090/2090 in 156 files · Lighthouse (local, mobile preset) accessibility/best practices/SEO 100 on 6 public pages.

## Session log

| Date | Done | Stopped at / next |
| --- | --- | --- |
| 2026-10-07 | Plan written (5 phases × 5 areas, 25 areas). Gate baseline recorded; found and fixed L-001 (CI red since 6 Oct on test typecheck). Phase 1 done (1.1-1.5). Phase 2 read-through done. Phase 3: fresh notices (4 families fixed), hostile-input timing (2 quadratic paths fixed), fresh replies (5 wordings fixed), timezone matrix. Phase 4/5 walks: Response-tab contradiction (L-014), pricing reflow at 320 px (L-013), responsive sweep, TODO scan. Share images on 9 pages (L-019), checkbox target, reply tiles, SEO sweep, Lighthouse, failure-state probes (L-022 to L-024), 305 px reflow (L-021). All gates green; CI green at 27840eb. | Remaining: 4.3 billing/devices page walk (device removal UI) and the dashboard multi-case view; composer output for the other protocols (documents, questionnaire, acknowledgement, verification); keyboard-only walk; L-018 (script weight) if the founder wants mobile-lab performance; the F-1..F-4 founder calls. |

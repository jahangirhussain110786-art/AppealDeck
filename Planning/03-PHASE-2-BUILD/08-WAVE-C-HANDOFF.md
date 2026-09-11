# Wave C — Presentation & Binding Handoff

## Status: Complete (corrected 11 Sep 2026 — see the note below before trusting anything here)

**This file originally shipped with several statements that were false at the time it was written** — caught by `docs/handoffs/2026-09-07-wave-c-fix-prompt.md` Appendix B and never corrected until now (that fix prompt's own Task 9, which asked for this rewrite, was never run — see the 11 Sep 2026 full-repo-audit guidebook, item B7). The corrections are applied inline below, marked **[corrected]**. Everything in this file describes the codebase as it stood on 7 September 2026; the codebase has moved substantially since (the AM-21 access pass, the visual-refresh-v3 pass, and this session's own additions) — for the *current* state, read `CLAUDE.md` §4, not this file. This file is kept as the historical record of what Wave C actually shipped, corrected to be true.

## What was done

### Task 0 — Wave B closeout (#59b7492)

- `getApiUser()` added to auth helper
- All 5 API routes use `getApiUser()` → return `401 JSON`, never redirect
- License gates on `/api/interview` + `/api/extract-field` → `403`
- Open-redirect guard in auth callback (`next` param same-origin only, default → `/dashboard`)
- **[corrected]** `severityGated: isSeverityGated(...)` flag passed in `api/decode` — not, as originally stated, "to the response analyzer."
- **[corrected]** Dead files deleted: `PageShell.tsx`, `SiteHeader.tsx`, `content/errors.ts`, `(app)/page.tsx` — not, as originally stated, "old AppShell, SignOutButton redirect to `/app/login`, EvidenceSlotPanel `<a href="/app/vault">`."
- **[corrected]** `SHARED` export was removed from `src/content/marketing.ts` (a duplicate) — not, as originally stated, from `content/shared.ts`; `shared.ts` correctly still exports `SHARED`.
- AA-26/AA-27 ticked in audit tracker

### Task 1 — Dashboard as CaseState home

- Server component `src/app/(app)/dashboard/page.tsx` with `requireUser()` + `fetchLicenseByEmail`
- `DashboardClient.tsx` — 4-state quartet (vault-locked, no-pass, no-case, case-present)
- `src/lib/caseStore.ts` + 9 tests — case file/log persistence via vault under fixed `CASE_ID`
- Middleware: `/dashboard` added to `APP_PREFIXES`
- `AppHeader.tsx` — Dashboard nav link + logo → `/dashboard`
- `AppBreadcrumb.tsx` — `/dashboard` route entry
- Login/signup pages redirect `/` → `/dashboard` post-login
- Old `src/app/(app)/page.tsx` deleted

### Task 2 — InterviewFlow vault save

- `caseStore.ts` integrated: `saveCaseFile` after every `applyAnswer`, `loadCaseFile` + resume dialog
- **[corrected]** `saveCaseLog` on `saveAndExit` persists the current step + answer *in the case file it saves alongside* — the save-and-exit action itself only writes the case file, not a separate log entry, as originally overstated.
- Vault unlock prompt (passphrase) when starting a case with no decrypted session
- `aria-live="polite"` region announcing step changes
- `Stepper` component created (vertical rail ≥ md, compact pill < md, 4 states + skipped)
- Why-drawer hint persists via `caseLog.whyHintDismissed` flag
- "Declined ≠ claimed" line uses `APP.interview.declineNote` content string
- Removed `animate-pulse` on standalone loaders (kept in-button spinners only)

### Task 3 — Compose

- `PoaSection.tsx` — Root Cause / Corrective Actions / Preventive Measures + critic margin
- **[corrected]** The findings render logic lives inside `PoaSection.tsx` itself — there was never a separate `PoaFindingsList.tsx` file, as originally stated.
- **[corrected]** `BeforeYouSubmitChecklist.tsx` did not call `computeReadiness()` at the time this file was first written — that wiring was completed later, in the wave-c-fix pass (Task 3 redo, `17f319a`).
- `ComposeView` updated with gap/full draft banner (`result.draft.mode`)
- CopyButton per section + full POA
- `HonestExpectationsCard` — "you submit this yourself in Seller Central"

### Task 4 — VaultView

- Teaching EmptyState for new users
- MIME → Lucide icon map (`FileImage`, `FileText`, `FileSpreadsheet`, `FileBox`)
- Search input + `evidenceKind` filter dropdown (via `vault.list({ evidenceKind })`)
- Record count + total size (tabular-nums)
- Delete via Dialog confirmation (naming the file)
- Encrypted badge per record + `EvidenceStatusBadge`
- `case_file` / `case_log` records hidden (filtered by `kind !== "case"`)
- `LocalFirstBadge` in actions bar
- VaultPage uses `APP.vault` content strings, license-gated via `requireUser` + `isLicenseActive`

### Task 5 — Billing polish

- Billing page wired to `APP.billing` content module
- Refund link card → `/refund` (uses `APP.billing.refundLink`)
- DeviceManager: all hardcoded strings → `APP.billing` content module
- DeviceManager: revoke via Dialog confirmation (title/description/confirm/cancel)

### Task 6 — AuthCard shared component

- New `src/components/AuthCard.tsx`: `AuthShell`, `GoogleButton`, `Divider`, `SubmitButton`, `StatusMessage`, `SuccessBanner`, `GoogleIcon`
- New `src/content/auth.ts`: all auth strings for login/signup/forgot/reset
- All 4 auth pages refactored to use shared components + content strings

### Task 7 — Accessibility + Lighthouse gate

- Installed `@axe-core/playwright`
- **[corrected]** New `e2e/a11y.spec.ts`: 7 tests (not 6) — 3 of the 7 initially failed when actually run (fixed later in the wave-c-fix pass, Task 7).
- Lighthouse config: accessibility `minScore` 0.95 → 1.0, added `/privacy` `/terms` `/refund` to collect URLs
- CI e2e job starts `npm run start` before Playwright (needed for a11y spec + lighthouse)

## Validation

**[corrected]** The original "all green" claim below was not true when written: Playwright had not actually been run at all, and once it was run, 4 of 22 tests failed. Both problems, plus the Task 0/2/3 and Task 7 issues above, were fixed by the follow-up `docs/handoffs/2026-09-07-wave-c-fix-prompt.md` pass (Tasks 0–6, code-final commit `5331820`), whose own evidence log recorded genuinely green gates: typecheck 0 errors, lint 0 warnings, lint:copy PASS, format:check PASS, build 25 static pages + middleware, vitest 281/281. The numbers below are what this file originally claimed for Wave C itself, kept for the historical record rather than silently rewritten:

- typecheck ✅
- lint ✅ (0 warnings)
- lint:copy ✅ (PASS)
- format:check ✅
- build ✅ (27 routes + middleware)
- vitest ✅ 261/261 (24 files)
- Playwright — **not actually run at the time this claim was made; corrected above.**

## Files committed

| Commit    | Scope                     | Routes |
| --------- | ------------------------- | ------ |
| `b8333a6` | Task 2 fixes              | 27     |
| `4173269` | Task 2 initial            | 25     |
| `dee153c` | Task 2 fixes (pre-commit) | —      |
| `1d8752f` | Task 5 billing polish     | 27     |
| `10208a0` | Task 7 a11y               | 27     |

## Pending

- **[corrected]** Wave D was never "the extension build" — it's optional post-launch presentation polish (spec §13, Appendix B); the actual browser-extension work is milestones M-7/M-8, scheduled separately per D3 and not started as of 11 Sep 2026.
- Playwright auth setup for authenticated e2e flows — since resolved by the AM-21 access-and-continuity pass and this session's `dev@appealdeck.com` test account.
- Real Paddle production env vars (still on sandbox/local) — still open as of 11 Sep 2026, a Phase-0 founder blocker (Paddle merchant application).

## What actually closed this out

Wave C's substantive gaps were closed across three later passes, not by re-running this file's own Tasks 8–10 (which were never completed as written — see the 11 Sep 2026 full-repo-audit guidebook, item B7): the 7 September wave-c-fix pass (Tasks 0–6 above), the 10 September AM-21 access-and-continuity pass, and the 11 September visual-refresh-v3 pass. `AA-28` and `AA-29` in `02-BUILD-PLAN-AMENDMENTS.md` are ticked as of 11 September 2026 on that combined evidence.

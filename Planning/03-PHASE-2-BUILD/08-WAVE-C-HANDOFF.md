# Wave C — Presentation & Binding Handoff

## Status: Complete

## What was done

### Task 0 — Wave B closeout (#59b7492)

- `getApiUser()` added to auth helper
- All 5 API routes use `getApiUser()` → return `401 JSON`, never redirect
- License gates on `/api/interview` + `/api/extract-field` → `403`
- Open-redirect guard in auth callback (`next` param same-origin only, default → `/dashboard`)
- `severityGated: isSeverityGated(...)` flag passed to response analyzer
- Dead files deleted (old AppShell, SignOutButton redirect to `/app/login`, EvidenceSlotPanel `<a href="/app/vault">`)
- SHARED export removed from `src/content/shared.ts` (was causing module duplication)
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
- `saveCaseLog` on `saveAndExit` — persists current step + answer
- Vault unlock prompt (passphrase) when starting a case with no decrypted session
- `aria-live="polite"` region announcing step changes
- `Stepper` component created (vertical rail ≥ md, compact pill < md, 4 states + skipped)
- Why-drawer hint persists via `caseLog.whyHintDismissed` flag
- "Declined ≠ claimed" line uses `APP.interview.declineNote` content string
- Removed `animate-pulse` on standalone loaders (kept in-button spinners only)

### Task 3 — Compose

- `PoaSection.tsx` — Root Cause / Corrective Actions / Preventive Measures + critic margin
- `PoaFindingsList.tsx` — structured findings render from case file
- `BeforeYouSubmitChecklist.tsx` — `computeReadiness()` + `generateActionItems()` + novelty check
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
- New `e2e/a11y.spec.ts`: 6 tests (home/pricing/decode/legal critical violations, dashboard redirect, skip-link, keyboard nav)
- Lighthouse config: accessibility `minScore` 0.95 → 1.0, added `/privacy` `/terms` `/refund` to collect URLs
- CI e2e job starts `npm run start` before Playwright (needed for a11y spec + lighthouse)

## Validation

- typecheck ✅
- lint ✅ (0 warnings)
- lint:copy ✅ (PASS)
- format:check ✅
- build ✅ (27 routes + middleware)
- vitest ✅ 261/261 (24 files)

## Files committed

| Commit    | Scope                     | Routes |
| --------- | ------------------------- | ------ |
| `b8333a6` | Task 2 fixes              | 27     |
| `4173269` | Task 2 initial            | 25     |
| `dee153c` | Task 2 fixes (pre-commit) | —      |
| `1d8752f` | Task 5 billing polish     | 27     |
| `10208a0` | Task 7 a11y               | 27     |

## Pending

- Wave D (extension build) — not yet started
- Playwright auth setup for authenticated e2e flows
- Real Paddle production env vars (still on sandbox/local)

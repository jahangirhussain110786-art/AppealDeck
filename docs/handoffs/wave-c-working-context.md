# Wave C Working Context — Direct Path Reference

> Purpose: minimal-token, single-file context for continuing AppealDeck Wave C implementation.
> Source of truth for this session only. Update on every commit.

## Project Paths

| What                      | Path                            | Notes                                                                     |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Root                      | `V:\AppealDeck1`                | all commands from here                                                    |
| Components                | `src/components/`               | flat, no `patterns/`                                                      |
| Core (case state machine) | `src/core/`                     | caseState.ts, interviewEngine.ts, readiness.ts, responseAnalyzer.ts       |
| Vault lib                 | `src/lib/vault/browser.ts`      | `getBrowserVault()`                                                       |
| Vault core                | `src/core/vault/`               | envelope.ts, crypto.ts, schema.ts, db.ts, vault.ts                        |
| License                   | `src/lib/license.ts`            | `isLicenseActive`, `fetchLicenseByEmail`                                  |
| Auth                      | `src/lib/auth.ts`               | `getApiUser`, `requireUser`, `unauthorizedJsonResponse`                   |
| URLs                      | `src/lib/urls.ts`               | APP_URL, SITE_URL resolution                                              |
| Content (strings)         | `src/content/`                  | app.ts, auth.ts, legal.ts, marketing.ts, errors.ts (deleted)              |
| Middleware                | `src/middleware.ts`             | APP_PREFIXES matcher                                                      |
| API routes                | `src/app/api/`                  | analyze-reply, extract-field, interview, compose, webhooks                |
| API route tests           | `src/app/api/__tests__/`        | extract-field.test.ts (vi.mock gemini)                                    |
| UI pages (app)            | `src/app/(app)/`                | dashboard, case, compose, vault, billing, login, signup, etc.             |
| e2e specs                 | `e2e/`                          | marketing.spec.ts, api.spec.ts                                            |
| Dev UI gallery            | `src/app/dev/ui/page.tsx`       | pattern gallery                                                           |
| Handoff docs              | `docs/handoffs/`                | existing wave handoffs live here                                          |
| Planning                  | `Planning/03-PHASE-2-BUILD/`    | 02-BUILD-PLAN-AMENDMENTS.md, 05-CASE-OS-SPEC.md, 06-PREMIUM-UI-UX-SPEC.md |
| Tests (glob)              | `src/**/*.{test,spec}.{ts,tsx}` | vitest.config.ts excludes e2e/                                            |

## Commands (ALWAYS run from root)

| Action                   | Command                                |
| ------------------------ | -------------------------------------- |
| dev server               | `npm run dev`                          |
| build (verify)           | `npm run build`                        |
| typecheck                | `npm run typecheck`                    |
| lint (all)               | `npm run lint`                         |
| lint copy paths          | `npm run lint:copy`                    |
| format check             | `npm run format:check`                 |
| format write             | `npm run format`                       |
| tests (unit)             | `npm test`                             |
| tests (specific file)    | `npm test -- src/path/to/file.test.ts` |
| lint-staged (pre-commit) | `npx lint-staged`                      |

## Current Uncommitted Files (from Task 0 cycle)

- `src/lib/caseStore.ts` — WIP, needs creation + tests
- `src/components/DashboardClient.tsx` — WIP, has violations to fix
- `src/components/ReplyCategoryLabel.tsx` — WIP, needs creation
- `src/content/app.ts` — modified (dashboard strings), needs more
- `docs/handoffs/wave-c-working-context.md` — this file

## Task Checklist Wave C (7 tasks)

- [x] Task 0: Wave B closeout (committed `59b7492`)
- [ ] Task 1: Dashboard `/dashboard` (fix DashboardClient violations + route page + nav + caseStore tests)
- [ ] Task 2: Case file `legal.ts` privacy text → vault-backed encrypted storage
- [ ] Task 3: API surface `analyze-reply` (auth+license 401 JSON, rate-limit)
- [ ] Task 4: InterviewFlow presentation (binding existing `analyzeReply` → `ReplyCategoryLabel`)
- [ ] Task 5: Evidence vault UI (binding, vault test harness pattern)
- [ ] Task 6: UI patterns missing (`Stepper`, `PoaSection`, `BeforeYouSubmitChecklist`, `AuthCard`) + dev UI gallery + auth strings wireup
- [ ] Task 7: Final checks (AA-26/AA-27 tick, lighthouserc accessibility=1.0, README handoff, e2e 401/403)

## Hard Constraints (grep-verify before claiming done)

```bash
# Must be 0 outside tests/theme
grep -rn "sessionStorage\|localStorage" src
# Must be 0
grep -rni "guarantee" src
# animate-spin only inside button spinner
grep -rn "animate-spin" src/components
# No percentage in readiness display
grep -rn "Math.round\|readinessPct\|%\|percent" src/components/DashboardClient.tsx
```

### Key invariants

- Readiness shown ONLY with `READINESS_COPY` verbatim — no percentages, hours, countdowns, win rates.
- Dashboard shows: last 3 cases, next due, 3 suggestions, `HonestExpectationsCard` if no active license.
- `Stepper` = linear progress (not wizard-stepper).
- `PoaSection` = `<section role="region" aria-labelledby="poa-title">`.
- `BeforeYouSubmitChecklist` = interactive checklist bound to case state.
- `AuthCard` = login/signup forms in one card with toggle.

## Types Reference

```ts
// src/core/interviewEngine.ts
CaseFile {
  id, caseId, email, enforcementType, jurisdiction,
  createdAt, updatedAt, attemptCount,
  answers: Record<string, string>, evidence: EvidenceRef[],
  currentState: CaseState /* "new"|"intake_root_cause"|"evidence_gathering"|"ready_to_compose"|"submitted" */,
  nextActionHint: NextActionHint,
  source: CaseSource /* "interactive"|"import"|"upload" */
}

// src/core/readiness.ts
ReadinessReport { status: "red"|"amber"|"green"; summary: string }
READINESS_COPY: { green, amber, red } — verbatim strings

// src/core/responseAnalyzer.ts
analyzeReply(input, context): { category, extractedAsks[], confidence }
ReplyCategory: "acknowledged"|"committal"|"disputed"|"unclear"

// src/core/caseState.ts
nextState(file, answer): CaseState
CaseStateContext { attemptCount, daysSpent, evidenceCount }

// src/lib/vault/schema.ts
VaultRecordKind = "document"|"case"|"note"|"letter"|"other"
VaultRecord { id, kind, caseId?, title, content, createdAt, updatedAt, encryptionKeyId? }
```

## Patterns Reference

| Pattern                    | Where                                       | Props/Usage                               |
| -------------------------- | ------------------------------------------- | ----------------------------------------- |
| `HonestExpectationsCard`   | `src/components/HonestExpectationsCard.tsx` | `summary: string`, `whatToDo: string[]`   |
| `ReplyCategoryLabel`       | `src/components/ReplyCategoryLabel.tsx`     | (WIP) `category: ReplyCategory` → variant |
| `Stepper`                  | (missing — Task 6)                          | linear progress, `steps: Step[]`          |
| `PoaSection`               | (missing — Task 6)                          | `aria-labelledby="poa-title"`             |
| `BeforeYouSubmitChecklist` | (missing — Task 6)                          | interactive, bound to case state          |
| `AuthCard`                 | (missing — Task 6)                          | login/signup toggle                       |
| Loading/empty/error states | spec §6 state quartet                       | every screen                              |
| `cn()`                     | import `cn` from `@/lib/utils`              | for conditional classes                   |
| `PageShell`                | import `PageShell` from `@/components`      | wrapper                                   |

## Routing

- Single-host mode: `NEXT_PUBLIC_APP_HOST` unset → no cross-host redirects
- App routes (no `/app` prefix): `/login`, `/signup`, `/case`, `/compose`, `/vault`, `/billing`, `/dashboard` (NEW)
- `APP_PREFIXES` in `src/middleware.ts` — must add `/dashboard`
- AppHeader app nav: Dashboard · Case · Vault · Billing (logo → `/dashboard` in app mode)
- Login/signup `router.replace("/")` → should become `router.replace("/dashboard")`

## Auth Flow

- `requireUser()` returns `{ id, email }` (throws if no session)
- `getApiUser()` reads `service_role` client — returns `{ id, email }` from JWT (Task 0 committed)
- `fetchLicenseByEmail(email)` → `{ active: boolean, plan?, key?, expiresAt? }`
- Auth callback already redirects to `/dashboard` as default (check `src/app/(app)/auth/callback/route.ts`)

## API Routes Status

| Route                  | Auth                           | License             | Rate-limit        | Auth-only path                                |
| ---------------------- | ------------------------------ | ------------------- | ----------------- | --------------------------------------------- |
| `/api/analyze-reply`   | via getApiUser                 | via isLicenseActive | Upstash Ratelimit | `src/lib/auth.ts:requireUser` or `getApiUser` |
| `/api/extract-field`   | requireUser                    | breaker-wrapped     | breaker           | existing                                      |
| `/api/interview`       | auth+license gates (committed) | yes                 | yes               | yes                                           |
| `/api/compose`         | auth+license (committed)       | yes                 | —                 | yes                                           |
| `/api/webhooks/paddle` | —                              | —                   | maxDuration:30    | —                                             |
| `/api/decode`          | —                              | —                   | —                 | —                                             |

## Vault API (src/core/vault/vault.ts + src/lib/vault/browser.ts)

```ts
const vault = getBrowserVault(); // wrapped in try/catch
// VaultRecordKind = "document"|"case"|"note"|"letter"|"other"
// vault.list({ caseId: CASE_ID }) — filters by caseId (vault records, not evidence)
// vault.save(record), vault.get(id), vault.delete(id)
```

## CaseStore (src/lib/caseStore.ts — WIP)

- Pattern: `VaultDao<CaseFile>` with `list/scan/get/save/archive/delete`
- `saveCaseFile(file)` → vault.upsert(record) where `kind: "case"`, `caseId: file.id`
- `loadCaseFile(caseId)` → vault.list({ caseId }) → parse single record
- `listCaseFiles(email)` → vault.scan() → filter by `content.email === email`, sort by `updatedAt` desc

## Test Patterns

- Vault tests: `src/core/vault/vault.test.ts` — PBKDF2 init pattern
- API tests: `src/app/api/__tests__/*.test.ts` — uses `vi.mock("@/lib/llm/gemini")`
- Unit test glob: `src/**/*.{test,spec}.{ts,tsx}` — excludes `e2e/**` (in vitest.config.ts)
- Test timeout config: `testTimeout: 15000`, `hookTimeout: 30000`

## Style Guide Reminders

- shadcn/ui primitives, Framer Motion (subtle), Lucide icons, `cn()`, dark-first + system light
- 320→1440 mobile-first, WCAG AA, semantic HTML
- No inline styles, utility-first Tailwind
- Component file = component + test in same dir where possible
- `"use client"` at top of client components only
- Server Components stay server unless they hydrate a subtree

## Commit Message Convention (from git log)

```
<type>(<scope>): <subject> — <files>, +<adds>/-<dels>

<type> = fix|feat|refactor|docs|test|perf|chore
<scope> = module/component name
<subject> = imperative mood, ≤72 chars
Body: bullets for context, validation line
```

## Pending Commits Log (update here after each commit)

| #   | Description                | Files                                                         | Validation |
| --- | -------------------------- | ------------------------------------------------------------- | ---------- |
| —   | Task 0 committed `59b7492` | getApiUser, open-redirect, isSeverityGated, dead-code removal | ✅         |

## Dev Seeds (DO NOT COMMIT)

- Email: `dev@appealdeck.com`
- Password: `Dev-aoH4VZcpqToYU98u-9!Aa`
- User ID: `20f36041-11ce-4b80-ab88-4a52e40239e5`
- License key: `DEV-LOCAL-001`
- Rotate: `node --env-file=.env.local scripts/seed-dev-user.mjs`

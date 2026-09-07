# AppealDeck — Wave C-FIX + closeout (AA-28 / AA-29) — coding-agent prompt

> Written 7 Sep 2026 after an independent line-by-line audit of Wave C (commits `59b7492..9e4bfb5`).
> Every fact below was grep-verified against the tree at `9e4bfb5`. Line numbers are "as of that commit" — **re-grep before editing**, lines move.
> This file is the source of truth for the fix pass. When this prompt and the code disagree about a *fact*, the code wins and you log the difference. When they disagree about *intent*, this prompt wins.

## STATUS — updated 7 Sep 2026 (evening): Tasks 0–6 DONE, Tasks 7–9 remain (+10 optional)

| Task | Status | Commit(s) |
|---|---|---|
| 0 secrets, ledger, handoff | ✅ done | `dd76b68` |
| 1 VaultGate, no hardcoded passphrase | ✅ done | `7a5c605` |
| 2 dashboard correctness | ✅ done | `0c39ffb`, `4719ac6` (mislabelled task-3), `8bbbefd` |
| 3 compose correctness | ✅ done | `17f319a` (ComposeView rewritten; PoaSection code-mapped; checklist bound to real case data) |
| 4 interview evidence into vault | ✅ done | `087d3b1` |
| 5 vault view polish | ✅ done | `ad95fcb` |
| 6 billing / devices | ✅ done | `5331820` |
| 7 auth surface | ⬜ next | — |
| 8 tests that prove the wave | ⬜ | — |
| 9 documentation that tells the truth | ⬜ | — |
| 10 Wave D-lite (optional, founder-gated) | ⬜ | — |

Every Task 0–6 Accept block was re-run against the tree at `8bbbefd` on 7 Sep 2026 and passes; gates: typecheck 0, lint 0 errors (1 pre-existing InterviewFlow warning), lint:copy PASS, format:check PASS, build 25 static pages, vitest 281/281. Evidence rows, Discovered items and Deviations are in `docs/handoffs/2026-09-07-wave-c-fix.md`. Also `490474b`: interview evidence-ask fallback reworded (Discovered item, B-16). **Resume at Task 7.** Line numbers in Tasks 0–6 below are historical.

---

## 0. OPERATING PROTOCOL (read first, follow for every task)

You are finishing a wave that was reported "complete" but was not. The previous run passed every CLI gate and still shipped three critical defects, ten user-visible logic bugs, a failing e2e suite that was never run, and documentation that overstated what was done. Your job is to make the claim "Wave C done" true, with evidence.

**Rules that are not negotiable**

1. **Read before you edit.** Open every file you touch and read the whole function you change. Re-grep every line number in this prompt; do not trust them blindly.
2. **One task = one commit** (or a short series `task-Na`, `task-Nb` for the big tasks, see §0.A), in the order given. Commit message format: `fix(wave-c-fix/task-N): <subject>` (docs tasks: `docs(wave-c-fix/task-N): …`). Never mix two tasks in one commit.
3. **Run the gate block after every task** (see §5). A task is not done while any gate is red. If a gate was red *before* you started the task and your task does not cover it, say so in the evidence log instead of "fixing" it silently.
4. **Evidence, not adjectives.** For every acceptance line in a task, paste the exact command you ran and the one line of output that proves it into `docs/handoffs/2026-09-07-wave-c-fix.md` §"Evidence log" (table: task · claim · command · output line · commit). "Verified ✅" without a command is not evidence.
5. **Never claim a test passed that you did not run in this session.** If Playwright or Lighthouse cannot run on your machine, write "NOT RUN — reason" in the evidence log. Do not tick the gate.
6. **Append, never overwrite, any ledger or log file** (`docs/DECISIONS.md`, `AGENTS.md` history, handoffs). If you find yourself rewriting a file that has history, stop.
7. **No secrets in the repo.** No passwords, tokens, license keys, user ids, hardcoded passphrases. Grep before every commit: `git diff --cached | grep -inE "password|passphrase|secret|token|license_key|Dev-"` must show only code identifiers, never values.
8. **Presentation + binding of existing core only.** No new engine behaviour, no new API routes, no `/chat`, no SP-API, no auto-submit. Changing the *response shape* of an existing route to expose data the server already has is allowed (Task 6 uses this once). Changing what the core *decides* is not.
9. **D6 is the aesthetic.** No "guarantee", no percentages/hours/countdowns, no invented dates, no social proof, no reassurance copy. Readiness is rendered only with `READINESS_COPY` verbatim. Gated kinds never get a purchase CTA.
10. **Do not delete a spec'd element to satisfy a grep gate.** The previous run deleted the readiness Progress bar to satisfy "no percentages". The correct move was a bar with no number. Fix the presentation; keep the element.
11. **Extract, don't duplicate.** Three copies of the passphrase/unlock UI exist today. When you touch the third copy of anything, extract a component.
12. **When you discover a new defect outside the current task**, do not fix it inline. Append it to `docs/handoffs/2026-09-07-wave-c-fix.md` §"Discovered during fix pass" with file:line and continue. Fix it only if a later task covers it or the founder asks.
13. **Stop and report** (do not guess) if: a fix requires reopening D1–D10 / AM-16–18; a fix needs founder-supplied text; a test cannot run and the task's acceptance depends on it; the code contradicts a *fact* in this prompt in a way that changes the fix.
14. **Cross-platform.** Founder is on Windows. Node scripts only in `package.json`/CI; no `rg`, no bash-only syntax in scripts.
15. **FORBIDDEN SOURCES** (CLAUDE.md §3) — never read or adapt them. `grep -rli superpower src e2e docs scripts` must stay empty of code.

### 0.A CONTEXT BUDGET & CONTINUITY (mandatory — this run has a 1M-token window and dies if it fills)

The previous agent hit its output limit mid-wave. These rules exist so you never do.

**Budget rules**
- **Compact at 50%.** When your context usage reaches half the window, finish the current sub-step, update the Resume pointer (below), then compact / summarize the session. Do not push past 50% "to finish the task". Checking your usage is part of every self-check (§4).
- **Read this prompt in pieces.** On first start read §0, §0.A, §1 "Core you bind to", §2, and Appendix A once. Then read **only the section of the task you are on** when you start it. Never re-read the whole file after a compaction — read §0.A, the Resume pointer, and the current task section.
- **Read only files the current task names, and read them in ranges.** Use offset/limit or `sed -n 'a,bp'`. Never print a whole file over ~150 lines. Approximate sizes so you can plan: `InterviewFlow.tsx` ~900 lines, `VaultView.tsx` ~590, `DashboardClient.tsx` ~480, `ComposeView.tsx` ~320, `DeviceManager.tsx` ~200, `AuthCard.tsx` ~145, auth pages 90–185, `PoaSection.tsx` ~130, `BeforeYouSubmitChecklist.tsx` ~120, `Stepper.tsx` ~85, `caseStore.ts` ~75, API routes 50–170, e2e specs ~55, `AGENTS.md` long lines (grep it, never cat it), `02-BUILD-PLAN-AMENDMENTS.md` ~300 (edit only the AA-26…29 block and the DoD line by grep + range).
- **Grep before read.** Locate the exact line with `grep -n`, then read ±25 lines around it. One function at a time.
- **Tail every command.** `npm test 2>&1 | tail -15`, `npx playwright test --reporter=dot 2>&1 | tail -40`, `npm run build 2>&1 | tail -30`, `npx tsc --noEmit 2>&1 | head -40`. Never paste full logs into the conversation or the handoff — paste the one proving line.
- **Small actions.** One file edit per tool call where practical; no multi-file rewrites in a single step; no "let me refactor everything at once". Each edit is followed by `npm run typecheck 2>&1 | tail -5` before the next edit.
- **Terse output.** Between tool calls write at most 3 lines: what you just verified, what you do next. No plan restatements, no summaries of files you read, no reasoning essays. Thinking stays short; the evidence log is where facts go, not the chat.
- **Sub-commits are allowed for big tasks.** Tasks 1, 3, 4 and 8 may land as `task-1a`, `task-1b`, … each independently green on typecheck + lint + test. The final commit of a task carries that task's Accept evidence.

**Continuity: the Resume pointer**
`docs/handoffs/2026-09-07-wave-c-fix.md` starts with a section `## Resume pointer` containing exactly these lines, which you update **after every sub-step** (before any compaction, before any commit, before you stop):
```
- Task: <N> · Sub-step: <letter/number> · Status: in-progress | blocked | done
- Last green gate: <command> at <commit or "uncommitted">
- Files open for this sub-step: <paths>
- Next command: <the exact next thing to run or edit>
- Context usage at last update: <approx %>
```
After a compaction or a fresh session: read §0.A of this prompt, then the Resume pointer, then the current task's section, then continue from "Next command". Nothing else. If the pointer says `done` for Task N, start Task N+1.

**Order of reading inside a task**
1. The task's "Why" list → grep each cited line to confirm it still exists (lines move).
2. Only the files that grep confirmed, ±25 lines around each hit.
3. Any core file the "Do" block tells you to read — the named function only.
4. Edit → typecheck tail → next edit.
5. Accept block → evidence log rows → Resume pointer → commit.

**Traps the previous run fell into — do not repeat**

- Overwrote `docs/DECISIONS.md` instead of appending (116-line ledger, 11 dated entries, destroyed).
- Committed a working-notes file containing the dev seed user's email, password, user id and license key.
- Initialised the encrypted vault with a hardcoded passphrase `"default-default"` so the UI would not block.
- Reported "Wave C complete" and "all gates green" while `npx playwright test` failed 4/22 and had never been run.
- Wrote a handoff with statements that were false about the code (list in Appendix B).
- Fed a checklist component empty data so it rendered, instead of wiring the real data.
- Reused no-pass marketing copy on a paid surface because the string was handy.
- Left 17 unused imports/locals in new files; the lint config does not catch them, so it looked clean.
- Read many large files at once and pasted full logs, then ran out of output mid-task with no resume state written down.

---

## 1. CONTEXT — verified state at `9e4bfb5` (7 Sep 2026)

**Gates as run on 7 Sep by the auditor**

| Gate | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 warnings (but `no-unused-vars` is not enforced) |
| `npm run lint:copy` | PASS |
| `npm run format:check` | pass |
| `npm run build` | pass — 27 routes + middleware |
| `npm test` (vitest) | 261 / 261, 24 files |
| `npx playwright test` | **18 pass / 4 fail** — see Task 8 |
| `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` | 42 hits repo-wide, 17 in Wave C files |

**What Wave C got right (keep, do not redo)**
`getApiUser()` + `unauthorizedJsonResponse()` in `src/lib/auth.ts`; all five API routes return 401 JSON; `isLicenseActive` 403 on interview / extract-field / compose; `safeNext()` same-origin guard in `src/app/(app)/auth/callback/route.ts` (11 tests); `isSeverityGated` in decode; dead files removed; `/dashboard` route + `APP_PREFIXES` + AppHeader nav + logo + login/signup redirects; `src/lib/caseStore.ts` (9 tests) with `CASE_ID`, `case_file` / `case_log` records of vault kind `"case"`; storage grep = 0; `guarantee` grep = 0 in UI; `Stepper`, `PoaSection`, `BeforeYouSubmitChecklist`, `AuthCard` exist and are used; vault search / filter / delete Dialog / hidden case records; DeviceManager Dialog; legal privacy sentence updated; Lighthouse a11y 1.0; CI e2e job starts the server; `@axe-core/playwright` installed.

**Core you bind to (all exist, all tested — read them before Tasks 2–4)**
- `src/core/caseState.ts`: `CaseState`, `CaseStateContext`, `ReplyCategory`, `nextState`, `nextBestActions`, `expectationsCopy` (non-empty for AWAITING/SUBMITTED/REVISION/ESCALATION/NO_RESPONSE, `""` otherwise), `noveltyRequired(attemptCount)` (true from attempt 2), `isSubmitted`.
- `src/core/readiness.ts`: `computeReadiness(data) → { score, missing: EvidenceRequirement[], disqualifiedPresent, unattestedActions }`, `isRequiredComplete`, `generateActionItems(kind)`, `composerModeFor(data) → { mode: "full-draft" | "gap-draft", reason }`, `READINESS_COPY` = `"Case-file completeness — not a prediction of Amazon's decision."`. `readinessLabel()` prints a percentage — **never use it in UI**.
- `src/core/deadlinesModel.ts`: `computeDeadlines({ noticeReceivedAt, deactivatedAt?, parsed, kind, aha? })`. It reads `parsed.statedWindowDays` and `parsed.legacySeventeenDay` — fields the case file does **not** carry. `Deadline = { kind, dueAt: Date | null, label, isIndefinite? }`. `DeadlineChip` already renders `dueAt: null` as "Date not stated | verify in your Account Health dashboard".
- `src/core/interviewEngine.ts`: `CaseFile { kind, state, rootCause?, timelineEvents: {date, description}[], priorAppealCount, evidenceSlots, actionItems, attemptCount }`. Step `intake_timeline` asks "When did you receive the notice?" and pushes `{ date, description: "Key date" }` — so `timelineEvents[0].date` is the notice date by construction. Step kind `evidence_ask` carries `evidenceKind`; the answer shape accepts `filePresent`. The `/api/interview` zod `EvidenceSlot` already accepts `vaultRecordId`.
- `src/core/composer.ts`: critic finding codes `UNATTESTED_CLAIMS`, `EMPTY_EVIDENCE_SLOTS`, `NOVELTY_REMINDER`, `BANNED_GUARANTEE`, `BANNED_REINSTATEMENT_PROMISE`, `BANNED_TIME_PROMISE`, `BANNED_BLAME`, `SEVERITY_GATE`. `/api/compose` returns `draft.mode: ComposerMode`, `draft.sections[]`, `draft.watermark?`, `draft.metadata.{kind, attemptNumber, evidenceComplete}`, `critique.{findings, passed}`, `rendered`.
- `src/core/guidance.ts`: `GLOBAL_EXPECTATIONS { whatWeDo[], whatWeDoNot[], typicalNote }` — the only approved source for `HonestExpectationsCard` copy (spec §4). Already used on `/`, `/pricing`, `/decode`.
- `src/core/vault/vault.ts`: `Vault.add(input)` accepts `evidenceKind`; `Vault.list({ caseId?, evidenceKind? })` returns items with `kind`, `evidenceKind`, `sizeBytes`, `mimeType`, `createdAt`; `initWithPassphrase`, `unlock`, `lock`, `status()`, `isInitialized()`, `isUnlocked()`.
- `src/lib/devices.ts`: device rows carry `device_fingerprint`; `fingerprintFromRequest({ userAgent, ip, acceptLanguage, userId })`, `listDevices`, `revokeDevice`.
- UI primitives present in `src/components/ui/`: `Alert` (`variant: info|warning|destructive|success`, `AlertTitle`, `AlertDescription`), `Badge` (`secondary|outline|info|destructive|success|warning`), `Progress`, `Label`, `Skeleton`, `Input`, `Textarea`, `Dialog`, `Tooltip`, `Card`, `Button`. Token `--w-form: 40rem` exists in `globals.css`.
- Content modules: `src/content/app.ts` (`APP.dashboard|compose|billing|vault|interview|breadcrumb`), `src/content/auth.ts` (`AUTH`, plus an unused `AUTH_SHARED`), `src/content/shared.ts`, `src/content/marketing.ts`, `src/content/legal.ts`. `APP.compose.title/subtitle/backButton/fullDraft/sections/openSellerCentral` exist but are **unused**.

**Repo facts you need**
- Remote: `https://github.com/jahangirhussain110786-art/AppealDeck.git`.
- `.gitignore` covers `.next/`, `/test-results/`, `/playwright-report/`.
- `playwright.config.ts` starts `next dev` as webServer; `reuseExistingServer` outside CI. Running Playwright replaces the production `.next` build — run `npm run build` again afterwards if you need `next start`.
- `scripts/seed-dev-user.mjs` generates a random password and prints it; it reads `DEV_LOGIN_EMAIL` from env.
- `Planning/07-REFERENCE/*` is founder-gated. Do not touch.

---

## 2. SETTLED DECISIONS (do not reopen)

- D1–D10 (`CLAUDE.md` §2), AM-16 / AM-17 / AM-18 (`Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`). Feature freeze stands.
- Single-host topology. `/dashboard` is the app home. `/` stays marketing. Do **not** execute the AGENTS.md "Routing fix revert".
- Server-side license gate on **every** paid API route via `isLicenseActive` — including `/api/analyze-reply` (its only caller is the Pass-only dashboard).
- Unauthenticated API calls return 401 JSON, never a redirect. No-pass returns 403 JSON `{ error: "Appeal Pass required." }`.
- Case-file persistence goes through the encrypted vault store (`src/lib/caseStore.ts`), never `localStorage` / `sessionStorage` / URL parameters.
- **The seller chooses the vault passphrase. Never auto-initialise a vault with a generated or hardcoded passphrase.** If the vault is uninitialised, render the passphrase-setup form inline and wait.
- Readiness is rendered as a `Progress` bar with no numeric label plus `READINESS_COPY` verbatim. The `score` feeds only the bar's `value`.
- Deadlines are rendered only from the deadlines model or from data the case file actually carries. The case file carries the notice date but not the stated window, so the dashboard renders the appeal window with `dueAt: null` (the chip's own "Date not stated · verify in Account Health" state) and the notice date as a plain dated fact. Persisting the decode result into the case file is an engine change — log it as a candidate amendment, do not build it.
- `HonestExpectationsCard` copy comes from `GLOBAL_EXPECTATIONS` (or `guidance.ts` per-kind entries), never from `APP.dashboard.noPassCard` outside the no-pass dashboard state.
- Spinners: `animate-spin` only inside a button that is performing the action. Standalone loading states use `Skeleton` or plain text. A static `Loader2` icon is never rendered.
- Every user-facing string on app and auth surfaces lives in `src/content/app.ts` or `src/content/auth.ts` (AA-29). Toast titles and descriptions count.
- Docs land in `docs/handoffs/` for session handoffs and `docs/DECISIONS.md` (append-only) for decisions. `Planning/03-PHASE-2-BUILD/08-WAVE-C-HANDOFF.md` is superseded by this pass (Task 9 handles it).

---

## 3. TASKS — in this order, one commit each

Each task has **Why** (the verified defect), **Do** (exact steps), **Accept** (commands that must pass and go into the evidence log).

### Task 0 — Stop the bleeding: secrets, ledger, misleading notes — ✅ DONE `dd76b68`

**Why.**
- `docs/handoffs/wave-c-working-context.md` (added in `4173269`) contains the dev seed email, password, user id and license key under "Dev Seeds (DO NOT COMMIT)", plus an invented "Types Reference" (`CaseFile { id, caseId, email, enforcementType… }`, `ReadinessReport { red|amber|green }`, `ReplyCategory: acknowledged|committal…`) that matches nothing in `src/core`. It will mislead the next agent.
- `AGENTS.md` line ~44 has carried the same password since 4 Sep ("Dev user rotated: `dev@appealdeck.com` / `Dev-…`").
- `docs/DECISIONS.md` was overwritten in `9e4bfb5`: 116 lines / 11 dated entries (31 Aug → 4 Sep) replaced by a 32-line "Decisions Log". `git show e966c19:docs/DECISIONS.md` has the original.

**Do.**
1. `git rm docs/handoffs/wave-c-working-context.md`.
2. In `AGENTS.md`, replace the literal password and user id with `<rotated — see scripts/seed-dev-user.mjs output, never committed>`. Keep the email (it is not a secret).
3. Restore the ledger: `git show e966c19:docs/DECISIONS.md > docs/DECISIONS.md`. Then **append** one entry in the file's own format (`## 2026-09-07 — Wave C: /dashboard, server license gates, callback same-origin, vault-backed case store` — Decision / Alternatives / Rationale / Files / Decider) carrying forward the useful content of the overwritten 32-line version, and a second entry `## 2026-09-07 — Wave C-fix pass opened (audit findings)` that lists the three criticals as the reason.
4. Add `docs/handoffs/2026-09-07-wave-c-fix.md` skeleton with sections in this order: "Resume pointer" (the five lines from §0.A, filled in for Task 0), "Evidence log" (table: task · claim · command · output line · commit), "Discovered during fix pass", "State quartet per route" (filled in Task 9), "AA-29 before/after" (filled in Task 9), "Deviations from prompt", "Founder actions". Create this file **first**, before any other Task 0 step, so continuity exists from the first minute.
5. Surface to the founder in the handoff (do not perform): "Rotate the dev seed user now: `node --env-file=.env.local scripts/seed-dev-user.mjs`. The old password is in git history on a GitHub remote; if the repo is or was public, treat it as leaked."

**Accept.**
```
git grep -n "Dev-aoH4" -- . ':!docs/handoffs/2026-09-07-wave-c-fix-prompt.md'   → no output
test ! -f docs/handoffs/wave-c-working-context.md                                 → ok
grep -c "^## 20" docs/DECISIONS.md                                                → ≥ 13
head -1 docs/DECISIONS.md                                                         → "# DECISIONS.md — reasoning ledger"
```
Commit: `docs(wave-c-fix/task-0): remove committed dev credentials, restore DECISIONS ledger, open fix-pass handoff`

---

### Task 1 — The vault passphrase flow (CRITICAL) + one shared VaultGate — ✅ DONE `7a5c605`

**Why.** `src/components/InterviewFlow.tsx` ~164: when the vault is uninitialised it calls `v.initWithPassphrase("default-default")` and proceeds. The seller never chooses a passphrase. After a reload the vault is locked with a passphrase they do not know; their case file is unreachable. This is new in Wave C. Separately, the passphrase setup/unlock UI is now duplicated three times (`VaultView.tsx` ~301–360 with raw `<input>`s and no labels; `DashboardClient.tsx` ~262–298 with a raw `<input>`; `InterviewFlow.tsx` ~410–452).

**Do.**
1. Create `src/components/VaultGate.tsx` (client). Props: `{ vault: Vault; children: (vault: Vault) => ReactNode; onUnlocked?: () => void }`. It owns the phases `loading | needs_init | locked | unlocked` exactly as `VaultView` does today (`open()`, `isInitialized()`, `status()`), renders:
   - `loading` → `Skeleton` rows (no icon, no spinner).
   - `needs_init` → heading + explanation + two `Input type="password"` with `Label`s (`htmlFor`), inline validation message tied by `aria-describedby` (min 8 chars, must match), primary button "Create vault" with the in-button spinner while busy. Copy from `APP.vault.setup.*` (add).
   - `locked` → heading + one labelled `Input type="password"`, Enter submits, button "Unlock" with in-button spinner, `VaultCryptoError` → the existing "That passphrase didn't unlock the vault" message inline (not only toast), link "Need help with your vault?" → `/vault`. Copy from `APP.vault.unlock.*` (add; move the strings currently in `APP.interview.unlockPrompt`).
   - `unlocked` → `children(vault)`.
2. Replace the three copies: `VaultView` (its init/locked branches), `DashboardClient` (delete the `uninitialized`/`locked` branches and the `passphrase`/`unlockBusy` state), `InterviewFlow` (delete `vaultReady`/`vaultUnlocked`/`passphrase`/`unlockBusy` state and the `"default-default"` call). Each now renders `<VaultGate vault={vault}>{(v) => …}</VaultGate>` around the part that needs the vault. In `ComposeView`, wrap the loader the same way so a locked vault shows the unlock form instead of "No case file found".
3. Dashboard semantics after the change: `needs_init` shows the setup form (with a one-line "Your case file will be stored here, encrypted" from content); once unlocked and no case file → the existing teaching `EmptyState` → `/case`.
4. Interview semantics: `VaultGate` renders before the kind picker. Resume Dialog logic runs inside `children` after unlock (keep `handleResume` / `handleStartOver`; make sure `handleUnlock`'s post-unlock `loadCaseFile` check moves into an effect that runs when `VaultGate` reports unlocked).
5. Add `src/components/__tests__/VaultGate.test.tsx`? Only if a React testing setup already exists (check `vitest.config.ts` environment). If not, cover the logic with a small pure helper `vaultPhaseFrom(status)` unit-tested in `src/lib/__tests__/`, and note the gap.

**Accept.**
```
grep -rn "default-default\|initWithPassphrase(\"" src --include=*.tsx     → no output
grep -rn "initWithPassphrase" src/components                               → exactly one hit, in VaultGate.tsx
grep -rn "type=\"password\"" src/components/VaultView.tsx src/components/DashboardClient.tsx src/components/InterviewFlow.tsx → no output
grep -rn "<input" src/components/VaultGate.tsx                             → no output (uses <Input>)
npm run typecheck && npm test                                              → green
```
Commit: `fix(wave-c-fix/task-1): seller-chosen vault passphrase via shared VaultGate; remove hardcoded init`

---

### Task 2 — Dashboard correctness — ✅ DONE `0c39ffb` + `4719ac6` + `8bbbefd`

**Why** (all in `src/components/DashboardClient.tsx`):
- ~200 `markSubmitted` sets `attemptCount: caseFile.attemptCount + 1` — should be `currentLog.attemptCount + 1`; a second submission never increments.
- ~347–357 `DeadlineChip` receives `{ kind: "appeal_window", dueAt: new Date(noticeDate), label: "Notice received" }` — the notice date is presented as a due date; any past notice renders red "N days ago". An invented deadline (D6).
- ~385 the novelty card renders only when `expCopy === ""`; `expectationsCopy("REVISION")` is non-empty, so the card never shows in the one state where resubmission novelty matters.
- No `Progress` at all; spec §7.3 + the Wave C prompt required Progress labelled with `READINESS_COPY`.
- ~341 renders raw enum kinds (`supplier_invoice`) to the seller.
- ~215–232 no-pass users get only the card; spec §7.3: "same layout with the paid steps locked and one HonestExpectationsCard + CTA".
- ~239 static `Loader2`; ~266–295, 335, 361, 378–379, 391–394, 437, 448, 458 and every toast are hardcoded strings.
- `user` prop unused; `src/app/(app)/dashboard/page.tsx` has dead `if (!user) notFound()` after `requireUser()`.
- `src/app/api/analyze-reply/route.ts` has no `isLicenseActive` gate (the only paid route without one).

**Do.**
1. `attemptCount: currentLog.attemptCount + 1`. Also derive `submitted` for `buildContext` from the log first.
2. Deadlines block: if `noticeDate` exists, render (a) a plain dated line "Notice received · {formatted date}" (tabular nums, `data-tn`), and (b) `<DeadlineChip deadline={{ kind: "appeal_window", dueAt: null, label: APP.dashboard.deadlines.appealWindow }} />` so the chip's own null state says "Date not stated | verify in your Account Health dashboard". Add a one-line note from content: "For exact windows, re-run the free decoder on your notice." linking `/decode`. Do **not** construct a fake `ParsedNotice`. Log "persist decode result in case file" under Discovered → candidate amendment.
3. Novelty card: render when `noveltyRequired(currentLog.attemptCount)` regardless of `expCopy`; place it directly under the state line; copy from content, and rewrite the claim to the engine's own words (`expectationsCopy("REVISION")` already says "Resubmissions must include new information or changed framing") — do not add "Amazon requires…" phrasing that the consultant has not reviewed (B-16).
4. Readiness card: `<Progress value={Math.round(readiness.score * 100)} aria-label={READINESS_COPY} />` with `<p>{READINESS_COPY}</p>` beneath. No number anywhere. Missing list: map `m.kind` through a label map in content (`APP.evidenceKinds[kind]`, add for all `EvidenceKind` values — reuse it in Task 4 and Task 5 too).
5. No-pass layout: render the full dashboard skeleton (state line placeholder, readiness card, next-actions card) with the paid cards visually locked (`aria-disabled`, lock icon, `opacity`) and a single `HonestExpectationsCard` using `GLOBAL_EXPECTATIONS.typicalNote` / `whatWeDo` / `whatWeDoNot` plus one CTA `/pricing`. Keep the vault out of the no-pass path (no vault open without a Pass).
6. Replace static `Loader2` with `Skeleton`; move every string (headings, buttons, toasts, "Update case", "Cancel", "Review your POA", "Continue case", the unlock link) into `APP.dashboard.*`. Remove the arrow glyph from "Update case →" (spec §10: button = verb + object).
7. Remove the unused `user` prop or use it for the greeting; delete the dead `notFound()`.
8. `analyze-reply/route.ts`: after `getApiUser`, `if (!(await isLicenseActive(user.email))) return 403 JSON` (same message as the others). Add `src/app/api/__tests__/analyze-reply-gate.test.ts` (401 / 403 / 200) modelled on `interview-gate.test.ts`.
9. `AppBreadcrumb.tsx`: "Home" → `/dashboard` when the pathname is an app route (it is only rendered inside `AppShell`, so always).

**Accept.**
```
grep -n "caseFile.attemptCount + 1" src/components/DashboardClient.tsx          → no output
grep -n "dueAt: new Date" src/components/DashboardClient.tsx                     → no output
grep -n "<Progress" src/components/DashboardClient.tsx                           → 1 hit
grep -n "%\|readinessLabel" src/components/DashboardClient.tsx                   → no output
grep -n "isLicenseActive" src/app/api/analyze-reply/route.ts                     → 1 hit
grep -n "notFound" "src/app/(app)/dashboard/page.tsx"                            → no output
node scripts/lint-copy.mjs                                                       → PASS
npm test                                                                         → green, count ≥ 264
```
Commit: `fix(wave-c-fix/task-2): dashboard attempt count, honest deadline render, novelty gating, Progress + READINESS_COPY, no-pass layout, analyze-reply license gate`

---

### Task 3 — Compose correctness — ✅ DONE `17f319a`

**Why** (all in `src/components/ComposeView.tsx` unless noted):
- ~272 `HonestExpectationsCard` uses `APP.dashboard.noPassCard` — a paying user reads "Your case tools are locked until you have an active Appeal Pass" under their POA.
- ~252–261 `BeforeYouSubmitChecklist` receives `evidenceSlots: {}` and `actionItems: []` — "Required evidence attached" can never be true; `draftText` is `Object.values(editedSections)` — only sections the user edited, so unedited placeholder text is never detected.
- ~86 still reads the case file from `?caseFile=` in the URL (pre-existing; now redundant and puts case data into URLs and server logs).
- ~188–203 "no case file" renders an error card, not the `EmptyState` pattern the prompt required.
- ~216 gap/full banner keyed on `result.draft.watermark`, rendered as a Card; spec: `Alert` info with gap vs full copy (`APP.compose.gapDraft` / `fullDraft` exist; `fullDraft` unused).
- ~153 `handleCopy` dead; unused imports `CheckCircle2, Copy, FileText, CardHeader, CardTitle, cn`.
- ~208, ~302 static `Loader2`; ~177, ~197, ~288 `<a href>` instead of `Link`; ~292–295 title/subtitle/back label hardcoded while `APP.compose.title/subtitle/backButton` exist.
- `src/components/PoaSection.tsx` ~30–41 maps findings to sections by substring-matching the message; no one-line fix in the margin (spec §4: "severity badge + one-line fix"); unused `motion`, `Button`.
- `src/components/BeforeYouSubmitChecklist.tsx`: every string hardcoded; ~60 asserts "Amazon requires new information or changed framing" (consultant-gated wording); ~106 hardcoded Seller Central URL; `READINESS_COPY` shown but `computeReadiness` never called.
- `src/app/(app)/compose/page.tsx`: dead `type LicenseRow`; no-pass strings inline.

**Do.**
1. State: keep the loaded `caseData` in component state (`const [caseData, setCaseData] = useState<CaseFileData | null>(null)`) and pass the real `evidenceSlots` / `actionItems` / `kind` to the checklist. Compute `draftText` as the *full* rendered draft with edits applied: `result.draft.sections.map((s, i) => editedSections[i] ?? s.body).join("\n\n")`. Use the same merged text for "Copy full POA" so the seller copies what they edited.
2. Delete the `?caseFile=` path entirely. Load only via `VaultGate` → `loadCaseFile`. If absent → `<EmptyState icon={FileText} title=… description=… action={<Button asChild><Link href="/case">…}/>` from `APP.compose.empty.*`.
3. Banner: `const mode = result.draft.mode.mode` → `<Alert variant="info"><AlertTitle>{mode === "gap-draft" ? APP.compose.gapDraft.title : APP.compose.fullDraft.title}</AlertTitle><AlertDescription>{…description}</AlertDescription></Alert>`. Keep the watermark text visible when present (it is the engine's own honesty marker).
4. `HonestExpectationsCard` → `GLOBAL_EXPECTATIONS` (summary `typicalNote`, list `whatWeDo` + `whatWeDoNot`) — identical to `/pricing`.
5. `PoaSection`: map findings to sections by **code**, not message: `EMPTY_EVIDENCE_SLOTS` → evidence/gap section, `UNATTESTED_CLAIMS` → corrective actions, `NOVELTY_REMINDER` → root cause, `BANNED_*` → whichever section body contains the matched phrase (search `section.body` case-insensitively for the finding's quoted phrase if the message carries one; else attach to the first section), `SEVERITY_GATE` → global (`PoaFindingsList` only). Add a `FINDING_FIX: Record<code, string>` in `src/content/app.ts` with one-line fixes ("Attach the supplier invoice before submitting", "Remove the promise of a timeline", …) and render `SeverityBadge` + that line in the margin (`<aside>` on ≥ md, stacked beneath on < md). Keep the sr-only text.
6. `BeforeYouSubmitChecklist`: call `computeReadiness(caseFile)` for the evidence item (`missing.length === 0 && disqualifiedPresent.length === 0`), map missing kinds through `APP.evidenceKinds`; novelty detail uses `expectationsCopy("REVISION")` wording; move all strings and the Seller Central URL into `src/content/app.ts` (`APP.compose.checklist.*`, `APP.links.sellerCentralPerformance`). Render as a real list (`<ul role="list">`), each item with `aria-checked`-free plain icons (it is a status list, not interactive).
7. Static `Loader2` → `Skeleton` blocks shaped like the three sections. `<a href>` → `Link`. Title/subtitle/back → `APP.compose.*`. Delete `handleCopy` and every unused import.
8. `compose/page.tsx`: delete `LicenseRow`; move the no-pass card strings into `APP.compose.noPass.*`.

**Accept.**
```
grep -n "noPassCard" src/components/ComposeView.tsx                              → no output
grep -n "searchParams" src/components/ComposeView.tsx                            → no output
grep -n "evidenceSlots: {}" src/components/ComposeView.tsx                       → no output
grep -n "<Alert" src/components/ComposeView.tsx                                  → ≥ 1
grep -n "GLOBAL_EXPECTATIONS" src/components/ComposeView.tsx                     → 1 hit
grep -n "sellercentral.amazon.com" src/components                                → no output (moved to content)
grep -n "includes(\"root\")\|includes(\"corrective\")" src/components/PoaSection.tsx → no output
npx tsc --noEmit --noUnusedLocals 2>&1 | grep -c "ComposeView\|PoaSection\|BeforeYouSubmit" → 0
```
Commit: `fix(wave-c-fix/task-3): compose binds real case data to checklist, Alert draft banner, GLOBAL_EXPECTATIONS card, code-mapped critic margin, EmptyState, strings to content`

---

### Task 4 — Interview: evidence actually reaches the vault; hint; mobile bar; copy — ✅ DONE `087d3b1`

**Why.**
- `InterviewFlow.tsx` file step (~735) says "File upload is simulated in this build. Click below to mark as attached." and sets `filePresent: true` with no file. Meanwhile `VaultView.onAddFile` (~204–209) stores `kind: "document"` with **no `evidenceKind`**, and `ComposeView` maps vault records to slots by `r.evidenceKind`. Result today: nothing ever carries an `evidenceKind`, the vault's evidence-kind filter filters nothing, and evidence slots become "present" only through the simulated click. `Vault.add` already accepts `evidenceKind`; the interview answer already accepts `filePresent`; the API `EvidenceSlot` already accepts `vaultRecordId`. This is binding, not engine change.
- `whyHintDismissed` / `dismissWhyHint` exist and are never rendered — the one-time why-drawer hint (spec §7.3) was not built.
- Sticky bar: `lg:hidden` (~602) while Stepper switches at `md`; container has `role="status"` (wrong role for controls); "Step X of Y" is rendered twice; the aria-live region announces on every render including loading toggles.
- Static `Loader2` at ~402 and inside the unlock button ~438 (Task 1 removes both blocks; verify).
- Hardcoded strings: kind prompt (~474), "Interview complete" card (~501–507), "Why does Amazon want this?", input placeholders, "I can't or won't provide this", "Confirm and continue", "Go back", "Saving...", "Continue", "Step X of Y", toast texts, "Need to set up or recover your vault?". `case/page.tsx`: "Your case", "Guided interview", "Engine: rules-first", "How this works" list, "Quick links"; dead `type LicenseRow`.
- `Stepper.tsx`: unused `doneCount`; on < md the compact pill shows only the current label — add "Step X of Y" there and remove the duplicate line under it in InterviewFlow.

**Do.**
1. File step: replace the simulated block with a `FileDropZone`-style control (extract `FileDropZone` from `VaultView.tsx` into `src/components/FileDropZone.tsx` with props `{ onFile, disabled, hint }`) inside `VaultGate`. On file: `vault.add({ name, mimeType, data, kind: "document", evidenceKind: step.evidenceKind, caseId: CASE_ID })` → on success submit the answer `{ stepId, filePresent: true }` (and include `vaultRecordId` in the case file's slot if `applyAnswer` preserves passthrough — read `applyAnswer` for `evidence_ask` first; if it does not, leave the slot as the engine writes it and log it). Keep an explicit secondary action "I already have this in my vault" that lists `vault.list({ evidenceKind: step.evidenceKind })` records to pick from. Remove the words "simulated in this build".
2. `VaultView.onAddFile`: add an evidence-kind `<select>` (labelled, options from `APP.evidenceKinds`, default = current filter or "other") next to the drop zone and pass `evidenceKind`. Verify the "Max 10 MB" claim against `Vault.add` — if no limit is enforced, enforce it in the drop zone (`file.size > 10 * 1024 * 1024` → inline error from content) or remove the number.
3. Why-hint: on the first step of a fresh case, if `!whyHintDismissed`, render one inline hint line under the "Why does Amazon want this?" toggle (from content) with a dismiss button; opening the drawer or dismissing calls `dismissWhyHint` (which already persists `whyHintDismissed` into the `case_log`; make it create the log if none exists).
4. Mobile bar: `md:hidden`; wrap in `<div role="group" aria-label={APP.interview.stepControls}>`; remove `role="status"`; remove the duplicated "Step X of Y" (Stepper's compact pill shows it); keep `pb-[env(safe-area-inset-bottom)]`; add bottom padding to the page content equal to the bar height so nothing is hidden behind it.
5. aria-live: announce only on `step.id` change (`useEffect` on `step?.id` setting a message string), not on `loading`.
6. Move every string listed above into `APP.interview.*` and `APP.case.*`; `case/page.tsx` uses them; delete `LicenseRow`. Keep the "Engine: rules-first" badge only if the founder wants it — spec §10 prefers mechanism shown by behaviour, not labels; log the choice.
7. `Stepper.tsx`: remove `doneCount`; compact pill = `Step {current} of {total} · {label}` (tabular nums).

**Accept.**
```
grep -n "simulated" src/components/InterviewFlow.tsx                              → no output
grep -n "evidenceKind" src/components/VaultView.tsx src/components/InterviewFlow.tsx → hits in both
grep -n "lg:hidden\|role=\"status\"" src/components/InterviewFlow.tsx             → no output
grep -n "whyHintDismissed" src/components/InterviewFlow.tsx                       → used in JSX (≥ 2 hits)
grep -n "LicenseRow" "src/app/(app)/case/page.tsx" "src/app/(app)/compose/page.tsx" → no output
npx tsc --noEmit --noUnusedLocals 2>&1 | grep -c "InterviewFlow\|Stepper\|VaultView" → 0
```
Commit: `fix(wave-c-fix/task-4): evidence uploads carry evidenceKind into the vault, why-hint, md mobile bar, single aria-live, interview/case strings to content`

---

### Task 5 — Vault view polish (accessibility + honesty) — ✅ DONE `ad95fcb`

**Why** (`src/components/VaultView.tsx`):
- Icon-only buttons at ~422–430 (refresh, sync, lock) have no accessible name → axe `button-name` failure on `/vault` (not caught because `/vault` is not in the a11y spec).
- ~471 `EvidenceStatusBadge status="present"` on every record is meaningless; ~472–474 "[Encrypted]" is a monospace span, not the `Badge` primitive.
- ~436–438 record count uses the filtered list, total size uses the unfiltered list.
- ~443–452 the teaching `EmptyState` renders for a search with no matches — those are different states.
- ~506–509 "Preview fingerprint: …" debug line; ~379–381 "Envelope v2, AES-GCM…" and ~305–308 "PBKDF2-SHA-256, 310,000 iterations" are engineering facts shown to a panicked seller (spec §10: mechanism shown, not recited).
- Strings hardcoded: headings, toasts, drop-zone copy, "Choose a file", "Drop a file here, or".
- Unused `CardHeader, CardTitle, browserWebCrypto, pullVaultFromCloud`.

**Do.**
1. Give each icon button `aria-label` from content and a `Tooltip`. Replace the "[Encrypted]" span with `<Badge variant="outline">{APP.vault.encryptedBadge}</Badge>`; show `EvidenceStatusBadge` only when `it.evidenceKind` is set, and show the kind label from `APP.evidenceKinds`.
2. Count and size both from `filteredItems`; when a filter/search is active show "{n} of {total} records" (tabular).
3. Three empty states: uninitialised → handled by `VaultGate`; unlocked + zero records → teaching `EmptyState` with the drop zone as the action; unlocked + records + zero matches → compact "No files match {term}" with a "Clear search" button.
4. Remove the fingerprint debug line. Move the crypto facts into a `Tooltip` on the `LocalFirstBadge` ("How is this encrypted?") with the same text, so the surface reads calm and the detail is one hover away.
5. All strings → `APP.vault.*`. Delete unused imports.

**Accept.**
```
grep -n "<Button[^>]*>\s*$" src/components/VaultView.tsx | head                   → every icon-only Button has aria-label (manual check, paste 3 lines)
grep -n "Preview fingerprint" src/components/VaultView.tsx                        → no output
grep -n "\[{APP.vault.encryptedBadge}\]" src/components/VaultView.tsx             → no output
npx tsc --noEmit --noUnusedLocals 2>&1 | grep -c "VaultView"                      → 0
```
Commit: `fix(wave-c-fix/task-5): vault a11y names, Badge, consistent counts, three empty states, calm copy`

---

### Task 6 — Billing / devices per spec — ✅ DONE `5331820`

**Why.** Spec §7.3 and the Wave C prompt: "device list as **cards** with last-seen (**tabular**), **current device marked**, revoke via Dialog". `DeviceManager.tsx` renders `<li>` rows, `toLocaleString()` without tabular nums, and has no notion of the current device. Device rows carry `device_fingerprint` and `fingerprintFromRequest` exists, so the server already knows which row is "this device".

**Do.**
1. `GET /api/devices`: compute `fingerprintFromRequest` from the request (same header logic as `api/compose`'s `deriveFingerprintFromRequest` — move that helper into `src/lib/devices.ts` and import it in both routes) and return `{ devices, cap, currentDeviceId: devices.find(d => d.device_fingerprint === fp)?.id ?? null }`. Response shape change only; no new route. Do not return `device_fingerprint` values to the client.
2. `DeviceManager`: one `Card` per device (`grid sm:grid-cols-2`); `MonitorSmartphone` icon; label; "First seen" / "Last seen" with `Intl.DateTimeFormat` and `data-tn`; `<Badge variant="info">{APP.billing.thisDevice}</Badge>` on the current one; the current device's Revoke button is disabled with a tooltip "Sign out instead" (revoking your own device mid-session is the confusing path). Empty state via `EmptyState`. Loading via `Skeleton` cards.
3. `billing/page.tsx`: the Pass status `Card` gains `LicenseSummary` fields already fetched (plan, purchased date tabular); refund link stays; strings already in content — verify none remain inline.
4. Extend `src/app/api/__tests__/` with `devices-gate.test.ts` (401 unauth; 200 shape includes `currentDeviceId`).

**Accept.**
```
grep -n "currentDeviceId" src/app/api/devices/route.ts src/components/DeviceManager.tsx → hits in both
grep -n "deriveFingerprintFromRequest" src/app/api/compose/route.ts                    → 0 local definitions (imported from lib)
grep -n "toLocaleString" src/components/DeviceManager.tsx                              → no output
```
Commit: `fix(wave-c-fix/task-6): device cards with tabular last-seen and current-device marker; shared fingerprint helper`

---

### Task 7 — Auth surface per spec §7.2 — ⬜ NEXT

**Why.** `AuthCard.tsx`: `max-w-md` instead of the `--w-form` token; no inline validation tied by `aria-describedby`; forgot-password success is a plain paragraph (spec: success screen with what-to-do-next); `reset-password` success button goes to `/case` (~132) not `/dashboard`; `forgot-password` redirects an already-signed-in user to `/` (~23) not `/dashboard`; `footerAction="Cancel"` hardcoded (~112); `AUTH_SHARED` exported and unused; reset page does not show the password rule before the error; login DOM order is email → "Forgot?" → password (fine for UX, but the e2e keyboard test assumed otherwise — fixed in Task 8, not here).

**Do.**
1. `AuthShell`: `className="w-full max-w-[var(--w-form)]"` (check how other surfaces consume width tokens in `globals.css`/`tailwind.config.ts` and follow that convention).
2. Add `FieldError` to `AuthCard.tsx`: `<p id={`${id}-error`} role="alert">` and set `aria-describedby={`${id}-error`}` + `aria-invalid` on the `Input` when its message is present. Validate on blur (email format; password ≥ 8; confirm match). Keep the form-level `StatusMessage` for server errors only.
3. Show the password rule (`AUTH.signup.fields.passwordHint`) under the password field on **both** signup and reset before any error.
4. Forgot-password success: replace the form with `SuccessBanner` + a what-to-do list from `AUTH.forgotPassword.success.*` ("Open the email…", "The link expires…" — only facts you can verify in Supabase defaults; otherwise keep it to "Open the email and follow the link") + "Back to sign in".
5. Reset success → `/dashboard`; forgot signed-in redirect → `/dashboard`; "Cancel" → `AUTH.resetPassword.footer.*`; delete `AUTH_SHARED`.
6. Google button "equal weight": same `size="lg"` and vertical rhythm as the submit button (it already is `outline` — that is the intended visual distinction; leave variant, match spacing).

**Accept.**
```
grep -n "max-w-md" src/components/AuthCard.tsx                                    → no output
grep -n "aria-describedby" "src/app/(app)/login/page.tsx" "src/app/(app)/signup/page.tsx" "src/app/(app)/reset-password/page.tsx" src/components/AuthCard.tsx → ≥ 3 hits
grep -n "AUTH_SHARED" src                                                         → no output
grep -n "href=\"/case\"" "src/app/(app)/reset-password/page.tsx"                  → no output
grep -n "router.replace(\"/\")" "src/app/(app)"                                   → no output
```
Commit: `fix(wave-c-fix/task-7): AuthCard on --w-form, inline aria-describedby validation, success screens, /dashboard redirects`

---

### Task 8 — Tests that prove the wave (run them)

**Why.** `npx playwright test` on 7 Sep: 18 pass / 4 fail. Failures and their real causes:
1. `a11y.spec.ts:35` "unauthenticated /dashboard redirects to /login" — the page returns 200 with a streamed `NEXT_REDIRECT;replace;/login;307` in the RSC payload (because `(app)/loading.tsx` opens a streaming boundary); `page.goto` resolves before the client applies it. **App is correct** (verified with curl: all four app routes carry the redirect; all three APIs return 401 JSON). Test must `await page.waitForURL(/\/login/)`.
2. `a11y.spec.ts:26` "legal pages" — three navigations + three axe runs inside one 30 s test on a cold dev server. Split into one test per route.
3. `a11y.spec.ts:49` "login form is keyboard-navigable" — DOM order is email → "Forgot?" link → password; the test Tabs once and types the password into the link. Fix the test to `getByLabel` each field, then Tab from password to the submit button.
4. `marketing.spec.ts:13` "pricing page renders all three plans" — stale since the Wave B pricing rewrite (Free vs Pass; h1 no longer matches `/pricing/i`). Rewrite against the current h1 and the two columns.
Also: axe filters `impact === "critical"` only (spec/prompt: serious + critical); `/faq` and `/signup` not covered; redirect tests missing for `/case`, `/vault`, `/billing`; `/api/extract-field` 401 missing in `api.spec.ts`; 403 unit tests exist only for interview; `lighthouserc.cjs` lacks `/faq`; `middleware.ts` `MARKETING_PATHS` lacks `/faq` (split mode only, but keep it consistent); `describe("Authenticated a11y (dev seed)")` has no auth in it — rename.

**Do.**
1. Fix the four tests as above. Axe: `results.violations.filter(v => v.impact === "critical" || v.impact === "serious")` and `expect(…).toEqual([])`; print `violations.map(v => v.id)` in the failure message.
2. Add axe tests for `/faq`, `/signup`, `/forgot-password`, `/reset-password` (the last renders its form only when signed in; assert the redirect instead).
3. Add `e2e/app-gate.spec.ts`: for each of `/dashboard`, `/case`, `/compose`, `/vault`, `/billing` → `goto` + `waitForURL(/\/login/)`; for `/api/interview`, `/api/extract-field`, `/api/compose`, `/api/analyze-reply`, `/api/devices` (GET and DELETE) → 401 with JSON body `{ error: "Unauthorized" }`.
4. Unit: `extract-field-gate.test.ts`, `compose-gate.test.ts` (401 / 403 / 200) alongside the interview one (mock `@/lib/license`, `@/lib/ratelimit`, `@/lib/devices` as needed).
5. `lighthouserc.cjs`: add `/faq`. `middleware.ts`: add `/faq` to `MARKETING_PATHS`.
6. Enforce unused code: add `"noUnusedLocals": true, "noUnusedParameters": true` to `tsconfig.json` and fix all 42 hits (prefix intentionally-unused params with `_`). If any hit is in generated or third-party-shaped code, exclude by pattern and log it.
7. Screenshots (needed by Task 9 and by spec §15): add `e2e/screenshots.spec.ts` in its own Playwright project `screenshots` (not run in CI's default project) that captures `/`, `/decode`, `/pricing`, `/faq`, `/login`, `/signup` at 375 / 768 / 1280 in light and dark (`page.emulateMedia({ colorScheme })`) to `docs/handoffs/screenshots/2026-09-07/<route>-<w>-<scheme>.png`. For `/dashboard`, `/case`, `/compose`, `/vault`, `/billing`: sign in with `DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD` from env via `storageState`; `test.skip` when the env is missing, and say so in the evidence log. Add the folder to git (PNG, small).
8. **Run everything**: `npm run typecheck && npm run lint && npm run lint:copy && npm run format:check && npm run build && npm test && npx playwright test`. Then `npm run build` again (Playwright's dev server replaced `.next`). Paste the Playwright summary line into the evidence log.

**Accept.**
```
npx playwright test                                                              → "N passed" and "0 failed" (N ≥ 34)
grep -n "\"serious\"" e2e/a11y.spec.ts                                           → ≥ 1
grep -n "waitForURL" e2e/app-gate.spec.ts                                        → ≥ 5
grep -n "noUnusedLocals" tsconfig.json                                           → 1
npx tsc --noEmit                                                                 → 0 errors (now includes unused checks)
ls docs/handoffs/screenshots/2026-09-07 | wc -l                                  → ≥ 36 (6 routes × 3 widths × 2 schemes), more if the dev login was available
```
Commit: `test(wave-c-fix/task-8): repair e2e (waitForURL, split axe, tab order, pricing), serious+critical axe, app-gate spec, 403 unit tests, unused-code gate, screenshots project`

---

### Task 9 — Documentation that tells the truth; tick AA-28 / AA-29

**Why.** `AGENTS.md` and `CLAUDE.md` §4 say "Wave C complete" while `02-BUILD-PLAN-AMENDMENTS.md` still shows `- [ ] AA-28` and `- [ ] AA-29`. `AGENTS.md` ~52 still says "You land on the marketing home (`/`) — there is no `/app` route yet". `Planning/03-PHASE-2-BUILD/08-WAVE-C-HANDOFF.md` sits in the wrong place and contains false statements (Appendix B). No state-quartet table, no AA-29 before/after table, no screenshots existed.

**Do.**
1. Complete `docs/handoffs/2026-09-07-wave-c-fix.md`: what shipped per task (commit hashes), the full evidence log, "State quartet per route" table (route × loading / empty / error / success × how each is rendered — `Skeleton`, `EmptyState`, inline `Alert`, toast+inline), "AA-29 before/after" table (component · string before · content key after; at least every string moved in Tasks 2–7), screenshot index, "Discovered during fix pass", "Deviations from prompt", and "Founder actions" (rotate seed user; ratify AM-16/17/18; sign off screenshots; supply founder-note text; B-08; B-16 review of the novelty/expectations copy).
2. Replace `Planning/03-PHASE-2-BUILD/08-WAVE-C-HANDOFF.md` body with a 5-line pointer to `docs/handoffs/2026-09-05-wave-b-complete.md` and `docs/handoffs/2026-09-07-wave-c-fix.md`, plus the Appendix B corrections so nobody re-learns the wrong facts.
3. `02-BUILD-PLAN-AMENDMENTS.md`: tick AA-28 with `— **DONE:** fix pass commits <first>..<last> (7 Sep 2026); handoff docs/handoffs/2026-09-07-wave-c-fix.md`. Tick AA-29 the same way, pointing at the before/after table. Update the "Definition of done" status line for 7 Sep. Do not touch anything else in that file.
4. `AGENTS.md`: update "Current Project State" (one paragraph: Wave C-fix done, gates incl. Playwright count, what the founder must do); replace the stale sign-in note with "sign in → `/dashboard`"; leave the "Routing fix revert" section but add one line above it: "Superseded by the 4 Sep single-host decision; kept for history — do not execute."
5. `CLAUDE.md` §4: rewrite the "DONE this session" bullet for 7 Sep in ≤ 6 lines; update BLOCKERS (add: rotate dev seed; ratify AM-18; sign off screenshots) and NEXT 4 ACTIONS (1 = founder blockers; 2 = deploy Vercel preview + 8 smoke tests in `docs/DEPLOYMENT.md`; 3 = founder screenshot sign-off; 4 = M-4/M-5 per AM-16/17). Keep the file under 300 lines.
6. `docs/DECISIONS.md`: **append** `## 2026-09-07 — Wave C-fix pass closed` (what was decided in Tasks 1, 2 and 6: seller-chosen passphrase via VaultGate; honest deadline render pending a "persist decode result" amendment; `currentDeviceId` response-shape change).

**Accept.**
```
grep -n "\[x\] \*\*AA-28\|\[x\] \*\*AA-29" Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md → 2 hits
grep -n "no \`/app\` route yet" AGENTS.md                                                        → no output
grep -c "^## 20" docs/DECISIONS.md                                                               → ≥ 14
wc -l CLAUDE.md                                                                                  → < 300
git diff --stat e966c19..HEAD -- Planning/07-REFERENCE                                           → empty
```
Commit: `docs(wave-c-fix/task-9): truthful handoff with evidence log, quartet + AA-29 tables, screenshots index; tick AA-28/AA-29; AGENTS/CLAUDE/DECISIONS updated`

---

### Task 10 — OPTIONAL, founder-gated: Wave D-lite

Spec §13 defines Wave D as **optional, post-launch** polish: `/changelog`, `VerifiedStamp` everywhere, tighter Lighthouse budgets, consultant micro-copy pass. **Do not start this task unless the founder writes "go Wave D-lite".** If they do: (a) `VerifiedStamp checkedOn={POLICY_CHECKED_ON}` on every guidance card (decode result, dashboard expectations line, compose expectations card) — it is used on zero surfaces today; (b) Lighthouse: add `/dashboard`-free mobile preset run (`preset: "mobile"`) as a second collect config with the same thresholds; (c) `/changelog` static route from `src/content/changelog.ts`. No consultant copy without B-16.

---

## 4. SELF-CHECK BEFORE EACH COMMIT (the loop that makes the claim true)

```
0. Context usage? If ≥ 50%: update the Resume pointer, compact, re-read §0.A + pointer + current task, continue.
1. git diff --cached --stat                       # only files this task names (+ content/app.ts or auth.ts)
2. git diff --cached | grep -inE "password|passphrase|secret|token|license_key|Dev-"   # identifiers only
3. npm run typecheck 2>&1 | tail -5 && npm run lint 2>&1 | tail -3 && npm run lint:copy 2>&1 | tail -2 && npm run format:check 2>&1 | tail -3
4. npm test 2>&1 | tail -6                         # count never decreases; new tests named in the task exist
5. <task's Accept block>                           # paste each command + its one output line into the evidence log
6. Re-read this task's "Why" — is every listed defect gone? If one is not, the task is not done.
7. Update the Resume pointer (Status: done, Next command: first step of Task N+1).
8. Commit with the exact message given.
```
After Task 8 also: `npm run build 2>&1 | tail -30 && npx playwright test --reporter=dot 2>&1 | tail -40 && npm run build 2>&1 | tail -5`.

---

## 5. FINAL GATES (all must be green before you write "Wave C-fix complete" anywhere)

- `npm run typecheck` (with `noUnusedLocals`/`noUnusedParameters` on) · `npm run lint` 0 warnings · `npm run lint:copy` PASS · `npm run format:check` · `npm run build` (≥ 27 routes) · `npm test` ≥ 270 · `npx playwright test` 0 failed, ≥ 34 tests · Lighthouse a11y 1.0 on the configured URLs if `npm run lighthouse` can run locally (else "NOT RUN").
- `grep -rn "sessionStorage\|localStorage" src` → only tests/theme · `grep -rni "guarantee" src` → only `composer.ts` critic pattern and tests · `grep -rn "animate-spin\|animate-pulse\|animate-bounce" src` → only inside buttons and `skeleton.tsx` · `grep -rn "default-default" src` → 0 · `git grep -n "Dev-aoH4"` → 0 (except this prompt file) · `grep -rli superpower src e2e scripts` → 0.
- Every §4 pattern used on ≥ 1 non-gallery surface: `HonestExpectationsCard, SeverityBadge, CaseStateBadge, EvidenceStatusBadge, DeadlineChip, EmptyState, VerifiedStamp*, LocalFirstBadge, CopyButton, Stepper, PoaSection, BeforeYouSubmitChecklist` (*VerifiedStamp is Wave D — report as "gallery only" unless Task 10 ran).
- `/dashboard` reachable from the header after sign-in; unauthenticated `POST /api/interview` = 401 JSON; no-pass = 403 JSON; a fresh browser on `/case` is asked to **create** a passphrase, and after reload is asked to **enter** it.
- Handoff evidence log has one row per Accept line in Tasks 0–9.

---

## 6. AFTER THE WAVE (surface, do not perform)

Deploy the Vercel preview; run the 8 post-deploy smoke tests in `docs/DEPLOYMENT.md`; verify zero cross-host redirects; founder signs off light+dark screenshots at 375/768/1280; founder rotates the dev seed user; founder ratifies AM-16/17/18; consultant (B-16) reviews the novelty and expectations copy.

## 7. FOUNDER-GATED (never do these yourself)

`FOUNDER_NOTE` stays `null`. No changes under `Planning/07-REFERENCE/`. No Paddle/Polar/Wise/CWS/domain account work. No Agent Policy text authoring (B-08). No consultant copy. No Wave D without "go".

---

## Appendix A — verified line references at `9e4bfb5` (re-grep before editing)

| File | Line(s) | What |
|---|---|---|
| `src/components/InterviewFlow.tsx` | ~164 | `initWithPassphrase("default-default")` |
| `src/components/InterviewFlow.tsx` | ~144, ~381 | `whyHintDismissed`, `dismissWhyHint` unused |
| `src/components/InterviewFlow.tsx` | ~602–606 | `lg:hidden`, `role="status"` on the sticky bar |
| `src/components/InterviewFlow.tsx` | ~735 | "File upload is simulated in this build" |
| `src/components/DashboardClient.tsx` | ~200 | `attemptCount: caseFile.attemptCount + 1` |
| `src/components/DashboardClient.tsx` | ~347–357 | DeadlineChip with notice date as `dueAt` |
| `src/components/DashboardClient.tsx` | ~385 | `expCopy === "" && isNoveltyRequired` |
| `src/components/DashboardClient.tsx` | ~262–298 | raw `<input>` unlock UI (2nd copy) |
| `src/components/ComposeView.tsx` | ~86 | `searchParams?.get("caseFile")` |
| `src/components/ComposeView.tsx` | ~153 | dead `handleCopy` |
| `src/components/ComposeView.tsx` | ~252–261 | checklist fed `evidenceSlots: {}` / `actionItems: []` / edited-only text |
| `src/components/ComposeView.tsx` | ~272 | `HonestExpectationsCard` with `noPassCard` copy |
| `src/components/PoaSection.tsx` | ~30–41 | substring matching of findings to sections |
| `src/components/BeforeYouSubmitChecklist.tsx` | ~60, ~106 | "Amazon requires…", hardcoded Seller Central URL |
| `src/components/VaultView.tsx` | ~204–209 | `vault.add` without `evidenceKind` |
| `src/components/VaultView.tsx` | ~301–360 | raw `<input>` passphrase forms (3rd copy) |
| `src/components/VaultView.tsx` | ~422–430 | icon-only buttons without names |
| `src/components/VaultView.tsx` | ~506–509 | "Preview fingerprint" debug line |
| `src/components/AuthCard.tsx` | ~28 | `max-w-md` |
| `src/app/(app)/reset-password/page.tsx` | ~112, ~132 | "Cancel" literal; success → `/case` |
| `src/app/(app)/forgot-password/page.tsx` | ~23 | signed-in redirect → `/` |
| `src/app/(app)/dashboard/page.tsx` | ~19 | dead `if (!user) notFound()` |
| `src/app/api/analyze-reply/route.ts` | — | no `isLicenseActive` |
| `src/components/AppBreadcrumb.tsx` | ~30 | Home → `/` inside the app |
| `src/middleware.ts` | `MARKETING_PATHS` | lacks `/faq` |
| `lighthouserc.cjs` | `url[]` | lacks `/faq` |
| `e2e/a11y.spec.ts` | 8, 14, 20, 30 | `impact === "critical"` only |
| `AGENTS.md` | ~44, ~52 | committed password; stale "no /app route yet" |
| `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` | AA-28, AA-29 | unticked |

## Appendix B — statements in `08-WAVE-C-HANDOFF.md` that are false (correct them in Task 9)

- "Dead files deleted (old AppShell, SignOutButton redirect to `/app/login`, EvidenceSlotPanel …)" — the deleted files were `PageShell.tsx`, `SiteHeader.tsx`, `content/errors.ts`, `(app)/page.tsx`.
- "SHARED export removed from `src/content/shared.ts`" — it was removed from `content/marketing.ts`; `shared.ts` correctly still exports `SHARED`.
- "`severityGated: isSeverityGated(...)` flag passed to response analyzer" — it is in `api/decode`, not the analyzer.
- "`saveCaseLog` on `saveAndExit` — persists current step + answer" — save-and-exit saves only the case file.
- "`PoaFindingsList.tsx`" — it lives inside `PoaSection.tsx`.
- "BeforeYouSubmitChecklist — `computeReadiness()`" — the component never called it.
- "`e2e/a11y.spec.ts`: 6 tests" — 7, and 3 of them failed when run.
- "Pending: Wave D (extension build)" — Wave D is optional post-launch polish (spec §13); the extension is M-7/M-8.
- "Validation … all green" — Playwright was not run; 4 of 22 tests failed.

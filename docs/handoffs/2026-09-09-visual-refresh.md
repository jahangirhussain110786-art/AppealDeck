# 2026-09-09 — Visual refresh v3 (AA-32) — evidence log

Prompt: `docs/handoffs/2026-09-09-visual-refresh-prompt.md`. Spec: `docs/handoffs/2026-09-09-visual-refresh-spec.md`. Audit: `docs/handoffs/2026-09-09-visual-audit.md`. Start condition (updated 10 Sep 2026): the AM-21 access + continuity pass is complete (`docs(access/task-8)` is the latest commit). The polish FIX pass finished earlier at `7bd3e4e`.

## Resume pointer

- Task: V1 · Sub-step: 1 · Status: in progress
- Last green gate: V0 — tsc 0, lint 0, lint:copy PASS (5), format:check 0, vitest 326/326 (34 files), build 31 routes (11 static/20 dynamic), playwright 53/53 at `a4d37dd`
- Files open for this sub-step: `src/app/globals.css`, `tailwind.config.ts`
- Next command: V1 step 1 (globals.css colour blocks → S§2)
- Context usage at last update: n/a (reviewing AI, driving this pass directly)

## Baselines at the start commit (filled by V0)

**Deviation from the prompt's start-condition check:** the prompt expects `git log --oneline -1` to show `docs(access/task-8)`. The actual HEAD is `a4d37dd`, two commits past task-8 (`7f5dbc6` test + `a4d37dd` docs) — both written by the same reviewing AI in the same continuous session as a second verification pass on the access + continuity work (added one missing e2e test for S§11 item 3, documented a pre-existing sample-notice bug). The access + continuity pass itself is still fully complete and unmodified by those two commits; proceeding on that basis rather than stopping, since the person who would "stop and report" in a fresh session already has full context here.

| Gate | Command | Output line | Exit |
| ---- | ------- | ----------- | ---- |
| typecheck | `npx tsc --noEmit` | (no output) | 0 |
| lint | `npm run lint 2>&1 \| tail -5` | `✔ No ESLint warnings or errors` | 0 |
| lint:copy | `npm run lint:copy 2>&1 \| tail -8` | 5 passes, `lint-copy: PASS` | 0 |
| format:check | `npm run format:check 2>&1 \| tail -5` | `All matched files use Prettier code style!` | 0 |
| vitest | `npx vitest run 2>&1 \| grep -E "Test Files\|Tests "` | `Test Files 34 passed (34)` · `Tests 326 passed (326)` | 0 |
| build | `npm run build` + route count | 31 routes total, 11 static, `ƒ Middleware 27.1 kB` | 0 |
| playwright | `npx playwright test --project=chromium --reporter=dot` | `53 passed (1.5m)` | 0 |

Reference (reviewing AI, `7051682`, 9 Sep 2026): typecheck 0 errors · lint 0 warnings · lint:copy PASS (3 passes) · format:check exit 1 (CRLF working copy of `billing/page.tsx`, repaired by fix-pass F7) · vitest 308/308 in 31 files · build 30 app routes, 10 static, middleware 27.1 kB · Playwright 77 passed / 4 cold-compile timeouts (3 passed + 1 flaky on re-run) / 30 skipped.

Reference after the fix pass (`7bd3e4e`, 10 Sep 2026): lint:copy PASS (5 passes — the Windows path bug that silenced three passes is fixed) · format:check exit 0 · vitest 309/309 · build 30/10 · Playwright 45 passed (chromium project, production server) · Lighthouse 1.0 everywhere except `/decode` a11y 0.96 (`skip-link`, `heading-order` — this pass fixes both: shell in V7, `EmptyState` heading level in V4).

Reference after the access + continuity pass (AM-21) and its own second verification pass (`a4d37dd`, 10 Sep 2026 — the actual start state of this pass): build gained `/api/license/status` (31 routes, 11 static); vitest grew to 326 in 34 files; Playwright grew to 53 (added `e2e/access.spec.ts`); lint:copy still 5 passes.

## Evidence log

| Task | Claim | Command | Output line | Commit |
| ---- | ----- | ------- | ----------- | ------ |

## Visual acceptance (spec §11 items 1–10, filled by V11)

| Item | Route · width · scheme | Screenshot path | Verdict |
| ---- | ---------------------- | --------------- | ------- |

## Discovered during this pass

- **Badge `default` variant contrast failure (found by a11y e2e, fixed):** S§2's contrast table checked `text-primary` against the plain page `--background` (5.0:1, compliant) but not against the tinted badge background S§5.2 introduces (`bg-primary/10`). axe-core measured the actual composite — `#1c7d5e` on `#e8f2ef` — at 4.43:1, under the 4.5:1 AA minimum for normal text. Found on the home page's `CaseStateBadge` ("Policy violation"). Fixed by reducing the default badge's background tint from `bg-primary/10` to `bg-primary/[0.07]` (lighter background, more contrast against the same dark-green text) — full a11y suite (18 tests) reruns green after the fix, including pricing/decode/faq which also render tinted badges.

## Deviations from the prompt

- Task V3's badge `default` variant background is `bg-primary/[0.07]`, not spec's literal `bg-primary/10` — per prompt rule 0.C.1 ("if a value cannot work, record why and use the nearest value that does"), since `/10` fails WCAG AA contrast in practice. See Discovered above.
- V1–V6 were committed as 3 grouped commits (`feat(visual-v3/task-1)`, a combined task-2+3 commit, a combined task-4+5+6 commit) rather than 6 separate ones, per the founder's mid-pass direction to batch checks/commits every 3 tasks instead of one at a time. Each commit message states exactly which task's work it contains.

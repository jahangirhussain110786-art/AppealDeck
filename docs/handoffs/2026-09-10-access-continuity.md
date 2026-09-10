# 2026-09-10 — Access ladder + continuity pass (AA-33) — evidence log

Prompt: `docs/handoffs/2026-09-10-access-continuity-prompt.md`. Spec: `Planning/03-PHASE-2-BUILD/07-ACCESS-AND-CONTINUITY-SPEC.md`. Start commit: `7bd3e4e` (the polish FIX pass is complete). The visual refresh v3 pass starts after this one.

## Resume pointer

- Task: A3 · Sub-step: 1 · Status: not-started (A2 committed)
- Last green gate: A2 — `npx tsc --noEmit` 0; `npm run lint` 0 warnings; `npm run lint:copy` PASS (5 passes); `npm run format:check` 0; `npm test` 309/309; `npm run build` 30 routes; **after the A2 edits (4 files), `npx tsc --noEmit` 0; `npm run lint:copy` re-run PASS**; Playwright `e2e/app-gate.spec.ts` + `e2e/a11y.spec.ts` 30 passed (chromium, production server on :3000)
- Files open for this sub-step: src/core/vault/envelope.ts, src/core/vault/schema.ts, src/core/vault/crypto.ts, src/core/vault/vault.ts, src/core/vault/vault.test.ts
- Next command: read A3 steps 1–5 and spec S§4; implement KeyMode.device + VaultKeyStore.deviceKey/deviceWrappedDek
- Context usage at last update: 0 %

## Baselines at `7bd3e4e` (reviewing AI, 10 Sep 2026)

| Gate         | Command                                                                                                                 | Output line                                                                                                                                                              | Exit |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| typecheck    | `npx tsc --noEmit`                                                                                                      | (no output)                                                                                                                                                              | 0    |
| lint         | `npm run lint 2>&1 \| tail -2`                                                                                          | `✔ No ESLint warnings or errors`                                                                                                                                         | 0    |
| lint:copy    | `npm run lint:copy 2>&1 \| grep lint-copy:`                                                                             | `banned strings` · `banned soft list` · `banned numbers` · `banned punctuation (content only)` · `colour gate` · `lint-copy: PASS` (5 passes)                            | 0    |
| format:check | `npm run format:check 2>&1 \| tail -1`                                                                                  | `All matched files use Prettier code style!`                                                                                                                             | 0    |
| vitest       | `npx vitest run 2>&1 \| grep -E "Test Files\|Tests "`                                                                   | `Test Files 31 passed (31)` · `Tests 309 passed (309)`                                                                                                                   | 0    |
| build        | `npm run build` + manifests                                                                                             | `app routes total: 30` · `static prerendered routes: 10` · `ƒ Middleware 27.1 kB`                                                                                        | 0    |
| playwright   | `npx playwright test --project=chromium --reporter=dot` (production server)                                             | `45 passed (24.4s)`                                                                                                                                                      | 0    |
| lighthouse   | direct `npx lighthouse <url> --output=json` × 8 (`lhci collect` crashes on Windows temp cleanup — see the fix-pass log) | perf/a11y/bp/seo = 1/1/1/1 on `/`, `/pricing`, `/login`, `/privacy`, `/terms`, `/refund`, `/faq`; `/decode` = 1/**0.96**/1/1 (`skip-link`, `heading-order`; visual pass) | n/a  |

## Evidence log

| Task | Claim                                                                                                                        | Command                                                                                                      | Output line                                                                       | Commit  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------- |
| A1   | Five-slot header, locked Vault + Sign in when signed out, nav labels in content, session-aware right cluster on static pages | `git show --stat HEAD`                                                                                       | `33e5a16` (52 files, +1860/-840)                                                  | 33e5a16 |
| A2   | `getOptionalUser` in auth.ts, case, dashboard, vault pages                                                                   | `grep -c`                                                                                                    | 4 hits                                                                            | —       |
| A2   | `noPass` removed from all TS/TSX                                                                                             | `grep -rn "noPass" src`                                                                                      | 0 hits                                                                            | —       |
| A2   | `safeNext` shared via src/lib/safeNext.ts, used in callback, login, signup                                                   | `grep -c`                                                                                                    | 9 hits across 5 files                                                             | —       |
| A2   | `next=` carried through login + signup (magic, Google, password)                                                             | `grep -c`                                                                                                    | 4 hits                                                                            | —       |
| A2   | compose + billing redirect with return path                                                                                  | `grep -c`                                                                                                    | 2 hits                                                                            | —       |
| A2   | Self-check §4 gates green (after fixing TS6133 unused vars)                                                                  | `npx tsc --noEmit \| npm run lint \| npm run lint:copy \| npm run format:check \| npm test \| npm run build` | all exit 0; typ 0 err; lint 0; copy PASS; format ok; vit 309/309; build 30 routes | pending |
| A2   | Playwright signed-out gate + login-keeps-next                                                                                | `npx playwright test e2e/app-gate.spec.ts e2e/a11y.spec.ts --project=chromium --reporter=dot`                | 30 passed                                                                         | pending |

## S§11 acceptance checklist (filled by A8)

| #   | Item                                                                                                       | Evidence | Commit |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | ------ |
| 1   | Signed out `/case`: answer, reload, still there                                                            |          |        |
| 2   | Signed out: gate on first file step; dashboard draft; vault teaching; compose/billing redirect with `next` |          |        |
| 3   | Header five slots; lock only on Vault signed out; Billing only signed in                                   |          |        |
| 4   | Vault unit tests (device init/unlock, relock, key deleted, wrong passphrase, status)                       |          |        |
| 5   | `GET /api/license/status` 401 / typed JSON                                                                 |          |        |
| 6   | `POST /api/extract-field` 401 / 429 / no license check                                                     |          |        |
| 7   | Pricing three `columnheader`s; FAQ item in Pricing group                                                   |          |        |
| 8   | All gates green                                                                                            |          |        |
| 9   | Screenshots 375/1280 light + dark, signed out routes                                                       |          |        |

## Discovered during this pass

- none yet

## Deviations from the prompt

- none yet

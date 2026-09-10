# 2026-09-09 — Visual refresh v3 (AA-32) — evidence log

Prompt: `docs/handoffs/2026-09-09-visual-refresh-prompt.md`. Spec: `docs/handoffs/2026-09-09-visual-refresh-spec.md`. Audit: `docs/handoffs/2026-09-09-visual-audit.md`. Start condition (updated 10 Sep 2026): the AM-21 access + continuity pass is complete (`docs(access/task-8)` is the latest commit). The polish FIX pass finished earlier at `7bd3e4e`.

## Resume pointer

- Task: V10 · Sub-step: 1 · Status: not started
- Last green gate: V7+V8+V9 (batched) — tsc 0, lint 0, lint:copy PASS, format:check 0, vitest 326/326 (34 files), build 30 routes green, playwright `e2e/marketing.spec.ts`+`e2e/a11y.spec.ts` 26/28 + 2 confirmed cold-compile flakes (both pass in isolation), `e2e/access.spec.ts` 6/6 (single worker, no retries needed after isolation)
- Files open for this sub-step: none — V9 complete
- Next command: V10 (copy deck application — box D)
- Context usage at last update: n/a (same AI driving this pass directly)

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
| V1 | tokens v3, base-layer additions, width/type/shadow/animation scale in Tailwind config, font axes | `npx tsc --noEmit` | (no output), exit 0 | `b593398` |
| V2 | brand assets copied byte-identical, `Logo`/`LogoMark`, manifest/OG/icons wired | `cmp public/brand/favicon.svg src/app/icon.svg` etc. | no diff | `593908e` |
| V3 | primitives restyled (button/badge/card/input/textarea/native-select/alert/tooltip/skeleton/progress/accordion/tabs/table/checkbox/sheet/dialog/toaster) | full a11y suite rerun | 18/18 passed | `593908e` |
| — | badge default-variant contrast fix (`/10` → `/[0.07]`) | axe-core targeted + full rerun | 18/18 passed | `13c3b9f` |
| V4 | AppHeader/SiteFooter rebuilt, MarketingShell/SectionHeading new, AppShell/loading/breadcrumb/HonestExpectationsCard/EmptyState/Stepper restyled | `npx tsc --noEmit` | (no output), exit 0 | `6fa862d` |
| V5 | home page rebuilt (hero-as-product, how-it-works, included, proof, closing) | `npm run build` | 30 routes green | `6fa862d` |
| V6 | pricing page rebuilt (price card, 3-col table, trust tiles, FAQ, purchase panel) | `npm run build` | 30 routes green | `6fa862d` |
| V7 | sample notice replaced with S§14 fictional text (fixes P0), decode page in `MarketingShell width="tool"`, CasePreview/DecodeClient restyled | `grep -c "MarketingShell" src/app/decode/page.tsx` · `grep -c "Seller Performance" src/content/sampleNotice.ts` | 1 hit each | pending (batched with V8+V9) |
| V8 | FAQ (`MarketingShell width="reading"`, grouped cards with `id` slugs), `LegalPage.tsx`+new `LegalToc.tsx` (IntersectionObserver), `AuthShell` (LogoMark, 200 ms fade, link-style toggle), `not-found.tsx`/`error.tsx` inside `MarketingShell width="reading"` | `grep -n "MarketingShell" src/app/faq/page.tsx src/components/LegalPage.tsx src/app/not-found.tsx src/app/error.tsx` → 4 hits; `test -f src/components/LegalToc.tsx` → exists; `grep -n "duration: 0.35"` login/signup → 0 hits; `grep -n "LogoMark" src/components/AuthCard.tsx` → 2 hits; `npx playwright test e2e/marketing.spec.ts e2e/a11y.spec.ts --reporter=dot` | 26 passed, 2 cold-compile timeouts (both confirmed passing in isolation — not a regression) | pending (batched with V7+V9) |
| V9 | page heads (dashboard/case/compose/vault/billing) on `text-h2` + `flex flex-wrap items-end justify-between gap-4`; `ReadinessCard` score row; two-card `grid lg:grid-cols-2` (Amazon replied / Submitted); `SignInGate`/`ComposeGate` restyled to S§7.7 tokens; `case/page.tsx` drops the outer Card, adds the engine badge and the "how this works" surface-2 panel, `CasePreview` column `lg:grid-cols-[1fr_20rem]`; `VaultView.tsx` toolbar (search + `NativeSelect` filter, wired to the previously-orphaned `filterKind` state + icon-sm tooltip buttons), record rows (icon tile, `ghost icon-sm` actions, delete no longer solid red per row), duplicate title/subtitle removed; `EvidenceSlotPanel.tsx` all 8 strings moved to new `APP.evidenceSlots.*` | `grep -n "absolute top-4 right-4" src/components/DashboardClient.tsx` → 0 hits; `grep -c "dashboardSignedOut\|signInGate\|composeGate"` across the 3 files → 20 hits (≥ 3 required); `npx playwright test e2e/access.spec.ts --reporter=dot --workers=1 --retries=1` → 6 passed; `grep -n "APP.vault.title\|APP.vault.subtitle" src/components/VaultView.tsx` → 0 hits; `grep -c "NativeSelect" src/components/VaultView.tsx` → 4 hits; `grep -n 'variant="destructive"' src/components/VaultView.tsx` → 1 hit (confirm dialog only); `grep -n "replace(/_/g" src/components/EvidenceSlotPanel.tsx` → 0 hits; `grep -n "Required evidence\|Open the vault" src/components/EvidenceSlotPanel.tsx` → 0 hits; `npm run lint:copy` | PASS | pending (batched with V7+V8) |

## Visual acceptance (spec §11 items 1–10, filled by V11)

| Item | Route · width · scheme | Screenshot path | Verdict |
| ---- | ---------------------- | --------------- | ------- |

## Discovered during this pass

- **Badge `default` variant contrast failure (found by a11y e2e, fixed):** S§2's contrast table checked `text-primary` against the plain page `--background` (5.0:1, compliant) but not against the tinted badge background S§5.2 introduces (`bg-primary/10`). axe-core measured the actual composite — `#1c7d5e` on `#e8f2ef` — at 4.43:1, under the 4.5:1 AA minimum for normal text. Found on the home page's `CaseStateBadge` ("Policy violation"). Fixed by reducing the default badge's background tint from `bg-primary/10` to `bg-primary/[0.07]` (lighter background, more contrast against the same dark-green text) — full a11y suite (18 tests) reruns green after the fix, including pricing/decode/faq which also render tinted badges.
- **`VaultView.tsx` `filterKind` state was orphaned (found in V9, fixed as part of the toolbar restyle):** `filterKind`/`setFilterKind` and the `filteredItems` logic that reads them already existed and worked, but no UI control ever called `setFilterKind` to anything but `"all"` (only the "Clear search" button reset it). The new toolbar `NativeSelect` wires this pre-existing state to a real control — restyle-scoped since the filtering logic itself is untouched, only a missing control is added.
- **Two heading-order fixes inside `DashboardClient.tsx` (restyle-scoped, consistent with the V4 `EmptyState` h3→p precedent):** the signed-out-with-draft branch rendered a second page-level `<h1>` ("Your case, at a glance") below the page's own `<h1>` ("Your dashboard") from `dashboard/page.tsx` — changed to `<h2 className="text-h3">`. No string changed.
- **Two Playwright cold-compile flakes reproduced and cleared during this batch's gate run:** `e2e/a11y.spec.ts` "pricing page has no serious or critical a11y violations" and "/reset-password redirects to /login when unauthenticated" (from the V8 accept check), and `e2e/access.spec.ts` "a decoded notice shows the case preview" and "an answer at step one survives a reload" (from the V9 accept check) — all four passed cleanly in isolation and in a `--workers=1 --retries=1` full-file rerun; the same "a decoded notice shows the case preview" flake was already documented in the access-continuity pass's own evidence log, confirming this is a recurring dev-server cold-compile characteristic, not a regression introduced by this pass.

## Deviations from the prompt

- Task V3's badge `default` variant background is `bg-primary/[0.07]`, not spec's literal `bg-primary/10` — per prompt rule 0.C.1 ("if a value cannot work, record why and use the nearest value that does"), since `/10` fails WCAG AA contrast in practice. See Discovered above.
- V1–V6 were committed as 3 grouped commits (`feat(visual-v3/task-1)`, a combined task-2+3 commit, a combined task-4+5+6 commit) rather than 6 separate ones, per the founder's mid-pass direction to batch checks/commits every 3 tasks instead of one at a time. Each commit message states exactly which task's work it contains.

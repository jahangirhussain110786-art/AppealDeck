# Visual overhaul v4 (AM-22) — evidence log

Baseline: commit `1e4dd05` (handoff committed + session-start repointed). All gates green on the founder-issues fix pass as of `1e4dd05`: tsc 0 · lint 0 · lint:copy PASS · format:check 0 · vitest 373/373 (39 files) · build 33 routes + middleware (see Discovered/Deviations — prior evidence logs said 32; a fresh count at V0 found 33, unrelated to this pass's own changes).

## Resume pointer

Task: V4 · Status: completed · Last green gate: all gates green (batched commit, see below) · Next: V5 (Decode result layout rebuild)

**Founder direction 12 Sep 2026 (batching, mid-pass):** commit at least 3-4 tasks per commit rather than one-per-task; run gates once at the end of a batch, not after every task. V1–V4 (+ V3b) below were built as one batch under this direction.

## Task V0 — Paperwork (formal prompt + evidence log + DECISIONS.md + session-start repoint)

Commit: `533dc84`

**Commands run & output:**

```
git status --short  → 5 files (3 modified, 2 new)
npm run typecheck   → exit 0
npm run lint        → 0 warnings
npm run lint:copy   → PASS
npm run format:check → exit 0
npm run test        → 373 passed (39 files)
npm run build       → 33 routes + middleware
git ls-files --eol  → all w/lf, no CRLF
```

**Changes made:**

- Created `docs/handoffs/2026-09-11-visual-overhaul-v4-prompt.md` — formal AM-22 task prompt (§0 protocol, §0.A key files, §1–§3 tasks V0–V8 with Do/Accept/commit blocks, §4 self-check, §5 final gates, §7 founder-gated, Appendix A)
- Created this evidence log
- Added AM-22 entry to `docs/DECISIONS.md`
- Added the AM-22/AA-35 section to `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (bumped DoD to AA-01…AA-35) — the amendments file was missed in the first pass at this task; corrected in a follow-up review (see Discovered/Deviations)
- Updated `docs/handoffs/SESSION-START-PROMPT.md` (PATH lines, current-pass paragraph, history bullet)

## Task V1 — Tokens — DONE 12 Sep 2026

Color reconciliation adopted in full (founder-confirmed): light-mode `--background`/`--foreground`/`--muted-foreground`/`--border`/`--muted`/`--surface-2`/`--input`/`--shadow` converted from the mockup's approved hex via exact hex→HSL (computed with a script, not eyeballed — `#FBFBFA`→`60 11% 98%`, `#14201C`→`160 23% 10%`, `#4B5A54`→`156 9% 32%`, `#EDEDEA`→`60 8% 92%`). `--primary`/`--brand`/`--accent`/`--warning`/`--success`/`--info`/`--destructive` left unchanged (out of scope; `--primary` already matched `#1C7D5E` to within 1%). Dark mode: the mockup gave no separate dark-neutral palette (only the vault obsidian exploration, not shipped — see V6), so dark neutrals were hue-rotated from the old cool 220–224° family into the same warm 60–165° family, keeping the app's already-tuned lightness/saturation (documented as an inference in `globals.css`, not silently assumed). Radius: `--radius-lg` 14px→13px; new `--radius-row: 1rem` (16px) token + `rounded-row` Tailwind class for row/pill-adjacent components. Newsreader accent font added (`src/lib/fonts.ts` `fontAccent`, wired into `layout.tsx` and `tailwind.config.ts` `fontFamily.accent`), plus `<AccentWord>` (`src/components/ui/accent-word.tsx`).

## Task V2 — Primitives — DONE 12 Sep 2026

`Badge` size variants corrected to pixel-exact mockup values (default 12.5px/12×5px padding, `sm` 11px/10×3px — previously approximate). Aurora/dot-grid hero background: `.marketing-surface-aurora` in `globals.css` (dot-grid mask + two blurred radial blobs, `pointer-events: none`, static/no animation). Illustrations library: `src/components/illustrations/{ShieldCheckIllustration,VaultDoorIllustration,MagnifierDocumentIllustration}.tsx`, all theme-aware via `hsl(var(--...))`/Tailwind classes, no raw hex. Added to `DevUiGallery.tsx` (light + dark) alongside an `<AccentWord>` + Badge-size demo section.

## Task V3 — Home page rebuild — DONE 12 Sep 2026

Most of this already existed from the visual-refresh-v3 pass (`HeroArtifact.tsx` is already the mockup's "decoded notice" panel, using real `Deadline`/`guidanceFor` data, not hardcoded — confirmed by reading it, not assumed). Added: `<AccentWord>` around "today." in the hero headline (`src/lib/splitAccent.ts` — a small, safe string-split helper that degrades to plain text if the copy ever changes and no longer contains the accent phrase); `.marketing-surface-aurora` applied to the hero section only. **Accept-block correction:** the original V3 Accept block expected `grep -n "deadlinesModel" src/app/page.tsx` — that data actually lives in `HeroArtifact.tsx` (imported into `page.tsx`, not inlined), so the check now targets the right file; not a defect, a wrong assumption in the original task text.

## Task V3b — Auth pages (login/signup) rebuild — DONE 12 Sep 2026 (added this session, founder direction)

`AuthShell` (`src/components/AuthCard.tsx`, shared by login/signup/forgot-password/reset-password) rebuilt as a split-screen: the existing auth form unchanged, a new right-side `AuthPreviewPanel` — a framed browser-chrome mock of the signed-in dashboard using sample fixture data, explicitly captioned "A preview with sample data — your dashboard, once signed in, shows your own case" (D6 honesty requirement, not decoration; copy lives in `src/content/auth.ts` under `AUTH.preview`). This answers the founder's "should we use real screenshots, like Apollo?" question — real screenshots at concrete moments (this one; the home hero once V3/V6 rebuild those pages for real), not stock photography (unchanged rejection from the handoff). Since the real app doesn't carry the new visual language yet, there's nothing genuine to screenshot today — this frame/chrome pattern is what a later pass swaps real screenshots into.

## Task V4 — Guided interview layout rebuild — DONE 12 Sep 2026, adapted from the literal plan (see the prompt's V4 section for the two real findings: `Stepper` reused instead of a new `StepRail`; 2 columns not 3, because `/case`'s own page already reserves a sidebar for `CasePreview` and `main` caps at `max-w-app` regardless of viewport)

**A real bug found and fixed before this was accepted:** the first implementation used a literal 3-column split (rail | question | why-panel) copying the mockup's proportions directly. Verified live in a browser at Playwright's actual 1280×720 default viewport (not assumed from code) that this starved the question card to **168px wide** — confirmed via `getBoundingClientRect()` on the actual rendered grid, not guessed — because `/case`'s own layout already reserves 20rem for its sidebar. Screenshotted the broken state, root-caused it, and rebuilt as 2 columns (rail | question) with the why-we-ask panel as a full-width persistent block under the question instead of a starved 3rd column. Verified the fix the same way (both screenshot and `getBoundingClientRect`).

**Also found and fixed, unrelated to this pass's own changes:** `e2e/access.spec.ts`'s "reaching the first document step shows the sign-in gate" test was stale against the engine — a real *optional* "Preventing this from happening again" step (added by the Task 1 founder-issues-fix pass, `6436aba`) sits between "Prior appeals" and the first file/evidence step, and the test's click sequence never accounted for it. Root-caused via the failure's own DOM snapshot (`error-context.md`), not guessed. Fixed the test to answer that step. Separately, `e2e/marketing.spec.ts`'s `/signup` test used `getByLabel(/password/i)`, ambiguous since `PasswordInput`'s show/hide toggle button's `aria-label` also contains "password" (Task 2, `ed44480`, unrelated to this pass) — fixed to `getByRole("textbox", ...)`.

## Task V5 — Decode result layout rebuild

Status: not started

## Task V6 — Vault surface rebuild

Status: not started · Blocked on founder vault-theme-override decision

## Task V7 — Sweep pass

Status: not started

## Task V8 — Final gates + screenshots

Status: not started

## Discovered / Deviations

- Route count: this pass's own prompt/evidence text (and the prior founder-fixes pass's evidence) said "32 routes" as the build baseline. A fresh `npm run build` at V0 shows **33 routes** — this repo has been at 33 for a while (no code changed in V0, so this is a pre-existing miscount carried forward across passes, not a regression introduced here). Corrected in both this log and the V0–V8 Accept blocks in the task prompt; a fresh session should treat 33 as the true "no change" baseline for V1–V7 and only flag a real discrepancy if the count moves away from 33.
- Path/casing fix: the task prompt originally referenced the dev gallery as `src/components/DevUIGallery.tsx` (6 places) — the real file is `src/app/dev/ui/DevUiGallery.tsx` (different directory, different casing). Corrected in the prompt; would have broken the V2/V4/V6 Accept-block greps and, on Vercel's case-sensitive filesystem, risked a coding AI creating a stray duplicate file.
- Accept-grep fix: V1's Accept block grepped for the string `"220 32% 11%"`, which never existed in `globals.css` under either code path (the real light-mode foreground is `224 32% 11%`, matching §1.5). The check was dead — it could never fail. Corrected to `"224 32% 11%"`.
- **V6 founder-gate reversed mid-implementation:** the handoff/prompt's default reading was "founder confirms warm-neutral + vault obsidian override, both adopted wholesale." The founder's first message did read that way ("the super best appearance as we designed into the mockup files"), but a follow-up message specifically corrected the vault reading before V6 started: the vault respects the site theme, no override. Recorded in Founder sign-off above; V6's task text in the prompt corrected to match before that task starts.
- **A real 3-column-grid width bug (V4), found and fixed before acceptance** — see the V4 section above for detail. Caught by actually rendering the page in a browser at the real target viewport and measuring `getBoundingClientRect()`, not by reading the JSX and assuming it was correct.
- **Two pre-existing e2e gaps, unrelated to this pass, found and fixed while verifying V4** — see the V4 section above (`access.spec.ts` missing the newer optional preventive-measures step; `marketing.spec.ts` signup password-label ambiguity from the Task 2 `PasswordInput` toggle button).
- `Badge`'s `size="sm"` variant already existed (from an earlier pass) — V2 refined its pixel values to match the mockup exactly rather than building a parallel system.
- `HeroArtifact.tsx` (V3's "decoded notice" panel) already existed and already used real `Deadline` data — V3's actual new work was smaller than the original task text assumed (just the accent word and the aurora background).
- `Stepper.tsx` (V4's "rail") already existed and already implemented a numbered-circle vertical rail with connecting lines — no new `StepRail` component was built; reusing it avoided a duplicate system.

## Gates at the end of this batch (V1–V4 + V3b)

```
npm run typecheck    → exit 0
npm run lint         → 0 warnings
npm run lint:copy    → PASS (5 passes)
npm run format:check → exit 0
npm run test         → 373 passed (39 files) — no regressions
npm run build        → 33 routes + middleware (clean rebuild after clearing .next —
                        a stale .next from a concurrent `next dev` instance produced a
                        false ENOENT build failure first; documented, not a code defect)
npx playwright test  → 53/54 passed, 1 flaky under full-suite parallelism (the
                        "step one survives a reload" test), confirmed passing in
                        isolation twice — matches this project's own documented
                        cold-compile/parallelism flake pattern, not a regression
```

## Founder sign-off

**Confirmed 12 Sep 2026, in chat:** "I approve the super best appearance as we designed into the mockup files" — then, on the vault question specifically, the founder corrected the default reading: *"let the vault support the light and dark both variants with the theme and look we just selected for entire webapp."*

1. **V1 color reconciliation:** ADOPT the mockup's warm-neutral palette (`#FBFBFA`/`#14201C`/`#EDEDEA`) as designed.
2. **V6 vault theme: REVERSED from the handoff's default reading.** `/vault` does **not** get a permanent dark "obsidian" override — it follows the site-wide `next-themes` light/dark toggle exactly like every other page, using the same reconciled warm-neutral tokens from V1. `Vault.dc.html`'s obsidian surface stays what it always was — one inspiration direction among the mockup's explorations — not the shipped behavior. The vault's own accent identity (the mint `#4FDBA6`-toned vault-door illustration, `font-mono` filenames) carries over as styling, not as a theme override.

Both founder-gates are now CLEARED. Proceeding to implementation, Tasks V1–V8 + V3b, in order.

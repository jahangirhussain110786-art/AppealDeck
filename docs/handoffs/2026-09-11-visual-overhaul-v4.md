# Visual overhaul v4 (AM-22) — evidence log

Baseline: commit `1e4dd05` (handoff committed + session-start repointed). All gates green on the founder-issues fix pass as of `1e4dd05`: tsc 0 · lint 0 · lint:copy PASS · format:check 0 · vitest 373/373 (39 files) · build 33 routes + middleware (see Discovered/Deviations — prior evidence logs said 32; a fresh count at V0 found 33, unrelated to this pass's own changes).

## Resume pointer

Task: V0 · Status: completed · Last green gate: all gates green at commit `533dc84` · Next: V1 (blocked on founder color decision)

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

## Task V1 — Tokens

Status: not started · Blocked on founder color-reconciliation decision (warm-neutral vs cooler-neutral) · Next: ask founder to confirm palette direction

## Task V2 — Primitives

Status: not started

## Task V3 — Home page rebuild

Status: not started

## Task V4 — Guided interview layout rebuild

Status: not started

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

## Founder sign-off

Pending founder confirmation on two decisions:

1. **V1 color reconciliation:** adopt warm-neutral palette (mockup) or keep current cooler-neutral tokens?
2. **V6 vault theme:** override light/dark with permanent dark obsidian surface, or respect site-wide theme?

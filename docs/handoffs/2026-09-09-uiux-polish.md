# 2026-09-09 — UI/UX polish pass (AM-19 · AA-30) — evidence log

Prompt: `docs/handoffs/2026-09-09-uiux-polish-prompt.md`. Baseline commit `ed05259`. Ratified by the founder on 9 Sep 2026 (all four banner boxes, in chat with the reviewing AI). Plain-language background: `docs/handoffs/2026-09-09-meta-ai-uiux-plain-guide.md`.

## Resume pointer

- Task: 0 · Sub-step: paperwork · Status: done (performed by the reviewing AI on 9 Sep 2026; committed `bfba421`)
- Last green gate: `npm test` 287/287 (29 files) and `npm run build` (30 app routes, 10 static prerendered, middleware 27.1 kB) at `ed05259`, before any code change
- Files open for this sub-step: none
- Next command: read prompt §0.A and Task 1, then Task 1 step 1 (add `SHARED.footer.independence` to `src/content/shared.ts`)
- Context usage at last update: n/a (reviewing AI session, not the 1M-window agent)

**Task 0 files** (all UTF-8, verified) were committed as `bfba421` on 9 Sep 2026: `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`, `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `docs/handoffs/2026-09-08-meta-ai-uiux-register.md`, `docs/handoffs/2026-09-09-meta-ai-uiux-plain-guide.md`, `docs/handoffs/2026-09-09-uiux-polish-prompt.md`, `docs/handoffs/2026-09-09-uiux-polish.md`, `docs/handoffs/SESSION-START-PROMPT.md`. `disconnected-chat!.txt` and `.claude/` were deliberately left untracked.

## Evidence log

| Task | Claim | Command | Output line | Commit |
| --- | --- | --- | --- | --- |
| 0 | vitest baseline | `npm test 2>&1 \| tail -8` | `Test Files 29 passed (29)` · `Tests 287 passed (287)` | bfba421 |
| 0 | build baseline | `npm run build 2>&1 \| tail -30`; `node -e` over `.next/prerender-manifest.json` + `.next/app-path-routes-manifest.json` | `ƒ Middleware 27.1 kB` · `static prerendered routes: 10` · `app routes total: 30` | bfba421 |
| 0 | AM-19 appended before §4 of the amendments file | `grep -n "AM-19\|^## 4. Facts" Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` | `280:### AM-19 — …` then `291:## 4. Facts in v1.0 that are RETIRED` | bfba421 |
| 0 | DoD line now counts 31 items | `grep -n "All 31 action items" Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` | `311:- [ ] All 31 action items AA-01…AA-31 checked …` | bfba421 |
| 0 | spec 06 §14 rows 23–32 present | `grep -c "^\| 2[3-9] \|^\| 3[0-2] " Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` | `10` | bfba421 |
| 0 | decisions ledger entry appended (count 13 → 14) | `grep -n "AM-19 ratified" docs/DECISIONS.md`; `grep -c "^## 20" docs/DECISIONS.md` | `134:## 2026-09-09 — AM-19 ratified: …` · `14` | bfba421 |
| 0 | edited files still UTF-8, no BOM, no UTF-16 | `head -c 2 <file> \| od -An -tx1` on the five edited files | `23 20` for every file | bfba421 |
| 0 | working tree touched only planning/docs | `git diff --stat` | `4 files changed, 37 insertions(+), 4 deletions(-)` (CLAUDE.md, amendments, spec 06, DECISIONS.md) + 3 new handoff files untracked | bfba421 |

## Discovered during this pass

- `src/content/README.md` lists `errors.ts — loading text (exists)`; `src/content/` contains no `errors.ts` (Task 10 step 4 corrects it).
- `legal/terms.md:12` reads "not a guarantee of reinstatement". The D6 `guarantee` grep covers `src/` only. Whether the legal draft should say "no promise of reinstatement" is the founder's call (prompt §7). Not changed.
- `renderPoaText` (`src/core/composer.ts:226–235`) emits `## ` headings for the API `rendered` field. Whether any UI consumes `rendered` is to be confirmed in Task 5 step 5 and recorded here.
- Git reports `LF will be replaced by CRLF` for the edited markdown files — repository `autocrlf` behaviour, pre-existing, not introduced by this pass.

## Deviations from the prompt

- Task 0 was performed by the reviewing AI in the founder's chat session on 9 Sep 2026 immediately after ratification, not by the coding agent. Its files were committed by the reviewing AI as `bfba421` with the exact message from the prompt, so the coding agent starts at Task 1.

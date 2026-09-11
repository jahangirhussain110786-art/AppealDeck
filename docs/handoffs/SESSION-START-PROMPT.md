# Session-start prompt for the coding AI (paste at the top of every new session)

**How to use.** Copy the block below into a fresh coding-AI session, unchanged. When a pass is complete and a new pass prompt exists, change only the two `PATH` lines. Keep this file in the repo; the reviewing AI updates the two paths whenever it writes a new pass prompt.

**Current pass (11 Sep 2026):** the visual refresh v3 pass (AA-32) finished at `d720bd2`/`18f1233`. The access + continuity pass (AA-33) is code-complete. A full-repo audit + fix pass the same day closed most of the AA-31 composer critic rules, the AA-21 outcome schema, and D10 analytics wiring — see `docs/handoffs/2026-09-11-full-repo-audit-guidebook.md` (the living checklist; check it before assuming something is still open) and `CLAUDE.md` §4 for the detailed log. **No dedicated task-by-task prompt exists yet for what's next** — unlike every prior pass, this repointing names a source-of-truth document, not a written prompt, because the remaining AA-31 scope (ASIN/case-ID extraction from the notice, a seller override of the decoded type, a root-cause category step, dated corrective-action UI, a character counter — see AA-31's note in `02-BUILD-PLAN-AMENDMENTS.md` for the exact list) is real M-4 feature work, not a polish pass, and deserves its own founder-reviewed prompt before a session starts implementing it. **A fresh session's first job is to write that prompt** (matching the existing prompt structure: STATUS banner, §0 rules, Appendix A anchors, one task per commit with an Accept block) once the founder confirms this is the direction — or to run whatever the founder names instead.

```text
You are the coding agent for AppealDeck. Repo root: V:\AppealDeck1, branch master, Windows machine.
Work only from the files below, in this order. Do not edit anything before step 5.

PASS PROMPT PATH: docs/handoffs/2026-09-11-full-repo-audit-guidebook.md
EVIDENCE LOG PATH: docs/handoffs/2026-09-11-full-repo-audit-guidebook.md

1. Read CLAUDE.md in full. Sections 1–3 are absolute (product, locked decisions D1–D10, FORBIDDEN SOURCES). Section 4 is the current state.
2. Read the pass prompt: only its STATUS banner, §0, §0.A, §1, §2 and Appendix A. Do not read the task sections yet.
3. Read the evidence log. Its "Resume pointer" at the top names the current task, the sub-step, the last green gate and the exact next command.
4. Run `git status --short` and `git log --oneline -15`. Check that the Resume pointer matches reality (uncommitted files, last commit, task commits so far). If they disagree, stop and tell me the difference. Do not touch anything until I answer.
5. Read only the section of the task named in the Resume pointer. Continue from its "Next command". One task = one commit, with the exact commit message written in the prompt. Every Accept line gets a row in the evidence log: command, one output line, commit hash. Update the Resume pointer after every sub-step, before every commit, and before you stop.
6. Rules that override anything else you may prefer:
   - Create and edit files only with your file-editing tool. Never through the shell: no heredocs, no `echo >`, no `Out-File`, no `Set-Content`, no scripts that write files. Shell writes have corrupted files in this repo to UTF-16.
   - In PowerShell use `Select-Object -Last N` instead of `tail`, and your search tool instead of shell `grep`.
   - Before every commit run the self-check block in the prompt (§4). No secrets in commits.
   - Presentation, copy, attributes and state feedback only. No new features, no new API routes, no engine changes beyond what the task text allows.
   - D6 is the aesthetic: no "guarantee", no percentages, hours or countdowns, no invented Amazon rules, no social proof, no exclamation marks. New user-facing strings go into src/content/*.ts, then `npm run lint:copy` must pass.
   - Never touch Planning/07-REFERENCE, FOUNDER_NOTE, or anything under the prompt's FOUNDER-GATED section. Do not do anything from the prompt's Appendix B.
   - Do not read the 8 Sep register or the plain guide unless a task points you to them. Read files in ranges, grep first. Keep chat to at most 3 lines between tool calls.
7. Stop and report instead of guessing when: a task needs text the prompt does not contain; a fix would reopen a locked decision or amendment; a gate cannot run on this machine; the code contradicts a fact stated in the prompt.
8. When you reach 50 % of your context, or when you stop for any reason: update the Resume pointer first, then tell me in five lines — task and sub-step reached, last commit hash, gate status, what is blocked, the next command.
9. If the Resume pointer says the last task is done: run the FINAL GATES block (§5), paste the results into the evidence log, tell me the pass is complete, and do not start other work.
```

## When a new pass starts

The reviewing AI writes a new pass prompt and evidence log under `docs/handoffs/` and replaces the two `PATH` lines above. Nothing else in the block changes.

## History

- 9 Sep 2026 — created for the AM-19 polish pass (`AA-30`). Task 0 of that pass was performed by the reviewing AI and committed as `bfba421`; the coding AI starts at Task 1.
- 9 Sep 2026 (evening) — repointed at the FIX pass (`docs/handoffs/2026-09-09-uiux-polish-fix-prompt.md`, log `docs/handoffs/2026-09-09-uiux-polish-fix.md`) after the audit `docs/handoffs/2026-09-09-uiux-polish-audit.md` found Tasks 7–10 failing their Accept blocks and Task 11 not done. The fix prompt adds reporting rules (§0.B): hashes only from `git log`, exit codes decide gates, shrunk tasks are written up as NOT DONE.
- 10 Sep 2026 — fix pass complete (Tasks F0–F8; code final at `12b6a89`; the reviewing AI ran F3–F8 itself after the coding AI's session ended mid-F3). Repointed at the visual refresh v3 pass (`docs/handoffs/2026-09-09-visual-refresh-prompt.md`, log `docs/handoffs/2026-09-09-visual-refresh.md`), as that prompt's banner prescribes for Task F8. The visual pass's Task V0 commits the still-untracked visual documents, brand kit and assets.
- 10 Sep 2026 (later) — the founder decided the AM-21 access ladder + continuity pass in chat and asked for it to run **before** the visual refresh. Repointed at `docs/handoffs/2026-09-10-access-continuity-prompt.md` / `docs/handoffs/2026-09-10-access-continuity.md` (Tasks A1–A8; A0 paperwork done). The visual deliverables were committed by the reviewing AI the same day and the visual prompt/spec/copy deck updated to build on AM-21; the access pass's Task A8 repoints these lines at the visual prompt again.
- 10 Sep 2026 (Task A8) — the access + continuity pass is code-complete through A7 (`33bf5b5`); an audit at A4 found and fixed several bugs that left the pass non-functional end to end (sign-in gate not gating, passphrase relock leaving a blank screen, wrong-kind case preview, `?kind=` not auto-starting, signed-out reload not resuming, and a pre-existing interview-engine loop), folded into `fix(access/task-4-fix)` (`50dbd4c`) with the required tests it had skipped. Repointed at `docs/handoffs/2026-09-09-visual-refresh-prompt.md` / `docs/handoffs/2026-09-09-visual-refresh.md` as prescribed. Founder still owes AA-34 (signed-in walk-through, sandbox checkout, screenshot sign-off) and the push-`master` decision — none of that blocks the visual pass starting.
- 10 Sep 2026 (Task V0) — a second verification pass on the access + continuity work (`7f5dbc6`, `a4d37dd`) closed one test-coverage gap and documented one pre-existing bug (sample-notice text) without changing behaviour; the visual refresh v3 pass (AM-20, ratified this session) starts from `a4d37dd` at Task V1. PATH lines unchanged (already correct from A8).
- 11 Sep 2026 — visual refresh v3 finished (`d720bd2`/`18f1233`). A full-repo audit found and fixed stale planning docs plus real code gaps (AA-31 critic rules, AA-21 outcome schema, D10 analytics) — see `docs/handoffs/2026-09-11-full-repo-audit-guidebook.md`. Repointed both PATH lines at that guidebook since no dedicated next-pass prompt exists yet; a fresh session's first job is either to write one for the remaining AA-31 feature work, or to run whatever the founder names instead.

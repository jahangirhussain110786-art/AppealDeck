# AI Session Continuity — protecting the project's real bus factor

**Why this file exists / when to use it:** AppealDeck's tech lead is an AI coding assistant (`./01-ROLES-AND-OWNERS.md` §1.2), and AI sessions are stateless: when a session ends, everything that lived only in its context — why a schema looks the way it does, what was tried and rejected, what the next step was — is gone unless it was written down. The code survives; the momentum does not. The master risk register rates "AI session lost without handoff" HIGH likelihood (MR-28), and the research stream found the same [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §5]. This file makes context loss a non-event: the CLAUDE.md specification, the end-of-session ritual, milestone handoff files, the recovery procedure, and the fallback if the AI tool itself is unavailable. Use it before the first build session (create CLAUDE.md), at the end of every session (ritual), and at every milestone boundary (handoff file).

**Terms used here:** CLAUDE.md = a Markdown file in the repo root that Claude Code automatically reads at the start of every session — the project's persistent memory. Bus factor = the number of people (here: contexts) whose loss stalls the project; AppealDeck's is effectively 1, and it is the AI context, not any human. Session = one continuous AI working conversation. Handoff = a written state snapshot that lets a fresh session (or a different tool) resume without re-derivation. M-1…M-8 = the build plan's weekly milestones (`../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`). D1–D10 = the ten locked decisions in `../00-DECISION/02-DECISION-LOG.md`. MoR = Merchant of Record (Paddle/Polar). CWS = Chrome Web Store. MV3 = Manifest V3, Chrome's current extension platform.

---

## 1. Why this is the bus factor (read once, believe it)

- The founder is a non-developer: nobody on the team can reconstruct architectural intent from code alone.
- The research stream that audited the project pre-playbook found **no CLAUDE.md and no session-persistence mechanism** — cross-session memory relied on the founder re-pasting documents, and nuance (why paste-mode is primary, why Paddle over Stripe, why the encryption envelope looks the way it does) lived only in chat history [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §5].
- Measured cost of loss (estimates from the same research): a session lost at a boundary with no handoff ≈ 2–4 hours of context rebuilding; lost mid-milestone with in-flight architectural work ≈ up to 1–2 days; compounded over an 8-week build, days of lost work.
- The countermeasure costs ~5 minutes per session. This trade is not optional; the ritual in §3 is a standing rule of the build (see also `../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md` §5 standing rules).

---

## 2. The CLAUDE.md specification (repo root: `V:\AppealDeck\CLAUDE.md`)

CLAUDE.md is read automatically at session start, so it must contain exactly what a zero-context session needs — no more (a bloated CLAUDE.md gets skimmed). Required sections, in order:

**Section 1 — Product one-pager.** What AppealDeck is in ~10 lines: notice decoder → AI-drafted POA → deadline tracking → encrypted local case vault; free decoder → $199 one-time Appeal Pass per case; audience = suspended Amazon sellers; founder solo/Finland/non-developer; local-first, read-only, no automation — ethics spine is strategy (D6).

**Section 2 — The locked decisions, D1–D10, summarized.** One line each (GO-conditional · Paddle primary/Polar fallback with self-issued license keys · hybrid build order web-first, injector last-or-never · toiminimi entity · partnership agreement before any sharing + paid auditions · ethics spine: no "guarantee", honest-expectations card, severity gating, read-only, local-first · Guardian and Expert Review deferred · 7-day voluntary refunds · Gemini Flash paid tier server-side only · north-star = paid Appeal Passes/week). End the section with: "These are settled. Do not reopen; deviations require a founder-approved append to `00-DECISION/02-DECISION-LOG.md`."

**Section 3 — FORBIDDEN SOURCES (verbatim from build plan §2.6 — copy this block exactly):**

> ### 2.6 FORBIDDEN SOURCES — absolute, no exceptions
> Never copy, adapt, paraphrase, or "take inspiration at code level" from:
> - `V:\Extension 2.3\spchatgpt\` and `V:\Extension 2.3\spchatgpt-rebranded\` (third-party proprietary — Superpower ChatGPT)
> - `V:\Extension 2.3\content\core.js`, `content\mc-managers.js`, `content\spchatgpt-*.js`, `content\chatgpt-managers.bundle.js`, `content\chatgpt-polyfills.js`
> - `V:\Extension 2.3\chunked\`, `V:\Extension 2.3\dist\`, `V:\Extension 2.3\Branding\rebrand-*.{js,cjs}`
> - Any file whose content mentions "superpower" (run a grep check before committing any copied file).
>
> Everything in §6's donor table has been verified as originally authored / MIT and is safe.

This section exists in CLAUDE.md because it is the one rule whose violation is unrecoverable (copyright contamination of the clean repo). Every session must see it without being told.

**Section 4 — Current state: milestone + next 3 actions.** The living section, updated every session (§3 ritual): current milestone (e.g. "M-3, week 3"), what is DONE since the last update, what is IN FLIGHT (including any half-finished refactor a fresh session must not clobber), any BLOCKERS waiting on the founder or Jhangir, and the next 3 concrete actions in priority order.

**Section 5 — Key file links.** Pointers so a fresh session can navigate without exploration: the build plan (`03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md`) + amendments (`03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`) + build sequence (`03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`); the decision log and gates (`00-DECISION/`); technical risk controls (`03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md`); this team folder (`08-TEAM/`); `docs/DECISIONS.md`; the latest milestone handoff in `docs/handoffs/`.

Formatting rules: keep CLAUDE.md under ~300 lines; Sections 1–3 and 5 are near-static; only Section 4 churns. Never put credentials, keys, or personal data in it — it is committed to the repo.

---

## 3. The end-of-session handoff ritual (mandatory, ~5 minutes)

Before ending ANY working session, the AI assistant:

1. **Updates CLAUDE.md Section 4** — current milestone, done/in-flight/blockers, next 3 actions.
2. **Appends any non-trivial decision to `docs/DECISIONS.md`** — one entry per decision: date, decision, alternatives considered, why, files affected. "Non-trivial" = anything a future session would otherwise re-derive or might reverse in ignorance (schema shapes, library choices, prompt-design rationale, anything diverging from the build plan's letter while honoring its intent).
3. **Git-commits both files together with the session's work** — the commit is the durable checkpoint; an updated file that only exists in a working tree can be lost with it.

If a session is interrupted (crash, disconnect) before the ritual runs, the next session runs §5 recovery and then immediately performs the ritual retroactively — reconstructing Section 4 from git log + diff is far cheaper than reconstructing it from nothing later.

The founder's role: don't accept "done for today" from any session until the ritual is confirmed. It is a one-line question: "Is CLAUDE.md current and committed?"

---

## 4. Milestone-boundary handoff files (the PROJECT_STATE_HANDOFF.md pattern)

The predecessor project proved this pattern: a single file, `PROJECT_STATE_HANDOFF.md`, written "to survive chat deletion — give this file to any future AI assistant for instant context", carrying state, file inventory, urgent warnings, decision trail, and a literal say-this-to-a-fresh-session prompt [source: PROJECT_STATE_HANDOFF.md]. It worked: this playbook was built from it. Replicate it at every milestone boundary.

At the completion of each milestone (M-1…M-8, plus M-W the web launch), the AI assistant writes `docs/handoffs/M-<n>-HANDOFF.md` containing:

| Section | Content |
|---|---|
| State paragraph | Where the project stands, in one paragraph a stranger can act on |
| Milestone evidence | The acceptance-gate criteria and how they were met (links to tests/builds) |
| File inventory delta | What was added/changed this milestone and what each part is for |
| Decisions this milestone | Copied or referenced from `docs/DECISIONS.md` |
| Warnings | Anything dangerous a future session must know first (half-migrations, temporary hacks, pending rotations) |
| Resume prompt | A literal quoted instruction: "Read `CLAUDE.md`, then `docs/DECISIONS.md`, then this file; current milestone is M-<n+1>; start with <next action>." |

Handoff files are append-only history — never edited after their milestone closes (corrections go in the next handoff). CLAUDE.md is the present; handoffs are the immutable past; `docs/DECISIONS.md` is the reasoning ledger connecting them.

---

## 5. Session-loss recovery procedure

**Without a handoff discipline** (the counterfactual this file prevents): a fresh session must re-read the build plan and playbook, re-derive in-flight state from raw diffs, and re-ask the founder things the founder may not know — ~2–8 hours of context rebuild per loss, worst when a loss lands mid-milestone (estimates) [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §5].

**With the discipline, recovery is a fixed 4-step read (~15–30 minutes, estimate):**

1. Read `CLAUDE.md` (auto-loaded) — product, locked decisions, forbidden sources, current state, next 3 actions.
2. Read `docs/DECISIONS.md` — the reasoning ledger, newest entries first.
3. Read the current milestone's spec — the relevant build-plan §15 milestone + `../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md` week section + the latest `docs/handoffs/` file.
4. Resume at the first of the "next 3 actions". If CLAUDE.md Section 4 looks stale (git log shows commits after its last update), reconstruct from `git log --stat` and diffs since the last handoff, then update Section 4 before writing any code.

The founder's only job in recovery is to say: "Read CLAUDE.md and resume." If that sentence isn't sufficient, the previous sessions failed the §3 ritual — fix the discipline, not just the gap.

---

## 6. Tool-outage fallback (if the AI assistant itself is unavailable)

The playbook and build plan are deliberately **executor-agnostic**: the stack is standard (TypeScript strict, Vite, React, Tailwind, Dexie; plain Markdown specs), and every instruction in this repo is written for "any capable coding agent", not one vendor. If Claude Code is down for more than a working day, or is discontinued or degraded:

1. Point any capable alternative coding agent (or, at worst, a human contract developer) at the repo.
2. Its first instruction is identical to §5: read `CLAUDE.md` → `docs/DECISIONS.md` → current milestone spec → latest handoff → resume.
3. Enforce the same non-negotiables explicitly, since a new tool won't auto-load CLAUDE.md: forbidden sources §2.6 verbatim (grep-for-"superpower" check before committing any copied file), decisions D1–D10 closed, the §3 ritual continues in the new tool.

Expected switching cost: **1–3 days** (estimate) — tool setup, workflow differences, and the new agent's first full read of the corpus — versus weeks if the knowledge lived in a proprietary chat history. That delta is the entire return on this file's discipline. No pre-emptive multi-tool setup is needed; the fallback is cheap precisely because the state lives in the repo, not in any tool.

---

## 7. Action items

- [ ] **1. Create `V:\AppealDeck\CLAUDE.md` per the §2 spec — all five sections, forbidden-sources block verbatim — before the first build session.** — **Owner:** AI assistant (writes) + Founder (confirms it exists before build starts) · **Cost:** $0 · **Deadline:** Week 1, before B-02 repo scaffold work begins (`../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`) · **Blocks:** safe session boundaries for the entire build
- [ ] **2. Create `docs/DECISIONS.md` with its entry format (date · decision · alternatives · rationale · files) and a first entry recording the repo's creation parameters.** — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1, with item 1 · **Blocks:** §3 ritual step 2
- [ ] **3. Run the §3 end-of-session ritual at every session close; founder verifies with the one-line question.** — **Owner:** AI assistant (executes) + Founder (enforces) · **Cost:** ~5 min/session · **Deadline:** every session, M-1→M-8 · **Blocks:** cheap recovery (§5); MR-28 mitigation
- [ ] **4. Write `docs/handoffs/M-<n>-HANDOFF.md` at every milestone boundary per the §4 table (M-1…M-8 + M-W).** — **Owner:** AI assistant · **Cost:** ~15 min/milestone · **Deadline:** at each milestone's close, before the next begins · **Blocks:** mid-project re-entry by any future tool or person
- [ ] **5. Fire drill: at the end of Week 2, start one deliberately fresh session and time the §5 recovery read.** If it needs founder explanation beyond "read CLAUDE.md and resume", fix CLAUDE.md the same day. — **Owner:** Founder (initiates) + AI assistant · **Cost:** ~30 min · **Deadline:** end of Week 2 · **Blocks:** proof the discipline works while the project is still small enough to fix cheaply

---

## Definition of done

- [ ] `CLAUDE.md` exists at the repo root with all five §2 sections; the forbidden-sources block matches build plan §2.6 verbatim; it contains no credentials.
- [ ] `docs/DECISIONS.md` exists and grows — every non-trivial decision of every session is in it, dated.
- [ ] Every closed session ended with the §3 ritual (spot-checkable: CLAUDE.md Section 4's last update matches the last working commit).
- [ ] A handoff file exists in `docs/handoffs/` for every completed milestone, each with a working resume prompt.
- [ ] The Week-2 fire drill passed: a fresh session resumed real work from the repo alone within ~30 minutes.
- [ ] The tool-outage fallback needs no preparation beyond this file — verified by the fire drill, since a fresh session and a new tool follow the identical §5 path.

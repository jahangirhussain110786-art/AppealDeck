# Session log — 2 Sep 2026: external-AI review digested; Case OS + Guided Interview specced

> Written because the originating chat was deleted at the founder's request; this file is the durable record of the conversation's arc. Every substantive output already lives in the files listed below — this log is the map, not a second copy.

## What happened (three rounds)

**Round 1 — Meta AI brainstorm fact-checked and digested.** The founder shared a long 1 Sep 2026 Meta AI conversation about Amazon suspensions and POA tooling and asked for an assessment plus planning updates so AppealDeck doesn't become "another failed tool." Verdict: directionally right (evidence-first pressure), factually unreliable (hallucinated numbers/models/sources; stale 90-day funds claim; Agent Policy misfiled under BSA §3). Two live-web research passes ran the same day and are archived verbatim:
- `Planning/03-PHASE-2-BUILD/reference/2026-09-02-COMPETITOR-RECHECK.md` (2026 AI-tool wave, agency pricing drift, failure evidence, 93–99% claim wall)
- `Planning/03-PHASE-2-BUILD/reference/2026-09-02-POLICY-FACTCHECK.md` (C1–C10 verdicts incl. Agent Policy real/4 Mar 2026, funds +60d, invoice rules, AAA arbitration)

Output: `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md` (fact-check table, five failure modes F1–F5, spec EF-1…EF-5, rejected-suggestions register, keeper copy lines) + **AM-16 (AA-19…AA-21)** in `02-BUILD-PLAN-AMENDMENTS.md`. Core adoption: evidence requirements matrix, action checklist + attestation, deterministic case-readiness ("case-file completeness — not a prediction"), gap-draft vs full-draft composer, document-type router, outreach letters, opt-in outcome schema, quarterly policy re-check.

**Round 2 — "OS, not a writing tool."** Founder direction: the system must ask for documents, demand actions, and when a seller declines an action, hear the reason and offer alternatives; proposed a chat window. Output: `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` + **AM-17 (AA-22…AA-25)**: case state machine (`caseState.ts`, FUNDS_TRACK, GATED_PRO_HELP), objection-aware actions (predefined consultant-reviewed alternatives; declined ≠ claimed), response analyzer promoted from P1 to v1 (`responseAnalyzer.ts` + Amazon-reply fixtures), panic-hour DO-NOW/DO-NOT triage cards, resubmission-novelty guardrail. Chat initially adopted as a "guided interview on rails."

**Round 3 — interview, not chat.** Founder second pass: a 24/7 chat window would be used like a general AI tool and burn tokens; wanted a "subsequent conversation system" (OS asks → seller submits or denies with reason → OS analyzes → next window → until complete → generate), strictly capped to our services. Spec §4 rewritten accordingly — **no chat window exists**: no persistent input box (typed per-step inputs); engine owns the agenda; deterministic-first routing; **no `/chat` backend route** (only decode / extract-field / compose / critique / analyze-reply, input-capped, schema-constrained); per-case LLM budget metered server-side on the case key (free tier reaches only `decode`, behind a deterministic notice-likeness prefilter); finite sessions with a fixed off-topic redirect; zero-LLM case-questions drawer replaces "open chat"; generative Q&A parked indefinitely. Retired name: "Case Copilot".

## Files created/edited this session

- NEW `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md`
- NEW `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md`
- NEW `Planning/03-PHASE-2-BUILD/reference/2026-09-02-COMPETITOR-RECHECK.md` + `2026-09-02-POLICY-FACTCHECK.md` (archived research)
- EDIT `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` — AM-16 + AM-17 (index rows, sections, AA-19…AA-25, gates amended, DoD count 25)
- EDIT `docs/DECISIONS.md` — three entries dated 2026-09-02
- EDIT `CLAUDE.md` §4 (state) and §5 (handoffs path)
- NEW this file

## Standing next actions (also in CLAUDE.md §4)

1. **Founder:** close Phase-0 blockers; retrieve the in-force Agent Policy text (B-08 — also settles the "§19" numbering); ratify AM-16 + AM-17 (AA-25); add the two banned rows to `07-REFERENCE/01-MARKET-EVIDENCE.md` §4; merge the 2 Sep competitor deltas into `07-REFERENCE/02-COMPETITOR-DOSSIER.md`; re-verify §1.2 price anchors before any marketing push (ecommerceChris de-published pricing).
2. **AI:** implement M4+M5 per AM-16 + AM-17 (AA-19, AA-22, AA-24) with evidence-state + reply fixtures.
3. **AI:** Guided Interview + EF-5 outcome schema with the M-W backend work (AA-23, AA-21).

Feature freeze after AM-17 until first paid Passes + opt-in outcomes exist (D10 arbitrates further depth).

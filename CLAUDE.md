# CLAUDE.md — AppealDeck project memory (read at every session start)

> Auto-loaded context for any coding agent. Keep under ~300 lines. Sections 1–3 and 5 are near-static; only Section 4 churns (update every session per `08-TEAM/03-AI-SESSION-CONTINUITY.md` §3).

## 1. Product one-pager

AppealDeck helps suspended/flagged Amazon sellers by (1) decoding their deactivation/notice for free, (2) drafting an AI-generated Plan of Action (POA — the structured appeal Amazon requires), (3) tracking appeal/funds deadlines, and (4) keeping an encrypted, local-first case vault. Sold as a **$199 one-time "Appeal Pass" per case** (Guardian $29/mo + Expert Review deferred — D7). Audience: suspended Amazon sellers in panic. Founder: Jhangir Hussain, solo, Pakistan, non-developer, individual seller (Hawlton = brand/trading name only). Ethics spine IS the strategy: local-first, read-only, no automation, no "guarantee", honest-expectations framing, severity gating (D6).

## 2. Locked decisions D1–D10 (settled — do not reopen)

- **D1** GO, conditional (web-first compliance spine, Phase-0 blockers first, honest no-guarantee positioning, gates enforced).
- **D2** Paddle primary MoR (5% + $0.50, tax-inclusive). Fallback ladder: Polar (warm, verify Pakistan payout via Stripe Connect at signup) → Dodo Payments (plan-C). License keys self-issued via Supabase `licenses` table driven by MoR webhooks.
- **D3** Build order: platform-agnostic TS core (parse→classify→intake→compose→critic) wks 1–4 → web decoder + paid composer live wks 4–5 → MV3 extension wks 4–8 (paste-mode primary; DOM-harvest gated on BSA §19 read; injector last-or-never).
- **D4** Entity: individual (sole proprietor), Jhangir Hussain, Pakistan. Personal payout (Payoneer/Wise personal). Hawlton brand only. Incorporate at ~100 paying users / PKR 5–10M retained profit.
- **D5** Solo founder: no partnership agreement. Written collaborator agreement (IP assignment, non-solicit, credential protocol) BEFORE any contractor/VA/expert gets access. Paid fixture audition for every appeals expert. Consultant retainer ~$1–2k wk 3.
- **D6** Ethics spine (non-negotiable): "guarantee" greps to 0; honest-expectations card before purchase; severity gating (forged-docs/fraud/child-safety routed to pro-help, never sold); read-only always; local-first always; win rates only from opt-in outcome data.
- **D7** Deferred: Guardian $29/mo until monitoring ships; Expert Review until MoR rails resolved; multi-tenant/mobile/non-English → P1/P2; SP-API only after legal clarity.
- **D8** 7-day no-questions voluntary refund; EU-withdrawal-compliant checkout consent (explicit prior consent + permanent-form confirmation email).
- **D9** Cloud LLM: Gemini Flash **paid tier** via own backend only (key never in extension); free tier = dev fixtures only (free-tier data trains Google). Cost ceiling + circuit breaker + per-device rate limits before free tier is public; rules-only degradation floor.
- **D10** North-star: paid Appeal Passes/week. Funnel: decoder session → decode completed → intake started → purchase → (opt-in) outcome. Analytics: Plausible or Umami + backend counts.

These are settled. Do not reopen; deviations require a founder-approved append to `00-DECISION/02-DECISION-LOG.md`.

## 3. FORBIDDEN SOURCES (verbatim from build plan §2.6 — absolute, no exceptions)

Never copy, adapt, paraphrase, or "take inspiration at code level" from:
- `V:\Extension 2.3\spchatgpt\` and `V:\Extension 2.3\spchatgpt-rebranded\` (third-party proprietary — Superpower ChatGPT)
- `V:\Extension 2.3\content\core.js`, `content\mc-managers.js`, `content\spchatgpt-*.js`, `content\chatgpt-managers.bundle.js`, `content\chatgpt-polyfills.js`
- `V:\Extension 2.3\chunked\`, `V:\Extension 2.3\dist\`, `V:\Extension 2.3\Branding\rebrand-*.{js,cjs}`
- Any file whose content mentions "superpower" (grep before committing any copied file).

Everything in the build plan §6 donor table is verified originally-authored / MIT and safe.

## 4. Current state (update every session)

- **Milestone:** M-1 core complete (22 Vitest tests green incl. `guidance.ts`); Next.js web shell + Supabase auth + Paddle webhook + RLS built ahead of schedule (detail lives in `AGENTS.md` "Current Project State"). M-4 (intake/composer) not started.
- **DONE this session (2 Sep 2026):** Founder's 1 Sep Meta AI brainstorm fact-checked (two live-web research passes, dated 2 Sep) and digested into the planning layer. NEW `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md`: claim-by-claim verdicts, the five POA-tool failure modes (F1–F5), spec EF-1…EF-5 (evidence requirements matrix `src/core/evidenceModel.ts`; action checklist + attestation; deterministic case-readiness rendered ONLY as "case-file completeness — not a prediction"; gap-draft vs full-draft composer; document-type router poa/ip_dispute/funds_appeal; outreach letters; opt-in outcome schema; quarterly policy re-check), plus a binding rejected-suggestions register (SP-API now, auto-submit, $299/mo, approval predictors, model ensembles — locked by D2/D6/D7/D9). `02-BUILD-PLAN-AMENDMENTS.md` gained **AM-16 (AA-19…AA-21)**; `docs/DECISIONS.md` appended. Verified 2 Sep: the 4 Mar 2026 **Agent Policy** is real and in force (automated tools must self-identify; the "§19" placement is single-source — B-08 confirms numbering from the text); funds request window is **+60d** (Meta AI's 90d was stale; our deadlinesModel already correct); inauthentic invoice rules confirmed (≤365d, completed transaction, pro-forma/quotes fail, Amazon phones suppliers); the 2026 AI-appeal-tool wave is all-subscription with zero review footprint; two tool deaths confirmed (appealshub 404, appealpath broken TLS); ecommerceChris de-published pricing → §1.2 anchor re-verify due before any marketing push.
- **ALSO DONE 2 Sep (later session):** Founder direction "OS not writing tool; chat that suggests actions/docs and offers alternatives on refusal" → NEW `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` + **AM-17 (AA-22…AA-25)**: case state machine (`caseState.ts`, FUNDS_TRACK + GATED_PRO_HELP), objection-aware actions (predefined consultant-reviewed alternatives; declined ≠ claimed), `responseAnalyzer.ts` (Amazon-reply categories, promoted P1→v1, reply fixtures), and the **Guided Interview** (founder second pass same day: NOT a chat window — a finite step flow, abuse-proof by construction: no persistent input box, typed per-step inputs, deterministic-first routing, NO `/chat` backend route [only decode/extract-field/compose/critique/analyze-reply, schema-constrained], per-case LLM budget on the case key, free tier reaches only `decode` behind a notice-likeness prefilter, fixed off-topic redirect; zero-LLM case-questions drawer replaces "open chat"; generative Q&A parked indefinitely). Panic-hour DO-NOW/DO-NOT triage cards join free decode. No new milestones: core pieces ride M-4, Interview rides M-W; feature freeze after AM-17 until first paid Passes + opt-in outcomes.
- **IN FLIGHT:** M-4 build (intake M4 + composer/critic M5 + PoaEditor) — must implement AM-16/EF-1…EF-4 AND AM-17 (caseState, objection actions, responseAnalyzer; both gates amended). DOM-harvest + injector still blocked on the Agent-Policy/§19 read (B-08/B-15), which is now in-force policy, not a future risk.
- **BLOCKERS (founder):** Phase-0 credential rotation (Supabase `fogvzjtxbqgfppdrxqra`); Paddle/Polar/Wise/CWS/domain accounts; Agent-Policy/BSA text retrieval (B-08). NEW: ratify AM-16 + AM-17 together; add the two banned rows ("agency results at 1/10th the cost"; readiness-as-approval framing) to `Planning/07-REFERENCE/01-MARKET-EVIDENCE.md` §4; merge the 2 Sep competitor deltas into `02-COMPETITOR-DOSSIER.md` (07-REFERENCE is founder-gated).
- **NEXT 3 ACTIONS:** (1) Founder closes Phase-0 blockers + retrieves the in-force Agent Policy text (B-08) + ratifies AM-16/AM-17. (2) AI implements M4+M5 per AM-16+AM-17 (AA-19 evidenceModel/letters/router/readiness/two-mode composer + AA-22 caseState/objections/responseAnalyzer + AA-24 triage/novelty) with evidence-state + reply fixtures. (3) AI builds the Guided Interview + EF-5 outcome schema with the M-W backend work (AA-23, AA-21).

## 5. Key file links

> Repo layout: the app lives at repo root (`src/`, `package.json`, `legal/`, `docs/`); all playbook/planning docs live in `Planning/`; `.agents/` + `.claude/` skills stay at root.

- Build plan (canonical): `Planning/03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md`
- Amendments (authoritative over v1.0): `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`
- Build sequence (order): `Planning/03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`
- Risk controls: `Planning/03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md`
- Decisions log + gates: `Planning/00-DECISION/`
- Team / continuity: `Planning/08-TEAM/`
- Reasoning ledger: `docs/DECISIONS.md`
- Milestone/session handoffs: `docs/handoffs/` (2 Sep 2026 session log: `docs/handoffs/2026-09-02-external-ai-review-and-case-os.md`; archived 2 Sep research: `Planning/03-PHASE-2-BUILD/reference/2026-09-02-*.md`)

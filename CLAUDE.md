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

- **Milestone:** M-1 (prerequisites + core start). Entered only after Phase-0 blockers + Gate 1 pass.
- **DONE this session (31 Aug 2026):** repo scaffolded — secret-safe `.gitignore`, `CLAUDE.md`, `docs/DECISIONS.md`, `.env.example`, `package.json` (TS + Vitest + @types/node), `tsconfig.json` (strict), `.github/workflows/ci.yml` (Node 20 typecheck + test, runs at repo root). Legal drafts (`legal/` privacy/terms/refund/withdrawal-consent). Team/ops drafts (`Planning/08-TEAM/` advisor+NDA+audition, `Planning/06-OPERATIONS/` GDPR+canned). **M-1 core built + tested (20 tests green):** `noticeParser.ts`, `classifier.ts` (deterministic stage-1), `deadlinesModel.ts` (AM-03 six kinds + indefinite-hold for severity-gated inauthentic), `fixtures.ts` corpus (≥4 synthetic notices/type + adversarial traps, no real PII), and a `runDecode` pipeline barrel in `index.ts`. D6 ethics-spine guard test: "guarantee" greps to 0 in `src/core`. (Note: prior `Execution/` subfolder restructure was reverted at founder's request — app lives at repo root.)
- **IN FLIGHT:** intake wizard (M4), POA composer + critic/guardrails (M5), PoaEditor. DOM-harvest + injector blocked until BSA §19 read (founder).
- **BLOCKERS (founder):** Phase-0 credential rotation (Supabase `fogvzjtxbqgfppdrxqra`) not yet done by founder; Paddle/Polar/Wise/Supabase/CWS/domain accounts not opened; BSA §19 text not retrieved.
- **NEXT 3 ACTIONS:** (1) Founder rotates leaked creds + opens service accounts + applies to Paddle behind live site. (2) AI builds synthetic fixture corpus (≥4 notices/type + adversarial, `B-03`). (3) AI implements intake wizard (M4) + POA composer/critic (M5) on top of the existing `Execution/src/core/` parser/classifier/deadlines.

## 5. Key file links

> Repo layout: the app lives at repo root (`src/`, `package.json`, `legal/`, `docs/`); all playbook/planning docs live in `Planning/`; `.agents/` + `.claude/` skills stay at root.

- Build plan (canonical): `Planning/03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md`
- Amendments (authoritative over v1.0): `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`
- Build sequence (order): `Planning/03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`
- Risk controls: `Planning/03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md`
- Decisions log + gates: `Planning/00-DECISION/`
- Team / continuity: `Planning/08-TEAM/`
- Reasoning ledger: `docs/DECISIONS.md`
- Milestone handoffs: `Execution/docs/handoffs/`

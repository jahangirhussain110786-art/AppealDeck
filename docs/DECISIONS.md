# DECISIONS.md — reasoning ledger

Every non-trivial decision is appended here (one entry per decision): **date · decision · alternatives · rationale · files**. A future session reads this instead of re-deriving intent.

Format:
```
## YYYY-MM-DD — <title>
- Decision: <what was decided>
- Alternatives considered: <options>
- Rationale: <why>
- Files affected: <list>
- Decider: <Founder | AI assistant | both>
```

---

## 2026-08-31 — Repo scaffold + toolchain pin (M-1 / B-02 start)

- Decision: Initialize `V:\AppealDeck` as a TypeScript project with a platform-agnostic `src/core/` layer, Vitest for unit tests, strict `tsconfig`, and a GitHub Actions CI that typechecks + tests on Node 20. Core compiles for web and extension from one source tree (D3 rule 1: no `chrome.*` import in `src/core/`).
- Alternatives considered:
  1. Full Next.js App Router scaffold now (AGENTS.md tech stack lists Next.js) — deferred: web revenue surface is M-W (wk 4–5); the core M-1 work is framework-agnostic and should not be coupled to a web framework yet. Next.js shell is added at M-W (`B-19`).
  2. Vite-only monorepo now — rejected in favor of keeping the root minimal and letting the extension (crxjs/Vite, AM-15) and web (Next.js) entries be added as their own build targets later.
- Rationale: keep the compliance-critical, testable core independent of any host so the same code powers both the web decoder and the MV3 extension; CI green from commit #1 per M-1 gate.
- Files affected: `.gitignore`, `CLAUDE.md`, `docs/DECISIONS.md`, `.env.example`, `package.json`, `tsconfig.json`, `.github/workflows/ci.yml`, `src/core/index.ts`, `src/core/index.test.ts`.
- Decider: AI assistant (founder confirms before build proceeds past Phase-0).

## 2026-08-31 — Toolchain pin (AM-15)

- Decision: Pin `@crxjs/vite-plugin` `^2.7.x` for the future MV3 extension build; WXT is the named fallback if crxjs goes >90 days without a release or breaks against a Chrome/Vite upgrade with no fix in 2 weeks. The platform-agnostic core is unaffected by either choice by construction.
- Alternatives considered: WXT as primary — deferred; crxjs v2.7.1 is viable and peer-deps Vite 3–8.
- Rationale: AM-15 verification (25 Aug 2026).
- Files affected: recorded here; applied in `package.json` when the extension target is added.
- Decider: AI assistant.

## 2026-08-31 — Secrets discipline (Phase-0 blocker, never re-litigated)

- Decision: `.gitignore` blocks `.env*`, `*.pem`, `*.zip`, and all credential/json patterns repo-wide (including inside `dist/`). Real secret values live ONLY in deployment-env stores (Supabase secrets, GitHub Actions secrets, Cloudflare). Repo carries `.env.example` with empty values. A fresh Supabase project is used for AppealDeck — never the compromised `fogvzjtxbqgfppdrxqra`.
- Rationale: the prior leak was caused by `dist/` shipping `.env.local` (plaintext Postgres password + Supabase JWTs). This is the exact failure mode to prevent.
- Files affected: `.gitignore`, `.env.example`, `Planning/01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md`.
- Decider: both (founder rotates; AI enforces in repo).

## 2026-08-31 — Legal page drafts (D8 / AM-05 / Paddle prerequisite)

- Decision: AI drafted four legal pages as Markdown for founder review + publish: `content/legal/privacy.md`, `content/legal/terms.md`, `content/legal/refund.md`, `content/legal/withdrawal-consent.md` (the checkout consent implementation spec). All reflect D6 (no "guarantee"), D8 (7-day voluntary refund + EU-withdrawal consent), local-first (D6), and Paddle-as-MoR.
- Alternatives considered: buying templates — deferred; these drafts follow the playbook's compliance spine and the founder verifies before publishing. A scoped legal review (~$300–800) is folded into the pre-US-marketing check (decision-log §3 row 10).
- Rationale: Paddle rejects applications without a live site + legal pages; drafts unblock B-05/B-06. Words are founder-reviewed before any publish (copy is user-facing).
- Files affected: `content/legal/privacy.md`, `content/legal/terms.md`, `content/legal/refund.md`, `content/legal/withdrawal-consent.md`.
- Decider: AI assistant (drafts); founder (publish/approve).

## 2026-08-31 — Team/ops drafting batch (founder-review, then use)

- Decision: AI drafted the collaborator paperwork + ops scaffolding the playbook requires: advisor-agreement template, mutual NDA template, GDPR operational kit, recruitment audition fixture (Section 3 notice with the two traps) + scoring rubric + log template, and top-20 support canned responses. All are founder-reviewed before use; never shared with a candidate before a signed agreement (collaborator policy §1).
- Rationale: these are the "mine" deliverables that let the founder hire the consultant/VA/design-partners safely and run GDPR + support from Week 1.
- Files affected: `Planning/08-TEAM/advisor-agreement-template.md`, `Planning/08-TEAM/nda-template.md`, `Planning/06-OPERATIONS/GDPR-KIT.md`, `Planning/08-TEAM/audition-fixture.md`, `Planning/08-TEAM/audition-rubric.md`, `Planning/08-TEAM/recruitment-log-template.md`, `Planning/06-OPERATIONS/canned-responses.md`.
- Decider: AI assistant (drafts); founder (adopt/use).

## 2026-08-31 — Fixture corpus (B-03 seed) + M-1 core start (parser/classifier/deadlines)

- Decision: created `src/core/fixtures.ts` (typed fixture corpus: INAUTHENTIC, RELATED_ACCOUNT, POLICY, IP, LISTING, FUNDS + 2 adversarial, with the legacy "17-day" parse pattern and missing-invoice trap encoded) and the first platform-agnostic core modules: `noticeParser.ts` (regex fact extraction, no `chrome.*`), `classifier.ts` (deterministic stage-1 → ViolationKind + severity gate), `deadlinesModel.ts` (AM-03 six kinds: appeal_window / funds_appeal_eligible=+60d / funds_review=+90d checkpoint / seller_challenge / aha_72h / indefinite_hold). Tests: 7 passing.
- Alternatives considered: storing fixtures as loose `{raw,expected.json}` files — chose a TS module so the parser is built against typed fixtures and CI validates them in one run (B-03's shape is derivable). Corpus is a SEED: expand to ≥4 per kind and validate the violation taxonomy against build plan §13.1 + the retained consultant before the M-3 gate.
- Rationale: this is the compliance-critical, testable core that powers both web and extension (D3). Deterministic regex always beats LLM output (B-11).
- Files affected: `src/core/fixtures.ts`, `src/core/fixtures.test.ts`, `src/core/noticeParser.ts`, `src/core/classifier.ts`, `src/core/deadlinesModel.ts`, `src/core/core.test.ts`.
- Decider: AI assistant.

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

## 2026-09-02 — External-AI review digested into AM-16 (evidence-first hardening); its conflicting suggestions rejected

- Decision: The founder's 1 Sep 2026 Meta AI brainstorm was fact-checked (against the verified evidence base + fresh 2 Sep live-web research) and converted into amendment **AM-16**: evidence requirements matrix (`src/core/evidenceModel.ts`), action checklist with attestation, deterministic case-readiness (labeled "case-file completeness — not a prediction"), two-mode composer (gap draft vs full draft), document-type router (poa/ip_dispute/funds_appeal first), outreach letter templates, opt-in outcome schema, quarterly policy re-check. Spec + full fact-check: `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md`.
- Alternatives considered:
  1. Adopt the conversation's product ideas as-is (SP-API ingestion, $299/mo subscription, "82% approval predictor", model ensemble fine-tuned on POAs) — rejected: each conflicts with a locked decision (D7/D2/D6/D9) or the local-first wedge; recorded in the rejected register (§4 of the new file) so it is never re-litigated without a founder-approved decision-log append.
  2. Do nothing (spec already has critic + anti-fabrication) — rejected: 2 Sep forum evidence shows instant bot rejections when required documents are missing and template language is detected; our composer could still emit a truthful but evidentially hollow POA. The gap is real.
- Rationale: the #1 real-world rejection cause is missing/mismatched evidence and promises instead of performed actions; modeling evidence per violation kind and gating composition on attested completeness is the highest-leverage hardening available, and it strengthens (not reopens) D6. No D1–D10 decision is changed.
- Files affected: `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md` (new), `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (AM-16, AA-19…AA-21), `CLAUDE.md` §4.
- Decider: AI assistant (spec + fact-check); Founder ratifies AM-16 before M-4 implementation and owns the two banned-list additions + competitor-dossier merge (07-REFERENCE is edit-gated).

## 2026-09-02 — AM-17 Case OS: lifecycle state machine, objection-aware actions, response analyzer, chat adopted as guided Copilot (not a chatbot)

- Decision: Per founder direction ("OS for sellers, not a writing tool; chat window that suggests actions/documents and offers alternatives when the seller declines"), adopted amendment **AM-17**: `src/core/caseState.ts` (deterministic case state machine incl. FUNDS_TRACK and GATED_PRO_HELP short-circuit), objection-extended `ActionItem` (declined-with-reason + predefined consultant-reviewed alternatives, always incl. "decline and proceed" with honest consequence), `src/core/responseAnalyzer.ts` (Amazon-reply categorization promoted from P1 to v1, deterministic-first, reply fixtures added to the corpus), and **Case Copilot** — the requested chat window built as a guided interview over the M4 questionnaire engine (LLM limited to extract/phrase/select per turn; per-turn guardrails; transcript never a composer source; classic wizard = degradation floor). Spec: `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md`.
- Alternatives considered:
  1. Free-form chatbot as the primary surface — rejected: it is failure modes F1/F5 (improvised advice, invented facts) with a UI, an AM-12 cost/abuse hazard, and it breaks fact-locking (transcript would become the source of truth). Recorded in the spec §4.1 so it is never drifted into; open-question answering is staged as v1.1 behind an explicit gate.
  2. Skip the lifecycle layer and ship AM-16 alone — rejected: the median real case is multi-round; without state machine + response analyzer the product goes silent after draft #1, which is the "writing tool" ceiling the founder named.
  3. New milestone for the Copilot — rejected: scope guard folds §1–§3 into M-4 and Copilot v1 into M-W, with a defined cut order (v1.1 chat → Copilot skin → analyzer LLM assist) and a feature freeze after AM-17 until first paid Passes + opt-in outcomes.
- Rationale: converts the product from single-document generation to case management (the verifiable gap between junk tools and agencies) while every suggestion remains deterministic-engine output; the seller keeps full agency (D6 read-only), refusals become informed choices instead of silent skips, and no locked decision is touched.
- Files affected: `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` (new), `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (AM-17, AA-22…AA-25; DoD count 25), `CLAUDE.md` §4.
- Decider: AI assistant (spec, per founder direction); Founder ratifies AM-17 alongside AM-16 before M-4 implementation (AA-25).

## 2026-09-02 — Interview-not-chat: AM-17's conversational surface hardened to a finite step flow (founder second pass)

- Decision: Per the founder's same-day follow-up ("a 24/7 chat window will be used like a general AI tool and burn tokens; make it a subsequent conversation system — OS asks, seller submits or denies with reason, OS analyzes, next window — capped to our services strictly"), AM-17's surface is revised: **no chat window exists**. The Guided Interview (retired name: Case Copilot) is a finite step flow made abuse-proof by construction — no persistent input box (typed per-step inputs; bounded short-text only where a narrative is required); engine owns the agenda; deterministic-first routing (LLM only for bounded free-text extraction); **no `/chat` backend route** (only `decode`/`extract-field`/`compose`/`critique`/`analyze-reply`, input-capped, schema-constrained); per-case LLM budget metered server-side on the case key (free tier reaches only `decode`, behind a deterministic notice-likeness prefilter); finite sessions with a fixed off-topic redirect. The former "v1.1 open chat" is replaced by a zero-LLM case-questions drawer (guidance-corpus cards); generative Q&A parked indefinitely behind opt-in outcome data + a decision-log append. Spec: `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` §4 (rewritten).
- Alternatives considered:
  1. Open chat + rate limits/turn caps — rejected: policing instead of design; still reads as "free AI chat", still invites general use, still a per-turn claims/injection surface.
  2. Pure static forms with no free text at all — rejected: loses the decline-with-reason nuance and the honest root-cause narrative, which are the interview's whole value; bounded free-text fields with single extraction calls keep that at cents-per-case.
- Rationale: token spend and abuse become structurally bounded (per-case budget × five schema-constrained routes × prefilter) rather than policy-bounded; the "strictly professional, capped to our services" posture is also the positioning — general-purpose AI chat is the competitors' failure mode.
- Files affected: `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` (§4 rewritten, terms/cut-order/DoD updated), `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (AM-17 provenance + Interview bullet + M-W gate + AA-23 reworded), `CLAUDE.md` §4.
- Decider: AI assistant (design), per explicit founder direction; ratification rides AA-25 with AM-16/AM-17.

## 2026-09-04 — AM-18 Premium UI/UX: design system v2 and pre-deploy UI waves (presentation only)

- Decision: Per founder direction ("most things are complete; make the UI/UX feel truly premium per modern practice before deployment, and show how to structure it"), adopted amendment **AM-18** with spec `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md`: tokens v2 (`next/font`, fluid type, tabular numerals, surface tiers, motion/radius/width scales), shadcn/ui primitive gaps, product patterns (HonestExpectationsCard, DeadlineChip, Stepper, EmptyState, LocalFirstBadge, VerifiedStamp, CopyButton, PoaSection, BeforeYouSubmitChecklist), a motion system with reduced-motion honoured in framer-motion, a mandatory loading/empty/error/success quartet per surface, page-by-page requirements, WCAG 2.2 AA + Lighthouse gates, `defaultTheme` → `system`, one AppHeader. Work ships in Waves A (foundation) and B (marketing conversion) before first deploy, Wave C (app confidence) with M-W.
- Alternatives considered:
  1. Implement the external coding agent's 22-item list as given — rejected in part: confetti on a POA draft is the banned readiness-as-approval framing (D6); onboarding tours get skipped; an analytics consent banner is unnecessary if the D10 cookieless choice holds (verify at deploy); "save & exit" to plaintext `localStorage` breaks the local-first-encrypted spine (persist via the vault store instead); the agent's invented founder story ("denied twice") must never be published. Adopted items are mapped to waves in spec §14.
  2. Ad-hoc page polish without tokens/primitives — rejected: it is how inconsistent, "cheap-feeling" UIs happen; tokens → primitives → patterns → pages is the only order that scales for a solo founder with an AI builder.
  3. Storybook / full design-tooling stack — rejected: a dev-only `/dev/ui` gallery route and a one-page `docs/DESIGN-SYSTEM.md` are enough at this size.
- Rationale: for a $199 high-consideration product with zero social proof, perceived quality and honesty *are* the conversion mechanism; premium here means calm authority (one accent, restraint, no decorative motion), the honest-expectations card as a designed component, product-as-artwork visuals, and complete states — never scarcity, timers, testimonials, or celebration of drafts. Scope guard keeps this presentation-only so the post-AM-17 feature freeze and D6/D7 stay intact.
- Files affected: `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` (new), `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (AM-18, AA-26…AA-28; DoD count 28; M-W gate amended), `CLAUDE.md` §4/§5.
- Decider: AI assistant (spec, per founder direction); Founder ratifies AM-18, supplies the true founder-note text, and signs off Wave A+B screenshots before first deploy (AA-28).

## 2026-09-04 — Single-host topology for the first deploy; content & voice system and simplicity budget added to AM-18

- Decision: Marketing, auth, and the app ship on ONE origin (Vercel-provided URL now, apex domain when connected) with path-based routing. `src/middleware.ts` gains a single-host mode (default when `NEXT_PUBLIC_APP_HOST` is unset or equals the marketing host); `src/lib/urls.ts` resolves `APP_URL` to `SITE_URL`; the `app.` subdomain split is retained behind env vars with a switch checklist in `AGENTS.md` ("Domain topology"). AM-18 additionally adopts a content & voice system (06-spec §10: trust shown by mechanism and never requested, banned-pattern lint, copy centralised in `src/content/`, full copy audit as AA-29) and a binding simplicity budget (§1.1).
- Alternatives considered:
  1. Keep the planned `app.appealdeck.com` split from day one — rejected for now: an extra domain, extra Supabase/Paddle URL configuration, a cross-origin auth hop, and the middleware's `APP_PREFIXES` no longer matched the real app routes after 882ed39 — on a `*.vercel.app` deploy `/auth/callback` would have redirected to a non-existent host. No product benefit at this stage.
  2. Delete the split code — rejected: cheap to keep behind env vars; a later split (cookie isolation, separate caching) becomes env + DNS only.
  3. Keep copy inline in components and rely on the `guarantee` grep alone — rejected: "every single word speaks properly" needs one reviewable place and a wider banned-pattern gate (assertion-trust words), not one token.
- Rationale: fewer moving parts before first users; the seller never changes origin mid-flow; copy quality becomes auditable and lintable.
- Files affected: `src/middleware.ts`, `src/lib/urls.ts` (new), `src/app/(app)/{login,signup,forgot-password,billing}/page.tsx`, `src/app/(app)/page.tsx`, `.env.example`, `docs/DEPLOYMENT.md` §2–§4, `AGENTS.md` (hosting bullet, deploy step 6, new "Domain topology" section, design standards), `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` (§1.1, §8, §10, §13, §15), `02-BUILD-PLAN-AMENDMENTS.md` (AM-18 bullets, AA-29; DoD 29), `CLAUDE.md` §4.
- Decider: AI assistant per founder direction (4 Sep 2026); founder runs the domain checklist when the apex domain is connected.

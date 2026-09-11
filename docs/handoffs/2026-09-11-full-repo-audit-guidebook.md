# 2026-09-11 — Full repo audit: fix & decision guidebook

This is a **living tracking document**, not a one-time report. It captures every gap, stale doc, and open decision found by a full audit of all 115 markdown files, every branding asset, and the complete AA-01…AA-34 build checklist against the actual codebase — cross-referenced item by item. Nothing here is fixed yet. We go through it together; items get ticked off (`[ ]` → `[x]`) and dated as they're resolved, in place, so the audit trail stays intact. Do not delete resolved rows — mark them done and leave the evidence, the same way `docs/DECISIONS.md` and `02-BUILD-PLAN-AMENDMENTS.md` work.

**How this was produced:** six parallel audit passes, each independently reading a slice of the repo (Phase 0/1 planning docs, the Phase 2 build plan and every AA item, Phase 3/4 + operations + reference + team docs, all 22 `docs/handoffs/` files against real git history, branding + legal assets, and `AGENTS.md` + forbidden-sources + repo hygiene), verifying every claim against actual files, grep results, and test runs rather than trusting the docs' own text. Two things were already verified earlier in the same session and were explicitly excluded from re-audit: the visual-refresh-v3 pass (AA-32, done at commit `d720bd2`/`18f1233`) and the `dev@appealdeck.com` test account + active license grant.

**Status legend:** 🔒 Security — handle first · 🔧 Code gap — needs building · 🧑 Founder-only — no code can close it · 📝 Doc fix — text-only correction · ✅ Confirmed clean — no action.

**Owner legend:** **AI** = a coding session can do this directly · **Founder** = requires a human decision, credential, or account only the founder holds.

---

## Section A — 🔒 Security, handle first

### A1. Leaked credential files still on disk (outside this repo)
- [ ] **Deferred — founder decision 11 Sep 2026.** Revisit only if/when the extension project starts and needs anything from that directory; not tracked as an open item until then.
- **What:** `Planning/01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md` Step 5 says to scrub/delete files that leaked real Supabase credentials. They are still present:
  - `V:\Extension 2.3\extraction\.env.local`
  - `V:\Extension 2.3\dist\extraction\.env.local`
  - `V:\Extension 2.3\extraction\list-tables.js`
  - `V:\Extension 2.3\extraction\run-migration.mjs`
  - `V:\Extension 2.3\extraction\seed-templates.mjs`
- **Evidence:** confirmed present on disk by direct filesystem check during the audit (not this repo — a sibling project directory, `V:\Extension 2.3\`, not `V:\AppealDeck1\`).
- **Also unverified:** whether the actual key/password rotation on the old Supabase project (`fogvzjtxbqgfppdrxqra`) dashboard (Steps 3–4 of the same doc) was ever performed. This cannot be checked from the filesystem — only a login to that Supabase project's dashboard can confirm it.
- **Good news:** this repo's actual `.env.local` points at a **different, fresh** Supabase project (`dtddptwudzovcchaciwt`, confirmed via `SUPABASE_PROJECT_REF` and a commit message: "Fresh Supabase project dtddptwudzovcchaciwt (eu-west-1, org AppealDeck) provisioned"). The live app is not exposed by this; the old files sitting on disk are.
- **Fix:** delete the five files above (or the whole `V:\Extension 2.3\extraction\` and `dist\extraction\` subtrees if nothing else in them is needed), and confirm on the Supabase dashboard that the old project's service-role key and database password were rotated.
- **Owner:** **Founder** (or ask an AI session to delete the files once you confirm nothing in them is still needed — this is destructive, so it needs your go-ahead).
- **Priority:** high — this is live credential exposure, not a documentation issue.

---

## Section B — 🔧 Real code gaps still to build

### B1. Opt-in outcome-tracking schema (EF-5 / AA-21's AI-owned half)
- [x] **Done 11 Sep 2026, commit `1eca47b`.** `src/core/outcomeModel.ts` (schema + builder, 9 tests), `POST /api/outcome` (auth + rate-limited, zero PII surface in the schema), `supabase/migrations/0008_outcome_events.sql` (not yet applied to the live project — manual Supabase-dashboard step, see `docs/DEPLOYMENT.md` §4), `OutcomeShareCard.tsx` (explicit opt-in prompt on the dashboard after a terminal reply category), a `readinessAtSubmit` snapshot on `CaseLog` captured at the moment of submission.
- **What:** `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md` §EF-5 specifies an opt-in record of what happened to each submitted appeal (`kind`, `marketplace`, `docType`, `attempts`, `readinessAtSubmit`, `outcome`, `daysToOutcome`) — this is the data source for any future "win rate" claims (D6 requires win-rate claims come only from real opt-in outcome data, never invented numbers).
- **Evidence:** `grep -rn "readinessAtSubmit|daysToOutcome|OutcomeRecord" src/` → 0 hits anywhere in `src/`.
- **Fix:** design and implement the outcome-record schema and capture point (likely a small form after a case is marked submitted, stored locally/opt-in per the local-first spine).
- **Owner:** **AI** (once scoped) — but the schema design itself should probably get a quick founder look before building, since it touches D6's win-rate-honesty rule directly.
- **Priority:** medium — not launch-blocking, but should exist before any "X% of appeals succeeded" marketing claim is ever made.

### B2. Composer critic rules from AA-31 (rides M-4)
- [x] **Partially done 11 Sep 2026, commit `1eca47b`.** Future-tense corrective actions, blame-shifting language, vague-time phrases, document freshness, and unreferenced-evidence nudges all implemented as warning/info findings (never errors), plus the ID paste normaliser. Genuinely separate scope, not done: ASIN/case-ID extraction from notice text, seller override of the decoded type, a root-cause category step, dated corrective-action UI, a character counter, "jargon swaps" (never precisely scoped) — see the AA-31 note in `02-BUILD-PLAN-AMENDMENTS.md` for the full breakdown.
- **What:** `02-BUILD-PLAN-AMENDMENTS.md` AM-19/AA-31 lists specific automatic checks the drafted Plan of Action should run before showing it to the seller: catching future-tense promises ("we will fix..."), blame-shifting language, vague time phrases ("recently", "soon"), a check that invoice dates are actually current, ASIN/case-ID extraction and normalization, and a dedicated root-cause category step.
- **Evidence:** `grep -rn "readinessAtSubmit|blame-shifting|vague-time" src/core/composer.ts` → none of AA-31's listed rules found implemented.
- **Fix:** add these as additional critic checks in `src/core/composer.ts`, alongside the existing checks (the `guarantee` word-ban pattern already lives there as a model to follow).
- **Owner:** **AI**, once M-4 (the full composer) work starts — this item explicitly "rides M-4" per the amendments doc, so it's correctly sequenced, not overdue.
- **Priority:** medium, tied to M-4 timing.

### B3. Analytics not wired anywhere
- [x] **Done 11 Sep 2026, commit `1eca47b`.** `src/lib/analytics.ts` + `AnalyticsScript.tsx`: Plausible script loader, inert until `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. Four funnel events wired: decode completed, intake started, purchase completed, outcome shared. Privacy page discloses it (commit `131dd7b`). **Still needed from the founder:** an actual Plausible or Umami account and a real domain value — the code is wired but measures nothing until then.
- **What:** D10 (north-star metric: paid Appeal Passes/week, funnel: decode → intake → purchase → outcome) requires the funnel actually be measured. `Planning/06-OPERATIONS/03-ANALYTICS-AND-METRICS.md` and Gate 3 both call for Plausible or Umami.
- **Evidence:** `grep -ril "plausible" src/` and `grep -ril "umami" src/` → 0 hits. (Note: a `posthog:up`/`posthog:down` pair exists in `package.json`, but that's a local **developer-tooling MCP bridge** for this coding session, not product analytics — do not confuse the two.)
- **Fix:** wire Plausible or Umami per D10/Gate 3 before the first real launch push, so funnel numbers exist from day one.
- **Owner:** **AI** for the wiring, **Founder** for the account signup (Plausible/Umami both need an account + a script tag/domain).
- **Priority:** should land before public launch — otherwise the first cohort of visitors is unmeasured.

### B4. No error monitoring (Sentry or equivalent)
- [ ] **Deliberately held off, 11 Sep 2026** — confirmed decision, not an oversight. No locked decision requires it; revisit once there's real user traffic to monitor.
- **What:** no crash/error-tracking service is wired into the app at all.
- **Evidence:** no Sentry package, no usage anywhere in `src/`.
- **Fix:** decide whether this is in scope before launch (it wasn't explicitly required by any locked decision D1–D10, so this is a founder call on priority, not a compliance gap).
- **Owner:** **Founder** decides priority; **AI** implements once approved.
- **Priority:** low-medium — nice to have before real users arrive, not blocking.

### B5. `@crxjs/vite-plugin` pin never added (AA-18)
- [ ] **Deferred, 11 Sep 2026** — confirmed correct to defer until extension work (M-7/M-8) actually starts.
- **What:** `02-BUILD-PLAN-AMENDMENTS.md` AM-15/AA-18 calls for pinning the `crxjs` Vite plugin version (with a WXT-fallback plan if crxjs breaks) ahead of the Chrome-extension build.
- **Evidence:** `grep -n crxjs package.json` → 0 hits. The WXT-fallback **decision text** is recorded (`docs/DECISIONS.md:30-31`), just not the actual dependency pin.
- **Fix:** nothing to do until extension work (M-7/M-8 per D3) actually starts — flagging only so it isn't forgotten when that phase begins.
- **Owner:** **AI**, when extension work starts.
- **Priority:** none right now — correctly sequenced after web revenue surface per D3.

### B6. `docs/BUILD_PLAN.md` (AA-10's named deliverable) was never created
- [x] **Resolved 11 Sep 2026, commit `9322ec3` — descoped, not written.** AA-10's checkbox now records this explicitly rather than leaving a silent gap.
- **What:** AA-10 asks for a working-spec-copy document (`docs/BUILD_PLAN.md`) with an "11.1 Cloud primary / 11.2 Nano opportunistic" section rewrite reflecting the actual Gemini-only LLM architecture. The **code side** of AA-10 (the task→model routing matrix in `src/lib/llm/gemini.ts`, per-task env overrides, `thinkingConfig.thinkingBudget: 0`, `withGeminiBreaker()` wrapping) is fully implemented — only the doc deliverable is missing.
- **Evidence:** `find . -iname BUILD_PLAN.md` → 0 hits anywhere in the repo.
- **Fix:** either create `docs/BUILD_PLAN.md` as a short doc pointing at the real architecture (`src/lib/llm/gemini.ts`), or decide the doc isn't needed anymore since the amendments file + `docs/DECISIONS.md` already capture the same information, and mark AA-10's doc-half explicitly descoped.
- **Owner:** **AI** (5-minute doc write) or a founder decision to descope it.
- **Priority:** low — the actual engineering is done; this is closing a paperwork loop.

### B7. Wave C-fix Tasks 8, 9, 10 never completed
- [x] **Resolved 11 Sep 2026, commit `9322ec3`.** `08-WAVE-C-HANDOFF.md` rewritten with every Appendix-B falsehood corrected inline. Task 8's testing substance already existed via a later pass (confirmed, not redone). Task 10 (optional Wave D-lite) intentionally skipped — nobody asked for it.
- **What:** `docs/handoffs/2026-09-07-wave-c-fix-prompt.md` Tasks 8 (e2e/screenshot hardening), 9 (rewrite `08-WAVE-C-HANDOFF.md` to remove false claims), and 10 (optional Wave D-lite) were never run as their own commits.
- **Evidence:** `git log --all | grep wave-c-fix` shows Tasks 0–7 as real commits (`dd76b68`…`79f2e23`), but no `wave-c-fix/task-8` or `task-9` commit exists. `e2e/app-gate.spec.ts` and `e2e/screenshots.spec.ts` do exist today, but they were built later by the **access-continuity pass** (`ed0b4cb`, `fcee50f`, `60923f8`) — a coincidental overlap, not Task 8 actually running.
- **Consequence still visible today:** `Planning/03-PHASE-2-BUILD/08-WAVE-C-HANDOFF.md` still says "Status: Complete" and still contains the exact false statements (wrong deleted-file list, wrong test counts, "all green" when Playwright had failures at the time) that the wave-c-fix prompt's own Appendix B flagged as needing correction.
- **Fix:** either run Tasks 8–10 properly now, or — since most of the underlying *work* landed through other passes since — do a smaller reconciliation pass: rewrite `08-WAVE-C-HANDOFF.md` truthfully (Task 9's actual goal) and tick `AA-28`/`AA-29` with real evidence (see Section D1), which closes the practical gap without repeating already-done work.
- **Owner:** **AI**.
- **Priority:** medium — mostly a paperwork/trust issue (a doc lying about test results), not a missing feature.

### B8. TRC-11 (license tampering control) is written for the wrong architecture
- [x] **Resolved 11 Sep 2026, commit `9322ec3`** — a scope note added explaining the web app's server-truth licensing is deliberate; the offline-cache requirements apply once the extension ships.
- **What:** `Planning/03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md` TRC-11 describes an offline-capable extension design (signed entitlement cache in `chrome.storage.local`, 72-hour offline grace period, clock-tampering detection). The actual web app's licensing (`src/lib/license.ts`) is **server-truth-only** — it just asks Supabase directly, no local cache, no offline mode.
- **Evidence:** `grep -n "HMAC|signature|passCases|sign(" src/lib/license.ts` → 0 hits.
- **Is this a bug?** No — for a web app with no offline extension yet, server-truth licensing is simpler and fine. The doc just hasn't been updated to say so.
- **Fix:** add a note to TRC-11 that the web-app launch uses server-truth licensing by design, and that the offline-cache requirements apply only once the extension ships.
- **Owner:** **AI** (doc edit only).
- **Priority:** low.

---

## Section C — 🧑 Founder-only decisions and actions

None of these can be closed by a coding session. Grouped by theme.

### C1. Confirm the shipped EU withdrawal-consent wording is what you actually approved
- [x] **Resolved 11 Sep 2026** — approved as shipped, logged in `docs/DECISIONS.md` (commit `131dd7b`).
- **What:** `legal/withdrawal-consent.md` (marked "draft for founder sign-off") proposes one checkbox wording. What's actually live in `src/content/legal.ts:157-160` (rendered via `src/components/pricing/ConsentRow.tsx:25`) is worded differently:
  - Draft proposed: *"I expressly consent to receive the digital Appeal Pass immediately, and I acknowledge that my right to cancel ... ends once delivery begins."*
  - Actually shipped: *"I ask AppealDeck to deliver the Appeal Pass immediately and understand that I lose my statutory 14-day right of withdrawal once delivery starts. AppealDeck's voluntary 7-day refund still applies."*
- **Why it matters:** D8 requires EU-withdrawal-compliant checkout consent, and the draft doc says the exact wording gets logged in `docs/DECISIONS.md` once you approve it — no such entry exists reconciling this specific text.
- **What we need from you:** confirm the shipped wording is fine (it reads correctly to a plain-language check — states what's lost, states the refund that still applies), or tell us what to change.
- **Priority:** high — this is a live legal/compliance checkbox real customers will see.
- **Decision (11 Sep 2026):** approved as shipped. Log this in `docs/DECISIONS.md` as the founder-approved final wording. *(Note: F3 below found a related but separate problem — the page promises a confirmation email that never actually gets sent. That's tracked there, not here.)*

### C2. Ratify AM-16 and AM-17 (the code is already built)
- [x] **Ratified 11 Sep 2026** — recorded in `02-BUILD-PLAN-AMENDMENTS.md` and `docs/DECISIONS.md` (commit `9322ec3`).
- **What:** these two amendments (evidence-first hardening + case-state machine / guided interview) were built and are working in code, but were never formally ratified by you together, per the standing note in `CLAUDE.md`'s blockers list.
- **Priority:** medium — closes a paperwork gap, doesn't block anything technical.
- **Decision (11 Sep 2026):** ratified. Record in `02-BUILD-PLAN-AMENDMENTS.md` and `docs/DECISIONS.md`.

### C3. Small copy/date decisions still parked
- [x] Terms "last updated" date → **2026-09-10**, done in commit `131dd7b`.
- [x] "Seller Central" gloss → added on first use on the home page, the compose page, and the shared expectations copy, done in commit `1eca47b`.
- [x] Hero headline 4 lines at 1280px — **decision: accept 4 lines, no code change**, 11 Sep 2026. The item only ever asked for a decision, and accepting the current rendering is the decision.
- [x] `.gitattributes` eol=lf → added, commit `c117826`.
- [x] `disconnected-chat!.txt` deleted, commit `c117826` (produces no diff — the file was never tracked).
- **Priority:** low individually — all five cleared in one pass, 11 Sep 2026.

### C4. Screenshot and walkthrough sign-offs — now unblocked
- [ ] Sign off the 42 screenshots from the visual-refresh-v3 pass (`docs/handoffs/screenshots/2026-09-10-visual/`). *(Founder-only — still open.)*
- [ ] Sign off the 12 screenshots from the earlier UI/UX polish pass (`docs/handoffs/screenshots/2026-09-10/`). *(Founder-only — still open.)*
- [ ] Do the AA-34 walkthrough with a real account: sign in, set a vault passphrase, run a sandbox Paddle checkout, confirm activation resumes into the draft. *(Founder-only — still open; the dev-account smoke test in C4 below verified the mechanism works, but doesn't substitute for the founder's own real-account pass.)*
- [x] **Done 11 Sep 2026, commit `be2cfd8`.** Ran the auth-gated screenshot captures (`/dashboard`, `/case`, `/compose`, `/vault`, `/billing`) using the `dev@appealdeck.com` test account — 66 screenshots total (11 routes × 3 widths × light/dark), all Playwright checks green. Spot-checked the dashboard and billing pages visually: both correct in light and dark; billing genuinely shows "Appeal Pass — active" with a real purchase date, proving the license mechanism works end to end through the UI. Also sign off the 66-file set here when convenient.
- **Priority:** medium — mostly closes out already-finished work.

### C5. Standing account/entity blockers (unchanged, carried forward)
- [ ] Phase-0 entity/individual-seller setup, Paddle merchant application, domain purchase, Wise/Payoneer payout setup. *(Founder-only, by design — no AI session can do this. Still open.)*
- [ ] Retrieve the in-force Agent Policy / BSA §19 text (B-08). *(Founder-only. Still open.)*
- [x] Add the two banned marketing rows ("agency results at 1/10th the cost", readiness-as-approval framing) to `Planning/07-REFERENCE/01-MARKET-EVIDENCE.md` §4. **Done 11 Sep 2026, commit `9322ec3`.**
- [x] Merge the 2 Sep competitor research deltas into `Planning/07-REFERENCE/02-COMPETITOR-DOSSIER.md`. **Done 11 Sep 2026, commit `9322ec3`** — new §1.5 (additional entrants/deaths) and §3a (why generated appeals get rejected — real evidence, directly justifies the AA-31 critic rules), plus a Seller Basics pricing anchor.
- **Priority:** the two remaining founder-only items gate real revenue (no Paddle account = no real checkout) — the highest-leverage items on this whole guidebook.

---

## Section D — 📝 Documentation corrections needed (no code changes)

### D1. `02-BUILD-PLAN-AMENDMENTS.md` — checkboxes that don't match reality
- [x] **Done 11 Sep 2026, commit `9322ec3`.** All eight checkboxes below ticked with evidence citations; the DoD running-status line refreshed; the AA-15/AA-18 numbering mix-up corrected.

Several items were marked `[ ]` (not done) when the code backing them was actually finished and tested:

| Item | What it covers | Evidence it's actually done |
| --- | --- | --- |
| AA-01 | Paddle migration (replacing an earlier Lemon Squeezy plan) | `src/app/api/webhooks/paddle/route.ts` implements the full Paddle path; `grep -ril lemonsqueezy src/` → 0 hits |
| AA-05 | Deadlines model | `src/core/deadlinesModel.ts` implements all six deadline kinds (`appeal_window`, `funds_appeal_eligible`, `funds_review`, `seller_challenge`, `aha_72h`, `indefinite_hold`), exercised by passing tests |
| AA-08 | EU checkout consent + 7-day refund | `src/components/pricing/ConsentRow.tsx` + `src/content/legal.ts:132,150,159` implement the consent checkbox and refund copy |
| AA-14 | Device activation cap | `src/lib/devices.ts` implements a 5-device cap with `over_cap` status; `src/lib/__tests__/devices.test.ts:265` passes |
| AA-15 | Cost-ceiling / circuit breaker for LLM spend | `src/lib/breaker.ts` implements spend cap, per-minute limits, circuit-open states |
| AA-16 | Local vault schema migration (Dexie v1→v2) | `docs/MIGRATIONS.md` + `src/core/vault/migration.test.ts` — a 10,000-record migration harness passes live |
| AA-28 | Wave C app-confidence UI pieces | `PoaSection.tsx`, `BeforeYouSubmitChecklist.tsx`, `Stepper.tsx`, `AuthCard.tsx`, `VaultLockedState.tsx` all exist and are wired into `ComposeView.tsx`/`InterviewFlow.tsx`/the auth pages; `CLAUDE.md` itself already calls Wave C "complete" |
| AA-29 | Copy moved out of components into `src/content/*` | `src/content/app.ts` and `src/content/auth.ts` exist and are wired; the banned-phrase sweep (`seamless`, `privacy-first`, `trust us`, `secure checkout`, `AI-powered`, `hassle`) already returns 0 hits |

Also: the file's final "Definition of done" running-status summary line is frozen at a 5 September snapshot and should be refreshed to reflect the above, plus AA-29's inline annotation ("app + auth strings still inline") should be removed since it's no longer true.

**Two items correctly stay unchecked** but for a different reason than might be assumed:
- **AA-10** — the code side (Gemini task-routing matrix) is done, but the specific named deliverable (`docs/BUILD_PLAN.md`) doesn't exist — see B6 above.
- **AA-18** — the crxjs pin genuinely hasn't happened — see B5 above.

**Owner:** AI. **Priority:** low-effort, meaningfully improves how accurately the tracking doc reflects reality.

### D2. `08-WAVE-C-HANDOFF.md` needs its truthful rewrite
- [x] **Done 11 Sep 2026, commit `9322ec3`** — see B7 above for detail.

### D3. `CLAUDE.md` blockers section has a stale line
- [x] **Done 11 Sep 2026.** The stale "push master" line is gone; `CLAUDE.md` §4 rewritten with a full session summary and current blockers.

### D4. `docs/handoffs/SESSION-START-PROMPT.md` needs repointing
- [x] **Done 11 Sep 2026.** Repointed at this guidebook, with an explicit note that no dedicated next-pass prompt exists yet for the AA-31 remainder — a fresh session's first job is to write one once the founder picks the direction.

### D5. `AGENTS.md` is frozen at 8 September
- [x] **Done 11 Sep 2026, commit `9322ec3`.** Header refreshed, test count corrected (362 in 39 files), CI description fixed, the stale Dev-user walkthrough rewritten for the AM-21 header/redirect behavior and this session's license grant.

### D6. Hosting-architecture docs still describe Cloudflare Pages + Supabase Edge Functions
- [x] **Done 11 Sep 2026, commit `9322ec3`** — all seven files corrected to the real Vercel single-host architecture.
- The actual, decided, and built architecture (4 September decision, recorded in `CLAUDE.md` §4) is **Vercel single-host** — confirmed by `vercel.json`, `src/middleware.ts`, `src/lib/urls.ts`, and `docs/DEPLOYMENT.md`. Several planning docs still describe the earlier Cloudflare Pages + Supabase Edge Functions plan as current, and in two cases actively argue against the architecture actually in use:
  - `Planning/07-REFERENCE/04-UNKNOWNS-REGISTER.md` §1 — states flatly that Vercel's Hobby tier is "contractually non-commercial" and off the table. The app runs on Vercel Hobby by design, with its own documented upgrade trigger once revenue justifies Pro.
  - `Planning/07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md` §1.1/§2.2 — calls Cloudflare Pages + Supabase Edge Functions "the plan of record"; its budget math is built on that stack.
  - `Planning/04-PHASE-3-LAUNCH/01-WEB-DECODER-LAUNCH.md` §3 — same superseded hosting prescription.
  - `Planning/05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md` §3.4 — repeats the same claim in passing.
  - `Planning/06-OPERATIONS/GDPR-KIT.md` §1 — lists "Cloudflare (hosting/DNS)" as a subprocessor; the actual host is Vercel.
  - `Planning/README.md` and `Planning/MASTER-CHECKLIST.md` (item 17) — both repeat the same hosting line in their overview sections.
  - By contrast, `Planning/07-REFERENCE/03-RISK-REGISTER.md` already correctly lists Vercel as a subprocessor — so this drift is inconsistent even within the same folder, not a single doc that missed one memo.
- **Fix:** update the hosting description in all seven files to Vercel single-host, referencing `docs/DEPLOYMENT.md` as the canonical source.
- **Owner:** AI. **Priority:** medium — mostly affects budget accuracy and any reader trying to understand the real infrastructure; not launch-blocking, but a founder or new hire reading these today would get a wrong picture.

### D7. `03-AI-SESSION-CONTINUITY.md` describes a process nobody follows anymore
- [x] **Done 11 Sep 2026, commit `9322ec3`.** §4 rewritten to describe the dated-topic-file + evidence-log convention actually in use, names `AGENTS.md` + `SESSION-START-PROMPT.md` as load-bearing; the stale path fixed across all nine affected files (`APPEALDECK_BUILD_PLAN_v1.0.md` deliberately left as-is — it's the documented-immutable historical record).

### D8. `Planning/MCPs Essential List.md` doesn't match the real tool config
- [x] **Done 11 Sep 2026, commit `9322ec3`** — corrected against the live `kilo.json`.

### D9. `04-REPO-AND-FIXTURE-CORPUS.md` describes a fixture layout that isn't what got built
- [x] **Resolved differently than first proposed, 11 Sep 2026, commit `1eca47b`.** Rather than rewrite the doc to describe the single-file layout, the deeper research (Section F2) found the doc's *sourcing rule* was the actually-valuable part — so `src/core/fixtures.ts` gained a `source` provenance note per fixture instead, closing the real gap without a doc-only fix or a pointless directory restructure.

### D10. `03-PAYMENTS-SETUP.md` describes an abandoned design
- [x] **Done 11 Sep 2026, commit `9322ec3`** — recorded as a considered-and-declined design.

### D11. `legal/*.md` drafts are stale and unused by the live app
- [x] **Done 11 Sep 2026, commit `131dd7b`.** Resolved as "sync the substance, keep the drafts as a founder-review record": the five missing privacy clauses and three missing terms clauses were merged into `legal.ts` (Section F3 found this was the right call — the drafts had real substance `legal.ts` was missing, not just different wording), and each `legal/*.md` file gained a pointer note marking `legal.ts` as the live source rather than being retired outright.

### D12. Two stray files at the repo root
- [x] **Done 11 Sep 2026, commit `c117826`.** Both `appealdeck.md` and `disconnected-chat!.txt` deleted.

---

## Section E — ✅ Confirmed clean, no action needed

Listed briefly so it's clear what was checked and found fine, not skipped:

- **Branding assets** — every file in `public/brand/` matches what's actually rendered, byte-for-byte, including the favicon, apple-icon, Open Graph image, and the `Logo.tsx` component's SVG geometry and brand color against `public/brand/mark.svg`. No dead references, no orphaned files.
- **Forbidden-sources compliance (CLAUDE.md §3)** — zero real hits for "superpower" anywhere in `src/`, `e2e/`, `scripts/`, or `.agents/` (the only hits found repo-wide are in planning docs quoting the rule itself). No commit in git history ever touched a forbidden file path. No Chrome-extension manifest, background script, or content script exists anywhere — consistent with the extension not having started yet.
- **`.gitignore`** — covers every local-only artifact class that should never be committed (`.env*` with the correct `.env.example` exception, `node_modules`, `.next`, `test-results/`, `playwright-report/`, key/credential file patterns). No gaps found.
- **Repo hygiene** — zero `TODO`/`FIXME`/`XXX` markers anywhere in `src/`. A 12-file sample of internal doc cross-references (paths cited in `CLAUDE.md` and `AGENTS.md`) all resolved to real files.
- **Domain topology code** — `src/lib/urls.ts` and `src/middleware.ts` match `AGENTS.md`'s own "Domain topology" section exactly, env-var names included.
- **D1–D10 (the locked decisions)** — nothing in the codebase contradicts any of them; the two things that look like exceptions (no Polar/Dodo code, no `PAYMENTS_PROVIDER` switch) are both correctly by-design, matching D2's "warm fallback, not yet integrated" framing.
- **Core evidence-first layer (EF-1 through EF-4)** — the evidence-requirements matrix, the action checklist and readiness scoring, the gap-draft vs. full-draft composer split, and the document-type router are all implemented and tested (`src/core/evidenceModel.ts`, `src/core/readiness.ts`, `src/core/composer.ts`, `src/core/letters.ts`). Only EF-5 (Section B1) is missing.
- **Severity gating and the read-only/no-Amazon-write promise** — verified system-wide. `isSeverityGated()` is consumed correctly by the classifier; there is no code path anywhere that writes to or submits on a seller's behalf to Amazon — the only Amazon-facing code is a plain link the user clicks themselves.

---

## Founder review, 11 Sep 2026

Sections A, C, and E approved as originally written. For B and D, the founder asked a sharper question than "is this old or new" — for each item, **does the old plan still hold real value we're missing, or has what we've already built already moved past it (or beyond it)?** That needed real inspection, not a guess based on file dates. Section F below is that inspection, done before anything gets built or edited.

---

## Section F — Deeper research pass on Section B and Section D (11 Sep 2026)

### F1. Section B items, re-examined for actual value and risk

**B1 — outcome-tracking schema.** Not an old idea going stale — it directly implements D6's own rule that win-rate claims can only ever come from real opt-in data. Nothing else in the product can honestly say "this works" without it. **Verdict: build it**, scoped tightly: structured fields only (case type, marketplace, document type, attempt count, readiness score, outcome, days-to-outcome), no case content, explicit opt-in moment, and it must not contradict the "we never see your case data" promise already on the privacy page and the expectations card — the capture point has to make clear this is a separate, optional, non-case-content record.

**B2 — composer critic rules.** Founder-ratified 9 Sep (AM-19). These are mechanical writing checks (future-tense promises, blame-shifting language, vague dates, stale invoice dates, missing ASIN/case-ID) — exactly the kind of thing that gets real Amazon appeals rejected. Not architecture, just additional validation next to the existing "no guarantee" check. **Verdict: build it**, no real risk found.

**B3 — analytics (Plausible/Umami).** This is the one most likely to feel like a "trust deficit" risk at first glance — but checked against what's actually promised: Plausible/Umami are cookieless and never see page content, only page-view/conversion counts on the marketing site. They cannot see anything inside the decoder textarea or the case vault. This isn't a borrowed old idea, either — **D10, a locked decision, already requires it** ("Analytics: Plausible or Umami + backend counts"). The gap is that it was decided but never built. **Verdict: build it**, and add one line to the privacy page disclosing it (see F3 below) so the promise and the practice stay in sync from day one.

**B4 — error monitoring (Sentry or similar).** No decision requires this, and it's not derived from any spec — it's a plain engineering nice-to-have. **Verdict: hold off** for now; revisit once there's real user traffic to actually monitor.

**B5 — crxjs pin.** Only matters once extension work starts. **Verdict: defer, same as Section A.**

**B6 — missing `docs/BUILD_PLAN.md`.** The engineering this document was meant to describe is already built and working (`src/lib/llm/gemini.ts`). Writing a document purely to satisfy a checkbox adds nothing. **Verdict: mark as intentionally skipped** with a one-line reason, rather than write a document nobody will read.

**B7 — Wave C-fix Tasks 8–10.** Task 8's substance already landed through a later, different pass (`e2e/app-gate.spec.ts`, `e2e/screenshots.spec.ts`). What's still actually wrong is that `08-WAVE-C-HANDOFF.md` states things that were already proven false back on 7 September and never corrected — that's a live trust problem in the documentation itself, independent of any "old vs new" question. **Verdict: rewrite that one document truthfully**; skip re-running Task 8's testing work since it's redundant, and skip Task 10 (it was always optional) unless you want it.

**B8 — TRC-11 licensing-model mismatch.** Confirmed as a doc-only clarification — the web app's server-truth licensing is a reasonable design, the risk-control document just describes the wrong (offline-extension) architecture. **Verdict: fold into the Section D doc pass, no code change.**

### F2. The genuinely ambiguous Section D items, resolved by inspection

**D7 — the AI-session-continuity process doc.** The old doc prescribes creating one file per milestone. Actual practice — a dated, topic-named file plus an evidence log for every pass — is what made this entire audit possible in the first place: every commit, every gate result, every deviation is traceable because that pattern was followed. That's not a coincidence; it's the more useful convention, proven by two weeks of actual use. **Verdict: rewrite the doc to describe what's actually being done**, don't revert to the coarser one-file-per-milestone idea.

**D9 — the fixture-corpus layout.** This one had a real, easy-to-miss point in the old plan: it required every fixture to carry a one-line note on where its notice text came from (`SOURCES.md`) and explicitly forbade ever sourcing fixture text from a real seller's confidential documents or purchased freelancer work. Checked the actual file (`src/core/fixtures.ts`, 454 lines, 26 fixtures): it has **zero such notes**. The current single-file structure is genuinely fine to keep — it's simpler to maintain and nothing is lost by not splitting it into 26 folders. But the provenance record the old plan called for is a real, still-valuable safeguard that's currently just missing. **Verdict: keep the file as one file, but add a short provenance comment to each fixture** (public-forum-rewrite vs. fully synthetic) rather than rebuild the directory structure the old doc specified.

**D10 — the abandoned Paddle→Polar env-switch design.** `.env.example` already documents that this was a deliberate call: Polar isn't even integrated yet, so a switch that toggles between "Paddle" and "nothing" would be complexity with no present use. That reasoning holds up. **Verdict: update the doc to record the decision, don't build the switch.**

**D11 — the legal drafts vs. `legal.ts`.** This is where the deeper research actually found something. See F3 — the two aren't just differently worded, `legal.ts` is missing real substance the drafts had.

### F3. New findings from reading every clause side by side (not in the original audit)

Comparing `legal/privacy.md`, `legal/terms.md`, `legal/refund.md`, and `legal/withdrawal-consent.md` against what's actually live in `src/content/legal.ts` and the purchase flow, clause by clause, turned up real gaps — not stale wording, missing protection:

- **Privacy page is missing five things the draft had:** an international-transfers disclosure (Gemini/Paddle processing outside Pakistan), the GDPR-style rights list (access, rectification, erasure, portability, objection) with a 30-day response commitment, a 72-hour breach-notification commitment, an explicit retention statement for server-side submitted text, and a not-directed-at-under-18 clause. None of these are in `legal.ts` today. It's also missing any disclosure that notice text is sent to Google's Gemini for paid drafting — the draft had this, the live page doesn't mention Gemini at all.
- **Terms page is missing three things the draft had:** the severity-gating disclosure (some case types get routed to professional help instead of sold — part of the ethics-spine promise, currently unstated in the live Terms), a liability cap ("our liability is limited to what you paid" — this protects *you*, not just the customer), and a plain "we may update these terms" clause.
- **Refund page slightly overpromises the timeline:** the draft said refunds return "within 5–10 business days depending on your bank" — the live page just says "5 business days," which is a flatter, less hedged claim than what actually happens with bank processing. Worth softening back to the more honest version.
- **A promise on the live checkout is not actually kept.** `legal.ts`'s consent text says "You will receive a receipt and a copy of this consent by email" (`deliveryNote`), and this exact line is shown right on the purchase panel. Checked the codebase for any code that sends such an email: **none exists.** The Paddle webhook only writes a license record; it never sends anything. D8 itself requires "a permanent-form confirmation email" — so this isn't a nice-to-have, it's an already-locked requirement that's currently just a stated promise nobody is fulfilling.
- **The honest-expectations card renders in the wrong position.** `docs/handoffs`'s own design spec and D8's intent both call for the honest-expectations disclosure to appear **before** the pay button. On the actual `/pricing` page (`src/app/pricing/page.tsx`), the purchase card — consent checkbox and pay button included — renders first, and the honest-expectations card renders below it, after. A visitor sees the button before they see the disclosure.

None of this is about an old file being outdated. It's the opposite of the Section D pattern — here the **current, live version is thinner than what was drafted**, and in two cases (the unsent confirmation email, the card ordering) it doesn't match an already-locked decision (D8), not just an old draft.

**Recommended fix, once approved:** merge the five missing privacy clauses and three missing terms clauses into `legal.ts` (keeping its shorter, plainer voice rather than copying the drafts' wording verbatim), soften the refund timeline claim, move the honest-expectations card above the purchase panel on `/pricing`, and either build the confirmation email or remove the promise until it's built — building it is the better option since D8 already requires it.

---

## Status: complete, 11 Sep 2026

Every item in Sections A–D is resolved except the ones that were only ever going to be founder-only (Section A's deferred-until-extension item, C4's screenshot look-and-approve + the real-account AA-34 walkthrough, C5's account/entity setup) — those remain open by design, not by omission. Five commits carry the work: `1eca47b` (core features), `131dd7b` (legal content), `9322ec3` (planning corrections), `c117826` (cleanup), `be2cfd8` (screenshots). `CLAUDE.md` §4 has the full session summary. `master` is pushed and current with `origin`.

**What's left for the founder**, consolidated from every section above:
1. Apply `supabase/migrations/0008_outcome_events.sql` in the Supabase dashboard (30 seconds).
2. Sign up for Plausible/Umami and Resend when ready; add `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and `RESEND_API_KEY` to Vercel env — both features are fully built and inert until then.
3. Sign off the three screenshot sets (42 + 12 + 66 files) and do the real-account AA-34 walkthrough.
4. Decide the direction for the AA-31 remainder (ASIN/case-ID extraction, seller override, root-cause step, dated corrective-action UI, character counter) or name something else — a fresh session writes a proper task-by-task prompt first.
5. Everything already on the standing blocker list: Phase-0 entity/Paddle/domain accounts, the Agent Policy retrieval, and the `V:\Extension 2.3\` leaked-file cleanup (deferred to the extension project).

# Build Sequence — the authoritative week-by-week execution order for Phase 2

**Why this file exists / when to use it.** The technical spec at `reference/APPEALDECK_BUILD_PLAN_v1.0.md` defines WHAT to build (modules M0–M14, milestones M-1→M-8) but its original sequencing was extension-first and several of its facts are stale. This file is the authoritative ORDER of execution under the settled hybrid build decision (D3): platform-agnostic TypeScript core first, web revenue surface second, Chrome extension third. Read this file before opening the v1.0 spec; wherever the v1.0 spec conflicts with `02-BUILD-PLAN-AMENDMENTS.md`, the amendments file wins — this file already assumes every amendment is applied.

**Glossary (first use):** POA = Plan of Action (Amazon's required appeal document). MV3 = Manifest V3, Chrome's current extension platform. CWS = Chrome Web Store. MoR = Merchant of Record (payment provider that legally resells your product and handles VAT/sales tax — here Paddle primary). BSA = Amazon's Business Solutions Agreement; its §19 "Agent Policy" (effective 4 Mar 2026) restricts automated tools on Seller Central. SW = extension service worker. Nano = Gemini Nano, Chrome's built-in on-device model (`LanguageModel` API).

---

## 1. The hybrid build order (decision D3 — settled, do not reopen)

| Phase | Weeks | What ships | Why this order |
|---|---|---|---|
| **Core** | 1–4 | Platform-agnostic TypeScript core: notice parser → violation taxonomy + classifier → intake wizard logic → POA composer → adversarial critic, with the **corrected deadline model** (see §4 below). Zero Chrome APIs in this layer. | The same code powers both the web page and the extension; fixtures test it without any live Amazon account. |
| **Web revenue surface** | 4–5 | Free notice decoder + paid $199 composer live on the AppealDeck domain. Cloud Gemini Flash **paid tier** does the drafting; MoR (Paddle) checkout; license keys self-issued via Supabase. | First revenue with no store gate; catches mobile panic-searchers; revenue bridge if CWS review stretches weeks. [source: The Second Opinion.md] |
| **MV3 extension** | 4–8 | Panel decode → encrypted case vault → deadline alarms. **Paste-mode is the primary architecture.** DOM-harvest of Seller Central pages is a convenience layer gated on the BSA §19 full-text read. The POA-textarea injector ships LAST or never. | §19 makes page-access the compliance risk; paste-mode keeps full functionality with zero page access. |
| **Store + beta** | 7–8 | CWS submission (unlisted first), design-partner beta, public listing. | Manual review is likely (16 Seller Central host permissions + AI API); web surface already earns while the queue clears. |

Hard sequencing rules, non-negotiable:

1. **Nothing in the core layer may import a `chrome.*` API.** The core compiles for web and extension from one source tree.
2. **The web decoder + paid composer go live before the extension is feature-complete.** If a scheduling conflict arises, the web surface wins.
3. **DOM-harvest code is not merged until the founder has retrieved and read the full BSA §19 / Agent Policy text** (it sits behind seller login — reachable via the founder's own Amazon Individual seller account or a design partner's read-only secondary-user invite with written consent). If the read is bad, the extension de-scopes to paste-only — the product still works completely.
4. **The injector (writing the finished POA into Amazon's appeal textarea) is the single riskiest feature.** It is built last, behind a feature flag, and only enabled after the §19 read supports it. Never any automation or auto-submit, ever.
5. **Gemini free tier never touches user data** (free-tier prompts train Google models). Paid tier via our backend only; free tier is for development fixtures only (D9).

---

## 2. Milestone map — v1.0 milestones under the hybrid order

The v1.0 spec's §15 milestone table remains the acceptance framework. The hybrid order re-times M-5's web-facing half and inserts one new milestone (M-W, the web launch). Acceptance gates are quoted verbatim from the spec; bracketed notes show amendments applied.

| Milestone | Hybrid week | Deliverable (hybrid) | Acceptance gate (quoted from v1.0 §15, amended) |
|---|---|---|---|
| **M-1** | 1 | Prerequisites complete: creds rotated, accounts opened, repo scaffolded, CI green, fixture corpus built | "All P-/A- items checked; `npm run build` produces loadable extension" [amended: A-2 is now Paddle/Polar per AM-01; A-6 is the active-access ladder per AM-04; additionally `npm run build:web` produces the deployable web bundle] |
| **M-2** | 1–2 | Messaging backbone (M0) + DB/crypto (M6 core) + offscreen parsing (M2); core parser started | "M0/M2/M6 acceptance tests pass" |
| **M-3** | 2–3 | Notice ingestion (M1) + classifier (M3) + decode UI — free tier end to end, **web `/decode` page first**, panel chip second | "Fixture accuracy ≥90%; paste parity; severity gating works" [note: BSA §19 sequencing — full text retrieved before end of Week 2 (B-08), ruling recorded end of Week 3 (B-15), always before any DOM-harvest code merges in Weeks 4–6 — AM-02] |
| **M-4** | 3–5 | Intake wizard (M4) + POA composer with critic/guardrails (M5) + PoaEditor + **corrected deadline model** (M7 date-math core) | "M4/M5/M7 gates; full case flow on 3 fixture types without dev tools" [deadline math per AM-03, not v1.0 Appendix D] |
| **M-W** *(new)* | 4–5 | **Web decoder + paid composer live on the domain**: MoR checkout, Supabase license issuance, cloud Gemini paid tier, cost ceiling + circuit breaker active | New gate: a stranger can decode a pasted notice free, pay $199 at the MoR checkout, receive a license key by email, and get a critic-passed POA draft — with the honest-expectations card shown before purchase and severity-gated types blocked from checkout. Circuit breaker verified with a simulated spike before the free tier is public (AM-12). |
| **M-5** | 5–6 | Licensing + payments in the extension (M11) + backend trim/deploy (M12) + telemetry (M13) | "test-mode purchase → unlocked case; revocation works; backend smoke green" [amended: Paddle sandbox replaces "LS test-mode" — AM-01; device activation limit live — AM-11] |
| **M-6** | 6–7 | Full panel + injector-behind-flag (M8) + popup (M10) + polish (M9 routes, M14 copy) + QA checklist | "Manual QA clean on live Seller Central (design-partner account); 'guarantee' grep = 0" [live access per the AM-04 ladder; injector flag stays OFF unless the §19 read supports it] |
| **M-7** | 7–8 | Store package (§14), landing + privacy policy live, unlisted CWS submission, design-partner beta | "CWS review passed or feedback addressed; 3 real cases decoded by partners" |
| **M-8** | 8 | Public listing + launch playbook execution | "Listed; first paid Appeal Pass" [likely already achieved via M-W on the web — the gate then reads: first paid Pass through the extension funnel] |

**Gate discipline:** do not start a milestone until the previous one's gate passes. The only permitted overlap is extension scaffolding (weeks 4–8) running parallel to M-W, because both consume the same finished core.

---

## 3. Week-by-week: who does what

Owners: **AI assistant** (the coding agent executing the v1.0 spec + amendments), **Founder** (accounts, approvals, money, community, Seller Central access, §19 text — role definitions in `../08-TEAM/`). "Week 1" is the first week of Phase 2, entered only after the Phase-0 blockers and Gate 1 checks pass (see `../01-PHASE-0-BLOCKERS/` and `../02-PHASE-1-FOUNDATION/`).

### Week 1 — prerequisites + core start (M-1, M-2 begins)

- [ ] **B-01** Confirm Phase-0 blockers closed: leaked Postgres/Supabase credentials rotated; the Collaborator & Contractor Policy (`../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`) adopted so it binds BEFORE any future contractor, VA, or expert gets credential access. — **Owner:** Founder · **Cost:** $0 (rotation) · **Deadline:** Day 1 · **Blocks:** everything below.
- [ ] **B-02** Scaffold `V:\AppealDeck\` repo per v1.0 §5, with one change: `src/core/` holds the platform-agnostic layer (parser, taxonomy, classifier, intake logic, composer, critic, deadline math) and both `src/web/` and the extension entries import from it. CI green on empty app. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-1 gate.
- [ ] **B-03** Build the fixture corpus (v1.0 §13.1): ≥4 realistic notices per v1 violation type + adversarial fixtures, each `{raw, expected.json}`. Include 60-day and 90-day stated windows, funds-hold and no-funds-hold variants, and one fixture whose text carries a legacy "17 days" phrasing (parse pattern only — never presented as current policy). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** M-3 gate, classifier accuracy measurement.
- [ ] **B-04** Open CWS developer account ($5) and start CWS trader verification (public contact details on the listing) — verification can take weeks, so it starts now, not at submission. — **Owner:** Founder · **Cost:** $5 · **Deadline:** Week 1 · **Blocks:** M-7.
- [ ] **B-05** Register domain; publish minimal live site with privacy policy + terms drafts (AI drafts, Founder publishes). — **Owner:** Founder · **Cost:** $10–30/yr · **Deadline:** Week 1 · **Blocks:** B-06 (MoR applications reject bare founders), M-W.
- [ ] **B-06** Apply to Paddle behind the live site + legal pages (D2). Paddle primary. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1, approval needed by Week 5 · **Blocks:** M-W checkout.
- [ ] **B-07** Create TWO Google Cloud projects for Gemini: `appealdeck-dev` (free tier, fixtures only) and `appealdeck-prod` (billing + spend cap; paid tier — user data only ever goes here). Enabling billing silently deletes the free tier on that project, hence two projects. — **Owner:** Founder · **Cost:** $0 setup; ~$0.02/case at usage (estimate) · **Deadline:** Week 1–2 · **Blocks:** cloud drafting, M-W.
- [ ] **B-08** Retrieve the full BSA §19 / Agent Policy text (behind seller login) — via the founder's own fresh Amazon Individual seller account (~1–2 weeks, free; start registration Day 1 to make the deadline) or a design partner's read-only secondary-user invite with written consent; deliver as PDF/text into `../07-REFERENCE/`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-3 (end of Week 2) · **Blocks:** any DOM-harvest code merge, injector decision, M-6 scope.
- [ ] **B-09** Provision hosting per AM-09 (settled default): **Cloudflare Pages (free)** hosts the static web decoder site; **Supabase Edge Functions** host ALL API work (MoR webhooks, LLM proxy, license verification). Supabase free tier at start → Pro $25/mo from first sustained sales. Vercel Hobby is contractually non-commercial — do not launch revenue on it; Vercel Pro ($20/mo) is NOT provisioned by default — it is a fallback only if porting the donor Express backend proves necessary at M-5, decided then by the AI assistant + Founder and logged (⚠ FOUNDER-DECISION only if it adds spend). — **Owner:** Founder (setup), AI assistant (deploy config) · **Cost:** $0–25/mo · **Deadline:** Week 1–2 · **Blocks:** M-W.

### Week 2 — foundation + free-tier plumbing (M-2 closes, M-3 begins)

- [ ] **B-10** Implement M0 messaging backbone, M6 DB/crypto core (with the §12.2 encryption fixes and the versioned encryption envelope from AM-13), M2 offscreen parsing. Pass the M-2 gate: "M0/M2/M6 acceptance tests pass". — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** M-3.
- [ ] **B-11** Implement the core notice parser (`src/core/noticeParser.ts`) and stage-1 deterministic classifier rules; wire the LLM stage-2 behind them. Deterministic regex facts always beat LLM output. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2–3 · **Blocks:** M-3 gate.
- [ ] **B-12** Continue the community presence begun in Week 1 (days 1–2 account setup, day 3+ replies — procedure at `../02-PHASE-1-FOUNDATION/05-COMMUNITY-PRESENCE.md`): named-founder accounts in r/FulfillmentByAmazon + seller Facebook groups, substantive answers only, no product mention yet. — **Owner:** Founder · **Cost:** $0 · **Deadline:** begins Week 1, daily onward · **Blocks:** launch distribution (Week 8 depends on ~7 weeks of credibility).
- [ ] **B-13** Run 5–8 paid auditions at $15–50 each (~$75–400 total) per `../08-TEAM/02-RECRUITMENT-KIT.md` §2 (fixture notice with the two traps: ambiguous window + missing invoice; fabricating the invoice = instant fail). Candidates sourced directly on Fiverr/Upwork; every contact founder-approved; orders stay on-platform. — **Owner:** Founder · **Cost:** ~$75–400 · **Deadline:** Week 2 · **Blocks:** template quality review, M-4.

### Week 3 — free tier end to end (M-3 closes)

- [ ] **B-14** Ship the free decode flow end to end: paste a notice → parsed facts → classification → severity gating → decoded summary. Web `/decode` page is the first UI; the extension panel chip reuses the same core later. Pass the M-3 gate: "Fixture accuracy ≥90%; paste parity; severity gating works". — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 3 · **Blocks:** M-4, M-W.
- [ ] **B-15** Read the retrieved BSA §19 text (in hand by end of Week 2 per B-08); record the ruling in `docs/DECISIONS.md` by end of Week 3 — always before any DOM-harvest code merges (Weeks 4–6): (a) DOM-harvest allowed as read-only convenience? (b) injector defensible? De-scope accordingly. ⚠ FOUNDER-DECISION — the read is prepared by the AI assistant from the retrieved text, but the ship/kill call on DOM-harvest and injector is the founder's. — **Owner:** Founder (decision), AI assistant (analysis) · **Cost:** $0 · **Deadline:** end of Week 3 · **Blocks:** M-6 scope, extension host-permission set.
- [ ] **B-16** Retain one consultant for scoped template review (~$1–2k, from the recruitment kit ranking; mutual NDA first). — **Owner:** Founder · **Cost:** ~$1–2k · **Deadline:** Week 3–5 · **Blocks:** M-4 quality gate.
- [ ] **B-17** Install analytics (Plausible or Umami) on the web decoder; define the D10 funnel events: decoder session → decode completed → intake started → purchase → opt-in outcome. — **Owner:** Founder (account), AI assistant (integration) · **Cost:** $0–50/mo · **Deadline:** Week 3 · **Blocks:** weekly funnel review, price experiment measurement.

### Weeks 3–5 — paid core (M-4 closes) and web launch (M-W)

- [ ] **B-18** Implement intake wizard (M4), composer pipeline with critic + guardrails (M5), PoaEditor, and the corrected deadline model (§4 below) as `src/core/deadlinesModel.ts`. Pass the M-4 gate: "M4/M5/M7 gates; full case flow on 3 fixture types without dev tools". — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 5 · **Blocks:** M-W, M-5.
- [ ] **B-19** Stand up the backend minimum for M-W on Supabase Edge Functions (hosting per B-09): cloud LLM proxy (`reason` fn, paid-tier key server-side only), MoR webhook endpoint — a Supabase Edge Function — with signature verification + idempotency (see `03-TECHNICAL-RISK-CONTROLS.md` TRC-05), Supabase `licenses` table, `verify-license` endpoint, **daily spend cap + per-device rate limits + rules-only degradation** (AM-12). Sub-step before the checkout goes live: load-test ~100 fixture drafts against the paid Gemini tier; record the measured cost/case; set the TRC-08 rate limits and daily spend cap from the measured number, not a guess. — **Owner:** AI assistant · **Cost:** hosting per B-09 · **Deadline:** Week 4–5 · **Blocks:** M-W gate.
- [ ] **B-20** Go live: free decoder public, $199 Appeal Pass purchasable via the approved MoR, honest-expectations card before checkout, severity-gated types routed to the professional-help screen instead of checkout, 7-day voluntary refund policy + EU withdrawal consent in the checkout flow (AM-05). Gate note: Gate 3 is split — the revenue-critical Gate-3 checks (live checkout end-to-end, license revocation, cloud cost ceiling/circuit breaker, anti-piracy device limits, chargeback monitoring, honest-expectations + severity gating live) must pass BEFORE this checkout goes live; the remaining launch checks gate the M-8 public listing (see `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`). First revenue surface is OPEN. — **Owner:** Founder (go/no-go + copy approval), AI assistant (deploy) · **Cost:** MoR fees ~5% + $0.50/txn · **Deadline:** Week 4–5 · **Blocks:** revenue; SEO clock starts.
- [ ] **B-21** Publish the first SEO pages on the panic queries. Precondition: the one-hour Google Keyword Planner/Ahrefs verification happens in Week 2, before any SEO page is written (owned by `../05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md`); search volumes stay unverified and must not be quoted or bet on until that hour is done. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 5 (pages; keyword hour Week 2 per the SEO plan) · **Blocks:** organic acquisition.
- [ ] **B-22** ⚠ FOUNDER-DECISION — price experiment: $99 vs $149 vs $199 across the first ~20 sales is a legitimate test (brief, correction 2). Decide whether to run it or hold the $199 anchor; if run, decide the split before sale 1 so the data is clean. — **Owner:** Founder · **Cost:** $0 (forgone revenue risk) · **Deadline:** before first public sale · **Blocks:** pricing copy, MoR product setup.

### Weeks 4–8 — the MV3 extension (M-5, M-6)

- [ ] **B-23** Wrap the core in the extension: panel decode chip (paste-mode first), encrypted vault (M6 full), deadline alarms + notifications (M7 alarms on top of the core date math). DOM-harvest merges ONLY if B-15 ruled it in. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Weeks 4–6 · **Blocks:** M-6.
- [ ] **B-24** Extension licensing (M11) against the same Supabase `licenses` table: signed entitlement cache, daily revalidation, 72h offline grace, clock-tamper handling, device activation limit 3–5/key + self-service deactivation (AM-11). Pass the amended M-5 gate: "Paddle-sandbox purchase → unlocked case; revocation works; backend smoke green". — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 5–6 · **Blocks:** M-6.
- [ ] **B-25** Ask design partners for live Seller Central QA access (the AM-04 ladder: design partners first — asked Week 4 for access by Week 6, read-only secondary-user invite with written consent — then the founder's fresh Individual registration ~1–2 wks as fallback). Recruit 5 design partners with live violations to bank on 3 completions (free Pass barter; per `../04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md`). — **Owner:** Founder · **Cost:** $0–40 · **Deadline:** ask Week 4, access by Week 6 · **Blocks:** M-6 gate only (fixtures cover everything earlier).
- [ ] **B-26** M-6 polish: popup (M10), options routes complete (M9), M14 copy everywhere, remote-settings kill switch tested, staged-rollout plan written (AM-14 — staged rollout applies only once the install base exceeds CWS partial-rollout eligibility, ~10,000 users; below the threshold every release is effectively big-bang, substituted by hardened pre-release QA + the tested kill switch). Injector: build behind flag if and only if B-15 ruled it in; flag ships OFF. Pass the M-6 gate: "Manual QA clean on live Seller Central (design-partner account); 'guarantee' grep = 0". — **Owner:** AI assistant (build), Founder (live QA) · **Cost:** $0 · **Deadline:** Week 6–7 · **Blocks:** M-7.

### Weeks 7–8 — store, beta, launch (M-7, M-8)

- [ ] **B-27** CWS package: listing per v1.0 §14.2, paste-mode demo video for reviewers, one-sentence justification per host permission, data-disclosure form matching the actual §3 data flows. Submit UNLISTED as early as reviewable; expect manual review of 1–3 weeks (16 Seller Central hosts + AI API), which the live web surface absorbs. — **Owner:** AI assistant (package), Founder (submission) · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** M-7 gate.
- [ ] **B-28** Design-partner beta on the unlisted build: 3 real cases decoded end to end; collect testimonials and (opt-in) outcome data. Support channels + canned responses live before the beta opens. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 7–8 · **Blocks:** M-7 gate, listing copy.
- [ ] **B-29** Public listing + launch playbook (v1.0 Appendix E, with AM-06 marketing hygiene applied: no "zero competition", anchor $199 against verified $600–$5,000 human services, no win-rate claims without our own opt-in outcome data). Staged rollout 5%→25%→50%→100% applies only once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible); below the threshold the release is effectively big-bang, with hardened pre-release QA + the tested remote-settings kill switch as the substitute control. Pass M-8. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 8 · **Blocks:** Phase 3 (see `../04-PHASE-3-LAUNCH/`).

---

## 4. The corrected deadline model (build this, not v1.0 Appendix D)

The core deadline engine (weeks 1–4 work, `src/core/deadlinesModel.ts`) implements the AM-03 corrections. Full detail and rationale: `02-BUILD-PLAN-AMENDMENTS.md` AM-03. Summary the builder needs:

| Deadline kind | Rule |
|---|---|
| `appeal_window` | `noticeReceivedAt + statedDays` parsed from the notice text; ambiguous → shorter candidate + "verify in your notice" flag; missing → 90 (display as assumption). |
| `funds_appeal_eligible` | `deactivatedAt + 60 days` — sellers may file a separate funds appeal to disbursement-appeals@ from this point (policy change of Oct 2024). New kind; v1.0 lacks it. |
| `funds_review` | `deactivatedAt + 90 days` — a CHECKPOINT, never an automatic release. UI copy must never imply funds unlock at day 90. |
| Fraud-class holds | Indefinite: render NO countdown; show "indefinite hold — professional help recommended" state. |
| `seller_challenge` | LISTING_LEVEL violations only: the Seller Challenge stage (AHA-only, 3 uses per 180 days, ~48h decision; counter resets when AHA lapses or AHR < 250). AHA = Account Health Assurance; AHR = Account Health Rating. |
| Repetition warning | Warn on **novelty, not a wall**: at 3+ appeal attempts, warn that near-identical resubmissions risk a "no further consideration" lock. The old "~5-attempt wall" figure is retired. |

---

## 5. Standing rules for every week

- The AI assistant appends every non-trivial decision to `docs/DECISIONS.md` (v1.0 §0.4 convention).
- The word "guarantee" greps to zero across `src/`, the site, and the listing at every milestone, not just M-6.
- v1.0 §2.6 forbidden sources are absolute; grep every copied donor file for `superpower` — zero hits.
- Weekly founder review of the D10 funnel (paid Appeal Passes/week is the north-star metric).
- Competitive watch: SellerForge/Forge Companion checked weekly; findings noted in `docs/DECISIONS.md`.

---

## Definition of done

- [ ] Every milestone M-1→M-8 plus M-W passed its quoted acceptance gate, in the hybrid order, with no gate skipped.
- [ ] The web decoder + paid composer went live in Week 4–5 (or the slip was recorded in `docs/DECISIONS.md` with cause and new date).
- [ ] The BSA §19 read happened before any DOM-harvest code merged, and the DOM-harvest/injector ruling is recorded (B-15).
- [ ] All B-01…B-29 checkboxes are checked or explicitly descoped with a reason in `docs/DECISIONS.md`.
- [ ] `02-BUILD-PLAN-AMENDMENTS.md` was applied in full — spot-check: payments code contains no Lemon Squeezy references; deadline engine contains `funds_appeal_eligible`; §11 cloud path is first-class.
- [ ] First paid Appeal Pass recorded (web or extension funnel) and the funnel analytics show the full path.

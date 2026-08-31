# Build Plan Amendments — the authoritative delta over the v1.0 technical spec

**Why this file exists / when to use it.** The verbatim technical spec at `reference/APPEALDECK_BUILD_PLAN_v1.0.md` (dated 24 Aug 2026) is the module-level source of truth, but fifteen of its facts and decisions are stale or corrected by later research (The Second Opinion, 25 Aug 2026) and by independent web verification (25 Aug 2026). **A team following the v1.0 spec MUST apply every amendment in this file; where this file and the spec conflict, this file wins.** Where this file is silent, the v1.0 spec stands unchanged. The week-by-week order that assumes these amendments is `01-BUILD-SEQUENCE.md`.

**Glossary (first use):** POA = Plan of Action. MoR = Merchant of Record. CWS = Chrome Web Store. MV3 = Manifest V3. BSA = Amazon Business Solutions Agreement. AHA = Account Health Assurance (Amazon's free program: for Professional-plan sellers with Account Health Rating (AHR) ≥250, a specialist calls with a 72-hour window before deactivation). SP-API = Amazon's Selling Partner API. DSA = Digital Services Act (trader verification requirements for marketplaces). Dexie = the IndexedDB wrapper used for the local case vault.

---

## 1. Amendment index

| ID | Title | v1.0 sections affected | Nature | Source |
|---|---|---|---|---|
| AM-01 | Payments: Lemon Squeezy → Paddle primary; self-issued license keys | §2.2 A-2, §2.5, §3 diagram, §4, §9.2, §10-M11, §10-M12, §15 M-5 | REPLACE | The Second Opinion.md; VERIFICATIONS.md (verifier 4) |
| AM-02 | Compliance spine: BSA §19 / Agent Policy / Code of Conduct | §1.3, §3, §7.4, §10-M8, §12.4 | REWRITE + GATE | The Second Opinion.md |
| AM-03 | Deadline engine corrections | §7.3, §9.1, §10-M7, Appendix D | REPLACE | The Second Opinion.md |
| AM-04 | A-6 test account: active-access ladder | §2.2 A-6, §13.2 | REPLACE | The Second Opinion.md |
| AM-05 | Store & legal: trader verification + refund redesign | §10-M14, §14 | REPLACE + ADD | The Second Opinion.md; APPEALDECK — R&D MASTER REPORT.md |
| AM-06 | Marketing hygiene | §1.2, §10-M14, Appendix E | REWRITE | The Second Opinion.md; SYNTHESIS BRIEF corrections |
| AM-07 | LLM inversion: cloud paid tier is the primary quality path | §3 principle 2, §11 | REWRITE EMPHASIS | VERIFICATIONS.md (verifier 3) |
| AM-08 | Gemini free tier NEVER for user data | §2.2 A-5, §11.2 | ADD CONSTRAINT | VERIFICATIONS.md (verifier 3); APPEALDECK_STREAM3_LLM_AI_RESOURCES.md |
| AM-09 | Hosting: Vercel Hobby is non-commercial | §2.2 A-4 | REPLACE | SYNTHESIS BRIEF correction 6 |
| AM-10 | Competitive reality: the category is occupied | §1.2 | REPLACE | SYNTHESIS BRIEF correction 1 |
| AM-11 | Anti-piracy: device activation limits | §9.2, §10-M11 | ADD REQUIREMENT | APPEALDECK — R&D MASTER REPORT.md (MR-09, MR-21) |
| AM-12 | Cloud cost ceiling + circuit breaker | §10-M12, §11.2 | ADD REQUIREMENT | APPEALDECK — R&D MASTER REPORT.md (MR-30, MR-15); D9 |
| AM-13 | Dexie migration strategy before first schema change | §9.1, §10-M6, §12.2 | ADD REQUIREMENT | APPEALDECK_STREAM6_TECHNICAL_RISK.md (TR-10, TR-11, SK-T2) |
| AM-14 | Kill switch + staged CWS rollout as hard M12 requirements | §10-M12, §14.3–14.4 | HARDEN | APPEALDECK — R&D MASTER REPORT.md (MR-20) |
| AM-15 | Toolchain: crxjs v2.7.x confirmed; WXT fallback | §4 | CONFIRM + FALLBACK | VERIFICATIONS.md (verifier 3) |

---

## 2. The six Second Opinion amendments (in full)

### AM-01 — Payments: Lemon Squeezy → Paddle primary; license keys self-issued

**v1.0 says (§2.2 A-2):** Lemon Squeezy is the recommended MoR with its built-in license-key API; Stripe Checkout is the alternative.

**Corrected reality (verified 25 Aug 2026):** Lemon Squeezy is sunsetting in slow motion — still signing merchants, but its CEO steers everyone to Stripe Managed Payments (invite-gated, ~6.4% effective, the most expensive MoR). Do NOT build on it. **Paddle** (flat 5% + $0.50, deepest tax coverage) is the individual seller's primary rail. Two Paddle caveats: onboarding rejects pre-revenue founders unpredictably (apply Week 1 behind a live site + legal pages), and Paddle's Acceptable Use Policy prohibits human services — plus a 2025 FTC settlement makes its risk team wary of "account recovery"-flavored products, so expect extra scrutiny. MoR rules constrain the product: the $199 Appeal Pass must be **automated software output** (it is); the human Expert Review tier is NOT MoR-eligible and stays deferred (D7) or routes via separate rails only post-approval from a healthy account.

**Replace in the spec:**
- §2.2 A-2 → "Apply to Paddle in Week 1 behind a live site + legal pages. Paddle primary if approved; Polar is the warm fallback (its Pakistan payout runs via Stripe Connect cross-border — verify at signup); Dodo Payments (MoR, 4% + 40¢) is plan-C, application-ready but no account opened. No Stripe direct application (Stripe direct is unavailable to Pakistan sellers)."
- §2.5 env vars → drop `LEMONSQUEEZY_*`; add `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_APPEAL_PASS`, `PADDLE_PRICE_GUARDIAN_SUB` (and fallback equivalents behind a `PAYMENTS_PROVIDER` switch).
- **License keys are self-issued, not MoR-issued:** the Supabase `licenses` table (§9.2) is driven by MoR webhooks (`transaction.completed` etc. → upsert license, email key). The v1.0 `ls_customer_id`/`ls_order_id` columns become provider-agnostic `mor_provider`, `mor_customer_id`, `mor_order_id`. `verify-license` and entitlement flow in M11 are unchanged in shape.
- §10-M11 purchase flow → checkout URL is Paddle (or Polar) hosted checkout; webhook handling per `03-TECHNICAL-RISK-CONTROLS.md` TRC-05 (raw-body signature verification, 5-second response budget, idempotency by event id).
- §15 M-5 gate → "Paddle sandbox purchase → unlocked case" replaces "LS test mode".

- [ ] **AA-01** Apply the §2.2/§2.5/§9.2/M11 payment substitutions above throughout the codebase and docs; grep `lemonsqueezy|LEMONSQUEEZY|ls_` → 0 hits. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 (spec), Week 4–5 (code) · **Blocks:** M-W, M-5.
- [ ] **AA-02** Submit the Paddle application behind the live site. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-W checkout.

### AM-02 — Compliance spine: BSA §19 / Agent Policy / Seller Code of Conduct

**v1.0 says (§1.3, §12.4):** read-only posture justified by the Helium 10 / Jungle Scout precedent; content script harvests notice text; injector fills the appeal textarea on user command.

**Corrected reality:** Amazon's BSA §19 "Agent Policy" (announced 17 Feb 2026, effective 4 Mar 2026) — per third-party analyses — prohibits browser automation and Seller Central screen-scraping outside registered SP-API apps; Amazon's Conditions of Use separately ban scraping tools; Helium 10 killed its Seller Central automation extension in Jun 2026. The primary policy text sits behind seller login and is STILL UNREAD. Countervailing facts: Helium 10/Jungle Scout content scripts still run, SellerForge ships its Forge Companion extension anyway, analysts acknowledge the text is ambiguous, and the Ninth Circuit's Perplexity ruling (Aug 2026) puts "access" on the user, not the developer. The old "only the account owner can submit a POA" TOS quote is fabricated — never cite it; the real instruments are BSA §19 + the Seller Code of Conduct.

**Replace in the spec:**
- Compliance hierarchy (this is the architecture, not just posture): **(a)** web decoder + paste-mode = PRIMARY path and compliance spine — zero page access, full functionality; **(b)** extension DOM-harvest = convenience layer, merged ONLY after the full §19 text is retrieved (by the founder, before M-3 — see AA-03) and read; de-scope to a paste-only extension if the read is bad; **(c)** the POA-textarea injector = riskiest single feature, built last behind a default-OFF flag, ships only if the read supports it, or never; **(d)** NEVER any automation or auto-submit — unchanged and now near-mandatory.
- §12.4 rationale → cite BSA §19 + Agent Policy + Code of Conduct; delete the fictional owner-only-POA rationale; assess §19's self-identification duty for automated tools during the read.
- §7.4 precedent note → keep, but demote from "norm exists" to "contested precedent; paste-mode is the safety floor".

- [ ] **AA-03** Retrieve full §19/Agent Policy text (seller login — via the founder's own fresh Amazon Individual seller account, ~1–2 weeks and free, or a design partner's read-only secondary-user invite with written consent) and file it in `../07-REFERENCE/`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-3 · **Blocks:** DOM-harvest merge, injector, M-6 scope.
- [ ] **AA-04** Record the DOM-harvest + injector ruling in `docs/DECISIONS.md` after the read (see `01-BUILD-SEQUENCE.md` B-15, a flagged founder decision). — **Owner:** Founder · **Cost:** $0 · **Deadline:** end Week 3 · **Blocks:** extension scope freeze.

### AM-03 — Appendix D deadline engine corrections

**v1.0 says (§7.3, Appendix D):** `funds_review = deactivatedAt + 90d`; separate funds appeal "after 90 days"; community-reported rejection wall "≈ 5 attempts" with UI warning at 3+.

**Corrected reality:** since **Oct 2024**, a funds appeal (to disbursement-appeals@amazon.com) becomes ELIGIBLE at deactivation + 60 days; the 90-day mark is a checkpoint, and holds **never release automatically** (identity + fraud evaluation always intervenes); fraud-class holds are indefinite. Amazon launched a **Seller Challenge** stage (29 Sep 2025) for listing-level violations: AHA members only, 3 uses per 180 days, ~48-hour decision, counter resets when AHA lapses or AHR drops below 250. The "~5-attempt wall" figure is retired — the verified phenomenon is that near-identical resubmissions (lack of novelty) risk a permanent "no further consideration" lock, so the warning is about repetition-novelty and fires at 3+ attempts.

**Replace in the spec:**
- §9.1 `deadlines` kinds → `'appeal_window' | 'funds_appeal_eligible' | 'funds_review' | 'seller_challenge' | 'aha_72h' | 'custom'`.
- Appendix D formulas →
  - `appeal_window.dueAt = noticeReceivedAt + statedDays` (parsed; ambiguous → min(candidates) + "verify in your notice" flag; missing → 90, displayed as an assumption).
  - `funds_appeal_eligible.dueAt = deactivatedAt + 60d` (NEW — label: "funds appeal becomes available").
  - `funds_review.dueAt = deactivatedAt + 90d` (label: "funds review checkpoint — release is never automatic"; UI copy must never imply auto-release).
  - Fraud-class (`FORGED_DOCUMENTS`/fraud severity) → no countdown rendered; "indefinite hold" state.
  - `seller_challenge` (LISTING_LEVEL + AHA detected) → surface as an escalation option with its 3-per-180d budget and ~48h decision expectation, not as a countdown.
- §7.3 rejection-loop text → replace the "wall ≈ 5 attempts" sentence with: "near-identical resubmissions risk a permanent 'no further consideration' lock; the UI shows attempt count and a repetition-novelty warning at 3+ attempts (the composer must materially change root-cause/evidence framing on resubmission)".
- Parser: keep "17 days" ONLY as a legacy soft-deadline parse pattern for old notices; never present it as current policy.

- [ ] **AA-05** Implement `src/core/deadlinesModel.ts` to this table; unit tests cover all six kinds + the fraud no-countdown state. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with M-4 · **Blocks:** M-4 gate.

### AM-04 — A-6: ACTIVE Seller Central access ladder

**v1.0 says (§2.2 A-6):** "Any seller account (even inactive) gives access to Account Health / Performance Notifications page structure."

**Corrected reality:** wrong — dormant accounts are walled behind re-verification and show nothing useful. Live-page access requires an ACTIVE account, acquired in this order: **(1)** design partners under **written read-only consent** (secondary-user invite) — ask Week 4, access by Week 6; **(2)** the founder's own fresh Individual-plan registration (~1–2 weeks; shows a clean page only — useful for page structure, not violations). Fixtures (§13.1) cover milestones M-1→M-5 without ANY live account; live access blocks only the M-6 gate.

- [ ] **AA-06** Execute the ladder; document which rung provided M-6 QA access. — **Owner:** Founder · **Cost:** $0–40 · **Deadline:** access by Week 6 · **Blocks:** M-6 gate only.

### AM-05 — Store & legal: CWS contact-details verification from Week 1 + refund redesign

**v1.0 says (§14, M14):** prepare listing during Milestone 6; terms recommend "7-day refund if no POA was generated; no refund after generation."

**Corrected reality:** (a) CWS requires verified contact details (name/business name, address, email, phone) on the listing — the process starts with the $5 developer registration in Week 1, not at submission, because verification can take weeks; (b) "no refund after generation" is effectively unenforceable for consumers — the withdrawal right for digital content (applicable consumer-protection law) requires explicit prior consent + permanent-form confirmation for digital delivery. Settled policy (D8): **7-day no-questions voluntary refund**, compliant checkout consent, fast refunds preferred over disputes — chargeback thresholds are existential for a MoR relationship.

- [ ] **AA-07** Start CWS registration + contact-details verification. — **Owner:** Founder · **Cost:** $5 · **Deadline:** Week 1 · **Blocks:** M-7.
- [ ] **AA-08** Implement checkout consent flow (explicit prior consent + permanent-form confirmation) and the 7-day voluntary refund policy in terms + refund handling SOP; delete every "no refund after generation" phrase from spec-derived copy. — **Owner:** AI assistant (implementation), Founder (policy sign-off) · **Cost:** $0 · **Deadline:** before M-W goes live · **Blocks:** M-W, MoR compliance.

### AM-06 — Marketing hygiene

**v1.0 says (§1.2):** "Zero dedicated appeal-drafting extensions exist on the Chrome Web Store (verified Aug 2026)" and cites consultant fees of "$500–$3,000".

**Corrected reality:** both stale. See AM-10 for the competitive correction. The verified consultant anchor (25 Aug 2026) is **$600–$5,000** per case (Thompson & Holt ~$600 third-party-cited at the floor; ecommerceChris $1,500/ASIN and $4,000–$5,000/account at the ceiling; The Appeal Guru $1,495/$2,495), with a real panic premium (+$1,000 for 24-hour service).

**Rules for ALL copy, listings, and planning docs:**
- Retire "zero competition" / "first" / "only" everywhere.
- Anchor $199 against the verified $600–$5,000 human-service range.
- NEVER publish win rates or success percentages without our own opt-in outcome data (there is none at launch; competitor "93–99.8%" marketing figures are unverifiable and must not be echoed).
- The word "guarantee" appears nowhere user-facing (grep gate = 0 hits — already in v1.0 M14, now extended to marketing assets).
- Positioning line vs SellerForge: *they hold your account's keys in their cloud — AppealDeck works in your browser, on your case, for one fee.*

- [ ] **AA-09** Sweep all listing/site/launch copy against these rules before M-W and again before M-8. — **Owner:** Founder (approval), AI assistant (sweep) · **Cost:** $0 · **Deadline:** Week 4 and Week 8 · **Blocks:** M-W, M-8.

---

## 3. New amendments from the 25 Aug 2026 independent verification

### AM-07 — LLM inversion: cloud Gemini Flash (paid tier) is the PRIMARY quality path

**v1.0 says (§3 principle 2, §11.1):** "On-device AI first" — Nano is primary, cloud is fallback.

**Corrected reality (verifier 3):** the Prompt API is GA for extensions since Chrome 138 — but the hardware gate is steep (desktop only; 22 GB free disk; >4 GB VRAM GPU or 16 GB RAM + 4-core CPU; multi-GB download; model evicted when free disk <10 GB), and Nano's output quality is far below cloud-Flash class. For a $199 deliverable, quality IS the product. **Inversion (D9 + brief correction 5):** cloud Gemini Flash on the **paid tier via our backend** is the primary quality path for the paid POA; **Nano is the opportunistic path** — free/private/instant triage, classification, and field extraction when hardware allows. Never assume Nano exists; feature-detect per session; design the UX so the cloud path is first-class, not a degraded fallback. The three-tier degradation survives with re-ordered emphasis: cloud (consented) → Nano (when available) → rules-only decode. The cloudConsent toggle, key-never-in-extension rule, and rules-only floor are unchanged.

- [ ] **AA-10** Rewrite §11 headings/emphasis in the working spec copy (`docs/BUILD_PLAN.md`): "11.1 Cloud (primary quality path)", "11.2 On-device Nano (opportunistic)"; route composer/critic to cloud by default for paid cases; route triage/classification to Nano when `availability() === 'available'`. — **Owner:** AI assistant · **Cost:** ~$0.02/case cloud (estimate) · **Deadline:** with M-4/M-W · **Blocks:** M-W quality bar.

### AM-08 — Gemini free tier NEVER for user data

**Constraint (verifier 3 + STREAM3):** free-tier Gemini prompts/outputs are used for Google training — a compliance and trust breach for seller case data. Production runs on the **paid tier only**, via the backend proxy (key never ships in the extension). Free tier = development fixtures only. Gotcha: enabling billing on a GCP project silently deletes that project's free tier — hence two projects (dev free / prod billed with spend cap). STREAM3's "cloud zero-cost by default" recommendation is superseded on this point.

- [ ] **AA-11** Two GCP projects created; CI/env guards ensure `appealdeck-dev` keys never appear in production env and no user-data path can reach the free-tier project. — **Owner:** Founder (projects), AI assistant (guards) · **Cost:** $0 setup · **Deadline:** Week 1–2 · **Blocks:** M-W.

### AM-09 — Hosting: Vercel Hobby is contractually non-commercial

**v1.0 says (§2.2 A-4):** reuse the existing Vercel deployment; implied $0 hosting through launch.

**Corrected reality:** Vercel's Hobby tier is non-commercial by contract — launching revenue on it risks takedown at the worst moment. Settled launch stack: **Cloudflare Pages (free)** hosts the static web decoder site; **Supabase Edge Functions** host ALL API work (MoR webhooks, LLM proxy, license verification). Supabase free tier at start → **Pro $25/mo from first sustained sales** (free projects pause after 1 week of inactivity and go read-only over 500 MB — unacceptable for the production `licenses` table once sales are sustained). Launch infrastructure cost: $0–25/mo. The Paddle/Polar webhook endpoint is a Supabase Edge Function; MoR retry behavior (Paddle: 60 retries over 3 days) plus idempotency covers cold starts. **Vercel Pro ($20/mo) is NOT provisioned by default** — it is a fallback only if porting the donor Express backend proves necessary at M-5, decided then by the AI assistant + Founder and logged (⚠ FOUNDER-DECISION only if it adds spend).

- [ ] **AA-12** Provision the settled launch stack: Cloudflare Pages (free) for the decoder + Supabase Edge Functions for all API work; upgrade Supabase to Pro $25/mo at first sustained sales. — **Owner:** Founder · **Cost:** $0–25/mo · **Deadline:** Week 2 · **Blocks:** M-W.

### AM-10 — Competitive reality: the category is occupied

**v1.0 says (§1.2):** zero dedicated appeal extensions exist.

**Corrected reality (refuted 25 Aug 2026):** SellerForge's **Forge Companion** extension (3.7★; free 25 msgs/week or $5/mo) already does violation triage, "draft my response", and POA help inside Seller Central; Listing Guard and Amazon Wholesale Reseller Toolkit (both 0 reviews) also name appeals. No dedicated full-deactivation→POA→deadline-tracker extension exists, but the category is OCCUPIED, and SellerForge's web platform ($49/mo unlimited appeals + a FREE no-login POA generator) plus AppealsPro.ai (free decoder + $79.99/$199/mo) squeeze the price point. **Positioning = depth** (full case management, corrected deadline engine, encrypted local evidence vault, per-case one-time pricing, local-first privacy) — never "first" or "only". Speed to launch is the primary defense; the free decoder is copyable, the extension-exclusive vault/deadlines are less so.

- [ ] **AA-13** Update §1.2 claims in the working spec copy; add weekly SellerForge/Forge Companion monitoring to the operating cadence (see `../06-OPERATIONS/`). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1, then weekly · **Blocks:** honest listing copy (M-7).

### AM-11 — Anti-piracy: device activation limits (new M11 requirement)

A $199 one-time key will be shared on forums (high likelihood per MR-09). New hard requirement for M11/M12: **server-side device activation limit of 3–5 devices per license key** with **self-service deactivation** (user can free a slot without support tickets). Schema: add an `activations` table (or `licenses.device_ids jsonb` with count enforcement in `verify-license`). Enforcement server-side only — client checks are advisory. Tone: community engagement over DMCA; convert serial sharers to affiliates where sensible.

- [ ] **AA-14** Implement activation limit + self-service deactivation; acceptance: 6th device activation is refused with a clear UI path to deactivate an old device. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** before M-5 gate · **Blocks:** Gate 3 ("anti-piracy controls active", see `../04-PHASE-3-LAUNCH/`).

### AM-12 — Cloud cost ceiling + circuit breaker (before the free tier is public)

Per-case cloud cost is trivial (~$0.02, estimate), but a mass-suspension wave hitting a FREE public decoder is an unbounded spend + abuse surface. New hard requirement (D9): the backend enforces **(a)** a daily $ spend cap (circuit breaker: when tripped, cloud endpoints return a typed "degraded" response), **(b)** per-device/IP rate limits, **(c)** graceful degradation to **rules-only decode** in every client (web + extension) — the product keeps working, less nuanced, never an error page. This must be live and tested BEFORE the free web tier is public (M-W).

- [ ] **AA-15** Implement cap + limits + degradation; acceptance: simulated spike trips the breaker and both clients degrade to rules-only visibly and recover automatically next budget window. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** before M-W public · **Blocks:** M-W gate.

### AM-13 — Dexie migration strategy BEFORE the first schema change ships

The encrypted vault is the product's memory; a botched migration is unrecoverable user harm. New hard requirement (from TR-10/TR-11/SK-T2 — full detail in `03-TECHNICAL-RISK-CONTROLS.md` TRC-04): **(a)** WebCrypto never runs inside Dexie `upgrade()` (IndexedDB transactions cannot await async work — it fails silently); re-encryption jobs run in `db.on('ready')` with `Dexie.waitFor()`; **(b)** every encrypted field carries a **versioned encryption envelope** so old and new formats co-exist during migration; **(c)** never change primary keys; breaking changes go via export → new DB → import; **(d)** the migration path is tested on a fixture vault of **10,000 encrypted records** before any schema-changing release ships.

- [ ] **AA-16** Write `docs/MIGRATIONS.md` (strategy + checklist) and the 10k-record migration test harness; both exist before the FIRST schema change after v1 ships. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with M-6 · **Blocks:** any post-launch schema change.

### AM-14 — Remote-settings kill switch + staged CWS rollout (hardened M12 requirements)

v1.0 §14.3–14.4 mentions `minSupportedVersion` and config-driven selectors as ideas; they are now HARD requirements with acceptance tests, because the likely failure moment is a mass-suspension wave (peak traffic + Amazon DOM churn simultaneously): **(a)** remote-settings kill switch — per-feature flags (DOM-harvest, injector, cloud path) + `minSupportedVersion`, fetched by the SW on a daily alarm and at startup, fail-safe defaults baked in; **(b)** content-script selector config is remote **data** (never remote code — MV3/CWS ban remote JS), enabling a 0-day harvest hotfix without a store review; **(c)** once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible), every CWS release uses **staged rollout 5% → 25% → 50% → 100%** with a halt criterion (error telemetry or support spike); below the threshold every release is effectively big-bang, and the substitute control is hardened pre-release QA + the tested remote-settings kill switch.

- [ ] **AA-17** Implement + drill: flip the kill switch in staging and verify every client degrades to paste-mode within 24h without an update. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** before M-6 gate · **Blocks:** M-7, Gate 2 rollback check.

### AM-15 — Toolchain: crxjs confirmed viable; WXT is the named fallback

**v1.0 says (§4):** Vite 6 + `@crxjs/vite-plugin`.

**Verified 25 Aug 2026:** crxjs was revived — v2.7.1 (Jul 2026), peer-deps Vite 3–8, MV3-first. The plan stands. Risk note: crxjs has a history of near-archival (bus factor); **WXT** is the more actively maintained alternative. Fallback rule: if crxjs goes >90 days without a release or breaks against a Chrome/Vite upgrade with no fix in 2 weeks, migrate to WXT (both wrap Vite; the platform-agnostic core is unaffected by construction).

- [ ] **AA-18** Pin `@crxjs/vite-plugin` ^2.7.x; note the WXT fallback rule in `docs/DECISIONS.md`. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 (scaffold) · **Blocks:** nothing (informational guard).

---

## 4. Facts in v1.0 that are RETIRED (do not repeat anywhere)

| v1.0 statement | Status |
|---|---|
| "Zero dedicated appeal-drafting extensions exist" (§1.2) | Refuted — see AM-10 |
| Consultant anchor "$500–$3,000" (§1.2) | Superseded — verified $600–$5,000 (AM-06) |
| Lemon Squeezy as recommended MoR (§2.2) | Dead — AM-01 |
| "Any seller account (even inactive)" for testing (§2.2 A-6) | Wrong — AM-04 |
| "No refund after generation" recommendation (M14) | Unenforceable in the EU — AM-05 |
| Funds appeal "after 90 days" (§7.1/§7.3/App. D) | Superseded — eligible at +60d since Oct 2024; release never automatic (AM-03) |
| "Community-reported wall ≈ 5 attempts" (§7.3) | Retired — repetition-novelty warning at 3+ (AM-03) |
| "On-device AI first" as the quality path (§3/§11) | Inverted for the paid deliverable — AM-07 |
| Helium 10/Jungle Scout precedent as ToS protection (§7.4/§12.4) | Demoted — BSA §19 changed the ground (AM-02) |

Also binding here: the playbook-wide banned-numbers list (invented win rates, "$2.3M ARR", "2M+ active sellers", "17 days to submit", "24–48h decisions", etc.) — none may appear in any document or copy derived from the spec. See `../07-REFERENCE/01-MARKET-EVIDENCE.md` §4.

---

## Definition of done

- [ ] All 18 action items AA-01…AA-18 checked, or descoped with a reason logged in `docs/DECISIONS.md`.
- [ ] The working spec copy (`V:\AppealDeck\docs\BUILD_PLAN.md`, per v1.0 §5) carries every amendment inline or by explicit pointer to this file; `reference/APPEALDECK_BUILD_PLAN_v1.0.md` itself remains UNMODIFIED as the historical record.
- [ ] Greps return 0 hits across `src/`, site, and listing: `lemonsqueezy`, `zero competition`, `no refund after generation`, `guarantee` (user-facing), any retired fact from §4 above.
- [ ] The deadline engine implements all six deadline kinds of AM-03 with passing unit tests.
- [ ] The M-W launch checklist confirms: paid-tier-only Gemini for user data, cost ceiling live, EU-withdrawal-compliant checkout, activation limits scheduled for M-5.

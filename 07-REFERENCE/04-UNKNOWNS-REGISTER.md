# 04-UNKNOWNS-REGISTER — What we still cannot know, and exactly how each unknown gets resolved

**Why this file exists / when to use it:** Six research rounds plus an independent verification pass (25 Aug 2026) answered most open questions — but not all. This file separates the two cleanly: §1 records what was unknown and is now settled (so nobody re-researches it), and §2 lists everything that genuinely cannot be known today, each with the concrete step that resolves it, an owner, and a deadline. The discipline that produced the banned-numbers list applies here in reverse: **an unknown stays an unknown until its de-risk step runs — it is never filled in with a plausible-sounding number.** Consult this file before making any claim or plan that depends on a §2 item.

**Terms:** BSA §19 = Amazon's Business Solutions Agreement "Agent Policy" (effective 4 Mar 2026) restricting automated/AI access to Seller Central. M-1…M-8 = the build plan's weekly milestones. MoR = Merchant of Record (Paddle/Polar — the reseller handling customer-country VAT). CWS = Chrome Web Store. Nano = Gemini Nano, Chrome's on-device AI model (Prompt API). crxjs = the Vite build plugin for Chrome extensions. UPL = unauthorized practice of law. VAT = value-added tax. NTN = National Tax Number, Pakistan's FBR taxpayer registration.

---

## 1. Resolved — do not re-research these

All resolved 25 Aug 2026 by the independent verification pass [source: VERIFICATIONS.md] unless noted; these answers override older documents.

| Former unknown | Resolution | Consequence |
|---|---|---|
| Is Lemon Squeezy a viable payment rail? | **Sunsetting, confirmed.** Still signs merchants, but its CEO steers everyone toward Stripe Managed Payments (invite-gated, ~6.4% effective — the most expensive MoR); documented payout freezes and support decay. | Do NOT build on Lemon Squeezy. Paddle primary / separate rails for any future human-service line (decision D2, `../00-DECISION/02-DECISION-LOG.md`). |
| Is @crxjs/vite-plugin dead? | **Revived.** v2.0.0 stable Jun 2025; latest v2.7.1 published 1 Jul 2026; Vite 3–8 supported; MV3-first. WXT remains the lower-bus-factor alternative for a greenfield repo. | The planned crxjs + Vite stack works today — no blocker; WXT swap is optional, not required. |
| Is Chrome's Prompt API (Nano) shipped for extensions? | **GA in stable Chrome for extensions since Chrome 138 — no origin trial.** But the hardware gate is steep: desktop-only, 22 GB free disk (model evicted under 10 GB), >4 GB VRAM or 16 GB RAM/4-core, multi-GB first download. | Nano is an opportunistic free/private path only; cloud Flash (paid tier) is the primary quality path for the $199 deliverable (decision D9). What share of real users have Nano remains open — see UN-5. |
| Does UPL precedent threaten the product? | **No precedent exists** of any UPL action against non-lawyer Amazon appeal consultants — a decade-old industry operating openly. Attorney-marketing sites overstate; real legal territory is IP disputes/arbitration, which we refuse and refer out. | The $2,000–8,000 pre-M-4 legal-opinion hard gate is superseded (row 7 in `../00-DECISION/02-DECISION-LOG.md` §3). A scoped review ($500–1,500) before US marketing spend is the pragmatic middle (Gate 3 check 40). Positioning defenses remain mandatory. |
| How hard is Pakistan individual seller setup? | **Verified trivial:** individual seller registration via CNIC/passport; personal payout account (Payoneer or Wise); all payment rails onboard individuals. No SECP incorporation needed at this stage. | Proceed with individual setup per `../01-PHASE-0-BLOCKERS/03-INDIVIDUAL-SELLER-SETUP.md`. |
| Can hosting be $0 through launch? | **False.** Vercel's Hobby tier is contractually non-commercial. | Launch stack: Vercel Pro $20/mo + Supabase Pro $25/mo (= $45/mo), or Cloudflare Pages/Workers free for the static decoder + Hetzner CX22 €4.50/mo alternative. |

---

## 2. Open unknowns — each with its resolution step

Numbered UN-1…UN-10, ordered by importance. Each entry: what exactly is unknown → why it matters → the de-risk step as an owned, deadlined action.

### UN-1 · The full BSA §19 / Agent Policy text — THE most important unknown

**Unknown:** the exact wording of Amazon's Agent Policy — specifically how it defines "automation"/"agent", whether reading a Seller Central page's text (DOM-harvest) falls in scope, and whether a user-commanded programmatic textarea fill (the POA injector) does. The primary text sits behind seller login; everything we "know" comes from third-party analyses that read it broadly, while Helium 10/Jungle Scout content scripts and SellerForge's Forge Companion still run openly.
**Why it matters:** it decides the entire extension architecture. The web decoder + paste-mode spine is safe regardless (zero page access, full functionality) — that is why decision D3 made it primary. The DOM-harvest convenience layer and the injector live or die on this text. Getting a user's account deactivated by our compliance tool is risk R-03 in `03-RISK-REGISTER.md` — the product-killing scenario.
**Decision rule (attached now, so no debate later):** favorable read → DOM-harvest ships as the convenience layer, injector considered last with counsel input. Ambiguous or adverse read → **de-scope to a paste-only extension** (kill criterion K8); injector cancelled; the product ships regardless on the web + paste spine.

- [ ] **1. Retrieve the full §19/Agent Policy text from behind seller login — via the founder's own fresh Amazon Individual seller account (~1–2 weeks, free) or a design partner's read-only secondary-user invite with written consent; AI assistant produces a written clause-by-clause assessment against DOM-harvest and injector mechanisms; founder decides per the rule above; assessment appended to `../00-DECISION/02-DECISION-LOG.md`.** **Owner:** Founder (retrieve + decide) + AI assistant (assess); External counsel optional ($0–500) · **Cost:** $0–500 · **Deadline:** **before M-3** (design freeze for DOM features); hard-verified at Gate 2 check 17 · **Blocks:** DOM-harvest, injector, CWS listing risk posture.

### UN-2 · Real search volumes for the panic queries

**Unknown:** actual monthly volumes and CPCs for "Amazon account suspended appeal", "Amazon plan of action template", "Section 3 suspension" and the other desperate queries. No public data exists; every prior number was inference.
**Why it matters:** the distribution thesis (SEO on desperate queries) is currently supported only by indirect evidence — 12+ firms targeting the queries, published panic-premium tiers. Spending on SEO or ads against unmeasured volume is gambling.

- [ ] **2. One hour in Google Keyword Planner (or an Ahrefs free trial): pull volumes + CPCs for the core panic keywords; record results as a new verified row in `01-MARKET-EVIDENCE.md` §1 and size `../05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md` accordingly.** **Owner:** Founder · **Cost:** $0 (1 hour) · **Deadline:** before any SEO or ad spend · **Blocks:** SEO plan sizing, paid acquisition, traffic projections.

### UN-3 · Paddle approval odds

**Unknown:** whether Paddle approves a pre-revenue individual seller selling an appeal-drafting tool — its onboarding rejects pre-revenue founders unpredictably, and its 2025 FTC settlement makes its risk team wary of "account recovery"-flavored products (risk R-06).
**Why it matters:** Paddle is the primary rail (D2); the answer cannot be researched, only obtained by applying.

- [ ] **3. Apply to Paddle in Week 1 behind the live site + legal pages, framed strictly as automated software (never "account recovery services"); open Polar the same week as the warm fallback — and verify at signup that Polar's Pakistan payout (Stripe Connect cross-border) actually works before relying on it. Dodo Payments (MoR, 4% + 40¢) stays plan C: application-ready, no account opened.** The application IS the de-risk step — no further research exists. **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 (Gate 1 checks 5–6); resolved by their decision, whenever it comes · **Blocks:** M-5 payments; kill criterion K1 governs a rejection.

### UN-4 · Whether any hired appeals expertise is real

**Unknown:** whether any candidate engaged to evaluate and strengthen Amazon appeals (template QC, expert review) actually has the expertise. Marketplace profiles prove marketing skill, not appeals skill; no candidate has a track record with us.
**Why it matters:** template quality is the product's core asset; relying on unverified expertise burns users' scarcest resource — their appeal attempts.

- [ ] **4. Paid fixture audition (for every appeals expert, per decision D5): a Section 3 fixture notice with two traps — an ambiguous deadline window and a missing invoice fact. Fabricating the invoice = instant fail; asking for it = top marks. Run 5–8 candidates, sourced directly on Fiverr/Upwork (plus any inbound bench candidates); consultant retainer (~$1–2k, week 3) provides the independent quality floor either way.** **Owner:** Founder · **Cost:** $15–50 per candidate × 5–8 candidates ≈ $75–400 (auditions) · **Deadline:** Week 2 · **Blocks:** template QC roles, any reliance on hired experts; agreement mechanics in `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`.

### UN-5 · Nano availability in the real user base

**Unknown:** what percentage of actual AppealDeck users' machines can run Gemini Nano (the hardware gate excludes many business laptops; no published telemetry exists anywhere).
**Why it matters:** decides how prominently the free/private on-device path can feature in product UX and copy. Architecture already assumes nothing (D9: cloud primary, rules-only fallback), so this is a tuning unknown, not a viability one.

- [ ] **5. Instrument Nano availability telemetry (availability() result, anonymized) from the first extension install; review the rate at the weekly decision review after the first 100 installs.** **Owner:** AI assistant · **Cost:** included · **Deadline:** telemetry live at first install; first read at ~100 installs · **Blocks:** honest "on-device AI" marketing claims, free-tier cloud-cost forecasting.

### UN-6 · Our actual win rate

**Unknown:** what share of AppealDeck-drafted appeals lead to reinstatement. **No data exists and none can exist until real cases complete.** Industry reality: most first appeals fail, even with $3k lawyers; the only published competitor figure is AppealsPro's transparent 23%.
**Why it matters:** win-rate claims are the market's signature scam (banned list, `01-MARKET-EVIDENCE.md` §4) and our honest posture is the differentiator. This number may NEVER be invented, extrapolated, or teased.

- [ ] **6. Build the opt-in outcome-reporting flow (funnel stage 5, decision D10) into the case lifecycle; publish nothing until the opt-in dataset is large enough that a percentage is honest (and publish it with its denominator when we do).** **Owner:** AI assistant (build) + Founder (publication decision) · **Cost:** included · **Deadline:** flow live by M-6; publication unbounded — whenever the data honestly supports it · **Blocks:** all outcome-based marketing, forever.

### UN-7 · The optimal price point

**Unknown:** whether $199 is the right Appeal Pass price. The verified anchors cut both ways: human firms at $600–5,000 make $199 look cheap; SellerForge's $49/mo unlimited appeals and an $11 one-shot generator squeeze from below.
**Why it matters:** first-session conversion is the business; a wrong anchor either leaves money on the table or kills conversion in the panic moment.

- [ ] **7. Price test $99 / $149 / $199 across the first ~20 sales; measure conversion per price; decide the standing price on data. ⚠ FOUNDER-DECISION: the test design — rotation method (time-boxed cohorts vs. split), sequencing, and whether early design-partner sales count — only the founder can weigh revenue risk against data quality here.** **Owner:** Founder (design + decision) + AI assistant (instrumentation) · **Cost:** $0 (opportunity cost only) · **Deadline:** design before M-5 (checkout build); test across the first ~20 sales · **Blocks:** standing price, all anchor-based copy, revenue model.

### UN-8 · CWS review duration under the 2026 enforcement surge

**Unknown:** whether manual review for an extension with Seller Central host permissions in a quasi-legal category takes days or weeks under the post-Aug-2026 enforcement wave. Published experience varies wildly; our specific profile (16 host permissions) has no precedent to consult.
**Why it matters:** it could delay extension distribution by weeks — which is exactly why revenue does not depend on it.

- [ ] **8. Submit early (unlisted, straight after M-6), answer reviewer questions same-day, and let the web decoder carry revenue meanwhile — the de-risk is architectural (decision D3), not informational.** **Owner:** Founder + AI assistant (listing materials) · **Cost:** $0 · **Deadline:** submission Week 7 (Gate 2 check 27) · **Blocks:** extension distribution only; never revenue. Detail: `../04-PHASE-3-LAUNCH/02-CHROME-WEB-STORE-SUBMISSION.md`.

### UN-9 · Pakistan tax obligations on MoR payouts

**Unknown:** whether MoR payouts from Paddle/Polar to a Pakistani individual are treated as Pakistan-source or foreign-source income; what registration (NTN) is required; and whether any withholding applies at the MoR level. This depends on the specific MoR contract and Pakistan's tax treaty network.

**Why it matters:** incorrect treatment leads to penalties or double taxation; the accountant call in Week 1 settles this before first revenue. Customer-country VAT is the MoR's job — the founder's own obligations are FBR income tax on MoR payouts (NTN, filer status) and provincial sales-tax registration only if the accountant confirms it applies.

- [ ] **9. One call with a Pakistan accountant before first revenue: confirm NTN registration, tax treatment of MoR payouts, and any withholding obligations; document the answer in `../00-DECISION/02-DECISION-LOG.md`.** **Owner:** Founder + External (accountant) · **Cost:** PKR 10,000–30,000 one-off (estimate) · **Deadline:** Week 1, before first payout · **Blocks:** clean Pakistan tax compliance; does not delay launch.

### UN-10 · Actual cloud LLM cost per draft

**Unknown:** the real paid-tier Gemini cost of a full AppealDeck draft (decode + compose + critic passes) on production prompts — the ~$0.02/full-case figure in `05-RESOURCE-STACK-AND-BUDGET.md` §1.2 is a unit-price estimate, not a measured number.
**Why it matters:** the D9 cost ceiling, the TRC-08 rate limits, and the daily spend cap must be set from a measured per-draft cost. Guessing risks either a cost blowout in a mass-suspension wave or needlessly tight limits that degrade paying users to rules-only decode.

- [ ] **10. Load-test ~100 fixture drafts on the paid Gemini tier before the M-W checkout goes live; the measured cost per draft sets the TRC-08 rate limits and the daily cap.** **Owner:** AI assistant · **Cost:** ~a few dollars of metered LLM usage (measure it — that is the point) · **Deadline:** before the M-W checkout goes live (Week 4–5) · **Blocks:** TRC-08 rate limits, daily spend cap, cloud-cost circuit-breaker settings.

---

## 3. Register discipline

- [ ] **11. When a de-risk step completes, move the item to §1 with its answer, date, and source — in the same week.** An unknown answered but not recorded will be re-researched by someone. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** continuous · **Blocks:** register integrity.
- [ ] **12. New unknowns discovered during the build are appended here with the full pattern (what/why/de-risk/owner/deadline) — never resolved silently with an assumption.** **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** continuous · **Blocks:** the no-invented-numbers discipline.

---

## Definition of done

- [ ] UN-1 (§19 text) is resolved and its written assessment sits in `../00-DECISION/02-DECISION-LOG.md` before any DOM-reading feature ships — this one cannot be waived.
- [ ] UN-2 (search volumes) is resolved before the first dollar or hour of SEO/ads investment.
- [ ] UN-3, UN-4, UN-7, UN-9, UN-10 each have their de-risk step executed by deadline, or a dated exception recorded in the decision log.
- [ ] No planning or marketing document anywhere contains a number that substitutes for an open §2 item (spot-checked at gate reviews alongside the banned-numbers grep in `01-MARKET-EVIDENCE.md`).
- [ ] Every resolved unknown has migrated to §1 with answer, date, and source; a newcomer can tell in one read what is known, what is not, and who is closing each gap by when.

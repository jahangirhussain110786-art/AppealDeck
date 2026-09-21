# Phase 4: what to build first, and what would justify continuing

Checked: 21 September 2026. Repository: `52cf0cf`. Status: Phase 4 complete; the four-phase research plan is now closed. Planning only. No implementation, no commits, no code changed.

## Plain-language result

The research set ends with a build order, a pilot, and a set of stop criteria. Four things to take away:

1. **Targeting Amazon US only is a good decision — but it is two decisions, and only one of them is handled.** Limiting the *marketplace* to Amazon US is well supported. Serving *sellers worldwide* on that marketplace is an audience fact with four consequences, three of them cheap and one of them serious. See §1.
2. **Do the small urgent things before the build phase.** Storage persistence, the two stale reference facts, and migration `0008` are days of work between them, and each one currently causes real harm: silent case loss, false marketing copy, and outcome data that can never accumulate.
3. **Build the best-evidenced slice first, then the breadth you asked for.** The three-door design stands exactly as decided in Phase 3. What I am proposing is only the *order*: the already-rejected seller's slice is mostly built, serves the best-evidenced need, and is the only thing neither Amazon nor a free tool does. It is the cheapest honest thing to sell.
4. **The pilot exists to kill one specific assumption.** Nobody in this market has been observed paying a one-time per-case fee for self-serve software. That is the business model. Every stop criterion below is built around finding out whether it is true, at the real price, before spending months building more.

---

## 1. "US sellers only" — is it a good decision?

Short answer: **yes for the marketplace, and the worldwide-seller part is not free.** The phrase bundles two separate things and they deserve separate verdicts.

### 1a. Marketplace = Amazon US only — keep it

| Reason | Basis |
|---|---|
| The entire verified evidence base is Amazon US | Phase 1: staff guidance on response types, invoice requirements, Seller Challenge eligibility, INFORM. Routing other marketplaces would mean routing on rules we have never verified |
| One policy regime, one notice language, one set of response forms | The router can actually be *correct*, which is the whole trust proposition |
| The price anchors only work here | The $600–$5,000 consultant range that makes $199 look reasonable is a US-market anchor |
| Largest enforcement surface | Where the cases are |
| It keeps scope small enough for one person to be right | Being narrow and accurate beats being broad and wrong in a market defined by distrust |

The existing behaviour — `marketplace !== "US"` routes to `clarification` — is honest, not lazy. Keep it.

### 1b. Sellers worldwide — four consequences, currently unhandled

**Price sensitivity. This is the serious one.** A worldwide seller base on Amazon US includes large cohorts in Pakistan, China, India, Vietnam and Bangladesh, where $199 is a materially different number than it is in Seattle. Phase 2 found *no observed evidence anywhere* that a seller pays a one-time fee for self-serve appeal software; low purchasing power compounds that risk.

The counter-argument is strong and worth stating plainly: those same sellers **cannot afford a $1,495 consultant at all**. For them the choice is not $199 versus $1,495 — it is $199 versus nothing, or versus a free template that is documented to fail. The product is arguably worth *more* to a Lahore seller than to a US one. That is the best argument the price has, and it only exists because of the audience the founder just named.

Actionable, and verified today: Paddle supports country-specific price overrides by ISO country code, applied ahead of automatic currency conversion. Regional pricing needs **no re-architecture** — it is a pricing decision, not a build. Treat it as a pilot variable (§4), not an assumption.

**English reading level becomes a core constraint, not an edge case.** EP-2 (the non-English seller) is currently filed as a P2 edge persona. With a worldwide audience on an English-only marketplace, a large share of buyers read English as a second language. This does **not** mean translating the Plan of Action — Amazon requires English and a mistranslated appeal burns the seller's scarcest resource. It means plain short sentences, a glossary on first use, and no idiom. That is a copy constraint costing almost nothing, and it should be promoted from P2 to a standing rule now.

**Support hours cannot be implied.** Phase 2 found "responsiveness" is one of four things reviewers praise immediately before recommending a service. A worldwide audience spans every timezone; a solo founder covers a few hours of it. The honest move is a narrow, stated, kept response window — never an implied 24/7.

**The audience is over-represented in the categories we exclude.** Non-US-resident sellers on Amazon US are disproportionately hit by identity and video verification, INFORM certification, and related-account enforcement — and all three are currently routed to `clarification` or `specialist`. So the worldwide-seller audience makes the Phase 2 scope tension **sharper, not milder**. The IP and related-account lane approved in Phase 3 partly answers this; identity verification and INFORM remain outside scope and should be a conscious decision rather than an accident.

**Verdict:** keep the marketplace decision, and treat the worldwide-audience consequences as four concrete items — one pricing experiment, one copy rule, one support promise, one scope question.

---

## 2. Build order

The Phase 3 three-door design is unchanged. Only sequencing is proposed here, and §2a offers the alternative in case the founder wants breadth first.

### Wave 0 — before any build phase (days, mostly not features)

| Item | Why it cannot wait | Owner |
|---|---|---|
| **A1 storage persistence** | The vault is IndexedDB and `navigator.storage.persist()` is never called anywhere in the repo. The waiting stage routinely exceeds seven days with no interaction, which is exactly the eviction condition. A seller can lose their case file through no fault of their own | Build |
| **Fix two stale reference facts** | The withdrawn AppealsPro win rate and the "Amelia does not write appeals" claim would both produce false marketing copy today | Docs (needs founder approval — they are existing planning files) |
| **Apply migration `0008`** | Until it is applied, no opt-in outcome row can ever be written, so the "win rates only from our own data" promise cannot begin accumulating evidence | Founder, ~30 seconds |
| **Plain-English + glossary rule** | §1b. Rides the existing AA-29 copy gate | Copy |

### Wave 1 — the pilot slice (smallest thing that can be sold honestly)

| Item | Depends on | Effort |
|---|---|---|
| I1 prior-submission comparison | Existing `submissions` + `previousRequests` | M |
| I2 attempt ledger | I1 | S |
| I3 clarification gets an exit | — | S |
| I7 honest waiting stage | A1 | S |
| Per-case scope statement at checkout (§3) | — | S |

**Why this first:** it serves the best-evidenced situation, it is the only capability neither Amazon's assistant nor a free generator can offer, most of the infrastructure already exists, and it is small enough to reach a real pilot quickly. It is also the slice whose failure teaches the most.

### Wave 2 — the breadth decided in Phase 3

A2 three doors on one spine · I4 decode returns a suggested protocol · I5 ASIN and case-ID extraction · A3 IP and related-account lane · A4 rights-owner outreach letter.

### Wave 3 — depth, gated on pilot evidence

I6 evidence package export · A6 conflict flags across evidence · A5 local document reading (largest effort, weakest demand evidence — it should not precede proof that anyone pays).

### Deferred, unchanged

Reminder delivery · cloud-drafted prose (founder-gated) · SP-API (D7, plus the unresolved question of whether a deactivated seller can authorize at all) · mobile vault parity · non-US marketplaces.

### 2a. The alternative order, if you want breadth first

Put A2 (three doors) in Wave 1 instead. **Gain:** a broader, more visible launch matching the decision you already took, and all three entry situations are servable on day one. **Cost:** more to build before any revenue signal, and the panic-hour door competes directly with Amazon's own assistant and free tools — so a weak result would not tell you whether the problem was the price, the product or the door. **Recommendation:** evidence-first. But this is your call, not mine, and it is a legitimate choice either way.

---

## 3. Per-case scope, support and refunds

Phase 2 found the category norm in live competitor copy is a flat fee covering assessment, the first appeal, **and unlimited follow-ups and revisions until resolution**. A Pass covering only the first draft is narrower than what buyers are being trained to expect. The buyer's real question — **"does my Pass cover the second rejection?"** — must be answered before checkout, in their words.

Proposed, for founder decision:

| Term | Proposal | Reasoning |
|---|---|---|
| Scope unit | **One case, including its revisions** — the loop through stage 9 is the normal path, not an upsell | The journey explicitly revisits stage 9. Charging per revision would punish the exact behaviour the product is for, and would make I1 feel like a toll |
| Duration | Bounded and stated (a defined window, not "forever") | Honest and finite beats vague generosity |
| New enforcement, new case | A different notice is a different Pass | Clear, defensible, easy to explain |
| Refund | D8's 7-day no-questions refund, honoured without argument | The one-star pattern in every competitor review set is: paid, then ghosted, no refund |
| Support | One stated response window, in stated hours, kept | §1b |
| Never | No success claim, no speed claim, no "approval" language, no conditional money-back framed as a guarantee | D6 |

---

## 4. The pilot

**Purpose:** falsify or support one assumption — that a seller will pay a one-time per-case fee for self-serve appeal software. Everything else is secondary.

| Parameter | Proposal |
|---|---|
| Who | Sellers on Amazon US arriving through the free decoder, all three doors once Wave 2 ships; Door C only if Wave 1 ships alone |
| Price | **The real price.** Do not discount — a discounted test teaches nothing about the price |
| Regional pricing | Run country overrides in two or three high-volume, lower-purchasing-power markets as a **separate arm**, so the price question and the market question do not contaminate each other |
| Size | Bounded: a fixed number of paid cases **or** a fixed number of weeks, whichever comes first — set before it starts |
| Refunds | Honoured immediately, counted as a signal, never argued |
| Ends | At the bound, not when the numbers look good |

**Measure (D10 funnel plus what this journey adds):**

- Decoder session → decode completed → intake started → purchase (existing D10 chain)
- Purchase → **submission actually recorded** — did they finish, or buy and stall? The single best quality signal
- Return at stage 9 — did they come back with Amazon's reply?
- Refund rate, and the reason where given
- Support contacts per case (this is the cost that scales worst)
- Opt-in outcomes, including losses
- Door split, and conversion by door
- Locale and mobile split (the EP-2/EP-3 instrumentation already specified)

**Do not measure or publish** any success rate until opt-in outcome data exists and is large enough to mean something (D6).

---

## 5. Cost assumptions

| Item | Assumption | Confidence |
|---|---|---|
| Paddle | 5% + $0.50 per D2 → a $199 Pass nets about **$188.55** | High (D2) |
| Cloud LLM | ~$0.02 per case under D9 — and currently **$0**, since cloud drafting is not enabled | High |
| Local document reading | $0 marginal; one-time bundle cost (~6 MB PaddleOCR vs ~15 MB Tesseract) | Medium |
| Cloud OCR, if ever | ~$10 per 1,000 pages; one major provider may use inputs for improvement absent an org opt-out, which disqualifies it | Medium |
| Email, analytics | Free tiers expected; both features already built and inert pending accounts | Medium |
| Hosting, database | Existing Vercel and Supabase | High |
| Refunds | Budget a realistic rate; D8 makes them cheap by design and cheaper than chargebacks | Medium |
| **Founder support time** | **The dominant real cost, and the one that scales worst against a worldwide timezone spread** | High |

Per-case marginal cost is close to zero. The binding constraint is founder hours, not infrastructure — which argues for a bounded pilot and a stated support window rather than an open-ended launch.

---

## 6. Launch gates

Nothing ships publicly until all of these hold. Most are pre-existing and unmet.

- [ ] Phase-0 credential rotation closed
- [ ] Migration `0008` applied
- [ ] A1 storage persistence shipped and its state visible to the seller
- [ ] The two stale reference facts corrected; the fact-check gate run on every public word; "guarantee" greps to zero
- [ ] Per-case scope and refund terms stated at checkout in the buyer's words
- [ ] Response window stated and operationally real
- [ ] Analytics and confirmation email live (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `RESEND_API_KEY`)
- [ ] Mobile web path verified on a real Android device end to end
- [ ] Accessibility and Lighthouse gates green on every new surface
- [ ] Screenshot sign-off and the AA-34 walk-through completed

---

## 7. Go / revise / stop

These thresholds are **placeholders the founder must set before the pilot starts**. A stop criterion chosen after seeing the data is not a stop criterion — it is a rationalisation. The shapes matter more than the numbers:

| Signal | Reading | Action |
|---|---|---|
| Decoder traffic converts to purchases at the real price, and buyers reach a recorded submission | The core assumption survives | **Go** — fund Wave 2, keep the bound on Wave 3 |
| People buy but do not finish | Demand is real, the journey is not | **Revise** — fix stages 4–6 before building anything new |
| People decode heavily and almost never buy | Price, positioning, or door problem | **Revise** — test the regional-pricing arm and the scope wording before concluding the price is wrong |
| Refunds high, or support hours per case unsustainable | The unit economics do not work for one person | **Revise** scope, or **stop** |
| Essentially no purchases at the real price despite real decoder traffic, across both pricing arms | The one-time per-case assumption is falsified | **Stop** — and the research was worth it for finding out cheaply |

---

## 8. Later experiments, once there is something to refer

Not before opt-in outcome data exists.

- **Consultant referral partnerships.** D6 already forces fraud, forged-document and child-safety cases to be routed away and never sold. Those referrals have real value to the firms that take them. This is a genuine two-way fit — but **take no fee for them**. A paid referral would corrupt the severity gate, which is the one thing that cannot be allowed to bend. Refer, disclose, charge nothing.
- **Referral incentives for sellers.** Only after outcomes exist, and never structured so that anyone is rewarded for claiming a win.
- **Paid placement.** Marketplace Pulse's single weekly sponsor slot is the one clean paid channel identified.
- **Communities.** Participate, never promote — the forums ban it and the penalty is real.

---

## 9. Assumptions still unresolved

| Assumption | Status | How it gets resolved |
|---|---|---|
| A seller will pay one-time per-case for self-serve software | **Unvalidated. The business model.** | The pilot |
| $199 is the right number for a worldwide audience | Unvalidated; newly sharpened by §1b | The pilot's regional-pricing arm |
| Local-first is a purchase reason, not a nice-to-have | Hypothesis | Pilot, post-purchase question |
| Organic search works as effectively the only open channel | Unmeasured — no volume or cost data gathered in any phase | A bounded keyword and cost check before any launch spend |
| A deactivated seller can authorize SP-API at all | Unknown | A bounded feasibility test, before any integration work |
| Amazon's assistant will not close the gap | Monitored, not settled | The existing monthly capability check |
| Identity verification and INFORM stay out of scope | Decided by default, not deliberately | §1b — needs a conscious founder call |

---

## 10. Closing note on the four phases

Phase 1 established what is true, and corrected several claims that earlier AI summaries had hardened into rules. Phase 2 found the market's shape and one uncomfortable hole where the business model's proof should be. Phase 3 mapped the journey and found a live data-loss risk that no feature discussion would have surfaced. Phase 4 ranks the work and defines what would end it.

Nothing in these four documents authorizes implementation. The next step is the founder's: set the thresholds in §7, decide the build order in §2 versus §2a, and answer the scope question in §9's last row.

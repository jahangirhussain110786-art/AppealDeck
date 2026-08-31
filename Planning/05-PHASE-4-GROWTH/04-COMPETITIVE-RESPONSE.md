# Competitive Response — Watchlist, Monitoring Ritual, and Pre-Agreed Scenario Playbook

**Why this file exists / when to use it:** Competitors will move — one of them (SellerForge) already ships most of the vision this product was born from. Deciding how to respond *during* a competitive shock produces panic pricing and copy that violates our ethics spine. This file fixes the responses in advance: who we watch, how we watch them (30 minutes a week, logged), and exactly what we do — and refuse to do — when each foreseeable scenario fires. Read the watchlist before writing any marketing copy; open the scenario section the day a trigger fires; never improvise a response that contradicts a pre-agreed one.

**Terms used here:** POA = Plan of Action, the structured appeal document Amazon requires from a suspended seller. CWS = Chrome Web Store. MV3 = Manifest V3, the current Chrome extension platform. SP-API = Amazon's Selling Partner API, the official registered-developer data channel. AHR = Account Health Rating, Amazon's 0–1,000 seller health score. AHA = Account Health Assurance, Amazon's free no-deactivation program for high-AHR Professional sellers. BSA §19 / "Agent Policy" = the section of Amazon's Business Solutions Agreement (effective 4 Mar 2026) that third-party analyses read as prohibiting browser automation and Seller Central scraping outside registered SP-API apps. Section 3 = the BSA's fraud/illegality clause. MoR = Merchant of Record, a payment provider (Paddle/Polar) that legally resells our product and handles global VAT.

All competitor facts below were **verified live on 25 Aug 2026** unless tagged otherwise; the verification transcripts override any older internal document. [source: VERIFICATIONS.md verifiers 1+2; APPEALDECK_COMPETITIVE_INTELLIGENCE.md]

---

## 1. The watchlist — who does what, as of 25 Aug 2026

### 1.1 Software competitors

| Competitor | Price | What they actually do | What they don't do (our gap) |
|---|---|---|---|
| **SellerForge.ai** — *primary threat* | Platform from $49/mo (unlimited appeals); **free no-login POA generator** on their site. Extension "Forge Companion": free 25 msgs/week or $5/mo Pro | 19-module seller platform: POA Builder grounded in SP-API read-only account data, escalation plans, document vault, AI assistant. Forge Companion (CWS, **3.7★**) runs inside Seller Central: violation triage, "draft my response" for support cases, POA help | No one-time per-case pricing (subscription only). Requires SP-API OAuth handover — data lives in their cloud, not local-first. POA is one module among 19, not a dedicated deactivation→POA→deadline workflow. No encrypted local vault, no deadline engine |
| **AppealsPro.ai** | Free unlimited notice analysis (decoder) · $79.99/mo Starter · $199/mo Pro · token billing (new letter ≈25 tokens, revision ≈15; top-up $34.99/1K) | Web-only: suspension notice decoder, appeal letter generator, 0–100 appeal strength scorer, response analyzer, case management, 94 violation-category knowledge bases. **Publishes a 23% win rate** (self-reported, but transparent — rare in this market) | No extension, no in-page presence. Monthly subscription only. No local-first storage, no deadline tracking, no encrypted case vault |
| **AppealAI (appealai.pro)** | $199/**month** (25 forensic audits) · $499/mo (100 audits) · enterprise custom | SP-API automated data pulls, evidence locker, unlimited POA generation, SOC 2 / GDPR claims. Sells to **agencies and consultancies**, not individual sellers | Not a consumer product. No web decoder for sellers, no extension, no one-time pricing. Note: they charge per *month* what we charge per *case* — do not treat their $199 as validation of ours |
| **AppealPath (appealpath.co)** | $11 to unlock a full POA draft (one-shot) (unverified — price from search snippet; site served a broken wildcard-SSL certificate on 25 Aug 2026) | Thin one-shot POA generator; signals of an unmaintained side project | Everything beyond a single draft: no case management, no deadlines, no vault, no support. Its existence matters only as a floor-price data point |

### 1.2 Minor CWS extensions (occupying the category, not competing on depth)

| Extension | Status 25 Aug 2026 | Relevance |
|---|---|---|
| **Listing Guard** (l-guardapp.com) | 0 reviews | Monitors account health, drafts Brand Registry appeals. Proof the category name is taken, not proof of traction |
| **Amazon Wholesale Reseller Toolkit** (extensionhub.app) | 0 reviews | Lists "suspension appeals" among 6 tools. Same: category squatter, no evident users |

The consequence of 1.1 + 1.2 together: **"zero competition" and "only tool" are dead claims** — retired from all copy permanently (see §4). No competitor ships a dedicated full-deactivation→POA→deadline-tracker with local-first storage and per-case pricing; the *combination* is our position, not any single feature.

### 1.3 Human-firm tier (our price anchor, and our severe-case referral pool)

| Firm | Verified price (25 Aug 2026) | Notes |
|---|---|---|
| **ecommerceChris** (Chris McCabe, ex-Amazon) | $1,500 ASIN reinstatement · $4,000 account / $5,000 24h-priority | Public prices on ecommercechris.com — the panic premium (+$1,000 for 24h start) is real and published |
| **The Appeal Guru** | $1,495 (72h) · $2,495 (24h priority) | Public prices; conditional partial-refund offer by case type |
| **Thompson & Holt** | ~$600/appeal (3rd-party cited; own site unreachable on 25 Aug 2026) | The low end of the named-firm tier |
| **Riverbend Consulting** | Quote-only (one user-reported fee: $2,250) | No public prices |
| **Amazon Sellers Lawyer** (Rosenbaum Famularo & Segall) | Quote-only (user-reported fees around $4,000) | Law firm; the escalation/litigation lane, not a software threat |
| **My Amazon Guy** | $1,000 (performance) / $2,000 (fraud, legal, IP) flat (source: APPEALDECK_COMPETITIVE_INTELLIGENCE.md, live fetch) | Agency; also useful as a referral candidate |
| **AMZ Sellers Attorney** | $1,500 standard appeal · $2,300 IP/related-account (source: APPEALDECK_COMPETITIVE_INTELLIGENCE.md) | Attorney-supervised; candidate for IP-dispute referrals |

This tier is where the **$600–$5,000** anchor in our copy comes from — every number in it is verified. It is also the candidate pool for the severe-case routing shortlist that `./02-COMMUNITY-PLAYBOOK.md` (action 4) requires: cases alleging fraud, forged documents, or IP disputes get referred here, never sold a Pass (decision D6, `../00-DECISION/02-DECISION-LOG.md`).

### 1.4 Amazon itself (the free incumbent)

| Program | What it does | What it does NOT do |
|---|---|---|
| **Account Health Assurance (AHA)** — free | For Professional sellers with AHR ≥250 held 6+ months: Amazon does not deactivate; an Account Health Specialist calls proactively and gives a 72-hour resolution window | Excludes fraud/deceptive/illegal-activity (Section 3) cases; excludes Individual-plan, new, and low-AHR sellers; lapses if the 72h window is missed. Does nothing for the already-deactivated |
| **Amelia** (AI assistant, US Seller Central) | Explains violations conversationally, reads policy case history, guides resolution workflows | **Does not write appeals or POAs.** Does not track deadlines, manage evidence, or help once the account is gone |

Consequence: decode-a-*warning* is partly commoditized by Amazon for healthy sellers. Our addressable core is the **already-deactivated + non-AHA population** (new sellers, Individual plan, low AHR, Section 3–flagged) — and the work Amazon will not do for them: the POA itself, deadlines, evidence, case management. Scenario S3 below is the pre-agreed response if Amazon moves further up this stack.

---

## 2. The weekly monitoring ritual (30 minutes, logged)

One 30-minute block per week, same weekday, output logged to a running `competitive-log.md` (repo or drive — one line per observation, dated). This is action 44 of the R&D master report backlog, made concrete:

**The 30-minute loop:**
1. (10 min) **Pricing pages:** sellerforge.ai/pricing, appealspro.ai/pricing, appealai.pro/pricing, appealpath.co. Log any change in price, tiers, or free-tier scope.
2. (10 min) **CWS listings:** Forge Companion (rating, review count, "last updated" date, screenshots/description changes), Listing Guard, Amazon Wholesale Reseller Toolkit, plus one fresh CWS search for "amazon appeal" / "amazon suspension" to catch new entrants.
3. (5 min) **Feature/announcement scan:** SellerForge blog/changelog and social, AppealsPro blog, one pass of r/FulfillmentByAmazon for competitor mentions.
4. (5 min) **Amazon:** Seller Central announcements + one forum scan for AHA/Amelia changes and any Agent-Policy enforcement chatter (feeds Scenario S4).

**Escalation rule:** if any observation matches a scenario trigger in §3, stop logging and open that scenario the same day. Everything else is just logged — no reaction, no copy changes, no pricing discussions mid-week.

- [ ] **1.** Create `competitive-log.md` with the four-section template above and the URL list — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** the ritual having a place to land
- [ ] **2.** Run the 30-minute ritual weekly, same weekday, every week from Week 1 onward — **Owner:** Founder · **Cost:** $0 (30 min/wk) · **Deadline:** ongoing · **Blocks:** scenario triggers being detected in time
- [ ] **3.** Take dated screenshots of all four software competitors' pricing pages + the Forge Companion CWS listing as the baseline snapshot — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** proving later what changed and when

---

## 3. Scenario playbook — pre-agreed responses

Each scenario: trigger → response → what NOT to do. These are settled; execute, don't re-debate.

### S1 — SellerForge copies the free decoder (EXPECTED — plan on it happening)

**Trigger:** SellerForge promotes its existing free POA generator on our search terms, adds a paste-in notice decoder, or extends Forge Companion with decoder-like triage. The R&D threat timeline rates this Medium-High within weeks of us showing traction — treat it as *when*, not *if*.

**Response:**
- Answer with **speed and depth, never price**. Ship the next per-violation-type depth increment (deadline model, evidence checklist per violation category, Section 3 handling) already on the roadmap — visible motion is the message.
- Sharpen the contrast in copy (see §4): they hold your account's keys in their cloud via SP-API OAuth; our decode runs local-first with no Amazon login, no OAuth, and one fee per case.
- Keep vault, deadline tracking, and case management as the paid-tier depth a free generic generator cannot follow into.

**Do NOT:** start a price war (their subscription economics beat ours in one — and $199 vs free was already the situation on day one, the free decoder is our own funnel top); disparage them by name in any channel (explicit ASGTG rule, and a bad look everywhere — `./02-COMMUNITY-PLAYBOOK.md` §3); claim "only" or "first" anything.

### S2 — A competitor adds one-time per-case pricing

**Trigger:** SellerForge, AppealsPro, or a new entrant launches a one-time "appeal pass"-style SKU (the CI report's Week-4 prediction is a free day-pass variant; a paid per-case SKU is the stronger form).

**Response:**
- First, verify it is real and shipping (buy it if cheap enough — the log entry pays for itself).
- Our per-case *pricing* was never the moat on its own; the stack is per-case pricing **plus** local-first privacy **plus** dedicated deactivation depth. Re-center copy on the parts of the stack the copier did not copy.
- ⚠ FOUNDER-DECISION: whether to run the pre-approved price experiment — testing $99/$149/$199 across the first ~20 sales is a legitimate, already-sanctioned experiment (synthesis brief, correction 2). It is a *response to data*, not a reflex to a competitor's launch. The founder decides if and when; nobody else triggers a price change.

**Do NOT:** cut the price the week a competitor launches (that reads as panic and reprices the anchor for everyone who already paid); add a subscription just because they have one (Guardian stays deferred until its monitoring feature ships — decision D7); match a feature list line-by-line in copy.

### S3 — Amazon expands Amelia to draft POAs (the existential scenario)

**Trigger:** Amelia (or any Seller Central feature) begins generating appeal/POA text, or AHA expands to cover deactivated or Section 3 sellers. Detected via the weekly Amazon scan or community chatter.

**Response:**
- Do not contest the drafting layer — **double down on everything around it**: case management, deadline tracking (the funds-appeal +60-day clock, response windows, the Seller Challenge stage), the encrypted local evidence vault, evidence checklists, and multi-attempt strategy (what to change when the first appeal fails, why near-identical re-submissions hurt from the 3rd attempt on).
- The structural bet, stated plainly so the team can hold it under pressure: **Amazon will not build a seller-side advocacy tool against its own enforcement process.** Amelia explains Amazon's position; nobody suspended trusts the counterparty's chatbot to argue their case. An adversarial-process assistant that organizes *your* evidence, on *your* machine, against *their* deadline — that lane stays open.
- Re-check the gate math in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`: if Amazon genuinely writes competent POAs for the already-deactivated *and* our paid conversion collapses, that is kill-criteria territory, not spin-it territory. Honest reads only.

**Do NOT:** rush out "better than Amelia" comparison marketing (invites Amazon's attention and ages badly); pivot the product in a week on an announcement before observing what the feature actually does (Amazon announcements routinely exceed shipped reality); make any claim about Amelia's quality we haven't tested ourselves.

### S4 — Agent-Policy enforcement wave against extensions

**Trigger:** Amazon enforces BSA §19 against seller-tool extensions — Forge Companion or a comparable extension pulled/blocked, sellers reporting deactivations tied to extension use, or an Amazon communication naming browser extensions.

**Response:**
- Execute `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`, scenario 5 — that file owns the operational hours-after steps (user comms, extension de-scoping or withdrawal decision).
- Strategically, this scenario is *pre-answered by architecture*: the **web decoder + paste-mode product is unaffected** — it never touches a Seller Central page, which is precisely why decision D3 made it the primary surface and compliance spine. Revenue does not depend on the extension.
- If the read is bad, de-scope the extension to paste-only or withdraw it, per the standing gate (DOM-harvest is gated on the §19 full-text read; the injector ships last or never — `../03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`).
- Note the second-order effect: an enforcement wave hits SellerForge's extension harder than ours (theirs is the engagement surface for a subscription; ours is a convenience layer). Do not celebrate publicly; do quietly point affected sellers at the paste-mode web app.

**Do NOT:** argue Amazon policy interpretation in public threads; keep shipping page-reading features into an active enforcement wave "because Helium 10 still does"; frame the crisis as a marketing opportunity in any user-facing channel while sellers are scared.

### S5 — A competitor publishes fake or unverifiable win rates

**Trigger:** Any competitor markets success-rate claims we can't verify ("98% success", "2,200+ reinstated") — the market already contains these, so the trigger is really *a direct competitor doing it at us*, or press/threads comparing us unfavorably to a claimed rate.

**Response:**
- **Do not match. Ever.** Our answer is our published honesty policy: we show opt-in outcome data with methodology when we have enough of it, and until then we show nothing (decision D6). AppealsPro's self-published 23% is actually useful here — cite it (accurately, attributed) as evidence of what honest numbers in this market look like, versus the 90%+ tier that verified reporting associates with the scam economy (DOJ bribery prosecutions 2020–2023; Seattle Times/Bloomberg "shadow bribery market" investigation, Jun 2026).
- One calm explainer on the site/FAQ: "Why we don't publish a win rate (yet)" — most first appeals fail even with expensive professional help; anyone quoting a high flat rate is describing their marketing, not your odds.
- In threads: one factual reply maximum, per `./02-COMMUNITY-PLAYBOOK.md` §3, then disengage.

**Do NOT:** invent, imply, or cherry-pick any success figure (banned by D6 and by the synthesis brief's banned-numbers list); accuse a named competitor of lying (legal exposure, channel bans); let a support macro or ad draft smuggle in "works most of the time" phrasing — that is a success-rate claim wearing a hat.

- [ ] **4.** Print/pin the five scenario trigger lines inside `competitive-log.md` so the weekly ritual checks against them mechanically — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** triggers being recognized instead of logged-and-forgotten
- [ ] **5.** Draft the "Why we don't publish a win rate (yet)" FAQ entry, honest-expectations tone, zero percentages — **Owner:** AI assistant, founder approves · **Cost:** $0 · **Deadline:** Week 4 (before the decoder is public) · **Blocks:** S5 response being one click instead of one panic
- [ ] **6.** Verify scenario-5 numbering/content against `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md` once that file is in force, and fix either file if they drift — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** the S4 handoff pointing at the right procedure

---

## 4. Positioning language bank

Copy is written from this bank, not improvised per channel. The grep gate from decision D6 ("guarantee" = 0 hits) applies to everything below and everything derived from it.

### Approved phrases

| Phrase | Where it works | Usage note |
|---|---|---|
| **"Your case never leaves your browser."** | Decoder page, extension listing, privacy sections | Only where literally true: the local rules-based decode and the vault. Where the cloud drafting path is involved, use the honest long form: *"decoding runs locally by default; cloud processing only with your explicit consent"* — consistent with `./03-SEO-CONTENT-PLAN.md` §7 |
| **"One fee for one case — no subscription."** | Pricing page, checkout, comparison contexts | The anti-SaaS wedge. Never pair it with a price attack on a named competitor |
| **Anchoring vs the human tier: "Reinstatement firms charge $600–$5,000 per case. AppealDeck is $199, one time."** | Landing page, ads, FAQ | Every number in the anchor is verified (§1.3). Update the range only from the weekly log, never from memory |
| **"No login, no OAuth, no access to your Amazon account."** | Privacy/trust sections, vs SP-API competitors | The local-first contrast with SellerForge/AppealAI, stated about *us*, not against *them* by name |
| **"Most first appeals fail — even with expensive professional help. We help you build the strongest first shot, not the fastest."** | Honest-expectations card, FAQ, community replies | The trust wedge itself. Required framing before purchase (D6) |

### Banned phrases (in addition to the synthesis brief's banned-numbers list)

| Banned | Why |
|---|---|
| "zero competition", "no competitors" | Refuted 25 Aug 2026 — the category is occupied (§1.1–1.2) |
| "only tool", "first ever", "the only extension that…" | Same; also unfalsifiable and one CWS search from embarrassment |
| "guaranteed", "guarantee" (any inflection) | Banned outright by D6, everywhere, including comments and support replies |
| Any success rate, percentage, or "works most of the time" | No claims until our own opt-in outcome data exists, and then only with published methodology (D6) |
| Any invented or unverified number | Banned-numbers discipline (synthesis brief). If a number isn't in §1 of this file or a verified sibling file, it doesn't go in copy |
| Insider framing: "contacts inside Amazon", "expedited treatment", "we know how Amazon thinks *internally*" | The scam tier's signature — federal-crime territory in this market and instant trust destruction (`./02-COMMUNITY-PLAYBOOK.md` §4.8) |
| Named-competitor attacks ("unlike SellerForge, who…") | Channel-ban risk (ASGTG explicit rule) and off-brand; contrast by describing ourselves, not them |

- [ ] **7.** Add the banned-phrase list to the copy checklist used before anything ships (landing page, CWS listing, ads, emails) and wire "guarantee" into the automated grep gate — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** every user-facing copy release
- [ ] **8.** Review the language bank against the weekly log monthly; retire any approved phrase that has drifted from verified fact — **Owner:** Founder · **Cost:** $0 (15 min/mo) · **Deadline:** monthly from Week 4 · **Blocks:** copy staying true as competitors move

---

## Definition of done

- [ ] Baseline snapshot (pricing pages + CWS listings, dated screenshots) captured in Week 1
- [ ] `competitive-log.md` exists, weekly ritual has run every week without gaps, entries dated
- [ ] All five scenario triggers pinned in the log and checked mechanically each week
- [ ] Zero reactive price changes, copy changes, or public competitor responses that bypassed this file's scenarios
- [ ] "Guarantee" grep gate live; banned-phrase list embedded in the pre-ship copy checklist; zero hits shipped
- [ ] Severe-case referral shortlist (from the §1.3 human tier) delivered to `./02-COMMUNITY-PLAYBOOK.md` action 4
- [ ] S4 handoff verified against the crisis playbook's actual scenario numbering
- [ ] Any competitor fact quoted in live copy re-verified within the last 60 days

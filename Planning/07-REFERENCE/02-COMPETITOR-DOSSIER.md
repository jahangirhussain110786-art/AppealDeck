# 02-COMPETITOR-DOSSIER — Full competitor profiles, differentiation matrix, and the moat statement

**Why this file exists / when to use it:** "Zero competition" is dead — live Chrome Web Store searches on 25 Aug 2026 refuted it. This file is the current, verified picture of everyone competing for the suspended seller's money: who they are, what they charge, what they cannot do, how fast they could copy our wedge, and where we still win. Use it when writing positioning copy (with `01-MARKET-EVIDENCE.md` as the fact gate), when the weekly competitive check runs (Gate 3 check 35 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`), and whenever a competitor move needs a response. All profiles verified 25 Aug 2026 [source: VERIFICATIONS.md]; these results override older competitive documents. §1.5 and §3a were merged in 11 Sep 2026 from the 2 Sep 2026 live-web recheck (`Planning/03-PHASE-2-BUILD/reference/2026-09-02-COMPETITOR-RECHECK.md`), on the founder's approval — see `docs/DECISIONS.md`.

**Terms used below:** POA = Plan of Action (the appeal document). SP-API = Amazon's official Selling Partner API — the sanctioned programmatic channel, requiring the seller to grant OAuth (delegated login) access to their account data. CWS = Chrome Web Store. MoR = Merchant of Record. AHA = Account Health Assurance; AHR = Account Health Rating (0–1000); Amelia = Amazon's Seller Central AI assistant. BSA §19 = Amazon's "Agent Policy" (effective 4 Mar 2026) restricting automated access. "Copyability" = how quickly the competitor could replicate AppealDeck's wedge (in-page panic capture, per-case one-time price, local-first privacy, encrypted vault, deadline engine). Response timelines are labeled judgments, not facts.

---

## 1. Software competitors

### 1.1 SellerForge.ai + Forge Companion — the primary competitor

| Attribute | Verified detail (25 Aug 2026) |
|---|---|
| Product | 19-module seller platform: POA Builder, Escalation Plans, Document Vault, AI Assistant, listing/ads/forecasting tools. Real-time AHR/ODR monitoring via **SP-API read-only** (Amazon SPN certified). **Free no-login POA generator** on their site. |
| Pricing | Core $49/mo · Growth $99/mo · Pro $199/mo · Agency $499/mo (annual ~$40.83–$415.83/mo). 7-day free trial, no card. **$49/mo includes unlimited appeals.** |
| Extension | **"Forge Companion: AI Amazon Seller Assistant"** — 3.7★ on CWS. Free 25 messages/week or $5/mo Pro. Listed features include "Draft my response" for support cases, "Triage my violations" for account health, and explicit "Appeal Support: AI-drafted responses to Seller Central cases, plan of action help." Works on 13+ marketplaces. |
| Team/funding | Founder David Gallo (New Orleans); likely <10 employees (low confidence — no headcount disclosure); no public funding found — bootstrapped or pre-seed at most (low confidence). |
| Weaknesses | Subscription-only (no one-time per-case option). Requires SP-API OAuth — the seller's account data lives in SellerForge's cloud. POA is one module among 19, not a depth play. No encrypted local vault, no dedicated deadline engine for deactivation cases. |

**Copyability of our wedge: MEDIUM-HIGH.** They can copy the free decoder and paste-mode POA quickly — they already ship a free POA generator and an extension. They cannot easily copy per-case one-time pricing (it cannibalizes their subscription model) or local-first storage (their architecture is cloud-central).

**Likely response timeline (labeled judgment):**

| Timeline | Likely response | Confidence |
|---|---|---|
| Week 1 after our launch | Monitors our CWS listing and pricing page; internally dismisses a solo-founder niche tool. | Medium (judgment) |
| Week 4 — if we show traction (CWS reviews, social mentions) | Promotes their existing **free POA generator** on the search terms we target; possibly adds a free "appeal day-pass" to Forge Companion. They have the SEO weight to outrank a new domain on "Amazon appeal" queries within weeks. | Medium-high (judgment) |
| Week 8 — if we reach ~100+ users or press | Launches a dedicated "Appeal" module or a standalone ~$49/mo appeal tier; could port their POA Builder into a structured intake wizard. | Medium (judgment) |

**Counter already decided:** web decoder live week 4–5 before the extension (decision D3); extension-exclusive depth (vault, deadlines) requires an install they don't have in this shape; the local-first contrast line — *they hold your account's keys in their cloud; AppealDeck works in your browser, on your case, for one fee.*

### 1.2 AppealsPro.ai — the free-decoder incumbent (web-only)

| Attribute | Verified detail (25 Aug 2026) |
|---|---|
| Product | Web app: Suspension Notice Decoder, Appeal Letter Generator, Appeal Strength Scorer (0–100), Response Analyzer, Case Management, 94 violation-category knowledge bases. |
| Pricing | **Free unlimited notice analysis** · Starter $79.99/mo · Pro $199/mo · Enterprise custom. Token billing: new letter ≈25 tokens, chat ≈5, revision ≈15; top-up $34.99/1K tokens. |
| Transparency | Publishes a **23% win rate** — transparent and low; it validates our honest-expectations posture and shows the market's real base rate. Never mock it; never counter it with an invented number. |
| Weaknesses | Web-only: no in-page Seller Central presence. Subscription-only. No local-first vault, no deadline tracking, no encrypted case storage. |

**Copyability: MEDIUM.** Their free decoder lane is where our web decoder lands — they own the SEO position today, which is why shipping the web decoder at week 4–5 matters. Their 94-category taxonomy and scoring rubric would take them nowhere new against us; our extension surface and vault have no equivalent in their architecture.
**Likely response (judgment):** an SEO/content battle for decoder queries and possibly a cheaper one-shot tier. They are the competitor most likely to feel the web decoder directly.

### 1.3 AppealAI (appealai.pro) — agency SaaS, not a consumer rival

| Attribute | Verified detail (25 Aug 2026) |
|---|---|
| Product | SP-API automated data pulls, forensic audits, Evidence Locker, unlimited POA generation; SOC 2; GDPR-ready. **Excludes regulated categories.** |
| Pricing | Starter **$199/MONTH** (25 audits, 1 user) · Growth $499/mo (100 audits, 5 users) · Enterprise custom. |
| Target | Amazon consultancies/agencies, not individual sellers. |

**Copyability: LOW relevance.** Different buyer. Important warning for our own copy: **their $199/month does NOT validate our $199 one-time price** — our anchor is the verified human-firm fees in `01-MARKET-EVIDENCE.md` §1.2, never AppealAI.
**Likely response (judgment):** none toward a consumer tool; they compete for agencies.

### 1.4 AppealPath (appealpath.co) — thin one-shot generator

**$11 to unlock a full POA draft** (per search snippet). Site served a broken Netlify wildcard SSL certificate on 25 Aug 2026 — the signature of an unmaintained side project. **Copyability/response: negligible capacity (judgment).** Its real significance is pricing psychology: an $11 draft exists, so our $199 must visibly buy classification depth, case management, deadlines, and vault — not prose alone.

### 1.5 Additional entrants and deaths (merged 11 Sep 2026 from the 2 Sep 2026 recheck)

**Provenance:** `Planning/03-PHASE-2-BUILD/reference/2026-09-02-COMPETITOR-RECHECK.md` — a live web-research pass (WebSearch + direct fetches) done 2 Sep 2026, archived because its originating chat was deleted. Merged here on the founder's 11 Sep 2026 approval; full sourcing/URLs live in that archived file, not repeated here.

| Entrant | Status (2 Sep 2026) | Detail |
|---|---|---|
| AppealsHub / "AppealPro" (appealshub.com) | **Dead — HTTP 404** | Indexed but the homepage no longer resolves; graveyard evidence for the "software tools die of neglect" thesis. |
| AppealPath (appealpath.co) | **Confirmed still broken** | Both the bare and `www` domains served a broken SSL certificate as of 2 Sep — matches §1.4 above, now dated twice. |
| SellerRule (sellerrule.com) | Active — free lead-gen tool | Free "Appeal Template Generator": an editable outline/checklist, not a paid product. Occupies the free-tool end of the category without competing on depth. |
| DoNotPay "Unban My Account" | Active — consumer-grade, adjacent | Generic account-unban demand-letter generator that happens to cover Amazon; not seller-specific, no root-cause/evidence workflow, no POA structure. Illustrates that horizontal AI-legal tools mis-fit this niche. |
| Free GPT wrappers ("AMZ Appeal GPT", "Amazon Appeal Expert") | Active — zero-dollar | Prompt wrappers in the ChatGPT GPT store / YesChat; no evidence system, no case data, no deadline tracking. The free-decoder wedge has to out-execute these on trust and depth, not just be free. |
| EcomSellerTools (Scott Margolius) | **Pivoted away** | The 2021 "POA Examples" eBook is a dead artifact; the site now sells generic consulting sessions, not a template product — further evidence no 2021-era appeal-software incumbent survived in its original form. |

**Headline finding carried over:** no surviving 2021–2023 "appeal software" incumbent exists at all — the category jumped straight from templates/eBooks to a 2025–26 wave of AI SaaS tools, none of which has a findable review footprint yet. This is consistent with, and strengthens, §1's existing per-competitor analysis; it does not change any of the copyability or response-timeline judgments already recorded above.

### 1.6 Minor CWS extensions (category occupation, not competition)

| Extension | Detail (25 Aug 2026) |
|---|---|
| Listing Guard — Amazon Seller Tools (l-guardapp.com) | 0 reviews. Monitors account health, drafts **Brand Registry** appeals. |
| Amazon Wholesale Reseller Toolkit (extensionhub.app) | 0 reviews. Lists "suspension appeals" among 6 tools. |
| Remove Negative Amazon Reviews · AI Appeal (salesfortuna.com) | 5.0★. Review-removal appeals only — adjacent niche. |

CWS searches for "amazon reinstatement" returned zero results and "amazon plan of action" nothing relevant. **No dedicated full-deactivation→POA→deadline-tracker extension exists — but the category is occupied.** Positioning consequence (standing rule): claim depth, never "first" or "only".

---

## 2. The human-firm tier (the price anchor, not a software threat)

Verified prices and details: `01-MARKET-EVIDENCE.md` §1.2 (single source of truth — do not duplicate numbers here). Summary posture:

| Firm | Verified position | Copyability of our wedge |
|---|---|---|
| ecommerceChris | $1,500 ASIN / $4,000–5,000 account; ex-Amazon authority | **LOW** — big consultancies have shipped no software in a decade; their economics depend on high-touch fees. They are also recruitment/referral targets, not just rivals (see the recruitment kit in The Second Opinion). |
| The Appeal Guru | $1,495/$2,495; +$1,000 24h panic premium | LOW — same. |
| Thompson & Holt | ~$600 (third-party cited; own site unreachable 25 Aug 2026) | LOW — cheapest named human anchor; our $199 undercuts it ~3x. |
| Riverbend Consulting · Amazon Sellers Lawyer | Quote-only; user-reported $2,250–$4,000 | LOW — quote-gating means they cannot be beaten or matched on price transparency; we win that axis by default. |
| My Amazon Guy · AMZ Sellers Attorney | $1,000–$2,000 / $1,500–$2,300 flat | LOW — attorney/agency lanes; AMZ Sellers Attorney's authority is attorney-client privilege, a lane we explicitly do not enter (we are document preparation, not legal advice). |
| Seller Basics (merged 11 Sep 2026 from the 2 Sep 2026 recheck) | $199/mo membership (account health help, suspension assistance, IP claim defense, attorney quick-consults) plus an added $5,000 for pre-existing/pending suspensions or Section 3 reviews | LOW — insurance-style subscription-plus-surcharge model, not self-serve or transparent per-case pricing; reinforces the same structural gap AppealDeck's one-time price exploits. |

The firm tier's structural weakness is ours to exploit honestly: no self-serve, no instant access, opaque quotes — versus our transparent one-time price at 3–25x below their verified fees.

---

## 3. Amazon itself (the pre-emption "competitor")

| Capability | What it does | What it does NOT do |
|---|---|---|
| **AHA** (free) | For Professional sellers with AHR ≥250 held 6+ months: an Account Health Specialist calls proactively and gives a 72-hour window before deactivation. | Excludes fraud/deceptive/illegal cases; lapses if the window is missed; excludes new, Individual-plan, and low-AHR sellers — which is exactly our addressable core. |
| **Amelia** (AI assistant, US Seller Central) | Explains violations, reads policy case history, interprets policy, guides resolution workflows. | **Does not write appeals/POAs.** Documented monitoring blind spots (SentryKit, 1 Jul 2026). |

**Copyability: the one existential-scale scenario.** If Amazon extends Amelia to draft POAs, the decode-and-draft core is commoditized at the source. Timeline unknowable; tracked as risk R-23 in `03-RISK-REGISTER.md` with its early-warning signal (monitor Amazon seller-news and Amelia release notes monthly). What Amazon will never build: a deadline engine, an escalation-ready evidence vault, and honest adversarial coaching **against its own enforcement** — that is the durable remainder.

---

## 3a. Why generated/template appeals get rejected (verified evidence, merged 11 Sep 2026 from the 2 Sep 2026 recheck)

**Provenance:** same archived recheck as §1.5 above. This is the strongest evidence backing the evidence-first, decode-before-draft design — a direct product-quality justification, not just a positioning line.

Best single source is a competitor's own attack piece: Riverbend Consulting, "ChatGPT, Claude, and Amazon Seller Appeals" (Christian Rodgers, published 23 Jul 2026). Key findings, each independently corroborated by real Seller Central forum threads:

- Generic, templated language is detected and deprioritized by Amazon's review systems — one forum thread documented 24 rejections of the same appeal before the seller stopped padding it with filler and blaming employees instead of naming the systemic root cause.
- Submitting a Plan of Action when Amazon actually demanded supporting documents (invoices, etc.) triggers **instant automated rejection** — a different forum thread showed a rejection landing in under a minute for exactly this reason.
- AI drafting tends to mirror the seller's own (sometimes wrong) theory of the case rather than question it, has no way to evaluate whether the evidence actually proves the claim, and has no visibility into the seller's real account history.
- Unfulfillable or invented commitments ("we will fix this") and empty phrases ("we take full responsibility") are named rejection triggers.
- Each weak, rejected appeal **burns one of a limited number of response opportunities** — the cost of a bad draft is not just wasted time, it is a shrinking chance to ever get reinstated.

**Synthesized failure taxonomy, each traceable to the evidence above:** generic/templated language; the wrong artifact type submitted (prose when documents were required); root cause blamed on people instead of systems; the tool mirroring the seller's wrong theory instead of challenging it; invented or unfulfillable commitments; and burning a limited appeal attempt on a weak draft. **This taxonomy is the direct justification for AA-31's composer critic rules** (future-tense-promise detection, blame-shifting-language detection, the evidence-completeness gate before a full draft is offered, and the document-type router) — it is not a hypothetical risk, it is documented, dated, real-world failure behavior from the seller's own community and a competing firm's own published analysis.

On success-rate claims specifically: a wide survey of the same market (SellerAppeal, Team4eCom, Amazon Appeal Xperts, ASA Compliance Group, Amazon Appeal Pro, AMZDudes, ReinstateAMZ, Appeal Partners) found 93–99% "success rates" advertised everywhere, every one self-reported with no published methodology, and one competitor's own reviews flagging a firm that asks for the seller's Amazon password and remote-desktop access — exactly the credential-handover risk AppealDeck's local-first design refuses to introduce. The two most reputable human firms in the whole survey (AMZ Sellers Attorney, ecommerceChris) are the only ones that publish **no** success-rate number at all — the credible tier's own norm already matches D6's "win rates only from opt-in outcome data" rule.

---

## 4. Differentiation matrix

Our wedge, feature by feature, against every tier. "—" = absent; "partial" = exists in weaker form.

| Wedge feature | AppealDeck | SellerForge / Forge Companion | AppealsPro.ai | AppealAI | AppealPath | Human firms | Amazon (AHA + Amelia) |
|---|---|---|---|---|---|---|---|
| In-page panic capture (works where the notice lands) | Yes — extension panel + paste-mode parity | Partial — general copilot chat in Seller Central | — (web-only) | — | — | — | Partial — Amelia explains in-page, no case workflow |
| Per-case one-time price | **$199 one-time** | — ($49–499/mo; $0–5/mo extension) | — ($79.99–199/mo) | — ($199–499/mo) | Yes ($11, prose only) | Yes ($600–5,000/case) | Free (no drafting) |
| Local-first / no OAuth handover | Yes — no SP-API, no account keys leave the browser | — (SP-API OAuth; data in their cloud) | Partial (no OAuth, but cases in their cloud) | — (SP-API) | Partial (paste-in) | n/a (you hand them everything) | n/a |
| Encrypted local case vault | Yes (encrypted, on-device) | — (cloud Document Vault) | — | Partial (cloud Evidence Locker) | — | — | — |
| Deadline engine (stated windows, funds-appeal +60d, Seller Challenge stage) | Yes | — | — | — | — | Manual, per-engagement | Partial (72h AHA window only) |
| Honest-expectations posture (no success claims until opt-in data) | Yes — by design (D6) | — (marketing-standard claims) | Partial (publishes 23% win rate) | — | — | — (unverifiable 93–99% marketing claims are the industry norm) | n/a |
| Severity gating (fraud/forged-docs/child-safety never sold a Pass; routed to professional help) | Yes — by design (D6) | — | — | Partial (excludes regulated categories) | — | n/a (they take those cases) | n/a |

---

## 5. Standing monitoring actions

- [ ] **1. Weekly SellerForge diff** — pricing page, Forge Companion listing (rating, features), free POA generator scope; deltas noted at the weekly decision review (implements Gate 3 check 35). **Owner:** Founder · **Cost:** $0 (15 min/wk) · **Deadline:** weekly from Week 1 · **Blocks:** strategic response time to the §1.1 timeline.
- [ ] **2. Monthly CWS sweep** for new entrants on appeal/reinstatement/POA queries (the five query variants from the 25 Aug 2026 verification). **Owner:** AI assistant · **Cost:** $0 · **Deadline:** monthly · **Blocks:** early warning on category crowding.
- [ ] **3. Monthly Amelia/AHA capability check** — Amazon seller-news, SentryKit-style analyst posts; escalate immediately if Amelia gains any drafting capability (risk R-23 trigger). **Owner:** Founder · **Cost:** $0 · **Deadline:** monthly · **Blocks:** pre-agreed response to the pre-emption scenario.
- [ ] **4. Update this dossier on any material change** (price move, new tier, new extension, funding announcement) with date and source — stale intel is worse than none. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** within a week of detection · **Blocks:** positioning-copy accuracy.

---

## 6. The moat statement

**AppealDeck's moat is depth + speed + trust — never first-mover, because that claim is dead.**

- **Depth:** no competitor ships a dedicated full-deactivation→POA→deadline-tracker with local-first storage and per-case pricing — the combination is the position: classified notice, violation-specific POA, enforced deadlines (stated windows, funds-appeal +60d, Seller Challenge), and an escalation-ready encrypted vault, rather than one chat feature among 19 (SellerForge), a web form (AppealsPro), or a $11 text blob (AppealPath).
- **Speed:** ship the web decoder at week 4–5 and the extension by week 8, faster than a subscription incumbent can re-prioritize — their week-4/week-8 responses (§1.1) only trigger *after* we show traction, which is our head start.
- **Trust:** in a market scarred by bribery prosecutions and fake success rates (`01-MARKET-EVIDENCE.md` §1.3), the structurally honest position — one-time transparent price, local-first data, no OAuth handover, no success claims, severity gating — is the one thing neither a cloud-subscription SaaS nor a quote-gated consultancy can copy without breaking its own model.

---

## Definition of done

- [ ] Every competitor named in any positioning document or marketing artifact appears in this dossier with a verification date; no artifact claims "first", "only", or "zero competition".
- [ ] The weekly SellerForge diff (action 1) has run every week since Week 1, with deltas logged at the weekly decision review.
- [ ] The differentiation matrix (§4) is re-checked whenever a competitor materially changes — and our copy is updated the same week if a "—" cell becomes a "Yes".
- [ ] A newcomer can answer, from this file alone: who is the primary threat, what their most likely week-4 move is, why $199/month does not validate $199 one-time, and what our three-word moat is.

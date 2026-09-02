# 2026-09-02 — Live competitive re-check (archived research report)

> **Provenance:** produced 2 Sep 2026 by a web-research agent (WebSearch + direct fetches) during the external-AI review session; archived verbatim because the originating chat was deleted. This is the source record behind `../04-EVIDENCE-FIRST-HARDENING.md` §1.1's competitive deltas. Tags: [verified — URL] / [anecdote — URL] / [unverified]. Founder merges the deltas into `../../07-REFERENCE/02-COMPETITOR-DOSSIER.md` and re-verifies `../../07-REFERENCE/01-MARKET-EVIDENCE.md` §1.2 anchors (both founder-gated).

**Headline finding:** There is no surviving 2021–2023 "appeal software" incumbent. The pre-AI era was templates/eBooks and human services; a fresh wave of AI appeal SaaS appeared only recently (all show © 2026, none has a findable review footprint). The software category is simultaneously crowded at the marketing layer and empty at the reputation layer.

---

## 1. Software tools (appeal/POA generators & workflow systems)

### 1.1 AppealsPro (appealspro.ai) — ACTIVE, closest analog to AppealDeck
- What it is: AI workflow SaaS — paste suspension notice → "Suspension Notice Decoder" → violation classified against 94 types → policy-specific appeal letter → appeal strength scorer (0–100) → chat assistant → case tracking "that learns from outcomes." [verified — https://www.appealspro.ai/, accessed 2026-09-02]
- Pricing: Free tier ($0, notice analysis only); Starter $79.99/mo (2,500 tokens); Pro $199/mo (10,000 tokens); ~25 tokens per appeal letter; extra tokens $34.99/1,000. [verified — same URL]
- Positioning: explicitly sells against "$1,500–$6,000 per case" consultants. © 2026, no named founder. [verified — same URL]
- User feedback/reviews (Trustpilot, Reddit, YouTube): **not found.**
- Note vs AppealDeck: its free tier is decoder-only — same wedge as our free decoder — but it monetizes via subscription + token metering, not one-time per case.

### 1.2 AppealAI (appealai.pro) — ACTIVE
- What it is: AI workflow — upload violation notice → AI decodes → generates POA; plus ASIN auditing, listing compliance scanning, root cause analysis. Carries an "AI-Generated Content Disclaimer" (have a professional review before submission) and refuses consumables/supplements/medical categories (a crude form of severity gating). © 2026. [verified — https://appealai.pro/, accessed 2026-09-02]
- Pricing: **not found** on homepage (gated behind pricing page/demo). [verified absent — same URL]
- User feedback: **not found.**

### 1.3 SellerForge (sellerforge.ai) — ACTIVE
- What it is: account-health platform with appeal features: AHR/ODR monitoring via **read-only SP-API**, POA drafts "grounded in live account data," escalation mapping after rejections, and a "Document Vault" for invoices/supplier records. Also advertises a free no-login POA generator. [verified — https://www.sellerforge.ai/account-health, accessed 2026-09-02]
- Pricing: from $49/mo; positions against "$500–$5,000+ per appeal" services; emphasizes "users retain control… read-only API access only." © 2026. [verified — same URL]
- User feedback: **not found.**
- Note: the closest philosophical overlap with AppealDeck's read-only/user-in-control stance — but cloud-based and subscription, and it does what we defer (SP-API integration, monitoring).

### 1.4 AppealPath (appealpath.co) — ACTIVE but hobby-grade / broken infrastructure
- What it is: micro-tool — paste notice + upload evidence → tailored POA draft; $11 to unlock the full draft. [verified existence via search listing "AppealPath — Amazon POA Generator… full draft costs $11 to unlock", accessed 2026-09-02; site content itself unfetchable]
- Status evidence: both `appealpath.co` and `www.appealpath.co` serve a **broken SSL certificate** (Netlify wildcard cert, custom domain misconfigured) as of 2026-09-02 — unreachable over HTTPS. [verified — TLS error observed on fetch, 2026-09-02]
- Read: single-developer side project already decaying at the infrastructure level. Prime exhibit for "software tools in this niche die of neglect."

### 1.5 AppealsHub / "AppealPro" (appealshub.com) — DEAD or broken
- Appeared in search results titled "AppealPro — Amazon Seller Appeals & Communications" but the homepage returns **HTTP 404** as of 2026-09-02. [verified — 404 observed on fetch]
- Indexed-but-404 is graveyard evidence; Wayback not checked (budget).

### 1.6 SellerRule (sellerrule.com) — ACTIVE, free template generator
- Free "Appeal Template Generator" producing an editable outline/checklist from user inputs, plus downloadable templates by email. Lead-gen content play, not a paid product. [verified via search result description of https://sellerrule.com/guides/amazon-appeal-letter-template, accessed 2026-09-02; page itself not fetched]

### 1.7 DoNotPay "Unban My Account" — ACTIVE, consumer-grade adjacent
- Generic account-unban demand-letter generator that covers Amazon suspensions (drafts appeal/demand letter with a two-week response deadline, sends to Amazon). Not a seller-specific POA system; no root-cause/evidence workflow. [verified — https://donotpay.com/learn/amazon-account-suspended/, accessed 2026-09-02]
- Pricing on those pages: **not found** (DoNotPay is subscription-based; number not confirmed this session).
- The demand-letter framing is roughly the opposite of what Seller Performance wants and is not POA-shaped — an example of horizontal AI-legal tools mis-fitting this niche. [assessment, not a sourced claim]

### 1.8 Free GPT wrappers — ACTIVE, zero-dollar competitors
- "AMZ Appeal GPT" in the ChatGPT GPT store [verified — https://chatgpt.com/g/g-up4jwilFn-amz-appeal-gpt listed in search, accessed 2026-09-02] and "Amazon Appeal Expert – Free Amazon Seller Support" on YesChat [verified — https://www.yeschat.ai/gpts-2OToO2t8NR-Amazon-Appeal-Expert listed in search]. Free prompt-wrappers, no evidence system, no case data.

### 1.9 The pre-AI template era: EcomSellerTools (Scott Margolius) — PIVOTED
- 2021 artifact: "PLAN OF ACTION EXAMPLES For Amazon Seller Appeals" eBook (PDF still circulating). [verified — https://entreresource.com/wp-content/uploads/2021/10/Ecomsellertools-Plan-of-Action-EXAMPLES-Book.pdf, accessed 2026-09-02]
- ecomsellertools.com today sells **generic eCommerce consulting sessions** (booking-based, "100% RISK FREE," 5-day refund), no template product visible, © 2025 → pivoted away from productized POA templates to human consulting. [verified — https://ecomsellertools.com/, accessed 2026-09-02]

### 1.10 Searched for but NOT FOUND
- Any dedicated Amazon-appeal SaaS from 2021–2024 still alive under its original model: **not found.**
- Reddit (r/FulfillmentByAmazon, r/AmazonSeller), Trustpilot, or YouTube reviews of AppealsPro / AppealAI / SellerForge / AppealPath: **not found** (multiple query angles; Reddit-scoped searches returned nothing relevant). These tools appear to have negligible real-user footprint as of 2026-09-02.

---

## 2. Human agencies — pricing benchmark

| Agency | Advertised pricing | Model | Evidence |
|---|---|---|---|
| **ecommerceChris** (Chris McCabe) | **No public pricing** — "Start My Case Now" contact flow | Account reinstatement, ASIN reinstatement, Monthly Account Protection; "every case led directly by our Amazon experts," ex-Amazon Seller Performance investigators; 4.9★ Trustpilot, 250+ reviews; no success-rate % advertised | [verified — https://ecommercechris.com/, accessed 2026-09-02] |
| **Riverbend Consulting** | **No public flat pricing** on current site; Seller Account Protection marketed "as low as $17/day" (~$510/mo) | Account/ASIN reinstatement, Brand Registry & KDP appeals; PRO + Guardian protection plans; "400+ Appeals Serviced Monthly," "Trusted by 10,000+ Sellers," Google 4.6★ (345) | [verified — https://riverbendconsulting.com/, accessed 2026-09-02; $17/day via search snippet of riverbendconsulting.com/seller-account-protection/ — anecdote-grade, not fetched directly]. Old pricing page riverbend-consulting.com/service-pricing/ now 404 [verified — 404 observed] |
| **Seller Basics** | **$199/mo membership**; **+$5,000** for pre-existing/pending suspensions or Section 3 reviews; per-violation fees for pre-existing violations | Insurance-style membership: account health help, suspension assistance, IP claim defense, attorney quick-consults, discounted retainers; SPN member; since 2020; footer © 2023 | [verified — https://www.sellerbasics.com/, accessed 2026-09-02] |
| **Thompson & Holt** | Own site **unfetchable** (bot-protected; returned only a tracking pixel twice). Third-party reviews: flat fee ~**£500 / $600–660** per managed appeal, follow-ups included; "Monitor & Protect" from ~**£200** with claimed "suspension cover up to $70,000" | Flat-fee managed appeal, UK-based; Feefo review presence | Pricing: [anecdote — https://www.webretailer.com/reviews/thompson--holt/ and https://jordiob.com/amazon-tools/thompson-holt/ via search snippets; own-site confirmation **not found**] |
| **Amazon Sellers Lawyer** (Rosenbaum Famularo / Rosenbaum & Segall) | **No public pricing** — "contact for a quote"; handles suspension appeal + follow-ups "for a flat rate" | Law firm; POA drafting + escalations | [verified — https://amazonsellerslawyer.com/services/ listed; quote-only per https://www.webretailer.com/reviews/amazon-sellers-lawyer/, last updated 2023-03-08, accessed 2026-09-02] |
| **AMZ Sellers Attorney** | **$1,500** standard appeals & Section 3; **$2,300** IP/related-account; **$3,000** Schedule A TRO settlement; **$1,750** USPTO Letter of Protest | Paralegals + attorney supervision/drafting (Kenneth G. Eade, CA Bar 1980; USPTO patent attorney on staff); **explicitly refuses outcome guarantees** ("Guaranteeing an outcome is prohibited for lawyers…"); claims "$20+ Million Recovered"; 4.6★ across 610 third-party reviews; site "Last reviewed: August 19, 2026" | [verified — https://www.amazonsellers.attorney/, accessed 2026-09-02] |

**Benchmark takeaway:** the human market clusters at **$600 (T&H, low end) → $1,500–$2,300 (law-firm flat fees) → $2,000–$6,000 (consultant range cited by the AI tools themselves)**, plus $199–$510/mo protection subscriptions. AppealDeck's $199 one-time sits below every human option and above the $11–$79.99 software chaos.

---

## 3. Failure evidence — why generated/template appeals get rejected

**Best single source — competitor consultancy's own attack piece:** Riverbend Consulting, "ChatGPT, Claude, and Amazon Seller Appeals," by Christian Rodgers, published 2026-07-23. [verified — https://riverbendconsulting.com/blog/chatgpt-claude-and-amazon-seller-appeals/, accessed 2026-09-02] Key quotes (each <15 words):
- "Amazon can spot a generic template instantly"
- AI will "mirror your assumptions, rather than questioning them"
- "AI has no ability to evaluate proof"
- "Neither ChatGPT nor Claude has access to the internal workings of your Seller Central account"
- Rejection trigger named: empty phrases like "We take full responsibility."

**Amazon Seller Central forum threads (real seller outcomes):**
- "Appeal Nightmare – 24 Appeals Rejected" (Amazon UK, IP suspension): 24 rejections driven by structure/content, not the violation — appeal bloated to 7 pages; blamed employees instead of systemic root cause. Quotes: "That's the Amazon bot rejecting your appeal. I would take it back to basics" (forum user); Amazon staffer: content matters, "the length of the appeal is not that matters." [anecdote — https://sellercentral-europe.amazon.com/seller-forums/discussions/t/698fe432ef849830b5c087de67d92eda, fetched 2026-09-02]
- "Amazon Appeal Rejected in Less Than a Minute" — instant auto-rejection pattern; forum consensus: instant rejects occur when a POA is submitted where **documents (invoices) were required**, or the same doc is resubmitted after rejection. [anecdote — https://sellercentral.amazon.com/seller-forums/discussions/t/76b51c0a-d7c3-4175-a3c7-83dd0558e2bb, via search, accessed 2026-09-02]

**Template-detection claims (industry write-ups):**
- ESQgo (law firm): copying template language triggers Amazon's systems; Amazon deprioritizes appeals containing repeated text seen across other appeals. [anecdote — https://www.esqgo.com/blog/amazon-templates-and-plan-of-action/, via search snippet; exact wording not independently confirmed]
- Seller Labs: AI-generated appeals "include generic language, fail to specifically address Amazon's stated reason," and "include inaccurate commitments the seller can't fulfill"; Seller Performance reviewers "are experienced at identifying templated responses"; each weak appeal **burns a limited response opportunity**. [anecdote — https://www.sellerlabs.com/knowledge-base/the-hidden-risks-of-letting-ai-run-your-amazon-business/, via search snippet]
- Washington Post (2024-01-20): raw ChatGPT error strings ("as an AI language model…") found in live Amazon listings — mainstream evidence that unedited AI output leaks through and is detectable. [verified headline — https://www.washingtonpost.com/technology/2024/01/20/openai-use-policy-ai-writing-amazon-x/, accessed 2026-09-02]

**Synthesized failure taxonomy (each point traceable to a source above):** (1) generic/templated language detected and deprioritized; (2) wrong artifact type — POA sent when invoices/docs were demanded → instant bot rejection; (3) root cause blamed on people, not systems; (4) AI mirrors the seller's wrong theory of the case; (5) invented or unfulfillable commitments; (6) burned limited appeal attempts.

---

## 4. Success-rate claims found in the wild

All of the following are **self-reported marketing** with no published methodology or raw data; none qualifies as verified outcome data. All URLs surfaced 2026-09-02.

| Claimant | Claim | Grade |
|---|---|---|
| SellerAppeal (sellerappeal.com) | "98% historical reinstatement rate across 5,200+ cases," asserts third-party independent review | Self-reported marketing; the "independent verification" itself is a marketing claim — verifier's report **not found** [unverified] |
| Team4eCom | 98% success rate | Self-reported marketing [anecdote — https://www.team4ecom.com/amazon-listing-reinstatement-services.html] |
| Amazon Appeal Xperts | 98% | Self-reported marketing [anecdote — https://amazonappealxperts.com/services] |
| Amazon Sellers Appeal / ASA Compliance Group | 98% across listing + account issues, "5,200+ sellers" (same number as SellerAppeal — possibly same operator or copied copy) | Self-reported marketing [anecdote — https://amazonsellersappeal.com/] |
| Amazon Appeal Pro | 98% | Self-reported marketing [anecdote — https://amazonappealpro.com/amazon-reinstatement-services/] |
| AMZDudes | 99% | Self-reported marketing [anecdote — https://amzdudes.com/amazon-suspension-appeal-service/] |
| ReinstateAMZ | 99%, "2,200+ reinstated" | Self-reported marketing [unverified — via search summary only] |
| Appeal Partners | "93% Success Rate" in page title | Self-reported marketing [anecdote — https://appealpartners.com/] |
| Amazoker | ~98%-tier marketing; Trustpilot shows mixed reviews incl. non-responsiveness and **requests for Amazon passwords + AnyDesk access** | Self-reported; criticism [anecdote — https://www.trustpilot.com/review/amazoker.com] |
| Industry counter-quote | "run from any company claiming above 98% success rate" | [anecdote — surfaced in Amazoker-related search results; original source page not pinned down] |
| **Counter-positioning (credible actors)** | AMZ Sellers Attorney: refuses guarantees, citing attorney professional-conduct rules [verified — https://www.amazonsellers.attorney/]; ecommerceChris: no %-claims at all, sells expertise/reviews instead [verified — https://ecommercechris.com/] | The most credible players conspicuously do NOT publish success rates |

---

## 5. Interpretation notes (agent's, not new claims)

1. **The "software graveyard" thesis holds, with nuance.** Verified deaths/decay: appealshub.com (404), appealpath.co (broken TLS), ecomsellertools (pivoted). But no large funded 2021-era appeal-SaaS corpse was found — the category never produced one; it went straight from eBooks/templates to 2025–26 AI SaaS.
2. **A 2026 AI-tool wave already exists** (AppealsPro $79.99–$199/mo, SellerForge $49/mo, AppealAI, plus free GPT wrappers). All subscription; none one-time-per-case; none with a review footprint.
3. **The strongest publishable failure evidence** is Riverbend's July 2026 blog (a top-3 human agency attacking AI appeals) plus Seller Central threads showing bot insta-rejection when invoices were required — both directly support the evidence-first, decode-before-draft design.
4. **Success-rate hygiene:** 93–99% claims are ubiquitous, uniformly self-reported, and the two most reputable firms publish none — validating D6's "win rates only from opt-in outcome data" as differentiated *and* the credible-tier norm.

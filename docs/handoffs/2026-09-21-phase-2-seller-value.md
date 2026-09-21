# Phase 2: who needs this, and why they would choose it

Checked: 21 September 2026. Repository: `52cf0cf`. Status: Phase 2 complete within its agreed scope. Research, saved-evidence reuse, and source inspection only. No interviews, no pilot, no purchases, no app changes.

## Plain-language result

Phase 1 established what is true. Phase 2 asked who this is for and why they would pay. Four things came out of it, and two of them are uncomfortable.

1. **The pain is real and large.** A third of surveyed sellers were suspended in one year, appeals take weeks with funds frozen, and the 2026 forums are full of sellers stuck in loops. None of that is in doubt.

2. **But the cases that hurt most are the ones the app currently refuses.** Today's code will only help compose for Amazon US notices asking for a Plan of Action or supporting documents. It routes intellectual property, related-account, identity/video verification, and frozen-funds cases away to a "specialist" screen. Those four are exactly the categories the seller research shows people screaming about. The supported slice is the calmer middle of the market — and it is also the slice Amazon's own assistant and the free tools serve best.

3. **Nobody in this market sells what we plan to sell.** Every live competitor is a subscription or a human flat fee. The only one-time per-case software found is dead and its domain is broken. That is either the opening or the warning, and this research cannot tell you which. **No observed evidence exists that a seller will pay a one-time fee for self-serve appeal software.** That is the single biggest unvalidated assumption in the business, and it needs a pilot, not more reading.

4. **Two facts in our own reference files are now out of date** and would produce false marketing copy if used: AppealsPro no longer publishes the 23% win rate we cite as the market's honest base rate, and "Amelia does not write appeals" is no longer a safe claim.

My recommendation: do not widen the feature set yet. Narrow the *customer* instead, fix the two stale facts, and put the one-time-price assumption in front of real sellers before building anything else.

## Method and limits

Reused the Phase 1 evidence review, the six salvage research files, the competitor dossier, the market-evidence fact gate, and the edge-persona register. Ran four search queries and five original-page retrievals; inspected `src/core/workspace.ts` routing and the D6 decision text directly. Reused rather than re-verified the 25 August 2026 price anchors for the human firms, except where a retrieval touched them.

This phase did **not**: interview a seller, run an ad or landing-page test, measure keyword volume or cost-per-click, purchase any competitor product, or test a live Seller Central account. Every willingness-to-pay statement below is therefore either an observed published price or a labelled hypothesis. Vendor blogs and agency sites establish what a vendor advertises, not what works. Forum posts establish individual experience, not rates.

## 1. What the product actually serves today

Read directly from `routeWorkspace()` — this is the real addressable scope, not the marketing scope. A case reaches a composable route only if **all** of these hold:

| Gate | Condition | Effect when it fails |
|---|---|---|
| Prior review flag | `professionalReviewRequired` not set | → specialist |
| Sensitive allegation | No match on forged/falsified/fabricated/manipulated/altered/inauthentic documents, fraud, child safety, product safety, recall, **related account**, **intellectual property**, **trademark**, **copyright** | → specialist |
| Marketplace | `marketplace === "US"` | → clarification |
| Process type | No match on identity verification, video call, government-issued ID, **funds disbursement/withheld** | → clarification |
| Position | Not `dispute` | → dispute |
| Inputs | Notice ≥ 30 chars **and** form instructions present | → clarification |
| Request type | Instructions name a Plan of Action / root cause / corrective actions (→ operational), or request records (→ documents) | → clarification |

[Routing](V:/AppealDeck1/src/core/workspace.ts:120)

**The finding that matters:** D6's severity gate names only **forged documents, fraud, and child safety**. IP, trademark, copyright, related-account, product safety, identity verification, and funds were added to the same exclusion by implementation choice. [D6 text](V:/AppealDeck1/Planning/00-DECISION/02-DECISION-LOG.md:36) Widening into IP or related-account therefore does **not** reopen a locked decision — it is a product-scope call that is still open. Widening into forged-docs, fraud, or child safety would reopen D6 and should not be proposed.

## 2. The seller situations, scored against scope

Pains are drawn from the saved seller-voice research and the 2026 forum threads it captured; scope is from §1. "Unmet" means not adequately served by Amazon's own tools or by a free alternative.

| Situation | How loud the pain is | Served today by AppealDeck? | Verdict |
|---|---|---|---|
| IP / trademark / copyright complaint, repeated template rejections (one case: 12–13 identical rejections, Jun–Aug 2026) | **Highest** | **No — routed to specialist** | Largest documented unmet need; currently refused by our own router, not by D6 |
| Related-account / linked-account deactivation | High; Amazon links via owner, VA, device, IP, bank, supplier | **No — routed to specialist** | High need; also the persona most likely to be an agency (EP-1), which v1 cannot serve anyway |
| Identity / video verification failure ("we can't help you more") | High | **No — routed to clarification** | Real pain, but the seller's blocker is an Amazon process with no document to draft; low product fit |
| Frozen funds after deactivation | High | **No — routed to clarification** | Deadline tracking would help; drafting mostly would not |
| "No appeal button" / loop between Account Health and Support | High | Partly — decode explains, cannot unblock | Navigation help, not drafting; cheap to serve, hard to charge for |
| Policy-violation notice requesting a **POA** | Moderate and steady | **Yes — operational route** | In scope; also the most contested ground (see §3) |
| Notice requesting **supporting documents** (invoices, sales reports, LOA, listing corrections) | Moderate | **Yes — documents route** | In scope, and the place where evidence work is demonstrably useful |
| Already submitted, got a templated rejection, must respond again | Moderate–high, under-discussed | Partly — submission history, replies, revisions exist | **The most defensible gap.** See §5 |

**Consequence.** The current build is aimed at the two rows where Amazon's own assistant, free generators, and $0 tiers are most active, and away from the four rows where sellers are loudest. That is not automatically wrong — the loud rows are also the risky, evidence-heavy, low-draftability ones — but it should be a deliberate choice, and right now it reads like an accident of a regex.

## 3. The alternatives, re-checked today

| Alternative | Current position (checked 21 Sep 2026 unless noted) | What it does **not** do |
|---|---|---|
| **Amazon Seller Assistant** | Staff confirm it guides appeals and "may be able to help sellers complete tasks to help with their appeal" (Phase 1). Official capability language is acting "with your approval" on "**some** policy violations." Announcements do **not** mention appeals, account health review, or deactivated accounts. Sellers publicly call it a "huge fail"; one reports support saying "AI can do whatever it wants but we can't so we can't help you"; another reports using outside AI tools to navigate Amazon support. [Update thread](https://sellercentral.amazon.com/seller-forums/discussions/t/ecf5f31b-3e3b-4295-883a-7383bda948d4), [criticism thread](https://sellercentral.amazon.com/seller-forums/discussions/t/0c67e6a9-3d91-4b7a-8f2c-360953d4735f) | Not shown to draft a POA; not shown to be available or useful once the account is deactivated — which is the moment we sell into. Requires a working logged-in account. |
| **SellerForge** | Unchanged from 25 Aug. $490 / $999 / $1,990 / $4,990 per year. All tiers carry "POA, Escalation & Reimbursements." 7-day trial, no card. Free tools without account connection; live data needs Amazon authorization. Anchors itself against agencies at "$500–$2,500." [Pricing](https://sellerforge.ai/pricing) | No per-case or pay-per-appeal option. Cloud + SP-API OAuth. |
| **AppealsPro.ai** | Alive. Free tier now up to **10 notice analyses per day**. Starter $79.99/mo, Pro $199/mo, top-ups $34.99/1,000 tokens. **The published 23% win rate is gone**; the site now says "No tool can guarantee reinstatement — Amazon's decisions are final," and positions on price: one month of Starter is "less than 4% of a single professional appeal service." [Site](https://appealspro.ai/) | No per-case option. |
| **Seller Candy** (not previously in the dossier) | Retainer: $997 / $1,197 / $1,500 / $2,500 per month, "UNLIMITED access," free $500 audit. Claims "98% of Issues Resolved" with no published methodology. [Service page](https://sellercandy.com/amazon-suspension-appeal-service) | Not per-case; no refund, turnaround, or success methodology published. |
| **Human firms** | Anchors hold: ~$600 to $5,000 per case; Appeal Guru's $1,495/$2,495 tiers make the +$1,000 panic premium explicit. Category norm in current copy is a flat fee covering assessment, first appeal, **and unlimited follow-ups and revisions until resolution**. | No self-serve, no instant start, mostly quote-gated. |
| **Free / manual** | Free GPT wrappers, SellerRule's free template generator, AppealsPro's free tier, forum advice. | No case record, no evidence discipline, no deadline, no continuity. Documented failure mode: templated prose, wrong artifact submitted, burned attempts. |

**Two corrections our own files now need** (do not ship copy from them until fixed):

- `Planning/07-REFERENCE/02-COMPETITOR-DOSSIER.md` §1.2 states AppealsPro "publishes a **23% win rate**" and treats it as the market's real base rate. **No longer published as of today.** Any copy leaning on it must be withdrawn; there is now no published honest base rate in this market at all.
- `Planning/07-REFERENCE/01-MARKET-EVIDENCE.md` §1.5 and dossier §3 state Amelia "does **NOT** write appeals/POAs." Phase 1 already contradicted the spirit of this. The safe, defensible claim is narrower: *Amazon's assistant guides appeals and can act on some policy violations with approval; it has not been shown to draft a Plan of Action or to help a deactivated seller.* Add a verification date.

## 4. Willingness to pay: what is observed, and what is not

| Price shape | Observed in the market? | Evidence |
|---|---|---|
| Human flat fee per case, $600–$5,000 | **Yes, verified** | Published price pages, 25 Aug 2026 |
| Premium purely for speed (+$1,000 for a 24h start) | **Yes, verified** | Appeal Guru tier gap — the best single proof that panic converts to money |
| Monthly retainer, $997–$2,500 | **Yes** | Seller Candy, today |
| Software subscription, $40.83–$415.83/mo | **Yes** | SellerForge, today |
| Software subscription, $79.99–$199/mo with free tier | **Yes** | AppealsPro, today |
| **One-time per-case fee for self-serve software** | **No — not observed anywhere live** | The only instance found was AppealPath at $11, dead and serving a broken certificate on two separate checks |

This is the core commercial finding. Two honest readings exist and this research cannot choose between them:

- **Opening:** subscription incumbents structurally cannot offer per-case pricing without cannibalising themselves; the human tier cannot go self-serve. A one-time price is the unoccupied slot.
- **Warning:** the slot is empty because nobody has made it work. Sellers in panic may prefer the reassurance of a human, and calm sellers may prefer $490/year "unlimited."

**The arithmetic a prospect will do.** A $199 Pass is one case. SellerForge Core is $490 for a year with unlimited POAs. AppealsPro analyses notices free, ten a day. So the Pass must visibly buy something those do not: the evidence discipline, the case record, the deadline, and the fact that nothing is handed to a third party's cloud. If the pitch is "a better draft," the arithmetic loses.

**Refund and scope exposure.** The category norm in live copy is *unlimited follow-ups and revisions until resolution*. A Pass that covers the first draft only is narrower than what buyers are being trained to expect. D8 gives a 7-day no-questions refund, which is good, but it does not answer the question every buyer will ask: **"does my Pass cover the second rejection?"** That is a Phase 3 decision, and the immigration-product analogs already in the salvage (flat fee, defined review points, explicit free-vs-paid rework rules) are the right model for the wording.

## 5. Where the defensible value actually sits

Three candidate positions, ranked by how well the evidence supports them:

**A. The second response.** The seller who already submitted, got a templated rejection, and must respond again without burning another attempt. Evidence: the 12–13 identical-rejection case; the documented rule that each weak appeal burns a limited opportunity; Amazon's own "we may not respond to further emails" wording. Fit: the app already stores submission text, attachment hashes, replies, and revisions — the infrastructure exists. Amazon's assistant does not do this; free generators cannot, because they have no memory of the last attempt. **Weakness:** this seller found us *after* failing elsewhere, which is a harder acquisition path, and Phase 1 found no previous-submission comparison in the inspected generation path — so the differentiating feature is partly unbuilt.

**B. Evidence preparation for document requests.** The seller told to produce invoices, sales reports, or an LOA. Evidence: the invoice-requirement detail is real and specific; Phase 1 confirmed manual review, page references, source quotes, and hashes already exist; "wrong artifact submitted → instant rejection" is a documented failure mode. **Weakness:** narrower audience, and the work is unglamorous.

**C. Decode and draft the POA.** The current default. **Weakest position**, because this is precisely where Amazon's free assistant, free GPT wrappers, and a free 10-per-day tier all operate.

**Recommendation:** treat A as the lead hypothesis and B as the reliable floor, and stop treating C as the product. This does not require new features first — it requires testing whether sellers in situation A will pay, using what is already built.

## 6. Trust and support expectations

What five-star reviewers of appeal services praise immediately before recommending, per the saved agency research: **honesty about the odds up front, responsiveness, persistence, and not overpromising.** The one-star pattern: paid, then ghosted; template letters; no refund. Notably, the two most reputable firms in the whole surveyed field publish **no** success rate at all — the credible tier's own norm already matches D6.

Specific to this founder: the saved growth research documents Amazon closing roughly 13,000 Pakistani seller accounts in May 2022 and the public fall of a major Pakistani e-commerce trainer. A solo Pakistani founder selling trust to suspended sellers meets a real, documented, pre-existing suspicion. The workable answer in the saved analogs is mechanism, not assertion: local-first storage the buyer can verify, a named human with a face, a transparent refund, and a stated response window that is actually met.

## 7. How a buyer would ever find us

| Channel | Status | Note |
|---|---|---|
| Seller Central forums | **Closed** | External links and promotion are bannable |
| r/FulfillmentByAmazon | **Effectively closed** | Documented as unusually strict |
| r/AmazonSeller | Restricted | Community Promotion Post only |
| ASGTG (~77–80k) | Usable with care | Participate in, never partner through — see the 2023 conviction in the market-evidence file |
| Marketplace Pulse | Paid, selective | One weekly sponsor slot, ~10k subscribers, ~60% open |
| **Free tool + organic search** | **The realistic primary channel** | Matches the precedents (Helium 10, Jungle Scout, SellerApp, Getida all grew on free tools or free audits) and matches D3's decoder-first order |

**Risk to name:** the free-decoder channel is contested by AppealsPro's free tier, free GPT wrappers, SellerRule, and an agency-dominated results page with real advertising budgets. Organic search is the only open door and it is not an empty one. Nothing in this phase measured search volume or acquisition cost — that gap should be closed before any launch-spend decision.

## 8. The testable value proposition

> For an Amazon US seller who has already responded once and been rejected, AppealDeck keeps the case — the notice, what was asked, what was sent, and what came back — so the next response answers the actual request with evidence the seller can point to, instead of restating the last attempt. One price, one case, nothing handed to anyone's cloud.

**Deliberately absent:** any success rate, any speed claim, any "approval" language, any comparison to a human consultant's outcome.

**What would falsify it:** sellers in that exact situation look at it and still prefer a free redraft or a human. **How to find out, cheaply, in order:** (1) put this sentence and a price on a page and measure intent-to-buy against the existing decoder traffic; (2) ten unpaid conversations with sellers who were rejected at least once, asking what they did next and what they paid; (3) a bounded pilot at the real price with the refund honoured without argument.

## 9. Observed demand versus hypothesis

| Statement | Status |
|---|---|
| Suspensions are frequent, ongoing, and costly; appeals run for weeks with funds frozen | **Observed** (survey + national-press investigation) |
| Sellers pay $600–$5,000 for human help, and pay a premium purely for speed | **Observed** |
| Repeated templated rejections happen and burn limited attempts | **Observed** (forum cases + a competitor's published analysis) |
| Amazon's own assistant does not close the gap for a deactivated seller | **Partly observed** — capability language and seller complaints support it; no test on a deactivated account |
| Sellers will pay a one-time per-case fee for self-serve software | **Hypothesis. No supporting observation exists.** |
| Local-first storage is a purchase reason rather than a nice-to-have | **Hypothesis** |
| The "second response" seller is reachable through organic search | **Hypothesis** — no volume or cost data gathered |
| Independent case records would make a seller recommend us after a loss | **Hypothesis** — testable only with opt-in outcome data, which is built but has no rows yet |

## 10. Five questions for Phase 3

1. Should the IP and related-account exclusions stay? They are the loudest documented pain and they are **not** protected by D6 — so this is an open product decision with a real addressable-market consequence, and it needs an evidence and liability answer, not a regex.
2. What exactly does one Appeal Pass cover after the first rejection — and what does the checkout say, in the buyer's words, before they pay?
3. Is the lead customer the first-time responder or the already-rejected responder? Everything downstream — copy, channel, feature order, price defence — changes with the answer.
4. What is the cheapest honest test of the one-time-price assumption that can run before any further building?
5. What must be true for organic search to work as the only open channel, and what does it cost to find out?

Phase 3 is not started. It should map the journey for the chosen customer only, and should not begin until questions 1 and 3 have founder answers, because the journey map is different for each.

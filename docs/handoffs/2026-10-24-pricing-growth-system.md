# AppealDeck pricing and growth system

24 October 2026. Local implementation and operating strategy for Jhangir Hussain. This is the current recommendation for the commercial journey; it supersedes earlier advice to preview every unavailable plan by default (reversed on 26 Oct 2026: previews are the default again, `off` hides them — see `docs/DECISIONS.md`, 26 Oct entry). It does not release parked product items or authorize a push or production deployment.

## The decision

Sell a complete, evidence-led case workflow. Let a seller experience useful work before paying. Offer the next purchase when its scope fits the seller's actual case. Grow repeat revenue through professionals handling multiple cases, and grow distribution through attributable recommendations.

The site can explain, demonstrate, sell, and support much of that journey. It cannot create customer demand or prove willingness to pay merely by having more discounts. Our immediate constraint is learning which sellers pay for the workflow and why, with enough contribution remaining to acquire the next customer.

A pricing consultant is optional at this stage. Ten observed buying decisions, payment and refund records, and a short weekly experiment review are more useful than another abstract pricing framework. Seek specialist help when a specific problem emerges: enterprise contracts, price localization, large experiments, or a sustained difference between strong usage and weak purchase conversion.

## What changed locally

| Area | Implemented behavior |
| --- | --- |
| Choice | SUPERSEDED 26 Oct 2026: unavailable products are shown again by default, with price and "Opens soon". (`NEXT_PUBLIC_PLANS_PREVIEW=off` hides them.) Configured prices still control what can actually be bought. |
| Pricing journey | A short guide connects the seller's job to the free tools, One Response when available, or the Appeal Pass. Checkout and required disclosures now precede the long comparisons. |
| Market comparison | Replaced generic high-price anchors with dated, linked examples: ChatGPT Free, PlatformAppeal software, and Markify's account-appeal service. Different scopes and billing periods are explicit. |
| Purchase continuity | The pricing sign-in link returns to the selected plan and purchase section. |
| Partner codes | With the referral switch on, a buyer can enter, check, retain, and remove a code. The server checks the registered partner and Paddle discount again before creating the intent. |
| Attribution | The validated code ID is stored on the checkout intent. Commission requires the signed payment to carry that same Paddle discount and an eligible base Pass price. Browser-supplied attribution after payment earns nothing. |
| Commission | Migration 0023 adds partners, codes, transaction amounts, adjustments, sales, payout records, and private statement calculations. Duplicate deliveries, partial refunds, refund-before-payment, and missing totals are handled. |
| Partner account | `/partners/account` requires sign-in. It shows only that account's codes and financial totals. It exposes no buyer identity or case material. |
| Founding offer | The counter reads the configured Paddle discount's redemptions, not every licence ever sold. Invalid configuration or unavailable counts hide the offer. |
| After the case | A resolved case offers its history, a copyable public decoder link, and voluntary feedback. Sharing includes no case data. No email is sent automatically. |
| Measurement | Added `plan_selected`, `checkout_failed`, `partner_code_checked`, and `tool_shared`, with no notice text, code, email, or case ID. Added read-only financial reports. |
| Accessibility | Price cards now have proper heading levels; pricing tables have distinct names; the page guide has a landmark. |

The new referral system is **off by default** until migration 0023 and its configuration exist. New financial history starts when that migration is installed; it does not reconstruct older payments. Payouts remain a reviewed bank/Payoneer operation, not an automatic transfer.

## The buyer and the value proposition

| Audience | Immediate problem | What earns the purchase | What causes mistrust |
| --- | --- | --- | --- |
| A seller with a new notice | What is being asked, and what should I do first? | A specific reading, records matched to the request, a response assembled from confirmed facts | Outcome promises, generic text, an unexpected subscription |
| A seller receiving a further reply | What changed, and what did my last response fail to address? | Keeping the previous work and responding to the new request | Paying for the first response again, starting over |
| A writer or VA team | Repeated document and case-management work across clients | Less rework, consistent records, usable per-case economics | A low per-case price that requires a large unused purchase, implied team collaboration that is not built |
| A trainer or referring seller | A useful resource they can recommend without risking their reputation | A genuinely useful free entry point, a disclosed discount, an auditable payment record | Unclear attribution, commissions on refunded sales, exaggerated marketing |

These are hypotheses to test in interviews and observed sessions, not researched psychological certainties. Use the seller's own words in future copy after recording permission and checking that the product delivers what those words imply.

The central message is: **Understand the request. Match the records. Prepare the response. Keep every round together.** A generic chatbot is a real alternative for explanation and drafting. The premium must be earned by the working case record and checks, not by claiming the word “AI” is special.

## The offer ladder

| Offer | Price in current source | Role | Commercial rule |
| --- | --- | --- | --- |
| Decode and local document checks | Free | Demonstrate useful work and qualify the case | Keep useful without a card; no new email wall |
| One Response | $99 | Smaller scope for a first response | Sell only when configured; explain that later responses need the Pass |
| Appeal Pass | $249 once | Main offer for one case and every round | Keep the recommendation on this product; preserve existing holders' rights |
| Credited upgrade after One Response | $150 | Extend the same case | $99 + $150 = $249. Existing eligibility checks choose the price on the server |
| AI document review | $49, followed by a $200 Pass | Optional document-first entry | Distinguish paid AI reading from the free local checks; do not push both entry products on one buyer |
| Account Pass | $329 for 12 months | Multiple cases for one seller's business | Offer when there is a real multi-case need; not a disguised professional plan |
| Credits | $390 for 10; $870 for 30 | Professional volume | Verify writers first; describe expiration and total commitment beside the unit price |
| Pro | $349 monthly, 10 credits | Recurring professional use | Keep cancel-in-Billing; measure utilization before proposing annual prepayment |

The extra plans are already built but depend on separate configuration. This work does not turn them all on. The smallest effective menu is preferable to a catalogue of promises that cannot be purchased.

## Applying Money Models

The supplied `Book.pdf` has 183 PDF pages. Its central framework and the substantive offer chapters were reviewed through extracted text, including the four offer families, rollover, feature downsells, continuity, and the implementation guidance. Page numbers below are PDF page numbers. This is an application to AppealDeck, not a reproduction of the book or evidence that its illustrative results will recur here.

| Mechanism | Application | Decision |
| --- | --- | --- |
| Attraction, pp. 30–74 | Useful free Decode and local checks, then a case-specific paid next step | Keep; do not deliberately weaken the free reading |
| Win your money back, pp. 33–41 | An action-based incentive could help collect feedback | Keep the separately configured outcome rebate small; never tie a refund to reinstatement or positive sentiment |
| Giveaways, pp. 42–50 | A sponsored Pass could reach sellers unable to pay | Do not build a sweepstakes. A future needs-based sponsorship needs real funding and published selection rules |
| Decoy, pp. 51–57 | Free and paid work show the difference in scope | Use real product differences, not an intentionally useless plan |
| Buy X get Y, pp. 58–65 | Professional packs already reward volume | Show $390 total and $39 per case together. Do not inflate standalone values to manufacture free bonuses |
| Pay now/pay later, pp. 66–70 | A free preview followed by a deliberate purchase | Keep a separate purchase. No automatic delayed charge or invented installment capability |
| Goodwill, pp. 71–74 | Ask after useful work for feedback and a recommendation | Added a small post-case prompt; public link only, no automatic send |
| Classic and menu upsells, pp. 79–94 | Recommend the scope that fits this case | Added choice guidance; retain existing case-specific advice |
| Anchor, pp. 95–100 | Real alternatives help explain the price | Use dated competitor facts. Human-service prices are not equivalent to software |
| Rollover, pp. 101–107 | Credit earlier eligible purchases toward the same case | Already built for review/One Response; retain it, prevent discount stacking |
| Payment plans and penalty trials, pp. 113–130 | Different timing could reduce an upfront objection | Not added: a smaller-scope entry already exists, and there is no operational installment system to fulfill |
| Feature downsells, pp. 131–139 | One Response removes later-round coverage | Keep the same quality standards for the narrower scope; never remove factual checks or required disclosures |
| Continuity bonuses/discounts, pp. 144–160 | Credits and professional use provide repeated value | Measure repeat work first. Annual billing is an experiment after utilization is established |
| Waived fees, pp. 161–164 | No genuine setup service exists to price | Do not create a fictional setup fee to waive |
| Build in stages, pp. 171–179 | Improve one sequence, measure it, then extend it | The governing principle for this implementation |

The author's [offer-types training](https://www.acquisition.com/training/money/offer-types) also distinguishes attraction, upsell, downsell, and continuity. The fit to this product is our judgment, not the author's endorsement.

## Coupons and referrals

The current partner offer remains **$25 off an eligible full-price Pass, plus 30 percent of discounted revenue before tax to the partner**. On the $249 Pass that means $224 before tax and $67.20 commission. On a configured $329 Account Pass it means $304 and $91.20.

Rules now supported by the local implementation:

1. A code is registered against an approved partner account and a particular Paddle discount ID. New registered codes use 3–32 letters/digits; Paddle's current API does not accept the hyphen/underscore syntax previously described by our local parser.
2. The discount must be active, checkout-enabled, a one-time flat USD 25 discount, and restricted exactly to the configured base Pass prices. Expired or exhausted discounts are refused before intent creation.
3. The retained code stays on this device for 60 days, first retained code wins until it is removed or expires. This is not cross-device attribution or proof of an entire browsing history.
4. The buyer may remove the code. Another code cannot silently replace it. A discount check is provisional; Paddle confirms the actual total before payment.
5. Upgrades, reviews, renewals, credits, and subscriptions do not earn this commission. The existing founding offer cannot stack with it.
6. Same-account self-referrals are refused. Multiple-account abuse still requires payout review; this is not a claim of comprehensive fraud detection.
7. The signed payment, validated intent, applied discount, and base price must agree. A browser event cannot award commission.
8. Commission is calculated from actual payment revenue before tax. It is withheld during the 14-day window. Pending refunds, missing amounts, currency ambiguity, and ambiguous reversals produce a hold, not a guessed payable amount.
9. Approved partial refunds reduce the commission. Full refunds and chargebacks remove it. Payments already made remain in the ledger, so a refund can produce a negative carry-forward balance.
10. Unlinked dispute reversals require reconciliation. The current Paddle adjustment schema does not document an `original_adjustment_id`; the implementation does not guess which dispute was reversed. Existing entitlement restoration logic remains separate.

Ordinary customers can apply to the same approved partner program. There is no newly promised automatic $25 customer reward or wallet: that would be another financial liability, with issuance and redemption work, rather than a copy change.

[Paddle's discount guide](https://developer.paddle.com/build/products/offer-discounts-promotions-coupons/) supports restricted, dated, and usage-limited promotions. Its [transaction reference](https://developer.paddle.com/api-reference/transactions/get-transaction/) says usage limits can be exceeded by simultaneous open checkouts. Accordingly, the founding counter is advisory, not a reserved slot or an atomic inventory guarantee. Its [adjustment webhook reference](https://developer.paddle.com/webhooks/adjustments/adjustment-created/) supplies refund status and amounts; private financial totals are based on those events.

## Economics before a larger discount

The following is an **illustration**, using a 5 percent plus $0.50 fee and an assumed $15 delivery/support cost. It excludes tax effects, refunds, overhead, and currency costs. Actual Paddle fees come from the signed transaction; actual delivery cost must be measured.

| Sale | Revenue before tax | Illustrative fee | Commission | Assumed delivery | Remaining before other acquisition costs |
| --- | ---: | ---: | ---: | ---: | ---: |
| Direct Pass | $249.00 | $12.95 | $0 | $15 | $221.05 |
| $25 direct coupon | $224.00 | $11.70 | $0 | $15 | $197.30 |
| Partner Pass | $224.00 | $11.70 | $67.20 | $15 | $130.10 |
| Hypothetical $50 direct coupon | $199.00 | $10.45 | $0 | $15 | $173.55 |

With those assumptions, the $199 direct offer needs about **27.4 percent more purchases from the same qualified traffic** merely to match the direct $249 offer's contribution. This is why an arbitrary discount is not automatically a better growth strategy. Partner commission is itself an acquisition cost; do not count it twice when evaluating CAC.

The current ladder also has a segmentation risk: a professional case can cost $29–$39 while a single seller pays $249. Those are different commitments and uses. Keep verification and the large prepaid total conspicuous; do not advertise the professional unit price as the price any distressed seller can obtain for one case.

The $99 Account Pass renewal also needs its own economics once buyers use it: account-wide cover at renewal prices may accumulate more service cost than the first purchase suggests. No existing promise is revoked here.

## The market changes the argument

On 24 October 2026, [PlatformAppeal's homepage](https://www.platformappeal.com/) advertised free classification and POA generation at €29.99 monthly. [Markify's service page](https://markifyecommerce.com/services/amazon-suspension-reinstatement/) listed ASIN appeals from $199, account appeals from $399, and complex Section 3 cases from $699. These are advertised prices and positioning, not audited outcomes or feature-equivalence findings.

The inference is important: $249 software is not self-evidently cheap. We must show the actual document checks, the trace from request to records to response, and preserved rounds. A high human-service price is a weak anchor if the buyer thinks we merely produce a letter. Do not expand a “cheaper than an expert” claim from these examples.

## Acquisition and retention by stage

| Moment | Product action | Measure | Next offer |
| --- | --- | --- | --- |
| Arrival | Let the seller try the free reading; show the supported scope | Qualified decode starts and completions | Open the case |
| First useful result | Preserve the work and name the next missing record | Case started, records reviewed, return to the same case | Pay only when response preparation is needed |
| Considering payment | Show scope, refund route, actual case eligibility and code status | Plan selected → checkout opened; failures tracked separately | One Response or Pass, based on scope |
| Payment | Signed webhook unlocks the purchase; no duplicate entitlement | Paid/parked/failed payment, activation delay | Open the bought work |
| Submitted | Keep submission immutable; a seller-set follow-up date and reminders already exist | Return to waiting case, reply added | No extra purchase for a covered round |
| Further reply | Keep the prior work and identify the new request | Reply applied → next response prepared | Credited upgrade only if existing coverage is insufficient |
| Resolved | Keep history; ask for feedback and a voluntary public-tool share | Closure, feedback, `tool_shared` | Another free reading or approved partner application |
| Professional repeat use | Compare credits against actual case volume | Active writers, credit use, repeat purchases, cancellations | A pack or Pro only when the volume warrants it |

An individual seller leaving after resolving the problem can be a successful customer. Daily activity, a longer appeal, and forced subscription continuation would be poor retention goals. Measure task completion, needed returns, recommendations, and professional repeat use separately.

No new unsolicited outreach or marketing automation was enabled. Existing opt-in reminders remain transactional. A promotional sequence would need its own consent, suppression, delivery, and unsubscribe design; a saved address for a reminder is not a marketing list.

## Experiment order and stopping rules

These are proposed management thresholds, not guarantees or claims of statistical significance. Randomization, traffic mix, uncertainty, and refunds matter more than reaching a round number.

| Order | Test | Primary criterion | Stop or revise when |
| --- | --- | --- | --- |
| 1 | Watch 10 suitable sellers use Decode through the purchase decision | Can they explain what the paid work adds and why their chosen scope fits? | People still describe the product as a letter generator or buy a scope they misunderstand |
| 2 | Current $249 offer with the shorter purchase path | Net contribution per qualified visitor, activation and refund reasons | Checkout opens rise but paid/activated cases do not; investigate payment before cutting price |
| 3 | Five approved partners, one registered code each | Retained contribution after discount, commission, refunds and service | Attribution mismatches, excessive support, fabricated claims, self-referral patterns |
| 4 | One controlled entry-price experiment, for example $199 versus $249 | Refund-adjusted contribution per comparable visitor after the refund window | Conversion lift is insufficient to cover the lost margin; stop discounting |
| 5 | Professional packs with three verified active writers | Repeat usage, unused credits and delivery cost | Buyers accumulate unused commitments or expect unsupported shared cases |
| 6 | Annual professional prepay | Net cash after reserving 12 months of delivery, plus actual continued use | The offer mostly shifts existing monthly buyers forward without incremental retention or margin |

Run one commercial experiment at a time. Preserve the price shown to an existing buyer. Use a separate Paddle price or a deliberately restricted promotion, update all price and consent copy together, and test the corresponding webhook path. The hypothetical $199 experiment and annual plan are **not configured or implemented by this change**.

Start with 20 complete 30-day cohorts as an operating review checkpoint, not a scientific sample-size claim. Compare counts and uncertainty before buying traffic aggressively. For small traffic, qualitative observation and fixing clear checkout failures may produce more reliable learning than an underpowered A/B test.

## Measurement and weekly operation

Run:

```powershell
node --env-file=.env.local scripts/pricing-report.mjs --days 60
node --env-file=.env.local scripts/referral-report.mjs
node --env-file=.env.local scripts/growth-report.mjs
```

The first report is the existing product/count report. The new partner report uses actual commission balances and paid records, not list-price estimates. The new growth report groups a customer's first 30 days of recorded purchases, waits for maturity, subtracts known refunds, and excludes incomplete or non-USD cohorts from the money total. It retains original processing fees as a conservative cost; returned processing fees are not netted. It is not profit or bank cash received. It does not include older transactions that predate migration 0023.

Each week record qualified visitors, decode/case progress, plan selections, opened checkouts, signed paid purchases, parked payments, refunds, activation delays, partner balances, service cost per case, and professional repeat use. The newly added client events remain optional and no-op without Plausible. Browser `pass_purchased` is a funnel signal; the signed financial records are the payment evidence.

Before scaling, subtract actual partner commission, advertising, AI, support time and other delivery costs. Use 30-day contribution after acquisition as the cash discipline. Do not substitute projected lifetime value for money already earned.

For feedback, ask every observed buyer: “What did you need to do?”, “What almost stopped you buying?”, “Which alternative would you have used?”, and “What did you still have to do manually?” Do not collect testimonials only from positive outcomes or condition an incentive on praise. The [FTC's endorsement guidance](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking) explains commission disclosures; its [review-rule Q&A](https://search.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers) distinguishes an incentive from a sentiment-conditioned review. Keep the disclosure beside each paid recommendation.

## Activation and verification

Follow [the referral runbook](2026-10-24-referral-activation.md) after local review. It covers migrations, the minimum Paddle read permission, exact discount restrictions, partner registration, payout recording, sandbox checks, and rollback of the feature switch. [LAUNCH-CHECKLIST.md](../LAUNCH-CHECKLIST.md) remains the ordered launch register.

No migration was applied to a remote database, no partner was registered remotely, no discount was created, no payout or email was sent, and no deployment or push occurred in this session. The six earlier referral design questions are resolved by this implementation: founder-approved code issuance, server-bound intent attribution, base Pass scope, a refund-aware ledger, a private partner view, and financial totals without buyer disclosure.

### Verification record

Verification results are recorded at the end of this handoff after the final checks. Real Paddle purchase/refund and production configuration remain separate from mocked and local Postgres evidence.

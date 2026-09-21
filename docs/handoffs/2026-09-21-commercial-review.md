# Commercial review: what the numbers say, independent of our own decisions

21 September 2026. Written deliberately outside the D1–D10 / AM-xx frame, at the founder's request. Where a conclusion conflicts with a locked decision, it says so rather than deferring to it. Judged by the rules in [DECISION-PRINCIPLES.md](../DECISION-PRINCIPLES.md).

## The one-paragraph version

The product is good and getting better. The business model has an arithmetic problem nobody has checked in eight weeks of planning: **at $199 one-time, you cannot buy a customer in this market.** Not "it's expensive" — the auction is mathematically unwinnable, because the people you bid against earn 7 to 25 times more per case than you do. That leaves exactly two ways to reach a seller: slow organic search, or someone who already has their trust. The second one is faster, pays more, recurs, and is currently filed as "deferred to P2." That is the biggest thing to reconsider.

---

## 1. The arithmetic that was never done

**What you keep from a sale.** $199 gross, minus Paddle's 5% + $0.50 = **$188.55 net.**

**What a click costs.** You are bidding in the most expensive keyword auction in advertising. Attorneys and legal services carry the highest cost per click of any industry at **$9.87**, up 15% year over year, against an all-industry average near $5.26. Cost per *lead* in that vertical is **$131.63**. Competitive legal terms run **$50–$200 per click**. The first page for "amazon suspension appeal" is entirely law firms and agencies — that is who sets the price.

**What that means.** To break even at $188.55 net with $9.87 clicks, you need **5.2% of clicks to become purchases** — before any other cost, at zero margin. A cold visitor buying a $199 product from an unknown solo founder in a market famous for scams converts nearer 0.5–2%. At 1%, your cost per customer is **$987 against $188.55 of revenue.**

**Why the incumbents can do it and you cannot.**

| Who | Revenue per case | Break-even conversion at $9.87/click |
|---|---|---|
| ecommerceChris (account) | $4,000 | 0.25% |
| AMZ Sellers Attorney | $1,500 | 0.66% |
| The Appeal Guru | $1,495 | 0.66% |
| **AppealDeck** | **$188.55 net** | **5.2%** |

They need one buyer in 150 clicks. You need one in 19. **Paid acquisition is not expensive for you — it is closed.** This is a structural fact about the price, not a marketing problem to be solved with better ads.

**The consequence.** Two channels remain: organic search, and borrowing someone else's audience. Everything below follows from that.

---

## 2. Is $199 even the right price?

Two findings pull in opposite directions, and both are true.

**It may be too cheap to be believed.** A suspended seller can be losing up to $10,000 a month. Price is how strangers judge competence in a high-stakes purchase. The Appeal Guru charges **+$1,000 purely for starting within 24 hours** and people pay it — that is direct evidence this buyer pays for confidence, not for cheapness. At $199 you are not positioned against the $1,495 firms; you are positioned against a dead $11 tool and free GPT wrappers.

**It may be exactly right for the audience you just named.** You told me the sellers are worldwide, on Amazon US. For a seller in Lahore, Dhaka or Hanoi, $1,495 is not an expensive option — it is no option. For them $199 versus nothing is the real choice, and the product is worth more to them than to anyone in Seattle.

**Correction to an earlier draft of this section.** It argued for country-tiered pricing partly because raising revenue per sale was "the only lever that moves the table in §1." That was wrong and the error mattered. Break-even conversion at a $9.87 click is 4.2% at $249, 3.5% at $299, 2.1% at $499 — all far above a realistic 0.5–2%. **No realistic price opens paid acquisition.** It would take roughly $1,000+ per case, which means becoming a different business. Price is therefore a decision about credibility and margin, not about channels — which removes the main argument for tiering.

### Decision (21 Sep 2026): one flat price of $249, worldwide

Not $249.99. The retail `.99` signals e-commerce discounting; professional services price in round numbers, and this product sells seriousness to someone in a crisis.

| Reason | Detail |
|---|---|
| Volume is capped by channel, so revenue comes from price | Organic reach is the constraint for 6–12 months. Ten sales a week at $249 rather than $199 is roughly $26,000 a year for no extra work |
| One number is operationally free | Same figure in every post, page and conversation. Tiering would mean marketing says one price and checkout says another — in a market defined by distrust, that reads as bait-and-switch |
| This audience talks to each other | Suspended sellers share Facebook and Telegram groups. A $199-versus-$399 split **will** surface there, and a trust-first brand cannot afford that discovery at launch |
| It protects the transparency wedge | One visible price is the actual differentiator against quote-gated agencies |
| It stays in the right bucket | Under the $250 threshold, and still roughly 2.4x below the cheapest human firm, so "far cheaper than a consultant" remains true and verifiable |
| Direction of travel | Raising later on proof is easy; cutting looks desperate. $249 now, $349–$399 once outcomes and testimonials exist |

**Affordability is handled without tiering:** enable Paddle's automatic currency conversion so buyers see their own currency at the same underlying price, and keep the free tier genuinely useful — it is also the entire acquisition engine. Revisit country overrides after roughly 30 paid cases, when there is evidence about which markets convert. Paddle's override capability does not expire.

---

## 3. Three ways to reach a customer, compared

| | **A. Sellers, organic** | **B. Agencies and consultants** | **C. Both, staged** |
|---|---|---|---|
| How they find you | Free decoder ranks in search; word of mouth | You email them; they are public and reachable | Free tool builds search position while you sell to agencies |
| Cost to acquire | Time, not money — but 6–12 months of content before meaningful traffic | Time only. No auction to lose | Same, split |
| Revenue per customer | $188.55 net, once | ~$415/month verified market rate for agency tooling, recurring | Both |
| What 100k/year looks like | ~10 Passes a week — needs ~870 decoder sessions a month at a 5% conversion, which is a *good* freemium rate (median is ~4.5%) | ~20 agencies | Mixed |
| Biggest risk | Amazon's own assistant and free tiers contest the same queries; slow to first revenue | Needs multi-tenant and sync, which cuts against local-first | Divided attention for one person |
| Evidence it works | Helium 10, Jungle Scout, SellerApp and Getida all grew on free tools | SellerForge sells an agency tier at $4,990/year; agencies visibly pay for this | — |
| Status in the current plan | The plan | **Deferred to P2** | Not considered |

**The uncomfortable observation.** The hardest distribution problem in the world is reaching scattered individuals in a panic, one at a time, with no budget to advertise to them. That is what the current plan commits to. Meanwhile the people who *already have* those sellers — consultants and agencies — are findable, reachable by email, pay roughly twice your one-time price every single month, and need exactly what this product is unusually good at: evidence discipline, an audit trail of what was asked and what was sent, and revision history across attempts. One agency doing twenty cases removes twenty acquisition problems.

**The honest cost of option B.** It needs accounts, roles and sync — real work, and it cuts against local-first, which is currently a core promise. But note what local-first actually protects: a *seller* worried about handing their account data to a stranger. An agency has already been handed everything. The promise matters less to them, so the conflict is smaller than it looks.

---

## 4. What Amazon is doing to your core

Phase 1 verified that Amazon's own assistant now guides appeals and can act on some policy violations with approval. It is free, it is inside Seller Central, and it is improving.

So: **decoding a notice and drafting a Plan of Action is the part being commoditized at the source.** That is also the part five visual passes and most of the feature work have gone into.

What Amazon will never build is a tool that helps a seller argue *against* Amazon: an independent record of what was demanded, what was sent, what came back, and what has not changed between attempts. That is adversarial to its own enforcement. It is also, by luck rather than design, the part already half-built here — submissions, receipts, attachment hashes, revisions and reply categorisation all exist.

**Conclusion: stop investing in the front end Amazon is eating. Finish the record it cannot build.**

---

## 5. The words

Current positioning describes the commodity: decode a notice, draft a Plan of Action. Amazon does that free, and so does ChatGPT.

The precise claim — true, falsifiable, differentiated, promising nothing:

> **Never send Amazon the same appeal twice.**

It works because it names a documented harm rather than a benefit: sellers have sent twelve and thirteen near-identical appeals; each weak attempt burns a limited opportunity; Amazon's own wording warns it may stop responding. No free tool can say it, because none of them remembers the last attempt. It contains no success rate, no speed claim, no guarantee.

Supporting lines in the same register — each one a capability, not an apology:

- "We show you what's missing before Amazon does."
- "Amazon keeps a record of your case. Now you have one too."
- "Every document, with the line of the notice that asked for it."

And the category word: stop saying **appeal writer** or **AI appeal tool** — that is the commodity you lose on. Say **case record**.

---

## 6. What to stop

- **Visual overhaul passes.** Five are done. No suspended seller has used the product. A sixth teaches nothing.
- **Feature waves before contact.** Everything in the Phase 4 backlog is reasonable and none of it is validated.
- **Treating accumulated exclusions as ethics.** Refusing fraud cases protects the business — it is the chargeback, payment-processor and trust defence at once. Refusing intellectual-property cases protected nothing and forfeited the loudest segment in the market; that one is now fixed. Check the rest the same way.
- **Planning documents as progress.** This one included, once it has been acted on.

## 7. What holds up well

Not everything should change. These survive first-principles scrutiny:

- **The honesty position is commercially correct**, not just ethically. In a market with bribery convictions and 93–99% fake success rates, where the two most credible firms publish no numbers at all, it is the only differentiation available to an unknown founder. Keep it — but phrase every limitation as a capability (§5).
- **Read-only, no credential handover.** A competitor's own reviews flag firms asking for the seller's password. Refusing that is a selling point.
- **Per-case rather than subscription, for sellers.** A suspended seller will not sign up for a monthly plan during a crisis.
- **Amazon US only.** Correct, for the reasons in Phase 4 §1a.
- **The evidence discipline itself.** Source-quoted requirements, page references, content hashes, re-opening a requirement when its file is deleted. This is genuinely better than what the market ships, and it is exactly what an agency would pay for.

---

## 8. The recommendation

1. **Do the three-day fixes now** — storage persistence, the two stale facts, migration 0008. One prevents silent case loss; one prevents false copy; one unblocks the only honest outcome data you will ever have.
2. **Put it in front of ten real sellers within two weeks.** Not a pilot with thresholds — ten conversations. The four phases have extracted everything reading can give; the next real information only exists outside the building.
3. **Test price by geography, not by discount.** Higher in high-income markets, $199 or below elsewhere.
4. **Spend one week testing the agency channel before committing to the consumer one.** Email twenty appeal consultants, show them the case record, ask what they would pay. It is a week, it costs nothing, and it is the only path where acquisition arithmetic works in your favour.
5. **Finish the record, not the front end.** Prior-submission comparison and the attempt ledger are the durable product.

---

## 9. What this review could be wrong about

- **The CPC figures are from the legal vertical**, which is adjacent to but not identical to this niche. The direction is safe — the first page is law firms and agencies, who set the price — but I did not pull keyword-level costs for these exact terms. That check is worth doing before any ad spend, and it cannot make the picture better, only worse or less bad.
- **No repeat-suspension rate exists in public data**, so lifetime value beyond one case is unquantified. One relevant rule did surface: two repeat violations within 180 days trigger automatic deactivation regardless of account health — which supports prevention being valuable, but does not size it.
- **The agency channel is a market signal, not a validated demand.** Agencies visibly pay for tooling; none has said they would pay for *this*. That is what the one-week test is for.
- **No seller has been asked anything.** Every judgement about what sellers value remains inference from forum posts and competitor reviews.

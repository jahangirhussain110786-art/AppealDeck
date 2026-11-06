> **Historical research, superseded for decisions on 6 Nov 2026.** Read the [reviewed master](../../../2026-11-06-account-history-master.md) before using these conclusions. It corrects evidence labels, document-dispute safeguards, policy interpretation, priorities and acceptance tests. This original is retained for provenance.

# How an Amazon seller account's own record affects an appeal

Research date: 6 Nov 2026. Tags: **[V]** = Amazon's own wording, from an Amazon page or a verbatim repost of an Amazon help page (the repost is named); **[P]** = practitioner experience (named); **[U]** = unverified forum anecdote or unattributed third-party summary.

**Access caveat that shapes this whole file:** every Seller Central help URL I fetched (`/gp/help/external/G521`, `/gp/help/external/GR786P4BPEVKTBAG`, `sellercentral-europe…/G521`) returned only the logged-out landing page. Amazon's own AHR wording below therefore comes from **verbatim reposts** (Hopted's SP-API help-article mirror, an Amazon Seller Forums post quoting the policy) plus search-engine snippets of the Amazon pages. I could not retrieve the Seller Code of Conduct text, BSA Section 3 text, or Amazon's "how to write an appeal / Plan of Action" page directly. Before any of this goes into product copy, someone signed in to Seller Central should check it against G521 and the Code of Conduct page.

## 1. Does the Account Health Rating (AHR) policy say how prior violations count?

### Takeaway
Yes, and it is the clearest official statement about account history. AHR covers the **last 180 days**. A violation's point cost **goes up each time the same policy is broken again**. There is a separate hard cap on repeats: by Amazon's wording "in most cases" five for infringement-related policies and two for restricted-products policies in 180 days. Reaching it can mean immediate deactivation **regardless of the AHR score**. So whether a violation is a repeat, and how many repeats there were within 180 days, is the history fact that matters most.

### Cited Findings
- [V] "All new sellers start with a score of 200"; the score reflects "policy adherence and selling activities over the last 180 days." — Amazon AHR help text reposted verbatim at [Hopted mirror of Amazon help article](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating); same wording in the search snippet of [Amazon G521](https://sellercentral.amazon.com/gp/help/external/G521)
- [V] "Upon detection of any new policy violations associated with your selling account, you lose points." / "You gain points when you successfully address those violations." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V] "There are four severity levels: critical, high, medium, and low." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V] **Escalation for repeats:** "the point values associated with violations included in your AHR increase each time that policy is violated." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V] **Repeat cap, independent of the score:** your account "may be at immediate risk of deactivation if you reach the maximum number of repeat violations for infringement-related policies or restricted products policies in a 180-day period". Amazon "may also implement additional maximum numbers of violations for other policy areas." — quoted in an [Amazon Seller Forums post](https://sellercentral.amazon.com/seller-forums/discussions/t/45aed975-7ba9-4c65-9a9f-1ceb589d8014); "regardless of your AHR" per the [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V] "In most cases, the maximum number of repeat violations is five for infringement-related policies and two for restricted products policies." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating); the same figures are repeated by [ESQGo](https://www.esqgo.com/amazons-account-health-rating-program-policy/) [P]
- [V] Bands: green "Healthy" 200–1,000, meaning not at risk of deactivation "based on the scored policies" (Amazon FAQ snippet, [GR786P4BPEVKTBAG](https://sellercentral.amazon.com/gp/help/external/GR786P4BPEVKTBAG)); yellow "At Risk" 100–199; red "Unhealthy" at 99 or lower = "eligible for deactivation or already deactivated" — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V] The AHR does not change Amazon's existing policies. It combines violations into one score. — Amazon G521 search snippet ([G521](https://sellercentral.amazon.com/gp/help/external/G521))
- [V] Points are also granted "when a minimum number of orders are filled." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [U] "4 points for every 200 successful orders … over the last 180 days", and the score "won't decrease below 200 unless you have policy violations". These are answers in the Amazon Seller Forums seen only as search snippets. I could not open the posts or tell whether an Amazon staff member wrote them. Seller Labs repeats the 4-per-200 figure with no source ([Seller Labs, updated 29 Jul 2026](https://www.sellerlabs.com/knowledge-base/how-amazon-account-health-rating-ahr-works-the-complete-seller-s-guide/)).
- [U] "Policy warnings are removed from your Account Health page after 180 days." This was a search-snippet summary of forum answers; no Amazon page was retrieved that says it.
- [P/U] Critical violations drop the score to 0 at once, and severity depends on customer impact, legality and "prior violations of the same policy". From [Seller Labs](https://www.sellerlabs.com/knowledge-base/how-amazon-account-health-rating-ahr-works-the-complete-seller-s-guide/), which cites no Amazon source for its point values or its "72-hour grace period". Treat these as unverified.
- [V] "If your selling account has been deactivated, you may be eligible for reinstatement", which requires "a plan of action to correct the issues that contributed to the enforcement action." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)

### Inferences
- A tool needs to know, **per policy family**, how many violations of that same policy the account received in the last 180 days. Amazon raises the point cost per repeat and caps repeats separately (infringement 5, restricted products 2), so "this is my third IP complaint" is a different case from "this is my first".
- A green AHR does not protect against a repeat-cap deactivation. Pre-send checks should not say "your AHR is healthy, so the risk is low."
- "Successfully address" earns points back. Each earlier warning the seller left unanswered may still be open on the Account Health page and worth answering. This is an inference; Amazon does not say that answering an old warning helps a deactivation appeal.
- The 180-day window cuts both ways. A violation from 14 months ago no longer counts toward AHR. Whether Seller Performance reviewers still see it is unknown (see Gaps).

### Gaps
- The exact point value of each severity level is not published by Amazon in anything I could retrieve. Third-party tables (Seller Labs' "IP complaint: 200 to 85", for example) are illustrative or invented.
- I could not confirm whether violations older than 180 days remain visible to the reviewers who read an appeal. They drop out of the AHR score, but Amazon does not say they leave the record.
- The AHR "Frequently Asked Questions" page (GR786P4BPEVKTBAG) could not be read beyond its snippet.

## 2. How does Amazon describe repeat or recurring violations (Code of Conduct, BSA, help pages)?

### Takeaway
The only official repeat-violation wording I could verify is in the AHR policy (point escalation plus the 180-day repeat cap). I could not retrieve the Business Solutions Agreement or Seller Code of Conduct text. Practitioners say BSA Section 3 is the clause Amazon cites for repeated violations, but they paraphrase it rather than quote it.

### Cited Findings
- [V] Point escalation per repeat and the repeat cap: see section 1.
- [V, via a forum-quoted notice] A deactivation notice quoted in the Seller Forums says the account was "previously alerted" that it was "at risk of deactivation due to incurring repeat violations", and that "no valid plan of action had been received". So Amazon's own notices cite the earlier warnings when they deactivate for repeats. — search-result summary of [Amazon Seller Forums (UK)](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/f4938785-2ef5-4b5d-97af-6e6adc5021d9). I did not open the thread; treat as [U] until checked.
- [P] BSA Section 3, as paraphrased by Riverbend Consulting (no verbatim quote): Amazon can end the agreement on 30 days' notice; can suspend if it notifies a breach and the seller does not cure it within seven days; and can act without notice where there is third-party liability, suspected illegal or fraudulent activity, or harm to Amazon, buyers or other sellers. — [Riverbend Consulting, updated 24 Sep 2026](https://riverbendconsulting.com/blog/amazon-section-3-violation/)
- [P] Attorney commentary says Section 3 "details how they handle sellers who repeatedly violate the rules" and lists repeated policy violations among the situations where Amazon cites it. — [Amazon Sellers Lawyer (Jeff Coleman's firm)](https://amazonsellerslawyer.com/amazon-bsa-section-3)
- [V, paraphrase] The Code of Conduct "requires that sellers act fairly and honestly on Amazon to ensure a safe buying and selling experience." — quoted in a [Seller Forums post](https://sellercentral.amazon.com/seller-forums/discussions/t/a3c0c769-dab1-4c75-a5c0-43fceb67b581) (search snippet only)

### Inferences
- When Amazon deactivates for repeats, the notice itself is likely to cite the earlier warnings. The tool can detect "previously alerted" / "repeat violations" wording in the notice and switch the letter into its repeat mode even when the seller has not mentioned the history.
- The seven-day cure window the BSA gives after a notified breach is a reason to ask whether the seller ignored or never answered an earlier warning. That changes what the POA has to explain.

### Gaps
- No verbatim BSA Section 3 or Code of Conduct text was retrievable. The well-known phrase "repeated violations may result in permanent deactivation" could not be traced to an Amazon page in this pass; **do not quote it as Amazon's wording**.
- Whether Amazon treats violations of *different* policies as "repeat" for escalation (as opposed to repeats of the same policy) is not stated. Amazon's wording is "each time that policy is violated", which points to the same policy.

## 3. What must a POA do differently when the problem is a repeat?

### Takeaway
Practitioners agree on the general rule: a repeat appeal must name the specific root causes behind the earlier warnings as well as the current one. It must not resend or reword a prior plan, and its preventive measures must cover all inventory, not one ASIN. No practitioner source I reached sets out a dedicated "repeat-offender" method. The best-sourced point is McCabe's: don't answer warnings generically.

### Cited Findings
- [P] Chris McCabe (ecommerceChris), reposted 29 Nov 2016 (an old source): don't give a generic response to warnings. Write a detailed analysis of the specific root causes behind "the warnings and suspension". Address every element that led to the suspension, with solutions that apply to all inventory, not ASIN by ASIN. — [wortfilter.de repost of McCabe](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/)
- [P] Resubmitting the same appeal with tidier wording "almost never works", because Amazon is judging whether the seller controls the problem; each denial signals the same unresolved issue. — practitioner guides surfaced in search, e.g. [Traverse Legal](https://www.traverselegal.com/blog/amazon-plan-of-action/), [ecomcircles 2026 guide](https://ecomcircles.com/blog/amazon-suspension-prevention-recovery-guide-2026/) (commercial sites; [P] at best)
- [P] Naming the wrong root cause is "the most common reason first appeals fail". — search-result summary of the 2026 guides above (exact page not pinned; treat as [U])
- [P] A root cause must be "the operational breakdown that triggered the policy issue, not the symptom, and not the metric", stated as one to three controllable causes. Don't argue the enforcement decision. — [Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/how-to-create-a-strategic-well-written-plan-of-action-to-reinstate-selling-privileges/)
- [P/U] A client review of ecommerceChris says intake covered "account notices, ASIN details, and any prior correspondence with Amazon". — [Launchpad Reviews](https://launchpadreviews.bearblog.dev/ecommercechris-review/) (single anecdote)

### Inferences
- In repeat mode, the letter needs an explicit "history" element: what the earlier warning was, what the seller did then, why that was not enough, and what is different now. This follows from "address the warnings and suspension" plus "don't resubmit the same plan". No source prescribes this exact section, so it is a design inference.
- Pre-send checks for a repeat case: (a) the earlier warning is mentioned; (b) the preventive measures are new or stronger than the ones already promised; (c) the text is not substantially the same as a prior submission. AppealDeck's change report already does (c).

### Gaps
- No source from Cynthia Stine (eGrowth Partners), Seller Candy or Sellers Funding on repeat cases was found in this pass; fetches of Riverbend pages did not cover repeats.
- No Amazon statement says acknowledging history helps, or that omitting it hurts.

## 4. Do account age, sales history or performance metrics matter in practice?

### Takeaway
I found no official Amazon statement that account age or sales history counts in an appeal. Order volume earns AHR points, and new accounts start at 200, which is the only official link between activity and standing. Forum anecdotes say a long history does not override the violation, and that fast sales growth without an established history can itself trigger review. For policy suspensions, McCabe advises against leaning on performance metrics.

### Cited Findings
- [V] New sellers start at 200; points are granted "when a minimum number of orders are filled." — [Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [P] McCabe (2016): if a policy team rather than Seller Performance suspended you, treat performance metrics as secondary. Don't include Feedback or Account Health screenshots, and focus on "policy matters, and not performance metrics". — [wortfilter.de repost](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/)
- [U] A seller reports permanent deactivation despite claiming "over $22 million in sales history" (alleged forged documents). — [Amazon Seller Forums](https://sellercentral.amazon.in/seller-forums/discussions/t/b139588b-e961-49f5-aa3c-193f3ea2f1a9) (search snippet; seller's own claim)
- [U] A quoted suspension notice reads "Your current sales volumes are not supported by buyer feedback or an established sales history." So a *short* history combined with a sales spike is itself a stated trigger. — Seller Forums result in the same search (thread not pinned)
- [U] A forum answer: after reinstatement, category approvals must be redone regardless of previous approvals or sales history. — [Seller Forums (UK)](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/014dd681-9a63-4343-99db-0e6b17db9f9e)
- [P] Opening a new account during a suspension is "detrimental" to reinstating the original. — [Riverbend Consulting](https://riverbendconsulting.com/blog/suspended-amazon-account/) (search snippet)

### Inferences
- The tool should not treat account age or sales as mitigating in the letter. At most, a sales figure belongs where it is evidence (units sold against invoices), which AppealDeck already uses.
- A young account with a sudden sales jump is a distinct case (velocity / "established sales history"). The history question to ask is "when did sales start rising?", not "how old is the account?"
- Whether there is a second account is a history fact worth asking about, because practitioners say it damages the appeal.

### Gaps
- No practitioner source I reached claimed that long-tenured accounts get softer treatment. I found no reliable evidence either way.

## 5. Tone of prior communications: official guidance and practitioner reports

### Takeaway
I found no retrievable Amazon page that names abusive or threatening messages to Amazon as a violation or an appeal factor. The Code of Conduct's "act fairly and honestly" is the nearest official hook, and Helium 10 notes the Code is vague on threatening or harassing behaviour. Practitioners consistently say angry, emotional, pleading or Amazon-blaming messages correlate with failed appeals. I found no source that says a *past* angry message is held against a later, well-written POA.

### Cited Findings
- [V, paraphrase via forum] The Code of Conduct requires sellers to "act fairly and honestly". — [Seller Forums post](https://sellercentral.amazon.com/seller-forums/discussions/t/a3c0c769-dab1-4c75-a5c0-43fceb67b581)
- [P] "Amazon's Code of Conduct vaguely phrases what may be regarded as threatening or harassing behavior" (Helium 10's commentary, not Amazon text). — [Helium 10](https://www.helium10.com/?p=10262)
- [P] McCabe (2016): the emails he reviewed that did not lead to reinstatement were full of venting, begging and pleas for help. Don't react angrily. Don't flatter or plead. Don't comment on Amazon's processes or the slowness of its teams. Don't blame buyers. Don't fire off an immediate response with the "Appeal" button. Put the key points at the top of a short letter. — [wortfilter.de repost](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/)
- [P] Appeals should read as "factual and respectful, not defensive or emotional"; "blame, long stories, and emotional arguments weaken credibility"; a POA fails "when it reads like a legal defense" or "like a customer complaint". — [My Amazon Guy](https://myamazonguy.com/suspensions/submit-an-appeal-to-amazon/), [Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/how-to-create-a-strategic-well-written-plan-of-action-to-reinstate-selling-privileges/)

### Inferences
- The evidence covers the tone *of the appeal itself*. A check that flags blame, threats, pleading and commentary on Amazon in the seller's draft is well supported; AppealDeck's critic already checks blame-shifting.
- Asking the seller for the tone of their *past* messages has no sourced basis as an appeal factor. It may still help to ask whether an angry or threatening message was sent: a calm letter cannot unsend it, and it could fall under "act fairly", which matters if the notice cites conduct. This is a weak inference; do not present it as Amazon policy.

### Gaps
- No Amazon wording on "respectful communication" with Seller Performance was found. No practitioner account of a reinstatement refused *because of* earlier abusive messages was found.

## 6. Amazon's own appeal guidance and what it says about history

### Takeaway
I could not retrieve Amazon's "how to appeal / Plan of Action" help or Seller University page. The only Amazon appeal wording obtained (from the AHR page) asks for "a plan of action to correct the issues that contributed to the enforcement action". The plural "issues that contributed" is the only official hint that contributing history belongs in the POA.

### Cited Findings
- [V] Reinstatement requires "a plan of action to correct the issues that contributed to the enforcement action." — [Hopted mirror of Amazon AHR help](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)
- [V via forum notice, unopened] Repeat-violation notices say the account was "previously alerted" and that "no valid plan of action had been received". — see section 2 ([Seller Forums UK](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/f4938785-2ef5-4b5d-97af-6e6adc5021d9))
- [P] The common three-part structure (root cause, corrective actions already taken, preventive measures) is described by every practitioner source, but no source I reached tied it to a retrieved Amazon page. — [Traverse Legal](https://www.traverselegal.com/blog/amazon-plan-of-action/), [Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/how-to-create-a-strategic-well-written-plan-of-action-to-reinstate-selling-privileges/)

### Inferences
- Taken together for AppealDeck: the history facts that a source supports asking for are (1) earlier warnings for the **same policy** in the last 180 days, with dates and how many; (2) whether each warning was answered, and with what; (3) earlier POAs for this case and why they were refused; (4) the AHR band at the time of the notice; (5) whether another account exists; (6) for velocity-type notices, when sales began to rise. Account age, total lifetime sales, and the tone of old messages have no sourced basis as appeal inputs.

### Gaps
- Amazon's Seller University appeal module and the "Appeal an account deactivation" help page were not retrieved (login wall). They should be checked, signed in, before any claim about "what Amazon says to include" goes into product copy.
- No numeric success rates were found or used; none should be inferred.
- Disagreement noted: third-party guides (Seller Labs) present point tables, a 72-hour grace period and per-severity deductions as fact, but Amazon's retrievable wording gives no numbers beyond the bands and the repeat caps.

# Account history and background: master file (6 Nov 2026)

> **Reviewed and corrected independently on 6 Nov 2026. This is the current decision document; the original report and five research notes are historical supporting material.** Documentation updated at the founder's request; product implementation is still unapproved and unbuilt.

> **One file for everything on this topic.** It holds the founder's question, the five research threads, ChatGPT's review (checked against the code), Amazon's own policy wording read directly from Amazon's PDF, the tool-today-vs-findings table, and the plan. **Nothing in `src/` has been built for it.** Register row: R-18 in `docs/PARKED-ITEMS.md`.

## Contents

- Part A. The question, the short answer, what is in this folder
- Part B. Amazon's own wording, read directly (new, 6 Nov)
- Part C. Code review and its limits
- Part D. The full findings (the research report)
- Part E. AppealDeck today vs the findings (table)
- Part F. Revised plan and product boundaries
- Part G. Acceptance scenarios for future implementation
- Part H. Remaining verification
- Part I. Independent review and primary-source register

---

## Part A. The question, the short answer, the files

### The founder's question

From a Meta AI chat (5 Nov 2026): _"Har account alag hai: ek hi violation, ek hi POA, ek account khul jata hai, dusra nahi khulta."_ Every account is different; the same violation and the same Plan of Action can open one account and not another. Does AppealDeck take the account's history into account? Is it "trained" on that kind of data? The founder also asked what professional appeal firms ask a seller before writing, so the tool asks for everything of real value.

### The short answer

- **The point is real.** Amazon reads the account's record, not only the letter. Two accounts can send the same letter and get different results because the record behind them differs.
- **Four parts of the past have a source:** repeats of the same policy (Amazon's own policy, read directly: Part B); what earlier rounds put on the record (refused letters, escalations used, documents Amazon called unverified or forged); other accounts tied to this one (and the money held because of them); identity and funds checks that run separately.
- **The reviewed evidence does not establish** account age, lifetime sales or old message tone as general predictors of appeal outcomes. Ask contextual questions only when the notice or evidence makes them relevant; absence from a public intake form does not prove irrelevance.
- **AppealDeck today is "case-aware, with incomplete account-history awareness"** (ChatGPT's phrase; it matches the code, Part C). Earlier appeals, Amazon's replies, linked-account cases and held funds are built. The account's own background is not asked.
- **AppealDeck is not trained on accepted and rejected appeals.** It uses general-purpose models with instructions, policy context, the seller's facts and output checks (Part C). We must never claim otherwise.
- **History must change what we ask, what we check and what the letter covers.** Never a score, a chance or a prediction (D6).

### Files in this folder

| File | What it is |
|---|---|
| `docs/handoffs/2026-11-06-account-history-master.md` | This file: everything in one place |
| `docs/handoffs/2026-11-06-account-history-research/reports/Account history and Amazon appeals.md` | Historical report; superseded for decisions by this reviewed master. Part D preserves the findings with corrections |
| `.../research_notes/Account history and Amazon appeals/account_record.md` | Thread 1: warnings, repeats, Account Health Rating, account age, tone |
| `.../research_notes/.../prior_appeals_and_documents.md` | Thread 2: earlier appeals, documents Amazon doubted, invoice checks, changes before appealing |
| `.../research_notes/.../related_accounts_and_funds.md` | Thread 3: linked accounts, VAs, held funds, identity checks |
| `.../research_notes/.../escalation_and_variance.md` | Thread 4: routes after a refusal, why outcomes differ |
| `.../research_notes/.../firm_intake.md` | Thread 5: what appeal firms ask for, and why |
| `docs/handoffs/2026-11-06-account-background-plan.html` | Plain one-page version for reading on a phone |

Evidence labels: **[V-direct]** Amazon-hosted policy file read directly, with version/marketplace limits; **[Amazon staff]** attributable staff guidance or an announcement, not equivalent to policy text; **[Indexed Amazon]** policy text retrieved through search indexing, not an authenticated live-page check; **[Repost]** purported Amazon wording reproduced elsewhere; **[Firm]** the firm's own published description of its intake/service; **[P]** practitioner experience; **[U]** seller anecdote, snippet or unattributed claim; **[Design]** our proposed product behaviour. A commercial firm's statement is never upgraded to Amazon policy. The historical notes used inconsistent [V] definitions; use this master for decisions. No reliable success-rate estimate was established.

---

## Part B. Amazon's own wording, read directly (6 Nov 2026)

ChatGPT linked Amazon's Account Health Rating policy as a PDF on Amazon's own servers: `https://m.media-amazon.com/images/G/09/rainier/help/Account_Health_Rating_program_policy_and_FAQ_EN.pdf`. We downloaded it and extracted its text locally (12 pages). **This upgrades the research's main "official" points from reposts to Amazon's own file.**

About the file: English text; the PDF's language tag and links point to Amazon Japan (sellercentral.amazon.co.jp); created 11 March 2025 in Microsoft Word; it says "Revised enforcement processes under AHR will become effective on September 13, 2023." So it is Amazon's own text, but **a Japan-hosted copy from March 2025**; the live US page may have changed since. A signed-in check of the US page is still needed before product copy says "Amazon says".

What it says **[V-direct]** (short quotes):

1. **The window:** the score reflects "policy adherence and selling activities over the last 180 days". New sellers start at 200.
2. **Bands:** green "Healthy" 200 to 1,000 ("not at risk of deactivation based on the policies comprising the score"); yellow "At Risk" 100 to 199; red "Unhealthy" 99 or lower ("eligible for deactivation or already deactivated").
3. **Repeats cost more each time:** "the point values associated with violations included in your AHR increase each time that same policy is violated."
4. **The repeat cap:** an account "may be at immediate risk of deactivation if you reach the maximum number of repeat violations … in a 180-day period, regardless of your AHR." The maximum is "five for infringement-related policies and two for restricted products policies." The policy qualifies the headline limits with "in most cases". More severe violations have lower repeat thresholds; the FAQ contrasts high-severity infringement with lower-severity used-as-new violations. Do not calculate a universal safe allowance from these examples.
5. **The seller can see repeats:** "repeat violations are labeled as such in the 'Impact' column on your Account Health page." **This means the tool can ask a precise question: "Does your Account Health page say 'Repeat' next to this violation?"**
6. **A healthy rating does not protect:** "Regardless of your AHR score, Amazon may deactivate your account immediately if required by law; if we suspect fraudulent, deceptive, illegal, or otherwise harmful activity (including any activity that attempts to circumvent Amazon's systems); or you violate other policies outside of AHR."
7. **Critical violations have a 3-day grace period:** the AHR turns red at zero and "You will have a 3-day grace period to address the violation before account deactivation." Reaching the repeat cap raises a critical violation with the same 3 days, appealed "through the Product Policy Compliance Dashboard". (The research had marked a "72-hour" figure as unverified; Amazon's own file confirms 3 days.)
8. **The most important new finding for the tool: admitting versus disputing.** "Violations that have been removed from your Account Health page after a successful appeal, where you did not dispute the activity occurred, may still count towards the maximum threshold for repeat violations within a 180 day period." **Preserve "may": an admitted violation may still count after a successful appeal. A confirmed erroneous finding is removed; selecting "dispute" inside AppealDeck does not itself change Amazon's record.** Explain the qualified policy distinction before the tool's "accept / dispute / unsure" choice; the UI choice itself has no effect on Amazon's record.
9. Violations are removed from the page when a dispute succeeds, a rights owner retracts an IP complaint, or an appeal succeeds and Amazon "determine[s] that while you did violate these policies, it was not intentional and the violation should be forgiven."
10. **Correction:** the FAQ question is not an answer saying Amazon refuses disclosure. Its answer gives typical deductions of two to eight points, possible doubling for repeat violations, and four points per 200 successful orders over 180 days. These are versioned policy details, not a basis for our own outcome score.

**Deadline limitation:** the three-day provision describes the AHR critical-violation process in this PDF. Immediate-deactivation exceptions also exist. Never create a universal three-day countdown from the word "critical"; confirm the applicable process and the notification date/instructions.

---

## Part C. Code review and its limits

The relevant code was inspected on 6 Nov. App behaviour and model context must be distinguished; no live outcome database count was verified:

| ChatGPT's claim | Checked | Result |
|---|---|---|
| AppealDeck uses the current notice and form instructions, earlier requests and reply criticisms, locally stored prior appeals, the seller's explanation, actions and prevention, business details, suppliers, document checks, multiple issues and specialist-review safeguards | `src/lib/draftRequest.ts` `draftRequestFrom` sends the notice plus all earlier requests, form instructions, attempt number, the three answers, attached and declined records, requested records, issues and the latest reply's criticisms | **True** |
| Earlier submission wording stays on the device; the AI gets an attempt count and other current case context, not recorded earlier submission wording | `src/core/workspace.ts` `composePayloadWorkspace`: history and earlier requirement lists are emptied; submissions travel empty except one wording-free marker that a send is on record ("The sent text itself still never leaves the device") | **True, and deliberate** (privacy) |
| Repetition checks exist locally, but there is no check for contradictions across rounds | The change report and duplicate guard compare wording and facts between rounds; nothing compares a new claim with an earlier promise (for example "we stopped using supplier X" then a later invoice from X) | **True: a real gap** |
| No structured account-history assessment (earlier warnings, earlier deactivations, unresolved violations, whether promised fixes happened) | Matches our own grep: `CaseFacts` holds business name, address, suppliers, units sold only | **True** |
| Not trained on accepted/rejected appeals | No outcome-trained model exists; the inspected code uses general-purpose models; live outcome-data counts were not checked, and underlying model pretraining is unknown | **True** |
| The Amazon AHR PDF link | Fetched and read (Part B) | **Real Amazon file, Japan-hosted, March 2025** |

What ChatGPT adds to our plan (adopted, Part F): allow **"I don't know"** on every history question and never treat a missing answer as a clean history; a **connected timeline** where each earlier submission links to its documents, Amazon's reply and what changed, with the reply status named (refused / waiting / asked for more information); a **check against earlier claims and promises**, which asks the seller to explain a difference without inventing an explanation or accusing; **questions that change with the circumstance** (an accepted repeat asks about earlier corrective work; a dispute asks for evidence without forcing an admission; another unresolved violation stays visible as its own issue); **paired-case tests** proving that different histories change the help and irrelevant differences do not (Part G); and the rule **"collect a fact only when we can say what decision it changes."**

ChatGPT's own correction of the Meta AI chat matches ours: "under 10% after two rejections", "Tuesday morning is best" and fixed acceptance rates have no evidence; an observed pattern does not prove its cause; missing information does not make an appeal pointless.

---

## Part D. The full findings

### Most "official" wording is second-hand, except Part B

Seller Central help pages could not be read without a login. Every help URL the researchers fetched (the AHR page, its FAQ, the Seller Code of Conduct, the multiple-accounts page, the funds policy, the Seller Challenge FAQ, Amazon's appeal guidance) returned only the logged-out shell. Amazon's wording therefore comes from verbatim reposts (chiefly the Hopted mirror of the AHR article), Amazon staff posts on the Seller Forums, notices sellers quote, and search snippets. Two Amazon texts were read in full: the **Business Solutions Agreement (BSA) PDF** ([Amazon BSA PDF](https://m.media-amazon.com/images/G/01/rainier/help./1.1_BSA_PDF_English.pdf), which links to a 2022 translation, so the live November 2026 wording is unconfirmed) and the **AHR policy PDF** (Part B). Before any sentence below goes into product copy as "Amazon says", someone signed in to Seller Central must check it against the live page.

### 1. Repeats of the same policy are the history fact Amazon itself names

Part B now confirms this from Amazon's own file: the 180-day window, the bands, "increase each time that same policy is violated", the cap of five (infringement) and two (restricted products) in 180 days "regardless of your AHR", the scoped 3-day AHR process (not a universal deadline), and that admitted-and-forgiven violations may still count towards the cap.

Practical points:

- **A green AHR does not protect against a repeat-cap deactivation or a fraud/harm deactivation.** The tool must never reassure a seller that a healthy band means low risk.
- The useful question is not "what is your score?" but **"how many warnings for this same policy in the last 180 days, and when? Does your Account Health page mark it 'Repeat'?"**
- Whether violations older than 180 days stay visible to the person reading an appeal is unknown: they leave the score, but no source says they leave the record.
- Amazon's notices tend to name the history: **[U]** a forum-quoted notice says the account was "previously alerted" that it was "at risk of deactivation due to incurring repeat violations", and "no valid plan of action had been received" ([Seller Forums UK](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/f4938785-2ef5-4b5d-97af-6e6adc5021d9)).
- **[Repost]** Amazon's appeal wording asks for "a plan of action to correct the issues that contributed to the enforcement action" ([Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)); the plural alone does not establish a requirement to include account history. Relevance follows from the actual allegation and request.

What a repeat letter must do is practitioner advice: **[P]** Chris McCabe (former Amazon investigator) says analyse the root causes behind "the warnings and suspension" and give preventive measures for all inventory, not ASIN by ASIN ([wortfilter.de repost, 2016](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/)). **[P]** A root cause is "the operational breakdown that triggered the policy issue, not the symptom, and not the metric" ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/how-to-create-a-strategic-well-written-plan-of-action-to-reinstate-selling-privileges/)). **[P]** The BSA's seven-day cure window after a notified breach, as Riverbend paraphrases Section 3, is a reason to ask whether an earlier warning went unanswered ([Riverbend](https://riverbendconsulting.com/blog/amazon-section-3-violation/)). The phrase "repeated violations may result in permanent deactivation" could not be traced to an Amazon page and must not be quoted as Amazon's.

Other "background" facts have weak or no support. **The reviewed sources do not establish account age or lifetime sales as general appeal-outcome predictors.** **[P]** McCabe advises keeping performance metrics out of a policy appeal. **[U]** A seller claiming over $22 million in sales was still permanently deactivated over alleged forged documents ([Seller Forums](https://sellercentral.amazon.in/seller-forums/discussions/t/b139588b-e961-49f5-aa3c-193f3ea2f1a9)); a quoted notice names "sales volumes … not supported by buyer feedback or an established sales history" as the trigger, so a young account with a sudden sales jump is its own case type. On tone, **[P]** practitioners agree venting, pleading, blaming buyers or commenting on Amazon's speed go with failed appeals ([wortfilter.de](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/); [My Amazon Guy](https://myamazonguy.com/suspensions/submit-an-appeal-to-amazon/)); that is about the letter being sent. **The review found no evidence establishing past message tone as a general predictor; an actual conduct allegation requires its own context.**

### 2. Earlier rounds can affect the next response; reviewer behaviour is not fully documented

No source states a numeric cap on ordinary appeals, but the sources agree that **practitioners warn against repeating a refused letter without addressing its unresolved issues**. This is not proof that every repeat fails; an unanswered submission or an explicit resubmission request can justify reuse.

- **[P]** McCabe describes a "denial cycle"; if a needed document is missing, "don't appeal at all until you have it" ([ecommerceChris](https://www.ecommercechris.com/why-amazon-rejects-your-appeals-3-costly-mistakes-keeping-sellers-suspended/)). On his podcast: "half an answer is the same as zero answer"; most new clients arrive "with 3, 4, 5 denials in hand"; Leah McHugh warns premature escalation means "you've just wasted a whole escalation path" ([ecommerceChris](https://www.ecommercechris.com/why-your-amazon-appeal-keeps-getting-denied/)).
- **[P]** Riverbend: "Each rejection extends the time of your account or ASIN suspension" ([Riverbend](https://riverbendconsulting.com/blog/invoices-requested-by-amazon/)).
- **[P]** McCabe: over-escalation can leave a "FW" (Final Word) annotation, after which investigators stop replying ([Webretailer, 2024](https://www.webretailer.com/b/amazon-suspension-escalations)). This is the clearest statement that notes from earlier rounds change how a later reviewer treats the same letter.
- **[U]** Commonly reported final wording: "we have decided that you may not sell on Amazon.com. We may not respond to further emails about this issue" ([Seller Forums](https://sellercentral.amazon.com/seller-forums/discussions/t/b7e613c495112bb98c5bbdd4b9abc577)). Forum veterans split on whether "may" leaves a door open; the tool should call it neither clearly final nor open.
- **[P]** Riverbend reports a 2026 shift to "dispute only" appeals demanding proof the seller never broke the rule; it cites no Amazon document ([Riverbend](https://riverbendconsulting.com/blog/how-amazon-is-hurting-sellers/)).

Routes have different eligibility and prerequisites; these do not establish a universal sequential ladder or a fixed number of ordinary appeals:

| Route | What the sources say | History link |
|---|---|---|
| Revised appeal in Seller Central | Escalate only with a stronger plan; "spamming my former teams with the same weak POA is just burning through your chances" **[P]** ([Webretailer](https://www.webretailer.com/b/amazon-suspension-escalations)) | Each weak round adds to case notes |
| Account Health Support call or case | "Call me now" sometimes missing; reps often repeat the rejection text **[U]** ([US forum](https://sellercentral.amazon.com/seller-forums/discussions/t/593dec56-28c9-4e39-8f0a-dfecce464bcb)) | Does not reliably reach a fresh reviewer |
| Seller Challenge | **[Amazon staff]** AHA benefit for eligible listing-level decisions after standard appeals; three per 180 days; failed challenges replenish after six months; 48 hours is an aim, not a guarantee ([Amazon announcement](https://sellercentral.amazon.com/seller-forums/discussions/t/11731d72-4ea8-4aed-86af-b671e27afda9)) | Ask about enrollment and eligibility shown in the account; do not infer them from our score |
| Executive email (jeff@amazon.com and similar) | Read and passed on; UK sellers say it now answers like standard support **[P][U]** | Undocumented by Amazon; no verified numerical allowance |
| EU: P2B complaint, then CEDR mediation | Needs Amazon's final response and access code first; about 50 to 60 days; £245 + VAT or €269; non-binding **[Historical external source; current fees/timing unverified]** ([CEDR scheme rules](https://www.cedr.com/hubfs/Commercial%20Documents/Scheme%20Documents/Amazon/Amazon-Scheme-Rules-25-English.pdf)) | Outside a POA tool |
| EU: DSA out-of-court settlement body | 11 certified bodies (Commission page, 11 Sep 2026); non-binding; whether any takes Amazon seller cases is unclear **[Historical external source; current scope unverified]** ([European Commission](https://digital-strategy.ec.europa.eu/en/policies/dsa-out-court-dispute-settlement)) | Outside a POA tool |
| AAA arbitration under the BSA | Legal claims; needs a lawyer and money; one law firm says it rarely pays below about $75,000 in damages; practitioners say exhaust the POA first **[P]** ([Traverse Legal](https://www.traverselegal.com/blog/amazon-arbitration/)) | Outside a POA tool (our Terms already say so) |

Disagreement worth recording: McCabe says take Account Health reps' opinions "with a grain of salt" and warns their acknowledgment checklists make sellers "admit guilt"; vendor blogs recommend calling them after every denial. **Part B adds an official reason the admission matters:** an admitted violation, even after a successful appeal, may still count towards the repeat cap.

### 3. A document Amazon doubted once changes what can be sent next

**"Could not be verified" or "insufficient" may identify a remediable gap; "forged or manipulated" is a serious allegation requiring its own response. Neither label establishes the facts or guarantees a remedy.**

- **[U]** Notice wording quoted by sellers: "You have supplied documentation to Amazon which appears to be forged or manipulated. … All requested documents must be authentic and unaltered" ([Seller Forums](https://sellercentral.amazon.com/seller-forums/discussions/t/0921878a190615defa1cbe0b70b1e6d2)). In the same thread Amazon staff asked for invoices **from a new supplier**, and a community member argued the seller's own edits and a Word-to-PDF conversion counted as manipulation.
- **[P]** McCabe: self-made or edited invoices are treated as forgery; investigators may annotate the account "forged invoices"; one instance can end it ([Webretailer, 2024](https://www.webretailer.com/amazon/amazon-invoice-verification/)).
- **[P]** Riverbend: the only permitted change is to "black out pricing information and highlight your ASIN/line item"; if unclear, ask the supplier for a reprint ([Riverbend](https://riverbendconsulting.com/blog/invoices-requested-by-amazon/)).
- **[P]** One reported reactivation route is an acknowledgment form admitting the violation and agreeing a further failure means "permanent deactivation", plus invoices from a new supplier showing at least 10 units ([Seller Union, Feb 2023](https://seller-union.com/this-is-amazons-new-approach-to-suspensions-over-manipulated-documents/)); old and unconfirmed for 2026. No official source says whether a forgery finding is permanent.

Invoice checks have a consistent core. **[U]** An Amazon staff-suffix guide: issued within the last 365 days, quantities matching sales, product identifiers, supplier name, address and website, a completed order (no quotes or pro formas), PDFs or images rather than editable files, pricing may be removed but nothing else ([Seller Forums, Sarah_Amzn](https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7)). **[P]** Investigators phone suppliers, check the website works and the address matches, and compare the buyer address with Seller Central; give a named direct-dial contact and warn the supplier to expect the call ([Webretailer](https://www.webretailer.com/amazon/amazon-invoice-verification/); [ecommerceChris](https://www.ecommercechris.com/amazon-inauthentic-suspensions/)). **[P]** Riverbend reports a refusal on a **180-day** window, not 365, and a case where **Amazon's own units-sold figure was wrong** (131 claimed against 36 on the account), fixed by correcting it from order history ([Riverbend, 24 Sep 2026](https://riverbendconsulting.com/blog/the-art-of-being-literal-in-your-amazon-seller-account-appeal/)). The window must be read from the notice, and Amazon's figure recorded separately from the seller's.

### 4. Linked accounts and held funds tie one account's fate to another's

A related-account enforcement can create a dependency the current letter alone cannot resolve. No comparative evidence establishes this as the strongest explanation across all appeals.

- **[U, staff reply]** Amazon staff on the forum: the linked account "does share at least one significant point of information" with the other; the other account must be reinstated first through its own appeal, then the seller appeals citing that reinstatement ([Seller Forums EU, Abella_Amazon](https://sellercentral-europe.amazon.com/seller-forums/discussions/t/02f329bf-fe76-458e-ac70-af671b635e06)).
- **[P]** Dave Bryant: "Simply being related to another account isn't resulting in suspensions. It's being related to another account that is currently suspended" ([EcomCrew](https://www.ecomcrew.com/amazon-related-accounts-suspensions/)); Amazon Sellers Lawyer disagrees: any link can trigger it. Either way, **the second account's appeal can depend on the other account's status, not on its own letter.**
- **[V-direct, historical BSA]** BSA Section 3 lets Amazon withhold the reason where giving it "will enable you to circumvent our safeguards", which permits withholding some details; this does not prove why any particular notice is vague. Part B's AHR text also names "any activity that attempts to circumvent Amazon's systems" as a reason to deactivate regardless of the rating.
- **What links accounts** (practitioners only; Amazon publishes no list): addresses, phones, tax information, bank accounts and cards, IPs and devices, login behaviour, shared employees and service providers (VAs, agencies), family, former partners, user permissions given to someone linked to a suspended account, overlapping suppliers and catalogs. **[P]** Traverse Legal: a shared bank account or tax ID "carries more weight"; "sellers should not deny facts that Amazon can prove… A false denial can make the case worse" ([Traverse Legal, Jul 2026](https://www.traverselegal.com/blog/amazon-linked-accounts/)).
- **[P]** Use User Permissions, never shared logins ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/related-accounts-amazon-suspension)). **[U]** One seller reports a link through a VA abroad who never shared a device or IP. **[P]** Bryant's tips: ask Account Health for the first letters of the related account's email; check User Permissions history.
- **[Amazon staff]** A community manager explicitly says prior approval is no longer required where there is a legitimate business need and existing accounts are in good standing ([staff Q&A](https://sellercentral.amazon.com/seller-forums/discussions/t/f0cdac0c-08c4-402f-a4ce-9308193a7f66)). This is stronger than conflicting vendor claims; check current marketplace terms before publishing guidance. A second account is not automatically wrongful. **[P]** Opening a new account during a suspension is treated as circumvention and is "detrimental" to the original appeal ([Riverbend](https://riverbendconsulting.com/blog/suspended-amazon-account/)).

Held funds follow the same logic. **[V-direct, historical BSA]** The BSA lets Amazon withhold payments "for as long as we determine any related risks … persist", and permanently if "your account—or any other account you have operated—has been used to engage in deceptive, fraudulent, or illegal activity (including the sale of counterfeit or stolen goods)". So **another account's history can decide this account's money**. **[U]** Quoted notices say the funds investigation "is separate from a reinstatement appeal". **[Amazon staff]** Amazon announced the policy rename and a reduction from 90 to 60 days effective October 2024 ([announcement](https://sellercentral.amazon.com/seller-forums/discussions/t/03a73ea8-64dc-45fb-b0e3-67571459c364)). Sixty days is a wait before requesting review, not a payout guarantee or a deadline to apply within 60 days. Verify the current marketplace policy and case-specific instructions. **[P]** Trade press reports a September 2026 video-verification sweep of about 20,000 accounts, hitting established accounts, with payouts held ([Novadata](https://novadata.io/resources/news/amazon-section-3-video-verification-sweep-september-2026)); Amazon published nothing.

### 5. Relevant changes should be described accurately and supported where possible

- **[P]** Deleting listings does not clear anything: "the mark against their selling record doesn't go anywhere"; Amazon wants removal order numbers, how products to stop were chosen, whether the supplier relationship ended, how new suppliers are tested ([ecommerceChris](https://www.ecommercechris.com/amazon-inauthentic-suspensions/)).
- **[P]** Relisting the same product under a new ASIN is treated as evasion; Account Health reps have sometimes wrongly suggested it ([Seller Performance Solutions podcast](https://podcasts.bcast.fm/e/p8m69zjn-relisting-is-not-an-option)).
- No source settles whether a deletion must be disclosed or what editing a listing during review does. Design inference: relevant completed changes should be described with dates and supporting records where available. Deletion alone may leave the issue unresolved. Ask why a new account or listing was created before presenting case-specific circumvention guidance.

### 6. What professional firms ask for

Firms rarely publish a full intake form; the deep questions come on a call. The published entry form is short (**[Firm]** one "Get your case reviewed" form, firm unconfirmed: name, email, WhatsApp, monthly revenue, the pasted notice, an attachment, "anything else" — [Tally form](https://tally.so/r/Y5voaW)). The richer lists, by case type:

| What firms ask for | Who (tag) | Why they say they need it |
|---|---|---|
| Amazon's exact message, case number | ASA Compliance Group, AMZ Sellers Attorney **[Firm]** ([ASA FAQ](https://amazonsellersappeal.com/amazon-suspension-appeal-faq/); [AMZ Sellers Attorney](https://www.amazonsellers.attorney/blog/how-to-choose-the-best-amazon-appeal-service-in-2025)) | Identify the issue and the response route |
| Previous submissions and Amazon's replies; "a short timeline" | ASA, AMZ Sellers Attorney, Riverbend **[Firm]** ([Riverbend](https://riverbendconsulting.com/3p-account-suspension-appeal/)) | The next letter must analyse why the last was refused; quick near-copies can get the account "blocked or banned" |
| Original, unaltered invoices matching sold quantities; supplier details; proof of payment | ASA, Rosenbaum, AMZ Sellers Attorney **[Firm]** ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/amazon-inauthentic-suspension-appeals/amazon-inauthentic-suspension-appeal-plan-of-action-guide-going-into-2026/); [AMZ Sellers Attorney, invoices](https://www.amazonsellers.attorney/blog/what-invoices-amazon-expects-from-amazon-sellers)) | Authenticity cases turn on a paper trail from brand to seller |
| Case-type records: IP ownership or licence; test reports and certificates; safety data sheets; condition and returns records with photos; review-request templates and agency/software records; ID, business registration, bank statements, proof of address, beneficial owners | ASA **[Firm]** | Match what Amazon's request names, "only where relevant" |
| Written sourcing, shipping and customer-service procedures; corrective actions already taken; decision not to relist | Rosenbaum, AMZ Sellers Attorney **[Firm]** | Show the problem is controlled, not only acknowledged |
| Account Health screenshots; prior communications with Amazon | AMZ Sellers Attorney **[Firm]** | Context (McCabe disagrees on including metrics) |
| Related accounts: other accounts owned, who may have caused the link (shared IP, a VA's login), access records, proof of separate business structures, third-party services | Rosenbaum **[Firm]** ([related accounts](https://amazonsellerslawyer.com/fix-amazon-related-account-suspension/)) | Amazon links accounts through people, money, devices and services |
| Whether a new account was opened since the suspension | Tally form, snippet only **[U]** | Circumvention risk |

Consensus (three or more firms): the full notice, every earlier appeal with Amazon's replies, invoices for authenticity cases, the seller's own written account of what happened and what changed. **The limited public sample does not establish these as routine diagnostic fields.** One unattributed form does ask revenue; full private intake processes were not observed. Do not generalize from missing public fields. No serious firm page asks for the Seller Central password; Rosenbaum advises User Permissions. **[Firm]** ASA says it will not invent causes, admissions or corrective actions, and offers an NDA before records are shared. Process: free review, quote, documents, root cause, POA, revisions, follow-ups; law firms add Amazon Legal letters and arbitration. Fees seen: AMZ Sellers Attorney flat $1,500 and $2,300; Riverbend "four business days or less".

### 7. Why the same violation and letter can end differently

No Amazon source explains outcome variance. The sourced explanations fall into two groups.

- **Inputs the seller controls:** the quality and consistency of earlier submissions (rushed or template letters push a case into a "generic-denial lane" **[P]**), annotations provoked by over-escalation **[P]**, a document once called manipulated, an undisclosed or still-deactivated related account, admitting versus disputing (Part B: admitted violations may still count towards the repeat cap), a seller's own units-sold correction, and whether every point in Amazon's last reply was answered.
- **Inputs the seller does not control:** which investigator picks it up (McCabe: investigators "sometimes miss important details" **[P]**), which team handles the violation type, Account Health Assurance eligibility, and teams contradicting each other (**[P]** Riverbend's case of a Seller Challenge team approving a supply chain another team kept denying).

"Different reviewer, different answer" is widely assumed but undocumented. A tool can honestly help only with the first group, and should say so.

---

## Part E. AppealDeck today vs the findings

"Today" was spot-checked in `src/` (read only). Confirmed in code: the invoice window is counted back from the notice date, but its **length is fixed at 365 days** by the evidence-matrix wording (`src/core/documentCheck.ts` `comparisonFor`; `src/core/invoiceCoverage.ts`); a change-of-approach panel appears after two sent responses and a non-reinstating reply (`src/core/escalation.ts`) but does not record routes used; earlier submission text never leaves the device (`composePayloadWorkspace`).

| Finding | Tool today | Gap | Suggested change |
|---|---|---|---|
| Same-policy repeats cost more and have a 180-day cap (5 infringement, 2 restricted) [V-direct] | Decodes kind and issues; no history question | Missing | Ask "Earlier warnings for this same problem in the last 180 days? Does your Account Health page say 'Repeat' next to it?" with count, dates, "I don't know"; identify distinct incidents and their status; for accepted findings ask what changed; for disputed findings ask for supporting evidence; do not force an admission |
| Admitted-and-forgiven violations may still count; Amazon-confirmed errors are removed [V-direct] | Position accept / dispute / unsure exists; no note on consequences | Missing | One plain line beside the position choice stating Amazon's rule; no advice either way |
| Critical violation: 3-day grace period [V-direct] | Deadlines come from the notice's own dates | Partly | Show the actual deadline and source; explain the three-day AHR process only when applicability is confirmed |
| Notices say "previously alerted" / "repeat violations" [U] | Not detected | Missing | Detect in the decoder; ask the warnings question even if skipped |
| Green AHR does not protect [V-direct] | Not asked | Should not build as input | Never ask for an AHR number or show risk from it; at most record the band as context |
| Unanswered earlier warnings and the 7-day cure window [P] | Not asked | Missing | Inside the warnings question: "Did you answer it? What did you send?" |
| A repeat letter must cover earlier warnings and go further [P] | Root-cause coach; change report | Partly | Coach prompt for repeat cases: the earlier warning, what was done, why it was not enough, what is new |
| Resending a refused letter fails [P] | Earlier attempts recorded; repeat warning; change report | Built | Keep |
| Answer every point in Amazon's last reply [P] | Replies read per round; delta reopens what Amazon asks again | Built | Keep |
| Final wording "may not respond" [U] | Recognised | Built | Copy says neither clearly final nor open |
| Contradiction between an earlier claim and new evidence [ChatGPT] | Wording/fact comparison between rounds only | Missing | On the device: compare earlier promises (supplier dropped, process started) with new documents and answers; ask the seller to explain a difference; never invent one or accuse |
| Connected timeline: each submission ↔ its documents ↔ Amazon's reply ↔ what changed, with reply status [ChatGPT, ASA] | `timelineEvents` exists; no step builds it | Partly | One dated, editable list from what the case already holds; reply status: refused / waiting / asked for more information |
| Escalation routes have their own eligibility and prerequisites [P][Amazon staff] | Change-of-approach panel; routes not recorded | Partly | Record routes used with dates; warn before an escalation when no strong letter is on record |
| "Unverified" vs "forged or manipulated" [U][P] | Forged cases routed to professional help; no per-document history | Partly | Per document: "Has Amazon seen this? What did it say?" (not seen / insufficient / unverified / forged or manipulated / I don't know); preserve the file and allegation, flag it for review, and retain the evidence-based dispute route; no blanket permanent reuse ban |
| Editing, retyping, Word-to-PDF can count as manipulation [U][P] | Guidance in forged cases only | Partly | Preserve supplier originals; do not fabricate, retype or change facts. For invoices, follow current pricing-redaction/highlighting permissions; conversion alone is not proof of forgery |
| Request-specific invoice periods [P] | Length fixed at 365 | Partly | Extract the requirement, period, anchor date and source sentence; confirm ambiguity. Use a labelled policy default only in its verified context |
| Amazon's units-sold figure can be wrong [P] | Seller's figure only | Partly | Optional "Amazon's figure" beside the seller's; reconcile scope, dates, returns and source reports before proposing a factual correction |
| Supplier must be reachable [P] | Checks supplier name, address, phone on the invoice | Partly | Checklist: named direct contact, working website, supplier told to expect a call |
| Related account blocks until reinstated or link explained [U][P] | Related-account case type with its own records | Partly | Ask: yours, former, family, a stranger's? Its status? Has it appealed? What is shared, since when? Branch the records list |
| Other accounts owned or managed; false denial is worse [P] | Not asked outside the related-account case | Missing | Ask when relevant to the allegation, identity, funds or account controls; a healthy legitimate account does not automatically add an unrelated disclosure to the response |
| VAs, agencies, user permissions as links [P] | Not asked | Missing | Who has or had access, how (User Permissions or a shared login), and whether any worked on a suspended account |
| New account or relisting under a new ASIN during review [P][U] | Not asked | Missing | Ask once; a yes shows a strong warning and a "Before you send" line |
| Changes before appealing count only when dated and evidenced [P] | Corrective actions in the response | Partly | Ask what changed, with dates and IDs (removal orders, supplier dropped, new supplier vetting); warn when a deletion is the only fix |
| Funds can be held over another account's history; separate window [Repost][U] | "Your money" line and funds route | Partly | Ask whether another account the seller operated was flagged; read the window from the notice; record whether a disbursement request was sent and when |
| Identity re-verification and who runs the business [P] | Verification case raises ID and proof of address | Partly | For verification cases: earlier verification dates and outcomes, and whether the person on the call runs the account |
| Acknowledgment ticks admit a violation [P] + Part B | Not covered | Missing | Plain note wherever a notice offers an acknowledgment route: what the tick admits, and that admitted violations may still count towards the repeat cap |
| Tone of the letter [P] | Critic checks blame-shifting | Built | Add pleading and comments on Amazon's speed |
| Tone of past messages | Not asked | Should not build | No general predictive role established; ask only if the allegation concerns conduct |
| Account age, lifetime sales | Not asked; units sold only as invoice evidence | Only if relevant | Use context only where it changes a supported requirement; never use age or volume as an outcome predictor |
| Sales jump on a young account [U] | Not asked | Missing (low) | Only when the notice cites sales volume or history: when did sales start rising? |
| Arbitration, mediation, DSA routes [Repost][P] | Terms "Where this service stops" | Built | Mention EU routes as information only |
| "Trained on real appeals" claim | No such training; no such claim in copy | Built (honest) | Keep: never claim outcome-trained AI |

---

**Additional verified code limitation:** `invoiceCoverage.ts` pools all readable invoice lines and compares them with one `CaseFacts.unitsSold` total; it warns that product matching is manual. It does not prove per-ASIN coverage or include a separate in-stock inventory input. The indexed US invoice policy requests coverage for each cited ASIN, including sales and in-stock inventory (source I-2). `comparisonFor` can parse an arbitrary day count from requirement wording, but the matrix currently supplies 365; it does not extract a case-specific period from the notice.

## Part F. Revised plan and product boundaries

**Status:** research and documentation only. The founder authorized this document revision, not implementation of R-18. No new launch gate is created by this report; existing project registers remain authoritative.

**First: settle the rules and evidence requirements.** For each rule record its source, marketplace, version/date, applicability and uncertainty. Separate invoice issue-date eligibility, sales-coverage period, appeal deadline and funds waiting period. Preserve the source sentence and anchor date; ask for confirmation when instructions conflict. A generic policy default is labelled and scoped, never silently substituted for a specific request.

**Second: connect existing history and improve evidence comparison.** Reuse workspace submissions, attachment hashes, previous requests and replies rather than maintaining another independent timeline. Explicitly associate each reply with its submission and show pending / rejected / asked for more / accepted / unclear, allowing correction. Imported dates and missing attachments remain uncertain. Compare invoice coverage per relevant product and period, including in-stock inventory where the applicable requirement calls for it. Unknown dates, unreadable quantities and unrelated lines cannot establish complete coverage. Reconcile Amazon's and the seller's figures before suggesting a correction.

**Third: ask targeted background questions.** Collect a fact only when it changes a supported question, check or response route. Same-policy history should identify distinct incidents, dates, unresolved status and any Repeat label; multiple emails may concern one incident. Accepted findings can prompt questions about earlier corrective work; disputed findings require evidence without forced admissions. Other-account and access history is asked when relevant. If related-account history is added, branch immediately between owned/current, former, third-party and disputed links; do not defer this distinction. Reinstating an owned underlying account and disputing a mistaken link are different paths.

Separate retaining background, changing guidance and including it in Amazon-facing text. A yes answer never automatically creates a disclosure paragraph. The seller reviews proposed inclusions for relevance and accuracy. Unknown/skipped answers stay unknown; only decision-relevant uncertainty becomes an open item.

**Per-document history:** record whether Amazon saw the exact version, the response date, exact wording and whether the finding is disputed. Preserve original files and version links. A forgery allegation triggers prominent review and the existing professional-review boundary; it does not establish actual forgery or justify a permanent ban on retaining or using evidence to dispute an error. Do not casually reattach the file as ordinary unchallenged evidence. Do not suggest editing or retyping facts, inventing a replacement, or changing suppliers as a universal cure. Follow the actual request and applicable review route.

**Fourth: add consistency checks incrementally.** Begin with seller-confirmed names, dates, products, actions and document versions. Present both source facts and ask for an explanation. A later invoice from a supplier supposedly dropped earlier may concern an earlier order, delayed billing or a reissue. Do not invent intent, deception or an explanation. The duplicate guard remains advisory: unchanged resubmission can be appropriate when requested or when the original remains unanswered.

**Privacy is an implementation requirement, not an existing guarantee for new fields.** `composePayloadWorkspace` spreads the workspace and removes selected properties; new properties would not automatically stay local. Define and test separate allowlists for device storage, application-server requests, model requests, caches and logs. Keep raw prior submission text and private history local unless a specifically designed, disclosed flow authorizes transfer. A seller-approved response excerpt is a separate decision from transmitting the whole background record.

**Never infer outcome odds from history or claim outcome-trained AI without evidence.** Account age, business model, fulfillment method, sales or message tone may be relevant to a specific allegation; none becomes a general success predictor. An AHR number is not our risk score; directly ask about route eligibility where needed. Never turn selecting dispute in the UI into a claim that Amazon reversed a finding. Explain admission/dispute consequences before the choice, with the policy's qualifications.

Prioritize demonstrably misleading guidance and evidence gaps ahead of additional writing embellishments. The full questionnaire is not established as necessary before launch. Future implementation requires the founder's selection under R-18 and must respect all separate parked-item gates.

## Part G. Acceptance scenarios for future implementation

These are proposed tests, not tests implemented or run in this documentation session. They prove software behaviour, not improved reinstatement outcomes.

- Same notice, distinct accepted repeat incidents: relevant earlier actions and unresolved issues are raised. Disputed incidents prompt evidence questions instead of an admission. Three messages about one incident are not three violations.
- Unknown history is not clean history; irrelevant skipped questions do not become blocking tasks.
- An owned deactivated related account follows the actual underlying-account instructions; a disputed third-party link follows an evidence route. A healthy legitimate other account adds no automatic unrelated disclosure.
- A document alleged forged is preserved with its exact version and allegation, flagged for review, and remains available for a supported error dispute within the existing professional-review boundary. It is not silently treated as proven forged or irreversibly blacklisted.
- Two ASINs: excess invoices for A cannot clear missing coverage for B. Include requested inventory; do not count unreadable quantities or assume an unknown date is eligible.
- A notice with a 180-day invoice requirement, a separate 365-day sales period and another appeal deadline keeps the requirements separate. An unknown anchor date or conflicting instruction prompts clarification.
- Explain accept/dispute qualifications before either choice. Changing the UI choice never represents a change to Amazon's record.
- A consistent business rename across all records leaves the assessment unchanged; an unexplained entity mismatch raises a question. Age, revenue or tone changes have no effect unless the case-specific requirement makes them relevant.
- Later supplier invoice versus earlier termination promise: show both sources; allow earlier-order, reissue and delayed-billing explanations; never invent one.
- An unanswered or explicitly requested unchanged submission is not automatically blocked. Replies can be associated with the right submission even when received out of order.
- Request-capture tests prove that raw local history is absent from server and model payloads, caches and logs; verify any explicitly approved response excerpts separately.
- Review meaning as well as wording: prohibit unsupported probabilities, promises, admissions and training claims. Do not reject truthful phrases such as "does not guarantee reinstatement" merely for containing a word.

## Part H. Remaining verification

- Authenticate and check current US policy wording and applicable marketplace terms before publishing new rules: the AHR PDF is a Japan-hosted 2025 copy, staff announcements are guidance, and indexed help-page text is not a live authenticated check.
- Check current document-dispute and acknowledgment flows, their scope and permitted redactions. No universal permanent-forgery finding or universal prohibition on format conversion was established.
- Confirm route availability in the seller's account; Seller Challenge is not a guaranteed 48-hour decision or an ordinary-appeal cap.
- Whether reviewers can see and how they weigh violations older than 180 days remains unknown. No dataset establishes how much outcome variation history explains.
- Legal routes require current jurisdiction-specific verification; do not turn mediation, DSA, executive email and arbitration into one mandatory sequence. Fees and applicability in the historical notes are not approved product instructions.
- No live outcome database count was checked. The inspected code contains no outcome-training pipeline; the base model's pretraining is unknown.
- Public firm intake was a limited sample; private intake calls were not observed. No universal claim about what all firms ask is justified.

## Part I. Independent review and source register

Reviewed 6 Nov 2026: master, original report, five research notes, HTML summary, registers and relevant source code. This was a focused review, not a full-repository audit. The historical originals remain available with supersession notices; their conclusions do not override this master.

| ID | Source and access | What it supports / limits |
|---|---|---|
| I-1 | [Amazon AHR policy/FAQ PDF](https://m.media-amazon.com/images/G/09/rainier/help/Account_Health_Rating_program_policy_and_FAQ_EN.pdf), full extracted text read | Repeats, qualified thresholds, critical AHR process, admitted violations may still count, partial point information. Japan-hosted 2025 copy; verify current target-market policy. |
| I-2 | [US invoice policy](https://sellercentral.amazon.com/help/hub/reference/external/GDQ9K277NYP6WNEW?itemid=32431&locale=en-us), indexed body retrieved; direct open returned login shell | Per-ASIN sales and in-stock inventory coverage, date anchor, supplier and product requirements. Not authenticated live verification. |
| I-3 | [Amazon staff multiple-account Q&A](https://sellercentral.amazon.com/seller-forums/discussions/t/f0cdac0c-08c4-402f-a4ce-9308193a7f66), retrieved staff guidance | No prior approval requirement under stated legitimate-business-need/good-standing conditions; owned underlying enforcement versus other-account appeal distinction. |
| I-4 | [Amazon Seller Challenge announcement](https://sellercentral.amazon.com/seller-forums/discussions/t/11731d72-4ea8-4aed-86af-b671e27afda9), retrieved News_Amazon post | AHA/eligible listing decisions; three per 180 days; failed challenge replenishment; 48-hour aim. |
| I-5 | [Amazon funds-policy update](https://sellercentral.amazon.com/seller-forums/discussions/t/03a73ea8-64dc-45fb-b0e3-67571459c364), retrieved announcement | October 2024 rename and 60-day waiting period before requesting review; no payout guarantee. |
| I-6 | [Forged-document forum case](https://sellercentral.amazon.com/seller-forums/discussions/t/0921878a190615defa1cbe0b70b1e6d2), retrieved thread | Seller reports both acknowledgment and error-dispute routes; staff invoice guidance. Seller quotes and peer opinions are not universal policy; does not establish conversion alone as forgery. |
| I-7 | [ASA intake FAQ](https://amazonsellersappeal.com/amazon-suspension-appeal-faq/), retrieved firm page | Firm describes notice, history, submissions/replies and timeline intake, then case-specific evidence/route selection. No proof of universal industry practice or success rates. |

Code evidence: `src/core/workspace.ts` (history and payload trimming), `src/lib/draftRequest.ts` (model input), `src/lib/composeRequest.ts` (server request), `src/core/changeReport.ts` (local comparison), `src/core/documentCheck.ts` (date comparison), `src/core/invoiceCoverage.ts` (pooled quantity limitation), `src/core/evidenceModel.ts` (365-day matrix default), `src/core/escalation.ts` (change-of-approach trigger).

## Conclusion

History can materially change the questions, evidence requirements and response route even when the violation label and proposed letter look similar. The research does not quantify its effect or establish that it explains most differing outcomes. The useful product direction is a traceable case record: what Amazon requested, what was actually sent, what remains unsupported, and what changed. Develop targeted history and evidence checks around that record, preserve supported disputes and seller control, and evaluate real case journeys before expanding the questionnaire. This documentation update implements none of those product proposals.

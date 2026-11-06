# Account history and background: master file (6 Nov 2026)

> **One file for everything on this topic.** It holds the founder's question, the five research threads, ChatGPT's review (checked against the code), Amazon's own policy wording read directly from Amazon's PDF, the tool-today-vs-findings table, and the plan. **Nothing in `src/` has been built for it.** Register row: R-18 in `docs/PARKED-ITEMS.md`.

## Contents

- Part A. The question, the short answer, what is in this folder
- Part B. Amazon's own wording, read directly (new, 6 Nov)
- Part C. ChatGPT's review, checked against the code
- Part D. The full findings (the research report)
- Part E. AppealDeck today vs the findings (table)
- Part F. The plan: build first, second, third, later, never
- Part G. Tests that prove history changes the help
- Part H. Open questions and what a signed-in seller must check

---

## Part A. The question, the short answer, the files

### The founder's question

From a Meta AI chat (5 Nov 2026): _"Har account alag hai: ek hi violation, ek hi POA, ek account khul jata hai, dusra nahi khulta."_ Every account is different; the same violation and the same Plan of Action can open one account and not another. Does AppealDeck take the account's history into account? Is it "trained" on that kind of data? The founder also asked what professional appeal firms ask a seller before writing, so the tool asks for everything of real value.

### The short answer

- **The point is real.** Amazon reads the account's record, not only the letter. Two accounts can send the same letter and get different results because the record behind them differs.
- **Four parts of the past have a source:** repeats of the same policy (Amazon's own policy, read directly: Part B); what earlier rounds put on the record (refused letters, escalations used, documents Amazon called unverified or forged); other accounts tied to this one (and the money held because of them); identity and funds checks that run separately.
- **No source supports** account age, lifetime sales or the tone of old messages as appeal factors. We should not ask about them as such.
- **AppealDeck today is "case-aware, with incomplete account-history awareness"** (ChatGPT's phrase; it matches the code, Part C). Earlier appeals, Amazon's replies, linked-account cases and held funds are built. The account's own background is not asked.
- **AppealDeck is not trained on accepted and rejected appeals.** It uses general-purpose models with instructions, policy context, the seller's facts and output checks (Part C). We must never claim otherwise.
- **History must change what we ask, what we check and what the letter covers.** Never a score, a chance or a prediction (D6).

### Files in this folder

| File | What it is |
|---|---|
| `docs/handoffs/2026-11-06-account-history-master.md` | This file: everything in one place |
| `docs/handoffs/2026-11-06-account-history-research/reports/Account history and Amazon appeals.md` | The research report as first written (Part D reproduces it, updated with Part B) |
| `.../research_notes/Account history and Amazon appeals/account_record.md` | Thread 1: warnings, repeats, Account Health Rating, account age, tone |
| `.../research_notes/.../prior_appeals_and_documents.md` | Thread 2: earlier appeals, documents Amazon doubted, invoice checks, changes before appealing |
| `.../research_notes/.../related_accounts_and_funds.md` | Thread 3: linked accounts, VAs, held funds, identity checks |
| `.../research_notes/.../escalation_and_variance.md` | Thread 4: routes after a refusal, why outcomes differ |
| `.../research_notes/.../firm_intake.md` | Thread 5: what appeal firms ask for, and why |
| `docs/handoffs/2026-11-06-account-background-plan.html` | Plain one-page version for reading on a phone |

Tags used throughout: **[V]** Amazon's own wording (an Amazon page or file, or a named verbatim repost); **[V-direct]** read by us directly from an Amazon-hosted file on 6 Nov; **[P]** a named practitioner's experience; **[U]** a forum anecdote, search snippet or unattributed claim. Most practitioners sell appeal services; weigh, do not discard. **No success rates appear anywhere in this file.**

---

## Part B. Amazon's own wording, read directly (6 Nov 2026)

ChatGPT linked Amazon's Account Health Rating policy as a PDF on Amazon's own servers: `https://m.media-amazon.com/images/G/09/rainier/help/Account_Health_Rating_program_policy_and_FAQ_EN.pdf`. We downloaded it and extracted its text locally (12 pages). **This upgrades the research's main "official" points from reposts to Amazon's own file.**

About the file: English text; the PDF's language tag and links point to Amazon Japan (sellercentral.amazon.co.jp); created 11 March 2025 in Microsoft Word; it says "Revised enforcement processes under AHR will become effective on September 13, 2023." So it is Amazon's own text, but **a Japan-hosted copy from March 2025**; the live US page may have changed since. A signed-in check of the US page is still needed before product copy says "Amazon says".

What it says **[V-direct]** (short quotes):

1. **The window:** the score reflects "policy adherence and selling activities over the last 180 days". New sellers start at 200.
2. **Bands:** green "Healthy" 200 to 1,000 ("not at risk of deactivation based on the policies comprising the score"); yellow "At Risk" 100 to 199; red "Unhealthy" 99 or lower ("eligible for deactivation or already deactivated").
3. **Repeats cost more each time:** "the point values associated with violations included in your AHR increase each time that same policy is violated."
4. **The repeat cap:** an account "may be at immediate risk of deactivation if you reach the maximum number of repeat violations … in a 180-day period, regardless of your AHR." The maximum is "five for infringement-related policies and two for restricted products policies." Thresholds depend on severity (infringement low, "listing a used product as new" higher).
5. **The seller can see repeats:** "repeat violations are labeled as such in the 'Impact' column on your Account Health page." **This means the tool can ask a precise question: "Does your Account Health page say 'Repeat' next to this violation?"**
6. **A healthy rating does not protect:** "Regardless of your AHR score, Amazon may deactivate your account immediately if required by law; if we suspect fraudulent, deceptive, illegal, or otherwise harmful activity (including any activity that attempts to circumvent Amazon's systems); or you violate other policies outside of AHR."
7. **Critical violations have a 3-day grace period:** the AHR turns red at zero and "You will have a 3-day grace period to address the violation before account deactivation." Reaching the repeat cap raises a critical violation with the same 3 days, appealed "through the Product Policy Compliance Dashboard". (The research had marked a "72-hour" figure as unverified; Amazon's own file confirms 3 days.)
8. **The most important new finding for the tool: admitting versus disputing.** "Violations that have been removed from your Account Health page after a successful appeal, where you did not dispute the activity occurred, may still count towards the maximum threshold for repeat violations within a 180 day period." **So a successful appeal that admits the violation still counts towards the repeat cap; a successful dispute (Amazon confirms it was an error) does not.** This matters to the tool's existing "accept / dispute / unsure" position: the choice has a consequence for the account's future record, and the seller should be told so plainly (no advice either way).
9. Violations are removed from the page when a dispute succeeds, a rights owner retracts an IP complaint, or an appeal succeeds and Amazon "determine[s] that while you did violate these policies, it was not intentional and the violation should be forgiven."
10. Amazon will not share "the formula of the AHR scores and the exact point values for violations" (the FAQ lists this as a question; third-party point tables are therefore unsourced).

---

## Part C. ChatGPT's review, checked against the code

ChatGPT read the same code and reached the same conclusion. Each of its claims was checked on 6 Nov:

| ChatGPT's claim | Checked | Result |
|---|---|---|
| AppealDeck uses the current notice and form instructions, earlier requests and reply criticisms, prior appeals, the seller's explanation, actions and prevention, business details, suppliers, document checks, multiple issues and specialist-review safeguards | `src/lib/draftRequest.ts` `draftRequestFrom` sends the notice plus all earlier requests, form instructions, attempt number, the three answers, attached and declined records, requested records, issues and the latest reply's criticisms | **True** |
| Earlier submission wording stays on the device; the AI gets the attempt number, not the earlier appeals | `src/core/workspace.ts` `composePayloadWorkspace`: history and earlier requirement lists are emptied; submissions travel empty except one wording-free marker that a send is on record ("The sent text itself still never leaves the device") | **True, and deliberate** (privacy) |
| Repetition checks exist locally, but there is no check for contradictions across rounds | The change report and duplicate guard compare wording and facts between rounds; nothing compares a new claim with an earlier promise (for example "we stopped using supplier X" then a later invoice from X) | **True: a real gap** |
| No structured account-history assessment (earlier warnings, earlier deactivations, unresolved violations, whether promised fixes happened) | Matches our own grep: `CaseFacts` holds business name, address, suppliers, units sold only | **True** |
| Not trained on accepted/rejected appeals | No outcome-trained model exists; opt-in outcome sharing is anonymous and has no data yet | **True** |
| The Amazon AHR PDF link | Fetched and read (Part B) | **Real Amazon file, Japan-hosted, March 2025** |

What ChatGPT adds to our plan (adopted, Part F): allow **"I don't know"** on every history question and never treat a missing answer as a clean history; a **connected timeline** where each earlier submission links to its documents, Amazon's reply and what changed, with the reply status named (refused / waiting / asked for more information); a **check against earlier claims and promises**, which asks the seller to explain a difference without inventing an explanation or accusing; **questions that change with the circumstance** (a repeat asks why the earlier fix failed; a dispute asks for evidence without forcing an admission; another unresolved violation stays visible as its own issue); **paired-case tests** proving that different histories change the help and irrelevant differences do not (Part G); and the rule **"collect a fact only when we can say what decision it changes."**

ChatGPT's own correction of the Meta AI chat matches ours: "under 10% after two rejections", "Tuesday morning is best" and fixed acceptance rates have no evidence; an observed pattern does not prove its cause; missing information does not make an appeal pointless.

---

## Part D. The full findings

### Most "official" wording is second-hand, except Part B

Seller Central help pages could not be read without a login. Every help URL the researchers fetched (the AHR page, its FAQ, the Seller Code of Conduct, the multiple-accounts page, the funds policy, the Seller Challenge FAQ, Amazon's appeal guidance) returned only the logged-out shell. Amazon's wording therefore comes from verbatim reposts (chiefly the Hopted mirror of the AHR article), Amazon staff posts on the Seller Forums, notices sellers quote, and search snippets. Two Amazon texts were read in full: the **Business Solutions Agreement (BSA) PDF** ([Amazon BSA PDF](https://m.media-amazon.com/images/G/01/rainier/help./1.1_BSA_PDF_English.pdf), which links to a 2022 translation, so the live November 2026 wording is unconfirmed) and the **AHR policy PDF** (Part B). Before any sentence below goes into product copy as "Amazon says", someone signed in to Seller Central must check it against the live page.

### 1. Repeats of the same policy are the history fact Amazon itself names

Part B now confirms this from Amazon's own file: the 180-day window, the bands, "increase each time that same policy is violated", the cap of five (infringement) and two (restricted products) in 180 days "regardless of your AHR", the 3-day grace period, and that admitted-and-forgiven violations still count towards the cap.

Practical points:

- **A green AHR does not protect against a repeat-cap deactivation or a fraud/harm deactivation.** The tool must never reassure a seller that a healthy band means low risk.
- The useful question is not "what is your score?" but **"how many warnings for this same policy in the last 180 days, and when? Does your Account Health page mark it 'Repeat'?"**
- Whether violations older than 180 days stay visible to the person reading an appeal is unknown: they leave the score, but no source says they leave the record.
- Amazon's notices tend to name the history: **[U]** a forum-quoted notice says the account was "previously alerted" that it was "at risk of deactivation due to incurring repeat violations", and "no valid plan of action had been received" ([Seller Forums UK](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/f4938785-2ef5-4b5d-97af-6e6adc5021d9)).
- **[V]** Amazon's appeal wording asks for "a plan of action to correct the issues that contributed to the enforcement action" ([Hopted mirror](https://www.hopted.com/integrations/amazon-sp-api/amazon-help-articles/seller-performance/account-health-rating)); the plural is the only official hint that contributing history belongs in the letter.

What a repeat letter must do is practitioner advice: **[P]** Chris McCabe (former Amazon investigator) says analyse the root causes behind "the warnings and suspension" and give preventive measures for all inventory, not ASIN by ASIN ([wortfilter.de repost, 2016](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/)). **[P]** A root cause is "the operational breakdown that triggered the policy issue, not the symptom, and not the metric" ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/how-to-create-a-strategic-well-written-plan-of-action-to-reinstate-selling-privileges/)). **[P]** The BSA's seven-day cure window after a notified breach, as Riverbend paraphrases Section 3, is a reason to ask whether an earlier warning went unanswered ([Riverbend](https://riverbendconsulting.com/blog/amazon-section-3-violation/)). The phrase "repeated violations may result in permanent deactivation" could not be traced to an Amazon page and must not be quoted as Amazon's.

Other "background" facts have weak or no support. **No Amazon statement says account age or sales history counts in an appeal.** **[P]** McCabe advises keeping performance metrics out of a policy appeal. **[U]** A seller claiming over $22 million in sales was still permanently deactivated over alleged forged documents ([Seller Forums](https://sellercentral.amazon.in/seller-forums/discussions/t/b139588b-e961-49f5-aa3c-193f3ea2f1a9)); a quoted notice names "sales volumes … not supported by buyer feedback or an established sales history" as the trigger, so a young account with a sudden sales jump is its own case type. On tone, **[P]** practitioners agree venting, pleading, blaming buyers or commenting on Amazon's speed go with failed appeals ([wortfilter.de](https://wortfilter.de/amazon-plan-of-action-poa-dos-and-donts-von-chris-mccabe/); [My Amazon Guy](https://myamazonguy.com/suspensions/submit-an-appeal-to-amazon/)); that is about the letter being sent. **No source says a past angry message is held against a later, well-written POA.**

### 2. Every earlier round leaves a mark that later reviewers read

No source states a numeric cap on ordinary appeals, but the sources agree that **repeating a refused letter, even reworded, does not work and costs something**.

- **[P]** McCabe describes a "denial cycle"; if a needed document is missing, "don't appeal at all until you have it" ([ecommerceChris](https://www.ecommercechris.com/why-amazon-rejects-your-appeals-3-costly-mistakes-keeping-sellers-suspended/)). On his podcast: "half an answer is the same as zero answer"; most new clients arrive "with 3, 4, 5 denials in hand"; Leah McHugh warns premature escalation means "you've just wasted a whole escalation path" ([ecommerceChris](https://www.ecommercechris.com/why-your-amazon-appeal-keeps-getting-denied/)).
- **[P]** Riverbend: "Each rejection extends the time of your account or ASIN suspension" ([Riverbend](https://riverbendconsulting.com/blog/invoices-requested-by-amazon/)).
- **[P]** McCabe: over-escalation can leave a "FW" (Final Word) annotation, after which investigators stop replying ([Webretailer, 2024](https://www.webretailer.com/b/amazon-suspension-escalations)). This is the clearest statement that notes from earlier rounds change how a later reviewer treats the same letter.
- **[U]** Commonly reported final wording: "we have decided that you may not sell on Amazon.com. We may not respond to further emails about this issue" ([Seller Forums](https://sellercentral.amazon.com/seller-forums/discussions/t/b7e613c495112bb98c5bbdd4b9abc577)). Forum veterans split on whether "may" leaves a door open; the tool should call it neither clearly final nor open.
- **[P]** Riverbend reports a 2026 shift to "dispute only" appeals demanding proof the seller never broke the rule; it cites no Amazon document ([Riverbend](https://riverbendconsulting.com/blog/how-amazon-is-hurting-sellers/)).

Escalation routes are finite, run in order, and history gates the first four:

| Route | What the sources say | History link |
|---|---|---|
| Revised appeal in Seller Central | Escalate only with a stronger plan; "spamming my former teams with the same weak POA is just burning through your chances" **[P]** ([Webretailer](https://www.webretailer.com/b/amazon-suspension-escalations)) | Each weak round adds to case notes |
| Account Health Support call or case | "Call me now" sometimes missing; reps often repeat the rejection text **[U]** ([US forum](https://sellercentral.amazon.com/seller-forums/discussions/t/593dec56-28c9-4e39-8f0a-dfecce464bcb)) | Does not reliably reach a fresh reviewer |
| Seller Challenge (beta) | Account Health Assurance members only; listing-level actions only; reported three per six months and a 48-hour decision **[P/U]** ([PPC Land, Oct 2025](https://ppc.land/amazon-introduces-seller-challenge-feature-for-enforcement-appeals/)) | Good history is the entry ticket; losing AHA removes remaining challenges |
| Executive email (jeff@amazon.com and similar) | Read and passed on; UK sellers say it now answers like standard support **[P][U]** | Undocumented by Amazon; one use of a limited chance |
| EU: P2B complaint, then CEDR mediation | Needs Amazon's final response and access code first; about 50 to 60 days; £245 + VAT or €269; non-binding **[V]** ([CEDR scheme rules](https://www.cedr.com/hubfs/Commercial%20Documents/Scheme%20Documents/Amazon/Amazon-Scheme-Rules-25-English.pdf)) | Outside a POA tool |
| EU: DSA out-of-court settlement body | 11 certified bodies (Commission page, 11 Sep 2026); non-binding; whether any takes Amazon seller cases is unclear **[V]** ([European Commission](https://digital-strategy.ec.europa.eu/en/policies/dsa-out-court-dispute-settlement)) | Outside a POA tool |
| AAA arbitration under the BSA | Legal claims; needs a lawyer and money; one law firm says it rarely pays below about $75,000 in damages; practitioners say exhaust the POA first **[P]** ([Traverse Legal](https://www.traverselegal.com/blog/amazon-arbitration/)) | Outside a POA tool (our Terms already say so) |

Disagreement worth recording: McCabe says take Account Health reps' opinions "with a grain of salt" and warns their acknowledgment checklists make sellers "admit guilt"; vendor blogs recommend calling them after every denial. **Part B adds an official reason the admission matters:** an admitted violation, even forgiven, can still count towards the repeat cap.

### 3. A document Amazon doubted once changes what can be sent next

**"Could not be verified" or "insufficient" is a fixable gap; "forged or manipulated" is a different, much heavier finding.**

- **[U]** Notice wording quoted by sellers: "You have supplied documentation to Amazon which appears to be forged or manipulated. … All requested documents must be authentic and unaltered" ([Seller Forums](https://sellercentral.amazon.com/seller-forums/discussions/t/0921878a190615defa1cbe0b70b1e6d2)). In the same thread Amazon staff asked for invoices **from a new supplier**, and a community member argued the seller's own edits and a Word-to-PDF conversion counted as manipulation.
- **[P]** McCabe: self-made or edited invoices are treated as forgery; investigators may annotate the account "forged invoices"; one instance can end it ([Webretailer, 2024](https://www.webretailer.com/amazon/amazon-invoice-verification/)).
- **[P]** Riverbend: the only permitted change is to "black out pricing information and highlight your ASIN/line item"; if unclear, ask the supplier for a reprint ([Riverbend](https://riverbendconsulting.com/blog/invoices-requested-by-amazon/)).
- **[P]** One reported reactivation route is an acknowledgment form admitting the violation and agreeing a further failure means "permanent deactivation", plus invoices from a new supplier showing at least 10 units ([Seller Union, Feb 2023](https://seller-union.com/this-is-amazons-new-approach-to-suspensions-over-manipulated-documents/)); old and unconfirmed for 2026. No official source says whether a forgery finding is permanent.

Invoice checks have a consistent core. **[U]** An Amazon staff-suffix guide: issued within the last 365 days, quantities matching sales, product identifiers, supplier name, address and website, a completed order (no quotes or pro formas), PDFs or images rather than editable files, pricing may be removed but nothing else ([Seller Forums, Sarah_Amzn](https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7)). **[P]** Investigators phone suppliers, check the website works and the address matches, and compare the buyer address with Seller Central; give a named direct-dial contact and warn the supplier to expect the call ([Webretailer](https://www.webretailer.com/amazon/amazon-invoice-verification/); [ecommerceChris](https://www.ecommercechris.com/amazon-inauthentic-suspensions/)). **[P]** Riverbend reports a refusal on a **180-day** window, not 365, and a case where **Amazon's own units-sold figure was wrong** (131 claimed against 36 on the account), fixed by correcting it from order history ([Riverbend, 24 Sep 2026](https://riverbendconsulting.com/blog/the-art-of-being-literal-in-your-amazon-seller-account-appeal/)). The window must be read from the notice, and Amazon's figure recorded separately from the seller's.

### 4. Linked accounts and held funds tie one account's fate to another's

This is the strongest single explanation for "same letter, different result".

- **[U, staff reply]** Amazon staff on the forum: the linked account "does share at least one significant point of information" with the other; the other account must be reinstated first through its own appeal, then the seller appeals citing that reinstatement ([Seller Forums EU, Abella_Amazon](https://sellercentral-europe.amazon.com/seller-forums/discussions/t/02f329bf-fe76-458e-ac70-af671b635e06)).
- **[P]** Dave Bryant: "Simply being related to another account isn't resulting in suspensions. It's being related to another account that is currently suspended" ([EcomCrew](https://www.ecomcrew.com/amazon-related-accounts-suspensions/)); Amazon Sellers Lawyer disagrees: any link can trigger it. Either way, **the second account's appeal can depend on the other account's status, not on its own letter.**
- **[V]** BSA Section 3 lets Amazon withhold the reason where giving it "will enable you to circumvent our safeguards", which is why these notices are vague. Part B's AHR text also names "any activity that attempts to circumvent Amazon's systems" as a reason to deactivate regardless of the rating.
- **What links accounts** (practitioners only; Amazon publishes no list): addresses, phones, tax information, bank accounts and cards, IPs and devices, login behaviour, shared employees and service providers (VAs, agencies), family, former partners, user permissions given to someone linked to a suspended account, overlapping suppliers and catalogs. **[P]** Traverse Legal: a shared bank account or tax ID "carries more weight"; "sellers should not deny facts that Amazon can prove… A false denial can make the case worse" ([Traverse Legal, Jul 2026](https://www.traverselegal.com/blog/amazon-linked-accounts/)).
- **[P]** Use User Permissions, never shared logins ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/related-accounts-amazon-suspension)). **[U]** One seller reports a link through a VA abroad who never shared a device or IP. **[P]** Bryant's tips: ask Account Health for the first letters of the related account's email; check User Permissions history.
- Whether a second account needs prior approval in November 2026 is disputed (BellaVix says no since 2020; others say get it first), so a second account must not be treated as wrongful by default. **[P]** Opening a new account during a suspension is treated as circumvention and is "detrimental" to the original appeal ([Riverbend](https://riverbendconsulting.com/blog/suspended-amazon-account/)).

Held funds follow the same logic. **[V]** The BSA lets Amazon withhold payments "for as long as we determine any related risks … persist", and permanently if "your account—or any other account you have operated—has been used to engage in deceptive, fraudulent, or illegal activity (including the sale of counterfeit or stolen goods)". So **another account's history can decide this account's money**. **[U]** Quoted notices say the funds investigation "is separate from a reinstatement appeal". The request window is reported as 90 days in older notices and 60 in later ones (**[P]** DAM Law Firm, Jul 2026, also reports the policy renamed "Funds Disbursement Eligibility Policy"), so it must be read from the seller's own notice. **[P]** Trade press reports a September 2026 video-verification sweep of about 20,000 accounts, hitting established accounts, with payouts held ([Novadata](https://novadata.io/resources/news/amazon-section-3-video-verification-sweep-september-2026)); Amazon published nothing.

### 5. Changes made before appealing count only when dated and disclosed

- **[P]** Deleting listings does not clear anything: "the mark against their selling record doesn't go anywhere"; Amazon wants removal order numbers, how products to stop were chosen, whether the supplier relationship ended, how new suppliers are tested ([ecommerceChris](https://www.ecommercechris.com/amazon-inauthentic-suspensions/)).
- **[P]** Relisting the same product under a new ASIN is treated as evasion; Account Health reps have sometimes wrongly suggested it ([Seller Performance Solutions podcast](https://podcasts.bcast.fm/e/p8m69zjn-relisting-is-not-an-option)).
- No source settles whether a deletion must be disclosed or what editing a listing during review does. Rule: real, dated, evidenced changes go in the corrective actions; a deletion offered as the whole fix gets a warning; relisting or a new account during review gets a strong one.

### 6. What professional firms ask for

Firms rarely publish a full intake form; the deep questions come on a call. The published entry form is short (**[V]** one "Get your case reviewed" form, firm unconfirmed: name, email, WhatsApp, monthly revenue, the pasted notice, an attachment, "anything else" — [Tally form](https://tally.so/r/Y5voaW)). The richer lists, by case type:

| What firms ask for | Who (tag) | Why they say they need it |
|---|---|---|
| Amazon's exact message, case number | ASA Compliance Group, AMZ Sellers Attorney **[V]** ([ASA FAQ](https://amazonsellersappeal.com/amazon-suspension-appeal-faq/); [AMZ Sellers Attorney](https://www.amazonsellers.attorney/blog/how-to-choose-the-best-amazon-appeal-service-in-2025)) | Identify the issue and the response route |
| Previous submissions and Amazon's replies; "a short timeline" | ASA, AMZ Sellers Attorney, Riverbend **[V]** ([Riverbend](https://riverbendconsulting.com/3p-account-suspension-appeal/)) | The next letter must analyse why the last was refused; quick near-copies can get the account "blocked or banned" |
| Original, unaltered invoices matching sold quantities; supplier details; proof of payment | ASA, Rosenbaum, AMZ Sellers Attorney **[V]** ([Amazon Sellers Lawyer](https://amazonsellerslawyer.com/blog/amazon-inauthentic-suspension-appeals/amazon-inauthentic-suspension-appeal-plan-of-action-guide-going-into-2026/); [AMZ Sellers Attorney, invoices](https://www.amazonsellers.attorney/blog/what-invoices-amazon-expects-from-amazon-sellers)) | Authenticity cases turn on a paper trail from brand to seller |
| Case-type records: IP ownership or licence; test reports and certificates; safety data sheets; condition and returns records with photos; review-request templates and agency/software records; ID, business registration, bank statements, proof of address, beneficial owners | ASA **[V]** | Match what Amazon's request names, "only where relevant" |
| Written sourcing, shipping and customer-service procedures; corrective actions already taken; decision not to relist | Rosenbaum, AMZ Sellers Attorney **[V]** | Show the problem is controlled, not only acknowledged |
| Account Health screenshots; prior communications with Amazon | AMZ Sellers Attorney **[V]** | Context (McCabe disagrees on including metrics) |
| Related accounts: other accounts owned, who may have caused the link (shared IP, a VA's login), access records, proof of separate business structures, third-party services | Rosenbaum **[V]** ([related accounts](https://amazonsellerslawyer.com/fix-amazon-related-account-suspension/)) | Amazon links accounts through people, money, devices and services |
| Whether a new account was opened since the suspension | Tally form, snippet only **[U]** | Circumvention risk |

Consensus (three or more firms): the full notice, every earlier appeal with Amazon's replies, invoices for authenticity cases, the seller's own written account of what happened and what changed. **No firm publishes fields for account age, business model, FBA/FBM, sales volume, an AHR number or prior warnings.** No serious firm page asks for the Seller Central password; Rosenbaum advises User Permissions. **[V]** ASA says it will not invent causes, admissions or corrective actions, and offers an NDA before records are shared. Process: free review, quote, documents, root cause, POA, revisions, follow-ups; law firms add Amazon Legal letters and arbitration. Fees seen: AMZ Sellers Attorney flat $1,500 and $2,300; Riverbend "four business days or less".

### 7. Why the same violation and letter can end differently

No Amazon source explains outcome variance. The sourced explanations fall into two groups.

- **Inputs the seller controls:** the quality and consistency of earlier submissions (rushed or template letters push a case into a "generic-denial lane" **[P]**), annotations provoked by over-escalation **[P]**, a document once called manipulated, an undisclosed or still-deactivated related account, admitting versus disputing (Part B: admitted violations keep counting towards the repeat cap), a seller's own units-sold correction, and whether every point in Amazon's last reply was answered.
- **Inputs the seller does not control:** which investigator picks it up (McCabe: investigators "sometimes miss important details" **[P]**), which team handles the violation type, Account Health Assurance eligibility, and teams contradicting each other (**[P]** Riverbend's case of a Seller Challenge team approving a supply chain another team kept denying).

"Different reviewer, different answer" is widely assumed but undocumented. A tool can honestly help only with the first group, and should say so.

---

## Part E. AppealDeck today vs the findings

"Today" was spot-checked in `src/` (read only). Confirmed in code: the invoice window is counted back from the notice date, but its **length is fixed at 365 days** by the evidence-matrix wording (`src/core/documentCheck.ts` `comparisonFor`; `src/core/invoiceCoverage.ts`); a change-of-approach panel appears after two sent responses and a non-reinstating reply (`src/core/escalation.ts`) but does not record routes used; earlier submission text never leaves the device (`composePayloadWorkspace`).

| Finding | Tool today | Gap | Suggested change |
|---|---|---|---|
| Same-policy repeats cost more and have a 180-day cap (5 infringement, 2 restricted) [V-direct] | Decodes kind and issues; no history question | Missing | Ask "Earlier warnings for this same problem in the last 180 days? Does your Account Health page say 'Repeat' next to it?" with count, dates, "I don't know"; a yes adds a "Before you send" line: name them, and say why the earlier fix failed |
| Admitted-and-forgiven violations still count towards the cap; disputed-and-reversed ones do not [V-direct] | Position accept / dispute / unsure exists; no note on consequences | Missing | One plain line beside the position choice stating Amazon's rule; no advice either way |
| Critical violation: 3-day grace period [V-direct] | Deadlines come from the notice's own dates | Partly | When the notice says critical or repeat-maximum, show the 3-day window as Amazon's rule, labelled as such |
| Notices say "previously alerted" / "repeat violations" [U] | Not detected | Missing | Detect in the decoder; ask the warnings question even if skipped |
| Green AHR does not protect [V-direct] | Not asked | Should not build as input | Never ask for an AHR number or show risk from it; at most record the band as context |
| Unanswered earlier warnings and the 7-day cure window [P] | Not asked | Missing | Inside the warnings question: "Did you answer it? What did you send?" |
| A repeat letter must cover earlier warnings and go further [P] | Root-cause coach; change report | Partly | Coach prompt for repeat cases: the earlier warning, what was done, why it was not enough, what is new |
| Resending a refused letter fails [P] | Earlier attempts recorded; repeat warning; change report | Built | Keep |
| Answer every point in Amazon's last reply [P] | Replies read per round; delta reopens what Amazon asks again | Built | Keep |
| Final wording "may not respond" [U] | Recognised | Built | Copy says neither clearly final nor open |
| Contradiction between an earlier claim and new evidence [ChatGPT] | Wording/fact comparison between rounds only | Missing | On the device: compare earlier promises (supplier dropped, process started) with new documents and answers; ask the seller to explain a difference; never invent one or accuse |
| Connected timeline: each submission ↔ its documents ↔ Amazon's reply ↔ what changed, with reply status [ChatGPT, ASA] | `timelineEvents` exists; no step builds it | Partly | One dated, editable list from what the case already holds; reply status: refused / waiting / asked for more information |
| Escalation routes are finite and history-gated [P] | Change-of-approach panel; routes not recorded | Partly | Record routes used with dates; warn before an escalation when no strong letter is on record |
| "Unverified" vs "forged or manipulated" [U][P] | Forged cases routed to professional help; no per-document history | Partly | Per document: "Has Amazon seen this? What did it say?" (not seen / insufficient / unverified / forged or manipulated / I don't know); forged blocks reuse of that file and anything made from it |
| Editing, retyping, Word-to-PDF can count as manipulation [U][P] | Guidance in forged cases only | Partly | Warning on every upload, with the one allowed change: black out prices, highlight the ASIN |
| Invoice window can be 180 or 365 days [P] | Length fixed at 365 | Partly | Read the day count from the notice; fall back to 365 and say so |
| Amazon's units-sold figure can be wrong [P] | Seller's figure only | Partly | Optional "Amazon's figure" beside the seller's; a difference becomes a line the letter corrects literally |
| Supplier must be reachable [P] | Checks supplier name, address, phone on the invoice | Partly | Checklist: named direct contact, working website, supplier told to expect a call |
| Related account blocks until reinstated or link explained [U][P] | Related-account case type with its own records | Partly | Ask: yours, former, family, a stranger's? Its status? Has it appealed? What is shared, since when? Branch the records list |
| Other accounts owned or managed; false denial is worse [P] | Not asked outside the related-account case | Missing | Ask in every case: "Any other Amazon seller account you own, run or used to run?" with "I don't know"; a yes adds a disclosure line the seller writes |
| VAs, agencies, user permissions as links [P] | Not asked | Missing | Who has or had access, how (User Permissions or a shared login), and whether any worked on a suspended account |
| New account or relisting under a new ASIN during review [P][U] | Not asked | Missing | Ask once; a yes shows a strong warning and a "Before you send" line |
| Changes before appealing count only when dated and evidenced [P] | Corrective actions in the response | Partly | Ask what changed, with dates and IDs (removal orders, supplier dropped, new supplier vetting); warn when a deletion is the only fix |
| Funds can be held over another account's history; separate window [V][U] | "Your money" line and funds route | Partly | Ask whether another account the seller operated was flagged; read the window from the notice; record whether a disbursement request was sent and when |
| Identity re-verification and who runs the business [P] | Verification case raises ID and proof of address | Partly | For verification cases: earlier verification dates and outcomes, and whether the person on the call runs the account |
| Acknowledgment ticks admit a violation [P] + Part B | Not covered | Missing | Plain note wherever a notice offers an acknowledgment route: what the tick admits, and that admitted violations keep counting towards the repeat cap |
| Tone of the letter [P] | Critic checks blame-shifting | Built | Add pleading and comments on Amazon's speed |
| Tone of past messages | Not asked | Should not build | No source makes it an appeal factor |
| Account age, lifetime sales | Not asked; units sold only as invoice evidence | Should not build | Keep sales as evidence only |
| Sales jump on a young account [U] | Not asked | Missing (low) | Only when the notice cites sales volume or history: when did sales start rising? |
| Arbitration, mediation, DSA routes [V][P] | Terms "Where this service stops" | Built | Mention EU routes as information only |
| "Trained on real appeals" claim | No such training; no such claim in copy | Built (honest) | Keep: never claim outcome-trained AI |

---

## Part F. The plan

**Rule for every new question (from ChatGPT, adopted):** collect a fact only when we can say what decision it changes. Every history question offers "I don't know", and a missing answer is never read as a clean history. Everything stays on the seller's device, like the rest of the case. No score, no chance, no prediction.

**First: the account background card and per-document history.**

1. An optional **"About this account"** card beside "Earlier attempts":
   - earlier warnings for this same problem in the last 180 days (count, dates, "Repeat" label on the Account Health page, answered or not);
   - any other seller account owned, run or formerly run;
   - who has or had access, and how (User Permissions or a shared login);
   - a new account or relisting under a new ASIN during review;
   - what was changed before appealing, with dates and IDs.
2. Each "yes" adds a plain line to "Before you send"; the letter uses only what the seller typed.
3. Per document: **"Has Amazon seen this before, and what did it say?"** Anything Amazon called forged or manipulated is blocked from reuse.
4. **The admit-versus-dispute line** beside the position choice (Part B, item 8).
5. **Questions that change with the circumstance:** a repeat asks why the earlier fix failed; a dispute asks for evidence without forcing an admission; another unresolved violation stays visible as its own issue.

Why first: repeats are the one history fact Amazon's own file names; a related or undisclosed account can block a good letter; a document already flagged is the costliest thing a seller can resend.

**Second: the checks that make documents survive verification.** Invoice window length from the notice (180 or 365); Amazon's units-sold figure beside the seller's; supplier-reachability checklist; edit/convert warning on every upload. Why: practitioners report refusals on exactly these points, and no wording fixes them.

**Third: rounds, routes and consistency.** The connected timeline with reply statuses; the contradiction check between earlier promises and new evidence (explain, never accuse); escalation routes used, with a warning before escalating without a strong letter; "previously alerted" / "repeat violations" detection; the acknowledgment-tick note; the 3-day critical-violation window. Why: escalations are finite and history-gated, a timeline is the one account-level item firms explicitly ask for, and contradictions across rounds are what a reviewer with the full file sees and a seller does not.

**Later, on a trigger:** branching the related-account records by mine / former / family / stranger once real related-account cases arrive; verification-history questions; the sales-jump question when a notice cites sales history; extra tone rules in the critic.

**Never:** any score, chance, risk level or prediction from history (D6; no source supports one); an AHR number that changes advice; account age, lifetime sales or the tone of old messages as appeal factors; any claim that the AI is trained on accepted and rejected appeals; any sentence in copy presented as Amazon's wording before a signed-in check; a fixed list of "Amazon's linking signals".

**Order relative to other work (ChatGPT's recommendation, which this research supports):** do this account-history work before adding more writing features.

---

## Part G. Tests that prove history changes the help

Software tests can prove the tool reacts correctly; only consented real cases can show any effect on outcomes, and we will claim none.

- **Paired cases, same notice, different history.** For each of: authenticity, IP, restricted product, related account, verification:
  - a clean history vs three same-policy warnings → the repeat case raises the "why did the earlier fix fail" question and the "Before you send" line; the clean one does not;
  - no other account vs a still-deactivated linked account → only the second raises the disclosure and "reopen the other first" guidance;
  - a document never seen vs one Amazon called forged → only the second blocks reuse;
  - accept vs dispute → only accept shows the repeat-cap line.
- **Irrelevant differences change nothing:** account age, total sales, an angry old message, a different business name → identical questions and guidance.
- **"I don't know" is not "no":** an unknown answer keeps the question open in "Before you send" rather than clearing it.
- **Contradiction check:** an earlier submission saying "we stopped buying from Supplier X" plus a new invoice from X dated later → the seller is asked to explain; the draft contains no invented explanation and no accusation.
- **Privacy:** none of the new answers appear in the `/api/compose` payload unless the seller's own letter text contains them.
- **Copy:** no new string contains a percentage, "chance", "likely", "guarantee", "trained on".

---

## Part H. Open questions and checks for a signed-in seller

- Check against the live US Seller Central pages (signed in): the AHR policy (Part B was a Japan-hosted copy from March 2025), the Seller Code of Conduct, the multiple-accounts page, the funds disbursement policy, the Seller Challenge FAQ, Amazon's appeal guidance.
- Whether violations older than 180 days are visible to the person reading an appeal.
- Whether a forgery finding is permanent, and the current (2026) acknowledgment-form wording.
- Whether a second account still needs prior approval.
- The funds request window today (60 or 90 days).
- Whether US, UK and EU appeals are handled by different teams.
- Whether any DSA dispute body has taken an Amazon seller case; whether P2B mediation still applies to UK sellers after Brexit.
- Firms not checked: Coleman Legal, AppealsPro, SellerPlex; no Pakistani or Indian agency intake page was found.

## Conclusion

"How much does history count?" has no sourced answer and should never get a number. "Which facts in the account's past change what the next letter must say, attach or avoid?" has a clear one: same-policy repeats, what earlier rounds and escalations put on record, what Amazon said about each document, whether the seller admitted or disputed before, other accounts and the people with access, and dated changes. Those facts explain most of "same POA, different result" without any appeal to luck, and each maps to a question and a check rather than a prediction. Much of what decides the outcome sits outside the letter: a linked account's status, a document's past, Amazon's own unit count, a supplier who does not answer the phone. A tool that only writes better letters cannot reach those; a tool that asks the right history questions before drafting, and refuses to let a flagged document or a near-copy go out, can.

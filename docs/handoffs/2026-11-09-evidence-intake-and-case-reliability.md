# AppealDeck reliability and premium case service blueprint

Research and system design, revised 9 November 2026. The founder approved design decisions C01–C16 on that date; implementation is explicitly on hold.

Implementation planning companion: [the existing-tool implementation plan](2026-11-09-premium-case-service-implementation-plan.md) maps this blueprint to current code, approved C01–C16 decisions, proposed technical contracts, work packages, migration and release checks. No product work has been implemented under these approvals.

**Founder approval recorded, 9 November 2026:** C01–C16 are approved as scoped in the plan. **C09 is for later, after a few sellers**; do not start Amazon integration work, onboarding or spending now, and verify actual costs/access requirements at that later milestone rather than assume an API fee. **C12 means keeping sales metrics and adding measures of service quality, reliability, seller effort/completion, satisfaction and observed Amazon outcomes.** The direction is approved; operational values and technical details are settled during the planned work. No code changes, migrations, service activation or parked-feature releases are authorized now.

**AppealDeck's objective is to give each seller thorough, dependable assistance that produces the strongest truthful response their case supports and helps them move toward the appropriate Amazon resolution.** The service should investigate, organize evidence, help obtain missing records, check the response and guide follow-up. The seller should experience competent case handling from first notice through the next meaningful decision.

The founder's clarification governs this revision: earlier decisions about collection, storage, management, AI context and product scope are revisable design choices. Recommend changing them when a better design serves reliability, functionality and seller outcomes. Collect and use sufficiently rich relevant information, with appropriate permissions and protections. The amount of engineering effort or consistency with an earlier decision is not the measure of success; the benefit delivered to the seller is.

Improving the quality and fit of a response is within the service's influence; Amazon's decision remains external. The research does not quantify an approval uplift or establish privileged treatment for firms. The plan therefore pursues better case outcomes while measuring the work that could plausibly improve them, rather than treating uncertainty about approval rates as a reason to settle for minimal assistance.

This revision broadens the [6 November account history proposal](2026-11-06-account-history-master.md). It supersedes the earlier version of this report's narrow R-18-first recommendation and its placement of cloud case management at the end of the roadmap. The coordinated service direction and C01–C16 changes are now approved, with storage architecture decided early and C09 explicitly deferred. Implementation remains on hold, and separately parked implementations still require their named release instructions.

## 0. Direction and decisions

### What success means

The seller should be able to say: "You understood my situation, asked the right questions, helped me obtain what was missing, checked the details, prepared a response I could trust and showed me what to do next." A polished screen and an articulate letter contribute to this experience, but continuity, useful assistance and dependable execution must carry it.

The service should pursue four outcomes together:

| Outcome                 | What the proposed service must deliver                                                                                           | What would demonstrate improvement                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A stronger case         | Correct response route, relevant confirmed facts, supported positions, sufficient product-specific evidence and real remediation | Independent case review finds fewer material omissions and more complete responses to the actual request.                                 |
| Reliable functionality  | Saved work, correct document versions, recoverable processing, accurate status and secure case isolation                         | Journey tests and production monitoring demonstrate the intended behaviour, including failure recovery.                                   |
| A premium experience    | Clear next actions, reduced repeated entry, practical help obtaining evidence and responsive support                             | Sellers complete useful steps with less avoidable effort and report that they understand their case and next step.                        |
| Better external results | Relevant decisions such as accepted documentation, ASIN/account reinstatement or funds review progress                           | Appropriately tracked cohorts show their actual results, including pending and unsuccessful cases, without conflating different outcomes. |

This whole-journey approach is consistent with the GOV.UK Service Standard's instruction to design around the user's problem and connect related services. That standard also favours useful increments over a complicated service that tries to do everything at once. It is service-design evidence, not an Amazon approval study. [GOV.UK whole-problem standard](https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem).

### How to reconsider an earlier decision

For each change, record the previous behaviour, the seller problem, the recommended replacement, supporting evidence, permissions and security implications, migration/disclosure effects, and a test that would demonstrate benefit. Preserve the decision history while replacing outdated operational guidance. Do not leave two contradictory current instructions for a future implementer.

| Existing choice or limitation                                 | Recommendation for the proposed service                                                                                                                                            | Condition for changing live behaviour                                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full prior sent wording remains on the device                 | Allow selected earlier submissions and relevant evidence to become authorized case context for contradiction checking and follow-up                                                | Preview and scope the transfer; preserve provenance; test whether the extra context improves case review.                                                      |
| Cloud is primarily encrypted backup                           | Offer managed cloud cases as the recommended continuity mode for sellers choosing the full guided service                                                                          | Define who can decrypt/process the case, retention, recovery, access and deletion; migrate by choice without silently uploading old cases.                     |
| Identity and financial files are browser-only for checking    | Reassess each document category by the task it enables. Retain local handling where adequate; allow a separately designed protected service when content analysis materially helps | Document necessity, handling and legal basis; use dedicated access/payload controls and verified processors; never simply remove the current refusal constant. |
| Seller enters the case through pasted text and manual uploads | Keep that entry path and evaluate lower-effort authorized imports                                                                                                                  | Verify actual API/forwarding capability, authorization, record provenance and limitations before promising coverage.                                           |
| Missing evidence can be recorded as unavailable               | Add a supported acquisition process and follow-up, with truthful alternatives where allowed                                                                                        | Templates must request real records; track whether the record actually arrived and resolves the requirement.                                                   |
| Case-level accept/dispute choice                              | Support issue-specific positions in mixed cases                                                                                                                                    | Tests must show that accepting one issue does not admit another.                                                                                               |
| Anonymous outcome summaries alone                             | Preserve anonymous sharing and design an optional linked evaluation record for genuine learning about case journeys                                                                | Separate research purpose, access and retention; obtain the appropriate authority; exclude it from ordinary case permissions.                                  |
| Limited model context and inexpensive first-pass drafting     | Allocate context and review effort according to case complexity and measured failure modes                                                                                         | Evaluate the complete pipeline, set operational budgets and maintain a truthful fallback; more model calls alone do not establish quality.                     |
| Specialist cases end at a referral boundary                   | Make the boundary useful: explain the issue and help assemble an accurate chronology, record list and questions where the approved scope permits                                   | Keep gated advice/drafting limits until deliberately revised; expert access and any handoff require their own approved workflow.                               |
| Follow-up help is mostly another revision                     | Provide a connected plan based on the exact reply, pending status, new evidence and available route                                                                                | Preserve uncertain interpretations, prevent invented rejection reasons and make status correctable.                                                            |

These are recommendations for replacing or extending choices. They are not claims that all listed changes are beneficial in every case. The later sections specify the operating model and evaluation needed to decide which to enable.

### Professional permission and responsible use

The founder's willingness to offer richer processing is a product direction, not permission on behalf of future sellers. Build the service so each seller understands the selected processing, has the authority to provide the relevant records, and can exercise the applicable controls. Permission to handle a case does not automatically authorize training on it, contacting its supplier or using another person's information for unrelated purposes.

Where applicable, choose the correct legal basis for each activity rather than relying on one blanket checkbox. The European Commission distinguishes consent, necessary contractual processing and other grounds; ICO guidance similarly limits contractual necessity to the actual service. These are jurisdiction-specific principles, not a conclusion that the currently blocked EU/UK markets have been opened. [European Commission legal grounds](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en), [ICO contract guidance, indexed](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/contract/?search=marketing).

### Reading this blueprint

Sections 1–3 distinguish research findings, unsupported Meta AI claims and existing code. Sections 4–8 specify the seller journey, information, records and checks. Sections 9–10 cover the proposed architecture and AI work. Sections 11–13 define evaluation, delivery and remaining verification. Proposed behaviour is labelled as design; source citations support the external facts rather than implying Amazon mandates our particular implementation.

## 1. What the evidence establishes

### Sources and access limits

Sources were checked on 9 November 2026. Amazon-hosted policy text, attributable Amazon staff guidance, firms describing their own services, and our design proposals have different evidential weight. Search indexing exposed some Seller Central help content, while direct opens returned a login or JavaScript shell. Those passages are labelled indexed, not authenticated current policy. No private firm intake calls, internal Amazon review procedures, or representative outcome dataset were available.

The Amazon-hosted Account Health Rating PDF was readable directly. It contains Japan-specific links and older policy text; it is not proof that every November 2026 US workflow is identical. Preserve marketplace and version limits before using its details in product rules.

### Findings that matter for this design

1. **Answer the actual request.** Indexed Amazon appeal guidance calls for factual, concise explanations, coverage of all issues and affected products, and supporting records within the requested timeframe. This supports a requirement checklist grounded in the seller's notice and current form. [Amazon appeal guidance](https://sellercentral.amazon.com/help/hub/reference/external/G201623610?locale=en_in).
2. **Check sourcing records against products and quantities.** Amazon staff describe supplier-issued invoices, product identifiers, quantities consistent with sales, supplier contacts, completed transactions and acceptable document formats. They say price information can be removed while other details remain visible. This staff guide gives a 365-day example; a particular request still needs its own dates. [Amazon staff invoice guide](https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7).
3. **History can change the questions and response route.** The AHR PDF describes increasing impact for repeats of the same policy and says some admitted violations may still count after a successful appeal. A healthy rating does not exclude all deactivation grounds. This supports targeted history and a supported dispute option, not an approval prediction. [Amazon AHR policy and FAQ](https://m.media-amazon.com/images/G/09/rainier/help/Account_Health_Rating_program_policy_and_FAQ_EN.pdf).
4. **Multiple accounts are not inherently misconduct.** Amazon staff describe legitimate business need and good-standing conditions for operating multiple accounts. Related-account intake must distinguish actual ownership, former relationships and a disputed link. [Amazon staff multiple-account Q&A](https://sellercentral.amazon.com/seller-forums/discussions/t/f0cdac0c-08c4-402f-a4ce-9308193a7f66).
5. **Some cases require a process other than a letter.** Amazon's toys Direct Validation guide distinguishes verification through a Testing, Inspection and Certification provider from an appeal of a mistaken classification. Its follow-up permits qualifying existing reports to be reviewed by an approved provider. Do not prescribe new testing or a self-uploaded report universally. [Amazon process guide](https://sellercentral.amazon.com/seller-forums/discussions/t/ab07e99c-e287-451f-9e4d-3944d8d8897f), [Amazon follow-up FAQ](https://sellercentral.amazon.com/seller-forums/discussions/t/6fdad345-8c82-47fd-9c68-685d87d92cae).
6. **Escalation eligibility is specific.** Amazon's Seller Challenge announcement describes eligible listing decisions for Account Health Assurance members after standard appeals, three opportunities per 180 days, and a 48-hour decision aim. These are not a universal appeal limit, guaranteed timing, or access bestowed by hiring a firm. [Amazon announcement](https://sellercentral.amazon.com/seller-forums/discussions/t/11731d72-4ea8-4aed-86af-b671e27afda9).
7. **Funds review is a separate process.** Amazon's October 2024 announcement describes requesting review after 60 days and additional eligibility checks. The interval is not a promise of payout or a general appeal deadline. [Amazon funds announcement](https://sellercentral.amazon.com/seller-forums/discussions/t/03a73ea8-64dc-45fb-b0e3-67571459c364).
8. **Professional services do publish evidence-based intake.** ASA describes collecting the notice, affected account or products, prior submissions and replies, and a timeline before requesting case-specific records. It expressly denies special insider access. Riverbend describes reports, investigation, questions, a follow-up call, drafting and continued follow-up. These establish what those firms advertise, not industry-wide practice or measured effectiveness. [ASA intake FAQ](https://amazonsellersappeal.com/amazon-suspension-appeal-faq/), [Riverbend service process](https://riverbendconsulting.com/3p-account-suspension-appeal/).

## 2. Corrections to the Meta AI discussion

| Claim or implied rule                                                     | Assessment                                                            | Product consequence                                                                                    |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Writing is only 10 percent of the work                                    | Unsourced numerical estimate                                          | Treat investigation as important without inventing proportions.                                        |
| Misdiagnosis is the single most common cause of refusal                   | No representative evidence established                                | Measure routing errors rather than claiming a ranking.                                                 |
| Hidden related accounts are the most common failure cause                 | Unsupported frequency claim                                           | Ask about links when relevant, not as a universal accusation.                                          |
| Firms reject 30 to 40 percent of inquiries and achieve 80 percent success | Unsupported figures in this discussion                                | Do not use these numbers in business planning or product claims.                                       |
| Investigators spend under three minutes and reject particular keywords    | No verified universal rule                                            | Optimize factual clarity and coverage, not supposed secret trigger words.                              |
| Firms receive preferential treatment because Amazon recognizes them       | Not established; one reviewed firm explicitly denies special access   | Never sell institutional trust or privileged routing as a product benefit.                             |
| Accept fault even if innocent                                             | Harmful advice                                                        | Preserve accept, dispute and unsure positions. No fabricated admission.                                |
| No invoice plus no payment proof means no POA                             | Overbroad gate                                                        | Requirements depend on the issue and current request. Bank proof is not universally required.          |
| Every claim needs three documents                                         | Unsupported universal burden                                          | Use sufficient relevant support; one authoritative record may resolve a point.                         |
| A supplier website, phone and registry must all match exactly             | Useful checks, excessive as an absolute rule                          | Ask about material discrepancies; trading names, moves and missing websites need context.              |
| A 14-day payment lag suggests a lie                                       | A discrepancy does not establish deception                            | Allow credit terms, split payments, deposits and other seller-supported explanations.                  |
| Lock root cause so the story cannot change                                | Prevents legitimate correction                                        | Preserve versions and reasons for correction; do not freeze an inaccurate account.                     |
| After two or three denials the strategy must change completely            | No universal threshold established                                    | Next steps depend on what was refused, what is pending and what changed.                               |
| Five poor submissions have burned the account                             | No ordinary-appeal cap or inevitable outcome established              | Record prior rounds and relevant reply wording without declaring the account unwinnable.               |
| Any edited PDF is false                                                   | Confuses substantive alteration, presentation and permitted redaction | Preserve originals; apply the exact submission rules; do not make a forensic verdict.                  |
| Supplier unavailable means refuse the whole case                          | Inability to contact is not proof of fraud                            | Record the failed contact and investigate legitimate alternatives.                                     |
| An invoice must contain an ASIN                                           | Too broad; many use manufacturer identifiers                          | Map model, barcode or product description to the ASIN without changing the invoice.                    |
| An unauthorized supplier proves the goods are counterfeit                 | Invalid inference                                                     | Distinguish authenticity, sourcing traceability, authorization and IP allegations.                     |
| Create an Amazon-accepted authorization letter                            | No universal accepted wording established                             | Help request authentic records. Issuers must independently confirm rights and facts.                   |
| Create a signed training log or completed SOP as remediation              | A document cannot establish that an event occurred                    | Draft prospective processes; record actual implementation separately.                                  |
| Delete risky stock and change account details before appeal               | Potentially harmful without case context                              | Preserve records and follow the relevant operational process. Never destroy evidence or conceal links. |
| A second suspension is often permanent                                    | Frequency unsupported                                                 | Explain actual notice consequences instead of a general fear claim.                                    |
| Record supplier calls and chase every 24 hours                            | Not a universal professional or legal requirement                     | Offer optional scripts and seller-selected follow-up dates; no default recording instruction.          |
| AI cannot ask, investigate or refuse                                      | Confuses model limitations with software design                       | Software can structure questions and enforce constraints; real-world verification still has limits.    |
| Refund guarantees transfer the seller's full risk                         | Commercial overstatement                                              | A fee refund does not cover lost sales, inventory or account loss.                                     |

The useful part of the discussion is the sequence: understand the request, investigate the facts, obtain relevant records, check consistency, prepare a truthful response, then evaluate the actual reply. Its claims about coercion, insider access and universal evidence burdens should not become product requirements.

## 3. What the current code already provides

This was a focused source inspection, not a full runtime or production audit.

| Capability                                                                                                  | Owning source                                             | Finding                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate document, operational, questionnaire, acknowledgement, verification, dispute and specialist routes | `src/core/workspace.ts`                                   | Exists. Avoid rebuilding the tool around POAs alone.                                                                                                                                                                                                                                                      |
| Requirements with source quote and revision, file references and unavailable-record reasons                 | `src/core/workspace.ts`, `src/lib/workspaceSchema.ts`     | Exists. Extend the current record instead of adding a competing checklist.                                                                                                                                                                                                                                |
| Prior submissions, exact sent text, attachment hashes, requests and replies                                 | `src/core/workspace.ts`                                   | Exists locally. Replies lack an explicit submission association in the inspected type.                                                                                                                                                                                                                    |
| Business name and address, suppliers, one units-sold figure                                                 | `CaseFacts` in `src/core/workspace.ts`                    | Exists; not a structured account-history or product-by-product purchasing ledger.                                                                                                                                                                                                                         |
| Document readings and field comparisons                                                                     | `src/core/documentCheck.ts`, `src/lib/documentChecks/`    | Exists. It explicitly rejects authenticity verdicts.                                                                                                                                                                                                                                                      |
| Invoice quantity aggregation                                                                                | `src/core/invoiceCoverage.ts`                             | Exists, but pools lines against one sales figure. It describes the sum as an upper bound, not proof of per-product coverage. The inspected function excludes dates explicitly marked conflicting, but does not itself exclude an absent or unassessed date. It has no separate requested-inventory input. |
| Completed-action attestation                                                                                | `src/core/workspace.ts`, `src/core/readiness.ts`          | Exists. Keep separate from documentary corroboration.                                                                                                                                                                                                                                                     |
| Model drafting from seller answers, request text, issue list and record references                          | `src/lib/draftRequest.ts`, `src/lib/llm/draftResponse.ts` | Exists. File contents and full prior sent wording are not automatically given to the writing model.                                                                                                                                                                                                       |
| Trimming case data before compose requests                                                                  | `composePayloadWorkspace`, `src/lib/composeRequest.ts`    | Exists, but uses a spread and selected exclusions. Adding fields could transmit them unless replaced by explicit allowlists.                                                                                                                                                                              |
| Temporary document processing with browser-only categories                                                  | `src/app/api/read-document/route.ts`                      | Correctly classified identity, bank and address documents are refused by this route. Client labelling is a material limitation, disclosed in current privacy copy.                                                                                                                                        |
| Encrypted cloud backup and processing disclosures                                                           | `src/content/legal.ts`                                    | Exists. Encrypted backup, temporary model processing and a server-readable case database are different capabilities.                                                                                                                                                                                      |
| Provider selection and fallback                                                                             | `src/lib/llm/ai.ts`, `src/content/aiProviders.ts`         | Default order is Gemini then Groq, subject to configuration and support. Groq is listed for text with null terms metadata. No active production configuration was inspected.                                                                                                                              |

The important missing layer is a connected account and case record that explains why a question is asked, what supports an answer, which differences remain unresolved and what can be included in the response. R-18 already proposes much of this. Missing-record assistance can extend that plan without replacing the workspace.

## 4. Proposed seller journey

The following sections describe proposed behaviour, not implemented features or Amazon-mandated form fields.

1. Capture the exact request and visible response form, including marketplace, date, scope, products and deadline.
2. Confirm what Amazon is asking the seller to do. If the route is unclear, collect clarification instead of inventing a root cause.
3. Connect relevant history already entered: earlier warnings, submissions, attachments, replies and unfulfilled promises.
4. Ask only the questions needed for this issue. Offer unknown, not applicable and cannot obtain where meaningful.
5. Review documents for readable fields, product coverage and material inconsistencies. Distinguish seller claims from extracted observations.
6. Turn each missing essential record into a practical acquisition task, with a recipient, safe request draft and seller-selected follow-up.
7. Show the supported facts, unresolved items and proposed response route. Let the seller correct the record.
8. Prepare only claims justified by the confirmed information. Show a response and its actual attachments together.
9. Record exactly what the seller sent. When a reply arrives, connect it to the appropriate submission and identify what changed.

Keep the interface progressive: a short initial capture, then focused questions next to the problem they resolve. Do not require a long interrogation before the seller can understand their situation.

### What premium case handling should feel like

These are proposed service acceptance criteria, not claims that a particular interface increases Amazon approvals.

| Moment                | Seller experience                                               | Required service behaviour                                                                                                |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| First notice          | Understand the situation and the immediate next step            | Show the identified request, uncertainty, urgency and supported route; do not start with a generic sales pitch.           |
| Intake                | Explain the situation once and correct misunderstandings easily | Reuse confirmed facts; propose extracted answers with source references; ask only relevant follow-ups.                    |
| Evidence collection   | Know what to obtain and how to obtain it                        | Name the missing record, reason, likely holder, request draft and next follow-up.                                         |
| Returning later       | Continue where the case stopped                                 | Preserve answers, tasks, processing state and file versions across the chosen storage mode.                               |
| Waiting               | Understand who needs to act                                     | Distinguish waiting for seller, supplier, AppealDeck processing or Amazon; show the next check or action.                 |
| Review                | See what the response says and why                              | Provide a readable explanation with supporting references, remaining gaps and the exact proposed attachments.             |
| Submission            | Know what to send and where                                     | Follow the visible form/channel, explain field and file constraints, and preserve the actual sent record.                 |
| Amazon reply          | Understand what changed                                         | Connect the reply to the relevant submission and distinguish an explicit request from an uncertain interpretation.        |
| Difficulty or refusal | Receive a concrete useful next step                             | Help resolve the gap, correct an error or prepare for appropriate specialist help instead of repeatedly generating prose. |
| Completion            | Leave with usable records and clear status                      | Supply the case history, final versions, actual result and relevant further obligations.                                  |

W3C recommends splitting long forms into logical stages, identifying optional steps and avoiding unnecessary time pressure. Apply that guidance to the intake and preserve answers after validation errors. Progress should describe completed work, such as records reviewed; it must not imply a percentage chance of reinstatement. [W3C multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/).

### The next question should resolve a real uncertainty

Maintain a question protocol: why an answer matters, who needs to supply it, how accuracy can be checked and when it becomes outdated. GOV.UK's form guidance uses this approach and recommends branching so users answer relevant questions. For AppealDeck, it supports a comprehensive question library with selective delivery rather than either a shallow universal form or an exhaustive questionnaire for everyone. [GOV.UK form structure guidance](https://www.gov.uk/service-manual/design/form-structure).

Proposed question selection:

1. Identify an open decision or requirement in this case.
2. Check whether an existing confirmed record already answers it.
3. Propose an extraction or ask the smallest useful question, explaining why it matters.
4. Record yes, no, unknown, disputed or unavailable accurately; do not default unknown to no.
5. Reassess what remains unresolved and whether another question would change the next action.

Prioritize actual deadlines, response routing, material evidence gaps and contradictions. Do not calculate a pseudo-scientific information-value score from unsupported weights. A broader background interview is appropriate when the notice is ambiguous or the available records point to another relevant issue, provided the seller can understand its purpose.

### Effort should follow case complexity

Routine clear requests can use a short path. Mixed allegations, repeated unresolved requests, multiple suppliers or products, document disputes and near deadlines need deeper review. A seller should not have to know the right diagnosis to receive that attention.

The proposed deeper path can include a structured chronology, reconciliation of affected inventory, comparison against earlier claims, an independent review pass and a prepared specialist summary. Escalate attention when the evidence warrants it; a more confident model voice is not escalation. If human review is offered, define qualifications, scope, response expectations and capacity before selling it. Do not imply that a named account manager exists unless one actually handles the case.

### Submission and follow-up are part of the service

Before sending, check the actual form, response language, file types/sizes and required fields. Preserve originals and prepare only permitted submission copies; do not silently crop, compress or annotate away material content. An evidence index can make files easier to navigate, but attachments must still follow the destination's actual rules.

Record what the seller actually submitted, including edits made outside AppealDeck and the receipt when available. Distinguish prepared, copied, seller-reported sent and independently confirmed status; a click on Copy is not a submission. A subsequent reply must be able to change the case plan rather than merely trigger a rewrite.

For support incidents caused by AppealDeck, provide a recovery path: restore saved work, explain a processing failure, correct affected output and recheck related case records. Define the applicable support/refund handling in the service terms. These operating responsibilities are part of delivering the proposed experience, not additional Amazon evidence requirements.

### Worked example of the intended depth

The following fictional example illustrates software behaviour; it is not an actual appeal, Amazon rule or outcome claim.

A seller receives a sourcing-document request covering products A and B. For the request's stated period, the seller's report shows 300 units of A and 200 of B. The uploaded invoice lines cover 500 units of A and 40 of B. An earlier response said sourcing from supplier X stopped on 20 October; one invoice from X is dated 22 October.

A pooled total gives 540 invoiced units against 500 sold, concealing B's shortfall. A superficial contradiction check could also accuse the seller of buying from X after promising to stop. The proposed service should investigate both points:

1. Map the invoice lines and units to each product. Show that A's surplus does not establish B's missing 160 units. Check any additional inventory or other coverage the actual request specifies separately.
2. Ask for the purchase, fulfilment and invoice dates. The seller supplies an order dated 10 October showing that the 22 October invoice concerns an earlier purchase. Preserve the explanation and sources; do not invent a new purchase or disregard the discrepancy.
3. Ask where B's remaining stock came from. The seller identifies a second genuine supplier but has only an order confirmation. Explain the unmet invoice requirement and prepare an accurate request for the original completed-transaction record. Do not turn the order confirmation into an invoice.
4. Keep the evidence task open while the seller waits. Preserve the actual Amazon deadline and a separate seller-selected supplier follow-up. If the record arrives, recheck it; if unavailable, show the unresolved limitation and applicable clarification path.
5. Use the seller-authorized earlier response to check the proposed new wording. Do not claim inventory was removed, staff trained or a supplier terminated unless the seller's record supports those actions.
6. Prepare the document response appropriate to the actual form, with product-specific references and a factual explanation of any material remaining gap. Do not fabricate an operational confession merely to fill three POA sections.
7. Record exactly what was sent. If Amazon subsequently asks for supplier verification, link that reply to this submission and investigate the specified gap rather than changing the root-cause story for variety.

The seller receives a diagnosis of the actual evidence problem, assistance obtaining the record, a defensible explanation of the date difference and continuity through follow-up. Whether Amazon accepts the resulting records remains its decision. The measurable improvement is that the service identified and addressed issues a polished generic draft could have missed.

## 5. Questions and the decisions they change

### Initial case capture

| Question                                                                                         | Why it is needed                                        | Consequence                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Paste the full Amazon message and the current response-form instructions. Are any parts missing? | Identifies the actual allegation and requested response | Route and requirement extraction; missing text remains unknown.                         |
| Which store and account or listing does this concern?                                            | Rules and actions can differ by market and scope        | Avoid applying one store's resolution to another.                                       |
| When was this received, and what deadline does Amazon show?                                      | Separates receipt, notice and action dates              | Calculate only a supported deadline, with timezone and anchor.                          |
| Which ASINs, orders, complaint IDs or other identifiers are named?                               | Defines the records to review                           | No unsupported extension to the entire catalogue.                                       |
| Have you already responded? Is any response still awaiting a decision?                           | Prevents treating silence as refusal                    | Import the relevant round and avoid unnecessary duplicate follow-up.                    |
| Do you believe the finding is correct, mistaken, partly correct, or not yet understood?          | Prevents a default admission                            | Separate positions by issue; the current case-level position alone may be insufficient. |

Do not collect government IDs, tax numbers, a full sales history, family member emails or held-funds amounts by default. Ask only if the current decision needs them. An account label can identify another business without collecting its private login email.

### Relevant account history

| Question                                                                        | Trigger                               | How it changes the help                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Has this same issue occurred before? What were the incident dates?              | Operational failure or repeat wording | Checks whether earlier remediation was adequate; deduplicates repeated emails about one incident.             |
| Does Account Health mark it Repeat?                                             | Same-policy history                   | Records what Amazon displays without calculating an invented risk score.                                      |
| Was the earlier finding accepted, disputed, overturned or left unresolved?      | Prior incident                        | Distinguishes a confirmed error from an admitted issue; unsure remains unsure.                                |
| What did you previously say you had changed, and was that actually implemented? | Earlier response or recurrence        | Raises incomplete implementation or a supported change in explanation.                                        |
| Which response, files and versions did Amazon see, and what did it say?         | Any prior round                       | Connects denial reasons to actual evidence instead of rewriting blindly.                                      |
| Have you already requested support or another review? Is it pending?            | Follow-up or escalation               | Avoids overlapping requests and checks the available route.                                                   |
| Has Amazon questioned a particular document? Paste the exact wording.           | Document-related reply                | Separates missing details, inability to verify and a forgery allegation; preserves a supported error dispute. |

### Authenticity and sourcing

Ask for the relevant product identity, actual sourcing chain, buyer and supplier names, invoice issuer, invoice number, purchase and delivery dates, quantities and unit of measure. Ask how manufacturer identifiers on the invoice map to the affected ASIN. Distinguish individual products, packs, bundles, returns and replacement units before arithmetic.

Record Amazon's stated sales quantity separately from the seller's report. Capture the requested period and its anchor independently of the invoice issue-date rule. Include remaining inventory when the applicable request requires it. Do not silently substitute the code's 365-day default for a different instruction.

Payment or delivery records become useful when specifically requested or when a purchase needs corroboration. Ask first whether a transaction record exists; a full bank statement usually exposes unrelated transactions. A payment match does not prove authenticity, authorization or lawful resale.

For a supplier discrepancy ask: "The invoice shows A; the supplier's current website shows B. Do you know why?" A reply may establish a move or trading name. A registration proves an entity exists; it does not prove brand authorization. A supplier's claim of authorization is distinct from confirmation by the rights holder.

### Other case branches

| Branch                        | Focused facts and records                                                                                                                                       | Avoid                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Related account               | Exact named account; current or former ownership/control; agencies and access arrangements; dates; relevant separation or underlying-account resolution records | Declaring a shared IP the proven cause; creating separation documents for a relationship that never existed; default collection of relatives' identities. |
| IP complaint                  | Complaint type and ID; asserted right; affected content/product; genuine licences; complainant correspondence; actual retraction status                         | Treating trademark, copyright and patent complaints alike; claiming a seller's forwarded letter is necessarily an effective retraction.                   |
| Product condition             | Affected orders/batches; complaints; returns; inspection and fulfilment records; images; completed containment                                                  | Inventing a warehouse failure from a complaint, or assuming every item is defective.                                                                      |
| Performance                   | Metric and measurement period; affected orders; dispatch and carrier events; cancellations; exceptions; FBA or merchant fulfilment responsibility               | Asking for supplier authorization where delivery evidence is the issue.                                                                                   |
| Listing or restricted product | Exact listing and policy concern; current and earlier content; product characteristics; supported corrections or dispute basis                                  | Deleting records, concealing product characteristics, or relisting to evade enforcement.                                                                  |
| Safety or regulatory          | Product, model, market and requested compliance process; applicable reports/certificates; provider or TRF status if relevant                                    | Treating a polished POA as completion of testing; promising that a report fits every variant.                                                             |
| Verification                  | Exact identity or business verification task; discrepancy; required appointment or upload                                                                       | Replacing verification with prose or collecting raw ID into general AI context.                                                                           |
| Review manipulation           | Actual messages, inserts, software/agency activity, dates and relevant cessation records                                                                        | Drafting a generic admission or asserting the agency alone is responsible.                                                                                |
| Funds                         | Exact funds notice; enforcement date; review route; identity checks and current status                                                                          | Promising automatic release after a waiting period.                                                                                                       |

These are question candidates. Each deployed branch needs its own current primary-source rules and examples; this research is not a validated regulatory rulebook for every product or market.

## 6. Proposed case record and evidence relationships

Reuse the existing workspace, requirements, submissions, replies and document checks. Add stable links and versions rather than another disconnected timeline.

| Record           | Essential relationships and attributes                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request          | Marketplace, scope, original wording, received date, form instructions, source and version.                                                               |
| Requirement      | Request and quoted passage; applicability; affected products; date/quantity rule; origin as explicit request, confirmed policy default or recommendation. |
| Fact or claim    | Subject, value, effective date, source reference, seller confirmation, dispute state and versions.                                                        |
| Evidence         | Original bytes or local reference, hash, issuer, document date, acquisition date, version, page references and disclosure permissions.                    |
| Support link     | Which specific claim/requirement a passage supports or contradicts, with page/line or image region.                                                       |
| Incident         | Policy, dates, scope, finding status and related warnings; multiple messages can belong to one incident.                                                  |
| Action           | Responsible person or role, planned/completed state, actual completion date and evidence or attestation.                                                  |
| Submission       | Exact text and file versions sent, route, receipt/date and unresolved items disclosed at that time.                                                       |
| Reply            | Exact text, date, explicit submission link when known, and seller-correctable result classification.                                                      |
| Acquisition task | Missing requirement, recipient, requested record, draft/version, sent status, expected response, follow-up date and received result.                      |
| Permission       | Purpose, data categories, destination, disclosure version, user action, grant/revocation time and applicable retention rule.                              |

Use separate status dimensions. A document can be readable but unconfirmed, relevant but too old, or complete in fields while its issuer is unverified. "Reviewed" must never silently mean "genuine" or "accepted by Amazon."

Useful claim states are seller-reported, observed in a record, corroborated for a stated purpose, contradicted, unknown and disputed. A model reading is a machine observation awaiting confirmation, not an independent corroborating source. Two OCR runs on one invoice are still one source.

Document hashes identify byte versions and detect exact duplicates. They do not prove origin or authenticity. Reissued copies can represent the same underlying transaction and need transaction-level duplicate handling so they are not counted twice.

## 7. Missing records should become practical tasks

For each gap show what is missing, why it matters, who might hold it, what to ask, and what happens if it cannot be obtained. Distinguish an Amazon-required record from useful corroboration. A task date chosen by the seller must not look like Amazon's deadline.

Start with seller-reviewed drafts for these situations:

- Requesting an original invoice copy or issuer-confirmed correction.
- Asking a supplier to explain a material discrepancy and supply chain.
- Requesting a transaction or delivery record from its actual holder.
- Asking a rights holder about existing authorization or a complaint retraction.
- Asking a warehouse or carrier for relevant events, photos or inspection records.
- Requesting clarification through the actual available Amazon response channel.

Do not automatically send messages, call suppliers, record calls or represent the seller. These are separate actions requiring an explicitly authorized workflow. Do not claim email templates are Amazon-approved.

### Example invoice request

> Subject: Original record for purchase [reference]
>
> Please send the original invoice for our purchase [reference], issued to [actual buyer] for [product identifiers and quantity]. The copy we have does not show [specific missing item]. If the original contains a genuine error, please explain the error and issue a correction through your normal accounting process, referencing the original. Please preserve the actual transaction and dates; do not backdate or add information you cannot verify.

### Example discrepancy request

> We are reviewing invoice [reference]. It gives [address or name], while your current business information gives [different value]. Please explain whether this reflects a trading name, relocation or another change, and provide the relevant existing record if available. Please also confirm who issued this invoice and the appropriate business contact for questions about it.

### Example existing authorization request

> Please confirm whether authorization covering [seller, products, territory and relevant period] actually existed. If it did, please provide the existing record or an accurate confirmation identifying its scope and the authorized issuer. Please distinguish any authorization granted now from authorization covering the earlier transaction. We are not asking you to create retrospective permission.

### Example request to a rights holder

> We received complaint [ID] concerning [ASIN] and [stated right]. Our current position is [seller-confirmed position], supported by [actual records]. Please review the attached information. If you conclude the complaint should be withdrawn, please use Amazon's applicable retraction process and confirm the complaint reference. If a point remains unresolved, please identify it so we can address it accurately.

A patent dispute, cease-and-desist response, settlement demand or threatened litigation may require counsel. Do not convert this example into a universal legal response.

### Example request for Amazon clarification

> Your message dated [date] requests [exact item]. We have [actual record] covering [period and products], but [specific ambiguity] remains unclear. Please clarify [single focused question]. Our current submission is [pending or replied-to status, if known].

Choose the channel visible in the seller's account. Do not invent an executive escalation email or infer that an unclear reply silently rejected a particular exhibit.

### When a record cannot be obtained

Record the real reason and attempts made. Consider genuine contemporaneous alternatives only if the request permits them; show any remaining limitation. A supplier's confirmation email is not automatically a replacement for a requested invoice. If an essential requirement remains unmet, label the response incomplete and explain the available clarification or specialist path. Preserve the seller's ability to document the situation honestly, especially near a deadline.

## 8. Proposed checks before preparing and sending a response

| Check                                                        | Behaviour                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Wrong or uncertain response route                            | Ask for the relevant form or clarification. Do not force a POA into identity verification or a document-only request.                      |
| A required fact is missing                                   | Ask a targeted question or leave it explicitly unresolved. Never invent it to complete a paragraph.                                        |
| Planned action described as completed                        | Require correction or confirmation supported by the actual completion details. A drafted SOP is not implemented work.                      |
| Unsupported admission                                        | Remove the admission; ask the seller to choose a supported position on that issue.                                                         |
| Material contradiction                                       | Show both source passages and ask what explains the difference. Preserve the correction history.                                           |
| Supplier termination followed by a later invoice             | Compare transaction date, issue date and promised cessation date. Earlier orders and reissues can explain the sequence.                    |
| A requested product lacks coverage                           | Keep it open even if another product has excess quantities. Unknown dates or quantities do not establish coverage.                         |
| Forgery or fraud allegation                                  | Preserve the allegation and exact document version, distinguish allegation from fact and retain the existing professional-review boundary. |
| Request to fabricate, backdate or conceal                    | Refuse that act and offer a truthful way to describe the gap or request an original record.                                                |
| Unchanged resubmission                                       | Check whether it is expressly requested or still unanswered before warning about repetition.                                               |
| Attachment missing, stale or different from reviewed version | Recheck the actual version and all dependent statements.                                                                                   |
| Model output adds facts                                      | Reject unsupported claims and use a truthful fallback. Do not equate a prompt instruction with verification.                               |

Keep four decisions distinct: whether work can continue, whether a draft can be prepared, whether the interface can call it complete against the recorded request, and whether specialist review is needed. Incomplete evidence need not block every useful action. Deliberate fabrication must never become a supported drafting option.

The final review should show each important factual statement with its source, each promised action with its actual state, every exhibit with its current filename/version, and remaining gaps. If anything material changes, recheck affected claims and invalidate earlier confirmation as appropriate. A hash of the final version can record what was confirmed; it is not a signature proving truth.

## 9. Proposed cloud service and permission boundaries

**Recommended architecture:** offer a managed cloud case for sellers choosing the full guided service. Keep a clearly explained local path for those who do not choose it, with its actual continuity limits. Make the cloud decision before implementing the connected case record so its access model, versioning and recovery are designed together.

Cloud storage is justified when it enables a useful capability: continuity across sessions/devices, authorized background analysis, a connected record of earlier rounds, recovery, or scoped support. Do not upload additional data merely because storage is available. "Used for your case and relevant purposes" must become a precise description of those capabilities, recipients and retention.

| Operation                             | Proposed explanation and control                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save locally                          | Identify what stays on this device and the recovery limits.                                                                                                         |
| Encrypted cloud backup                | Explain that encrypted contents and some metadata are uploaded, who controls the decryption key and what losing it means.                                           |
| Server-readable case storage          | Explain that AppealDeck can process the selected case content, with access controls and a defined retention period. This is distinct from the present backup model. |
| AI analysis                           | Show the selected data categories, purpose, eligible providers and applicable retention terms. Include retry and fallback recipients.                               |
| Human support access                  | Separate authorization identifying scope, access duration and auditability. A support agent does not gain access merely because storage is enabled.                 |
| External expert sharing               | Separate optional scope and expiry. P-03 remains parked.                                                                                                            |
| Outcome sharing                       | Keep the existing anonymous statistics separate from any linked or text-bearing research records.                                                                   |
| Cross-case research or model training | Separate explicit purpose and design; never infer permission from choosing cloud case handling.                                                                     |

**Proposed service disclosure structure:** "Save the selected case information to AppealDeck's cloud so you can continue this case across sessions. [Named providers and AppealDeck roles] can process [specified data] for [specified case tasks]. Files remain until [actual retention rule], and you can [actual export/deletion controls]. AI processing and research choices are explained separately."

Fill in real operations before publication. Explain which processing is necessary for the selected managed service and which uses are optional; do not present an indispensable operation as an optional toggle while silently making the service unusable when it is off. Do not promise immediate deletion from provider logs or backups when the service cannot deliver it. Explain active-store deletion, backup expiry and retained billing/security records separately.

### Proposed architecture for managed cases

Maintain one authoritative case record with a versioned history. Store original evidence separately from extracted observations, seller-confirmed facts, analysis results and generated drafts. Each processing job refers to specific input versions and the permissions under which it ran. This makes a result inspectable and prevents an old analysis appearing current after the seller changes a file.

Use private document storage and database policies scoped to the account, case and any explicitly granted role. Supabase documents private buckets governed by RLS and time-limited signed URLs. Its service keys bypass RLS, so any privileged server job must still enforce the intended account/case authorization; a private bucket alone does not establish isolation. [Supabase bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Supabase storage access controls](https://supabase.com/docs/guides/storage/security/access-control).

Proposed processing sequence:

1. Receive an authorized case/file version, validate it and record the selected purpose.
2. Extract relevant content through the appropriate local, server or provider path; preserve page references and uncertainty.
3. Ask the seller to confirm consequential facts or resolve a material difference.
4. Build a versioned working view of relevant history, evidence, actions and the current request.
5. Run the required analysis and review stages against that view, recording what they used.
6. Save results with their limitations and status; update the next action only when the inputs and permissions still match.

Handle retries as repeat processing of the same authorized job, with duplicate protection for stored results and any eventual external action. If the job fails, show a recoverable status instead of discarding work or declaring a document missing. If the seller revokes an optional purpose, check queued and in-progress work before new transfer, and describe any limits on cancelling a request already delivered to a provider.

Choose retention by category and purpose before activation. State how long active cases remain, what happens after closure, how a seller can extend a case where appropriate, and when source files, extracted content, search indexes, cached results and backups expire. Choose actual periods based on operational need and applicable obligations; this report does not invent a legal retention period for case files.

Do not create an unrestricted cross-client evidence search. A professional handling several sellers needs explicit client/case membership and a way to avoid copying one client's facts into another's response. A pseudonym or content hash is not by itself anonymization.

### Migration from the existing service

When this architecture is approved for implementation, update the actual processing, privacy copy, service terms, support procedures and recovery documentation together. Offer an explicit migration of selected existing cases; show which files and history will be uploaded and the benefits and limits of that choice. Preserve an export and test recovery before relying on the cloud as the primary continuity path. Existing encrypted backups must not silently become a server-readable case store.

The browser-only rule for identity and financial records can be revised for a justified task. Assess document categories individually: image-quality checks may remain local; a requested reconciliation may need a narrow financial excerpt. A dedicated protected flow with clear necessity and processing terms is the proposed route for that change. The founder's consent to revisit the architecture is not a reason to transmit every passport or bank statement to a general model.

The FTC recommends mapping data flows, limiting collection, controlling access and defining retention. ICO guidance calls for specific, granular choices when consent is the legal basis; it also says consent is not always the appropriate basis. Use those principles as design inputs, then assess the actual jurisdictions and service relationships. UK guidance is not a conclusion that AppealDeck may sell into the currently blocked UK market. [FTC business guidance](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business), [ICO consent guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/consent).

Google's indexed paid-service terms state that prompts and outputs are not used to improve its products; its abuse-monitoring documentation describes retention for enforcement, including a 55-day period. Paid access therefore does not mean zero retention or use exclusively for the seller's case. Check the actual service, features and project settings before publishing exact promises. [Google paid-service terms](https://ai.google.dev/gemini-api/terms?authuser=00), [Google abuse monitoring](https://ai.google.dev/gemini-api/docs/usage-policies?authuser=50&hl=en), [Google retention overview](https://ai.google.dev/gemini-api/docs/zdr?hl=en). These pages were retrieved through indexing; direct opens of the main terms and retention overview failed in this session.

The current registry also lists Groq as a text provider, but its terms fields are null. Its official documentation describes ordinary inference and exceptions for reliability/abuse processing, plus controls for zero data retention; retention-requiring features have separate behaviour. Verify the account settings and processing agreement before promising how a fallback behaves. Do not assume Google's terms cover another company. [Groq data documentation](https://console.groq.com/docs/your-data), [Groq service agreement](https://console.groq.com/docs/legal/services-agreement).

### Technical requirements for the proposed service

- Define explicit allowlists independently for device persistence, application-server payloads, stored cloud records, model requests, exports, logs and metrics. Schema acceptance alone is not permission to transmit a field.
- Enforce account and case access on the server; isolate professional clients and cases. Test identifiers belonging to another account and revoked access.
- Implement task-specific handling for sensitive documents and test it against misclassification. Any approved expansion must have a dedicated design; classifying a passport as an invoice must not become an undocumented bypass.
- Keep secrets, raw bank-account numbers and unrelated personal data out of general model context. Preview selected excerpts and review redactions against the destination's requirements.
- Treat text inside documents and replies as untrusted evidence. It must not change system instructions, trigger outbound actions or broaden access.
- Restrict signed file links, validate file type and size, handle malicious uploads, and record access without logging evidence bodies.
- Distinguish end-to-end encryption from encryption at rest. If a server can decrypt a case to run background analysis, do not claim only the seller can read that case.
- Define deletion of extracted text, indexes, caches and derived facts as well as source files. Revocation stops future optional use; it cannot retract a response already sent to Amazon.
- Version both permissions and model/provider policy. A new purpose or recipient needs review rather than silently inheriting earlier choices.

## 10. Evidence rules and model responsibilities

Maintain a small reviewed rule register. Each rule needs an owning source, marketplace, product scope, date checked, applicable period and anchor, uncertainty and examples where it does not apply. Preserve exact seller-specific instructions alongside policy defaults. Conflicting instructions should raise a clarification, not be silently merged.

Use deterministic code for arithmetic, duplicate handling, dates, required fields, permission boundaries and explicit status transitions. Use AI for proposing extraction, categorization, focused questions and wording. Require a source passage for extracted facts and seller confirmation where consequential. An AI confidence number does not replace an unreadable source.

The drafting context should contain only the facts necessary for this response, the applicable requirements, issue-specific positions, completed versus planned actions, relevant confirmed history, supporting references and unresolved limitations. It should not contain the whole vault by default.

Separate Amazon allegations from the seller's established facts. "Amazon alleges X" must not be rewritten to "we did X." Separate a seller's unsupported hypothesis about a cause from confirmed operational evidence. New facts require a source and confirmation, not an eloquent explanation.

Policy retrieval also needs a boundary: current reviewed rules can inform a case; random uploaded documents, forum posts or another client's successful wording cannot silently become authoritative instructions. A shorter response that answers the request can be more appropriate than an exhaustive dossier.

### Proposed analysis and review pipeline

Give the system distinct responsibilities with inspectable outputs. These are processing stages, not a requirement to create a separate AI agent or model call for every stage.

| Stage                 | Required output                                                                                            | Review condition                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Request analysis      | Every material allegation, requested record/action, affected identifier and deadline, with source passages | Seller can correct the interpretation; unsupported route stays uncertain.               |
| Case investigation    | Relevant facts, chronology, issue-specific positions, earlier promises and unresolved questions            | Claims retain their source and uncertainty; plausible hypotheses stay hypotheses.       |
| Evidence review       | Field observations, product/period mapping, inconsistencies and gaps                                       | A reader can inspect the cited passage; field completeness does not imply authenticity. |
| Response planning     | What each issue needs answered, what evidence supports it and what remains unresolved                      | The plan answers the actual form and does not force one template across routes.         |
| Drafting              | A concise response and actual supporting-record references                                                 | No new admission, factual assertion or completed action without support.                |
| Independent challenge | Material omissions, contradictions, unsupported assertions and wrong-route concerns                        | Reviewer checks the request and evidence, not just the fluency of the draft.            |
| Final packaging       | Form-ready content, correct evidence versions and seller review                                            | Every material change after review triggers the relevant checks again.                  |

Spend additional model context, processing time and human attention where evaluation demonstrates benefit. More tokens, a more expensive model or agreement between two similar prompts is not evidence of independent correctness. Compare review methods on the same representative cases, including OCR errors, partial uploads, subtle admissions and mixed allegations. Record model/prompt versions so regressions can be traced.

Where the seller authorizes it, the investigation stage should be able to examine relevant full earlier submissions and documents, rather than being permanently restricted to an attempt count and filenames. Give later drafting stages the resulting supported working record and selected passages. This permits deeper history analysis while keeping each transfer purposeful. Retrieval must not hide contradictory records merely because they are less semantically similar to the current question.

Use bounded retries and recoverable failures. Set operational time and cost budgets from measured case journeys; deeper analysis can run as a clearly identified background task. Explain when a result is preliminary, finished or requires seller input. If a model is unavailable, preserve the case and provide the useful deterministic work already possible. Do not silently substitute an unreviewed provider or call an incomplete check complete.

### Authorized imports should reduce repeated work

The optional read-only Amazon connection is approved in direction under C09 but deferred until a few sellers. Keep manual uploads in the first service; do not begin integration work or incur integration costs now. At the later milestone, evaluate actual costs, access and coverage. Amazon's Support API documents seller authorization and a Support role for case retrieval. Its contact-history endpoint describes available email messages and attachments, phone notes and chat events/transcripts; expired contacts do not include their full content. These capabilities support a later feasibility test, not a promise that every Account Health appeal appears there. [Amazon support-case retrieval](https://developer-docs.amazon/sp-api/lang-us/docs/retrieve-review-support-cases), [Amazon contact-history retrieval](https://developer-docs.amazon/sp-api/docs/retrieve-contact-history-support-case).

The account-status notification separately reports transitions between normal, at-risk and deactivated status. Its published payload does not contain the full enforcement notice or reason. Do not imply that connecting the account makes manual notice capture unnecessary. [Amazon account-status notification schema](https://developer-docs.amazon/sp-api/docs/notification-type-values).

Test access, role eligibility, actual appeal coverage, missing/expired content, marketplace association, revocation and provenance on an authorized test account before adding a product promise. Imported support status is not equivalent to an enforcement outcome: a resolved support case does not prove reinstatement. Manual capture remains necessary wherever the integration cannot supply the actual record. Email forwarding is another possible route, with its own abuse/privacy design and P-04 release requirement.

### Operating responsibilities

Assign responsibility for policy/source review, model evaluation, document-handling rules, incident response, user support and any professional referrals before launch of the expanded service. The founder can hold several responsibilities initially, but each needs a real process and capacity. Give support personnel the minimum scoped access needed and record access to a managed case.

Set response expectations from staffing and measured processing, then disclose them accurately. Do not invent an arbitrary supplier or Amazon turnaround time. Track stalled evidence tasks, processing failures and sellers who cannot finish the journey. These events should lead to a concrete recovery or support action under the selected permissions, not only a dashboard counter.

Treat policy changes and observed failures as maintenance work. Re-evaluate affected rules and sample cases, identify saved analyses that may be stale, and explain material corrections to affected sellers through an approved contact process. NIST's voluntary AI RMF recommends evaluations resembling deployment conditions, production monitoring, domain/user input and mechanisms to manage failures. It supports this operating discipline; it does not certify AppealDeck or establish an approval uplift. [NIST AI RMF core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/).

## 11. Testing reliability and evaluating the approval hypothesis

Software correctness and reinstatement results need different evaluation.

### Proposed acceptance scenarios

1. Same notice, one accepted earlier repeat: questions change to inspect earlier corrective work. A successfully disputed incident does not become an admitted repeat.
2. Three emails about one incident are not counted as three violations. Unknown history stays unknown.
3. Same case with irrelevant age, revenue or language changes: no invented change in approval odds or requirements.
4. Mixed allegations: the seller can accept one issue and dispute another without an admission leaking across them.
5. Two products: surplus invoices for A do not clear B. Packs and individual units cannot be added without a confirmed conversion.
6. Reissued invoice plus original: count the transaction once. Multiple partial shipments need explicit reconciliation.
7. A 180-day document eligibility window, a separate sales period and a submission deadline stay separate. Unknown anchor dates remain unresolved.
8. Supplier move, trading name, earlier order or delayed billing: ask for the explanation rather than conclude fraud.
9. Supplier cannot provide a record: offer a truthful acquisition or clarification path without generating a replacement invoice.
10. A disputed forgery allegation preserves the exact file and professional-review boundary without declaring the document proved false.
11. A draft SOP exists but no implementation happened: response cannot say staff were trained or controls are operating.
12. Explicit request to resubmit unchanged material: duplicate warnings do not prevent the requested action. A pending response is not called denied.
13. Out-of-order replies: the seller can associate each with the correct submission and correct an uncertain match.
14. Model adds a date, quantity, completed action or admission: reject the unsupported claim. Test plausible paraphrases, not just exact banned words.
15. Malicious instructions inside a PDF: no access change, data leakage or outbound action.
16. Cloud off, AI off, permission revoked, provider fallback or failed retry: captured network/storage requests match the disclosed choice.
17. Another account's case ID, file link or search result: access is denied with no data returned. Revoked links and deleted derived records cannot remain usable.
18. Seller exports the response: exact attachment versions and unresolved gaps match the confirmed case state.
19. Seller opts into managed storage for one existing case: only that selection migrates; another local case and its files do not upload.
20. Previously local prior wording is authorized for case analysis: the selected version reaches only the permitted stages/recipients; revoked research permission does not affect unrelated core service permission.
21. A new sensitive-document task is offered: its dedicated handling follows the selected scope; a category-label mistake cannot silently expand general AI access.
22. Import returns expired contacts or no Account Health appeal: explain missing coverage and ask for the actual notice; do not mark the history complete.
23. A background check finishes after the input file changes: mark the result stale and recheck the affected facts; do not attach its conclusion to the new file.
24. Service interruption or an unsupported model claim affects a case: recover the saved work, correct the output and provide the defined support path.

These are proposed tests. None were implemented or run in this research session.

### Evaluation before claiming improved outcomes

Build a consented evaluation set of complete journeys, including initial notices, requests, submissions, actual attachment versions, Amazon replies and known final status. Include rejected, pending, abandoned and specialist-routed cases so the dataset does not contain only selected successes. Treat reactivation of an ASIN, an account and release of funds as separate outcomes.

First compare the existing workflow with the proposed questions using de-identified paired cases and independent expert review. Measure missing requested items, unsupported factual claims, route mistakes, contradictions overlooked, irrelevant questions, time and completion. Use seller-disjoint test sets; variants of one case must not appear on both sides of an evaluation. Keep evaluation evidence distinct from material used to design prompts.

For a real pilot, compare case mix, marketplace, issue, prior rounds, evidence availability and follow-up time. Report all enrolled cases and each outcome category. An uncontrolled rise in observed approvals can reflect easier cases or more available evidence; it does not isolate a software effect. Do not deliberately expose sellers to fabricated or inferior responses for an experiment.

Set reliability thresholds before reviewing results. Any unsupported admission, fabricated document claim, cross-account exposure or undisclosed transfer in the fixed critical evaluation set should prevent enabling the new workflow until corrected. Passing that set demonstrates bounded software behaviour, not guaranteed real-world approval.

Learning from outcomes initially means improving rules, questions and evaluation. Fine-tuning or training on raw cases would need separate permission, suitable data and proof of benefit. No reviewed source establishes that AppealDeck currently has an outcome-trained model.

### Measure the premium experience separately

Collect feedback at meaningful points: after initial understanding, while collecting evidence, after preparing a response, and after a known outcome. Include people who stop partway through; feedback only from successful finishers creates a distorted view. GOV.UK's guidance supports feedback throughout a service and investigation of dropouts. Its completion-rate guidance distinguishes finishing the defined transaction from starting it. These are useful measurement principles, not prescribed SaaS targets. [GOV.UK satisfaction measurement](https://www.gov.uk/service-manual/measuring-success/measuring-user-satisfaction), [GOV.UK completion measurement](https://www.gov.uk/service-manual/measuring-success/measuring-completion-rate).

| Dimension               | Proposed measures                                                                                                   | Interpretation                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Understanding           | Seller can identify the allegation, requested action, unresolved point and next step                                | Measures comprehension, not agreement with the software.                                           |
| Effort                  | Repeated entry, questions needing rework, active task time and abandonment by stage                                 | More thorough cases can take longer; distinguish productive investigation from avoidable friction. |
| Evidence assistance     | Missing-record requests sent, genuine records obtained and requirements actually resolved                           | Sending an email template is an intermediate step, not a recovered account.                        |
| Response quality        | Material omissions, unsupported claims/admissions, contradictions and wrong-route advice found by review            | Use severity and case context; fluency alone is insufficient.                                      |
| Operational reliability | Save/recovery failures, stale results, processing completion, latency and support resolution                        | Measure against the service expectations actually offered.                                         |
| Satisfaction and value  | Clarity, confidence in the reviewed facts, usefulness, perceived value, complaints and refunds                      | Seller confidence must be checked against objective quality so convincing errors are not rewarded. |
| Amazon outcomes         | Explicit acceptance/request for more information, listing/account result, funds result and elapsed observation time | Keep separate outcomes and full denominators; pending and unknown remain visible.                  |

Choose pilot targets before evaluating the pilot, using the existing workflow as a baseline and domain review to set appropriate thresholds. Report whether improved depth also increases burden or delay. Approval and satisfaction can diverge: a failed appeal may still have been handled competently, while an apparently successful case does not excuse invented facts or hidden data use. Review both the case result and the quality of the service delivered.

## 12. Delivery plan for the proposed service

Build a coherent service in increments that each complete a useful case journey. Decide the target architecture early, then select an initial supported case family using actual seller demand, accessible policy requirements and expert review. Do not reduce the ambition to a few additional fields, or attempt every category before any complete journey is evaluated.

| Phase                                     | Deliverable                                                                                                                                                          | Evidence required before the next expansion                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Service and architecture decisions     | Agreed target journey; selected first case family; decisions to retain/replace; data and permission map; managed/local storage model; actual support scope           | Walk through realistic cases with practitioners and sellers; verify current policy/forms and demonstrate that the proposed data can support the decisions. |
| B. Connected case foundation              | Versioned requests, facts, evidence, issue positions, submissions/replies and tasks; approved managed storage and migration where selected; access/recovery controls | Prove case isolation, permitted transfers, save/recovery, version integrity and migration without silent uploads.                                          |
| C. Complete first case journey            | Adaptive intake, product-specific evidence checks, missing-record assistance, contextual response planning, review, packaging and reply follow-up                    | Run the realistic acceptance scenarios and expert review; resolve critical defects and identify remaining service limits.                                  |
| D. Consented pilot with operating support | Actual sellers complete the selected journey; defined support and incident response operate; service and outcome metrics are collected appropriately                 | Compare quality, effort and experience with the baseline; preserve unsuccessful, pending and abandoned cases in the analysis.                              |
| E. Targeted depth and integrations        | Add cases, protected document tasks, authorized imports or expert work where observed gaps justify them                                                              | Verify each capability and show benefit; revise disclosures, permissions, support and tests with it.                                                       |
| F. Ongoing improvement                    | Versioned policy/rule updates, regression cases, outcome analysis and measured model changes                                                                         | Monitor drift, investigate failures and re-evaluate claims against current evidence.                                                                       |

The cloud design is an early foundation decision, not a final optional embellishment. Local-only improvements can still ship independently where they are useful after implementation is commissioned. C09's read-only integration track is deferred until a few sellers and later founder confirmation of readiness; it must not start early or become a prerequisite for the first evaluated journey. Human-review service details retain their separate scope and parked boundaries.

For a proposed change, use this decision record: seller problem; current behaviour; proposed replacement; evidence and uncertainty; relevant data; permission/legal basis; access and retention; implementation dependencies; acceptance test; owner; rollback or correction plan. Update the owning product rules, schemas, prompts, privacy copy and operating procedures together when the change is actually implemented.

The existing code is an asset to reuse where sound, not a constraint defining the ambition. Identify what can be extended and what needs migration. A previous shortcut should not survive solely because it is already implemented; a replacement should not proceed solely because it is new.

R-18 remains the existing account-history work record; this blueprint covers the broader proposed service. Recommendations may include changing earlier parked decisions, but this document update does not release P-03 expert sharing, P-04 email forwarding, P-06 automatic backup, P-07 multiple reminders, P-12 taxonomy changes or P-13 public outcomes. It does not add Seller Central access, send external messages, deploy anything or change pricing. Those implementation authorizations must be resolved in their owning records when the relevant work is commissioned.

## 13. Verification still needed before product rules are enabled

- Authenticated review of current target-market help pages and the actual response forms, including invoice periods, permitted highlighting/redaction and document-dispute options.
- Case-specific IP retraction instructions; no fixed address or universal rights-holder letter format was verified here.
- Category-specific safety requirements and current provider eligibility. Toys guidance is not a universal product-safety rule.
- Review of the new question set by experienced appeal practitioners using realistic, de-identified cases. Published marketing pages do not reveal the full private intake process.
- Account-level provider settings and current processing agreements for each allowed recipient, including fallback and retention features. Existing configuration was not inspected.
- Actual server-readable storage design, retention periods, deletion/backups, support access and applicable legal basis. The founder's intention to request permission does not supply these implementation details.
- A representative outcomes dataset. The size of the approval benefit, relative importance of history, reviewer timing and supposed firm preference remain unknown.
- Realistic service testing of the expanded design: evidence-acquisition tasks, saved continuity, response review, submission records, reply handling and support recovery. A unit-test pass alone cannot validate the whole proposed experience.
- Initial supported case family, support capacity and pilot thresholds, selected from observed demand and expert review rather than invented conversion or success targets.
- Integration feasibility for actual Account Health communications, not merely the existence of a support endpoint. Verify authorization, available records and the handling of gaps on a permitted test account.

The recommended next implementation commission is Phase A followed by a complete, evaluated case journey on the chosen architecture. Its purpose is to establish a dependable service capable of deeper case work, with measurable seller benefit. Earlier decisions should be retained, amended or replaced according to that objective and the evidence above.

## 14. Research basis for the broader direction

All entries below were checked on 9 November 2026. External sources establish the stated principles or technical capabilities; the particular AppealDeck design and delivery plan are recommendations. No source below establishes the effectiveness of the whole proposed service in obtaining Amazon approval.

| Source                                                                                                                                                                                                                         | Access and scope                                                                                  | Use in this revision                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [GOV.UK whole-problem service standard](https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem)                                                                                                      | Primary guidance, full page read; public-service design                                           | Defines the whole-journey approach and useful incremental delivery. It is not a requirement imposed on AppealDeck.                              |
| [GOV.UK structuring forms](https://www.gov.uk/service-manual/design/form-structure)                                                                                                                                            | Primary guidance, full relevant body read                                                         | Supports a question protocol, relevance and branching.                                                                                          |
| [W3C multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/)                                                                                                                                                     | Primary accessibility guidance, relevant body read                                                | Supports logical stages, optional steps and reduced time pressure; does not prescribe a specific interface.                                     |
| [GOV.UK satisfaction measurement](https://www.gov.uk/service-manual/measuring-success/measuring-user-satisfaction) and [completion measurement](https://www.gov.uk/service-manual/measuring-success/measuring-completion-rate) | Primary guidance; satisfaction passages read directly, completion page retrieved                  | Supports evaluating experience and completion separately from an external decision. No numerical SaaS target is adopted from it.                |
| [NIST AI RMF core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)                                                                                                                                                    | Primary voluntary framework, relevant Measure/Manage sections read; RMF 1.0 update is in progress | Supports representative evaluation, deployment-like testing, monitoring, expert/user input and failure management.                              |
| [European Commission legal grounds](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en)                                                        | Primary jurisdiction-specific explanation, relevant body read                                     | Distinguishes lawful grounds for processing. It does not determine AppealDeck's particular obligations.                                         |
| [ICO contractual processing](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/contract/?search=marketing)                                                              | Primary guidance retrieved through indexing; direct open returned 403                             | Explains the limits of necessity for contract. Verify applicability and current wording before operational reliance.                            |
| [Supabase bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [access controls](https://supabase.com/docs/guides/storage/security/access-control)                                          | Primary technical documentation, relevant access/bypass passages read                             | Establishes available private-storage controls and the privileged-key limitation, not the security of an unbuilt implementation.                |
| [Amazon support-case retrieval](https://developer-docs.amazon/sp-api/lang-us/docs/retrieve-review-support-cases)                                                                                                               | Primary technical documentation, full tutorial read                                               | Confirms seller authorization/Support-role prerequisites and case metadata retrieval.                                                           |
| [Amazon contact-history retrieval](https://developer-docs.amazon/sp-api/docs/retrieve-contact-history-support-case)                                                                                                            | Primary technical documentation, full tutorial read                                               | Confirms documented available email, phone and chat content and expired-contact limitations. Actual Account Health coverage remains unverified. |
| [Amazon account-status notifications](https://developer-docs.amazon/sp-api/docs/notification-type-values)                                                                                                                      | Primary technical documentation, account-status section and payload read                          | Distinguishes a status transition event from the full notice and its explanation.                                                               |

Amazon evidence for appeal and document practices, practitioner descriptions and provider/privacy sources remain cited with their substantive claims in Sections 1, 2 and 9. Earlier Seller Central access limits remain in force. The code findings in Section 3 are a focused snapshot; implementing the new service requires rechecking the owning sources and validating the revised behaviour.

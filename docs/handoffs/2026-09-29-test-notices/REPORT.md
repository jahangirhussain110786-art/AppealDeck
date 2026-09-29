# Researched test notices: does AppealDeck work beyond its own sample? (29 Sep 2026)

## In plain words

- **The question:** the founder asked whether the tool really works on other notices, or only on the sample.
- **What I did:**
  - researched how Amazon's real notices are worded;
  - wrote 13 realistic test notices, each a different kind of case with different requirements;
  - ran every one through the real app: the decode page, the new case, every tab, and an Amazon reply.
- **The first answer was: partly.** 5 of the 12 notices came out right. 7 went wrong, and some of those were serious:
  - The **most common case there is**, an authenticity complaint answered with supplier invoices, was read as "Not clear yet", with **no documents listed**.
  - Documents Amazon **listed on their own lines** ("please send us:" followed by a list) were **never picked up**. That is the usual way Amazon writes it.
  - A product-safety notice's **deadline was missed**: "provide the following by 20 October 2026".
  - An appeal form with **numbered questions** got one essay box instead of one box per question.
  - A **genuine trademark notice was flagged as a possible scam**, because it contains the rights owner's email address, as every real one does.
  - A short **falsified-documents notice was rejected** as "not an Amazon notice", so the professional-help route could not be reached.
  - **Amazon's refusal** of an appeal was read as "asking for documents before it decides", when Amazon had already said no.
- **All of these are fixed**, and 13 permanent tests stop them coming back. **Now all 12 notices and the reply come out right.** A few smaller gaps and one decision for you are listed at the end.

## How the notices were made

- Each notice is **synthetic**: a made-up seller, ASINs, dates and rights owner.
- Each is **built from Amazon's own wording**, as quoted by sellers on Amazon's Seller Forums, by appeal consultants, and in this project's 19 Sep 2026 research.
- Nothing is a real seller's notice.
- The engine was **not** written with these notices in hand. The repo's own 48 fixtures were, so passing those proves little. These 13 were written after the engine.
- The texts, with the expected answer for each, are in [notices.json](notices.json).

| #   | Notice                                                                   | Built from                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| t01 | Authenticity complaint, Section 3 deactivation (UK)                      | Seller Forums UK: "deactivated … in accordance with Section 3", "Copies of invoices or receipts from your supplier issued in the last 365 days"; US threads listing the invoice fields |
| t02 | Order Defect Rate deactivation                                           | Consultant-quoted ODR email: "removed your selling privileges … ODR does not meet … less than 1%"                                                                                      |
| t03 | Trademark complaint from a rights owner                                  | Forum-quoted: "received a notice from a rights owner …", "We may only accept retractions that the rights owner submits to us directly"                                                 |
| t04 | Related account                                                          | Forum-quoted: "related to another account that may not be used to sell on our site", "we do not provide details on our investigation methods"                                          |
| t05 | Identity verification by video call                                      | Forum-quoted: "we do not have sufficient information … complete your identity verification"                                                                                            |
| t06 | Funds withheld, disbursement request                                     | Recorded Amazon wording: "disbursements were temporarily disabled for a period of 90 days … Funds Withholding Policy", "disbursement-appeals@amazon.com"                               |
| t07 | Product safety complaint (test report, certificate, images, stated date) | Product-safety document requests described by compliance guides and forum threads                                                                                                      |
| t08 | Restricted category, approval needed                                     | 19 Sep research: "restricted to qualified sellers", "requires approval to sell"                                                                                                        |
| t09 | Documents judged falsified (severity-gated)                              | D6 gating; consultant descriptions of falsified-invoice deactivations                                                                                                                  |
| t10 | Appeal form with three numbered questions                                | Recorded: appeals "can include submitting a questionnaire, acknowledging a violation … or providing supporting documents"                                                              |
| t11 | Listing policy violation with the email's own date and a 30-day window   | Tests the date logic                                                                                                                                                                   |
| t12 | Fake "Amazon" email: fee, password, WhatsApp, lookalike link             | Seller Forums phishing reports (lookalike domains, "reactivation fees", requests for login or bank details)                                                                            |
| t13 | Amazon's refusal of a first appeal, pasted as a reply                    | Consultant write-ups: "does not address our concerns", "does not identify the root cause"                                                                                              |

## Results: before and after

All 12 notices plus the reply were run through the app. Most rows were run against a local production build. The two headline fixes in the "after" column (the professional-help headline and the warning-signs headline) came after the last full run, so they were checked separately: the professional-help one by the new browser test, the warning-signs one by the updated scam test.

| #   | Before the fixes                                                                            | After                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| t01 | ✗ "Not clear yet"; **no documents**                                                         | ✓ Inauthentic · Plan of Action · Supplier invoice, **named in your notice**                                                |
| t02 | ✓ Performance metrics · Plan of Action · sales record (added by us)                         | ✓ unchanged                                                                                                                |
| t03 | ✗ "Not yet clear"; **flagged as a possible scam**                                           | ✓ Intellectual property · supporting documents · invoice and authorization letter, named · no scam flag                    |
| t04 | ✓ Related account · supporting documents                                                    | ✓ unchanged (see gap 3)                                                                                                    |
| t05 | ✗ headline "Check what Amazon is asking for"; overview "Clarify the requested response"     | ✓ headline "Amazon wants to verify your identity" · overview "Get ready to verify your identity", linking to the checklist |
| t06 | ✗ "Not yet clear"; the bank statement shown as added by us                                  | ✓ Funds · supporting documents · bank record, **named in your notice**                                                     |
| t07 | ✗ deadline missed; the test report shown as added by us                                     | ✓ Product safety · **due 20 Oct 2026** · test report or certificate, named                                                 |
| t08 | ✓ Restricted product · supporting documents · supplier invoice, named                       | ✓ unchanged                                                                                                                |
| t09 | ✗ **refused as "not an Amazon notice"**                                                     | ✓ accepted · headline "This case needs professional help" · the case routes to professional help                           |
| t10 | ✗ "Not yet clear"; one essay box                                                            | ✓ Questionnaire · **one box per question**, plus "Anything else (optional)"                                                |
| t11 | ✓ Listing · Plan of Action · **due 3 Oct 2026**, counted from the email's own date of 3 Sep | ✓ unchanged                                                                                                                |
| t12 | ✓ all 5 warning signs raised                                                                | ✓ and headed "This message has warning signs", **with the warning's title now readable**                                   |
| t13 | ✗ read as "asking for documents before it decides"; the reply "does not name any records"   | ✓ "Amazon did not reinstate the account this time …" · supplier invoice "still on your list"                               |

## What was fixed

All of these are in `src/core` unless noted. Each fix has a test in `src/core/researchedNotices.test.ts`. The notice-reading and phishing fixes are also covered in e2e.

1. **Documents listed under a request** (`workspace.ts`, `requestSentences`). A list item now counts as requested when the line introducing it asks for something and ends with a colon, e.g. "please send us:" or "provide the following:". A negated or past-tense lead-in does not count, for example "You do not need to send:".
2. **The authenticity complaint** (`noticeParser.ts`). "complaints from customers about the authenticity of…" now matches. A short gap is allowed, and the complaint must still be about authenticity.
3. **A stated date after "provide … by"** (`noticeDate.ts`). "provide" and "send" now count as responding, so "provide the following by 20 October 2026" is the deadline.
4. **Questionnaires** (`responseType.ts`). "answer each of the following questions" and "answer the questions below" now count.
5. **Amazon's conditional wording** (`responseType.ts`). "If you have a letter of authorization … or an invoice …, you can submit an appeal" is a documents response.
6. **A rule is not a request** (`responseType.ts`). "Providing falsified documents is a serious violation" no longer reads as "send documents".
7. **"Send us … listed in our previous message" is a current request** (`responseType.ts`, `describesThePast`). The word "previous" there says where the ASINs are; it is not history.
8. **Bank statements** (`workspace.ts`, `responseType.ts`). They are recognised as a named document.
9. **The scam check and rights-owner emails** (`noticeAuthenticity.ts`). An address labelled as the rights owner's or complainant's contact is no longer a warning sign. An unlabelled non-Amazon address, or a "From:" line, still is; a test checks this.
10. **The server's "is this a notice?" check** (`src/app/api/decode/route.ts` and `src/lib/noticeLikeness.ts`). It now uses the decode page's own marker list instead of a narrower copy, and "policies" counts as well as "policy".
11. **Amazon's refusals** (`responseAnalyzer.ts`). A refusal outranks a document request, and the documents it asks for are still reported. "does not address our concerns" and "does not identify the root cause" were added.
12. **Screens** (`src/app/decode/DecodeClient.tsx`, `src/components/workspace/CaseWorkspace.tsx`, `src/content/*`):
    - **Decode headlines.** A gated case is headed "This case needs professional help", a verification notice "Amazon wants to verify your identity", and a message with warning signs "This message has warning signs".
    - **The scam and professional-help warnings sit on a solid card.** The results column rises over the dark header, and the warning's see-through background had made its title dark-on-navy and unreadable in light mode. The class helper had also silently dropped a `bg-card` passed to it, which is why the fix is a wrapper.
    - **The verification case's overview** says what the case is and links to its checklist.
    - **The questionnaire's "Anything else" box** has its own example.

## Still open

Not fixed in this pass, most important first.

1. **Your decision: sellers outside Amazon US hit a dead end.** If the store is set to anything but Amazon US, the case stops with "This workspace currently supports English-language Amazon US requests" (`routeWorkspace`). The Pass is priced flat and sold worldwide, but a UK seller who answers honestly cannot go on. I did not make the tool detect amazon.co.uk automatically, because that would push UK sellers into the same dead end. The choices are:
   - open the workspace to other English-language stores;
   - say "US only" before purchase;
   - or leave it as it is.
2. **Verification asks for two documents and we raise one.** The video-call notice asks for a government ID _and_ proof of address (a bank statement or utility bill). Only the ID is raised.
3. **Related account.** The notice names "a business license or utility bill" and "evidence that any related account issues have been resolved". Neither is raised as named; we add an identity record instead.
4. **Product safety adds a "Disposal or recall record"** on a case that is a customer complaint with no recall. The evidence list marks it as required for every product-safety case. This is a content judgement for you or an appeal writer.
5. **Product and label images** (t07, item 3) are not raised, because there is no document type for product photos yet.
6. **Wording:** t07's date shows as "Appeal by 20 Oct 2026", although the notice asks for documents by then. "Respond by" would fit better.

## Proof

- `src/core/researchedNotices.test.ts`: 13 tests reading [notices.json](notices.json).
- A new e2e test in `e2e/marketing.spec.ts`: the falsified-documents notice is accepted and headed "This case needs professional help".
- The scam e2e test now also checks the headline.
- **Gates:**
  - typecheck, lint, lint:copy, reachability, sources and format all 0;
  - vitest 1183 / 1183 in 96 files;
  - build 0;
  - Playwright chromium, run as CI with signed-in tests: **125 passed, 0 failed**.
  - A first full run had 2 timeouts while opening and closing pages, on a slow run (8.6 min instead of 3.6). Both tests passed alone, and the full rerun was clean.

## Sources

- [Seller Forums UK: Section 3 deactivation, invoices "issued in the last 365 days"](https://sellercentral.amazon.co.uk/seller-forums/discussions/t/2e0505aaff7736eb74b7a6ec3b0573e8)
- [Seller Forums: product authenticity complaint, invoice fields Amazon requires](https://sellercentral.amazon.com/seller-forums/discussions/t/79ee39fd-8f35-4902-88e0-2a1e8fe26dbe)
- [Seller Forums: invoices under 365 days old](https://sellercentral.amazon.com/seller-forums/discussions/t/710e79202eb62baa1334c32b349a0e00)
- [ODR deactivation email, as quoted in search results](https://www.scribd.com/document/639615371/Untitled)
- [Seller Forums: "we removed some of your listings because we received a report from a rights owner"](https://sellercentral.amazon.com/seller-forums/discussions/t/7aa0e10e4a80ea3e4aa665c42dfab509)
- [Seller Forums: "related to a different account that may not be used to sell on our site"](https://sellercentral.amazon.com/seller-forums/discussions/t/c417eff910649b95e889880c431849c5)
- [Seller Forums: identity verification by video call](https://sellercentral.amazon.com/seller-forums/discussions/t/2f1610a2-0d75-4a86-9235-56339714d6f1)
- [Seller Forums: funds disbursement after 90 days](https://sellercentral.amazon.com/seller-forums/discussions/t/d2dc0b05-5d20-41ea-aca7-383cc0023da7)
- [Seller Forums: product safety compliance complaint](https://sellercentral.amazon.com/seller-forums/discussions/t/2329985b-ca2f-4354-aa5e-231f618cb73c)
- [Compliance Gate: Amazon product compliance document requests](https://www.compliancegate.com/amazon-product-compliance-document-requests-removals/)
- [Seller Forums: Notification of Restricted Products Removal](https://sellercentral.amazon.com/seller-forums/discussions/t/c6862cb7a18745fc246ea68f4797c737)
- [DAM Law Firm: appeal denied, what the denial wording means](https://damlawfirm.com/blog/amazon-appeal-denied-seller-performance-not-responding/)
- [Seller Forums: phishing email regarding verifying identity](https://sellercentral.amazon.com/seller-forums/discussions/t/96192888-30db-4d8b-b45b-d1db8a2c8f2e)
- [Riverbend Consulting: Amazon seller scams to look out for](https://riverbendconsulting.com/blog/amazon-seller-scams/)
- Project research, 19 Sep 2026: `docs/handoffs/2026-09-19-second-opinion-salvage/salvage-research_amazon-mechanics.md`

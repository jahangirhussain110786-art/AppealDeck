# Seller walk-through, 19 Oct 2026

Three invented companies, each with an Amazon-style notice and documents, run through the real app as a signed-in seller (dev account, a Pass per case, the free-tier AI, a production build on port 3100). Scripts: `make-docs.cjs` (documents), `run-case.cjs` (the walk), notices and the refusal reply as `.txt` files here. `out/` (screenshots and page text) is local only.

| Case | Company | Notice | Documents |
| --- | --- | --- | --- |
| A | Ridgeline Outdoor Supply LLC (tents) | Inauthentic-item complaint, two ASINs, 17-day window | Supplier invoice, brand letter, and a stale 2025 invoice |
| B | Pinecrest Pet Supply Inc. | Performance deactivation (late shipment, cancel, tracking), funds held 90 days | None needed; Amazon's later refusal asks for carrier scan records |
| C | Harbor & Pine Kitchenware | Trademark complaint with a retraction route and a Plan of Action route | Distributor invoice, brand authorization letter |

## What worked

- Decode: right problem, right reply-by date (A 31 Oct, C 26 Oct), scam check silent on all three.
- The AI document reading found 4 of 8 invoice checks on A and the right facts on C. The stale 2025 invoice was caught as outside 365 days and left out of the invoice-against-units sum.
- The AI-written Plan of Action used only the seller's facts and dates, listed attached files, kept "unfinished" honest, and the writing check flagged a future promise ("we will not run promotions") in B.
- Refusal round (B): Amazon's sentence quoted back, earlier work kept, the next round starts from the reply.

## Defects found and fixed (each with a test)

1. A developer note, "LEGACY parse pattern", was shown to the seller as the deadline label. Now plain words; stored cases are rewritten on load.
2. An authenticity notice that said listings were "removed" showed "2 issues" and asked for a "listing correction record". A removal that follows another complaint is no longer a second issue.
3. "A letter from the brand confirming the distributor is authorized" (in the notice) raised no record. It now raises the authorization letter.
4. The AI told Amazon "Sales or performance record is still being obtained" about a record only we had inferred. The AI now sees only records Amazon asked for or the seller acted on.
5. The AI drafting turned "most likely because they did not know" into a flat statement. The wording lock now treats a dropped or added hedge as a change.
6. A deactivation notice saying funds are held for 90 days showed no "Your money" line ("can no longer" was read as a possibility).
7. Amazon's refusal asking for "shipping and carrier scan records" raised nothing ("we need to see" was not read as a request). Both fixed.
8. A missing ASIN on an invoice was shown as "Not found" although the product was on it by name. Now "Not checked", with the same hint as elsewhere.
9. An awkward line in the reply guidance reworded.

## Found, not changed (your call)

- **The free on-device reading** found only 1 of 8 checks on a normal invoice whose supplier sits in the header with no "From" label. It says "Not checked" honestly; the Pass's AI reading handles it. A letterhead guess was left out on purpose: earlier review rounds removed several false positives of that kind.
- **Answer examples** under "What went wrong?" are the same returns example for every Plan of Action (A's authenticity case and B's performance case included). Per-kind examples exist for document answers only.
- **A performance case** is held at "working draft, not ready" until a "Sales or performance record" (inferred by us, not asked by Amazon) is dealt with. The wording to Amazon no longer mentions it, but the readiness block still shows it.
- **A trademark notice** that offers "ask the rights owner to retract" as the first route: decode and the case only talk about a Plan of Action. The retraction route (with the rights owner's address and Amazon's retraction address) is not offered anywhere.
- Small: "No invoice has a quantity we could read yet" appears when the only invoice is outside the window (it was read, then excluded).
- **The test site's address** `appealdeck.vercel.app` stopped resolving; settings now point to `appealdeck-project.vercel.app`. Supabase's redirect list and Paddle's approved domain still need the new address.

## Not tested

Mobile layout and the live Paddle checkout. The Gemini free tier answered every call, using the fallback model for some.

# Round 2: three more kinds of notice

| Case | Company | Notice | Documents |
| --- | --- | --- | --- |
| D | Northwind Kids Co. (play tents) | Children's product safety request, date stated | Lab test report, children's product certificate, label photo |
| E | Cedar Lane Candles LLC | Account blocked as related to a removed account | Former partner's statement, dissolution papers, utility bill, photo ID |
| F | Maple & Birch Textiles LLC | Funds held after deactivation; email Amazon to ask | Bank statement, photo ID |

## Defects found and fixed (each with a test)

1. **D was decoded as "Inauthentic item complaint".** "If we cannot verify the documents, the listing will remain removed" was read as a finding. Now a warning is not a finding; D reads as product safety, and no supplier invoice is asked for.
2. **E raised no documents from the notice.** "...no longer connected to you" made the whole sentence count as "you no longer need to send". Now only "no longer needed/required" does. The proof of address, ID and account-closure records are raised.
3. **E was sent to a "verification checklist, nothing to draft".** One mention of a government ID made it a verification request, so the explanation Amazon asked for had nowhere to be written. An ID listed inside another kind of appeal no longer does that.
4. **F's "government-issued photo ID" was not recognised** as the notice's own request (shown as "we added this").
5. **F told the seller documents go in Seller Central, not by email**, when the notice says to email Amazon. The case now names the address the notice gives.
6. **The AI wrote "The Requested identity record (file.jpg) is attached"**, our filing word, into the letter. It now names documents the way a person would ("my photo ID"), file name in brackets.
7. **Bank and address PDFs said "we check identity documents"** when they could not be checked. The message now says what is true.
8. **Test report checks** asked nothing about the report date or which model or batch it tested; both added.
9. The related-account hint now lists the three things Amazon asks for.

## Found, not changed

- A children's product certificate and a lab report share one card ("Test report or compliance certificate"), so one list line covers two documents.
- A proof-of-address or bank-statement PDF cannot be checked at all (by design: those are never read). Only photos get a picture check.
- "Your money" says funds can be asked for about 60 days after deactivation; a notice that says the 90-day review has ended contradicts it (hedged, but it reads oddly).
- "Your business details: we compare them with your invoices" shows on cases that have no invoice.
- The free-tier main model was over its daily quota most of the day; the fallback model answered some calls and returned a busy error on others. When both failed, the case produced a plain draft from the seller's own words and said so.

# Round 3: restricted product, review policy, identity verification

| Case | Company | Notice | Documents |
| --- | --- | --- | --- |
| G | Alder & Moss Wellness LLC (supplements) | Restricted category: apply for approval within 30 days | Certificate of Analysis, cGMP certificate, label, supplier invoice |
| H | Quickstep Footwear | Review-incentive policy removal, Plan of Action within 14 days | Written procedure |
| I | Tidewater Pottery Studio LLC | INFORM Act identity verification, video call within 7 days | Photo ID, bank statement, utility bill |

## Defects found and fixed (each with a test)

1. **H was decoded as a listing problem.** "...removed your selling privileges for ASIN B0..." beat the real cause (a review incentive). A removal under a named cause no longer outranks it. The same rule now decides how many issues a notice raises.
2. **H was asked for an order report and a "listing correction record"** that Amazon never mentioned for a review policy. Neither is raised for a review or incentive notice.
3. **G was asked for a "listing correction record"** (proof the listing is closed) although the notice invites the seller to apply for approval. Not raised for approval requests.
4. **G's Certificate of Analysis and cGMP certificate were not recognised** as requested records. They now are.
5. **I had no clock.** "Schedule a video call ... within 7 days" was not read as a deadline because "schedule" was not a seller action. It now counts down to 24 Oct.
6. **A supplier invoice with no website printed showed "Not found"** (and "1 not found" in the summary) although it printed a phone number and an email. Now "not checked", with the reason.

## Found, not changed

- A COA is checked against test-report questions ("the standard it was tested against") and a supplement label against "model number readable"; both give a "Not found" that does not fit. Fields would need to come from the notice's own list.
- The cGMP certificate shares one card with the COA (one card per kind of record).
- A label image that is a flat graphic, not a photo of the packaged product, is marked "product itself not found". That is true of my test file, and a real photo would pass.

# Round 4: fourteen more notices and replies, probed, then the risky ones run as a seller

`more-notices.json` holds them (FBA inbound, tax information, account-health warning, two issues in one notice, a questionnaire, falsified documents, selling limit, a phishing message, used-sold-as-new, A-to-z claims, a German notice, and four Amazon replies: reinstated, final, asks for documents, vague refusal). `run-notice.cjs` pastes one into the decoder and starts the case.

## Defects found and fixed (each with a test)

1. **A reply that asked for documents was refused as "not an Amazon notice".** It said "Seller Performance Team", never "Amazon", and one marker is not enough. Team signatures and "your selling account" now count. It reads as a document request ("send a copy of the invoice" was also not understood).
2. **"We reviewed the information you sent and could not reinstate" was decoded as a new notice** ("Start my case") instead of a refusal reply. Now a reply.
3. **A notice with two issues showed one.** An authenticity and order-defect notice said only "Inauthentic item complaint" on the decode page and the case's first screen. Both now say "Also in this notice: Account performance metrics. A response has to answer each."
4. **A-to-z claim-rate notice was decoded as a listing problem**, and **an FBA inbound notice asked for an order export**. Fixed.
5. **A phishing message offered "Start my case — free"** beside "this message has warning signs". Hidden when the message fits no known case and has warning signs.
6. **The falsified-documents screen said "Severity-gated under D6"**, an internal code, to a seller. Now plain words.
7. **Every questionnaire box showed the same late-shipment example**, even under "Who is the beneficial owner?". Questions about the business model, other accounts, inventory source and ownership get a hint and example that fit; any other question gets the general hint and no example.

## Decided before: left alone on purpose

- **Tax information and selling-limit notices stay unplaced** (parked item R-8, 9 Oct 2026). I tried placing tax notices and undid it when an existing test showed it was deliberate. They show "we could not place this" with the deadline.
- **A German notice** is stopped with "AppealDeck reads English notices" and how to switch the account language. Fine.

## Worked as intended

Falsified-documents routed to qualified help with no drafting, the account-health warning read as "a warning, not a suspension", phishing flagged on four counts, reinstated and final-decision replies recognised, the questionnaire given one box per question, a 10-day window counted to "today" on the right day.

# Round 5: whole cases, round after round

The earlier rounds tested one screen at a time. These ran three invented cases from the first notice to the outcome, in the real app, as a seller would: `journey-A.cjs`, `journey-B.cjs`, `journey-C.cjs`.

- **A, Ridgeline Outdoor Supply (authenticity):** round 1 with one invoice, the brand letter declared not obtainable. Amazon asks for the manufacturer's invoice and the brand letter. Round 2 adds both, resubmits, the pack is downloaded, Amazon reinstates, the dashboard asks for the outcome.
- **B, Pinecrest Pet Supply (performance):** a Plan of Action; Amazon refuses and asks for carrier records; the seller first resubmits with nothing changed, then revises with the records; Amazon's final decision.
- **C, Redfern Kitchen Supply (questionnaire):** four answers, Amazon faults answer 4, the seller revises that one.

## Defects found and fixed (each with a test)

1. **A refused questionnaire became a dead end.** Round 2 said "We cannot prepare a response for this kind of notice here" and the four answers were not shown, so answer 4 could not be revised. It now stays a questionnaire with its questions and earlier answers.
2. **A request for a new invoice was treated as the old one.** Amazon asked for "the invoice from the manufacturer that Summit Peak bought from"; the case said "asked for again, your file stays linked", inviting the same invoice again. It is now a separate record, "Invoice from the supplier's own supplier", and the attached invoice is kept as reviewed.
3. **"2 of 2 attached" when one document was declared unobtainable.** It now says "1 of 2 attached. Not obtainable, and stated as missing in the response: Authorization letter".
4. **The "cannot obtain" choices for a brand letter talked about a "retraction"** and a "rights owner". Worded for the record asked for.
5. **Adding what Amazon asked for was called "almost word for word".** Adding weekly figures to a root cause, or changing one answer of four, left "Same text as a previous attempt? Not yet" and kept "root cause missing" open. New facts (a date, number or name the last response did not carry) now count as a change.
6. **A thin questionnaire answer passed in silence.** "The owner is the founder" to "Who is the beneficial owner?" now gets a one-line reminder; so do the business-model, other-accounts and inventory-source questions.
7. **After a final decision the dashboard said "Read what it changes".** It now says the decision is final and to record the outcome.
8. **Round two asked "Have you already replied to this notice?"** although a response was recorded here. Hidden once one is.

## Worked as intended, now checked end to end

An unchanged resubmission is caught ("the same text, word for word"); "Nothing has changed since your last response" appears; the change report lists new sentences and added documents; the upload pack is numbered with a reviewer's index; a reinstatement reply leads to "Record the outcome"; Amazon's refusal text is quoted back.

## Still open

- The pack file name carries the case's internal id.
- The free on-device reading finds little on an invoice whose supplier is in the header.
- The AI's daily free-tier limit ended most drafts in the fallback "built from your own wording", so the AI-written round 2 letters were not exercised today.

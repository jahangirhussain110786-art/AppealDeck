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

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

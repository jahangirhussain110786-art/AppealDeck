# Test documents for uploading (29 Sep 2026)

Fake documents for testing the case's Documents tab. Every business, person, bank, lab and address in them is invented; phone numbers use 555 and email addresses end in `.example`. Every file is stamped **TEST DOCUMENT — NOT VALID**. Never send one to Amazon or anyone else.

## How to use them

1. Start a case with a notice:
   - **The app's own sample:** Decode → "Try a sample notice" → Decode → "Open case workspace".
   - **One of the researched notices:** open the matching `paste-notice-….txt` in this folder, copy all of it, and paste it into the case's notice box.
2. Press "Yes, this is right", then open the **Documents** tab.
3. Open the document's card and press **Choose a file**.
4. Optional, for invoices: under "Your business details", enter the invented seller below, so a document check compares against it.

**Invented seller:**

- Business name: `Brightwater Home Goods LLC`
- Address: `214 Juniper Lane, Suite 5, Austin, TX 78701, United States`
- Suppliers: `Harbor Goods Wholesale Ltd`, `Crestline Trade Supply Co.`

## Which file goes where

| File                                                 | Notice                                  | Document card                         | What should happen                                                                                                                                             |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-supplier-invoice-sample-notice.pdf`              | App's sample                            | Supplier invoice                      | Saved. A good invoice: supplier and buyer details, 14 Jul 2026, ASIN B0EXAMPLE1, paid.                                                                         |
| `02-order-and-complaint-log-sample-notice.pdf`       | App's sample                            | Sales or performance record           | Saved. Orders for B0EXAMPLE1 and how each complaint was resolved.                                                                                              |
| `03-supplier-invoice-t01-authenticity.pdf`           | t01 authenticity                        | Supplier invoice                      | Saved. Both ASINs, dated within the last 365 days, with supplier name, address and phone.                                                                      |
| `04-supplier-invoice-WITH-PROBLEMS.pdf`              | t01 or app's sample                     | Supplier invoice                      | Saved. A check should flag all of it: a quotation rather than an invoice, from 2024, no supplier address or phone, a different buyer name, no product or ASIN. |
| `05-letter-of-authorization-t03.pdf`                 | t03 trademark                           | Authorization letter                  | Saved. From the rights owner named in the notice, for ASIN B09WQ4ZP7C.                                                                                         |
| `06-lab-test-report-t07.pdf`                         | t07 product safety                      | Test report or compliance certificate | Saved. An accredited lab, UL 62368-1, ASIN B0CX9L4TQ2, passed.                                                                                                 |
| `07-certificate-of-compliance-t07.pdf`               | t07 product safety                      | Test report or compliance certificate | Saved. The same product, standard and report number.                                                                                                           |
| `08-product-photo-t07.jpg`, `09-label-photo-t07.png` | t07 product safety                      | Product and label photos              | Saved. The label shows the manufacturer and model number.                                                                                                      |
| `10-bank-statement-t06.pdf`                          | t06 funds                               | Bank or financial record              | Saved. Account holder matches the invented seller.                                                                                                             |
| `11-utility-bill-proof-of-address.jpg`               | t05 verification or t04 related account | Proof of address                      | **Checked on your device: all four picture checks pass.** Tested 29 Sep.                                                                                       |
| `12-id-card-specimen-GOOD-photo.jpg`                 | t05 verification                        | Requested identity record             | **All four picture checks pass** (size, focus, lighting, framing). Tested.                                                                                     |
| `13-id-card-specimen-BAD-photo.jpg`                  | t05 verification                        | Requested identity record             | **All four warn**: too small, blurry, washed out, off the edges. Tested.                                                                                       |
| `14-too-big-to-check-about-4MB.png`                  | Any                                     | Any                                   | **Saved, but "Check this document" says it can read files up to 3 MB.** Tested.                                                                                |
| `15-too-big-to-store-about-12MB.png`                 | Any                                     | Any                                   | **Refused: "File must be under 10 MB."** Tested.                                                                                                               |
| `16-wrong-file-type.txt`                             | Any                                     | Any                                   | **Refused: "That file type is not accepted."** Tested.                                                                                                         |

Files 14 and 15 are large, so they are not in git. Run the generator to make them.

## What "Check this document" can do today

- **Identity and proof-of-address pictures** are checked on your own device, signed in or not.
- **Invoices, letters, reports and statements** are read on the server. That needs you to be signed in, with an Appeal Pass on the case, and the AI switched on for the site.
- The AI is **off** in both places. On your computer, `GEMINI_PAID_TIER_CONFIRMED` is not set. On appealdeck.vercel.app, neither the Gemini key nor that switch is set (checked 29 Sep). Both wait on the Gemini billing step (DEPLOYMENT §6b). Until then, those checks say they cannot check the document.
- Saving and linking every file works everywhere.

## Making them again

```
node docs/handoffs/2026-09-29-test-documents/generate.cjs
```

It needs the project's installed Playwright, and remakes every file in this folder except this guide and `16-wrong-file-type.txt`.

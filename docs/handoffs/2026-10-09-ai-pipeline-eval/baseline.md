# AI drafting evaluation: baseline

Run: 2026-10-09T11:40:01.696Z

## Summary

- inauthentic-first-round: ok, retried=false, missing=0, records=0/1, words=127/122
- odr-first-round: ok, retried=true, missing=0, records=1/1, words=135/107
- listing-second-round-after-refusal: ok, retried=true, missing=0, records=1/1, words=133/97
- related-account-with-declined-record: ok, retried=true, missing=0, records=0/1, words=163/100

## inauthentic-first-round

Took 3809 ms.

- retried: false
- fact check on final: pass
- seller words 122, draft words 127
- must-mention missing: none
- records named: 0/1; declined named: 0/0

### Root cause

We bought 200 units of B0EXAMPLE1 from Harbor Goods Ltd on 5 Aug 2026. We did not keep the packing slips with the invoice and we did not check the units against the invoice when they arrived, so when 3 customers complained in September we could not show which batch they came from.

### Corrective actions

On 20 Sep 2026 we removed the listing. On 21 Sep we refunded the 3 customers. On 22 Sep we counted the remaining 142 units and matched them to invoice HG-4471, which is documented in harbor-goods-HG-4471.pdf.

### Preventive measures

Since 25 Sep 2026 our warehouse lead, Amina, checks every delivery against the invoice before it is shelved and signs the invoice. We keep invoices in one folder by ASIN. We only buy this product from Harbor Goods.

## odr-first-round

Took 14518 ms.

- retried: true
- fact check on final: pass
- seller words 107, draft words 135
- must-mention missing: none
- records named: 1/1; declined named: 0/0

### Root cause

Between 1 and 28 August, we had 14 late shipments out of 610 orders. Our only packer was on leave from 10 to 19 August, and nobody else knew how to operate the label printer. Additionally, 6 orders received A-to-z claims because we did not reply to buyer messages during that week.

### Corrective actions

We shipped the 14 late orders by 21 August. We replied to all open messages on 20 August. We trained a second person, Bilal, on the label printer on 2 September. These 14 late orders and their ship dates are documented in our Sales or performance record (orders-august-2026.csv).

### Preventive measures

Two people are now capable of packing and printing labels. We check unshipped orders at 9am and 4pm every day. Messages are answered within 12 hours, and my brother covers weekends to ensure timely responses.

## listing-second-round-after-refusal

Took 8438 ms.

- retried: true
- fact check on final: pass
- seller words 97, draft words 133
- must-mention missing: none
- records named: 1/1; declined named: 0/0

### Root cause

Our listing writer copied the title for ASIN B0LST00123 directly from the supplier's catalogue in June 2026, which included the claim 'FDA approved'. Nobody on our side checked this title against Amazon's detail page rules before the listing went live.

### Corrective actions

On 4 Sep 2026, we removed 'FDA approved' from the title, bullets, and A+ content of ASIN B0LST00123. This change is documented in the Listing correction record (B0LST00123-before-after.pdf), which contains screenshots of the title before and after the 4 Sep 2026 change. On 5 Sep 2026, we checked our other 38 listings and found no other medical claims.

### Preventive measures

Every new listing is now reviewed by me against the restricted-claims list before it is published. We also keep a list of banned words in our listing template, which we updated on 6 Sep 2026.

## related-account-with-declined-record

Took 20550 ms.

- retried: true
- fact check on final: pass
- seller words 100, draft words 163
- must-mention missing: none
- records named: 0/1; declined named: 1/1

### Root cause

The account is related to another account named Nile Trading, which belonged to my cousin Omar. In March 2026, Omar used my home wifi and my laptop for two weeks while his own laptop was being repaired. During this time, he logged into his Seller Central account from my device and network. I did not know that this activity would link our accounts.

### Corrective actions

Omar has not used my devices or network since 14 March 2026. I changed my wifi password on 15 March 2026. Omar closed his account on 2 April 2026. I have provided utility-bill-march-2026.pdf, which is an electricity bill for my address dated 20 March 2026. I cannot provide a linked-account resolution record because Omar closed his account himself and did not receive a letter from Amazon about it.

### Preventive measures

Nobody else uses my devices or network for Amazon. I keep a written list of the two devices I use for Seller Central to ensure no other accounts are accessed from them.

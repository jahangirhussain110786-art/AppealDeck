# Research C — Zero-marginal-cost compliance hooks for AppealDeck

Date of research: 9 Oct 2026. Method: WebSearch + WebFetch only; no repository files read. Every claim below is tagged **[seller voice]** (a seller writing on a forum), **[Amazon]** (Amazon staff or Amazon-published text) or **[vendor]** (a company selling something). Dates are the page's own date where it shows one; Seller Forums only show relative ages ("6 months ago"), which I convert to an approximate month against 9 Oct 2026 and mark "≈".

Frame: AppealDeck never touches Seller Central, works only from pasted or uploaded data, and already reads documents on-device. "Zero marginal cost" here means pure rules/computation on the seller's own text, or a free public feed that can be queried per request without a paid upstream.

---

## 1. Listing compliance pre-checks (prohibited claims, pesticide words, hazmat)

### Pain evidence

- **[Amazon]** Amazon staff (Levi_Dylan_Amazon, ≈Oct 2025) explain that naming a disease or its symptoms — even "reduces stress and anxiety" on an aromatherapy candle — makes a listing a restricted product; fix = remove the claim and appeal; if the claim is printed on the packaging and there is no FDA registration the ASIN cannot be reinstated and a new ASIN is needed. https://sellercentral.amazon.com/seller-forums/discussions/t/cbb1ffd8-af69-4720-a6af-d005d3eba67c
- **[seller voice]** In that thread a seller reports the violation on B0F2NB7H86, says they submitted MSDS and FDA registration and "our appeal was still rejected" (≈Oct 2025).
- **[seller voice]** "Notification of Restricted Products Removal: Bed Sheets Seen as Pesticide" (≈2020): three parent SKUs of bedding removed because the description said "naturally anti-bacterial"; seller found out by Amazon email, had to take the pesticide course, remove the phrase, appeal. https://sellercentral.amazon.com/seller-forums/discussions/t/40710dd4241cc3e4c60caa2b3d6c8e40
- **[Amazon]** Staff replies across the pesticide threads (2019–2024): the EPA treats "antiviral, antimicrobial, antifungal, antibacterial" claims as pesticidal "including clothing, home goods"; "in many cases, the claim may be the only reason the product is being classified as a pesticide, and removing the claim may lift the restriction"; check "title, images, bullet points, description, A+ content, and search keywords". Ten threads found in one search, e.g. "Listing removed due to Pesticide Claims", "Bots Flagging Non-Related ASINs as Pesticides", "Listings Wrongly tagged as pesticide". https://sellercentral.amazon.com/seller-forums/discussions/t/0bc457e230ab50e4883517bf0da81414 ; https://sellercentral.amazon.com/seller-forums/discussions/t/25a57d4d60ed97fd03ffe3d5cbe09391 ; https://sellercentral.amazon.com/seller-forums/discussions/t/d0dfc98c-feec-4642-8ba2-b10b5cac7798
- **[seller voice]** Sellers also report that deleting the listing does not clear the violation ("It will remain on your account and drop off after 180 days") and that once inactive the page cannot be edited to remove the word — i.e. the cheap moment to catch it is _before_ publishing.
- **Hazmat** **[seller voice]** "ASIN (incorrectly) under hazmat review, exemption sheet rejected" (≈2022): a decorative home item flagged, exemption sheet rejected with a demand for an SDS, Seller Support "Not helpful", second exemption submission approved. **[Amazon]** Dougal_Amazon: 14 days to provide the SDS or inventory "may be disposed of (at your expense)". https://sellercentral.amazon.com/seller-forums/discussions/t/a1c0d7f4-ef18-41c2-b110-f79746025bd3 . A 2026 thread (per the Compliance Gate round-up, dated 2026) describes an ASIN opened for review in Jan 2026, reopened, then closed again with the same SDS rejection language. **[vendor]** SDS rejection reasons: ranges instead of exact percentages, name/manufacturer mismatch with the listing, missing one of the 16 sections, older than five years. https://www.compliancegate.com/amazon-hazmat/ (2026)

### What is sold today and at what price (all **[vendor]**, prices read 9 Oct 2026)

- keywords.am "Restricted Words Checker": free, no login, "flags FTC health claims, Amazon-banned promotional language, regulated terms, and trademark risks"; the same site sells a Deep Audit at "$99 per ASIN" and catalogue monitoring "From $49/mo". https://keywords.am/tools/
- amazonlistingaudit.com: Free plan, unlimited audits, but **scrapes a live ASIN** (no pasted-text mode); Pro "$19 per month" adds "Policy violation detection" and "47 error types checked". https://www.amazonlistingaudit.com/
- Perci.ai "Restricted Keyword Guard": $59–$199/month per third-party listings (conflicting; one source puts a tier at $99/mo). https://sellermetrics.app/amazon-ai-tools/
- Helium 10 listing tools: $29–$229/month tiers (listing analyzer on higher tiers). https://keywords.am/blog/best-amazon-listing-audit-tools/
- Several "restricted keyword lists" are published free by vendors (SellerSonar, SalesDuo, amazonsellersappeal.com, ylt-translations). They are reconstructions: "Amazon doesn't disclose its full list of forbidden terms". https://sellersonar.com/blog/amazon-restricted-keywords-list/ (2026)
- Hazmat: no priced SDS-review service found; lab analysis "at least a few hundred dollars" **[vendor]**; the exemption-sheet template is free inside Seller Central.

### Free public data source

- None needed for the word check: it is a rules pass over pasted title/bullets/description/search terms. Public reference lists: EPA FIFRA pesticide-claim guidance; FDA disease-claim rules; Amazon's own staff wording above. A trademark component would use USPTO (see §3).
- For hazmat: no free classifier exists; the UN/DOT classification needs the product's chemistry. An **SDS completeness check** on an uploaded SDS (16 sections present and in order, revision date < 5 years, exact percentages, product/manufacturer name matches the listing) is pure rules.

### Verdict

**Strong — pasted-text prohibited-claim / pesticide-word pre-check.** Real, repeated, forum-documented removals caused by a handful of words; the only free tools either scrape a live ASIN (useless before publishing, and against AppealDeck's no-Seller-Central stance anyway) or are vendor lead magnets. Must be framed as "words Amazon's staff say trigger review", never "compliant". **Weak — hazmat classification** (needs chemistry, not rules). **Moderate — SDS completeness check on an uploaded SDS** (rules on a document AppealDeck already reads; low volume).

---

## 2. Product recall / safety watching

### Free public data sources (all verified live 9 Oct 2026)

| Source                                 | URL                                                                                                                                                                              | Format                                                                                                | Key / terms                                                                                                                                                                                                        | Verified                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CPSC Recalls API                       | https://www.saferproducts.gov/RestWebServices/Recall?format=json (doc: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information)                  | JSON/XML; params `Title`, `RecallDescription`, `ProductName`, `format`                                | No key, no stated terms or rate limit on the doc page                                                                                                                                                              | Fetched `?ProductName=Toddler&format=json`: fields `RecallID, RecallNumber, RecallDate, Title, Description, URL, Products[{Name, Description, Model, Type, CategoryID, NumberOfUnits}], Manufacturers/Importers/Distributors/Retailers[{Name, CompanyID}], ProductUPCs[], Hazards, Remedies, Images`; latest RecallDate seen 2026-09-17. **`ProductUPCs` is mostly empty** — matching must be by name/brand/model. |
| openFDA enforcement (food/drug/device) | https://open.fda.gov/apis/food/enforcement ; terms https://open.fda.gov/terms/ ; https://open.fda.gov/apis/authentication/                                                       | JSON                                                                                                  | Free key; CC0 — "even for commercial purposes, all without asking permission"; 240 req/min; 1,000/day without key, 120,000/day with key; updated weekly; GMDN device-nomenclature text excluded from the CC0 grant | Terms and limits fetched 9 Oct 2026                                                                                                                                                                                                                                                                                                                                                                                |
| Health Canada Recalls & Safety Alerts  | https://open.canada.ca/data/en/dataset/d38de914-c94c-429b-8ab1-8776c31643e3 → https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json | JSON/CSV, EN/FR                                                                                       | Open Government Licence – Canada; "Updated daily"; record modified 2025-09-15                                                                                                                                      | Dataset page fetched                                                                                                                                                                                                                                                                                                                                                                                               |
| EU Safety Gate (RAPEX)                 | https://ec.europa.eu/safety-gate-alerts/api/download/weeklyReport/list/xml/en                                                                                                    | XML index of weekly reports with per-report XML URLs; "A new weekly report is published every Friday" | No key or login; Commission reuse policy is Decision 2011/833/EU / CC BY 4.0 (attribution). No official API doc page found — the endpoint is the portal's own export.                                              | Fetched: latest entry **Report-2026-40, published 09/10/2026**; index runs back to 2005                                                                                                                                                                                                                                                                                                                            |

### What Amazon does already **[Amazon]**

Amazon's seller policy (quoted via search of help page GRD4EMBNNW3P47GH; direct fetch rendered only the logged-out landing page): Amazon removes affected listings "immediately" when it learns of a potential safety defect, notifies the seller by a Product Safety Alert within 24 hours, sellers "review their inventory and remove any other Amazon.com listings" that may be affected, units left in FBA for more than 30 days after notification are disposed of without reimbursement. CPSC's final order against Amazon (17 Jan 2025) made Amazon the "distributor" responsible for recalls of FBA goods; Amazon said it would appeal. https://www.wamc.org/2024-08-01/amazon-must-recall-unsafe-products-sold-by-independent-sellers-a-consumer-agency-says (1 Aug 2024) ; https://www.compliancegate.com/amazon-recalls/ (2026)

### What is sold today **[vendor]**

- No seller-facing tool found that matches ASINs/brands against government recall feeds. Listing monitors (AMZ Alert $0.95/ASIN/month, SellerSonar from $19.98/mo, SellerPulse from $89/mo, SentryKit $19–49/mo) alert on _Amazon's_ suppression/removal after the fact, not on the recall itself. https://sellersonar.com/ ; https://www.ecomengine.com/sellerpulse ; https://sentrykit.com/frequently-asked-questions/
- Apify actors resell each of the four feeds per record (CPSC, openFDA, Safety Gate, Health Canada) — proof the feeds are free upstream.

### Seller voice

- Thin. The only seller-side pain found is the inverse: **[vendor, law firm]** products "wrongly marked for recall" leading to an Amazon suspension. https://amazonsellerslawyer.com/blog/amazon-news-updates/amazon-products-wrongly-marked-for-recall/ . No 2025–2026 forum threads of sellers who _missed_ a recall were found.

### Verdict

**Weak as an acquisition hook, strong as data.** Four free, keyless-or-free-key feeds exist and are easy to match by brand/product name (UPC fields mostly empty). But Amazon already removes and notifies within 24 hours, and no forum evidence shows sellers wanting a pre-warning. The one credible use is a **sourcing pre-check** ("is this brand/model on any recall list before I buy stock") for OA/wholesale sellers, and a **"what Amazon will do next"** card attached to a decoded Product Safety Alert (24 h opt-out, 30-day disposal). Build cost small; demand unproven.

---

## 3. Trademark / IP self-check before listing

### Pain evidence

- **[seller voice]** ≈Mar 2025: "Recently, I received a trademark complaint alleging that the phrase 'America 250' is a registered trademark"; listing taken down; phrase removed from the title, "Amazon still refuses to reinstate my seller performance metrics"; a second seller in the thread "thought it was too generic to be trademarked". https://sellercentral.amazon.com/seller-forums/discussions/t/09790823-27d9-4bb1-8600-7415bb4e4ae6
- **[seller voice]** UK, ≈2021: "Stainless Steel Thermos Flask" — seller believed "thermos" was a generic noun; Amazon's auto-translation of "Thermoskanne" produced it; listing removed; only route back is a retraction the rights owner sends directly to Amazon. https://sellercentral.amazon.co.uk/seller-forums/discussions/t/106e893af53143a883e276854b4e1da0
- **[Amazon]** Forum staff: to restore a listing the seller must edit out the mark and submit an acknowledgment, or prove authorization (invoice, order ID, letter of authorization). "Listing deactived for trademark infringement" https://sellercentral.amazon.com/seller-forums/discussions/t/47dfadaf01629897777c83731e8f1004
- **[vendor, law firm]** Q4 2025: "compatible with" wording without logos is allowed, but naming a brand while Brand = "Generic" "often violates IP rules"; misuse "now triggers locked content, IP complaints, and Account Health hits". https://damlawfirm.com/blog/amazon-trademark-infringement-compatible-with-titles/ (late 2025)
- **[vendor]** escalation pattern claimed: first complaint = warning + removal, second = account review, third = suspension risk. https://www.fbaleadlist.com/amazon-seller-guide-the-truth-about-ip-complaints-and-how-to-avoid-them/

### What is sold today **[vendor]**

- Seller Assistant IP-Alert: single-ASIN lookup free, no account; returns complaint type (trademark/copyright/patent), filing brand, date; **data source not disclosed on the page**; bulk checks only in the paid extension. https://www.sellerassistant.app/free-tools/ip-alert-lookup/
- "IP Alert" Chrome extension (separate product): "$99 annually", lifetime offers. https://jordiob.com/amazon-tools/product/ip-alert/
- TrackMyOrders IP risk score 1–6: ≈$9.99–$12.90/month. https://trackmyorders.com/
- Seller Journal "Greenlight": free crowdsourced brand-complaint DB (site returned 403 to fetch). https://sellerjournal.com/greenlight/
- All of these are **complaint-history databases**, not trademark-register checks: a clean result means "nobody reported this ASIN", not "this word is free".

### Free public data source

- **USPTO TSDR Data API**: free key via a USPTO.gov account; "60 requests per API key per minute", PDF/ZIP/multi-case "four requests per API key per minute"; returns status/documents for a known serial/registration number. https://developer.uspto.gov/files/tsdr-api-key-manager-user-guide (2020)
- **USPTO Open Data Portal (data.uspto.gov)**: "access USPTO data at no cost"; API key required; from 18 Jun 2026 a USPTO.gov account with MFA is required; trademark APIs listed = Trademark Assignment Search and TSDR (Decisions & Proceedings migrated). https://data.uspto.gov/apis/getting-started ; https://data.uspto.gov/support
- **Trademark bulk data** (daily XML of applications/registrations) via BDSS with an API key; no fee stated. https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data (page dated 1 Jan 2023)
- **Terms** (https://www.uspto.gov/terms-use-uspto-websites): "Public domain information may be freely distributed and copied" with acknowledgement requested; "USPTO's online databases are not designed or intended to be a source for bulk downloads"; "unusually high numbers of database accesses" may be denied "without notice". **No commercial-use prohibition found**; data.gov lists the ODP bulk datasets under Creative Commons Public Domain Mark 1.0. The older TESS free-text search was retired; the new Trademark Search UI has no documented public API, so a _word_ search (not a serial-number lookup) means either indexing the daily bulk XML yourself (an infra cost, not zero) or the ODP search endpoints (keyed, free).
- Amazon Brand Registry has **no public lookup**; the brand-name check is login-gated.

### Verdict

**Moderate–strong, with a legal-framing requirement.** A "words in your title that are live registered US marks (with class)" flag is pure computation once the register is reachable, and the forum evidence shows sellers losing listings to words they thought generic ("Thermos", "America 250", translation artefacts). But a mark match is not infringement (nominative use, different class), so the output must be "worth checking", never "safe"/"infringing" (same D6 rule as the scam check). Rate limit 60/min is fine per-request; a bulk mirror is not zero-cost. The complaint-history vendors do something different and cheaper to copy badly — do not.

---

## 4. Invoice / supplier-document compliance

### Pain evidence

- **[seller voice]** ≈Apr 2026, "Authenticity complaint — stuck in a loop, invoices keep getting rejected": invoices within 365 days "rejected because they don't cover total units sold"; "Include older invoices — rejected for exceeding 365 days"; Seller Support deflected to Account Health; phone verification failed. ≈Jun 2026 reply: authorized reseller, "amazon is rejecting the brand invoices stating my invoices are not authentic", AHR fell 260 → 140. No Amazon staff reply. https://sellercentral.amazon.com/seller-forums/discussions/t/4b9adcdc-cd45-41a4-9e94-0331b180880f
- **[seller voice]** ≈2024, "Amazon should re-think their 'invoices from the last 365 days' policy": "Items don't transform into counterfeit after 365 days. A legitimate invoice is always legitimate." ; brand-direct bulk invoices for 6–12-month supplies "become unusable". https://sellercentral.amazon.com/seller-forums/discussions/t/e2017bb7-a8e7-4a8d-8d17-0b9f0b7b11cf
- **[seller voice]** "We cannot accept this invoice because we are unable to verify the supplier." https://sellersasksellers.com/t/invoices-rejected-unable-to-verify-the-supplier/2593
- **[Amazon]** Sarah_Amzn, ≈2024, requirements post: "Issued within the last 365 days", "Quantities match sales volumes", product identifiers, "Supplier contact details (name, address, website)", authentic PDF/image not editable, completed order "no quotes/proformas", "Amazon may reject invoices that appear inauthentic, altered or lacking required info". https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7 . A second staff post adds: issue date "within the past 365 days before the receipt of the performance notification"; "Quantity sufficient to cover your sales volumes for each ASIN cited … over the past 365 days"; Amazon "might reach out to the supplier to verify". (Amazon's help page "Invoice requirements for appealing a policy violation" is login-gated; these staff posts are the public copy.)
- Conflicting vendor claims on the window (180 vs 365 days) exist — **[vendor]** fivestarcommerce.com, riverbendconsulting.com; Amazon staff say 365.

### What is sold today **[vendor]**

- "AMZ Invoice Assist": $75 per invoice basic, $249 / $449 per-account bundles (from the 9 Oct search summary; the domain amzinvoiceassist.com **did not resolve** when fetched the same day — treat as unstable).
- amazonsellers.attorney: "$1,500 for standard and Section 3 suspension appeals, and $2,300 for IP and related-account appeals". https://www.amazonsellers.attorney/amazon-appeals.html
- UK appeal firms: £349–£749 ex VAT by turnaround. https://theappealguru.com/
- Riverbend "Amazon-friendly invoices" guidance (free blog) and consultant reviews bundled in retainers. https://riverbendconsulting.com/blog/amazon-friendly-invoices/
- Side risk the forums document: consultants selling fabricated invoices → permanent closure. https://sellercentral.amazon.com/seller-forums/discussions/t/11038b14d9e7c461438afb4d3788f680

### Free public data source

- None required; the check is rules on the uploaded document plus the notice date: date within 365 days _of the notice_, quantity ≥ units sold in the window (seller enters the sales figure), supplier legal name + street address + phone/website present, buyer name = Seller Central legal name, document type is an invoice (not pro-forma/quote/credit note), file not editable. The one thing it cannot do is Amazon's supplier phone call.

### Verdict

**Strong — and AppealDeck already has most of it** (device reader, pro-forma/quotation detection, the 365-day clock). The free candidate is to expose the existing check as a standalone, no-account "invoice pre-check" with the date-vs-notice arithmetic and the quantity-coverage arithmetic made explicit, because the "loop" thread shows the arithmetic is exactly what sellers cannot see. Must say "we cannot verify your supplier; Amazon may call them".

---

## 5. Performance-notification and Account Health triage

### What sellers pay today **[vendor]**

- Riverbend **Guardian**: "Every day, our team checks your account for performance notifications, AHR changes, ASIN errors, and risk signals"; appeals "with no caps on cases"; "Starts At $17/day" (≈$510/month), monthly, cancel anytime, custom quote by account size. Riverbend **Pro** "does not include account health monitoring". https://riverbendconsulting.com/guardian/
- SentryKit: Starter $19/mo (2 storefronts), Pro $49/mo (5), agency from ≈$199/mo; connects via SP-API; alerts for suspended listings, search suppression, Buy Box suppressed, listing health; the FAQ does not list a performance-notification reader. https://sentrykit.com/frequently-asked-questions/
- Full-service agencies bundle "account-health checks" into $1,000–$3,000/mo (small), $2,000–$3,500 (mid), up to $5,000–$15,000. https://salesduo.com/blog/amazon-account-management-services-cost/ ; https://www.supplykick.com/blog/amazon-account-management-services (2026)
- WebRetailer's round-up: automated listing monitors "$20 to $30 per month", "general health assessment services $200 to $300", reinstatement "$2,000+". https://www.webretailer.com/amazon/account-health/
- Agency "account health management" pages with no public price: data4amazon.com, sammdataservices.com, dizimods.com.

### Pain evidence

- **[seller voice]** ≈Apr 2026: no A-to-z claim emails arriving; one claim closed in the buyer's favour unseen; another showed "Respond by: Apr 17, 2026" with no email. **[Amazon]** Aria_Amazon: check Notification Preferences and spam, watch Performance > A-to-z Guarantee Claims "Action Required", "you have 30 days from the grant date to appeal the decision". https://sellercentral.amazon.com/seller-forums/discussions/t/0b59bca9-88ed-4b60-92db-c09258e24c05
- **[seller voice]** Seller Assistant's AI button on the Account Health page misread a violation ("deactivated for being a motorcycle helmet when it's actually a T-shirt") — ≈Nov 2025. https://sellercentral.amazon.com/seller-forums/discussions/t/ecf5f31b-3e3b-4295-883a-7383bda948d4
- **[seller voice]** "If the number never moves you can't get to 250 to have seller assurance or anything else" (AHR stuck at 208) — ≈Nov 2025. https://sellercentral.amazon.com/seller-forums/discussions/t/b87fd1ae-4473-4f4f-a769-c74ab375693c

### Free data source

- None needed: the input is the pasted notification. Monitoring (polling the account) is exactly what AppealDeck will not do; the zero-cost version is the per-notice decoder.

### Verdict

**Strong — this is the existing product; widen the input set.** Paid "daily reading" costs $510+/month; the free, no-login, no-SP-API equivalent is "paste any performance notification (not only deactivations): A-to-z, SAFE-T, pesticide, IP, hazmat, Product Safety Alert, INFORM, tax interview, funds hold" and get the type, the clock and the next action. The April 2026 thread shows notifications themselves go missing, so a pasted-text reader is complementary to, not replaced by, SP-API monitors.

---

## 6. Deadline / policy-date tracking

### Which clocks exist (with the source that states them)

| Clock                                        | Rule                                                                                                                                                                                   | Source                                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SAFE-T claim filing                          | 60 → **30 days** from return delivery scan / refund date / last scan, effective **16 Feb 2026** (US seller-fulfilled)                                                                  | **[vendor citing Amazon news]** My Amazon Guy, 21 Jan 2026 https://myamazonguy.com/news/amazon-safe-t-claim-filing-window/                                                       |
| A-to-z appeal                                | **30 days from the grant date**; response to a claim 48–72 h (sources disagree; the notice shows "Respond by")                                                                         | **[Amazon]** Aria_Amazon ≈Apr 2026 (link in §5)                                                                                                                                  |
| Funds disbursement appeal after deactivation | 90 → **60 days from deactivation**, effective **9 Oct 2024**; hold "up to 90 days"                                                                                                     | **[Amazon]** News_Amazon https://sellercentral.amazon.com/seller-forums/discussions/t/e5457317-25d9-4562-9207-86a19b3d38e9                                                       |
| Invoice validity                             | issued within **365 days** before the notice                                                                                                                                           | **[Amazon]** §4                                                                                                                                                                  |
| INFORM Act                                   | marketplace collects within 10 days of qualifying, verifies within 10 days; annual certification within **3 business days** of the instruction; otherwise suspension of sales/payments | **[law firm summaries of the statute]** https://winthrop.com/bold-perspectives/inform-act-requirements/ ; FTC guidance https://www.ftc.gov/business-guidance/resources/INFORMAct |
| Tax interview                                | W-8 expires 31 Dec three years after submission; lapse → up to 30 % withholding                                                                                                        | **[Amazon]** https://pay.amazon.com/help/202096060                                                                                                                               |
| Aged-inventory surcharge                     | from 181 days; assessed the 15th, charged 18th–22nd; new 366–455 / 456+ tiers from 16 Jan 2026                                                                                         | **[vendor]** https://blog.sellermagnet.com/post/amazon-fba-storage-fees-2026/en                                                                                                  |
| Hazmat SDS                                   | 14 days or inventory may be disposed (staff) vs "four business days" (vendor)                                                                                                          | **[Amazon]** Dougal_Amazon §1                                                                                                                                                    |
| Product Safety Alert                         | opt-out of Recalls Logistics within 24 h; FBA units disposed after 30 days                                                                                                             | **[Amazon]** §2                                                                                                                                                                  |
| AHA corrective action                        | 72 hours from specialist contact; "AHA does not extend the deadline automatically"                                                                                                     | **[vendor, law firm]** https://damlawfirm.com/blog/amazon-account-health-assurance-sellers-guide/                                                                                |
| Seller Challenge                             | 3 per 180 days; decision target 48 h                                                                                                                                                   | **[Amazon]** §9                                                                                                                                                                  |

### Evidence sellers miss or misread them

- **[seller voice]** ≈Dec 2025 "SAFE-T claims limit changed to 30 days?": seller learned of the 30-day limit **from an error message while filing**; Amazon's help page still said 60; **[Amazon]** Joey_Amazon replied the policy "hasn't changed and is still 60 days" and asked for support cases; "It is happening for almost every return we receive." https://sellercentral.amazon.com/seller-forums/discussions/t/ca840906-2220-4d4d-a715-c49b325858c1 . The official cut to 30 days was then announced for 16 Feb 2026 — i.e. the system enforced it before the policy page said so.
- **[seller voice]** Funds policy change: "why they received the email notice only in Spanish"; sellers questioned whether contract notice requirements were followed (≈Oct 2024, link above).
- **[seller voice]** A-to-z claim closed unseen because no email arrived (≈Apr 2026, §5).
- **[seller voice]** INFORM Act "Your Account Is At Risk Of Deactivation" with documents already uploaded and still "incomplete" (≈2023). https://sellercentral.amazon.com/seller-forums/discussions/t/8f3bd3be-932b-48af-9f13-fe3e4eb10e73
- **[vendor]** "If you don't appeal in 30 days, the claim will be closed, and the claim's impact … cannot be reversed." https://www.sellerassistant.app/blog/what-is-a-to-z-claim-amazon-complete-guide-for-sellers/

### Free calendar / reminder tools

- None found. "Seller calendars" are vendor blog posts of Q4 inbound cut-offs (SupplyKick 2026 https://www.supplykick.com/blog/amazon-seller-calendar-2026 ; SalesDuo). No tool computes a seller's own clocks from their own dates.

### Verdict

**Strong.** Pure date arithmetic on dates the seller types (refund date, grant date, deactivation date, notice date, W-8 submission year, inbound date), with each rule carrying its source and effective date so the table can be corrected when Amazon moves a window (the SAFE-T episode shows windows move before the help page does). AppealDeck already has the appeal/funds clocks; the gap is a **catalogue of all the other clocks** and the reminder delivery that exists for cases.

---

## 7. Policy-change tracking

### How sellers learn

- Seller Central news is **login-gated** (fetch of https://sellercentral.amazon.com/seller-news on 9 Oct 2026 redirected to sign-in).
- **[vendor]** Autopilot "Amazon Policy Tracker 2026": public page, 20 entries from 8 Dec 2025 to 25 Sep 2026, each summarising a Seller Central news item with a link that "may require a seller login"; examples: new dangerous-goods compliance questions from 26 Oct 2026; manufacturer-packaged bundles from 11 Jan 2027; expanded commercial liability insurance from 2 Nov 2026; selling roles → Account IDs 29 Jul 2026; AI-generated people must be tagged from 22 Jul 2026; Featured Offer eligibility gate removed through 2026; 3.5 % fuel surcharge from 17 Apr 2026. https://www.autopilotbrand.com/resources/amazon-policy-tracker (updated 25 Sep 2026)
- Free newsletters: FBA Monthly (twice monthly), Cruxfinder (weekly), Kevin King's BDSN (twice weekly), Carbon6/eComEngine news pages. https://www.fbamonthly.com/ ; https://cruxfinder.com/ ; https://www.getreviews.ai/blog/best-newsletters-for-amazon-sellers-to-follow-in-2026
- Paid: Marketplace Pulse pricing not published ("Get in Touch"); no Amazon-policy-specific paid tracker with a public price was found. EcommerceBytes, the long-running independent seller-news site, **has ceased publication** (its 24 Jan 2026 SAFE-T article now resolves to a closure notice, fetched 9 Oct 2026).

### Evidence of being caught by changes

- SAFE-T (Dec 2025/Feb 2026) and the Spanish-only funds-policy email (Oct 2024), above.
- **[seller voice]** Jan 2025 title-format thread: titles, including brand names, edited "without notification". https://sellercentral.amazon.com/seller-forums/discussions/t/b2b15728-0d43-453e-974f-59eb63f73059
- **[press]** CNBC 15 Apr 2026: sellers protesting the automatic ad-cost deduction and the DD+7 payout hold; Amazon deferred the ad change to 1 Aug 2026. https://www.cnbc.com/2026/04/15/amazon-sellers-boycott-ads-payment-changes.html

### Verdict

**Avoid as a product; keep as an internal dated rule table.** Tracking requires either a logged-in scrape (forbidden) or a human reading the gated feed (not zero marginal cost), and free newsletters already cover it. What _is_ worth doing is the thing §6 needs anyway: each clock/rule in AppealDeck carries its effective date and source, surfaced to the seller as "this window was 60 days until 16 Feb 2026".

---

## 8. SAFE-T claims and A-to-z claim responses

### What is sold / shared

- Templates are free: Seller Central forum thread "A-Z Claim Response Template" (≈2021) and Seller Union's guide with per-scenario response and appeal templates (free to read). https://sellercentral.amazon.com/seller-forums/discussions/t/134ede0335fdb76e29896f381b2076ee ; https://seller-union.com/a-z-claim-guide-thread-appeal-templates-for-a-z-claims/
- **[vendor]** Refunzo: self-service reconciliation "for free, for life", or "let us do it for 15% capped at $5,000" (4 Dec 2025). https://www.refunzo.com/blog/file-amazon-safe-t-claim-damaged-missing-returns/
- **[Amazon]** SAFE-T process: file under Orders > Manage SAFE-T Claims, eligibility check first ("If not, there's no appeal option"); correspondence only through that page; the refund must have been issued by Amazon. https://sellercentral.amazon.com/seller-forums/discussions/t/45d6f0b0-08c9-4cba-8739-940d50dc95b8
- **[Amazon]** A-to-z: no attachments in the response box; documents go via Buyer-Seller Messages; claim granted automatically if the seller never answered the buyer's contact.

### Frequency (seller voice, anecdotal, undated unless shown)

- "ONE A-Z in 10 years" (few hundred FBM orders/month); "7 or 8 cases" in 18 months on ~50,000 transactions/year; "3 this week alone"; 8 claims on 10 FBM orders in a fraud wave; "five of these claims in the previous week" (≈2021). https://sellercentral.amazon.com/seller-forums/discussions/t/12252e3e-80ca-4585-ac01-827fbd5b1ae1 ; https://sellercentral.amazon.com/seller-forums/discussions/t/369737ae-1982-45ae-889f-8c3d6661f3a0
- Themes 2025–2026: claims granted without buyer contact; granted despite signed delivery; "not as described" granted because return instructions were not provided (Jun 2026). https://sellercentral.amazon.com/seller-forums/discussions/t/11b7f07d-45dc-4831-8ca8-194db22f4f13 ; https://sellercentral.amazon.com/seller-forums/discussions/t/51203421-3ede-4031-beb9-6e0b81a91ed0

### Verdict

**Weak.** Templates are a commodity and free; the money (Refunzo) is in filing at scale, which needs account access. The only zero-cost piece worth having is the **eligibility + deadline arithmetic** from pasted dates (refund date → SAFE-T last day; grant date → A-to-z appeal last day), which folds into §6.

---

## 9. Amazon's own free offerings — what they do and do not cover

| Offering                                                                       | What it does **[Amazon unless noted]**                                                                                                                                                                                                                                                                                         | What it does not cover                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Account Health Rating (Aug 2022, US/CA; worldwide 2023)                        | 0–1,000 score, "Healthy / At-Risk / Unhealthy", "the determining factor for account suspension based on accumulated policy violations"; violations shown with severity; Account Health Specialists by phone/email. https://www.aboutamazon.com/news/small-business/amazon-helps-sellers-manage-their-account-health (mid-2022) | Does not explain a notice in plain words, compute clocks, or review documents.                                                                                                                                                       |
| Account Health Assurance (free, automatic)                                     | Professional plan, AHR ≥ 250 for 6 consecutive months (≤ 10 days below), emergency phone on file; on a covered account-level event a specialist calls and the seller has 72 hours to fix before deactivation. **[vendor, law firm]** https://damlawfirm.com/blog/amazon-account-health-assurance-sellers-guide/ (≈Jul 2026)    | Excludes counterfeit, payment fraud, identity fraud, child safety; does not protect individual listings/IP complaints; funds holds unchanged; eligibility lapses silently below 250. Sellers below 250 ("stuck at 208") get nothing. |
| Seller Challenge (≈Oct 2025, AHA members only)                                 | After standard appeals are exhausted, request a detailed re-review of **listing-level** policy decisions; 3 per 180 days; 48-hour target; one per enforcement. https://sellercentral.amazon.com/seller-forums/discussions/t/b87fd1ae-4473-4f4f-a769-c74ab375693c                                                               | Account-level suspensions, funds, Brand Registry disputes.                                                                                                                                                                           |
| Seller Assistant (upgrade announced 17 Sep 2025; "Canvas" Mar 2026)            | Conversational help, business insights, and "with your approval" actions such as resolving some policy violations. https://sellercentral.amazon.com/seller-forums/discussions/t/ecf5f31b-3e3b-4295-883a-7383bda948d4                                                                                                           | Sellers report misreads (T-shirt/helmet) and generic advice ("optimize", "increase ad budget"); no stated invoice review.                                                                                                            |
| Invoice requirements (help page, login-gated; public copy = staff forum posts) | The field list in §4; Amazon may phone the supplier.                                                                                                                                                                                                                                                                           | No pre-submission checker; the 365-day-vs-quantity arithmetic is left to the seller.                                                                                                                                                 |
| Manage Dangerous Goods Classification                                          | Free exemption-sheet template; SDS upload; staff say 14 days.                                                                                                                                                                                                                                                                  | No way to see why a listing was flagged; rejections repeat without explanation (§1).                                                                                                                                                 |
| Product Safety Alerts / Recalls Logistics                                      | Notice within 24 h; logistics service for US sellers (opt-out 24 h).                                                                                                                                                                                                                                                           | No pre-warning from government feeds; 30-day disposal.                                                                                                                                                                               |
| Notification Preferences                                                       | Email routing for A-to-z etc.                                                                                                                                                                                                                                                                                                  | Emails demonstrably fail to arrive (Apr 2026).                                                                                                                                                                                       |

**Gap summary:** Amazon tells a seller _that_ something happened and sets a clock; nothing free from Amazon reads the seller's own text or documents _before_ submission, and the strongest protections (AHA, Seller Challenge) are reserved for sellers already above AHR 250.

---

## 10. Evidence of wanting a "second pair of eyes"

- **[seller voice]** "just would like another set of eyes if possible" and "publish a draft for your alls input" (inauthentic deactivation, ≈2020); a peer's advice: "post your DRAFT revision here BEFORE submitting to Amazon for additional review and feedback." https://sellercentral.amazon.com/seller-forums/discussions/t/7456b271bc9834075957cfdf51887215
- **[seller voice]** Threads titled "Please review my Suspension Appeal", "Review My Appeal/Plan of Action for Late Fulfillment Suspension", "Please review my appeal letter and plan of action", "Last chance to Appeal - Please review Plan of Action", "I would like to get your feedback before submitting my 3rd appeal", "Need feedback for letter of appeal before i submit it" (old forum, ≈2014–2019). Peer feedback is consistent: too long, future-tense promises, vague procedures, "your plan is incomplete". https://sellercentral.amazon.com/forums/t/please-review-my-suspension-appeal/272858/5 ; https://sellercentral.amazon.com/forums/t/review-my-appeal-plan-of-action-for-late-fulfillment-suspension/264204 ; https://sellercentral.amazon.co.uk/forums/t/last-chance-to-appeal-please-review-plan-of-action/195078 ; https://sellercentral.amazon.com/forums/t/i-would-like-to-get-your-feedback-before-submitting-my-3rd-appeal/67174
- **[seller voice]** Forum regulars warn against paid generic letters: "Third party services for appeal letters tend to be generic and may not relate to your account issues completely." https://sellercentral.amazon.com/seller-forums/discussions/t/5a7177eaf8227110336bf84cfbd956bc
- **[vendor]** Paid "review before you send" exists as a service: amazonsellerslawyer.com "The Amazonian Invoice Review: How to Inspect Your Documents Before Sending to Amazon"; attorney appeals $1,500–$2,300 (§4). https://amazonsellerslawyer.com/blog/intellectual-property/the-amazonian-invoice-review-how-to-inspect-your-documents-before-sending-to-amazon/
- No 2025–2026 "review my draft" threads surfaced (the new forum format and search limits may hide them); the demand is well documented historically and the paid market prices it at four figures.

**Verdict: Moderate–strong.** The behaviour (post a draft, ask strangers) is real and recurring; the free, deterministic version is AppealDeck's existing critic — the hook is to let it run on a _pasted_ draft with no account, and to extend the same "before you send" check to listings (§1) and invoices (§4).

---

## Ranked candidate table

| #   | Candidate (free, zero marginal cost)                                                                                                            | Pain evidence                                                                               | Sold today at                                                            | Free data source                                                                                             | Verdict                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 1   | **Invoice pre-check** on an uploaded invoice + notice date: 365-day window, quantity coverage, supplier fields, document type, buyer-name match | Strong: ≈Apr 2026 "loop" thread, AHR 260→140, Amazon staff field list                       | $75/invoice; $1,500–$2,300 appeals; £349–£749                            | None needed (rules); AppealDeck already reads documents                                                      | **Strong** — mostly built; expose standalone with the arithmetic shown      |
| 2   | **Paste-any-notification decoder** (A-to-z, SAFE-T, pesticide, IP, hazmat, safety alert, INFORM, tax, funds) with clock + next action           | Strong: missed A-to-z emails Apr 2026; misread by Seller Assistant                          | Guardian $17/day; agencies $1k–5k/mo; SentryKit $19–49                   | None needed                                                                                                  | **Strong** — the existing product, wider input                              |
| 3   | **Clock catalogue**: compute every Amazon window from typed dates, each rule dated and sourced                                                  | Strong: SAFE-T enforced before the help page changed; 60-day funds appeal; 30-day A-to-z    | No tool; vendor blog calendars only                                      | None needed                                                                                                  | **Strong** — pure date arithmetic; needs a maintained rule table            |
| 4   | **Prohibited-claim / pesticide-word pre-check** on pasted listing text (title, bullets, description, search terms)                              | Strong: ten pesticide threads, disease-claim staff post, "naturally anti-bacterial" bedding | keywords.am free (lead magnet); $19/mo ASIN scraper; Perci $59–199/mo    | None needed; EPA/FDA public rules                                                                            | **Strong** — must be framed as "triggers review", not "compliant"           |
| 5   | **Registered-mark words in your title** (USPTO lookup, class shown)                                                                             | Moderate–strong: "America 250" 2025, "Thermos", translation traps                           | $99/yr IP Alert; $10–13/mo risk scores (complaint DBs, not the register) | USPTO ODP/TSDR free keyed API, 60 req/min; public domain; no commercial ban found; bulk mirror not zero-cost | **Moderate–strong** — legal framing mandatory; per-request only             |
| 6   | **"Before you send" critic on a pasted draft**, no account                                                                                      | Moderate: recurring "please review my appeal" threads; paid at four figures                 | $1,500–$2,300                                                            | None needed                                                                                                  | **Moderate–strong** — exists; make it the free front door                   |
| 7   | **SDS completeness check** on an uploaded SDS (16 sections, < 5 yrs, exact %, name match)                                                       | Moderate: repeated SDS rejections, 14-day disposal clock                                    | No priced service found                                                  | None needed                                                                                                  | **Moderate** — low volume, high stakes per case                             |
| 8   | **Recall match** of pasted brand/product names against CPSC + openFDA + Safety Gate + Health Canada                                             | Weak: no forum demand; Amazon notifies within 24 h                                          | Nothing seller-facing; Apify resells feeds                               | All four free and verified live 9 Oct 2026                                                                   | **Weak** as hook; cheap to add as a sourcing pre-check                      |
| 9   | SAFE-T / A-to-z eligibility + deadline from pasted dates                                                                                        | Weak–moderate                                                                               | Refunzo 15 % capped $5,000 (needs account access)                        | None                                                                                                         | **Weak** alone — fold into #3                                               |
| 10  | Policy-change tracker                                                                                                                           | Moderate pain, but                                                                          | Free newsletters; Autopilot free page                                    | Seller Central news is login-gated                                                                           | **Avoid** — needs humans or a login; keep as the dated rule table behind #3 |
| 11  | Hazmat / dangerous-goods classifier                                                                                                             | Real pain                                                                                   | Lab tests "few hundred dollars"                                          | None                                                                                                         | **Avoid** — chemistry, not rules                                            |

---

## Source list (with dates as shown on the page; "≈" = relative forum age converted on 9 Oct 2026)

Amazon (staff posts, policies, announcements)

- Levi_Dylan_Amazon, "Restricted Product Scenarios: Disease Claims", ≈Oct 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/cbb1ffd8-af69-4720-a6af-d005d3eba67c
- Sarah_Amzn, invoice requirements, ≈2024 — https://sellercentral.amazon.com/seller-forums/discussions/t/884393ff-65c3-4cd3-9664-a49286335ff7
- News_Amazon, "Update to the Fund Withholding Policy page", effective 9 Oct 2024 — https://sellercentral.amazon.com/seller-forums/discussions/t/e5457317-25d9-4562-9207-86a19b3d38e9
- Seller Challenge launch for AHA, ≈Oct/Nov 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/b87fd1ae-4473-4f4f-a769-c74ab375693c
- "Major Update to Seller Assistant", ≈Oct 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/ecf5f31b-3e3b-4295-883a-7383bda948d4
- Aria_Amazon on A-to-z notifications and 30-day appeal, ≈Apr 2026 — https://sellercentral.amazon.com/seller-forums/discussions/t/0b59bca9-88ed-4b60-92db-c09258e24c05
- Joey_Amazon in "SAFE-T claims limit changed to 30 days?", ≈Dec 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/ca840906-2220-4d4d-a715-c49b325858c1
- Dougal_Amazon in hazmat exemption thread, ≈2022 — https://sellercentral.amazon.com/seller-forums/discussions/t/a1c0d7f4-ef18-41c2-b110-f79746025bd3
- "How to file a SAFE-T claim: steps and best practices" — https://sellercentral.amazon.com/seller-forums/discussions/t/45d6f0b0-08c9-4cba-8739-940d50dc95b8
- Product safety alerts/recalls policy (login-gated help page, quoted via search) — https://sellercentral.amazon.com/help/hub/reference/external/GRD4EMBNNW3P47GH
- Seller Central news (redirects to sign-in, 9 Oct 2026) — https://sellercentral.amazon.com/seller-news
- About Amazon, Account Health Rating announcement, mid-2022 — https://www.aboutamazon.com/news/small-business/amazon-helps-sellers-manage-their-account-health
- Amazon Pay tax identity FAQ (W-8 expiry, 30 % withholding) — https://pay.amazon.com/help/202096060

Seller voice (forum threads)

- Pesticide removals: https://sellercentral.amazon.com/seller-forums/discussions/t/40710dd4241cc3e4c60caa2b3d6c8e40 (≈2020); https://sellercentral.amazon.com/seller-forums/discussions/t/0bc457e230ab50e4883517bf0da81414 ; https://sellercentral.amazon.com/seller-forums/discussions/t/25a57d4d60ed97fd03ffe3d5cbe09391 ; https://sellercentral.amazon.com/seller-forums/discussions/t/d0dfc98c-feec-4642-8ba2-b10b5cac7798 (2019–2024)
- Invoice loop, ≈Apr 2026 — https://sellercentral.amazon.com/seller-forums/discussions/t/4b9adcdc-cd45-41a4-9e94-0331b180880f
- 365-day policy complaint, ≈2024 — https://sellercentral.amazon.com/seller-forums/discussions/t/e2017bb7-a8e7-4a8d-8d17-0b9f0b7b11cf
- Unable to verify supplier — https://sellersasksellers.com/t/invoices-rejected-unable-to-verify-the-supplier/2593
- Forged-invoice consultants rumour — https://sellercentral.amazon.com/seller-forums/discussions/t/11038b14d9e7c461438afb4d3788f680
- "America 250" trademark complaint, ≈Mar 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/09790823-27d9-4bb1-8600-7415bb4e4ae6
- "Thermos" in title (UK), ≈2021 — https://sellercentral.amazon.co.uk/seller-forums/discussions/t/106e893af53143a883e276854b4e1da0
- Trademark deactivation and reinstatement steps — https://sellercentral.amazon.com/seller-forums/discussions/t/47dfadaf01629897777c83731e8f1004
- Title edits without notice, Jan 2025 — https://sellercentral.amazon.com/seller-forums/discussions/t/b2b15728-0d43-453e-974f-59eb63f73059
- INFORM at-risk banner, ≈2023 — https://sellercentral.amazon.com/seller-forums/discussions/t/8f3bd3be-932b-48af-9f13-fe3e4eb10e73
- A-to-z volume/fraud threads 2025–2026 — https://sellercentral.amazon.com/seller-forums/discussions/t/12252e3e-80ca-4585-ac01-827fbd5b1ae1 ; https://sellercentral.amazon.com/seller-forums/discussions/t/11b7f07d-45dc-4831-8ca8-194db22f4f13 ; https://sellercentral.amazon.com/seller-forums/discussions/t/51203421-3ede-4031-beb9-6e0b81a91ed0 ; https://sellercentral.amazon.com/seller-forums/discussions/t/369737ae-1982-45ae-889f-8c3d6661f3a0
- A-Z response template thread, ≈2021 — https://sellercentral.amazon.com/seller-forums/discussions/t/134ede0335fdb76e29896f381b2076ee
- "Second pair of eyes" threads: https://sellercentral.amazon.com/seller-forums/discussions/t/7456b271bc9834075957cfdf51887215 (≈2020); https://sellercentral.amazon.com/forums/t/please-review-my-suspension-appeal/272858/5 ; https://sellercentral.amazon.com/forums/t/review-my-appeal-plan-of-action-for-late-fulfillment-suspension/264204 ; https://sellercentral.amazon.com/forums/t/please-review-my-appeal-letter-and-plan-of-action/265771 ; https://sellercentral.amazon.co.uk/forums/t/last-chance-to-appeal-please-review-plan-of-action/195078 ; https://sellercentral.amazon.com/forums/t/i-would-like-to-get-your-feedback-before-submitting-my-3rd-appeal/67174 ; https://sellercentral.amazon.com/forums/t/need-feedback-for-letter-of-appeal-before-i-submit-it/3519 ; https://sellercentral.amazon.com/seller-forums/discussions/t/5a7177eaf8227110336bf84cfbd956bc

Public data sources (verified 9 Oct 2026)

- CPSC API doc — https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information ; live JSON — https://www.saferproducts.gov/RestWebServices/Recall?ProductName=Toddler&format=json
- openFDA terms — https://open.fda.gov/terms/ ; limits — https://open.fda.gov/apis/authentication/ ; food enforcement — https://open.fda.gov/apis/food/enforcement
- Health Canada dataset (modified 15 Sep 2025, daily) — https://open.canada.ca/data/en/dataset/d38de914-c94c-429b-8ab1-8776c31643e3
- EU Safety Gate weekly XML index (Report-2026-40, 9 Oct 2026) — https://ec.europa.eu/safety-gate-alerts/api/download/weeklyReport/list/xml/en
- USPTO terms of use — https://www.uspto.gov/terms-use-uspto-websites ; trademark bulk data (1 Jan 2023) — https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data ; TSDR key guide (2020) — https://developer.uspto.gov/files/tsdr-api-key-manager-user-guide ; ODP getting started — https://data.uspto.gov/apis/getting-started ; ODP support/FAQ — https://data.uspto.gov/support
- FTC INFORM Act guidance — https://www.ftc.gov/business-guidance/resources/INFORMAct ; statute summary — https://winthrop.com/bold-perspectives/inform-act-requirements/

Vendors (prices read 9 Oct 2026 unless dated)

- keywords.am free tools — https://keywords.am/tools/ ; amazonlistingaudit.com — https://www.amazonlistingaudit.com/ ; Perci pricing via https://sellermetrics.app/amazon-ai-tools/ ; Helium 10 tiers via https://keywords.am/blog/best-amazon-listing-audit-tools/
- Restricted-word lists: https://sellersonar.com/blog/amazon-restricted-keywords-list/ (2026) ; https://salesduo.com/blog/unlocking-amazon-restricted-keywords-insights-for-sellers/ (2026)
- Hazmat guides: https://www.compliancegate.com/amazon-hazmat/ (2026) ; https://www.bellavix.com/amazon-hazardous-materials-compliance-guide-for-sellers-2026/
- Recalls: https://www.compliancegate.com/amazon-recalls/ (2026) ; https://amazonsellerslawyer.com/blog/amazon-news-updates/amazon-products-wrongly-marked-for-recall/ ; CPSC order press via https://www.wamc.org/2024-08-01/amazon-must-recall-unsafe-products-sold-by-independent-sellers-a-consumer-agency-says (1 Aug 2024)
- IP tools: https://www.sellerassistant.app/free-tools/ip-alert-lookup/ ; https://jordiob.com/amazon-tools/product/ip-alert/ ; https://trackmyorders.com/ ; https://sellerjournal.com/greenlight/ (403) ; https://damlawfirm.com/blog/amazon-trademark-infringement-compatible-with-titles/ (late 2025) ; https://www.fbaleadlist.com/amazon-seller-guide-the-truth-about-ip-complaints-and-how-to-avoid-them/
- Invoice services: https://www.amazonsellers.attorney/amazon-appeals.html ; https://theappealguru.com/ ; https://riverbendconsulting.com/blog/amazon-friendly-invoices/ ; https://amazonsellerslawyer.com/blog/intellectual-property/the-amazonian-invoice-review-how-to-inspect-your-documents-before-sending-to-amazon/ ; amzinvoiceassist.com (prices from search; domain did not resolve 9 Oct 2026)
- Monitoring: https://riverbendconsulting.com/guardian/ ; https://sentrykit.com/frequently-asked-questions/ ; https://www.webretailer.com/amazon/account-health/ ; https://salesduo.com/blog/amazon-account-management-services-cost/ (2026) ; https://www.supplykick.com/blog/amazon-account-management-services (2026) ; https://sellersonar.com/ ; https://www.ecomengine.com/sellerpulse
- Deadlines: https://myamazonguy.com/news/amazon-safe-t-claim-filing-window/ (21 Jan 2026) ; https://blog.sellermagnet.com/post/amazon-fba-storage-fees-2026/en ; https://www.sellerassistant.app/blog/what-is-a-to-z-claim-amazon-complete-guide-for-sellers/ ; https://www.supplykick.com/blog/amazon-seller-calendar-2026
- Policy tracking: https://www.autopilotbrand.com/resources/amazon-policy-tracker (updated 25 Sep 2026) ; https://www.fbamonthly.com/ ; https://cruxfinder.com/ ; https://www.getreviews.ai/blog/best-newsletters-for-amazon-sellers-to-follow-in-2026 ; https://www.cnbc.com/2026/04/15/amazon-sellers-boycott-ads-payment-changes.html (15 Apr 2026) ; EcommerceBytes closure notice (fetched 9 Oct 2026) — https://www.ecommercebytes.com/2026/01/24/amazon-narrows-safe-t-claims-window-for-sellers-to-30-days/
- SAFE-T/A-to-z: https://www.refunzo.com/blog/file-amazon-safe-t-claim-damaged-missing-returns/ (4 Dec 2025) ; https://seller-union.com/a-z-claim-guide-thread-appeal-templates-for-a-z-claims/
- AHA / Seller Challenge explainers: https://damlawfirm.com/blog/amazon-account-health-assurance-sellers-guide/ (≈Jul 2026) ; https://sentrykit.com/articles/amazon-account-health-assurance-2026/ ; https://www.ecomcrew.com/amazons-seller-challenge-gives-you-a-second-shot-at-listing-enforcements-with-real-limits/
- Seller Assistant explainers: https://www.sellersprite.com/en/blog/amazon-ai-seller-assistant-agentic-2026 ; https://novadata.io/resources/news/amazon-seller-assistant-agentic-ai

Limits of this research: reddit.com blocks the crawler; several searches hit rate limits (noted where a query returned nothing); Seller Forums show only relative dates; Amazon help pages are login-gated, so Amazon's rules are cited from its staff's public forum posts.

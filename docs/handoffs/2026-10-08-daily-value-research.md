# Daily-value research, 8 Oct 2026

Status: research only. Nothing here is built, and none of it is released from `docs/PARKED-ITEMS.md`.
Origin: the founder shared a Meta AI conversation about making the tool part of a seller's daily life and asked for deeper research.

## In one line

Amazon changed several seller rules in 2026 that our tool does not know about yet. The best plan is to fix those gaps and add a "keep your documents ready" reminder feature, and to take nothing from Meta AI that breaks our no-automation rules (AM-27, D6).

- **What:** four things we can build safely.
  1. A new notice type, for when Amazon switches off one failing FBM listing instead of the whole account.
  2. Updated rules for product-safety testing and related accounts.
  3. A document shelf that emails the seller before an invoice passes Amazon's 365-day limit.
  4. A free public "check my invoice" page.
- **Why:** sellers return when we save them from a rejection or a missed date, and the 2026 notice types are ones competitors probably do not cover yet.
- **How:** everything works only from what the seller pastes or uploads, never from Seller Central.
- **Caution:** most of the research comes from consultant and vendor blogs. Each rule must be checked against a second source, ideally Amazon's own wording, before any wording in the product changes.

## Rejected from the Meta AI conversation

These break our locked rules or add no value:

- Injected buttons, reading Seller Central pages, "agentic" fixes: this is the DOM-harvest and injector removed under AM-27. Amazon's Agent Policy binds the seller.
- Batch "Request a Review" clicking, review removal automation, auto-opened cases, auto-claims, "Apply Fix Now", hijacker auto-kicker: automation against Amazon, forbidden by D6.
- Hijacker and Buy Box watching by scraping: monitoring is deferred (D7) and it is scraping.
- Profit ticker and inventory countdown: need the Selling Partner API (SP-API) or a manual feed (D7), and compete with crowded tools.
- "Draft a submission that bypasses automated keyword filters": detection evasion, ruled out by D6.
- Unsourced statistics such as "28% of new sellers": do not use in marketing.
- Ka-ching sound, spy glass, news feed: no value for a seller in a suspension.

## What I found

### 1. New or changed rules our product does not cover yet

I searched the code for the lab-validation, responsible-account and INFORM wording and found none.

- **FBM offers are now deactivated one at a time.** From 31 Aug 2026, a failing Fulfilled-by-Merchant offer is temporarily deactivated instead of the account being put at risk. The four policies involved are Cancellation Rate, Late Shipment Rate, Order Defect Rate and On-Time Delivery Rate. Deactivated offers appear in Account Health under "Other Policy Violations" ([PPC Land](https://ppc.land/amazon-blocks-the-failing-fbm-offer-not-the-account-from-august-31/)). Nothing in `src/` handles this notice family, so a seller who pastes one today gets the generic path.
- **Product-safety testing is now direct.** Per a policy tracker, from 21 Jul sellers request lab validation through Account Health > Policy Compliance, and self-uploaded test documents are no longer accepted ([tracker](https://www.autopilotbrand.com/resources/amazon-policy-tracker)). Our evidence list still asks the seller to upload a test report, which may now mislead. Single-sourced: confirm against Amazon's own text before changing anything.
- **Related accounts: appeal the responsible account first.** The same tracker says this comes before appealing the others. Our related-account guidance does not say it.
- **Dated deadlines we could remind sellers about:**
  - INFORM Act annual certification, for US sellers with 200+ transactions and $5,000+ revenue.
  - The SAFE-T claim window, now 30 days for US seller-fulfilled orders (it was 60).
  - Accurate handling times, in force since 29 Jun.

### 2. What sellers say hurts

- **Authenticity complaints** are described as the largest cause of full deactivation this year ([Amazon Sellers Attorney](https://www.amazonsellers.attorney/blog/amazon-account-health-changes-2026-new-fbm-deactivation-policy), [Geek Seller](https://www.geekseller.com/blog/amazon-account-health-2026-suspension-prevention/)). Not confirmed.
- **Product-safety removals often arrive vague.** The listing is suppressed first, and Account Health says only "Product and Food Safety" without the exact issue ([Amazon forum](https://sellercentral-europe.amazon.com/seller-forums/discussions/t/b0e96886-8fe0-4a2f-b996-65263c93c5e6)). That is the problem our decoder exists to solve.
- **Tool overload.** The common complaint is six tools that do not talk to each other ([Jarvio](https://jarvio.io/blog/top-10-amazon-seller-tools)). A narrow tool that does one job well is the opposite of that.
- **Document gaps cause rejections.** Amazon looks back 365 days. Rejections come from invoices that do not cover the quantity sold, handwritten invoices, and edited files. Sellers are advised to keep invoices indexed by ASIN, unedited, with the supplier's full contact details ([forum threads](https://sellercentral.amazon.com/forums/t/product-authenticity-complaint/406429), [Seller Engine](https://sellerengine.com/more-stringent-invoice-requirements-amazon)).

### 3. Not found

No hard evidence of what sellers wish existed: neither Reddit nor the seller forums surfaced. The "daily tool" claims are vendor blogs. Nothing turned up on Amazon's Seller Assistant. A reimbursement CSV tool and the seller communities' wish lists were not researched further.

## What to build, ranked by value and effort

All of these work only from what the seller pastes or uploads, with no Amazon access.

1. **Offer-level FBM deactivation family (small).** Add a notice family, a decode headline, the right records (shipping and tracking proof, cause of the metric) and the reactivation path. A real, current gap.
2. **Rule-currency pass (small, needs verification first).** Correct product-safety (lab validation) and related-account (responsible account first) guidance, each checked against a second source or Amazon's own wording.
3. **Document shelf with expiry reminders (small to medium).** The seller keeps invoices and licences in the vault, indexed by ASIN, using the dates our document check already reads. We email before an invoice passes 365 days, and add reminders for INFORM certification and similar dates. Uses existing reminders and the vault. May need a schema change (see P-07).
4. **Free standalone invoice pre-check page (medium).** A public front door to the check we already have. Needs no sign-in for the on-device reading.
5. **Policy-change digest (small, ongoing).** A "what changed in 2026" page, every line dated and sourced. This is P-01 (changelog), parked until the founder types `EXECUTE PARKED P-01 changelog page`.

## Next step

Founder to choose which of items 1 to 4 comes first. Then a short spec is written, and the build starts only on the founder's go-ahead.

## Sources

[Eva Guru](https://eva.guru/blog/amazon-account-health/), [MrJeffAmz August 2026 news](https://mrjeffamz.com/blog/amazon-seller-news-2026), [Amazon Sellers Attorney](https://www.amazonsellers.attorney/blog/amazon-account-health-changes-2026-new-fbm-deactivation-policy), [PPC Land](https://ppc.land/amazon-blocks-the-failing-fbm-offer-not-the-account-from-august-31/), [policy tracker](https://www.autopilotbrand.com/resources/amazon-policy-tracker), [Amazon forum](https://sellercentral-europe.amazon.com/seller-forums/discussions/t/b0e96886-8fe0-4a2f-b996-65263c93c5e6), [Jarvio](https://jarvio.io/blog/top-10-amazon-seller-tools), [Seller Engine](https://sellerengine.com/more-stringent-invoice-requirements-amazon).

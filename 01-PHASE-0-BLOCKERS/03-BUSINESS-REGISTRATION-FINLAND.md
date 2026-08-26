# Finnish Business Registration — Toiminimi via ytj.fi (Day 1–3)

**Why this file exists / when to use it:** AppealDeck's revenue flows through a merchant-of-record (MoR — a payment provider such as Paddle or Polar that legally resells the product and handles customer-country VAT), and both MoRs require a registered business to onboard. The readiness audit found no Finnish business registration in place (gap G-01), which blocks the Week-1 Paddle/Polar applications, a business bank account, invoicing, and insurance quotes. This file registers the founder as a Finnish private trader for €75 in one online filing. It is deliberately the lightest legal form that unblocks everything. [source: APPEALDECK_READINESS_AUDIT.md G-01; VERIFICATIONS.md verifier 4]

**Owner of the whole file:** Founder. **Cost:** €75 + small recurring items below. **Deadline:** file by Day 1–3 (processing then runs in the background). **Blocks:** Paddle/Polar merchant approval (Week 1, see `../02-PHASE-1-FOUNDATION/`), business bank account, invoicing, E&O insurance quotes, tax compliance.

Terms used below: **toiminimi** = Finnish private trader / sole proprietorship (you trade personally under a business name; no separate legal entity). **OY (osakeyhtiö)** = Finnish limited company. **y-tunnus** = Business ID, the Finnish company registration number. **PRH** = Finnish Patent and Registration Office (runs the Trade Register). **ytj.fi** = the joint PRH/Tax Administration online filing portal. **MyTax (OmaVero)** = the Finnish Tax Administration's online service. **VAT** = value-added tax. **YEL** = statutory self-employed pension insurance. **KKV** = Finnish Competition and Consumer Authority.

---

## 1. Why toiminimi, not OY (settled decision — do not reopen)

| Factor | Toiminimi | OY (limited company) |
|---|---|---|
| Registration cost | **€75** (online start-up notification, PRH 2026 price list) | €300 (guided online) – €400 (standard/paper) |
| Processing | ~3–5 business days | Longer, plus incorporation formalities |
| Admin overhead | Light bookkeeping; no board, no minutes | Double-entry bookkeeping, financial statements, shareholder-meeting minutes |
| Tax at ~€0 revenue | Business income taxed as personal income — nothing to optimize yet | 20% corporate tax only becomes an advantage once profits are RETAINED in the company |
| MoR onboarding | Paddle/Polar both onboard Finnish sole traders | Also fine — but no advantage today |
| Liability | Personal (unlimited) | Limited |

At zero revenue there is no tax or onboarding benefit to an OY; there is only cost and overhead. Personal liability is the real trade-off, and it is mitigated in the near term by the product's design (no "guarantee" language anywhere, not-legal-advice disclaimers, refund-friendly policy) and by E&O insurance before public launch (€500–2,500/yr, quoted separately — see `../02-PHASE-1-FOUNDATION/`).

**Revisit OY when either trigger fires:** (a) retained profits exceed roughly €30–50k/yr — the 20% corporate rate starts beating personal income tax on money left in the business; or (b) the liability profile changes materially (e.g., US marketing at scale, an Expert Review human-service line, or the first credible legal threat). Conversion later is routine; note the trigger in the founder's quarterly review and move on.

---

## 2. Procedure

- [ ] **Step 1 — Check for an existing registration first.** The founder already operates under the name "Hawlton Alliance" (B2B lead generation). Search `ytj.fi` (company search) for an existing y-tunnus under that name / the founder's person. If a valid toiminimi registration already exists: skip Steps 2–3, confirm the Trade Register entry and business name are active, and go straight to Step 4 (tax registers) — adding a new line of business does not require a new company.
  **Owner:** Founder · **Cost:** €0 · **Deadline:** Day 1 · **Blocks:** Steps 2–4

- [ ] **Step 2 — Prerequisites for filing.** You need Finnish online identification (Finnish personal identity code + bank credentials or mobile certificate) to file on ytj.fi. A founder resident in Finland has these; a founder without a Finnish personal ID would need embassy/representative arrangements (not expected here, noted for completeness). [source: APPEALDECK_STREAM1_LEGAL_BUSINESS_FOUNDATION.md hidden costs]
  **Owner:** Founder · **Cost:** €0 · **Deadline:** Day 1 · **Blocks:** Step 3

- [ ] **Step 3 — File the start-up notification on ytj.fi (€75).** Choose "private trader" (yksityinen elinkeinonharjoittaja / toiminimi). In the same filing: (a) register the business name in the PRH Trade Register — do NOT skip this, Paddle's merchant application expects a registered business name; (b) state the line of business broadly enough to cover software/SaaS and consulting (e.g., "software development and publishing; information-management services; marketing services") so AppealDeck and the existing lead-gen work both fit; (c) enroll in the tax registers per Step 4 choices. Pay the €75 online. A "light entrepreneur" (kevytyrittäjä) invoicing platform is NOT a substitute — it issues no y-tunnus of your own, which blocks MoR onboarding.
  **Owner:** Founder · **Cost:** €75 · **Deadline:** Day 1–3 · **Blocks:** y-tunnus issuance, everything downstream

- [ ] **Step 4 — Tax registers (part of the same notification).** Enroll in the **prepayment register** (ennakkoperintärekisteri — lets clients/MoRs pay you without withholding) and file a realistic first-year income estimate for advance tax. **VAT register: do NOT enroll yet by default** — registration is mandatory only above €20,000 Finnish-taxable turnover in 12 months (threshold raised from €15k on 1 Jan 2025), MoR sales are not Finnish consumer sales, and whether you need a VAT ID anyway depends on which MoR entity you contract with (see §3). Leave VAT unchecked and let the accountant call in Step 6 decide; adding VAT registration later in MyTax is quick and free.
  **Owner:** Founder · **Cost:** €0 · **Deadline:** with Step 3 filing · **Blocks:** clean tax standing; MoR payout paperwork

- [ ] **Step 5 — Receive the y-tunnus and open accounts.** Processing is ~3–5 business days (PRH online queue; you may trade as soon as the filing is in and the Business ID is issued). Then: (a) open a business bank account (any Finnish bank; expect ~€5–15/mo service fee (estimate)) — a toiminimi is legally you, but separated money is what makes bookkeeping and MoR payouts sane; (b) open a **Wise Business** account the same week — it is the payment rail for Pakistan contractors (0.35–1% FI→PK; PayPal does not serve Pakistan) and pre-verifying it early was a named Week-1 mitigation. [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §3]
  **Owner:** Founder · **Cost:** €0–15/mo (estimate) · **Deadline:** Week 1, as soon as y-tunnus arrives · **Blocks:** MoR payout destination, contractor payments (see `./02-PARTNERSHIP-AGREEMENT.md`)

- [ ] **Step 6 — Engage an accountant (one call now, retainer before first filing).** Bookkeeping is a legal obligation from day one (single-entry is permitted for a small toiminimi; keep every receipt and MoR statement). You do not need a bookkeeper on Day 1, but you DO need: (a) one paid consultation call THIS WEEK to answer the §3 question list — it settles the VAT-ID/MoR question before the Paddle/Polar applications go in; (b) a small accountant engagement in place before the first tax filing of the year. Typical toiminimi bookkeeping runs €50–150/mo (estimate — get 2 quotes; low transaction volume through an MoR keeps it at the bottom of the range).
  **Owner:** Founder · **Cost:** ~€100–200 one-off call (estimate), then €50–150/mo (estimate) · **Deadline:** call in Week 1; retainer before first filing · **Blocks:** correct VAT setup, MoR application answers, first tax filing

- [ ] **Step 7 — YEL pension check.** YEL (self-employed pension insurance) becomes mandatory once your annual YEL income (your declared work-income value, not profit) exceeds the statutory threshold — approximately €9,000/yr (verify current figure with the accountant or elo.fi/varma.fi/ilmarinen.fi) — and the activity lasts at least 4 months. At pre-revenue this is likely not yet triggered, but confirm the current threshold and the sign-up deadline rule on the Step 6 call and calendar the re-check for the month revenue starts. YEL is a real recurring cost (roughly a quarter of declared YEL income (estimate)) — plan for it in the P&L the moment sales begin.
  **Owner:** Founder · **Cost:** €0 now; YEL premiums once triggered · **Deadline:** ask on Week-1 accountant call; re-check at first revenue · **Blocks:** nothing today; legal compliance once trading

---

## 3. VAT and the merchant-of-record — the one accountant call

Background for whoever executes this: with an MoR, the founder never sells to the end customer. The MoR is the legal reseller — it collects and remits customer-country VAT/sales tax worldwide. The founder's only sale is a **B2B service supply to the MoR entity itself**. That creates exactly one Finnish wrinkle:

- If the contracting MoR entity is **EU-established** (e.g., a Stripe Ireland entity), intra-EU reverse-charge rules likely require a **Finnish VAT ID + monthly recapitulative statements** (EU sales lists) even below the €20,000 domestic threshold.
- If the contracting entity is **UK or US** (Paddle contracts through its UK entity; Polar through Polar Software Inc., US), the sale is an export of services with **no such filing**.
- Domestic Finnish VAT registration remains mandatory only above €20,000 Finnish-taxable turnover in any 12 months (standard rate 25.5% — relevant only if you ever sell directly to Finnish customers outside the MoR).

This is a formality, not a launch blocker — but settle it BEFORE the MoR applications so the tax fields are filled correctly. [source: VERIFICATIONS.md verifier 4]

**Exact questions to ask the accountant (read them out; note answers in this file):**

1. "I will sell software through a merchant of record. Depending on approval it will be **Paddle (UK entity)** or **Polar (US entity)**, possibly later Stripe (likely an Irish entity). For each of those three counterparties: do I need a Finnish VAT ID, and do I need to file recapitulative statements / EU sales lists, even though I'm below the €20,000 threshold?"
2. "Should I register for VAT voluntarily anyway to reclaim input VAT on business purchases (hosting ~$45/mo, domain, tools, insurance)? At my expected cost base, is it worth the filing overhead?"
3. "How do I book MoR payouts correctly — do I record the gross sale and the MoR's ~5% fee separately, or just the net payout, and what document (MoR statement vs self-billed invoice) is my bookkeeping voucher?"
4. "What advance-tax income estimate should I file for year one, and how do I adjust it mid-year if revenue beats or misses it?"
5. "What is the current YEL income threshold and premium rate, when exactly does my obligation start, and what is the deadline for taking out the policy once it does?"
6. "Is single-entry bookkeeping acceptable for my volume, what records must I retain and for how long, and when is my first filing actually due?"
7. "Any Finland-Pakistan issue I should paper when paying a Pakistani contractor/advisor via Wise under a written agreement (withholding, documentation for the double-taxation agreement)?"

- [ ] **Step 8 — Make the accountant call and record the answers** (append them under this section). Update the Paddle/Polar application data accordingly.
  **Owner:** Founder · **Cost:** included in Step 6 call · **Deadline:** Week 1, before MoR applications submit · **Blocks:** correct MoR application, VAT decision (Step 4 follow-up)

---

## 4. What this file deliberately does NOT cover

- Paddle/Polar applications themselves, domain purchase, hosting, insurance quotes → `../02-PHASE-1-FOUNDATION/`.
- Consumer-law compliance for the checkout (EU 14-day withdrawal right, the June-2026 electronic withdrawal button, refund policy) → handled with the payments/legal-pages work in `../02-PHASE-1-FOUNDATION/`; note only that the checkout consent design is a settled decision (7-day voluntary refund; explicit prior consent + permanent-form confirmation for digital delivery).
- UPL (unauthorized practice of law) positioning → `../07-REFERENCE/` legal posture material. Registration is unaffected by it.

---

## Definition of done

- [ ] Existing-registration check completed; result recorded (existing y-tunnus reused OR new filing made).
- [ ] Start-up notification filed on ytj.fi as private trader, business name in the Trade Register, €75 paid.
- [ ] Prepayment register enrollment filed; advance-tax estimate submitted.
- [ ] y-tunnus received and recorded in the project's account inventory.
- [ ] Business bank account open; Wise Business account open and verified.
- [ ] Accountant call done; all 7 questions answered and noted in §3; VAT-register decision made (registered / deliberately not registered, with reason).
- [ ] YEL threshold verified with a current figure; re-check date calendared for first revenue month.
- [ ] OY-revisit triggers (retained profits >€30–50k/yr, or liability escalation) noted in the founder's review cadence.

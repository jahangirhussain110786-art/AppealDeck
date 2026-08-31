# Individual Seller Setup — Pakistan (Day 1–3)

**Why this file exists / when to use it:** AppealDeck's revenue flows through a merchant-of-record (MoR — a payment provider such as Paddle that legally resells the product and handles customer-country VAT), and MoRs can onboard individual sellers without a registered company. The founder operates as an individual (sole proprietor) under his own name, with Hawlton as a brand/trading name only. This file covers the individual-seller setup: CNIC/passport, proof of address, personal payout account (Payoneer or Wise personal), and the Pakistan tax obligations that apply. Incorporation as a Pakistan-registered company is deferred until revenue or liability profile justifies it (~100 paying users is the right trigger). [source: Adjustments.txt; APPEALDECK_READINESS_AUDIT.md G-01]

**Owner of the whole file:** Founder. **Cost:** $0 for setup (Payoneer/Wise have no registration fee). **Deadline:** complete by Day 1–3 (processing then runs in the background). **Blocks:** Paddle merchant approval (Week 1, see `../02-PHASE-1-FOUNDATION/`), payout destination.

Terms used below: **CNIC** = Computerized National Identity Card (Pakistan). **NTN** = National Tax Number. **SECP** = Securities and Exchange Commission of Pakistan. **Payoneer/Wise** = personal payout accounts. **MoR** = merchant of record.

---

## 1. Why individual, not company (settled decision — do not reopen)

| Factor | Individual (sole proprietor) | Private limited company |
|---|---|
| Registration cost | $0 | SECP fees + legal fees |
| Processing | Immediate | Weeks + incorporation formalities |
| Admin overhead | Minimal — personal tax return | Corporate tax, financial statements, board minutes |
| Tax at low revenue | Personal income tax — nothing to optimize yet | Corporate tax only becomes an advantage once profits are retained |
| MoR onboarding | Paddle onboard individuals with CNIC/passport + proof of address | Also fine — but no advantage at zero revenue |
| Liability | Personal (unlimited) | Limited |

At zero revenue there is no tax or onboarding benefit to a company; there is only cost and overhead. Personal liability is the real trade-off, and it is mitigated by the product's design (no "guarantee" language anywhere, not-legal-advice disclaimers, refund-friendly policy) and by E&O insurance before public launch ($500–2,500/yr, quoted separately — see `../02-PHASE-1-FOUNDATION/`).

**Revisit company registration when either trigger fires:** (a) retained profits exceed roughly PKR 5–10M/yr — corporate tax rate starts beating personal income tax on money left in the business; or (b) the liability profile changes materially (e.g., US marketing at scale, an Expert Review human-service line, or the first credible legal threat). Conversion later is straightforward; note the trigger in the founder's quarterly review and move on.

---

## 2. Procedure

- [ ] **Step 1 — Gather identity documents.** You need: (a) CNIC or passport, (b) proof of address (utility bill, bank statement, or government correspondence dated within the last 3 months), (c) a personal payout account in your own name (Payoneer or Wise personal account — both are available to Pakistani individuals). Have these ready before applying to Paddle.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Step 3

- [ ] **Step 2 — Open a personal payout account.** Choose Payoneer or Wise personal account. Both serve Pakistani individuals. Wise is preferred for low-cost international transfers (0.35–1% FX); Payoneer is widely accepted by MoRs. The account must be in the founder's personal name (Jhangir Hussain) — not a company name, because the seller is an individual at this stage. Hawlton is a brand/trading name only ("AppealDeck by Hawlton"), not the contracting party.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1–3 · **Blocks:** MoR payout destination

- [ ] **Step 3 — Apply to Paddle as an individual seller.** When applying: (a) select "Individual" as the business type; (b) use the founder's personal name (Jhangir Hussain), not Hawlton Alliance; (c) describe the product strictly as "Digital products or SaaS" — AppealDeck is software that generates documents; (d) do NOT tick "Human services" — the human-in-loop reviewer is an internal QA step bundled into the subscription price, not a separately-priced SKU.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-W checkout, all revenue

- [ ] **Step 4 — Pakistan tax registration (NTN).** Register for an NTN with the Federal Board of Revenue (FBR) if not already obtained. As an individual, you file personal income tax returns. MoR payouts are income — track them. If revenue grows to the point where corporate structure makes sense, the NTN can be upgraded or a separate company NTN obtained.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** clean tax standing

- [ ] **Step 5 — Engage a Pakistan accountant (one call now, ongoing relationship).** You do not need a full-time accountant on Day 1, but you do need: (a) one paid consultation call THIS WEEK to confirm tax obligations on MoR payouts, record-keeping requirements, and any withholding; (b) a clear answer on whether income from a foreign MoR (Paddle) is treated as Pakistan-source or foreign-source income. Typical individual bookkeeping for a solo SaaS founder runs PKR 5,000–15,000/month (estimate — get 1–2 quotes).
  **Owner:** Founder · **Cost:** ~PKR 10,000–30,000 one-off call (estimate), then PKR 5,000–15,000/mo (estimate) · **Deadline:** call in Week 1 · **Blocks:** correct tax setup, first filing

---

## 3. What this file deliberately does NOT cover

- Paddle applications themselves → `../02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md`.
- Consumer-law compliance for the checkout → handled with the payments/legal-pages work in `../02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md`; note that the checkout consent design is a settled decision (7-day voluntary refund; explicit prior consent + permanent-form confirmation for digital delivery).
- UPL (unauthorized practice of law) positioning → `../07-REFERENCE/` legal posture material. Registration is unaffected by it.
- Company incorporation → deferred until the triggers in §1 fire.

---

## Definition of done

- [ ] Identity documents gathered (CNIC/passport + proof of address).
- [ ] Personal payout account open and verified (Payoneer or Wise personal, in Jhangir Hussain's name).
- [ ] Paddle application submitted as an individual seller with the correct product category.
- [ ] NTN obtained or application submitted.
- [ ] Accountant call done; tax obligations on MoR payouts confirmed.
- [ ] Company incorporation trigger noted in the founder's review cadence.

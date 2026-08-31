# Payments Setup — Paddle application, SKU configuration, webhooks, refunds

**Why this file exists / when to use it:** Decision D2 (see `../00-DECISION/02-DECISION-LOG.md`) is to apply to **Paddle** in Week 1, behind the live site and legal pages from `./02-DOMAIN-AND-LEGAL-PAGES.md` — because a payment rail must exist before the Week 4–5 checkout (the first revenue surface, decision D3). This file is the execution checklist: how to apply, how to frame the product so risk teams approve it, which products to create (and which NOT to create), how the webhook → license backend must behave, how refunds are configured, and the pre-agreed decision rule if the application fails. Work it in Week 1–2; the test-mode end-to-end check (§7) closes before the first real sale.

Glossary: **MoR** = Merchant of Record — a payment provider (Paddle) that legally resells your product, so it handles customer-country VAT/sales tax, invoicing, and disputes; you invoice the MoR, not the customer. **AUP** = Acceptable Use Policy (what the MoR refuses to sell). **SKU** = a purchasable product entry in the MoR dashboard. **Webhook** = an HTTP call the MoR sends to our backend when something happens (purchase, refund, chargeback). **Idempotent** = safe to process the same event twice without duplicating its effect. **KYC** = know-your-customer identity verification. **Sandbox / test mode** = the MoR's fake-money environment. **POA** = Plan of Action, the appeal document Amazon requires. **SLA** = service-level agreement (here: our own promised response time). **FTC** = the US Federal Trade Commission.

---

## 1. The category framing rule (read before touching any application form)

Every MoR's AUP restricts to **automated digital products** and prohibits human services (Paddle AUP: "human services… including pure consulting or advisory services"). Separately, **Paddle settled with the FTC in 2025** over processing for deceptive tech-support schemes — its risk team is now demonstrably wary of anything that smells like "account recovery." [source: APPEALDECK_STREAM9_PAYMENT_TAX_REPORT.md; VERIFICATIONS.md verifier 4]

Therefore, in every application field, dashboard product description, and support conversation with Paddle:

| Always say | Never say |
|---|---|
| "Automated document-preparation software (SaaS) for Amazon marketplace sellers" | "Account recovery service" |
| "Software that classifies enforcement notices and generates draft appeal documents the user edits and submits themselves" | "Reinstatement service" / "we get accounts back" |
| "Fully automated software output — no human services, no consulting" | "Appeal service" (as a done-for-you offering) |
| "One-time software license per case" | "Expert access", "consulting", "advisory" |

This is not spin — it is the accurate description of the product (decision D6: read-only, user submits everything themselves) and the only description that is MoR-eligible. Expect the risk team to ask follow-up questions precisely because of the FTC history; §2.3 has the prepared answers.

---

## 2. Paddle application (primary candidate)

**Facts (verified Aug 2026):** fee 5% + $0.50 per transaction, no monthly fee, global VAT handled. Onboarding runs in 3 phases: (1) domain review — a real, navigable website is required; (2) business verification — not strictly required for individuals, but recommended; (3) identity verification — government ID + proof of address for the individual seller. Payouts are monthly, minimum $100 equivalent balance. Review typically takes 3–5 business days but can stretch to weeks for flagged categories (unverified — third-party rejection analyses). Documented rejection triggers for solo founders: incomplete/thin sites, refund-policy text that contradicts itself, and identity mismatches between the application and the website. [source: APPEALDECK_STREAM9_PAYMENT_TAX_REPORT.md §1.1; APPEALDECK_STREAM2_PAYMENT_FREE_CHEAP_REPORT.md]

### 2.1 Pre-application checklist (all must be true before submitting)

- [ ] **1.** Live site is real and complete: home, pricing, about/contact, refund policy, privacy policy, ToS — per `./02-DOMAIN-AND-LEGAL-PAGES.md`, no placeholders, no "beta" labels. — **Owner:** Founder (verifies) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** Paddle submission
- [ ] **2.** Identity consistency verified: the name and identity (Jhangir Hussain / Hawlton brand, Pakistan) on the application match the site's About page, the domain's contact email, and the CWS listing exactly. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** Paddle approval (mismatch is a documented rejection trigger)
- [ ] **3.** Refund policy on the site states the 7-day no-questions voluntary refund (decision D8) with no contradicting qualifiers anywhere (e.g. no "all sales final" leftovers). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** Paddle domain review
- [ ] **4.** Identity documents ready: government ID + proof of address for the individual seller (Jhangir Hussain). The seller is an individual, not a company — personal payout via Payoneer or Wise personal account. — **Owner:** Founder · **Cost:** $0 · **Deadline:** before submission · **Blocks:** identity verification phase

### 2.2 Submit

- [ ] **5.** Create the Paddle account and submit the application. Category: **SaaS / business software**. Product description: use the §1 framing verbatim — "Automated document-preparation software for Amazon marketplace sellers: the user pastes an enforcement notice, the software classifies it and generates a draft Plan of Action the user edits and submits themselves. Fully automated output; no human services." — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** Gate 1 check 5 (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`), M-5 payments, Week 4–5 checkout
- [ ] **6.** In parallel, create a Paddle **sandbox** account and hand the AI assistant sandbox API credentials via deployment-env secrets (never the repo — see `./04-REPO-AND-FIXTURE-CORPUS.md`). Sandbox is free and unlimited; integration work does not wait for live approval. — **Owner:** Founder (creates), AI assistant (integrates) · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** webhook integration (§5), test-mode E2E (§7)

### 2.3 Prepared answers for risk-team questions

Expect scrutiny; answer fast, factually, and consistently with the site. Keep this table at hand:

| Likely question | Answer |
|---|---|
| "Is this an account-recovery / reinstatement service?" | No. It is software. It never contacts Amazon, never submits anything, and provides no human service. The user pastes their notice; the software classifies it and drafts a document the user edits and submits themselves. |
| "Do you promise reinstatement outcomes?" | No. The ToS and every product surface state that appeal decisions are made solely by Amazon and no outcome is promised. There are no success-rate claims anywhere. |
| "Is any human involved in the deliverable?" | No. The $199 Appeal Pass is fully automated software output. (A human-review add-on does not exist and is not on this account — see §4.3.) |
| "What is the refund policy?" | 7-day voluntary refund, no questions asked, plus consumer withdrawal-right mechanics at checkout (explicit prior consent to immediate digital delivery + durable-medium confirmation). |
| "Who are you?" | Individual seller (Jhangir Hussain, Pakistan), founder's real name published on the site's About page — identical identity across site, application, and CWS listing. |

- [ ] **7.** If Paddle requests changes (copy edits, extra documentation), comply the same day and never argue; log the exchange in `../00-DECISION/02-DECISION-LOG.md` §4. — **Owner:** Founder · **Cost:** $0 · **Deadline:** as it happens · **Blocks:** approval timeline

---

## 3. Polar setup (warm fallback — configured in Week 1, activatable in 48h)

**Fallback ladder: Polar (warm, pre-configured) → Dodo Payments (plan-C, application-ready).** Stripe direct is not available to Pakistan-resident sellers, so any fallback must itself be a merchant of record.

**Polar facts (verified Aug 2026, post-27-May-2026 pricing):** free Starter tier 5% + 50¢ per transaction, no monthly fee, instant signup with no sales gate; Pro $20/mo at 3.8% + 40¢. Extras: +1.5% on international cards, $15 per chargeback, payouts are **manual** withdrawals via Stripe Connect Express, minimum €13, 7-day settlement delay for new organizations, first payout review up to 14 days. Chargeback review threshold 0.4%. No built-in dunning (irrelevant until the Guardian subscription ships). [source: APPEALDECK_STREAM9_PAYMENT_TAX_REPORT.md §1.2; APPEALDECK_STREAM2_PAYMENT_FREE_CHEAP_REPORT.md; VERIFICATIONS.md verifier 4]

**⚠ Pakistan payout caveat (verify at signup, before counting this rail as warm):** Polar payouts run on Stripe Connect cross-border. Third-party reports (Aug 2026) say Pakistan payout works, but this is unverified with our own details — confirm inside the Polar onboarding flow that a Pakistan-resident individual can complete Stripe Connect Express KYC and reach a withdrawable balance. If it cannot, log the finding in the decision log and promote Dodo Payments to warm fallback.

**Dodo Payments facts (plan-C; checked 29 Aug 2026 — re-verify at application time):** MoR, 4% + 40¢ per transaction, no monthly fee, explicitly markets onboarding and payouts for Pakistan-region sellers. No account is opened until the plan-C trigger fires (Paddle rejected AND Polar payout unverifiable) — keep the application details ready, nothing more.

- [ ] **8.** Create the Polar organization on the free Starter tier under the same seller identity (Jhangir Hussain, individual); complete KYC (Stripe Identity: ID + selfie) and connect the Stripe Connect Express payout account — **verifying the Pakistan payout path end-to-end** per the caveat above. If Pakistan payout is unavailable, log it and prepare the Dodo Payments application instead. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** Gate 1 check 6; kill-criterion K1 response readiness
- [ ] **9.** Configure the same products as §4 on the warm-fallback rail (Appeal Pass live-ready but unpublished; Guardian created, hidden), and register the same backend webhook endpoint (§5) with that rail's webhook secret, so switching rails is configuration, not engineering. — **Owner:** AI assistant (Founder verifies) · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** 48-hour fallback activation
- [ ] **10.** Polar Pro upgrade rule (mechanical, no deliberation): upgrade to Pro ($20/mo) only if Polar is the **active** rail AND it processes ≥9 Appeal Passes in a month — at $199, Pro saves ~$2.49/sale, so ~9 sales/month is break-even. Re-check monthly at the weekly review. — **Owner:** Founder · **Cost:** $20/mo when triggered · **Deadline:** monthly check · **Blocks:** nothing (pure cost optimization)

---

## 4. Product / SKU configuration (identical on both rails)

### 4.1 Appeal Pass — $199 one-time, per case

- Type: one-time purchase, digital product (SaaS tax category).
- **License keys are self-issued by our backend** (decision D2): the MoR webhook drives a Supabase `licenses` table, and our backend generates and emails the key. Do **not** use any MoR-native licensing feature — self-issued keys keep the product rail-agnostic, so a Paddle→Polar switch never touches licensing. (Schema and module spec: `../03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md` §9.2 and M11.)
- Checkout copy: honest-expectations card renders **before** checkout (most first appeals fail, even with expensive professional help — decision D6); consumer withdrawal consent mechanics per §6.2. No success-rate claims; the word "guarantee" appears nowhere (grep gate = 0).

- [ ] **11.** Create the Appeal Pass product ($199 one-time) on Paddle (sandbox first, live on approval), description per the §1 framing; record price/product IDs into deployment-env variables (`./04-REPO-AND-FIXTURE-CORPUS.md` §3 lists the names). — **Owner:** Founder (dashboard) + AI assistant (env wiring) · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** M-5 licensing work, Week 4–5 checkout
- [ ] **12.** ⚠ **FOUNDER-DECISION** — price experiment: the market squeeze (SellerForge $49/mo unlimited; AppealPath $11/POA; consultants $1,495–$5,000/case) makes a $99/$149/$199 price test across the first ~20 sales a legitimate experiment. If wanted, configure the extra price points now (Paddle supports multiple prices). Default if undecided: launch at $199, no test. — **Owner:** Founder · **Cost:** $0 · **Deadline:** decide before checkout goes live (Week 4) · **Blocks:** nothing — checkout ships either way

### 4.2 Guardian — $29/mo, created but NOT sold (decision D7)

- [ ] **13.** Create the Guardian subscription product ($29/mo) in **draft/hidden** state on the primary rail — so the SKU, tax category, and webhook mapping exist — but publish **no** checkout link anywhere. The pricing page may describe Guardian as "planned" with a waitlist only. It becomes purchasable only when its monitoring feature actually ships (Gate 3 check 37 enforces this). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 2 (creation); sale deferred indefinitely · **Blocks:** avoiding selling vapor; future Guardian launch speed

### 4.3 Expert Review — NOT created on any MoR

Human services are not MoR-eligible: Paddle's AUP prohibits them. Do not create an Expert Review SKU on Paddle, do not mention it in the application, and do not sell it anywhere in v1. If it ever ships, it runs on separate rails after Gate 3 check 38 resolves — see `../00-DECISION/02-DECISION-LOG.md` (D7). Putting a human-service SKU on an MoR account risks offboarding the account that carries all revenue. This supersedes the older "submit pre-clearance Week 1–3" action: Expert Review is never raised with any MoR during onboarding — a pre-clearance conversation happens only post-approval, from a healthy account, and only if the roadmap revival conditions are met.

---

## 5. Webhook → backend design (pointer — implementation lives in Phase 2)

The AI assistant implements this under milestone M-5; the contract is fixed here so both rails are wired identically. Full module spec: build plan M11/M12.

1. **One endpoint**, a Supabase Edge Function (e.g. `payments-webhook`), addressable by both providers; a `PAYMENTS_PROVIDER` env switch selects the active rail for checkout, but the endpoint accepts and verifies events from either.
2. **Signature verification first.** Reject anything that fails the provider's webhook signature check (Paddle signature header / Polar webhook secret) before parsing the body. Secrets live only in Supabase function secrets.
3. **Idempotency by event ID.** Persist the raw event with a unique constraint on `(provider, event_id)`; a duplicate delivery is acknowledged and skipped. MoRs redeliver on any failure — duplicates are normal, double-issued licenses are not.
4. **Answer inside 5 seconds.** Providers time out slow handlers and retry. The handler persists the raw event, returns 200, and does the actual work (license generation, email, revocation) asynchronously. Never do LLM calls, email sending, or anything slow before the 200.
5. **Event mapping (minimum set):**

| Event (Paddle / Polar equivalent) | Backend action |
|---|---|
| transaction completed / order paid | Insert `licenses` row (key, tier `pass`, status `active`, source event id) → email the key to the buyer |
| adjustment created/updated with refund approved | Set license status `revoked`; entitlement removed within 24h (Gate 3 check 29) |
| chargeback adjustment | Revoke immediately; log for the K6 chargeback tripwire (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §4) |
| subscription payment_failed / past_due (Guardian, later) | Mark entitlement `past_due`; keep access through the dunning window (Paddle Retain handles retries — note: Retain is not testable in sandbox) |

6. **Entitlement flow:** the buyer enters the key in the product → backend `verify-license` checks the `licenses` table → client caches the entitlement with a 72h offline grace window → revocation propagates on next validation. Device activation limit: starts at 5 per key, tightened only on observed abuse (see ../03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md TRC-12) — enforced server-side (Gate 3 check 31).

- [ ] **14.** Record this contract as the acceptance spec for M-5 payment work; webhook testing during development uses free tunnels (webhook.site for inspection, ngrok or localtunnel for local handlers). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with M-5 (Week 4–5) · **Blocks:** first sale (Gate 3 checks 28–29)

---

## 6. Refund workflow configuration (decision D8 — binding)

### 6.1 The voluntary 7-day SLA

- **Policy:** 7-day no-questions refund on the Appeal Pass. Fast refunds beat disputes: chargeback thresholds are existential (Polar reviews at 0.4%; internal alarm at 0.5%; card-network programs at ~0.75–1.5%), and an MoR termination kills the business.
- **Mechanics:** with an MoR, the MoR is the legal seller and processes the refund — our SLA is to approve/forward every in-window request within 24h. On Paddle, refunds are created as "adjustments" and may sit in a pending-approval state on Paddle's side; that is normal. On refund approval, the webhook (§5) revokes the license automatically.
- **Never** argue with an in-window refund request, and refund proactively on any complaint that smells like a future chargeback (a refund costs the sale; a chargeback costs the sale + up to €20/$15 fee + ratio damage).

- [ ] **15.** Configure the refund path on the active rail: support inbox → founder approves → refund issued via MoR dashboard/API within 24h → webhook revocation verified. Write the 24h SLA into the support docs. — **Owner:** Founder (process) + AI assistant (revocation path) · **Cost:** $0 · **Deadline:** before checkout goes live (Week 4–5); verified at Gate 2 check 18 · **Blocks:** chargeback defense

### 6.2 Consumer withdrawal consent at checkout

EU/UK consumers hold a withdrawal right on digital content unless delivery begins early with their explicit prior consent. The mechanics (unticked consent checkbox at checkout, durable-medium confirmation in the receipt email, and the dedicated withdrawal-function page) are specified and built under `./02-DOMAIN-AND-LEGAL-PAGES.md` §4.3 — this file's job is the MoR side:

- [ ] **16.** Verify the chosen rail's checkout can display our custom consent text and record the acceptance; if it cannot, the consent step moves to a pre-checkout page on our domain, and the receipt email carries the confirmation text. Test both the consent record and the confirmation email in sandbox. — **Owner:** AI assistant (Founder verifies) · **Cost:** $0 · **Deadline:** before checkout goes live · **Blocks:** Gate 2 check 19 (consumer-law legality)

---

## 7. Test-mode end-to-end checklist (run in sandbox before any live sale)

- [ ] **17.** Run the full E2E in sandbox on the active rail and record the results in `../00-DECISION/02-DECISION-LOG.md`: — **Owner:** AI assistant (runs) + Founder (witnesses) · **Cost:** $0 · **Deadline:** before M-8 / first live sale · **Blocks:** Gate 3 checks 28–29
  1. Sandbox purchase of the Appeal Pass completes.
  2. Webhook received; signature verified; raw event persisted.
  3. `licenses` row created with correct tier and source event id.
  4. License-key email arrives (sandbox inbox).
  5. Key entry in the product unlocks entitlement; 72h offline grace cache works.
  6. **Replay test:** redeliver the same webhook event → no duplicate license row.
  7. **Timeout test:** artificially slow the handler past 5s → provider retry arrives → still exactly one license row.
  8. Sandbox refund issued → revocation webhook → entitlement removed within 24h → key re-entry is rejected.
  9. Severity-gated case types cannot reach checkout (routes to the professional-help screen — Gate 3 check 39).
  10. Consumer withdrawal consent checkbox + confirmation email render correctly (§6.2).

Repeat items 1–8 on the fallback rail's sandbox once, so a K1/K13 rail switch is proven, not assumed.

---

## 8. The decision rule (pre-agreed — execute, don't re-deliberate)

| Situation | Action |
|---|---|
| Paddle approved (any time) | Paddle = primary rail. |
| Paddle still pending when the Week 4–5 checkout must go live | Delay checkout until Paddle approves — a payment rail must exist before revenue. |
| Paddle rejects outright | Log the rejection reason; address the stated reason and resubmit once, or evaluate alternative MoRs (Lemon Squeezy, FastSpring). |
| **All MoR options exhausted** | **Pause the build.** This is kill criterion K1 / NO-GO trigger 1 — see `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §1 and `../00-DECISION/01-VERDICT.md`. A product with no way to charge is not paused work, it is a stopped business decision — escalate to the founder the same day. |

---

## Definition of done

- [ ] Paddle application submitted behind the complete live site; identity consistent across site/application/CWS; sandbox account integrated.
- [ ] Appeal Pass ($199 one-time) created on Paddle; license keys self-issued via the Supabase `licenses` table, not MoR-native licensing.
- [ ] Guardian ($29/mo) created hidden/draft, purchasable nowhere; Expert Review created nowhere.
- [ ] Webhook contract (§5) recorded as the M-5 acceptance spec: signature verification, idempotency by event id, sub-5s acknowledgment, async processing, revocation path.
- [ ] Refund workflow configured: 24h approve/forward SLA, consumer withdrawal consent mechanics verified in sandbox.
- [ ] Full sandbox E2E (§7) passed on Paddle, including replay and timeout tests.
- [ ] The founder can state the §8 decision rule from memory, including what triggers K1 and the pre-agreed response.

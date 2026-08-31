# Payment Operations — refunds, chargebacks, dunning, entitlements, tax, payouts

**Why this file exists / when to use it:** The payment rail is the business's single point of failure: a Merchant-of-Record termination over chargebacks is existential, and the day-to-day money operations (refund handling, dispute evidence, license revocation, payout timing) are what keep that rail healthy. This file is the standing runbook for running the money after `../02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md` has opened the accounts and Gate 3 has passed. Metric thresholds live in `./03-ANALYTICS-AND-METRICS.md` §4; crisis-scale refund events in `./02-CRISIS-PLAYBOOK.md` Scenario 3.

**Terms:** MoR = Merchant of Record — the payment provider (Paddle primary) that legally resells the product and handles customer-country VAT. Chargeback / dispute = the customer reversing a card charge through their bank instead of asking us for a refund. Dunning = the automated retry-and-email process for failed subscription payments. VAMP = Visa Acquirer Monitoring Program, the card network's chargeback-ratio regime. Entitlement = the access a license key grants. Guardian = the deferred $29/mo monitoring subscription (not sold until its feature ships — D7). VAT = value-added tax. Consumer withdrawal right = the consumer's right to cancel a distance purchase under applicable consumer-protection law, waivable for digital content only with explicit prior consent + permanent-form confirmation (implemented per Gate-2 check 19).

---

## 1. Refunds — SLA and workflow

**Policy (decision D8, settled):** 7-day voluntary no-questions refund on every purchase, on top of consumer withdrawal-right compliance in the checkout. Older documents' narrower policy ("refund only if no POA generated") is superseded — do not resurrect it.

**The refund-before-dispute doctrine, which governs every money decision in this file:** a refund costs one sale (~$199 minus fees already paid). A dispute costs a chargeback fee (up to ~€20 on Paddle), permanent damage to the ratio the MoR judges us by, hours of evidence work — and enough of them cost the MoR account itself. **Never fight a refund request inside the voluntary window. When in doubt, refund.**

**Workflow:**

1. **Self-serve request path:** the KB refund article (`./01-SUPPORT-OPERATIONS.md` §3 #3) + a one-line email to support ("refund please" suffices) + the refund mention auto-detected as severity S2. No forms, no reason required (a voluntarily offered reason is gold — log it).
2. **Acknowledge within 4 business hours** (support SLA), stating the refund is approved and in processing.
3. **Execute via the MoR within 24 hours.** Mechanics: on **Paddle**, the founder cannot refund the buyer directly — Paddle is the seller; the founder creates a refund adjustment (dashboard or API) which typically lands as `pending_approval` until Paddle approves. Tell the customer funds typically appear in **3–5 business days**.
4. **Revoke entitlement on confirmation:** the MoR's refund-approved webhook triggers automatic license revocation (§4). The user keeps read/export access to their own local case data — we revoke the service, never their files.
5. **Log it:** date, amount, reason code (wrong-classification / expectation-mismatch / bug / changed-mind / other), product-fix candidate flag. The refund log feeds the weekly support→product loop (`./01-SUPPORT-OPERATIONS.md` §8) and is the Scenario-3 diagnostic dataset.

**Outside the 7-day window:** the MoR's own policy window (Paddle handles refunds within 14 days at its discretion) may still apply; beyond that, refunds are goodwill. Default: refund anyway when the alternative is a plausible chargeback (the doctrine above), decline politely for clear buyer's remorse months later. ⚠ FOUNDER-DECISION — only for out-of-window requests above roughly $500 cumulative per customer or any request smelling of fraud/abuse patterns; everything smaller is handled by the doctrine without escalation.

- [ ] **1. Write the refund runbook into the support docs (steps 1–5 above with dashboard click-paths for the live MoR) and test one full refund in sandbox/live, including webhook-driven revocation.** — **Owner:** Founder (process) + AI assistant (webhook handler) · **Cost:** one test transaction · **Deadline:** before M-8 (extends Gate-2 check 18 / Gate-3 check 29) · **Blocks:** first sale, chargeback defense

---

## 2. Chargeback monitoring and defense

**Cadence: check the MoR dispute dashboard DAILY during launch (first 8 weeks of sales), then weekly once the ratio has held under 0.4% for a month.**

**Thresholds (same table as `./03-ANALYTICS-AND-METRICS.md` §4 — kill criterion K6):**

| Ratio | Meaning | Response |
|---|---|---|
| 0.4% | Polar's account-review level — the tightest rail threshold; treat it as binding whichever rail is live | Already too close — tighten now |
| 0.5% | Our internal alarm | **Pause paid acquisition**; refund faster and more proactively; audit the honest-expectations flow; alert the MoR proactively (MoRs punish surprises, not incidents) |
| 0.5% | Industry dispute-monitoring threshold | Daily monitoring mandatory; refund-first on every complaint; every dispute gets a root-cause note |
| 1.5% | VAMP "excessive" | Payout-freeze territory. **An MoR termination is existential** — a new rail will not onboard a merchant terminated for disputes |

**Evidence packet — assemble per dispute within 48h of notification (the MoR files it; we supply it):**
- Purchase log: transaction id, timestamp, amount, checkout IP.
- Consent records: terms acceptance + the consumer explicit prior consent to immediate digital delivery + the permanent-form confirmation email (this is why Gate-2 check 19 exists).
- License activation log: key issued, device activations with timestamps.
- Delivery proof: decode and POA-generation timestamps for the case — the product was demonstrably delivered and used.
- Support history: any contact from the customer (especially if they never requested a refund — buyers who dispute without contacting support lose representments more often).
- The honest-expectations card render log for that session (proof no outcome was promised).

**Prevention beats representment:** clear checkout descriptor, template #18 in support keeping the door open even after a dispute, and the §1 doctrine. Pre-dispute alerts (Paddle may issue chargeback warnings): respond by refunding immediately — a warning converted to a refund never touches the ratio.

- [ ] **2. Build the evidence-packet generator: one script/query that assembles all six items above for a given transaction id.** Manually gathering evidence per dispute does not scale past the third dispute. — **Owner:** AI assistant · **Cost:** included · **Deadline:** before M-8 · **Blocks:** 48h evidence turnaround
- [ ] **3. Calendar the daily dispute-dashboard check for launch weeks 1–8; add the ratio to the weekly review sheet.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** launch week · **Blocks:** K6 enforcement

---

## 3. Failed payments and dunning (for Guardian, when it ships)

The $199 Appeal Pass is one-time: **no dunning applies.** A failed checkout simply shows a decline; no entitlement exists until the MoR's transaction-completed webhook arrives — nothing to recover.

Guardian ($29/mo) needs dunning the day it ships (D7 keeps it unsold until the monitoring feature exists). Configure the MoR-native machinery — do not build custom dunning:

**If Paddle is the live rail — Paddle Retain (built-in, no extra cost):**
- Default cadence: 7 automated retries over 30 days (early retries paired with recovery emails, later ones silent). Note: first-time checkout payments are NOT retried — only renewal failures enter dunning.
- **End-of-window behavior: configure "pause", not "cancel"** — a paused subscription retains data and restores cleanly when the seller fixes their card; cancellation burns the relationship at exactly the moment (card problems) that often accompanies the account trouble our customers are in.
- **Grace policy: keep Guardian feature access ON during the entire dunning window.** Monitoring is the product's value; cutting alerts over a failed card defeats the purpose and invites the churn we're trying to prevent.
- Caveat: Retain does not run in sandbox — the first live renewal failures are the real test; watch them manually.

**If Polar is the live rail:** Polar has no native dunning — failed renewals rely on automatic retries plus our own recovery email sequence (day 0, day 3, day 10: "payment failed — update your card, your monitoring continues"). Budget a cheap dunning tool (~$29/mo class) only if Guardian volume ever makes manual sequences painful.

**Entitlement states through dunning:** `active → past_due` (on the payment-failed webhook; show a non-blocking banner: "Payment failed — please update your payment method. Your monitoring continues.") → `active` (retry succeeds) or `paused` (window exhausted; access suspended, data retained, win-back email at 30/60/90 days).

- [ ] **4. When Guardian ships: configure MoR dunning per above (30-day window, pause end-behavior, access-on during dunning), implement the `past_due` banner + webhook state machine, and watch the first 5 real renewal failures end-to-end.** — **Owner:** AI assistant (build) + Founder (MoR config + observation) · **Cost:** included · **Deadline:** with the Guardian launch (post-v1) · **Blocks:** Guardian SKU going on sale

---

## 4. Entitlement operations

The license system (Supabase `licenses` table driven by MoR webhooks — decision D2) enforces these standing rules:

- **Revocation within 24 hours** of any refund-approved or chargeback-created webhook: key deactivated server-side, next validation fails, cached entitlement expires. Gate-3 check 29 tests this path before launch. Local case data stays readable/exportable — we never hold a user's own files hostage.
- **Device activation limit: start at 5 activations per key, enforced server-side.** Tighten only on observed abuse — see `../03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md` TRC-12. (Support topic #8 volume remains the friction signal.)
- **Self-service device deactivation:** the portal lets a user free a slot themselves — no ticket, no support cost. This is what makes a low activation limit humane.
- **Clock-tamper → free tier:** if client-side clock manipulation is detected (system time behind last-validated server time), the extension silently degrades to free-tier behavior rather than accusing the user — no error theatrics, entitlement restores on the next clean online validation.
- **72-hour offline grace:** cached entitlements honor 72h without server contact (covers travel, outages, and MoR webhook gaps — MR-17); beyond that, features degrade to free tier until validation succeeds. The webhook handler is idempotent by event id, and on any extended outage the backend reconciles against the MoR API rather than trusting possibly-lost webhooks.

- [ ] **5. Verify all five behaviors above with explicit tests (revocation latency, limit enforcement, self-serve deactivation, clock-tamper degradation, 72h grace expiry) before first sale.** — **Owner:** AI assistant · **Cost:** included · **Deadline:** before M-8 (Gate-3 checks 29 and 31) · **Blocks:** Gate 3

---

## 5. Piracy response

A $199 key WILL be shared on Reddit/forums/Telegram (high likelihood — MR-09/MR-21). The response posture, decided now:

1. **The activation limit is the actual defense.** A shared key exhausts its device slots (starts at 5 per key, see TRC-12) almost immediately; the sharer's own access breaks first. Most "piracy" self-resolves into a support ticket from the original buyer (topic #8).
2. **Revoke keys that are demonstrably mass-shared** (activation attempts from dozens of devices): revoke, email the original buyer once, politely, with a fresh key offer if they plausibly weren't the sharer.
3. **Calm community engagement over DMCA threats.** Legal takedown letters against forum posts make a $199 tool look scared, generate screenshots, and feed the exact distrust the market already has. In threads where keys circulate: one friendly note about what the Pass funds and where the honest price lives — then leave.
4. **Convert sharers into referral partners:** someone distributing our product has proven distribution reach. A referral/affiliate arrangement (post-v1) turns the leak into a channel; keep a short list of high-reach sharers as first referral-program invitees.
5. Never rate-limit or degrade paying users to punish pirates — false positives on paying customers cost more than the piracy.

---

## 6. Record-keeping calendar

This section is the standing cadence once trading. The founder is an individual seller in Pakistan; consult a local accountant for Pakistan tax obligations on business income.

| Cadence | Task | Detail |
|---|---|---|
| Monthly | Bookkeeping reconciliation | Download the MoR statement; record gross sales and MoR fees; file receipts. Retention: per local tax rules. |
| Monthly | Cash-flow sanity check | Revenue vs. cash in bank; plan for the MoR payout float (a sale in month 1 can become bank cash in mid month 2). |
| At first revenue | Accountant consultation | Engage a Pakistan accountant to confirm tax obligations, record-keeping requirements, and any withholding on MoR payouts. |
| Quarterly | Accountant touchpoint | 30 minutes: threshold status, anything new (Guardian launch, Expert Review rails, US marketing spend) that changes the tax picture. |
| Annually | Tax filing | Calendar the filing deadline the day the accountant confirms it. |

- [ ] **6. Build the tax calendar into the founder's actual calendar (recurring events for every row above) and add the founder's Pakistan obligations to the weekly review's money section — FBR income tax on MoR payouts (NTN, filer status), plus provincial sales-tax registration only if the accountant confirms it applies (customer-country VAT is the MoR's job).** — **Owner:** Founder · **Cost:** $0 (accountant costs already budgeted in Phase 0) · **Deadline:** first revenue week · **Blocks:** clean first filing, penalty avoidance

---

## 7. Payout and cash-flow notes

Plan cash flow around the rails' real timing — revenue earned is not cash held:

**Paddle (primary):**
- Monthly payout cycle: payouts initiate on the 1st when the balance meets the minimum (~$100), funds typically sent by the 15th, arriving 1–3 business days later depending on method. Practical meaning: **a sale made early in month 1 can become bank cash in mid month 2** — up to ~6 weeks of float. The ~$1,100–2,300 cash budget must carry operating costs across that float; do not plan Week-8 revenue paying Week-9 bills.
- Paddle may hold back amounts covering potential refunds/chargebacks; expect the first payouts to be conservative.

**Polar (warm fallback):**
- Payouts are manual withdrawals — Polar never auto-sweeps; calendar a monthly withdrawal or money sits idle.
- New organizations: settlement delay per transaction and a first-payout review period; minimum balance applies; payout fees apply. **Polar's Pakistan payout runs via Stripe Connect cross-border — verify it actually works at signup, before Polar is ever relied on as the fallback.**
- Fee reality check: free tier 5% + 50¢; Pro $20/mo at 3.8% + 40¢ (Pro pays for itself at roughly a handful of Pass sales/month — check the arithmetic when volume appears); **+1.5% surcharge on international cards** (most US customers = most cards, so model the effective rate with the surcharge in) and **$15 per chargeback**.

**Plan C — Dodo Payments (MoR, 4% + 40¢):** application-ready only, no account opened. If it ever becomes the live rail, document its payout timing and fee schedule here first (item 8).

**Payout destination:** the founder's personal Wise/Payoneer account (individual seller in Pakistan, not a company account). Keep MoR payouts and contractor payments in separate accounts.

- [ ] **7. Write the cash-flow float into the runway sheet: model the launch months with Paddle's worst-case ~6-week sale-to-cash lag (or the fallback's settlement + review delays) and confirm the fixed costs (~$0–25/mo hosting + insurance + accountant) clear on existing cash, not on projected payouts.** — **Owner:** Founder + AI assistant (sheet) · **Cost:** $0 · **Deadline:** Week 5 (before payments go live) · **Blocks:** solvency through the payout float
- [ ] **8. On MoR approval, record in this file: which rail is live, its exact fee schedule, payout minimum, and dashboard URLs for disputes/refunds/payouts.** Every §1–§3 click-path gets updated to the live rail. — **Owner:** Founder · **Cost:** $0 · **Deadline:** on approval (Week 2–4 expected) · **Blocks:** every runbook above being executable by someone other than the founder

---

## Definition of done

- [ ] Refund runbook written and one full refund executed end-to-end (request → MoR processing → webhook → revocation → log entry).
- [ ] Evidence-packet generator produces all six items for an arbitrary transaction id; dispute dashboard checked daily through launch weeks 1–8.
- [ ] All five entitlement behaviors (§4) explicitly tested before first sale.
- [ ] Piracy posture (§5) acknowledged by the founder — no DMCA threat gets sent in a forum thread, ever.
- [ ] Tax calendar events live in the founder's calendar; accountant consultation completed; tax obligations confirmed.
- [ ] Cash-flow sheet models the real payout float and shows fixed costs covered by cash on hand through at least Week 12.
- [ ] Dunning section executed (item 4) before the first Guardian subscription is ever sold — and not before.

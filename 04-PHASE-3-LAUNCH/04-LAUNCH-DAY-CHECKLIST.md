# Launch-Day Checklist — the M-8 public-launch runbook

**Why this file exists / when to use it:** M-8 (milestone 8, week 8) is the public launch: the Chrome Web Store (CWS) listing flips from unlisted to public and the launch posts go out. By this point the web decoder and paid composer have been live and selling for ~3 weeks (`./01-WEB-DECODER-LAUNCH.md`), so launch day is not a revenue cliff — it is a controlled visibility event that must not break anything that already works. This file is the chronological runbook: T-1 day (verification), T-0 (execution), the first 48 hours (watch rotation), and the first-week review. Print it, or keep it open, and tick every box in order. Do not improvise on launch day — everything worth deciding was decided earlier.

**Terms used here:** POA = Plan of Action (the Amazon appeal document). MoR = Merchant of Record (Paddle/Polar — the legal seller handling customer-country VAT). Appeal Pass = the $199 one-time, per-case paid product. Gate 3 = the final go/no-go gate before the first paid customer, defined in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §3. K-criteria (K4–K13) = the pre-agreed kill criteria and tripwires in that same file, §3–§4. Kill switch = the remote-settings `minSupportedVersion` mechanism that can disable a broken extension release. Staged rollout = CWS releasing to 5% → 25% → 50% → 100% of users.

**Entry condition (hard):** Gate 3 is split (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`): its revenue-critical checks (live checkout end-to-end, license revocation, cloud cost ceiling/circuit breaker, anti-piracy device limits, chargeback monitoring, honest-expectations + severity gating live) already passed before the web checkout went live at M-W, ~3 weeks ago; the remaining launch checks must pass now, at M-8. So: every check 28–39 ticked — the revenue-critical subset at M-W, the rest now (or dated written exceptions in `../00-DECISION/02-DECISION-LOG.md` §4) — and the M-7 gate is done: 3 design partners through the full flow (`./03-DESIGN-PARTNER-BETA.md` §7). If either is not true, today is not launch day. Checkbox numbering below is sequential through the whole runbook.

---

## 1. T-1 day — verification pass (nothing new ships today; we only verify)

Pick the day: launch Tuesday–Thursday, early US-morning / afternoon, never a Friday — the founder must not face the first public weekend alone hours after going live (estimate — operational judgment, not a verified rule).

- [ ] **1. Gate-3 verification pass.** Walk `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §3, checks 28–39, in a dedicated session with the file open — live MoR checkout, license revocation, cost ceiling + circuit breaker, anti-piracy device limits, support response time, severity gating + honest-expectations card in the purchase path, Guardian SKU still deferred. Any red = launch slips; a gate is never passed inside a hurry. — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** T-1 · **Blocks:** everything below
- [ ] **2. Support canned responses armed.** The top-20 canned responses (Gate 2 check 20) plus the top-5 crisis responses are loaded into the support tool and re-read; knowledge-base stub links verified; support email signature carries the honest-expectations tone. See the support setup in `../06-OPERATIONS/`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-1 · **Blocks:** first-48h response speed
- [ ] **3. Analytics dashboards checked + baseline snapshotted.** Plausible/Umami and the backend funnel counters load, every D10 funnel event fires on a test run, and today's numbers (sessions/day, decodes/day, error rate, cloud cost per decode) are written down as the **baseline** — the K10 tripwire is ">3x baseline in 24h" and is unmeasurable without this snapshot. Thresholds and dashboard layout per `../06-OPERATIONS/03-ANALYTICS-AND-METRICS.md`. — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** T-1 · **Blocks:** the §3 watch having numbers to watch
- [ ] **4. Crisis playbook re-read — recitation test.** The founder recites the 24-hour response protocol from memory (detect → triage → assemble → draft → pause acquisition → ONE public reply → fix → follow-up) and the first move for the top scenarios ("tool got me banned" thread, review bombing, refund storm, wrong-classification hotfix). Failing the recitation = re-read until it passes; Gate 2 check 26 required this once, launch eve requires it fresh. Full playbook: `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-1 · **Blocks:** surviving the first bad thread
- [ ] **5. Rollback / kill-switch tested live.** Fire the remote-settings kill switch against a test install and verify the extension degrades gracefully; rehearse the versioned-rollback path once. Staged rollout (5%→25%→50%→100%) applies only once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible); if eligible, verify it is configured on the pending public release — below the threshold this release is effectively big-bang, and the substitute control is hardened pre-release QA plus this tested kill switch. A broken release during a mass-suspension wave is a named crisis scenario — this is the fire drill. — **Owner:** AI assistant + Founder · **Cost:** $0 · **Deadline:** T-1 · **Blocks:** the public flip (item 8)
- [ ] **6. Launch posts final-checked.** Every post drafted per §2.2, founder-approved, checked against the MUST/MUST-NOT lists, and — where a channel requires it — **mod/admin approval already confirmed** (request approval no later than T-3; modmail turnaround is days, not hours). `grep -i "guarantee"` across all launch copy = 0 hits. — **Owner:** Founder (AI assistant drafts) · **Cost:** $0 · **Deadline:** T-3 request, T-1 confirm · **Blocks:** T-0 posting
- [ ] **7. Deploy freeze.** No new features, dependency bumps, or copy rewrites between now and T+48h — hotfixes only, through the rehearsed path. — **Owner:** Founder (enforces) + AI assistant (complies) · **Cost:** $0 · **Deadline:** T-1 through T+48h · **Blocks:** a self-inflicted launch-day incident

## 2. T-0 — launch day

### 2.1 Execution order

- [ ] **8. Flip the CWS listing to public** — with staged rollout active only if the install base exceeds CWS partial-rollout eligibility (~10,000 users); otherwise the release is effectively big-bang, covered by hardened pre-release QA and the kill switch tested in item 5. Verify the public listing renders correctly (screenshots, trader details, paid-functionality disclosure, privacy links). — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-0 morning · **Blocks:** launch posts (never post before the listing is actually visible)
- [ ] **9. Verify the funnel end-to-end one last time, as a stranger:** incognito browser → decoder → decode → intake → checkout page reachable (stop before paying). Mobile too. — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-0, before posting · **Blocks:** posting traffic into a broken funnel
- [ ] **10. Publish the launch posts** — only to channels whose rules allow announcements, per `../05-PHASE-4-GROWTH/02-COMMUNITY-PLAYBOOK.md`: r/FulfillmentByAmazon and/or r/AmazonSeller **with prior mod approval only**; Product Hunt / Show HN (founder-named, plain voice); own site + newsletter. Facebook groups get **no announcement posts** (their rules ban promo) — continue help-first participation there, mentioning the tool only where contextually allowed. Stagger posts across the day rather than firing all at once; answer every comment personally and honestly. — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-0 · **Blocks:** launch visibility
- [ ] **11. Open the watch log** (§3): a running note of every check — time, funnel numbers, tripwire status green/amber/red, incidents, actions taken. — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-0 · **Blocks:** the first-week review having an evidence trail

### 2.2 Launch-post content rules (every post, every channel)

**MUST say:**
- **The honest founder story** — real name, "I built this", why (weeks of answering suspension threads showed sellers panicking into a market of $600–5,000 consultants and scam-tier Fiverr gigs), and what it is (a document-preparation and case-management tool, not a law firm).
- **Free decoder first.** Lead with the free, no-login notice decoder — the useful thing anyone can try in 30 seconds — not with the $199 product. The paid Appeal Pass is mentioned after, plainly, with its price.
- **Verified price anchoring:** consultants charge from ~$600 (Thompson & Holt, third-party cited) to $1,500–$5,000 per case (ecommerceChris, The Appeal Guru — public pages); AppealDeck's Appeal Pass is $199, one-time, per case. State the anchor as a fact about the market, never as a jab at any named competitor.
- **Honest expectations:** most first appeals fail, even professionally written ones; we promise process quality, never outcomes. 7-day no-questions refund.
- **The privacy posture:** local-first, read-only, your case data stays in your browser.

**MUST NOT say (each one is a trust-killer, a policy violation, or both):**
- Any outcome promise — the g-word is banned from all copy (grep gate = 0), and so is every euphemism for it ("get reinstated", "we'll get you back").
- Any win rate or success percentage — we have no opt-in outcome data yet, and every number floating in older docs is invented.
- "Only tool" / "first ever" — the category is occupied (SellerForge's extension and others exist); claiming otherwise is a falsifiable lie in front of the best-informed audience possible.
- Urgency pressure — no countdown timers, "act now", launch discounts framed as expiring, or artificial scarcity. The buyer is already panicking; adding pressure is exploitation, and it is exactly what the scam tier does.
- Competitor or consultant bashing (explicit ASGTG rule; bad look everywhere).

[source: The Second Opinion.md, marketing-hygiene amendment 6; APPEALDECK_DISTRIBUTION_CHANNEL_MECHANICS.md §3]

## 3. First 48 hours — watch rotation

**Rotation:** the founder runs the watch solo — support inbox, MoR dashboard, error alerts, and community-thread/review triage during waking hours. Off-hours are covered by an honest auto-reply stating the response window, with a founder morning batch first thing; never a fake 24/7 promise. (A future vetted VA restricted to approved canned responses may extend coverage later, per the Collaborator & Contractor Policy — `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`.) Check cadence: **every 2h for hours 0–12, then every 4h during waking hours to T+48h.** Every check is logged (item 11).

Thresholds below mirror the kill criteria in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §3–§4 and the dashboard definitions in `../06-OPERATIONS/03-ANALYTICS-AND-METRICS.md`. A tripped threshold executes its pre-agreed response **the same day** — no re-deliberation.

| # | Signal | Where | Green | Tripwire → pre-agreed response |
|---|---|---|---|---|
| W1 | Refund requests | MoR dashboard + support inbox | 0–2, each with a noted reason | >15% of the first 10 sales → **K4**: pause all marketing, diagnose by refund reason before scaling |
| W2 | Chargeback signals | MoR dashboard | zero | Any chargeback → same-day case review + proactive MoR contact. Ratio ladder: 0.4% (Polar review) / 0.5% (internal alarm — pause paid acquisition, refund faster) / 0.75% (Stripe monitoring) / 1.5% (Visa VAMP) → **K6**. An MoR termination is existential |
| W3 | Review sentiment | CWS listing + launch threads | neutral-to-positive, real questions | Rating drop >0.3 stars in 24h with >3x review volume, or a "tool got me banned" thread >100 upvotes → **K11** / crisis scenario 1: do not reply immediately; triage; ONE calm factual public reply; never argue, never incentivize reviews |
| W4 | Error rates | Cloudflare + Supabase alerts, backend logs | no new error classes vs. the T-1 baseline | Any 5xx spike or decode-failure spike → hotfix path; if release-linked, halt the staged rollout and fire the kill switch (item 5 rehearsed this) |
| W5 | Decoder → purchase funnel | Plausible/Umami + backend events | every D10 stage shows events; conversion within the ranges the web weeks established | Any stage flat at zero while traffic flows → instrumentation or UX breakage; diagnose same day. (Zero *purchases* in 48h is a signal to investigate, not a kill — the review trigger is zero paid Passes by week 6, which triggers the pricing/positioning review per `./01-WEB-DECODER-LAUNCH.md` §12, already behind us if the web launch converted) |
| W6 | Community reactions | Launch threads, ASGTG, r/FBA — the founder's watch list | questions, feature asks, skepticism (normal — this market is scam-scarred) | Hostile-but-factual criticism → answer once, honestly. Misinformation spreading or pile-on forming → crisis playbook, one voice |
| W7 | Traffic level | Plausible/Umami vs. T-1 baseline | growth | >3x baseline in 24h → **K10** (mass-suspension wave or viral spike): confirm circuit breaker is holding the cloud-spend cap, decoder degrades to rules-only honestly, canned responses out, support worked in triaged batches — the founder does not answer individually |
| W8 | Cloud cost per decode | Backend dashboard | ≤ $0.10 | Above → **K5**: tighten rate limits before scaling; a 5x overrun on the ~$0.02/case expectation is an architecture bug, not a pricing problem |
| W9 | Support load + response time | Inbox | <10 tickets/day, <4h response in business hours | >20 tickets/day trending → **K7** path: canned responses, auto-reply + batched triage windows (consider a vetted VA limited to approved canned responses, per the collaborator policy), pause marketing spend, hard work-hour boundaries — burnout is a named existential risk |

- [ ] **12. Run the 48h watch to schedule; log every check; execute any tripped response same-day.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** T-0 → T+48h · **Blocks:** catching week-one failure modes while they are still small

## 4. First-week review (T+7 days)

One extended session (60 minutes, replaces that week's 30-minute review — same discipline as `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §5). Outcomes are appended to `../00-DECISION/02-DECISION-LOG.md` with date and rationale.

**Agenda (in order, timeboxed):**

1. **Numbers (15 min).** North star: paid Appeal Passes this week. Full D10 funnel: decoder sessions → decode completed → intake started → purchase → opt-in outcomes. Channel attribution: which launch post/channel actually drove sessions and sales (the answer decides where next week's hours go). Refund rate, chargeback count, cloud cost per decode, support volume and response time — each against its §3 threshold.
2. **Surprises (10 min).** Everything that happened that no planning document predicted — good or bad. Logged verbatim; surprises are the only new information launch week produces.
3. **Top support issues (10 min).** Top 5 by frequency → each gets a canned-response update and, where it is a product defect, a backlog entry with severity. A support theme repeating 3+ times is a product bug, not a communication bug.
4. **Price-test readout (15 min).** ⚠ FOUNDER-DECISION — With the first-sales data from the price experiment (the $99/$149/$199 design chosen before composer go-live, `./01-WEB-DECODER-LAUNCH.md` action 11): lock the price, continue the test to ~20 sales, or adjust. Inputs: conversion per price point, refund behavior per price point, and the verified anchor logic ($199 defended by $600–5,000 consultant fees; squeezed from below by subscription tools and an $11 one-shot drafter). Nobody but the founder makes this call; the decision and its rationale go in the decision log the same day.
5. **Next-week priorities (10 min).** P1 queue check (rejection-reason parser is first in queue), next SEO pages, community cadence, any Gate/K-criterion needing attention, and — if launch week went well — the schedule for the staged rollout reaching 100%.

- [ ] **13. Hold the first-week review to this agenda; append all outcomes and the price decision to the decision log.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** T+7d · **Blocks:** week-2 priorities, price configuration going forward
- [ ] **14. Resume the standing 30-minute weekly review cadence from week 2 post-launch onward** (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §5) — launch week does not suspend the system, it feeds it. — **Owner:** Founder · **Cost:** $0 · **Deadline:** weekly, ongoing · **Blocks:** kill-criteria enforcement

## Definition of done

- [ ] Gate-3 verification pass completed T-1 with zero unticked checks (or dated written exceptions in the decision log).
- [ ] Kill switch and rollback tested T-1; staged rollout configured; deploy freeze held through T+48h (hotfixes excepted).
- [ ] CWS listing public; launch posts published only where rules allow, each compliant with the §2.2 MUST/MUST-NOT lists; "guarantee" greps to zero across all launch copy.
- [ ] 48h watch log complete — every scheduled check recorded, every tripped threshold met with its pre-agreed response the same day (or no threshold tripped).
- [ ] First paid Appeal Pass attributable to the public launch recorded (M-8 acceptance: listed + paid Pass) — or the miss diagnosed in the first-week review with a written plan.
- [ ] First-week review held to the §4 agenda; price-test decision (⚠ FOUNDER-DECISION) recorded in the decision log; next-week priorities written.
- [ ] The founder can still recite the 24-hour crisis protocol — and has not needed it, or used it correctly.

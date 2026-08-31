# Support Operations — solo-founder-survivable support

**Why this file exists / when to use it:** Support is the second-biggest post-launch killer after chargebacks: a solo founder in Pakistan selling to panicked US sellers gets tickets at 3 a.m. (US time), and one 36-hour silence has turned a small refund into a five-figure crisis elsewhere [source: APPEALDECK_CRISIS_SCENARIO_PLANNING.md, Supp case study]. This file defines the $0 launch support stack, response targets, the 20 canned responses that must exist before beta (Gate-2 check 20 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`), night-triage coverage, the volume thresholds that trip the crisis playbook, and the weekly loop that turns tickets into product fixes. Use it to set up support in Weeks 6–7 (M-7 prep) and to run it every week after launch.

**Terms:** POA = Plan of Action, the appeal document Amazon requires. MoR = Merchant of Record (Paddle — the payment provider that legally resells the product). CWS = Chrome Web Store. KB = knowledge base (public self-serve help articles). Nano = Gemini Nano, Chrome's built-in on-device AI model. Canned response = a pre-written, reusable reply template. M-1…M-8 = the build plan's weekly milestones. Guardian = the deferred $29/mo monitoring subscription (not sold until its feature ships — decision D7).

---

## 1. The $0 launch stack (decided — do not shop for tools)

Support at launch is time-bound, not cash-bound: the constraint is founder hours, not software budget. Everything below is free until roughly 1,000 active users (estimate) [source: APPEALDECK_STREAM5_FREE_CHEAP_RESOURCES.md].

| Function | Tool | Cost | Notes |
|---|---|---|---|
| Ticket channel | Support email on the product domain (e.g. `support@` via Cloudflare Email Routing, set up in `../02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md` §2.2) | $0 | Labels/filters for triage (Billing, Technical, Refund, Legal-adjacent, Press). Gmail-style templates hold the canned responses. |
| Live chat (optional) | Tawk.to free | $0 (branding removal $29/mo later) | Only genuinely unlimited free live chat. "Powered by tawk.to" branding stays until paid — acceptable pre-launch, budget the $29/mo at launch scale. Do NOT install chat before canned responses exist; chat without answers is a liability. |
| Public KB | Docsify (open source, Markdown) published on existing hosting; drafted in Notion free (founder as the ONLY workspace member — unlimited blocks; add any future collaborator as *guest*, not member, or a 1,000-block cap applies) | $0 | Structure in §7. |
| Ticket log / metrics | Google Sheets | $0 | One row per ticket: date, channel, topic tag (use the §3 topic numbers), severity, time-to-first-response, resolution, refund? (Y/N), product-fix candidate? (Y/N). |
| Crisis comms | `./02-CRISIS-PLAYBOOK.md` templates pre-loaded into the same Notion space | $0 | |

**Explicitly rejected:** Zendesk and Front have NO free tiers (14-day trials only — an older build-plan assumption that was wrong); free AI chatbots (Chatbase, Botpress, Tidio Lyro) are dev sandboxes, not production deflection [source: APPEALDECK_STREAM5_FREE_CHEAP_RESOURCES.md].

**Upgrade trigger:** ~1,000 active users (estimate — roughly the point support volume exceeds founder capacity). Expected upgrade spend $29–95/mo: Tawk.to branding removal $29/mo, plus optionally AI deflection (FastGPT Basic ~$14/mo — note it is China-hosted, verify GDPR data-residency comfort first (unverified)) or Crisp Mini $45/mo as an all-in-one. Do not spend any of this earlier.

- [ ] **1. Stand up the support stack.** Support email live with triage labels + templates; Notion KB workspace (solo member); Google Sheets ticket log with the column schema above. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 6 (before M-7) · **Blocks:** Gate-2 check 20, launch-week survival
- [ ] **2. Publish the public KB (Docsify) with at least the §7 skeleton and the top-10 articles.** — **Owner:** AI assistant (draft) + Founder (review/publish) · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** ticket deflection, honest-expectations reinforcement
- [ ] **3. Decide Tawk.to on/off for launch.** If on: install on the web decoder only, office-hours availability only (offline form otherwise). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** nothing (email is the primary channel either way)

---

## 2. Response targets

- **<4 hours first response during business hours** (approx. 09:00–17:00 PK time, Mon–Fri). This is measured over a 48h beta window as Gate-3 check 32 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`.
- **Async-only policy for US-night tickets.** Most customers are US sellers whose panic peaks during Pakistan's night / early US morning. The policy is honesty, not heroics: an auto-reply states the real response window, points to the KB and the free decoder, and flags the genuinely urgent path (see §4). The founder does NOT answer tickets at 3 a.m. — burnout is a named existential risk (MR-02) and a rested founder answers better at 09:00 than a fried one at 03:00.
- **Auto-reply copy (use as-is, adjust times):**
  > Thanks for reaching out — this is an automatic reply so you know exactly what happens next. Our support hours are 09:00–17:00 PK time (that's 23:00–07:00 US Eastern), Mon–Fri, and we answer every ticket within 4 business hours. While you wait: our help articles cover the most common questions [KB link], and the free decoder [link] works 24/7. If your message is about a refund, just say so — refunds are processed no-questions-asked within the 7-day window.

- [ ] **4. Configure the auto-reply and verify the <4h target over a 48h beta window.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-8 (Gate-3 check 32) · **Blocks:** Gate 3

---

## 3. The top-20 canned responses (write during M-7)

Every reply below must be honest, calm, free of the banned word "guarantee" (even in negation — the grep gate in Gate-2 check 16 is unconditional), and free of any success-rate claim. Each canned response ends with an invitation to reply if the answer didn't fit. Write all 20 as email templates AND as KB articles (§7).

| # | Topic | Core message of the reply |
|---|---|---|
| 1 | "What does my notice mean?" | Run it through the free decoder (link); the reply explains the classification shown (violation type, severity, deadline) in plain words and what the intake wizard does next. |
| 2 | "Will this get me reinstated?" — the honest answer | No tool, consultant, or lawyer can promise reinstatement — most first appeals fail, including expensive professionally-written ones. AppealDeck improves the *document*: correct violation framing, complete root-cause/corrective/preventive structure, deadline tracking. The decision is Amazon's alone. (This mirrors the honest-expectations card shown before purchase — decision D6.) |
| 3 | Refund request | Granted, no questions, within the 7-day window. Explain the MoR processes it (funds typically appear in 3–5 business days) and that the license is deactivated on refund. Workflow detail: `./04-PAYMENT-OPERATIONS.md` §1. |
| 4 | "POA rejected — what now?" | Rejection is common on first attempts. Re-open the case, feed Amazon's reply into the rejection parser, add genuinely NEW information/evidence before resubmitting — repeating the same appeal verbatim hurts; by a 3rd+ attempt Amazon expects real novelty. Point to the escalation-ladder article (#17). |
| 5 | Gated case type — why we won't sell you a Pass | If the notice involves forged documents, fraud, or child-safety, checkout is blocked by design and the professional-help screen appears. These cases need a human professional (often a lawyer); selling software for them would be taking money we can't honestly earn. Referral pointers included. (Decision D6 — non-negotiable.) |
| 6 | Extension won't read my page → paste mode | Paste mode is a first-class path, not a workaround: copy the full notice text from Seller Central, paste into the decoder — identical output. Include step-by-step with screenshots. (Paste mode is the compliance spine — see `../00-DECISION/02-DECISION-LOG.md` D3.) |
| 7 | License key not working | Checklist: exact key copy (no spaces), signed-in state, activation-server status page link, 72h offline grace explanation, escalation path if all fail (severity S2, §6). |
| 8 | Device limit reached | Keys activate on 5 devices by default, tightened only on observed abuse (`./04-PAYMENT-OPERATIONS.md` §4; `../03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md` TRC-12). Self-service deactivation portal link — remove an old device, activate the new one, no ticket needed. |
| 9 | "Is my data private / what leaves my browser?" | Local-first: cases live in an encrypted vault in the user's own browser. Nothing leaves the device except (a) with explicit consent, notice text sent to our backend for cloud drafting (paid Gemini tier — not used for AI training), and (b) anonymous usage counts (event names + numbers only, never notice content). Link privacy policy. |
| 10 | "How do I export my case?" | Export button location, file format, and the fact the export is theirs — no lock-in, works after refund/expiry too (read access is never held hostage). |
| 11 | Cancel / refund Guardian | (Only once Guardian ships — D7.) Cancel path in the MoR-hosted portal, effective end of billing period; refunds within the voluntary window per `./04-PAYMENT-OPERATIONS.md` §1. Until it ships: "Guardian isn't purchasable yet — you're on the waitlist, nothing has been charged." |
| 12 | "Nano says unavailable" | Chrome's built-in model needs a desktop, ~22 GB free disk, and strong hardware, and downloads several GB on first use — many machines don't qualify, and that's expected. The product works fully without it: rules-based decode is free, and cloud drafting handles the paid deliverable. Nothing to fix. |
| 13 | "Can you write it for me?" — no, here's why | We are software, not a done-for-you service — deliberately. You know your business facts; the composer structures them into the format Amazon's reviewers expect, and the critic flags weaknesses before you submit. A ghost-written appeal from someone who never ran your account is the thing Amazon's screening increasingly rejects. If you want human help, the professional-help screen lists options. |
| 14 | "Amazon asked for invoices I don't have" | Honest options only: request them from your supplier (Amazon accepts supplier-issued documents meeting their format rules), explain the sourcing truthfully in the POA, or — if documents can't exist because the sourcing was the problem — treat this as a root-cause to fix, not paper over. We will never help fabricate a document; fabricated invoices are the fastest route to permanent termination. |
| 15 | "How long until Amazon replies?" | Honestly: no published timelines exist. Initial automated acknowledgments can arrive quickly; substantive review commonly takes days to weeks and varies by case type and queue. Press reporting (Jun 2026) confirms appeals can take weeks with funds frozen meanwhile. The deadline tracker keeps YOUR obligations on time; Amazon's side can't be scheduled. |
| 16 | "Can I submit twice?" | One live appeal at a time. Resubmitting the same content, or flooding the queue, reads as spam and reduces credibility; each resubmission must add new information. The novelty warning in the product fires for a reason. |
| 17 | Escalation ladder question | Explain the stages plainly: reply to the case → revised POA with new evidence → the Seller Challenge stage where applicable → executive escalation paths → for funds specifically, a funds appeal becomes available +60 days after the hold (policy since Oct 2024); holds never auto-release. For IP disputes/arbitration: that's lawyer territory — professional-help screen. |
| 18 | Chargeback filed — recovery path | If you disputed the card charge by mistake or out of frustration: contact us first next time — we refund within the window, no questions. Once a chargeback exists, the MoR handles it; our evidence (purchase, activation, delivery timestamps) is submitted; the license is suspended while it's open. If it's withdrawn/resolved, we restore access. No hostility — the door stays open. |
| 19 | Feature request handling | Thank, log verbatim in the feedback sheet (§8), tag it, and be honest: no roadmap promises, requests are weighed weekly by frequency and fit. If it's an existing P1/P2 backlog item (agency/multi-user, translation, mobile), say so. |
| 20 | Press / partnership inquiry | Support never comments. Forward to the founder's direct address within the same business day; auto-acknowledge to the sender that the founder will reply personally. |

- [ ] **5. Write all 20 canned responses as templates + matching KB articles.** — **Owner:** AI assistant (draft) + Founder (review every word — these ARE the brand voice) · **Cost:** $0 · **Deadline:** during M-7, before beta opens (Gate-2 check 20) · **Blocks:** Gate 2, night-triage viability, KB launch
- [ ] **6. Grep all 20 templates + KB for the banned word and for any success-rate claim; fix to zero hits.** — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with item 5 · **Blocks:** Gate-2 check 16 (D6 ethics spine)

---

## 4. Night triage — honest auto-reply + founder morning batch

Night coverage is honest asynchronicity, not heroics. The default (and launch) posture: the §2 auto-reply with the real response-time expectation runs on every night ticket, and the founder batch-processes the queue every morning at 09:00–10:00 PK. This alone is a fully acceptable posture — most night tickets are S3/S4, and a rested founder at 09:00 answers them better than anyone at 03:00.

**Future option — a vetted night VA (not engaged at launch):** if night volume later justifies it, a contractor VA may take first-line night triage under the terms of `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`: read incoming tickets, answer ONLY with approved canned responses (#1–#20), tag everything in the ticket log, and escalate S1/S2 (§6) to the founder immediately via the agreed channel. No public statements, no policy exceptions, no refund promises beyond template #3, and no legal-adjacent wording. VA night triage only counts as "covered" after a 2-week trial in which the VA's tag accuracy and escalation latency are spot-checked against the log.

- [ ] **7. Test the night flow during beta: verify the auto-reply fires on every after-hours ticket and the founder morning batch clears the night queue by 10:00 PK; spot-check ≥20 handled tickets for tag accuracy.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** Weeks 7–8 · **Blocks:** night coverage confidence
- [ ] **8. ⚠ FOUNDER-DECISION — after beta, keep auto-reply + morning batch as the steady state, or engage a vetted night VA per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md` (canned responses only; S1/S2 escalates to the founder).** The pre-agreed default is the auto-reply + morning-batch posture — a VA is added only if night volume demands it. — **Owner:** Founder · **Cost:** $0 · **Deadline:** end of Week 8 · **Blocks:** steady-state support roster

---

## 5. Ticket-volume thresholds (wired to the kill criteria)

Track daily in the ticket log. These mirror kill criterion K7 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §4 — the responses are pre-agreed, execute them the day the threshold trips.

| Level | Threshold | Pre-agreed response |
|---|---|---|
| **Warning** | Founder support time >2 hours/day (any single day) | Same day: identify the top-3 ticket topics; write/repair the canned response and KB article for each; check whether one product bug is generating the volume (if yes, it becomes the top build task). Do not add tools; add deflection. |
| **Crisis** | >20 tickets/day for 3 consecutive days | Pause all marketing spend and outreach; deploy canned responses on everything; activate `./02-CRISIS-PLAYBOOK.md` (this volume usually means a scenario is underway — mass-suspension wave, bug, or trust incident) and run community triage per its §3 roles; hard work-hour boundaries enforced. |

- [ ] **9. Add both thresholds to the weekly review tripwire dashboard and set a daily 2-minute count ritual.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** launch week · **Blocks:** K7 enforcement

---

## 6. Escalation path — severity classes

Every ticket gets a severity tag at first touch. The founder applies the class at first touch (a future vetted VA may apply it per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`); only the founder handles S1.

| Class | Definition | Response | Who |
|---|---|---|---|
| **S1** | Legal threat, press inquiry gone hostile, MoR/account-security incident, data-breach suspicion, anything with "lawyer"/"chargeback"/"going public" language, or a user claiming the tool harmed their account | Founder personally, same day, even outside hours; consider crisis-playbook activation; nothing sent without founder sign-off | Founder only |
| **S2** | Money and access: refund requests, payment failures, license/entitlement problems, chargeback follow-ups | <4 business hours; refunds executed per `./04-PAYMENT-OPERATIONS.md` §1 (refund-before-dispute doctrine) | Founder (a vetted VA, if engaged, may send template #3/#7/#8 verbatim) |
| **S3** | Product defects: wrong classification, parse failures, broken flows | <4 business hours acknowledgment; bug logged for the AI assistant; if ≥3 users report the same misclassification in 24h → crisis-playbook Scenario 4 | Founder + AI assistant (fix) |
| **S4** | How-to, expectations, feature requests, general questions | <4 business hours via canned responses; KB link | Founder (or a vetted VA, canned responses only) |

---

## 7. Knowledge-base structure (mirrors the canned topics)

One section per cluster; each article is the long-form twin of its canned response, same numbering, so support replies can always link instead of retyping.

1. **Understanding your notice** — articles #1, #15, #16, #17
2. **Honest expectations** — articles #2, #4, #5, #13, #14 (this section IS the trust wedge; it gets linked from the purchase flow)
3. **Using AppealDeck** — articles #6, #10, #12
4. **Licenses & devices** — articles #7, #8
5. **Billing, refunds & Guardian** — articles #3, #11, #18
6. **Privacy & data** — article #9 + privacy-policy link
7. **Contact & everything else** — articles #19, #20, support hours, the §2 response-time promise in public form

---

## 8. Weekly support→product feedback loop

Support is the cheapest product-research channel this business will ever have. Every week, before the weekly decision review (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §5):

1. Pull from the ticket log: tickets/day trend, top-5 topic tags by volume, refund-reason tags, any repeated misclassification reports, feature-request tally.
2. Convert to at most 3 product actions (bug fix, copy fix, KB article, onboarding change) — filed to the AI assistant with the source tickets linked.
3. Feed the numbers into the analytics weekly template (`./03-ANALYTICS-AND-METRICS.md` §3) — support volume and refund reasons are review inputs, not a separate meeting.

- [ ] **10. Run the loop weekly from launch week; log the ≤3 product actions and their outcomes in the ticket sheet.** — **Owner:** Founder (analysis) + AI assistant (fixes) · **Cost:** $0 · **Deadline:** weekly, from Week 8 · **Blocks:** product-quality flywheel, refund-rate reduction

---

## Definition of done

- [ ] Support email, ticket log, and Notion/Docsify KB live; auto-reply configured; Tawk.to decision made.
- [ ] All 20 canned responses written, founder-reviewed, banned-word/success-claim grep clean, and mirrored as KB articles in the §7 structure.
- [ ] <4h business-hours response target verified over a 48h beta window (Gate-3 check 32).
- [ ] Night flow tested (auto-reply on every after-hours ticket + morning batch clearing the queue); founder decision (item 8) recorded.
- [ ] Both volume thresholds on the weekly tripwire dashboard; the crisis threshold points at `./02-CRISIS-PLAYBOOK.md`.
- [ ] Severity classes in use in the ticket log; at least one full week of the §8 feedback loop completed with actions logged.

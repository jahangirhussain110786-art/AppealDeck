# Crisis Playbook — the 24-hour protocol and the five scenarios

**Why this file exists / when to use it:** AppealDeck's value proposition (helping banned sellers) creates built-in crisis vectors: a rejected appeal becomes "the tool got me banned," a panic wave becomes a refund storm, an Amazon policy edit can outlaw a feature mid-build. The verified pattern across every studied recovery is that speed and preparation decide the outcome — responding in ~2 hours instead of 36 turned out to be the difference between a small refund and a five-figure cascade [source: APPEALDECK_CRISIS_SCENARIO_PLANNING.md, Supp case study]. This playbook is built BEFORE any crisis, rehearsed before M-7 (Gate-2 check 26 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`), and executed without re-deliberation when a trigger fires. Ticket-volume triggers arrive from `./01-SUPPORT-OPERATIONS.md` §5; metric triggers from `./03-ANALYTICS-AND-METRICS.md` §4.

**Terms:** POA = Plan of Action (the appeal document). CWS = Chrome Web Store. MoR = Merchant of Record (Paddle/Polar — the payment provider that legally resells the product). BSA §19 = Amazon's Business Solutions Agreement "Agent Policy" (effective 4 Mar 2026), restricting automated access to Seller Central. HN = Hacker News. Staged rollout = CWS feature releasing an update to a percentage of users at a time (available only at 10,000+ users). Remote settings = configuration the extension fetches from our server at startup, letting us change behavior without a CWS review. Post-mortem = the written analysis after an incident.

---

## 1. Activation criteria

Any ONE of these activates the 24-hour protocol (§2) immediately:

- Viral negative thread: >100 upvotes or >50 comments on Reddit/X/Facebook, or front-page HN.
- CWS rating drops >0.3 stars in 24h with review volume >3x baseline.
- Refund requests >10 in 24 hours, or any single refund request paired with a public "going public" threat.
- Wrong-classification evidence from >3 users in 24 hours.
- Any Amazon policy announcement touching BSA §19, CWS Seller-Central extensions, or SP-API access rules.
- Support crisis threshold trips (>20 tickets/day for 3 days — `./01-SUPPORT-OPERATIONS.md` §5).

---

## 2. The 24-hour response protocol (hour-by-hour)

| Hour | Step | Owner | Detail |
|---|---|---|---|
| **0** | **Detect** | Founder / Jhangir | Monitoring fires: Reddit (r/FulfillmentByAmazon, r/AmazonSeller), X mentions, Facebook groups, CWS reviews, support inbox, analytics anomaly. |
| **0–1** | **Triage** | Founder | Screenshot everything (post text, comments, timestamps, usernames). Classify severity 1–5 (1 = single unhappy user, 3 = spreading thread or multi-user bug, 5 = existential: MoR freeze, mass ban attribution, policy kill). Determine: bug, misuse, coordinated attack, or platform change. |
| **1–2** | **Assemble** | Founder + Jhangir | Short call/chat. Review the specific cases named. Pick the scenario (§4) and the matching template (A–E). If Jhangir is unavailable, the founder proceeds alone — the templates carry the load. |
| **2–4** | **Draft** | Founder | Write ONE public response (single message, single venue — never per-comment replies). Draft internal notes and the support canned-response variant so every channel says the same thing. Nothing publishes yet. |
| **4–6** | **Pause & alert** | Founder | If the public narrative is negative: pause ALL paid acquisition immediately. Proactively alert the MoR (Paddle/Polar dashboard message) that elevated refunds/disputes may follow — MoRs punish surprises, not incidents. |
| **6–12** | **Respond** | Founder | Post the ONE calm public reply (in the thread if permitted, otherwise on our own channels). Email affected users directly and personally. Message the original poster privately offering a direct conversation. |
| **12–18** | **Fix** | AI assistant (founder approves anything public-facing) | If a bug: deploy the hotfix — remote-settings/taxonomy config first (instant, no review), CWS update second (staged rollout where available). Update the status page / "What's new". |
| **18–24** | **Follow up** | Founder + Jhangir | Personal replies to escalated threads; community update if the fix shipped; begin the post-mortem (§7) while memory is fresh. |

**Rules that hold at every hour:** one voice (the founder's), no arguing, no speculation about Amazon's internal decisions, no admission of legal fault, never the banned word (see D6 in `../00-DECISION/02-DECISION-LOG.md`), always route severe account situations to the professional-help screen rather than debating case merits in public.

---

## 3. Roles

| Role | Person | Does | Does NOT |
|---|---|---|---|
| **Crisis lead** | Founder | Final authority on every public statement; approves refunds above the standing policy; pauses/resumes marketing; owns MoR communication | Go offline mid-crisis without handing a monitoring window to Jhangir |
| **Community triage** | Jhangir — *reliability unverified; treat as best-effort until the trial in `./01-SUPPORT-OPERATIONS.md` §4 passes* | Monitors forums/DMs, flags high-risk posts to founder within 30 min, sends approved canned responses only | Make public statements for the company; improvise wording; promise anything |
| **Jhangir-unavailable fallback** | Founder | Founder covers monitoring at reduced cadence (every 2–3h during waking hours); the support auto-reply and pre-drafted templates absorb the gap; no crisis step is skipped, steps just run on founder hours | — |
| **Technical fix** | AI assistant | Diagnoses, writes hotfixes, prepares remote-settings changes and CWS updates | Ship anything user-visible without founder approval |
| **Legal/PR (as needed)** | External | Reviews public statements in Scenario 1 or 5 when stakes justify it (~€500–2,000 (estimate)) | — |

- [ ] **1. ⚠ FOUNDER-DECISION — pre-authorize the external-counsel spend ceiling for crises.** Decide NOW (calmly) the maximum the founder may spend on emergency legal/PR review without a second thought (suggested €1,000); write it here. Deciding mid-crisis wastes the hours that matter. — **Owner:** Founder · **Cost:** $0 now · **Deadline:** before M-7 · **Blocks:** hour-2–6 execution speed in Scenarios 1 and 5

---

## 4. The five scenarios

### Scenario 1 — Viral "tool got me banned" thread

- **Trigger threshold:** a post blaming AppealDeck for a ban/rejection reaches >100 upvotes or >50 comments, or hits front-page HN/Reddit.
- **Likely causes:** seller blames the tool for their case facts; a rejected POA attributed to us; competitor or manufactured narrative; Amazon's automated screening rejecting an appeal the user believes we "approved."
- **Response steps:**
  1. Do NOT reply instantly — early replies feed the algorithm and read as defensive. Hours 0–2: screenshot, classify (genuine bug / misuse / attack).
  2. Review the actual case if the user is identifiable; if their account is genuinely at risk, route them to the professional-help screen privately — never debate their case in public.
  3. Hours 6–12: post ONE calm, factual response (Template A). Email/DM the original poster offering a direct conversation.
  4. If genuine bug: fix it (Scenario 4 machinery) and announce the fix. If manufactured: document everything, do not engage further publicly.
  5. Pause paid acquisition until the narrative stabilizes (typically 48–72h for the wave to peak (estimate)). Publish an FAQ/counter-post on our own site afterward — the thread will outlive the news cycle in search results.
- **Template A (adapt, one message, one venue):**
  > We've seen the discussion about [topic] and we take every user's experience seriously. AppealDeck is a document-preparation tool — it does not submit appeals, automate any action in Seller Central, or promise outcomes; what you submit is always your decision and your document. If you're facing an account issue, please contact us directly at [support email] so we can review exactly what happened. We're here to help.

### Scenario 2 — CWS review bombing

- **Trigger threshold:** rating drops >0.3 stars in 24h combined with review volume >3x baseline, or clear coordination signals (same phrases, same-day accounts, off-topic content).
- **Response steps:**
  1. Hours 0–2: document — screenshot every suspicious review (username, timestamp, text, rating); note the coordination pattern. Do not reply to individual reviews.
  2. Hours 2–24: flag policy-violating reviews through the official CWS "Report a concern" channel with the evidence (Google removes policy violations, not "unfair" opinions — expect slow or no action; documented cases show months of silence [source: APPEALDECK_CRISIS_SCENARIO_PLANNING.md]).
  3. Post ONE calm reply on the most visible review or our support page (Template B). Then stop engaging publicly.
  4. Days 2–14: rebuild velocity — ask recent genuinely happy users (design partners, beta testers) for authentic reviews, with no incentive and no framing around the attack. **Never incentivize reviews — that is itself a CWS Spam & Abuse policy violation and hands the attackers a real takedown reason.**
  5. Monitor rating velocity daily until recovered; recent reviews weigh heavier on CWS, so a steady authentic flow recovers the number in weeks-to-months (estimate 30–90 days).
- **Template B:**
  > We've noticed an unusual volume of reviews in the last 24 hours. We take all feedback seriously. If you have a genuine concern about the extension, please reach out at [support email] — we read and answer everything. We're actively monitoring and will address any legitimate issue.

### Scenario 3 — Refund storm (refund rate >30%)

- **Trigger threshold:** refund rate exceeds 30% of recent sales — typically after a mass-suspension wave drives panic purchases whose appeals then fail. (The pause-marketing tripwire fires earlier, at >15% — kill criterion K4.)
- **Response steps:**
  1. Day 1 — stop the bleeding: enable the fastest, lowest-friction voluntary refund handling (the 7-day no-questions policy already exists — D8; now honor it proactively and fast). Never fight a refund: a refund costs one sale; a dispute costs a chargeback fee, ratio damage, and ultimately the MoR account (`./04-PAYMENT-OPERATIONS.md` §1). Alert the MoR that volume is elevated.
  2. Days 2–3 — diagnose: tag every refund with a reason code. Majority "POA didn't work / rejected anyway" → classification or expectations problem; majority "not what I expected" → honest-expectations card or marketing copy failing; clustered on one violation type → taxonomy bug (go to Scenario 4).
  3. Days 4–7 — fix and communicate: hotfix classification bugs within 48h; rewrite onboarding/expectation copy for mismatches; email refunders personally ("we noticed your appeal didn't get the result you hoped for — here's what we're fixing").
  4. If refund rate >15% persists: marketing stays paused (K4). Log every reason — the refund log IS the product roadmap for the next fortnight.
- **Template C:**
  > We're processing your request now. [If approved:] Your refund has been processed and should appear in 3–5 business days. We're sorry the tool didn't meet your expectations — if you're willing to tell us what went wrong, it directly shapes what we fix next. [If expectation issue:] We want to make sure AppealDeck actually works for you — could we do a 10-minute call to understand what happened?

### Scenario 4 — Wrong classification → bad POA → hotfix

- **Trigger threshold:** critic pass rates drop on one violation type; support tickets from >3 users in 24h cite "wrong type" or a POA that argues the wrong case; rejection-parser output shows systematic mismatch. (Kill criterion K12.)
- **Response steps:**
  1. Hours 0–2: diagnose scope — deterministic rule error (taxonomy rules) vs. LLM ambiguity (classifier prompt) vs. both. Count affected cases since launch.
  2. Hours 2–6: fix — patch taxonomy rules first (covers the majority of cases immediately), then classifier prompt/few-shot examples/schema tightening.
  3. Hours 6–24: ship — remote-settings config push first if the taxonomy loads remotely (instant, no CWS review); otherwise CWS update. Use staged rollout (5% → monitor 48h → 25% → 50% → 100%) once the install base exceeds the 10,000-user CWS threshold; below that it's a big-bang update, so test harder before pushing.
  4. Hours 24–48: email every affected user (Template D); post a brief factual note on community channels; update the CWS "What's new".
  5. Days 3–7: verify "wrong type" mentions drop to zero; offer affected users a free regeneration (and where materially harmed, a refund or Pass re-activation).
- **Communication principles:** admit the bug plainly, say exactly what was wrong and what changed, give a concrete next step (reopen case → regenerate), never blame Amazon or the user, never promise the corrected POA will succeed.
- **Template D:**
  > We identified an issue where [violation type A] was sometimes misclassified as [type B], which affected the POA strategy for some cases. We've fixed the classifier and shipped an update. If you drafted a POA based on the wrong type, please reopen your case — the corrected classification will show, and you can regenerate your draft at no charge. We're sorry for the confusion, and we're here if this affected your appeal: [support email].

### Scenario 5 — Amazon policy change mid-flight

- **Trigger threshold:** Amazon announces any BSA §19 / Agent Policy expansion, CWS adds Seller-Central-extension restrictions, or enforcement signals appear in seller forums — at any time, but especially between M-3 and M-8. (Precedent: the Mar 2026 policy was announced with ~2 weeks' effective notice, and Helium 10 killed its automation extension at the June 2026 enforcement deadline.)
- **Standing monitoring (cheap, continuous):** Seller Central announcement board + BSA help page bookmarked; Google Alerts on "Amazon BSA update", "Amazon Agent Policy", "Chrome Web Store Seller Central"; Jhangir watches seller forums for enforcement chatter.
- **Response steps:**
  1. Immediately: halt development/rollout of any affected feature (the injector first — it is by design the last-or-never feature; DOM-harvest second; paste-mode and the web decoder are the architecture's safe spine and survive every plausible reading — D3).
  2. Within days: obtain and read the ACTUAL policy text (Jhangir retrieves from behind seller login — third-party summaries do not count, per Gate-2 check 17). Scoped counsel read if ambiguous (§3 spend ceiling).
  3. Update the build plan and decision log: feature de-scoped, deferred, or cleared — in writing.
  4. If the CWS listing or store description no longer matches reality: pause the CWS submission rather than submit under stale assumptions; resubmit after revision. The web decoder keeps earning meanwhile — that is exactly why it ships first.
  5. Communicate to users only once the assessment is done (Template E) — a wrong early statement is worse than a day of silence here.
- **Template E:**
  > Amazon has updated [BSA §19 / CWS policy]. We've reviewed the change and [updated the product / confirmed our current design already complies / removed feature X]. [If removed:] Feature X is no longer available, but the same result takes about 30 seconds manually: [alternative workflow]. Keeping AppealDeck compliant and useful is the whole point — questions welcome at [support email].

---

## 5. What works / what doesn't (verified case evidence)

**Works** [source: APPEALDECK_CRISIS_SCENARIO_PLANNING.md recovery case studies]:
- **Speed:** a ~2-hour response versus a 36-hour silence was the difference between a small refund and a $37K cascade (Supp, 2026).
- **One voice:** a single calm public reply beats arguing with each reviewer (every studied case).
- **Admit what you know:** "we see the issue, we're fixing it, ETA [timeframe]" beats silence and beats deflection (Indie Hackers 2026 — over-communication every 12h dropped churn below normal).
- **Playbooks built before the crisis:** the fastest recoveries all had pre-written templates, escalation paths, and refund authority in place (Supp post-crisis protocol; Buffer root-cause fix).

**Doesn't work:**
- Arguing with reviewers publicly (confirms the narrative, feeds the thread).
- Incentivized reviews (a CWS policy violation that converts a reputation problem into a takedown problem).
- Silence (reads as guilt; the Supp $37K case started as one unanswered ticket).
- Expecting Google to remove "unfair" reviews (documented refusals even for bot floods; only clear policy violations get actioned, slowly).

---

## 6. Rehearsal requirement (Gate-2 item)

- [ ] **2. Rehearse the protocol before M-7: the founder recites the hour-by-hour sequence, the five scenario triggers, and the location of the five templates — from memory, without this file open.** Then run one 30-minute tabletop: pick Scenario 1, walk hours 0–24 against a fabricated thread, actually draft the Template-A adaptation. This is Gate-2 check 26 in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`. — **Owner:** Founder (+ Jhangir for his steps) · **Cost:** $0 · **Deadline:** before M-7 · **Blocks:** Gate 2
- [ ] **3. Pre-load Templates A–E and the activation criteria into the support Notion space and the founder's phone (offline copy).** A playbook that lives only on a machine you're not at during hour 0 is not a playbook. — **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-7 · **Blocks:** hour-0 execution
- [ ] **4. Set up the standing monitors:** Google Alerts (three queries above), Reddit/X watch cadence (every 2h during business hours; Jhangir overnight best-effort), CWS review-notification email verified working. — **Owner:** Founder + Jhangir · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** detection (hour 0)
- [ ] **5. After every incident or near-miss: update this playbook within 7 days (post-mortem §7 action items land here).** Quarterly, even with zero incidents: re-run the tabletop. — **Owner:** Founder · **Cost:** $0 · **Deadline:** ongoing · **Blocks:** playbook staying alive

---

## 7. Post-mortem template (start at hour 18–24, finish within 7 days)

Copy this skeleton for every incident:

```
INCIDENT POST-MORTEM — [name] — [date]
Severity (1–5):            Scenario (1–5 / other):
Detected by / at:          Time to first internal action:
Time to public response:   Time to fix shipped:

TIMELINE (timestamped, factual, no blame):
- ...

ROOT CAUSE (the real one, not the proximate one):

IMPACT: users affected / refunds issued / revenue effect / rating change / thread reach:

WHAT WORKED:

WHAT FAILED OR WAS SLOW:

ACTION ITEMS (each with owner + deadline; playbook edits land in this file):
1. ...

DETECTION IMPROVEMENT: would we catch it faster next time? How?
```

Rules: blameless, written by the founder, shared with Jhangir, and the action items go into the weekly decision review (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §5) until closed.

---

## Definition of done

- [ ] Founder passes the recitation test (protocol, triggers, template locations) and the tabletop has been run once — before M-7 (Gate-2 check 26).
- [ ] Templates A–E adapted with real product/support details and stored in two places (Notion + offline).
- [ ] Standing monitors live and test-fired (one dummy alert observed end-to-end).
- [ ] The external-counsel spend ceiling (item 1) is decided and written into §3.
- [ ] Every activation criterion in §1 has a live data source (support log, CWS console, analytics, community watch).
- [ ] After launch: any incident within the first quarter has a completed post-mortem and this file shows the resulting edits.

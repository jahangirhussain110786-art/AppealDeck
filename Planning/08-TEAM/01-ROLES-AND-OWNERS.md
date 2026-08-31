# Roles and Owners — who does what, who decides what, and how the founder survives 8 weeks

**Why this file exists / when to use it:** Every action item in this playbook carries one of three owner labels — **Founder**, **AI assistant**, **External**. This file defines exactly what each of those labels means, what each role can and cannot do, what requires the founder's sign-off, how much founder time each week realistically costs, and the guardrails that keep the single human at the center of this project from burning out. Read it once at handover so a new team (or a future AI session) can self-organize without asking "who owns this?"; return to it whenever an ownership or sign-off question comes up.

**Terms used here:** POA = Plan of Action, the written appeal document Amazon requires from suspended sellers. Seller Central = Amazon's logged-in seller dashboard. BSA §19 = section 19 of Amazon's Business Solutions Agreement (the "Agent Policy", effective 4 Mar 2026, governing third-party tools). CWS = Chrome Web Store. MoR = Merchant of Record, the payment provider (Paddle) that legally resells the product. M-1…M-8 = the 8 weekly milestones of the build plan (`../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`). E&O = errors-and-omissions insurance. QC = quality control. VA = virtual assistant.

---

## 1. The three owner roles at a glance

| Role | Who it is | One-line mandate | Hard limits |
|---|---|---|---|
| **Founder** | Jhangir Hussain (solo, Pakistan, non-developer) | Owns the business: every account, every payment, every public word, every approval — plus Seller Central access, the BSA §19 read, and talent sourcing | Time — the scarcest resource in the project |
| **AI assistant** | The AI coding assistant (currently Claude Code) | Tech lead: executes the ENTIRE build M-1→M-8 per the build plan + amendments | Cannot open accounts, sign contracts, spend money, or post publicly |
| **External** | Paid outside specialists | Bought expertise the team does not have | Scoped, one-off or retainer engagements only — no standing authority; engaged per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md` |

### 1.1 Founder — the business owner

The founder personally holds and never delegates:

- **All accounts:** domain registrar, hosting (Cloudflare, Supabase), MoR (Paddle), CWS developer account, Google AI Studio, analytics, support email, bank/Wise. Others get least-privilege invites at most, never shared passwords (protocol in `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md` §2 clause 5).
- **All spending:** no other role can commit a single dollar. The AI assistant proposes costs; the founder pays or declines.
- **The community voice:** every public post, reply, and outreach message is sent by the founder (drafts can come from anyone). One named human voice is a deliberate trust strategy in a scam-scarred market (see `../05-PHASE-4-GROWTH/02-COMMUNITY-PLAYBOOK.md`).
- **All approvals:** milestone gate confirmations, user-facing copy, pricing, hiring decisions.
- **All external contacts:** consultants, press, moderators, design partners, lawyers, brokers. Nothing is sent to an outside party without founder review of the exact text.

The founder is *not* expected to write code, review diffs line-by-line, or make architectural calls — that is the point of the next role.

### 1.2 AI coding assistant — the tech lead

The AI assistant is the executor of the entire technical build, M-1 through M-8, per the build plan (`../03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md`) as amended (`../03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`). There is no human developer on this project and none is planned — "hire a tech dev" was explicitly dropped from the requirements list [source: The Second Opinion.md, team checklist].

**Can and should, without asking:** all coding, architecture-within-the-plan, test writing, fixture-corpus drafting, copy drafting (founder approves before anything ships), research, documentation, refactoring, dependency selection consistent with the locked stack.

**Cannot, ever:** open or hold accounts, sign anything, accept terms of service, spend money, post publicly, send outreach, or share credentials. These are structural limits, not trust limits — the assistant has no legal personhood and no payment card.

**Standing obligations:**
- Log every non-trivial decision (anything a future session would otherwise have to re-derive) in `docs/DECISIONS.md` in the repo — format and ritual in `./03-AI-SESSION-CONTINUITY.md`.
- Treat build plan §2.6 forbidden sources as inviolable (the spchatgpt*/core.js ban — verbatim text in `./03-AI-SESSION-CONTINUITY.md` §2).
- Never reopen decisions D1–D10 (`../00-DECISION/02-DECISION-LOG.md`); deviations require a founder-approved decision-log append.
- Maintain session continuity per `./03-AI-SESSION-CONTINUITY.md` — the AI's context is the project's real bus factor.

### 1.3 Access and expertise paths (solo founder — no partner dependencies)

The project has no second principal (decision-log §3 row 14). The assets an external partner was once expected to provide are covered by the founder directly, each with a defined path:

| Need | Why it matters | Path |
|---|---|---|
| Active Seller Central access (read-only) | M-6 live-QA gate; fixtures cover M-1→M-5 without it | Design partners' accounts (ask Week 4, access by Week 6, written consent via secondary-user invite — `../04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md`); and/or the founder registers a fresh Individual seller account, ~1–2 weeks, shows a clean page only [source: The Second Opinion.md, amendment 4] |
| BSA §19 full-text retrieval (sits behind seller login) | Gates the extension's DOM-harvest and injector features (decision D3) | Founder's own seller account; any design partner can also screenshot the text |
| Appeals expertise / template input | POA template quality | Consultant retainer, ~$1–2k, Week 3 (§1.4) — the independent quality floor; no template ships on the founder's judgment alone |
| Talent sourcing (VA/writer pool) | Cheap, capable support and content help | Direct Fiverr/Upwork sourcing per `./02-RECRUITMENT-KIT.md`; every appeals candidate passes the paid audition |
| Night community triage (US evening = PK night) | Founder sleep protection | Auto-reply + canned responses + founder morning batch — the default posture; a vetted night VA may be added later per the collaborator policy (`../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §4) |

**Hard rule (from `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`): nothing is shared with any future collaborator in either direction — no credentials, no prompts, no templates, no fixture corpus, no roadmap internals — before a written agreement is signed.** All candidates pass the paid audition in `./02-RECRUITMENT-KIT.md`, however they were sourced.

### 1.4 External — bought expertise

| External role | Engagement | Cost | When |
|---|---|---|---|
| **Appeals-QC consultant** | Paid scoped review of POA templates + taxonomy outputs; the independent quality floor under all appeals content | ~$1–2k one-time | Week 3 (blocks M-4 quality) — recruitment mechanics in `./02-RECRUITMENT-KIT.md` §2 |
| **Accountant (local)** | One call: tax obligations for an individual seller receiving MoR payouts; then annual books | ~$50–200 for the call (estimate) | Week 1–2 |
| **Scoped counsel (optional but prudent)** | Cheap scoped review ($500–1,500) of the software+document-prep positioning before US marketing spend; NOT the old $2–8k full opinion, which is no longer a hard gate | $500–1,500 | Before meaningful US marketing spend (pre-M-8 at the earliest) |
| **E&O insurance broker** | Errors-and-omissions policy quote for a document-preparation software product | Policy $500–2,500/yr | Before public launch |

Externals advise; the founder decides. No external gets repo access, prompt templates, or raw outcome data (IP staging rules in `./02-RECRUITMENT-KIT.md` §6).

---

## 2. Decision rights — who decides what

The default is: **the AI assistant decides technical matters inside the locked plan; the founder decides everything that touches money, the public, or the law; nobody reopens D1–D10.**

| Decision domain | Decides | Must be consulted | Notes |
|---|---|---|---|
| Technical implementation within the build plan + amendments | AI assistant | — (logged in `docs/DECISIONS.md`) | Founder reads the log weekly, does not pre-approve |
| Deviation from locked decisions D1–D10 | Founder only | AI assistant states the case in writing | Requires an append to `../00-DECISION/02-DECISION-LOG.md`; treated as exceptional |
| Any spending, any amount | Founder | AI assistant provides cost/benefit | No delegated budget exists |
| Any outbound contact (consultant, press, moderator, design partner, candidate) | Founder approves the exact text, per contact | Drafter (AI assistant) | "Per contact" — one approval never generalizes to a campaign |
| Anything user-facing: UI copy, marketing, pricing, legal pages, canned responses, store listing | Founder sign-off on final text | AI assistant drafts; consultant QCs appeals content | Ethics spine D6 applies: no "guarantee", no success-rate claims without opt-in outcome data |
| Hiring / firing contractors | Founder | Audition scores (`./02-RECRUITMENT-KIT.md`) | Sourced directly on Fiverr/Upwork; the audition decides, not the pitch |
| Night-triage replies | Founder morning batch by default; a future night VA (if engaged per the collaborator policy) is restricted to approved canned responses #1–20 | — | Any VA escalates severity S1/S2 to founder immediately; no policy exceptions, no refund promises beyond template #3 (`../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §4) |
| Milestone gate pass/fail | Founder confirms | AI assistant presents the gate evidence | Gates and kill criteria: `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` |
| Legal/compliance interpretation (BSA §19 read, UPL posture) | Founder | External counsel where engaged; AI assistant summarizes | The §19 read gates DOM-harvest — decision D3 |
| Crisis response (viral thread, refund storm, MoR trouble) | Founder executes `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md` | AI assistant drafts responses | Pre-agreed playbook exists precisely so this is execution, not deliberation |

**What always requires founder sign-off, no exceptions: all outbound contacts, all spending, anything user-facing.** Everything else defaults to the role that owns the domain.

---

## 3. Founder weekly time budget (estimate — labeled as such, revise against reality)

The AI assistant carries the build; the founder's time goes to accounts, approvals, outreach, QA, and community. These figures are planning estimates, not measurements — track actual hours in week 1–2 and re-baseline.

| Week | Milestone focus | Founder hours (estimate) | Where the hours go |
|---|---|---|---|
| 1 | M-1: credentials rotated, accounts, domain | 12–16 | Account opening marathon, credential rotation, Paddle application + Polar fallback setup, accountant call |
| 2 | M-2 build; recruitment starts | 8–12 | Audition gigs posted + founder-approved outreach, community presence begins (named-founder posts), design-partner conversations |
| 3 | M-3 build; consultant retained | 8–12 | Consultant selection + engagement, audition scoring, community cadence |
| 4 | M-4 / web decoder approaching | 8–12 | Template review loop with consultant, copy review, MoR follow-up |
| 5 | M-W: web decoder + checkout LIVE | 12–16 | Launch review, legal pages, pricing copy, first-sales monitoring, refund handling |
| 6 | M-5/M-6: extension, live QA | 10–14 | Live Seller Central QA session, design-partner coordination, beta prep |
| 7 | M-7: beta + CWS submission | 12–16 | Beta support, canned-response review (every word), store listing review |
| 8 | M-8: public launch | 15–20 | Launch execution, community replies, support, monitoring dashboards |

Total: roughly 85–120 hours over 8 weeks (estimate). If actuals run more than ~50% over budget for two consecutive weeks, that is itself a burnout early-warning signal (§4) — cut scope (defer the injector, defer Guardian — both already deferred by D3/D7) rather than adding hours.

> ⚠ **FOUNDER-DECISION — personal hour ceiling and boundary hours.** Only the founder knows their real capacity alongside the existing lead-gen business. Set two numbers now and write them into the calendar: (a) a weekly hour ceiling for AppealDeck (the table above assumes ~12–20 at peak), and (b) hard daily boundary times outside which no AppealDeck work happens (the support policy in `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §2 assumes roughly 09:00–17:00 PK). These are personal-judgment numbers nobody else can set.

---

## 4. Burnout guardrails (pre-agreed — execute, don't renegotiate under stress)

Solo-founder burnout is a named existential risk (MR-02 in the master risk register): the 8-week cycle concentrates it in two spikes — the M-1→M-6 build sprint and the M-6→M-8 support wave — and the US/PK timezone split means seller panic peaks while PK sleeps. **Caveat on the numbers:** the burnout statistics in the source research (prevalence percentages, productivity-decline figures) come from weak aggregator sites recycling small surveys — treat them directionally ("common, serious, and worst right when the product starts working"), never numerically [source: STREAM_7_FOUNDER_PARTNERSHIP_RISK.md §4]. The guardrails below don't depend on any statistic.

**The guardrails:**

1. **Hard work-hour boundaries.** No tickets, no community, no code review outside the boundary hours set in the §3 founder-decision box. The auto-reply in `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §2 makes this honest rather than negligent: customers are told the real response window. A rested founder at 08:00 beats a fried one at 03:00.
2. **Ticket thresholds trip automatic responses** (defined with the support stack in `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md`, crisis procedures in `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`):
   - Support consuming **>2 hours/day consistently** → warning: expand the knowledge base, promote the canned responses, consider part-time help.
   - **>20 tickets/day for 3+ days** → crisis threshold: deploy canned responses everywhere, delegate community triage, and pull the pause-marketing lever.
3. **The pause-marketing lever (pre-agreed, no deliberation needed).** Stopping outreach, SEO pushes, and community promotion for days-to-weeks is an approved move whenever ticket volume crosses the crisis threshold or refund diagnostics demand it (it is likewise pre-agreed for chargeback spikes — MR-01). Revenue delay is recoverable; founder collapse is not. Nobody needs permission to *suggest* pulling it; the founder pulls it.
4. **Night coverage is structural, not heroic.** US-evening tickets (PK night) get the honest auto-reply and the founder's morning batch; if volume ever justifies it, a vetted night VA restricted to approved canned responses may be added per the collaborator policy (`../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` §4).
5. **Early-warning signs — any one of these triggers a same-week scope cut and, if two co-occur, the pause-marketing lever:**
   - Founder response time to tickets exceeds 24h during business days.
   - Founder misses community posts/replies for 48h+ despite open items.
   - The weekly review (D10 cadence) is skipped.
   - Actual hours exceed the §3 ceiling two weeks running.
   - Sleep or the existing lead-gen business is being cannibalized (self-reported — put it on the weekly-review agenda so it is actually asked).

**Pre-agreed responses, in escalation order:** deploy canned responses → hand triage to a vetted VA (if one is engaged per the collaborator policy) → pause marketing → defer non-gate scope (injector, Guardian, P1 backlog) → extend the timeline. Killing the launch date is cheaper than killing the founder's capacity; the gates in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` are quality gates, not calendar promises.

---

## 5. Action items

- [ ] **1. Confirm this role split at handover.** Founder reads this file, confirms the three-role model and the §2 decision-rights table, and records any changes as a decision-log append. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** every Owner label in the playbook meaning the same thing to everyone
- [ ] **2. Set the personal hour ceiling and boundary hours (⚠ FOUNDER-DECISION in §3) and put them in the calendar.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** honest support auto-reply copy, burnout guardrail 1
- [ ] **3. Adopt the collaborator policy** (no partnership agreement exists — solo founder; the policy binds before any future collaborator gets access). Full spec: `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** any future collaborator engagement
- [ ] **4. Engage the appeals-QC consultant.** Selection + outreach mechanics in `./02-RECRUITMENT-KIT.md`. — **Owner:** Founder · **Cost:** ~$1–2k · **Deadline:** Week 3 · **Blocks:** M-4 template quality; the independent expertise floor
- [ ] **5. Book the accountant call (MoR-payout tax question) and request an E&O quote.** — **Owner:** Founder · **Cost:** ~PKR 10,000–30,000 call (estimate); policy $500–2,500/yr · **Deadline:** call Week 1–2; policy bound before public launch (M-8) · **Blocks:** tax compliance clarity; launch risk cover
- [ ] **6. Start tracking actual founder hours against the §3 budget** (a column in the weekly-review sheet is enough). — **Owner:** Founder · **Cost:** $0 · **Deadline:** from Week 1, weekly · **Blocks:** early-warning signal 4 in §4
- [ ] **7. Confirm the ticket thresholds and pause-marketing lever are wired into the support stack** (auto-reply live, thresholds written into the ticket log, crisis playbook cross-checked). — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** Week 6 (with `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` setup) · **Blocks:** burnout guardrails 2–3 being real rather than aspirational

---

## Definition of done

- [ ] All three roles' mandates and limits are understood by the founder, and the AI assistant's CLAUDE.md references this file.
- [ ] The §2 decision-rights table has been applied at least once without dispute (e.g., first outreach approval, first decision-log entry).
- [ ] The collaborator policy's do-not-share rule has never been violated (checked whenever anyone new is engaged).
- [ ] The consultant, accountant, and E&O engagements exist by their deadlines (items 4–5).
- [ ] The founder's hour ceiling and boundary hours are set, calendared, and tracked weekly.
- [ ] The ticket thresholds and pause-marketing lever exist in the live support setup, not just on paper.

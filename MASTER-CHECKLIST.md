# MASTER CHECKLIST — the one sequential execution list

**Why this file exists / when to use it:** This is the spine of the whole project. Execute top to bottom; do not skip a gate. Every item links to the file holding the full procedure — this list carries only the action, owner, cost, timing, and what it blocks. Day 1 = the first day of execution. Milestones M-1…M-8 are the 8-week build schedule defined in [03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md](03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md).

Owners: **F** = Founder (Jhangir Hussain — solo) · **AI** = AI assistant · **X** = External. Full role definitions: [08-TEAM/01-ROLES-AND-OWNERS.md](08-TEAM/01-ROLES-AND-OWNERS.md).

---

## PHASE 0 — BLOCKERS (Day 1–3; nothing else starts until these are done)

- [ ] **1. Rotate the leaked Supabase/Postgres credentials and scrub the files** — F · $0 · Day 1 · blocks: everything → [01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md](01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md)
- [ ] **2. Read and adopt the collaborator policy** (solo founder — no partnership agreement exists or is needed; the policy binds before ANY future contractor, VA, or appeals expert gets access to anything) — F · $0 · Day 1 · blocks: nothing now; all future collaborator engagements → [01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md](01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md)
- [ ] **3. Individual seller setup ready** — F · $0 · Day 1–3 · blocks: payment-provider applications, invoicing → [01-PHASE-0-BLOCKERS/03-INDIVIDUAL-SELLER-SETUP.md](01-PHASE-0-BLOCKERS/03-INDIVIDUAL-SELLER-SETUP.md)

## PHASE 1 — FOUNDATION (Week 1–2)

- [ ] **4. Register the domain; put up the minimal landing page** — F · ~$15 · Week 1 · blocks: payment applications, store listing → [02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md](02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md)
- [ ] **5. Draft and publish privacy policy + terms** (AI drafts, founder reviews/publishes; consumer-withdrawal-compliant refund terms) — F+AI · $0 · Week 1 · blocks: Paddle, CWS → same file as item 4
- [ ] **6. Open all service accounts** (CWS developer $5 + contact-details verification; fresh Supabase project; hosting; Gemini API paid tier; Wise/Payoneer payout account; analytics) — F · ~$5–50 · Week 1 · blocks: build, payments, launch → [02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md](02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md)
- [ ] **7. Apply to Paddle + open the Polar warm fallback** (behind the live site + legal pages; verify Polar's Pakistan payout at signup — Dodo Payments is plan-C); configure Appeal Pass $199 product — F · $0 · Week 1 · blocks: all revenue → [02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md](02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md)
- [ ] **8. Initialize the code repo + CI + CLAUDE.md** (git, .gitignore for secrets, private remote) — AI · $0 · Week 1 · blocks: M-1 → [02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md](02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md)
- [ ] **9. Build the fixture corpus** (≥4 notices per v1 violation type + adversarial fixtures) — AI · $0 · Week 1–2 · blocks: M-3 accuracy gate → same file as item 8
- [ ] **10. Start community presence** (Reddit + FBA groups + forums; named founder; no pitching) — F · $0 · Week 1, daily · blocks: first-100 users → [02-PHASE-1-FOUNDATION/05-COMMUNITY-PRESENCE.md](02-PHASE-1-FOUNDATION/05-COMMUNITY-PRESENCE.md)
- [ ] **11. Retrieve the full Amazon BSA §19 / Agent Policy text** (behind seller login — via the founder's own fresh Individual seller account or a design partner's read-only invite, per [01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md](01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md) §5) — F · $0 · before M-3 · blocks: any page-reading feature; injector decision → [07-REFERENCE/04-UNKNOWNS-REGISTER.md](07-REFERENCE/04-UNKNOWNS-REGISTER.md)
- [ ] **12. Run 5–8 paid audition orders with appeals experts** (on-platform gigs at $15–50 each, ~$75–400 total; fixture test with traps; expect 2–3 passers) — F · $75–400 · Week 2 · blocks: template quality → [08-TEAM/02-RECRUITMENT-KIT.md](08-TEAM/02-RECRUITMENT-KIT.md)
- [ ] **13. Recruit 5 design partners to bank on 3 completions** (sellers with live violations; free-Pass barter) — F · $0 · Week 2–4 ask, access by Week 6 · blocks: M-6 live QA, M-7 gate → [04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md](04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md)

### ⛔ GATE 1 — before build starts → [00-DECISION/03-GATES-AND-KILL-CRITERIA.md](00-DECISION/03-GATES-AND-KILL-CRITERIA.md)
- [ ] **14. Run the Gate-1 checklist** (credentials rotated; collaborator policy adopted; individual seller setup complete; payment application submitted + fallback rail opened; domain + legal pages live; repo + CI green; fixture corpus underway). Kill criterion: payment rail rejected → pause build.

## PHASE 2 — BUILD (Week 1–8; runs in parallel with items 10–13)

The AI assistant executes [03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md](03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md) **as modified by** [03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md](03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md), in the order of [03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md](03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md), with the controls of [03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md](03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md).

- [ ] **15. Weeks 1–4: platform-agnostic TypeScript core** (parser → classifier → intake → composer → critic, corrected deadline model) — AI · $0 · M-1→M-4 acceptance gates
- [ ] **16. Retain the appeals-QC consultant for template review** — F+X · $1,000–2,000 · Week 3 · blocks: M-4 POA quality ⚠ FOUNDER-DECISION (which consultant; see [08-TEAM/02-RECRUITMENT-KIT.md](08-TEAM/02-RECRUITMENT-KIT.md))
- [ ] **17. Weeks 4–5: web decoder + $199 composer LIVE on the domain** — the first revenue surface. **Before the checkout goes live, the revenue-critical Gate-3 checks must pass** (see item 31) — AI+F · hosting $0–25/mo (Cloudflare Pages + Supabase) · blocks: revenue, SEO, CWS-delay insurance → [04-PHASE-3-LAUNCH/01-WEB-DECODER-LAUNCH.md](04-PHASE-3-LAUNCH/01-WEB-DECODER-LAUNCH.md)
- [ ] **18. Install analytics + error tracking; wire the funnel events** — AI · $0 · with item 17 · blocks: all measurement → [06-OPERATIONS/03-ANALYTICS-AND-METRICS.md](06-OPERATIONS/03-ANALYTICS-AND-METRICS.md)
- [ ] **19. One hour of real keyword-volume research before ANY SEO/content spend** — F · $0 · Week 2 (before the first SEO page is written) · blocks: SEO plan → [05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md](05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md)
- [ ] **20. Weeks 4–8: MV3 extension** (panel decode, vault, deadlines; paste-mode primary; DOM-harvest only if the §19 read from item 11 permits; injector last-or-never) — AI · $0 · M-6 gate
- [ ] **21. Licensing + payments end-to-end in test mode** (webhooks → licenses table → key entry → entitlement; device limits 3–5/key; revocation) — AI · $0 · before M-5 → [02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md](02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md)
- [ ] **22. Cloud cost ceiling + circuit breaker live** before the free tier is public — AI · $0 · before M-3 public exposure → [03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md](03-PHASE-2-BUILD/03-TECHNICAL-RISK-CONTROLS.md)
- [ ] **23. GDPR operational kit** (Article 30 records, subprocessor DPAs, breach + data-subject-request procedures — applies because customers are in the EU, regardless of seller location) — F(+X) · $0–1,000 · before first real user data (M-5) → [02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md](02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md)
- [ ] **24. E&O (professional indemnity) insurance active** — F+X · $500–2,500/yr · before the M-8 public listing (the consented unlisted beta may precede coverage as a logged exception ⚠ FOUNDER-DECISION) · blocks: public launch (Gate-2 item) → [07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md](07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md)
- [ ] **25. Support stack + top-20 canned responses written** — F · $0 · during M-7 week · blocks: launch survivability → [06-OPERATIONS/01-SUPPORT-OPERATIONS.md](06-OPERATIONS/01-SUPPORT-OPERATIONS.md)
- [ ] **26. Crisis playbook rehearsed** (founder can recite the 24h protocol) — F · $0 · before M-7 → [06-OPERATIONS/02-CRISIS-PLAYBOOK.md](06-OPERATIONS/02-CRISIS-PLAYBOOK.md)
- [ ] **27. SEO/free-tool pages for the panic queries** (only after item 19's data) — AI+F · $0 · Week 5–8 → [05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md](05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md)

### ⛔ GATE 2 — before launch → [00-DECISION/03-GATES-AND-KILL-CRITERIA.md](00-DECISION/03-GATES-AND-KILL-CRITERIA.md)
- [ ] **28. Run the Gate-2 checklist** (M-1→M-6 acceptance passed; live Seller Central QA clean; "guarantee" grep = 0; refund workflow tested; E&O active; GDPR kit in place; rollback/kill-switch tested; crisis playbook rehearsed; 3 design partners through the full flow). Kill criteria: §19 read condemns the injector → cut it; E&O unavailable at any price → defer launch.

## PHASE 3 — LAUNCH (Week 7–8)

- [ ] **29. CWS submission — unlisted first** (listing assets, data-disclosure form, reviewer notes, paste-mode demo video) — F+AI · $0 · Week 7 · expect manual review; web revenue de-risks delay → [04-PHASE-3-LAUNCH/02-CHROME-WEB-STORE-SUBMISSION.md](04-PHASE-3-LAUNCH/02-CHROME-WEB-STORE-SUBMISSION.md)
- [ ] **30. Design-partner beta completes** (3 real cases decoded → drafted → exported; testimonials consented) — F · $0 · Week 7 → [04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md](04-PHASE-3-LAUNCH/03-DESIGN-PARTNER-BETA.md)

### ⛔ GATE 3 — split across two moments → [00-DECISION/03-GATES-AND-KILL-CRITERIA.md](00-DECISION/03-GATES-AND-KILL-CRITERIA.md)
- [ ] **31. Run the Gate-3 checklist in two parts.** Revenue-critical checks pass **before the Week 4–5 web checkout goes live** (item 17): live-mode checkout end-to-end, license revocation works, cloud cost ceiling/circuit breaker tested, anti-piracy device limits active, chargeback monitoring on, honest-expectations card + severity gating live. The remaining checks pass here, before the M-8 public listing: support <4h response measured, competitive monitoring on. Kill criteria: refund rate >15% in first 10 sales → pause marketing and diagnose; cloud cost per decode >$0.10 → tighten limits first.

- [ ] **32. Public launch day** — follow the runbook — F+AI · $0 · Week 8 → [04-PHASE-3-LAUNCH/04-LAUNCH-DAY-CHECKLIST.md](04-PHASE-3-LAUNCH/04-LAUNCH-DAY-CHECKLIST.md)

## PHASE 4 — OPERATE & GROW (from launch, standing)

- [ ] **33. Execute the first-100-users plan** (community reply-to-intent; measure hours spent; reassess at >200h) — F · $0 · Weeks 1–8+ → [05-PHASE-4-GROWTH/01-FIRST-100-USERS.md](05-PHASE-4-GROWTH/01-FIRST-100-USERS.md)
- [ ] **34. Weekly review ritual** (funnel numbers, refund/chargeback ratios vs thresholds, support top-issues, competitor watch 30 min, kill-criteria check) — F · $0 · every week → [06-OPERATIONS/03-ANALYTICS-AND-METRICS.md](06-OPERATIONS/03-ANALYTICS-AND-METRICS.md) + [05-PHASE-4-GROWTH/04-COMPETITIVE-RESPONSE.md](05-PHASE-4-GROWTH/04-COMPETITIVE-RESPONSE.md)
- [ ] **35. Price test in the first ~20 sales** ($99/$149/$199) ⚠ FOUNDER-DECISION on design — F · $0 · first month → [07-REFERENCE/04-UNKNOWNS-REGISTER.md](07-REFERENCE/04-UNKNOWNS-REGISTER.md)
- [ ] **36. Accountant engaged before first tax filing; Pakistan tax obligations tracked** (income tax on MoR payouts; NTN filing; provincial sales-tax registration if the accountant says it applies — customer-country VAT is Paddle's problem, not ours) — F+X · ~PKR 5,000–15,000/mo when engaged (estimate) · Month 2+ → [06-OPERATIONS/04-PAYMENT-OPERATIONS.md](06-OPERATIONS/04-PAYMENT-OPERATIONS.md)
- [ ] **37. P1 roadmap only after launch stabilizes** (rejection parser first; Guardian SKU only when its monitor ships) — F+AI · per item · Month 2+ → [07-REFERENCE/07-ROADMAP-AND-EXPANSION.md](07-REFERENCE/07-ROADMAP-AND-EXPANSION.md)

---

## Standing rules (apply to every item above)

- The four hard rules in [README.md](README.md) are never suspended.
- Every marketing claim must appear in the verified table of [07-REFERENCE/01-MARKET-EVIDENCE.md](07-REFERENCE/01-MARKET-EVIDENCE.md) before it ships.
- Every non-trivial decision gets one line in the repo's `docs/DECISIONS.md`; every AI work session ends with the handoff ritual in [08-TEAM/03-AI-SESSION-CONTINUITY.md](08-TEAM/03-AI-SESSION-CONTINUITY.md).
- If anything on this list is skipped, the skip is itself recorded in [00-DECISION/02-DECISION-LOG.md](00-DECISION/02-DECISION-LOG.md) with a dated rationale.

## Definition of done

- [ ] Items 1–14 complete → the project is officially "in build".
- [ ] Items 15–28 complete → the product is launchable.
- [ ] Items 29–32 complete → AppealDeck is live and selling.
- [ ] Items 33–37 running weekly → the business is operating on evidence, not hope.

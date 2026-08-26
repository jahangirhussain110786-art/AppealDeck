# 03-GATES-AND-KILL-CRITERIA — Go/no-go gates, kill criteria, and the review cadence

**Why this file exists / when to use it:** Three checkpoints stand between today and the first paid customer. Nothing passes a gate on optimism — every check below has a binary pass criterion, and every kill criterion has a threshold and a pre-agreed response, decided now while nobody is panicking. Use this file at each gate review, at the weekly decision review (§4), and the moment any threshold trips. This file merges and deduplicates the gates from the Readiness Audit (§D) and the R&D Master Report, amended per the reconciled decisions in `02-DECISION-LOG.md`. Verdict context: `01-VERDICT.md`.

**Terms:** M-1…M-8 = the build plan's eight weekly milestones (M-1 scaffold → M-8 first paid customer). CWS = Chrome Web Store. MoR = Merchant of Record (Paddle/Polar — the reseller that handles customer-country VAT). BSA §19 = Amazon's Business Solutions Agreement "Agent Policy" (effective 4 Mar 2026), which restricts automated access to Seller Central. DOM-harvest = the extension feature that reads the deactivation notice off the Seller Central page. POA = Plan of Action (the appeal document). UPL = unauthorized practice of law. E&O = errors & omissions insurance. GDPR Art. 30 = the EU-required record of data-processing activities; DPA = data processing agreement with each subprocessor. EU-DSA trader verification = the EU Digital Services Act requirement to publish trader contact details on the CWS listing. y-tunnus = Finnish Business ID. Dexie = the IndexedDB wrapper used for the encrypted local vault. VAMP = Visa Acquirer Monitoring Program (chargeback-ratio regime).

**Two amendments applied to the source gates (do not "restore" the old versions):**
1. The US/EU UPL legal opinion is **no longer a hard gate item**. Independent verification (25 Aug 2026) found no precedent of UPL action against non-lawyer Amazon appeal consultants. It is now optional-but-prudent: a scoped review (€500–1,500) **before US marketing spend** — see check 40. Positioning defenses (document-prep framing, refusing IP/arbitration cases, not-legal-advice disclaimers) remain mandatory regardless.
2. **Reading the full BSA §19 text is a hard Gate-2 item for any DOM-reading feature** (check 17). No DOM-harvest or injector code ships until the actual policy text has been read and assessed — third-party summaries do not count.

---

## 1. Gate 1 — Before build starts (M-1 entry)

Pass = all checks ticked (or a dated written exception in `02-DECISION-LOG.md` §4). Work on `../02-PHASE-1-FOUNDATION/` and `../03-PHASE-2-BUILD/` does not begin until Gate 1 passes; Phase-0 blocker details live in `../01-PHASE-0-BLOCKERS/`.

- [ ] **1. Leaked credentials rotated (P-1/P-2).** Pass: old Supabase project credentials revoked; new project created or keys rotated; no secret from the old repo reachable. **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** everything.
- [ ] **2. Jhangir written agreement signed.** Pass: roles, IP assignment, revenue split, exit terms, credential handling, non-solicit — signed by both parties **before any credential or IP sharing**. **Owner:** Founder + Jhangir · **Cost:** ~€200 (template route) to €500–2,000 (lawyer) · **Deadline:** Day 1 · **Blocks:** credential sharing, §19 retrieval, talent recruitment.
- [ ] **3. Finnish business registered.** Pass: y-tunnus issued (toiminimi / sole trader minimum, €75 via ytj.fi, ~3–5 business days). **Owner:** Founder · **Cost:** €75 · **Deadline:** Day 1–3 · **Blocks:** MoR applications, invoicing, business bank account.
- [ ] **4. Domain + legal pages live.** Pass: domain registered; AI-drafted, founder-reviewed privacy policy + terms published (covering disclaimers, refund policy per D8, data flows). **Owner:** Founder (publish) + AI assistant (draft) · **Cost:** €10–30/yr · **Deadline:** Week 1 · **Blocks:** Paddle/Polar applications, CWS listing, web decoder.
- [ ] **5. Paddle application submitted.** Pass: application in progress behind the live site + legal pages — do not wait for approval to proceed. **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-5 payments.
- [ ] **6. Polar account opened (warm fallback).** Pass: account created, product draft configured, ready to activate within 48h. **Owner:** Founder · **Cost:** $0 (free tier 5% + 50¢; Pro $20/mo when volume justifies) · **Deadline:** Week 1 · **Blocks:** kill criterion K1 response.
- [ ] **7. CWS developer account active + EU-DSA trader verification started.** Pass: $5 fee paid; trader contact details submitted. **Owner:** Founder · **Cost:** $5 · **Deadline:** Week 1 · **Blocks:** M-7 store submission (verification can take weeks — start early).
- [ ] **8. Fixture corpus built.** Pass: ≥4 realistic deactivation notices per v1 violation type (build plan §13.1), covering the corrected deadline model (stated windows parsed, funds-appeal +60d, Seller Challenge stage). **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** M-3 classifier acceptance; milestones M-1→M-5 need no live account because of this corpus.
- [ ] **9. Repo scaffolded.** Pass: `V:\AppealDeck\` code workspace created from clean/cleared sources only (forbidden-source ban per `02-DECISION-LOG.md` Round 0); CI green on the empty app. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-1 acceptance.
- [ ] **10. CLAUDE.md (AI-session continuity file) created.** Pass: build-plan summary + key decisions + handoff ritual documented, so a lost AI session costs minutes, not hours. **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** every AI build session.
- [ ] **11. Wise Business account verified.** Pass: account open for Finland→Pakistan contractor payments (0.35–1% FX). **Owner:** Founder · **Cost:** €0–50 · **Deadline:** Week 1 · **Blocks:** paid auditions, PK talent payments.
- [ ] **12. UPL posture documented.** Pass: the deferral rationale (per `02-DECISION-LOG.md` §3 row 7) is recorded and the mandatory positioning defenses are in the terms and product copy. No paid opinion required at this gate. **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** honest-positioning condition of the GO.

**Gate 1 kill criterion — K1:** If Paddle rejects outright AND neither Polar nor Stripe direct is operational within 48h of that rejection → **pause the build** until a payment rail exists. Pre-agreed response: activate Polar (check 6), escalate to Stripe direct if Polar also fails; if all three fail, this is NO-GO trigger 1 in `01-VERDICT.md` §(f).

---

## 2. Gate 2 — Before launch (M-7 entry)

Pass = all checks ticked. "Launch" means the unlisted beta opens to design partners and the CWS submission goes in.

- [ ] **13. All M-1 → M-6 acceptance criteria pass.** Pass: per the build plan §15 milestone table, no waived criteria. **Owner:** AI assistant + Founder · **Cost:** included · **Deadline:** Week 6–7 · **Blocks:** everything downstream.
- [ ] **14. Backend deployed.** Pass: hosting live on the launch stack (Cloudflare Pages, free, for the static web decoder site + Supabase Edge Functions for all API work — MoR webhooks, LLM proxy, license verification; Supabase free tier at start, Pro $25/mo from first sustained sales), smoke tests green, all keys rotated, secrets management (rotation schedule, access control) in place. Vercel Pro ($20/mo) is not provisioned by default — it is a fallback only if porting the donor Express backend proves necessary at M-5, decided then by the AI assistant + Founder and logged. **Owner:** AI assistant + Founder · **Cost:** $0–25/mo · **Deadline:** before M-5, verified at Gate 2 · **Blocks:** payments, cloud drafting, telemetry.
- [ ] **15. Manual QA clean on live Seller Central.** Pass: smoke test on a real account (active-access ladder per `02-DECISION-LOG.md` §3 row 6) passes; no console errors. **Owner:** Founder + Jhangir · **Cost:** $0 · **Deadline:** Week 6–7 · **Blocks:** M-6 acceptance.
- [ ] **16. "guarantee" grep = 0.** Pass: zero hits across `src/`, store listing, and site copy; no success-rate claims anywhere (none exist until opt-in outcome data does). **Owner:** AI assistant + Founder · **Cost:** $0 · **Deadline:** Week 6 · **Blocks:** ethics spine (D6), UPL defense, chargeback defense.
- [ ] **17. ⛔ HARD ITEM — BSA §19 / Agent Policy full text read, for any DOM-reading feature.** Pass: Jhangir has retrieved the full policy text from behind seller login; it has been read and assessed against the DOM-harvest and injector mechanisms; the assessment is written into `02-DECISION-LOG.md`. If the read is adverse: DOM-harvest is de-scoped to paste-only (K8) and the injector is cancelled — the product ships regardless, on the paste-mode spine. A paste-only build with no DOM-reading features may pass this check by confirming that scope in writing. **Owner:** Jhangir (retrieve) + AI assistant (assess) + Founder (decide) · **Cost:** $0–500 (optional counsel review) · **Deadline:** text retrieved before end of Week 2; ruling recorded in `02-DECISION-LOG.md` by end of Week 3; always before any DOM-harvest code merges (Weeks 4–6); verified hard at Gate 2 · **Blocks:** DOM-harvest, injector, CWS listing risk.
- [ ] **18. Refund workflow functional.** Pass: tested in the MoR sandbox; 7-day no-questions voluntary refund SLA defined and written into support docs (D8). **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-7 · **Blocks:** chargeback defense.
- [ ] **19. EU withdrawal-right compliance implemented.** Pass: checkout collects explicit prior consent to immediate digital delivery + sends permanent-form confirmation, per Directive 2011/83/EU and Finnish KKV guidance. **Owner:** AI assistant (build) + Founder (verify) · **Cost:** included · **Deadline:** before M-5, verified at Gate 2 · **Blocks:** EU market legality, MoR compliance.
- [ ] **20. Support channels active.** Pass: support email live; canned responses for the top 20 questions written; knowledge base stub published. **Owner:** Founder · **Cost:** €0–50/mo · **Deadline:** before M-7 · **Blocks:** founder survival at launch (SK-09).
- [ ] **21. Three design partners completed the full flow.** Pass: real notices decoded, POAs drafted, cases exported, feedback recorded. **Owner:** Founder · **Cost:** $0 cash (free-Pass barter) · **Deadline:** Week 7 · **Blocks:** M-7 acceptance, first case studies.
- [ ] **22. E&O insurance policy active.** Pass: certificate of insurance in hand (Finnish/EU E&O for a tech/legal-adjacent product) before the M-8 public listing; the unlisted consented design-partner beta may precede coverage as a logged exception (⚠ FOUNDER-DECISION, see `02-DECISION-LOG.md`). **Owner:** Founder · **Cost:** €500–2,500/yr · **Deadline:** before the M-8 public listing · **Blocks:** personal asset protection — see K3.
- [ ] **23. GDPR Article 30 records + DPAs.** Pass: processing-activities record written; DPAs with Paddle/Polar, Supabase, Vercel, Google AI signed or in-negotiation; data-subject-request procedure and 72-hour breach-notification procedure documented. **Owner:** Founder + External (optional review) · **Cost:** €0–3,000 (template route first) · **Deadline:** before M-5, verified at Gate 2 · **Blocks:** privacy-positioning credibility, regulatory defense.
- [ ] **24. Rollback / hotfix plan documented.** Pass: remote-settings kill switch tested; versioned rollback path rehearsed; staged-rollout posture written down: CWS staged rollout (5%→25%→50%→100%) applies only once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible); below that threshold every release is effectively big-bang, and the substitute control is hardened pre-release QA + the tested remote-settings kill switch. **Owner:** AI assistant + Founder · **Cost:** included · **Deadline:** before M-7 · **Blocks:** surviving a broken release during a mass-suspension wave.
- [ ] **25. Dexie migration strategy tested.** Pass: schema migration tested on 10K fixture records; WebCrypto operations run in `db.on('ready')`, never inside `upgrade()`; versioned encryption envelope in place. **Owner:** AI assistant · **Cost:** included · **Deadline:** before M-6 · **Blocks:** vault data integrity for every future update.
- [ ] **26. Crisis playbook drafted and rehearsed.** Pass: founder can recite the 24-hour response protocol without reference; canned responses for the top 5 crisis scenarios written. Full playbook: `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`. **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-7 · **Blocks:** reputation survival.
- [ ] **27. CWS listing prepared and submitted.** Pass: screenshots, demo video, reviewer notes, honest paid-functionality disclosure, minimal host permissions; submitted unlisted ASAP (listed after approval). **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** extension distribution (web revenue does not wait for this).

**Gate 2 kill criteria:**
- **K2:** If manual QA or the §19 read shows the injector raises any BSA §19 concern → **injector removed from launch scope**, permanently or until cleared. The product ships without it (copy-paste costs the user ~30 seconds).
- **K3:** If E&O insurance is unavailable at any price → **launch deferred** until coverage is obtained or liability is restructured (e.g., entity form, terms redesign). If unresolvable, NO-GO trigger 5 in `01-VERDICT.md` §(f).

---

## 3. Gate 3 — Split: revenue-critical checks before the Week 4–5 web checkout (M-W); remaining checks before the M-8 public listing

Gate 3 is split (decided 26 Aug 2026, see `02-DECISION-LOG.md` §3). **Revenue-critical checks — 28 (live checkout), 29 (revocation), 30 (cost ceiling/circuit breaker), 31 (anti-piracy), 36 (chargeback monitoring), 39 (honest-expectations + severity gating) — must pass BEFORE the web checkout goes live in Week 4–5 (milestone M-W).** That is when money first changes hands, not M-8. The remaining checks (32–35, 37, 38) gate the M-8 public listing.

- [ ] **28. MoR checkout end-to-end in live mode.** Pass: one real transaction processed on the primary rail; license key issued from the Supabase `licenses` table via webhook; entitlement cached client-side with 72h offline grace. **Owner:** Founder + AI assistant · **Cost:** one test transaction · **Deadline:** before M-W (Week 4–5 web checkout) · **Blocks:** first sale.
- [ ] **29. License validation + revocation tested.** Pass: revoke → access removed within 24h; webhook handler idempotent by event ID. **Owner:** AI assistant · **Cost:** included · **Deadline:** before M-W (Week 4–5 web checkout) · **Blocks:** entitlement security.
- [ ] **30. Cloud cost ceiling + circuit breaker live and tested.** Pass: backend daily spend cap + per-device rate limits tested with a simulated spike; graceful degradation to rules-only decode verified. **Owner:** AI assistant · **Cost:** included · **Deadline:** before the free tier goes public and before M-W (Week 4–5) · **Blocks:** financial survival during a mass-suspension wave (D9).
- [ ] **31. Anti-piracy controls active.** Pass: device activation limit (starts at 5 devices/key per TRC-12, tightened only on observed abuse) enforced server-side; self-service deactivation portal functional. **Owner:** AI assistant · **Cost:** included · **Deadline:** before M-W (Week 4–5 web checkout) · **Blocks:** revenue-model viability (a shared key on Reddit otherwise serves unlimited users).
- [ ] **32. Support response time <4h during business hours.** Pass: measured over a 48h beta period. **Owner:** Founder · **Cost:** $0 · **Deadline:** before M-8 · **Blocks:** launch-week reputation.
- [ ] **33. First-100 acquisition plan in execution.** Pass: ≥10 meaningful community interactions logged; ≥50 decoder sessions recorded; named-founder presence established (community accounts aged from Week 1–2, not created at launch). **Owner:** Founder · **Cost:** €0 cash (time) · **Deadline:** Weeks 1–8, verified at M-8 · **Blocks:** revenue realization. See `../04-PHASE-3-LAUNCH/`.
- [ ] **34. Analytics live and funnel instrumented.** Pass: Plausible or Umami (EU-hosted) + backend event counts reporting the D10 funnel (decoder sessions → decode completed → intake started → purchase → opt-in outcome). **Owner:** Founder + AI assistant · **Cost:** €0–50/mo · **Deadline:** built Week 3–4 with the staging decoder; live with the public decoder Week 4–5 (per D3); verified at M-8 · **Blocks:** the weekly review (§4) has no inputs without this.
- [ ] **35. Competitive monitoring active.** Pass: SellerForge (pricing, Forge Companion features, free POA generator) checked weekly with diffs noted. **Owner:** Founder · **Cost:** $0 · **Deadline:** ongoing from Week 1 · **Blocks:** strategic response time.
- [ ] **36. Chargeback monitoring live; ratio <0.5% over the first sales.** Pass: monitoring in place from the first M-W sale; measured; if any dispute has arrived this early, root-cause is documented. **Owner:** Founder · **Cost:** $0 · **Deadline:** monitoring before M-W (Week 4–5 web checkout), then continuous · **Blocks:** MoR account survival.
- [ ] **37. Guardian SKU deferred.** Pass: the $29/mo Guardian is not purchasable anywhere until its monitoring feature actually ships (D7). "Coming soon" + waitlist only. **Owner:** Founder · **Cost:** $0 · **Deadline:** until the monitor ships · **Blocks:** not selling vapor (MR-26).
- [ ] **38. Expert Review rails resolved or deferred.** Pass: written MoR pre-clearance obtained (pre-clearance is raised only post-approval from a healthy account — see `../02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md` §4) OR a separate Stripe-direct service line built OR the SKU is formally deferred to v2 with a waitlist (MoR acceptable-use policies exclude human services). **Owner:** Founder · **Cost:** €0–500 · **Deadline:** before M-8 · **Blocks:** MoR account health.
- [ ] **39. Honest-expectations + severity gates verified in the purchase path.** Pass: the honest-expectations card renders before every checkout; forged-docs/fraud/child-safety classifications cannot reach checkout and route to the professional-help screen. **Owner:** AI assistant (build) + Founder (verify) · **Cost:** included · **Deadline:** before M-W (Week 4–5 web checkout) · **Blocks:** ethics spine (D6), refund/chargeback defense.

**Conditional post-gate item:**

- [ ] **40. Scoped UPL review before US marketing spend.** Pass: a licensed-attorney scoped review (€500–1,500) of the document-prep positioning for the main US markets, completed before the first dollar of US-targeted advertising (organic community presence does not trigger this). ⚠ FOUNDER-DECISION: commissioning date and scope — the evidence says prudent-not-mandatory; only the founder can weigh spend timing against US expansion pace. **Owner:** Founder + External · **Cost:** €500–1,500 · **Deadline:** before US marketing spend · **Blocks:** US paid acquisition.

**Gate 3 kill criteria:**
- **K4:** Refund rate >15% in the first 10 sales → **pause all marketing**, diagnose by refund reason before scaling. Persistent with no fixable cause → NO-GO trigger 3 in `01-VERDICT.md` §(f).
- **K5:** Cloud cost per decode >€0.10 → renegotiate LLM pricing or tighten rate limits before scaling (expected cost is ~$0.02/full case — a 5x overrun signals an architecture bug, not a pricing problem).

---

## 4. Ongoing kill criteria and tripwires (post-launch, checked weekly)

Every threshold below has its pre-agreed response decided now. When one trips, execute the response the same day — do not re-deliberate under pressure. Crisis-scenario execution detail: `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`.

| ID | Tripwire | Threshold | Pre-agreed response |
|---|---|---|---|
| K6 | Chargeback ratio climbing | >0.4% (Polar review level) or >0.5% (internal alarm) → escalating to 0.75% (Stripe monitoring) / 1.5% (Visa VAMP freeze) | At 0.5%: pause paid acquisition, refund faster and more proactively, audit the honest-expectations flow. At any processor-program entry: daily monitoring, alert the MoR proactively, refund-first policy on every complaint. An MoR termination is existential. |
| K7 | Support overload / burnout | >20 tickets/day for >3 consecutive days, or founder response time >24h | Pause marketing spend; deploy canned responses; Jhangir takes community triage during Finland nighttime; hard work-hour boundaries enforced. |
| K8 | §19 read adverse for DOM features | Any credible reading that DOM-harvest or the injector violates the Agent Policy | De-scope to paste-only extension; cancel the injector; product continues on the web + paste spine (this was the design assumption — see check 17). |
| K9 | Acquisition black hole | First 100 users require >200 hours (estimate) of community engagement with no conversion signal | Reassess distribution strategy at the weekly review; test alternative channels; if no viable channel emerges, NO-GO trigger 6 in `01-VERDICT.md` §(f). |
| K10 | Mass-suspension demand spike | Decoder traffic >3x baseline in 24h, or community reports ~10x normal suspension volume | Cloud circuit breaker holds the spend cap; graceful degradation to rules-only decode; canned responses out; founder does NOT answer individually — triage via Jhangir + design partners. |
| K11 | Review-bomb / viral trust attack | CWS rating drops >0.3 stars in 24h with >3x review volume, or a "tool got me banned" thread >100 upvotes | Crisis playbook scenario response: do not reply immediately; triage; ONE calm factual public reply; never argue with reviewers; never incentivize reviews (CWS policy violation). |
| K12 | Wrong-classification signal | Critic pass rate drops on one violation type, or support tickets cite mismatched POA type | Taxonomy/rules patch within 48h; staged rollout; affected users emailed; classification-confidence display and user override verified working. |
| K13 | Payment-rail deterioration | MoR requests information, flags the account, or delays payouts | Respond same day; warm fallback rail readied for activation within 48h (checks 5–6); never let a single rail be a single point of failure. |

---

## 5. Weekly decision-review cadence

The gates catch big mistakes; the weekly review catches drift. This is decision D10's enforcement mechanism.

- [ ] **41. Hold the weekly decision review — every week, same slot, 30 minutes, no skipping.** **Owner:** Founder (Jhangir optional attendee) · **Cost:** $0 · **Deadline:** weekly from Week 1 · **Blocks:** kill-criteria enforcement, decision-log integrity.

Fixed agenda (in order, timeboxed):
1. **North star (5 min):** paid Appeal Passes/week; full funnel numbers (decoder sessions → decode completed → intake started → purchase → opt-in outcome).
2. **Tripwire dashboard (5 min):** every K-criterion in §4 checked against current numbers — green/amber/red, no narrative.
3. **Money (5 min):** refund rate, chargeback ratio, cloud spend vs. ceiling, cash runway against the ~$1,100–2,300 budget.
4. **Competition (5 min):** SellerForge weekly diff; any new CWS entrant on appeal-related queries.
5. **Gate progress (5 min):** which checks in §1–§3 moved; any exception requests (written rationale required, appended to `02-DECISION-LOG.md` §4).
6. **Decisions (5 min):** anything requiring a decision is decided or explicitly scheduled; outcomes appended to `02-DECISION-LOG.md` with date and rationale.

Rules: a tripped kill criterion executes its pre-agreed response **before** the meeting ends. A gate is never passed inside the weekly review — gate reviews are their own dedicated session with this file open and every checkbox walked.

---

## Definition of done

- [ ] All Gate 1 checks (1–12) ticked before the first line of product code; all Gate 2 checks (13–27) before beta/CWS submission; the revenue-critical Gate 3 checks (28–31, 36, 39) before the Week 4–5 web checkout goes live (M-W); the remaining Gate 3 checks (32–35, 37–38) before the M-8 public listing — or each skipped check has a dated written exception in `02-DECISION-LOG.md`.
- [ ] Check 17 (§19 full-text read) is ticked before any DOM-reading feature ships, without exception — this one cannot be waived.
- [ ] Every kill criterion K1–K13 has a live data source feeding it (analytics, MoR dashboard, support inbox, CWS console) — verified at the first weekly review after launch.
- [ ] The weekly review has run every week since Week 1, with outcomes appended to `02-DECISION-LOG.md`.
- [ ] The founder can state from memory: the three gate boundaries, the chargeback thresholds (0.4/0.5/0.75/1.5%), and the pre-agreed response to a Paddle rejection, a §19 adverse read, and a refund rate above 15%.

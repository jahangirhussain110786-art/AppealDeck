# Design-Partner Beta — 3–5 sellers with live cases, on a free-Pass barter

**Why this file exists / when to use it:** AppealDeck cannot pass its final pre-launch gates on fixture data alone. Three milestone requirements — real-notice validation, live Seller Central QA (M-6), and three partners through the full product flow (M-7) — depend on a small group of real sellers with **live** suspensions or violations who test the product in exchange for a free Appeal Pass. This file is the complete program: who qualifies, where to find them, what each side gives and gets, the consent paperwork, the recruitment rules, and the tracking table. Use it from week 2 (first recruitment conversations) through week 7–8 (M-7 gate evidence and case-study collection).

**Terms used here:** Design partner = a real Amazon seller with a live enforcement case who tests AppealDeck before public launch, on a barter basis. Appeal Pass = the $199 one-time, per-case paid product; the barter grants it free. POA = Plan of Action, the appeal document Amazon requires (Root Cause → Corrective Actions → Preventive Measures). Fixture corpus = the library of realistic test notices (`fixtures/notices/`) the build is tested against (build plan §13.1). M-6/M-7/M-8 = milestones 6–8 of the 8-week plan (M-6 = full extension QA'd, M-7 = beta + store submission, M-8 = public launch). CWS = Chrome Web Store. Gated types = violation classes we never sell (or give) a drafting pass for: forged documents, fraud, child-safety (decision D6). ASGTG = "Amazon Seller Performance — ASGTG", the largest suspension-focused Facebook group. GDPR = the EU data-protection regulation.

---

## 1. What design partners unblock (why this is not optional)

| Deliverable from partners | What it unblocks | Gate reference |
|---|---|---|
| Real, current enforcement notices (with written consent, anonymized) | Validates the fixture corpus against 2026 reality — the corpus was built from rewritten public forum posts and synthetic variants; partner notices are the only ground truth for current notice wording and stated deadline windows | Classifier confidence before launch; corpus enrichment per build plan §13.1 |
| Live Seller Central QA session on a partner account | The M-6 acceptance gate: manual QA clean on a **live** account. Fixtures cover milestones M-1→M-5; only live access proves the panel mounts, harvest works, and no console errors appear on real pages. Access ladder: Jhangir's account first (written read-only consent, see `../01-PHASE-0-BLOCKERS/02-PARTNERSHIP-AGREEMENT.md`), design partners second, a fresh Individual-plan registration last (shows a clean page only) | `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` check 15 [source: The Second Opinion.md, amendment 4] |
| Three partners through the full flow: **decode → intake → POA → export** | The M-7 acceptance gate. No public launch without it | `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` check 21 |
| Anonymized case studies + testimonials (opt-in, reviewed by the partner) | The only honest marketing assets we are allowed to have at launch — we publish no win rates and no invented numbers, so consented, anonymized "here is what the process looked like" stories are the launch-day proof layer | `./04-LAUNCH-DAY-CHECKLIST.md` launch-post content |
| Structured feedback + roadmap input | Post-launch P1 priority ordering (rejection parser is first in queue) | `../00-DECISION/02-DECISION-LOG.md` |

## 2. The barter (state it exactly like this — it is the whole deal)

| They give | They get |
|---|---|
| Their real notice text for the fixture corpus (written consent, anonymized before any use) | **Free Appeal Pass** for their live case (the $199 product, full flow, unlimited redrafts for that case) |
| Beta testing on the web surface (week 4–6) and the unlisted extension (week 7, once CWS review clears — `./02-CHROME-WEB-STORE-SUBMISSION.md` §7) | **Priority support**: direct founder email, faster-than-public response target |
| At least one partner: a supervised live Seller Central QA session (M-6) | **Roadmap input**: their feature requests are heard first and logged with attribution |
| Honest feedback at each flow stage; optional opt-in outcome report (appeal accepted / rejected / no response) | Early-supporter credit on the site if they want it (optional, never required) |
| Optional: an anonymized case study and/or testimonial, which they review and approve before publication | — |

What we do **not** promise them: any appeal outcome. The consent one-pager (§6) says so in writing, and every conversation repeats it. Beta partners hear the same honest-expectations message as paying customers: most first appeals fail, including those written by professionals charging $600–$5,000 per case (public prices verified 25 Aug 2026).

## 3. Who qualifies (screening checklist)

- **Live case in a v1 violation type:** ODR performance, Section 3 inauthentic, Section 3 IP complaint, or listing-level. A seller whose case is a gated type (forged documents, fraud, child-safety) can never receive a Pass — free or paid — because the product refuses those types by design (D6). Their notice may still enrich the corpus with consent, but they cannot be a full-flow partner; route them to the professional-help screen like anyone else.
- **Case is current or very recent:** the M-7 flow must run on a real appeal the partner actually intends to submit (or has just submitted). Sellers with only years-old war stories are community allies, not design partners.
- **Reachable and responsive:** replied within ~48h during recruitment; willing to give feedback at each stage, not just take the Pass and vanish.
- **Consent-willing:** agrees to the one-pager (§6) by written reply before onboarding. No consent, no partnership — however good the case is.
- **For the live-QA role (need ≥1):** willing to run a supervised session on their own Seller Central account with the extension in read-only mode, understanding what the tool does and does not touch. Per the Ninth Circuit's Perplexity ruling (Aug 2026), it is the **user** who "accesses" the page — which is exactly why partner consent must be explicit and informed, never assumed. [source: The Second Opinion.md, discovery 2]

**Numbers:** recruit **5** to bank on **3** completing the full flow (dropout is normal — suspended sellers get reinstated, give up, or go dark). Expect to approach roughly 10–15 prospects to land 5 (estimate).

## 4. Where to find them, and the timeline

Recruitment runs entirely through the community presence built since week 1–2 — channels, accounts, and etiquette per `../02-PHASE-1-FOUNDATION/05-COMMUNITY-PRESENCE.md`, hard channel rules per `../05-PHASE-4-GROWTH/02-COMMUNITY-PLAYBOOK.md`. Prospects are sellers the founder has **already helped** in a thread; cold outreach to strangers converts poorly and risks channel bans.

| Channel | How partners surface there | Notes |
|---|---|---|
| r/FulfillmentByAmazon + r/AmazonSeller | Sellers posting fresh suspension threads; the founder replies helpfully first, and only then — in DM, after a substantive public exchange — raises the beta offer | Reddit DM only after the public interaction; never "PM me" in-thread; account needs its 200+ karma / 3–4 weeks history before any product mention |
| ASGTG + other Facebook suspension groups | Panicking sellers describing live cases; relationship-building is what these groups are for (direct conversion is not) | No links or promo without admin permission; no "PM me"; never criticize consultants. Recruit **in** the community, never **through** its founder — the ASGTG founder pleaded guilty in the federal Amazon-bribery case [source: The Second Opinion.md, recruitment kit] |
| Amazon Seller Central Forums | Listening post only — real notice wording, current enforcement patterns | Never recruit or promote here |
| Decoder users (from week 4–5) | Sellers who used the free web decoder (`./01-WEB-DECODER-LAUNCH.md`) and reached the intake or checkout step | Highest-intent pool; an in-product "join the beta" note is allowed on our own property |

**Timeline (aligned to the milestone plan):**

| Week | Step |
|---|---|
| 2–3 | First recruitment conversations grow out of community help; shortlist started in the tracking table (§8) |
| 3–4 | Formal ask made to shortlisted sellers; consent one-pager sent; live-access question asked by week 4 |
| 4–6 | Consented partners onboarded onto the web surface (decoder live week 4–5); real notices collected and anonymized into the corpus; live Seller Central access secured by week 6 for the M-6 QA session |
| 7 | Unlisted extension link distributed on CWS approval; partners run the full flow; M-7 gate evidence recorded |
| 7–8 | Feedback synthesis; case studies and testimonials drafted, partner-approved, published for M-8 |

[source: The Second Opinion.md, team checklist row 8 and amendment 4; APPEALDECK — R&D MASTER REPORT.md, backlog action 39]

## 5. Recruitment message rules

1. **Founder approval, per contact.** Every outreach message — Reddit DM, Facebook message, email — is drafted (AI assistant may draft), then read and approved by the founder before it sends. Nothing sends on autopilot. [source: The Second Opinion.md, outreach drafts rule]
2. **Channel-rule compliant.** The message respects the rules of the channel it travels through (`../05-PHASE-4-GROWTH/02-COMMUNITY-PLAYBOOK.md`): DM only after a public helpful exchange, no in-thread solicitation, no link-dropping in groups that ban it, mod/admin permission where required.
3. **Honest, always.** Named founder ("I built this"), beta status stated plainly, the barter stated plainly (free Pass in exchange for testing + feedback + consented artifacts), the no-outcome-promise stated in the first message, gated types excluded openly. The banned-language rules apply to recruitment copy exactly as to marketing copy: no "guarantee", no win rates, no "only tool" claims, no urgency pressure.
4. **One ask, one polite follow-up.** If a prospect does not reply after one follow-up (~5–7 days later), stop. Pestering suspended sellers is both cruel and ban-bait.
5. **Message skeleton** (adapt per person, keep every element): who I am (real name, founder of AppealDeck, the person who replied to your thread) → what I saw in your situation (specific, so it is clearly not a mass paste) → what I am offering (free Appeal Pass + priority support + roadmap voice, in exchange for feedback and the consented artifacts) → what I am NOT offering (any promise about the appeal's outcome; most first appeals fail even with expensive help) → what happens next (the consent one-pager, then onboarding) → an easy no ("if this isn't for you, no hard feelings — the free decoder is yours regardless").

## 6. Consent & confidentiality one-pager (contents spec)

One page, plain English, sent before onboarding; the partner's written "I agree" reply (email or DM) is the consent record. AI assistant drafts from this spec; founder reviews before first use.

1. **Who we are:** Hawlton Alliance (Finnish sole trader), founder's name, contact email, and the product's one-line description.
2. **What we ask for:** (a) the text of your enforcement notice(s), (b) beta use of the product on your real case with stage-by-stage feedback, (c) optionally, one supervised read-only session on your Seller Central account, (d) optionally, an anonymized case study and/or testimonial, (e) optionally, the outcome of your appeal.
3. **What we store, and where:** your notice text is anonymized (see 4) before it enters our test library; the raw, un-anonymized notice is never committed to our code repository and is deleted after anonymization. Your case data (intake answers, drafts) lives in your own browser, not on our servers — the same local-first architecture paying customers get. We keep your name, contact, and consent record in a private tracker, nothing more (GDPR minimalism); you can ask what we hold, and ask for its deletion, at any time.
4. **Anonymization promise:** before any use, we strip and replace seller name, business name, ASINs, order IDs, addresses, emails, invoice/supplier names, and financial figures with realistic placeholders. For case studies and testimonials, **you review and approve the anonymized text before anything is published** — no approval, no publication.
5. **Right to withdraw:** you may withdraw consent at any time, for any artifact, no reason needed. We then stop all future use: fixtures are purged from the test library, unpublished materials are deleted, and published case studies are taken down from our properties. (Honest caveat, stated: we cannot recall copies third parties may already have made of previously published material.)
6. **No outcome promise:** AppealDeck is beta software and a document-preparation tool, not a law firm and not legal advice. We do not promise — and you should not expect us to promise — any appeal outcome. Most first appeals fail, including professionally written ones. You review and submit everything yourself.
7. **Confidentiality, both ways:** we never reveal your identity without your written approval; we ask you not to publicly share pre-release product internals (screens, prompts, unreleased features) until public launch — a courtesy commitment, not a lawyer-drafted NDA.
8. **The barter, restated:** free Appeal Pass for your live case, priority support, roadmap input. No cash changes hands in either direction.

## 7. The M-7 full-flow definition (what "complete" means)

A partner counts toward the M-7 gate only when all four stages are done on their **real** case, without developer tools or founder hand-holding beyond normal support:

1. **Decode** — notice ingested (paste-mode or, post-approval, in-page) and correctly classified; partner confirms the classification matches reality (or the override flow was used and logged).
2. **Intake** — the violation-specific question set completed; skipped answers handled honestly by the product.
3. **POA** — draft generated, critic pass run, at least one redraft cycle exercised.
4. **Export** — the case exported (copy/print/PDF); the partner has the document they would actually submit to Amazon.

Evidence to record per partner: dates per stage, violation type, surface used (web / extension), bugs and friction notes, quotes (with permission), and the opt-in outcome report if they choose to give one later. Three completions = gate check 21 passes; the evidence bundle is the input for `./04-LAUNCH-DAY-CHECKLIST.md` and the Gate-2 review.

## 8. Tracking table template

Keep this in the private tracker (never in the public repo — it contains identities). One row per prospect from first contact onward.

| Field | Values / notes |
|---|---|
| Partner ID | P-01, P-02… (use the ID, not the name, everywhere outside the tracker) |
| Name + contact | Private tracker only |
| Source channel | r/FBA thread / ASGTG / decoder user / referral… |
| Violation type | ODR / Section 3 inauthentic / Section 3 IP / listing-level (gated types → not eligible, note and close) |
| Marketplace(s) | .com / EU / other — aim for spread |
| Status | contacted → interested → consent sent → **consented** → onboarded → decode ✓ → intake ✓ → POA ✓ → export ✓ → feedback in → (opt-in) outcome in |
| Artifacts consented | notice-for-corpus Y/N · live-QA Y/N · case-study Y/N · testimonial Y/N · outcome-report Y/N |
| Consent record | date + link to the written "I agree" reply |
| Withdrawal | date + what was purged, if ever exercised |
| Notes | friction, bugs, quotes (permission noted) |

Example rows (fictional):

| ID | Source | Type | Status | Artifacts consented |
|---|---|---|---|---|
| P-01 | r/FBA thread | Section 3 inauthentic | export ✓, feedback in | notice Y · live-QA Y · case-study Y · testimonial N |
| P-02 | decoder user | ODR | intake ✓ | notice Y · live-QA N · case-study N · testimonial N |

## 9. Actions

- [ ] **1.** Draft the consent/confidentiality one-pager from the §6 spec; founder reviews and locks the text. — **Owner:** AI assistant (draft) + Founder (approve) · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** every partner onboarding
- [ ] **2.** Set up the private tracking table (§8) outside the repo; add the first shortlist from community interactions. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 2–3 · **Blocks:** recruitment management, M-7 evidence trail
- [ ] **3.** Draft the recruitment message skeleton (§5) and per-channel variants; founder approves the skeleton once, then approves each outgoing message individually. — **Owner:** AI assistant (draft) + Founder (approve each send) · **Cost:** $0 · **Deadline:** Week 2–3 · **Blocks:** all outreach
- [ ] **4.** Make the formal ask to shortlisted sellers; send the one-pager; collect written consents. Target: 5 consented partners. — **Owner:** Founder · **Cost:** $0 cash (foregone revenue ≈ $199/Pass, up to ~$995 total (estimate)) · **Deadline:** Week 3–4 · **Blocks:** onboarding, corpus enrichment
- [ ] **5.** Ask the live-Seller-Central-access question explicitly of every consented partner; secure at least one yes. — **Owner:** Founder · **Cost:** $0 · **Deadline:** asked by Week 4, access by Week 6 · **Blocks:** M-6 live QA (gate check 15)
- [ ] **6.** Collect partner notices; anonymize per §6.4; add to the fixture corpus as a validation set; delete raw originals. — **Owner:** AI assistant (anonymize) + Founder (verify nothing identifying remains) · **Cost:** $0 · **Deadline:** Week 4–6 · **Blocks:** classifier validation against current-notice reality
- [ ] **7.** Onboard consented partners onto the web surface as it goes live; issue their free Passes (license keys via the MoR-independent comp path — confirm the MoR dashboard supports 100%-off or direct key issue before week 4). — **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** Week 4–6 · **Blocks:** flow testing before the extension exists
- [ ] **8.** Run the M-6 supervised live QA session on the partner (or Jhangir) account; record results per the QA checklist. — **Owner:** Founder + Jhangir (+ partner) · **Cost:** $0 · **Deadline:** Week 6–7 · **Blocks:** M-6 acceptance, Gate 2
- [ ] **9.** Distribute the unlisted CWS link to partners on approval; support them through the full flow (§7); record stage evidence in the tracker. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 7 · **Blocks:** M-7 gate (check 21), public launch
- [ ] **10.** Draft case studies/testimonials from consented partners; partner approves each before publication; stage them for launch day. — **Owner:** AI assistant (draft) + Founder + partner (approve) · **Cost:** $0 · **Deadline:** Week 7–8 · **Blocks:** launch-post proof content (`./04-LAUNCH-DAY-CHECKLIST.md`)
- [ ] **11.** ⚠ FOUNDER-DECISION — If fewer than 3 partners have completed the full flow by end of week 7: slip the M-8 launch until 3 completions exist, or write a dated exception into `../00-DECISION/02-DECISION-LOG.md` §4 with compensating evidence (e.g., founder-run live cases). The gate exists because launching a panic-purchase product that no real seller has completed end-to-end is how "tool got me banned" threads happen. — **Owner:** Founder · **Cost:** $0 (schedule risk) · **Deadline:** end of Week 7 · **Blocks:** M-8 go/no-go

## Definition of done

- [ ] 5 partners consented in writing (one-pager replies archived); tracker live and current.
- [ ] Partner notices anonymized into the fixture corpus; raw originals deleted; founder spot-checked anonymization.
- [ ] Live Seller Central QA session completed on a consented account (M-6 gate check 15 evidence recorded).
- [ ] **3 partners through decode → intake → POA → export on real cases** — M-7 gate check 21 ticked with dated evidence per partner.
- [ ] At least 1 partner-approved anonymized case study and 1 testimonial staged for launch day (or a written note that none consented — never fabricate).
- [ ] Zero unapproved outreach messages sent; zero channel-rule violations logged.
- [ ] Every partner heard the no-outcome-promise in writing; the word "guarantee" appears nowhere in recruitment or consent materials.

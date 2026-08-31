# 07-ROADMAP-AND-EXPANSION — What we build after launch, in what order, and what triggers each step

**Why this file exists / when to use it:** the launch plan (`../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`) deliberately ships a narrow v1. This file is the sanctioned queue for everything that comes after: the P1 features in priority order with the entry criteria that must be met before each starts, the P2 layer behind them, the conditions under which the deferred Expert Review SKU revives, and the multi-product expansion ladder with its go-triggers. Use it whenever someone proposes new scope: if the proposal is here, check its entry criteria; if it is not here, it goes through the decision log (`../00-DECISION/02-DECISION-LOG.md`) before any build time is spent.

**Terms used below:** P1/P2 = post-launch priority tiers (P1 = next in line once launch is stable; P2 = behind all P1 items and usually behind an infrastructure or legal precondition). POA = Plan of Action, the appeal document Amazon requires. RAG = retrieval-augmented generation — grounding LLM drafts in a searchable document corpus. pgvector = the Postgres extension we use for vector (semantic) search. SP-API = Amazon's official Selling Partner API. BSA §19 / Agent Policy = the March 2026 Amazon policy restricting automation/scraping of Seller Central. SKU = a sellable product line (here: the $199 Appeal Pass, the $29/mo Guardian, the deferred Expert Review). MoR = Merchant of Record payment provider (Paddle). AUP = acceptable-use policy. ADA/EAA = the US Americans with Disabilities Act and the European Accessibility Act — the legal bases for web-accessibility demand letters. ODR = order defect rate.

**Standing rule:** launch scope is frozen. Nothing in this file starts before the launch gate passes (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`), and each item starts only when its own entry criteria are met — entry criteria exist precisely so that a quiet week doesn't get filled with the wrong feature.

---

## 1. The P1 queue (in priority order — work top to bottom)

| # | Feature | What it is | Why this position | Entry criteria (ALL must hold) |
|---|---|---|---|---|
| 1 | **Rejection-reason parser** | Paste Amazon's rejection reply → parse what was rejected and why → drive a targeted redraft instead of a blind retry | **FIRST.** Highest value-to-effort in the whole backlog: the intake and composer already exist, and most first appeals fail — so the *second* attempt is where we prove worth. It also feeds on real Amazon replies, compounding our fixture corpus. | Launch stable (no P0 bugs 2 weeks); ≥10 real rejection replies collected from paying users (opt-in); consultant available to review the parse taxonomy against real replies. |
| 2 | **Book-a-call referral + escalation-packet export** | On severity-gated and repeat-rejection screens: a scheduling link to a vetted human consultant plus a one-click export of the case (notice, drafts, timeline, evidence list) as a clean PDF packet | Monetizes the cases we ethically refuse to sell a Pass for (decision D6 severity gating) and the cases the parser marks as beyond self-service. Referral revenue with near-zero build cost; the packet doubles as the customer's own record. | ≥1 named referral partner agreed in writing (from the recruitment kit bench, `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md` vetting rules apply); severity-gating screens live; PDF export path tested. |
| 3 | **Local invoice-evidence matching** | Match evidence files in the local vault (invoices, receipts) against ASINs/claims parsed from the notice — locally, no upload | Invoice authenticity is the make-or-break of Section 3 and IP cases. Local-first keeps the privacy story intact. Cloud-drive integrations (Drive/Dropbox OAuth) stay P2. | Vault + parser stable; ≥20 paid cases observed to learn real evidence patterns; zero server-side handling of evidence files (hard requirement). |
| 4 | **Guardian monitoring backend → THEN enable the $29/mo SKU** | Real account-health alerting (compliant data path: user-forwarded notification emails or — only after legal clarity — SP-API), deadline reminders, early-warning drafts | The SKU is deferred until the feature exists (decision D7; persona EP-5 in `06-EDGE-PERSONAS.md`). Selling monitoring before it works is selling vapor — churn, refunds, trust damage. | Guardian waitlist ≥100 emails OR ≥10% of customers requesting monitoring; a compliant alert data path designed and legally checked (NEVER scraping); support capacity for a subscription product confirmed (`../06-OPERATIONS/01-SUPPORT-OPERATIONS.md`); MoR subscription flow + dunning tested. **The SKU goes on sale only after the feature demonstrably ships.** |
| 5 | **Policy-corpus RAG (pgvector)** | Amazon policy pages + curated exemplar POAs embedded in Supabase pgvector; composer retrieves the relevant policy text per case | Measurably better grounding for drafts and the base layer for consultant-curated exemplars ("expert playbook feeds AI" — P2 editorial, never auto-fed user cases). | Composer quality baseline measured (critic scores on ≥50 real cases) so RAG's lift is provable; corpus licensing clean (own summaries + public policy text only); Supabase tier per `05-RESOURCE-STACK-AND-BUDGET.md` §1.1. |
| 6 | **Email alerts** | Deadline reminders and case-status nudges by email | Needs a minimal server-side link between an email address and case deadlines — a deliberate, opt-in dent in pure local-first, so it waits until the value is proven by usage. | Opt-in consent flow drafted into privacy policy; deadline engine validated against real cases (corrected deadline model, Second Opinion amendment #3); sending domain warmed. |
| 7 | **Screenshot-input classification** | Accept a screenshot of a notice (not just pasted text) → OCR/vision extraction → same decode pipeline | Widens the funnel top (mobile users especially — persona EP-3) but is pure convenience until decode volume proves demand. | Decoder funnel data showing meaningful drop-off at the paste step; vision-model cost per decode measured within the D9 cost ceiling; accuracy ≥ paste-mode baseline on the fixture corpus. |
| 8 | **Accessibility (WCAG) pass** | Keyboard-only flows verified end-to-end, color-contrast check, ARIA on the intake wizard. **Owner:** AI assistant + Founder. | A panic-moment product must work under stress and on assistive tech; fixing accessibility before traffic scales is far cheaper than retrofitting after. | **Must complete before any scaling push or paid acquisition** — no ad spend or growth push starts while this is open. |

## 2. The P2 layer (behind all P1, each with its own precondition)

| Item | What it is | Precondition |
|---|---|---|
| **Opt-in sync + multi-VA roles** | Accounts, encrypted sync, role-based sharing of a case between founder/VA/agency users | EP-1 trigger fired (`06-EDGE-PERSONAS.md` §6); priced as its own tier; security review of the sync design. |
| **DE/FR locales + translation-with-disclaimer** | Localized UI first (German/French — nearest big EU marketplaces), then draft translation for understanding. Fixed disclaimer, verbatim: **"Amazon requires English submission; this translation is for your understanding only."** | EP-2 trigger fired; a human-checked translation QA pass per locale; the English-only submission rule enforced in the UI (never sell or auto-submit a non-English POA). |
| **PWA / mobile web parity** | Vault + deadlines + composer in an installable mobile web app | EP-3 trigger fired (mobile ≥30% of sessions AND mobile conversion ≥50% of desktop). |
| **SP-API integration** | Official Amazon data channel for monitoring/bulk features | **ONLY after legal clarity + proven demand** (decision D7): the full BSA §19/Agent Policy read is done and favorable, an SP-API developer application is realistically approvable, AND a P1-item or EP-4/EP-5 trigger demands it. Never scraping as a substitute. |
| **Drive/Dropbox evidence OAuth** | Cloud-drive import for the evidence vault | P1 item 3 shipped and stable; privacy-policy update; scope-minimal OAuth. |
| **Expert-playbook editorial loop** | Consultant curates exemplars/templates into the RAG corpus with opt-in outcome data | P1 item 5 shipped; consultant under contract; **user cases never auto-fed** — editorial, consented, anonymized only. |
| **Browser ports (Edge/Brave/Opera)** | Ship the extension on the other Chromium-family stores (Edge Add-ons; Brave/Opera via CWS or their own channels) | Sustained organic requests OR 3 months post-M-8, whichever comes first. Note the added testing burden: every release thereafter carries per-browser QA on top of the Chrome pass. |

## 3. Expert Review — revival conditions

Expert Review (a vetted human strengthens the AI draft after a rejection, ~$199/case) is deferred because MoR acceptable-use policies exclude human services — Paddle's AUP prohibits them outright and Stripe's MoR product excludes "human intervention" services (verified; see decision D2/D7 rationale). It revives only when ALL of the following hold:

1. **Payment rails resolved:** a separate payment service line under a compliant jurisdiction, OR written pre-clearance from Paddle for the specific SKU wording (expect refusal; their 2025 FTC history makes "account recovery"-adjacent products extra-scrutinized — (unverified) risk-team behavior, verified settlement). Never mixed onto the MoR account without that written clearance — an AUP violation risks the rail that carries ALL revenue.
2. **A vetted bench exists:** ≥2 specialists who passed the paid fixture audition (two-trap test, decision D5), under collaborator agreements (per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`), paid **$75–125/case out of the $199** (estimate — final split set per specialist), with capacity for correlated demand waves.
3. **Demand evidence:** rejection-parser data (P1 item 1) showing a meaningful cohort of twice-rejected cases whose owners ask for human help — measured, not assumed.
4. **Copy discipline:** the offer ships with outcome-neutral wording ("a specialist strengthens your draft — no outcome is promised"), the honest-expectations card, and zero of the banned claims (`01-MARKET-EVIDENCE.md` §4).

Until all four hold, the human-help demand is served by P1 item 2 (book-a-call referral + escalation packet) — which also generates the evidence for condition 3.

## 4. The expansion ladder (multi-product, one engine)

**The reuse thesis:** every rung reuses the same engine — **parse an enforcement notice → classify the violation → generate a grounded response document → track the deadlines → keep an evidence vault.** AppealDeck is rung 1 of a panic-response platform, not a one-off tool. A rung is only climbed on its go-trigger; climbing early splits a solo founder across two immature products.

| Rung | Product | Market | Timing | Go-trigger | Known risks (state them up front) |
|---|---|---|---|---|---|
| 1 | **AppealDeck** (this playbook) | Suspended Amazon sellers | Now | — | See risk register + gates. |
| 2 | **AdVerdict** | Google Ads account suspensions (suspension volume is large; the widely-cited 2024 figure comes from Google's Ads Safety Report but re-verify before use (unverified as of this writing)) | **+3–6 months, IF AppealDeck shows sustained sales** (multiple consecutive weeks of paid Passes at or above the Gate-3 level, `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`) | Sustained AppealDeck revenue + engine extraction complete (the platform-agnostic TS core must genuinely be platform-agnostic by then) | **Distributing an anti-Google-enforcement tool through Google's own store:** Chrome Web Store removal risk is structural and possibly terminal for the extension form — plan AdVerdict web-first from day one; white-label to boutique ad-account fixers is the hedge channel. |
| 3 | **LetterShield** | Businesses receiving ADA/EAA web-accessibility demand letters | **+6–12 months** | Rung 2 stable or consciously skipped; EAA enforcement wave materializing (EAA applies from June 2025 — verify enforcement reality at decision time (unverified)) | Letters come from lawyers — responding drifts closer to legal practice than Amazon appeals do; the UPL posture needs re-examination per market, and the scoped legal review is NOT optional here. |
| — | **Parallel composer track: CiteSight → SendProof** | CiteSight: "AI Overviews took my traffic" reporting/response for publishers; SendProof: claim-verification for AI-written outreach (the Round-1 concept, demoted) | Opportunistic — only with spare capacity or a partner-operator; never at the cost of a rung | An operator besides the founder exists, or the engine work makes one of them nearly free | Neither has panic-moment demand (that is why they lost Rounds 1–2, `../00-DECISION/02-DECISION-LOG.md` §1); they are options, not commitments. |

**Ladder discipline:** each rung decision is logged in the decision log with its trigger evidence attached. If AppealDeck misses its gates, the ladder is void — the kill criteria in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` apply to the platform thesis too.

---

## 5. Actions

- [ ] **1.** Stand up the roadmap board (single Notion/Sheets page mirroring §1–§2 with per-item status + entry-criteria checklist). **Owner:** AI assistant · **Cost:** $0 · **Deadline:** launch week (M-8) · **Blocks:** orderly post-launch work.
- [ ] **2.** Add the opt-in "share Amazon's reply with us" flow (consented rejection-reply collection) to the paid product so P1 item 1's entry criterion can ever be met. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** M-7 · **Blocks:** rejection parser; Expert Review condition 3.
- [ ] **3.** Ask the retained consultant (during the week 3–5 retainer) which rejection-reply patterns they see most — pre-seeding the parser taxonomy. **Owner:** Founder · **Cost:** $0 (inside retainer) · **Deadline:** week 5 · **Blocks:** P1 item 1 design.
- [ ] **4.** Secure the first written referral-partner agreement (bench candidate from the recruitment kit, audition passed). **Owner:** Founder (candidates sourced directly via Fiverr/Upwork; founder signs) · **Cost:** $0 (revenue-share/per-referral terms) · **Deadline:** M+4 weeks · **Blocks:** P1 item 2.
- [ ] **5.** Draft the Guardian compliant-data-path memo (email-forwarding design vs SP-API-after-legal-read; explicitly rejecting scraping) for the founder to approve before any Guardian build starts. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** when the EP-5 trigger fires · **Blocks:** P1 item 4.
- [ ] **6.** Re-verify at decision time: Google Ads suspension volume (rung 2) and EAA enforcement reality (rung 3) — both currently (unverified). **Owner:** AI assistant · **Cost:** $0 · **Deadline:** at each rung's go-trigger evaluation · **Blocks:** ladder decisions on real numbers.
- [ ] **7.** ⚠ FOUNDER-DECISION — rung 2 go/no-go at +3–6 months: with sustained-sales evidence in hand, decide AdVerdict start vs doubling down on AppealDeck P1 depth. Log in the decision log with the trigger data. **Owner:** Founder · **Cost:** $0 to decide · **Deadline:** first evaluation at M+3 months · **Blocks:** expansion ladder.

---

## Definition of done

- [ ] The roadmap board exists and every P1/P2 item on it carries its entry criteria from this file.
- [ ] No post-launch feature has started with unmet entry criteria (spot-check at each weekly review); any exception is logged as a decision.
- [ ] The $29/mo Guardian SKU is not purchasable anywhere until the monitoring feature is live — verified before enabling the price in the MoR dashboard.
- [ ] Expert Review remains unsold until all four §3 conditions are documented as met.
- [ ] Rejection-reply collection is live and consented, and the reply count toward P1 item 1's criterion is visible in the weekly review.
- [ ] Any expansion-ladder move traces to a logged decision with trigger evidence; a newcomer can read §4 and correctly state why AdVerdict has not started yet.

# 04-EVIDENCE-FIRST-HARDENING — external-AI review verdict + the evidence layer that closes the real rejection gap

**Why this file exists / when to use it.** On 1 Sep 2026 the founder ran a long brainstorm about Amazon suspensions and POA tooling with an external AI (Meta AI). This file is the disciplined digest of that conversation: every load-bearing claim fact-checked against our verified evidence base (`../07-REFERENCE/01-MARKET-EVIDENCE.md`, `02-BUILD-PLAN-AMENDMENTS.md`) plus a fresh live-web re-verification (2 Sep 2026); the suggestions worth adopting turned into build spec (EF-1…EF-5 below, actioned as amendment **AM-16** in `02-BUILD-PLAN-AMENDMENTS.md`); and the suggestions that conflict with locked decisions recorded in a rejected register (§4) so no future session re-litigates them. **Spec and analysis live here; the actionable checkboxes live in AM-16 — one source of truth for each.**

**Overall verdict on the conversation:** directionally right, factually unreliable. Its core strategic pressure — *a POA tool fails unless it forces real remediation + evidence and merely documents it* — is correct and is the one thing our current M4/M5 spec under-implements. Its numbers, dates, model names, and "sources" are largely hallucinated or stale, and several of its product suggestions (SP-API ingestion, $299/mo subscription, an "82% approval predictor") would break locked decisions D2/D6/D7 or the local-first wedge. Four genuine gaps were found; everything else was either already in the plan or already banned.

**Terms:** POA = Plan of Action. Matrix = the per-violation evidence-requirements model (EF-1). Readiness = deterministic case-file completeness (EF-2), never a prediction of Amazon's decision. Gap draft = a composer output for an evidence-incomplete case: skeleton + action plan + obtain-list, watermarked not-ready-to-submit.

---

## 1. Claim-by-claim fact-check of the 1 Sep 2026 conversation

Verdicts against our verified base (25 Aug 2026 verification + amendments). Rows marked ⏳ get a live-web re-check dated 2 Sep 2026 in §1.1.

| # | Meta AI claimed | Verdict | Authority |
|---|---|---|---|
| 1 | Agencies charge "$500–$5,000" per appeal | **Confirmed, minor correction** — verified anchor is **$600–$5,000** (public prices, 25 Aug 2026) | `01-MARKET-EVIDENCE.md` §1.2 |
| 2 | Agency win rates "70–85%"; Section 3 approval "40%"; "82% chance based on 4,200 cases" | **Banned class** — every such figure is invented; no dataset exists. The only published number in the market is AppealsPro's transparent **23%**, which we never mock and never counter with an invented figure | Banned-numbers list §4 of `01-MARKET-EVIDENCE.md`; competitor dossier §1.2 |
| 3 | "March 4, 2026 BSA update: unauthorized AI tools / pricing bots = **Section 3** risk" | **Partly true, wrong clause** — the real instrument is the standalone **Agent Policy** in the 4 Mar 2026 BSA update (announced ~17 Feb 2026): automated systems must self-identify and cease access on demand; plus AI/ML restrictions and a new §20 codifying arbitration. Not §3 — and the "§19" label our AM-02 carries is itself single-source: B-08 confirms real numbering from the retrieved text. Policy is now IN FORCE → the read is more urgent, not less ⏳ | AM-02; `01-BUILD-SEQUENCE.md` B-08/B-15; §1.1 |
| 4 | Amazon runs a "7-minute bot filter" that auto-rejects generic appeals | **Unverified folklore** — the defensible version is already ours: "Seller Performance uses LLM-assisted triage that rejects boilerplate" (firm-reported consensus, no timing metric, no rejection-rate metric). Never quote minutes or percentages ⏳ | `01-MARKET-EVIDENCE.md` §1.6 |
| 5 | Funds appeal available "after 90 days" via disbursement-appeals@ | **Wrong / stale — would have mis-advised users.** Funds appeal is eligible at **deactivation + 60 days** (policy change Oct 2024); day 90 is a checkpoint and release is **never automatic**; fraud-class holds are indefinite | AM-03 (already implemented in `src/core/deadlinesModel.ts`) |
| 6 | "48–72h response; follow up after 7 days; Section 3 takes weeks" | **Time promises banned** — initial-response and substantive-review times differ wildly; never promise times. A user-configured follow-up **reminder** (default 7 days, local, no sending) is fine and is adopted in EF-4 | Banned-numbers list ("24–48h decisions") |
| 7 | Generic/template/AI appeals get rejected | **Verified as consensus** (firm-reported, qualitative only). Already our own quality bar: an AppealDeck draft that reads like a template fails the same triage | `01-MARKET-EVIDENCE.md` §1.6 |
| 8 | Wrong format kills appeals (POA where a dispute belongs, etc.) | **Credible and adopted** — our composer contract is currently POA-only; formalized as the document-type router (EF-3) | §7.2/§7.3 of v1.0 spec; EF-3 |
| 9 | Inauthentic cases need real supplier invoices (name/address, date, quantity); screenshots/order confirmations insufficient | **Confirmed in substance** — encoded as the first row of the evidence matrix (EF-1) ⏳ | v1.0 §7.1; EF-1 |
| 10 | Opening a new account while suspended = related-account ban | **Confirmed in substance** — already in the taxonomy and fixtures; surfaced as a standing warning in guidance | `src/core/guidance.ts` RELATED_ACCOUNT |
| 11 | "10M sellers", "maybe 50 good agencies", "$3.5M ARR at 1,000 × $299/mo" | **Contradicted / fantasy math** — ~1.65M active sellers (verified); "2M+" is already banned as stale, 10M is worse; the ARR arithmetic belongs to the banned "$2.3M ARR" class | `01-MARKET-EVIDENCE.md` §1.1 + §4 |
| 12 | Price at "$299/mo + $199 per appeal" for $100k–5M sellers | **Rejected** — "$99–299/mo willingness-to-pay" is on the banned list (invented); the verified market is per-case fees ($600–$5,000). D2/D7 lock $199 one-time per case; Guardian $29/mo stays deferred until monitoring ships | D2, D7; banned list |
| 13 | Build an ensemble ("Claude 4" + "Muse Spark" + "GPT-5o") fine-tuned on "10,000+ approved/rejected POAs" | **Hallucinated** — "Muse Spark" and "GPT-5o" are not real models; no lawful corpus of approved/rejected POAs exists to us, and training on user case data would breach our privacy posture. D9 stack stands: rules-first core + Gemini Flash paid tier via our backend | D9; AM-07/AM-08 |
| 14 | Ingestion engine via SP-API pulls of Account Health data | **Rejected for v1, deliberately** — D7 defers SP-API until legal clarity; the OAuth handover is precisely SellerForge's weakness our wedge exploits (*local-first, no account keys leave the browser*); and a deactivated seller's API access is unreliable exactly when they need us. Paste-mode primary stands (D3) | D3, D7; competitor dossier §1.1 |
| 15 | "Approval Score Predictor: this POA has 82% chance" | **Violates D6** (honest expectations; no success claims without opt-in outcome data). Replaced by the deterministic **Case Readiness** meter (EF-2): completeness of the case file, transparently computed, explicitly labeled as *not* a prediction | D6; EF-2 |
| 16 | Sellers lie to tools (fake destruction photos, fake attestations) | **Real risk, honest answer adopted** — we never claim to verify documents; per-slot **attestation** puts the statement of genuineness on the seller in their own words; forged-docs/fraud severity gate (never sold a Pass) already stands | D6; EF-2 attestation |
| 17 | "Agencies are part lawyer, part therapist, part project manager — the POA is the report of work already done" | **The keeper insight.** Correct, verified by what agencies visibly sell (evidence chasing, project management), and the exact gap in our current spec: we model questions and text, not actions and evidence. This is EF-1 + EF-2 | §2 below |

### 1.1 Live-web re-verification addendum (2 Sep 2026)

Two research passes ran 2 Sep 2026 (competitive landscape; policy currency), ~25 sources each, every claim URL-tagged in the archived full reports — `reference/2026-09-02-COMPETITOR-RECHECK.md` and `reference/2026-09-02-POLICY-FACTCHECK.md` (the originating chat was deleted; those files are the source record). Verdict changes are propagated into §1; the durable findings:

**Policy verdicts (⏳ rows):**
- **Row 3 — Agent Policy: CONFIRMED real; framing corrected twice.** The 4 Mar 2026 BSA update (announced ~17 Feb 2026; official Seller Forums thread) ships a standalone **Agent Policy** — automated systems touching Amazon services must **self-identify as automated**, comply, and cease access on demand — plus AI/ML-training and reverse-engineering restrictions on Amazon materials, a new "Agent" defined term, a Mexico BSA split, and **Section 20** codifying AAA arbitration + class waiver. No source ties any of it to §3 (Meta AI wrong) — and the "§19" placement our own AM-02 uses is itself a single-source third-party report, so **B-08 confirms the real section numbering from the retrieved text**. Single-source details to check at the read: a 20%-daily-automated-price-change repricer threshold; a ~90-day transition (to ~early Jun 2026). Context: Amazon's preliminary injunction against Perplexity's shopping agent failed (Aug 2026).
- **Row 4 — "7-minute bot filter": NOT FOUND as any documented mechanism.** What actually circulates: seller anecdotes of 4–20-minute rejections, and the opposite practitioner framing — the *deactivation* is automated and the appeal is often "the first substantive human review" (seller-side attorney, 5 Aug 2026). Neither is Amazon-documented; all timing/percentage claims stay out of copy. The verified adjacent fact (Seller Central threads): instant auto-rejections cluster where **required documents were missing or the same document was resubmitted** — the strongest external validation of EF-1/EF-2 gating this review found.
- **Row 5 — funds timing: RE-CONFIRMED.** Oct 9 2024 rename to *Funds Disbursement Eligibility Policy*; request window cut 90→**60 days**; disbursement-appeals@amazon.com real; release never automatic. `deadlinesModel.ts` already correct; Meta AI's 90-day advice was stale by ~2 years.
- **Row 9 — invoice requirements: CONFIRMED, with enrichments** now encoded in the EF-1 matrix: dated ≤365d; supplier business name + physical address + phone; quantities consistent with sales volume; must reflect a **completed transaction** (pro-forma invoices and quotes fail); Amazon independently verifies suppliers, including by phone.
- **Channel caveat (EF-3):** the "Section 3 / IP responses go via the email in the deactivation notice" leg could NOT be confirmed (the Account Health → "Reactivate your account" main path is Amazon-moderator-confirmed). Those types ship "check your notice for the response channel" language until real 2026 notices in the fixture corpus confirm the pattern.
- **Scope notes:** the "10-day information request" rule is INFORM-Consumers-Act-scoped only (statutory verification/annual certification) — a candidate `VERIFICATION` kind for taxonomy v2, never a general rule. Related-account detection is reported (multi-firm consultancy consensus, unofficial) to have expanded beyond device/IP/address to operational overlaps (shared suppliers, infrastructure) — fold into RELATED_ACCOUNT guidance copy at M4. Authenticity/sourcing violations are described as the top driver of full deactivations in 2026 (same grade) — supports the matrix ordering.

**Competitive deltas (founder merges into `../07-REFERENCE/02-COMPETITOR-DOSSIER.md` and re-verifies `01-MARKET-EVIDENCE.md` §1.2 — both edit-gated):**
- The 2026 AI-appeal wave is **all subscription, none per-case, and none has a findable review footprint** (Trustpilot/Reddit/YouTube: not found, 2 Sep 2026): AppealsPro $79.99/$199/mo + token metering; SellerForge from $49/mo (read-only SP-API, cloud Document Vault, free POA generator — closest feature overlap); AppealAI (pricing gated; crude category gating + "have a professional review" disclaimer); free GPT-store wrappers at $0.
- Deaths/decay confirmed: appealshub.com → HTTP 404; appealpath.co → broken TLS (the $11 one-shot, decaying); EcomSellerTools pivoted from POA templates to generic consulting. Graveyard nuance: no large 2021-era appeal-SaaS corpse exists — the category jumped from eBooks/templates straight to the 2025–26 AI wave. **The reputation layer is empty**, which is exactly the opening for a tool that accumulates real cases and opt-in outcome data.
- **Anchor drift:** ecommerceChris has **de-published public pricing** (quote-gated "Start My Case Now"; 4.9★ Trustpilot, 250+ reviews) — the 25 Aug $1,500/$4,000–5,000 rows need the quarterly re-verify BEFORE the next marketing push. AMZ Sellers Attorney's $1,500 standard / $2,300 IP + related-account is now **primary-verified on their own site** (page "last reviewed 19 Aug 2026") — the §1.2 "do not use" note on that figure can be lifted by the founder. New data points: Riverbend protection "as low as $17/day" (~$510/mo, snippet-grade); Seller Basics $199/mo membership + $5,000 surcharge for pre-existing/Section 3 cases.
- **Failure-evidence bank (qualitative use only, under the claims gate):** Riverbend's own blog attacks AI-written appeals (23 Jul 2026 — "Amazon can spot a generic template instantly"; "AI has no ability to evaluate proof"); Seller Central threads: "24 Appeals Rejected" (7-page appeal, blamed employees instead of systems), and instant rejection where invoices were required but prose was sent. Third-party validation of the evidence-first design; never quote with invented numbers.
- **Trust-wedge evidence:** success-rate marketing runs 93–99% across ~9 services (all self-reported, zero methodology; two share identical "5,200+ cases" copy — likely one operator). The credible tier publishes NO rates — AMZ Sellers Attorney explicitly refuses ("prohibited for lawyers"). One service (Amazoker) is reported on Trustpilot requesting seller **passwords + AnyDesk access** — the scam-adjacent norm our local-first, no-credentials posture exists to contrast. All of it confirms D6 as both the ethical and the commercial position.

---

## 2. The five failure modes of POA tools — and where our controls actually stand

The conversation's real value, restated as an engineering thesis. A POA tool becomes "another junk tool" through exactly five failure modes. Three are already controlled by the existing spec; one is partially controlled; one is the genuine gap.

| # | Failure mode | Existing control | Residual gap → fix |
|---|---|---|---|
| F1 | **Writes fiction** — the generator invents specifics (invoice numbers, dates) or emits boilerplate; either way triage rejects it | M5 guardrails hard-block invented policy citations/dates/IDs (diff vs deterministic facts); M4 skipped answers → honest omission; critic flags vague root cause | Corrective-action claims aren't tied to *performed actions*: a draft can truthfully use only intake facts yet still claim "we removed the listings" in past tense with nothing behind it → **EF-2 attestation rule** (past-tense corrective claim must map to an attested action item) |
| F2 | **Writes the wrong document** — a beautiful POA in the wrong lane (IP dispute, funds appeal) burns an attempt | Classifier + §7.3 channel guidance; guidance.ts already hints IP counter-notification | Composer output contract is POA-only → **EF-3 document-type router** |
| F3 | **Documents nothing** — Amazon reinstates when risk is removed; text without completed remediation is promises. This is the #1 real-world rejection cause (missing/mismatched invoices, no SOP) | Intake asks about evidence ("invoice availability & dates ≤365d?") but only as *answers* | Evidence is stored (M6 vault) but not **modeled**: no per-kind requirements, no completeness state, no gating → **EF-1 matrix + EF-2 checklist/readiness/gap-draft** — the core adoption of this review |
| F4 | **Goes stale** — policy names, windows, and evidentiary tastes shift; static templates rot | AM-03 corrections; weekly SellerForge watch; B-08 §19 read; quarterly price-anchor re-verify | No scheduled re-verification of *policy facts* the product asserts (windows, channels, invoice freshness) → **EF-5 quarterly policy re-check** folded into the existing ops cadence |
| F5 | **Overclaims** — win-rate marketing → refunds, chargebacks, MoR risk, reputation death in a scam-scarred market | D6; claims gate; banned-numbers list; "guarantee" grep = 0 | None structural. Two new tempting claims from this conversation must join the banned list: *"agency results at 1/10th the cost"* (parity claim we cannot substantiate) and any **readiness-as-approval** framing (see EF-2 UI copy rule). Banned list lives in `../07-REFERENCE/01-MARKET-EVIDENCE.md` §4 — founder adds the two rows (that file is edit-gated) |

Design consequence, stated once: **the product's job is to get the fix done, then write it down.** Decode tells the seller what happened; the checklist tells them what to fix and what to prove; the vault holds the proof; the POA falls out of a case file that has become true. That ordering — not better prose — is what separates us from the template graveyard.

---

## 3. Adopted enhancements EF-1…EF-5 (spec — actioned as AM-16 / AA-19…AA-21)

### EF-1 — Evidence Requirements Matrix (`src/core/evidenceModel.ts`, new core module)

Deterministic, data-driven mapping: `ViolationKind → EvidenceRequirement[]`. Pure data + pure functions; no `chrome.*`; unit-tested against fixtures extended with evidence-state variants (complete / missing / disqualified).

```ts
type EvidenceKind =
  | 'supplier_invoice' | 'brand_authorization' | 'rights_owner_retraction'
  | 'identity_doc' | 'financial_instrument_doc' | 'sourcing_doc'
  | 'listing_fix_proof' | 'disposal_or_recall_proof'
  | 'metric_export' | 'sop_document' | 'other';

interface EvidenceRequirement {
  kind: EvidenceKind;
  required: boolean;              // required vs strengthens-case
  fields: string[];               // what the document must show
  freshnessDays?: number;         // e.g. 365 for supplier invoices
  quantityRule?: string;          // e.g. "invoiced units ≥ units sold in window"
  disqualifiers: string[];        // what Amazon rejects as proof
  whyAmazonWantsIt: string;       // one honest sentence, shown in UI
}
```

Seed rows (v1 taxonomy; matrix extends when taxonomy v2 lands — key by `ViolationKind` so growth is additive):

| Kind | Required evidence (fields) | Disqualified |
|---|---|---|
| `INAUTHENTIC_DOCUMENTS` | Supplier invoice(s): supplier business name, physical address, phone/contact, issue date ≤365d, line items mappable to the ASIN(s), invoiced quantity consistent with units sold in the complaint window, reflecting a **completed transaction**; supply-chain narrative. Strengthens: brand authorization letter. `whyAmazonWantsIt`: Amazon independently verifies suppliers, including by phone (confirmed 2 Sep 2026) | Pro-forma invoices and quotes; order-confirmation screenshots; self-created spreadsheets; retail receipts where wholesale-scale quantity is claimed; edited/annotated PDFs |
| `INTELLECTUAL_PROPERTY` | Fork by complaint: authorization/license proof OR invoice chain from an authorized distributor OR rights-owner retraction (template letter in EF-4). Baseless claim → dispute path (EF-3), not a POA | Unverifiable "we are allowed" statements; screenshots of listings |
| `RELATED_ACCOUNT` | Identity of the linked account + truthful relationship explanation; proof the linked account's issue is resolved or the account closed; or evidence of non-relation (shared service provider, prior owner, etc.) | Denial without explanation |
| `LISTING` | Before/after listing fix proof; compliance doc where product-safety adjacent (child-safety → severity gate, never sold); Seller Challenge option surfaced when AHA detected | "We will fix it" without the fix |
| `FUNDS` | Identity doc, financial-instrument doc, sourcing docs — the disbursement-appeal bundle, timed by `funds_appeal_eligible` (+60d) | — |
| `POLICY` (incl. ODR/performance until taxonomy v2) | Metric export/breakdown of the defect window; per-claim resolution status; SOP change document; carrier/3PL change proof where shipping-caused | Apology text in place of metrics |
| `UNKNOWN` | none — re-decode prompt | — |

The invoice-freshness and field rules carry a `verifySource` note and are covered by the EF-5 quarterly re-check — the matrix is policy-derived data and MUST be maintainable without an app release (plain data module today; remote-config candidate at M12 alongside AM-14 settings).

### EF-2 — Action checklist, attestation, readiness, and the gap draft

The enforcement layer, rebuilt to fit our ethics (no pretending to verify; no dishonest blocking; severity gates unchanged).

- **Action plan generation:** intake (M4) now emits, alongside answers, a per-case `ActionItem[]` derived from the matrix + answers: e.g. *contact supplier for a compliant invoice (letter template attached)*, *reconcile invoiced vs sold quantities*, *close or document the linked account*, *refund open claims*. Each item: `{id, label, evidenceSlots: EvidenceKind[], status: 'todo'|'in_progress'|'done', attestation?: {attestedAt, note}}`.
- **Attestation, not verification:** marking an item done requires an explicit attestation checkbox — microcopy fixed: *"You confirm this action is truly complete and any attached document is genuine and unaltered. AppealDeck cannot and does not verify documents."* Forged-docs/fraud severity gating is untouched (those cases never reach a Pass).
- **Case Readiness (deterministic):** `readiness(case) → {score 0..1, missing: EvidenceRequirement[], disqualifiedPresent: string[], unattestedActions: ActionItem[]}` computed from required-evidence presence + attestation. Pure function, unit-tested. **Fixed UI copy rule (claims-gate): rendered ONLY as "case-file completeness" — never as a probability, prediction, or strength score of the appeal.** This is our honest answer to AppealsPro's 0–100 "Appeal Strength Scorer" and the conversation's fake "82% predictor".
- **Composer gating — two-mode output (M5):**
  - readiness below the per-kind required-complete threshold → **gap draft**: POA skeleton with the true facts it has, an explicit action plan, the obtain-list with `whyAmazonWantsIt` lines, watermarked **"NOT READY TO SUBMIT — evidence gaps listed"**. Never filler, never invented completeness.
  - required-complete → full draft (existing M5 pipeline).
  - Rationale for not hard-blocking paid users: appeal windows are real; a seller who genuinely lacks a document must still respond in time, honestly ("we are obtaining X, expected by Y"). Hard blocks stay reserved for severity gates.
- **New critic/guardrail flags (extends M5.4/M5.5):** (a) past-tense corrective claim with no attested action item behind it; (b) text references evidence whose slot is empty; (c) resubmission with no material novelty (ties into AM-03's repetition-novelty warning — a resubmit should show a readiness delta or changed framing).
- **Vault binding (M6):** evidence uploads bind file → typed slot from the matrix; slot state feeds readiness; the existing escalation-packet export gains a cover sheet listing slots + attestation dates.
- **Free-tier hook (M11, default — founder may trim):** the free decode summary shows the *required-evidence kinds list* for the classified violation (static from the matrix). The per-slot workflow, checklist, letters, readiness, and drafts are Pass features. The free gap list is the honest conversion hook: it demonstrates we know what the case needs before asking for money.

### EF-3 — Document-type router (composer contract fork)

`DocumentType = 'poa' | 'ip_dispute' | 'funds_appeal' | 'listing_appeal' | 'followup_nudge'`, selected from `ViolationKind` + notice facts. §7.2's canonical POA contract is unchanged for `'poa'`; each other type gets a mini-contract (structure + channel guidance from §7.3 + tone profile):

- `ip_dispute` — complaint ID, ASIN(s), basis of dispute or authorization proof, retraction status; **tone: factual rebuttal**, zero indignation; copyright counter-notice territory carries the "consult a professional" severity note (legal instrument, not copy). Channel guidance for Section-3/IP types ships as "check your notice for the response channel" — the email-reply leg could not be confirmed on 2 Sep 2026 (§1.1).
- `funds_appeal` — identity / financial instruments / sourcing structure, timed by `funds_appeal_eligible` (+60d); copy must never imply automatic release (AM-03).
- `listing_appeal` — per-ASIN fix documentation; Seller Challenge surfaced when applicable (AHA, 3-per-180d budget).
- `followup_nudge` — short, references the original submission ID/date, adds only novelty; generated only after a user-set reminder fires (EF-4).
- **Tone profiles:** `ownership` (default POA), `risk-removal` (account-level / Section-3-adjacent: lead with the control changes that remove the risk; zero pleading — the conversation's one good tonal point, formalized), `factual-rebuttal` (baseless IP). The existing bans stand everywhere: no emotion, no blame, no legal threats, no "guarantee".
- v1 ship scope: `poa` + `funds_appeal` + `ip_dispute`; the rest ride taxonomy v2.

### EF-4 — Response-cycle aids (letters + reminders)

- **Outreach letter templates** (`src/core/letters.ts`, pure data; user sends manually — the product never sends anything): (1) supplier invoice request enumerating the exact matrix fields the invoice must show; (2) rights-owner retraction request; (3) follow-up nudge. Consultant review (B-16) covers these alongside the POA templates.
- **Follow-up reminders:** `custom` deadline presets created on "I submitted" timeline events (default 7 days, user-adjustable, framed as *reminder*, never as a promised response time — banned-numbers rule). Rides the existing M7 alarms; zero new notification machinery.
- **Escalation content:** the §7.3.5 ordered ladder stays the single escalation model (revised POA → seller-performance@ → jeff@/ESR → Call-me-now → BSA dispute stage rendered display-only with "consult a professional"). EF-4 only adds stage-entry criteria text and links each stage to the letters above.

### EF-5 — Outcome-loop schema + policy re-check cadence (D10 stage 5, made concrete)

- Opt-in outcome record (analytics, aggregate-only, never per-user reporting): `{kind, marketplace, docType, attempts, readinessAtSubmit, outcome: 'approved'|'rejected'|'no_response'|'withdrawn', daysToOutcome}`. Purpose: (a) the only lawful path to ever publishing outcome statements (market-evidence action 4 remains the gate, forever); (b) internal tuning of matrix weights and critic rubric. **No model training on user case content** — tuning means editing our own rules/templates, not feeding drafts anywhere.
- **Quarterly policy re-check** joins the existing ops cadence (with the §1.2 price-anchor re-verify): re-verify the policy facts the product asserts — appeal windows, funds timing, channel names, invoice-freshness rule, §19 status — and update the matrix data + `guidance.ts` copy in the same PR. Stale policy facts are F4; this is the standing antidote.

---

## 4. Rejected-suggestions register (do not re-litigate without a decision-log append)

| Suggestion (from the 1 Sep conversation) | Rejected because | Locked by |
|---|---|---|
| SP-API ingestion of Account Health / violations | Deferred until legal clarity; breaks the local-first no-OAuth wedge; unreliable exactly when the seller is deactivated | D7, D3; dossier §1.1 |
| Auto-submission / automation of appeals | Never. Read-only posture is the compliance spine; BSA §19 makes it near-mandatory | D6; AM-02; sequencing rule 4 |
| $299/mo subscription (+$199/appeal) | Willingness-to-pay figure is invented; distress purchase fits one-time per-case; Guardian $29/mo exists and stays deferred until monitoring ships | D2, D7; banned list |
| Approval-probability predictor ("82% chance") | Success claims without opt-in outcome data are banned; fabricated confidence in a scam-scarred market is the incumbent sin we position against | D6; replaced by EF-2 readiness |
| Frontier-model ensemble + fine-tune on 10k POAs | Hallucinated models; no lawful corpus; cost/complexity absurd for a solo founder; quality path is evidence + rubric, not weights | D9; AM-07/AM-08 |
| "Agency results at 1/10th the cost" copy | Unsubstantiable parity claim → propose for the banned list (founder adds to `01-MARKET-EVIDENCE.md` §4) | D6; AM-06 |
| Zoom audits / done-for-you supplier chasing ($500 upsell) | Human services breach Paddle AUP (MoR-ineligible) and solo-founder scope; Expert Review stays deferred on separate rails | AM-01; D5, D7 |
| Win-rate marketing of any kind | Standing rule; nothing new | D6; market-evidence action 4 |

---

## 5. Keeper lines (claims-gate-safe, for M4/M5/M-W copy — founder approves before publish)

- *"A Plan of Action is documentation of a fix that already happened. AppealDeck's job is to help you finish the fix — then write it down properly."* (product north star; UX copy for the checklist screen)
- *"We don't sell words. We organize your case: what to fix, what to prove, what to send, and when to follow up."* (positioning; pairs with the verified $600–$5,000 anchor sentence)
- The readiness meter's fixed label: *"Case-file completeness — not a prediction of Amazon's decision."*

---

## Definition of done

- [ ] AM-16 (AA-19…AA-21) appears in `02-BUILD-PLAN-AMENDMENTS.md` and is reflected in the M-4/M-W gates; this file is referenced from AM-16 as the spec source.
- [ ] `src/core/evidenceModel.ts` + `letters.ts` + readiness + document-type router exist with unit tests; fixture corpus carries evidence-state variants; the critic catches an unattested past-tense corrective claim in a seeded-bad draft.
- [ ] The gap-draft path renders for an evidence-incomplete fixture and is watermarked; severity-gated kinds still never reach checkout.
- [ ] Founder has added the two new banned rows to `../07-REFERENCE/01-MARKET-EVIDENCE.md` §4 and merged any 2 Sep 2026 competitor deltas into the dossier.
- [ ] §1.1 live re-verification is filled in with dated findings (2 Sep 2026) and any verdict changes propagated to §1.
- [ ] A newcomer can answer from this file alone: which five ways POA tools die, which one our spec was still exposed to, and why our readiness meter is not a success predictor.

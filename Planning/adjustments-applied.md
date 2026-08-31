# Adjustments Applied — session record, 29 Aug 2026

**What this file is:** the complete record of the AI working session (Claude, 29 Aug 2026) that converted this playbook from its half-corrected state to the settled solo-founder / Pakistan configuration, repaired the damage left by an earlier automated edit pass, and committed the result. It documents every step: what was asked, what was decided, what was found broken, what changed, what was deliberately kept, and what remains for the founder to verify. Companion to `Adjustments.txt` (the founder's original clarification notes) and `00-DECISION/02-DECISION-LOG.md` (where the formal decisions live).

---

## 1. The session, step by step

### Step 1 — The founder's clarification (input)
The founder stated, via `Adjustments.txt` and chat:
- He is **Jhangir Hussain**, based in **Pakistan** — the project runs from Pakistan, not Finland. No Finland connection exists.
- **No company involvement at this stage**: no company details anywhere until roughly the first 30–100 users; Hawlton (his SECP-registered company) is a brand name only.
- Question asked: *is this adjustment the right call, or is there a better alternative?*

### Step 2 — The verdict on the adjustment (answered before any editing)
**Follow the adjustment — it is the correct, standard path**, with refinements:
1. Sign up for Paddle as **Individual** (CNIC/passport, proof of address, personal Payoneer/Wise payout). Paddle as merchant of record (MoR) removes every EU/US VAT and entity problem.
2. Site and Terms name the seller as **Jhangir Hussain personally**; "AppealDeck by Hawlton" is fine as branding, but no corporate entity is claimed as the contracting party.
3. Incorporate later at a **money threshold**, not just a user count (~consistently meaningful revenue or ~100 paying users); Paddle supports an entity change that carries customers over.
4. There is no cheaper honest alternative: Stripe and PayPal do not operate in Pakistan, so gateway-shopping below ~5% is a dead end.

### Step 3 — Audit of the pre-existing edit pass
The founder asked whether the earlier (pre-session) conversion pass was trustworthy or a sloppy find-and-replace. Audit method: `git diff` review, targeted searches for leftover Finland/partner/currency artifacts, spot-reads of load-bearing files. **Findings: the pass was ~90% genuine rewriting, but four find-replace casualties and one structural contradiction survived** (detailed in §3 below).

### Step 4 — The founder's decision that unlocked the fix
Asked directly: *is there a second person in this project?* Founder's answer: **"I'm solo — there is no one from Finland."** This resolved the identity contradiction: Jhangir Hussain IS the founder; the "external partner Jhangir in Karachi" that the research streams modeled never existed as a separate person.

### Step 5 — Verification before writing (live web checks, 29 Aug 2026)
- **Paddle**: supports sellers/payouts worldwide except sanctioned countries; Pakistan-based founders actively use it. → Primary rail confirmed viable.
- **Polar**: third-party reports say its Stripe-Connect-cross-border payout reaches Pakistan — credible but unverified with our own details. → Kept as warm fallback **with a mandatory verify-at-signup step**.
- **Dodo Payments**: MoR, 4% + 40¢, explicitly built for sellers in Pakistan-region countries. → Added as plan-C (application-ready only; no account until triggered).

### Step 6 — Execution
Two file renames (history-preserving `git mv`), core files rewritten directly, and the remaining ~24 files swept by three parallel review/edit agents under one rulebook (rules: partner→founder merge; renamed-link fixes; Polar kept + ladder wording; € → $ for our estimates only; Finnish services replaced; historical descriptions preserved; no blind find-replace).

### Step 7 — Verification and commit
Post-edit sweeps confirmed: zero references to the old filenames outside the deliberate decision-log history row; zero partner-framing patterns (`F+J`, "Jhangir's network", "if Jhangir goes quiet"); "Jhangir" mentions reduced 144 → 27, all of them founder-identity or historical records; every remaining € is a provider-quoted price. Committed as **`c3ebd00`** — "Convert playbook to solo founder (Pakistan) and repair payment-rail docs" (40 files, +598/−623). Not yet pushed at the time of that commit.

---

## 2. The settled decisions (now reflected everywhere)

| Topic | Settled state |
|---|---|
| Founder / entity | Jhangir Hussain, **solo**, individual seller, Pakistan. Hawlton = brand/trading name only. Incorporate at ~PKR 5–10M/yr retained profit or a material liability change (decision D4). |
| Partnership | **None exists or is needed.** `02-COLLABORATOR-POLICY.md` binds any FUTURE contractor/VA/expert before access (decision D5 amended; superseded-table row 14). |
| Payment rails | **Paddle primary** (5% + $0.50) → **Polar warm fallback** (5% + 50¢ free tier; Pakistan payout via Stripe Connect — verify at signup) → **Dodo Payments plan-C** (4% + 40¢). Stripe direct/PayPal impossible from Pakistan (decision D2 amended). |
| Paddle application | Individual; category "Digital products or SaaS" only; never "Human services" — human-in-loop review is internal QA bundled in the price, never a priced SKU. |
| Seller Central / BSA §19 access | Founder's own fresh Amazon Individual seller account (~1–2 weeks, free) and/or a design partner's read-only secondary-user invite with written consent (superseded-table row 6, solo version). |
| Night support coverage | Honest auto-reply + founder morning batch (US evening = PK night). A vetted VA restricted to approved canned responses is a future option under the collaborator policy. |
| Taxes | Customer-country VAT = Paddle's job. Founder's side: FBR income tax on MoR payouts, NTN, accountant call Week 1; PSEB/IT-export treatment is a later optimization. GDPR + EU withdrawal-right compliance KEPT — they apply because customers are in the EU. |
| Currency convention | Playbook cost estimates in USD; provider-quoted € prices (Polar €13 minimum, Hetzner €4.50/mo, Paddle €-quoted fees) stay as quoted. |

---

## 3. Defects found in the earlier pass — and repaired

1. **`02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md` §3 (the worst one):** the old "Polar setup (warm fallback)" section had every "Polar" word-swapped to "Paddle", producing a section where Paddle was its own fallback, carrying Polar's pricing ("Pro $20/mo at 3.8% + 40¢" — no such Paddle tier exists). → Restored as a correct Polar section from git history, adapted for Pakistan, Dodo plan-C added.
2. **`00-DECISION/03-GATES-AND-KILL-CRITERIA.md` check 5:** clobbered into an exact duplicate of check 3 ("Paddle application submitted" twice), orphaning the K1/K13 kill-criteria references to a warm-fallback check. → Rebuilt as the Polar warm-fallback check.
3. **`06-OPERATIONS/04-PAYMENT-OPERATIONS.md`:** the 0.4% chargeback-review threshold was re-attributed to Paddle; it is Polar's. → Corrected (kept as the binding tightest-rail threshold).
4. **`04-PHASE-3-LAUNCH/04-LAUNCH-DAY-CHECKLIST.md` W4:** stale "Vercel + Supabase alerts" vs. the settled Cloudflare Pages + Supabase stack. → Corrected.
5. **Structural contradiction (not a find-replace bug):** `08-TEAM/01-ROLES-AND-OWNERS.md` simultaneously defined the Founder as "Jhangir Hussain (solo, Pakistan)" and Jhangir as a separate "prospective partner" with an unverified-expertise caveat. → Resolved by the founder's solo statement; four-role model collapsed to three (Founder / AI assistant / External).

---

## 4. Every change, grouped

### Renames (git history preserved)
- `01-PHASE-0-BLOCKERS/02-PARTNERSHIP-AGREEMENT.md` → **`02-COLLABORATOR-POLICY.md`** — fully rewritten: do-not-share list, 10-clause agreement checklist, template-vs-lawyer routes, Pakistan-enforceability reality check, solo §19-access ladder, trigger-based action items. $0 and non-blocking at Phase 0.
- `01-PHASE-0-BLOCKERS/03-BUSINESS-REGISTRATION-FINLAND.md` → **`03-INDIVIDUAL-SELLER-SETUP.md`** — content was already Pakistan; the stale filename and every inbound link fixed.

### Core files edited directly
- `MASTER-CHECKLIST.md` — owner legend (F = Founder, solo); item 2 → collaborator policy; item 7 → Paddle + Polar (verify PK payout) + Dodo plan-C; item 11 → founder retrieves §19; items 12/30/32 owners; Gate-1 summary; item 36 → Pakistan tax framing; € → $.
- `00-DECISION/01-VERDICT.md` — GO-condition 2 rewritten (no partnership agreement; fallback ladder); §19-read owner; kill criterion 1 names Polar/Dodo; € → $.
- `00-DECISION/02-DECISION-LOG.md` — D2 amended (fallback ladder); D5 amended (collaborator policy); superseded row 6 (solo access ladder); **new superseded row 14** (the solo-founder correction, dated, with rationale); € → $ in current prescriptions.
- `08-TEAM/01-ROLES-AND-OWNERS.md` — three-role model; §1.3 rebuilt as "Access and expertise paths (solo founder)"; decision-rights, time-budget, burnout-guardrail, and action-item rows de-partnered; night coverage = auto-reply + morning batch.
- `README.md` — three-owner table; setup budget corrected ($20–50 lean path; the $200 agreement line item removed); € → $.
- `02-PHASE-1-FOUNDATION/03-PAYMENTS-SETUP.md` — §3 repaired (see §3.1 above).

### Swept by agents (same rulebook)
- `00-DECISION/03-GATES-AND-KILL-CRITERIA.md`, `01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md`, `02-PHASE-1-FOUNDATION/01/02/04/05`, `03-PHASE-2-BUILD/01/02/03`, `04-PHASE-3-LAUNCH/01/02/03/04`, `05-PHASE-4-GROWTH/01/02` (03/04 needed nothing), `06-OPERATIONS/01/02/03/04`, `07-REFERENCE/03/04/05/06/07/08`, `08-TEAM/02/03`. Changes per file: partner→founder owner merges, renamed-link fixes, fallback-ladder wording, € → $ (our estimates), Pakistan tax framing, night-triage rewrites, risk-register row R-11 closed ("solo founder — no partner dependency exists") with numbering preserved, source-index historical descriptions annotated "(superseded — solo founder)".
- Finnish services replaced: `tietosuojatyokalu.fi` → free Article 30 ROPA spreadsheet template; `If.fi` E&O quotes → Pakistani professional-indemnity insurers (EFU/Jubilee — software-E&O availability unverified) + at least one international broker.

### Deliberately KEPT (do not "fix" these later)
- All GDPR and EU consumer-withdrawal content — applies because customers are in the EU, regardless of seller location.
- Polar as warm fallback and every accurate "Paddle/Polar" MoR mention; industry chargeback thresholds (0.4% Polar / 0.5% internal / 0.75% Stripe-monitoring / 1.5% Visa VAMP).
- Provider-quoted € prices; `03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md` untouched (superseded historical spec, banner already correct); historical research descriptions in the source index; "Jhangir Hussain" wherever it names the founder/seller identity.

---

## 5. Open items after this session

| # | Item | Owner | When |
|---|---|---|---|
| 1 | Verify **Polar's Pakistan payout** inside the actual Polar/Stripe-Connect signup flow before counting the warm fallback as real; if it fails, promote Dodo to warm fallback and log it | Founder | Week 1, with the Polar account |
| 2 | Re-verify **Dodo Payments** terms (4% + 40¢, PK payout) at application time — only if plan-C ever triggers | Founder | On trigger |
| 3 | Gather CNIC/passport + proof of address; open personal **Payoneer or Wise**; apply to **Paddle as Individual** ("Digital products or SaaS" only) | Founder | Day 1–3 / Week 1 |
| 4 | Accountant call: FBR treatment of MoR payouts, NTN, record-keeping | Founder | Week 1–2 |
| 5 | E&O insurance quotes: PK insurers (EFU/Jubilee — unverified for software E&O) + one international broker | Founder | Week 3 |
| 6 | `07-REFERENCE/05-RESOURCE-STACK-AND-BUDGET.md` §2.1 subtotals were **recomputed** during the sweep (≈$1,515 / ≈$4,535 worst-case) — founder should sanity-check the arithmetic once | Founder | At the §2.3 allocation decision |
| 7 | Push commit `c3ebd00` (and this file's commit) to GitHub — local only until pushed | Founder / AI on request | Anytime |

---

## 6. Commit record

- `c3ebd00` — *Convert playbook to solo founder (Pakistan) and repair payment-rail docs* — 40 files, +598/−623 (29 Aug 2026).
- This file (`adjustments-applied.md`) is committed separately, immediately after its creation.

**For future AI sessions:** treat this file + decision-log rows D2/D4/D5 (amended) and §3 rows 6/14 as the authority on founder identity and payment rails. Do not resurrect the "external partner" framing, do not remove Polar wholesale, and do not re-litigate the individual-seller decision — the triggers for revisiting incorporation are written in `01-PHASE-0-BLOCKERS/03-INDIVIDUAL-SELLER-SETUP.md` §1.

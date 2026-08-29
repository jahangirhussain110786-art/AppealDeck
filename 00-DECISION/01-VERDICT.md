# 01-VERDICT — Should AppealDeck be executed, and can it succeed?

**Why this file exists / when to use it:** This is the definitive, evidence-backed answer to "do we build this?" — written so that nobody has to re-run the research to trust the decision. Read it once before doing anything in this playbook; return to it only if a kill criterion in `03-GATES-AND-KILL-CRITERIA.md` fires or a core premise below is falsified. The full decision trail (who decided what, when, and what was overturned) lives in `02-DECISION-LOG.md`.

**Product in one sentence:** AppealDeck helps suspended Amazon sellers by decoding their deactivation notice for free, drafting an AI-generated Plan of Action (POA — the structured appeal document Amazon requires: root cause / immediate fix / preventive measures), tracking appeal deadlines, and keeping an encrypted, local-first case vault — sold as a $199 one-time "Appeal Pass" per case, against human consultants charging a verified $600–$5,000 per case.

---

## (a) The verdict

**CONDITIONAL GO.** The demand is real and independently verified (a large, ongoing, panic-driven spend on Amazon suspension appeals, anchored by consultants at $1,495–$5,000 per case), the technology stack is confirmed viable at near-zero marginal cost, and the total cash required is within the founder's ~$1,100–2,300 budget because an AI coding assistant is the executor. But three of the original research's premises were corrected on 25 Aug 2026 — the Chrome Web Store (CWS) category is no longer empty, Amazon's Business Solutions Agreement (BSA) §19 "Agent Policy" (effective 4 Mar 2026) makes any Seller-Central-page-reading feature a genuine compliance risk, and the software price band is squeezed from below by $5–49/month competitors — so the GO stands **only** on the conditions in section (d): a web-first paste-mode compliance spine, Phase-0 blockers closed before build, honest positioning with zero outcome claims, and the three go/no-go gates enforced without exception. [source: The Second Opinion.md; APPEALDECK_READINESS_AUDIT.md; APPEALDECK — R&D MASTER REPORT.md; VERIFICATIONS.md]

---

## (b) Evidence table — every core premise, tested

All verdicts below reflect independent live-web verification performed 25 Aug 2026 by this playbook's authors [source: VERIFICATIONS.md], which overrides older documents where they conflict.

| # | Business premise | Verdict | Evidence (source + date) |
|---|---|---|---|
| 1 | Suspensions are a large, ongoing problem with panic-driven demand | **CONFIRMED** | SmartScout 2025 survey: 35% of sellers suspended in 2024 (second survey: 22%); continuous 2026 Seller Central forum threads; Seattle Times/Bloomberg investigation 28 Jun 2026 (appeals take weeks, funds frozen). No official Amazon statistics exist. |
| 2 | Sellers pay consultants $500–$3,000/case (the price anchor) | **CONFIRMED — even understated** | Verified public prices 25 Aug 2026: ecommerceChris $1,500 ASIN / $4,000–5,000 account; The Appeal Guru $1,495 / $2,495 (24h priority — a +$1,000 "panic premium"); Thompson & Holt ~$600 (third-party cited); Riverbend & Amazon Sellers Lawyer quote-only, user-reported $2,250–4,000. |
| 3 | The market is scam-scarred → a trust wedge exists | **CONFIRMED — cuts both ways** | DOJ bribery indictments (2020) with 2022–23 sentencings; active "shadow bribery market" per Seattle Times/Bloomberg Jun 2026. Caveat: a new $199 tool faces the same skepticism it exploits — transparent pricing, no success-rate claims, no insider framing are mandatory. |
| 4 | "Zero Chrome Web Store competition" | **CORRECTED — refuted 25 Aug 2026** | SellerForge's "Forge Companion" extension (3.7★, free 25 msgs/wk or $5/mo) already does violation triage + "draft my response" + POA help inside Seller Central; plus Listing Guard and Amazon Wholesale Reseller Toolkit (both 0 reviews) name appeals. No dedicated full-deactivation→POA→deadline-tracker extension exists, but the category is occupied. |
| 5 | An extension reading Seller Central pages is policy-safe | **CORRECTED — elevated risk** | BSA §19 "Agent Policy" effective 4 Mar 2026; third-party analyses read it as prohibiting browser automation/screen-scraping outside registered SP-API (Selling Partner API) apps; Helium 10 killed its Seller Central automation extension 11 Jun 2026. Primary policy text sits behind seller login — still unread. Countervailing: Helium 10/Jungle Scout content scripts and Forge Companion still run openly; Ninth Circuit Perplexity ruling (Aug 2026) holds the user, not the developer, "accesses". |
| 6 | Panic-query search volume is high | **PARTIAL — unverified** | No public keyword-volume data exists. Strong indirect signals: 12+ firms SEO-target the queries; published 24-hour panic-premium tiers; documented 2020 mass-suspension demand surge (Thompson & Holt). One hour in Google Keyword Planner/Ahrefs required before any SEO/ads spend. |
| 7 | The tech stack is viable at near-zero cost | **CONFIRMED** | Chrome Prompt API (Gemini Nano) GA for extensions since Chrome 138 (steep hardware gate: desktop-only, 22 GB free disk, >4 GB VRAM or 16 GB RAM); @crxjs/vite-plugin revived (v2.7.1, Jul 2026); CWS allows external checkout with disclosure; Gemini Flash paid tier ~$0.02 per full case. |
| 8 | A payments path exists for an individual seller | **CONFIRMED — with a rail change** | Lemon Squeezy is sunsetting (do not build on it). Paddle: flat 5% + $0.50, deepest tax coverage. Polar.sh: free 5% + 50¢, Pro $20/mo 3.8% + 40¢ — cheapest at low volume. Both onboard individual sellers; Merchant of Record (MoR) genuinely removes customer-country VAT. Constraint: MoR acceptable-use policies require automated software output — human-service tiers (Expert Review) are not MoR-eligible. |
| 9 | Company formation is fast and cheap | **CONFIRMED** | Individual seller setup is immediate — CNIC/passport + proof of address + personal payout account (Payoneer or Wise). No SECP incorporation needed at this stage. |
| 10 | UPL (unauthorized practice of law) risk is manageable | **CONFIRMED — low, if positioned correctly** | No precedent of any UPL action against non-lawyer Amazon appeal consultants in a decade-old open industry; attorney-marketing sites overstate. Low risk **if**: software + document-preparation positioning, refuse IP-dispute/arbitration cases (route to lawyers), not-legal-advice disclaimers. |
| 11 | $199/case is a defensible price | **PARTIAL — squeezed** | SellerForge $49/mo unlimited appeals + free no-login POA generator; AppealsPro.ai free decoder + $79.99/$199 per month; AppealAI $199/**month**; AppealPath $11/POA one-shot. $199/case must be defended by outcome quality + depth + no-subscription framing; a price test at $99/$149/$199 in the first ~20 sales is a legitimate experiment. |
| 12 | Amazon itself won't compete on this problem | **CORRECTED — partial pre-emption** | Account Health Assurance (AHA — free, for Professional sellers with Account Health Rating (AHR) ≥250: specialist calls + 72h window before deactivation) plus "Amelia" AI assistant in US Seller Central (explains violations; does NOT write POAs). Addressable core = already-deactivated sellers + non-AHA sellers (new, Individual-plan, low-AHR, Section 3/fraud-flagged). |

---

## (c) What changed since the original research — the seven corrections

The Panic Ledger (Round 2, 24 Aug 2026) made the original case. Rounds 3–5 plus independent verification on 25 Aug 2026 corrected it in seven places. The playbook is written against the corrected picture; anyone quoting the older documents on these points is quoting stale facts.

1. **Competition is no longer zero.** The CWS category is occupied (Forge Companion et al., premise #4 above). Positioning is now **depth** — full case management, deadlines, evidence vault, per-case one-time pricing, local-first privacy — never "first" or "only". "Zero competition" is retired from all copy.
2. **BSA §19 / Agent Policy risk is higher than the early documents treated it.** Resolution: (a) web decoder + paste-mode is the **primary architecture and compliance spine** (zero page access, full functionality); (b) extension DOM-harvest (reading the notice off the page) is a convenience layer gated on reading the actual §19 text (founder — via own seller account or a design partner's read-only invite, before milestone M-3) — de-scoped to a paste-only extension if the read is bad; (c) the POA-textarea injector is the riskiest feature and ships **last or never**; (d) never any automation or auto-submit.
3. **Amazon pre-empts part of the value prop** (AHA + Amelia, premise #12). Decode-a-warning value is partly commoditized; decode-deactivation + POA + deadlines + vault is not.
4. **Cloud-first LLM, not Nano-first.** Cloud Gemini Flash (paid tier only — the free tier trains on user data and is dev-only) is the primary quality path for the paid POA; on-device Gemini Nano is the free/private/instant path for triage, classification, and extraction when hardware allows. Never assume Nano exists on a user's machine.
5. **Hosting is not $0 through launch.** Vercel Hobby is contractually non-commercial. Launch stack: Vercel Pro $20/mo + Supabase Pro $25/mo (= $45/mo), or Cloudflare Pages/Workers free for the static decoder + Hetzner CX22 €4.50/mo alternative.
6. **Price squeeze from below** (premise #11). The $199 defense is depth and one-time framing, and the price is testable, not sacred.
7. **Search volumes are unverified.** No SEO or ads money moves until one hour of Keyword Planner/Ahrefs work produces real volumes (owner: Founder, before any acquisition spend).

---

## (d) Conditions attached to the GO

The GO is void if these are ignored. Each condition maps to enforcement machinery elsewhere in the playbook.

- [ ] **1. Web-first compliance spine.** Build order is fixed: platform-agnostic TypeScript core (parse→classify→compose→critic) weeks 1–4 → **web decoder + $199 checkout live week 4–5 (first revenue surface)** → MV3 (Manifest V3, Chrome's extension platform) extension weeks 4–8 with paste-mode primary, DOM-harvest gated on the §19 read, injector last-or-never. **Owner:** AI assistant (build) + Founder (sequencing discipline) · **Cost:** included in build · **Deadline:** weeks 1–8 · **Blocks:** first revenue, CWS listing. See `../03-PHASE-2-BUILD/`.
- [ ] **2. Blockers closed before build.** Leaked Supabase credentials rotated; collaborator policy adopted (solo founder — no partnership agreement exists; the policy binds before any future contractor gets access); individual seller setup complete (CNIC/passport + proof of address + payout account); Paddle application **and** the Polar warm fallback (Pakistan payout verified at signup; Dodo Payments plan-C) submitted/opened Week 1 behind a live site + legal pages. **Owner:** Founder · **Cost:** ~$10–30 (domain) · **Deadline:** Day 1–Week 1 · **Blocks:** everything. See `../01-PHASE-0-BLOCKERS/`.
- [ ] **3. Honest positioning — the ethics spine.** The word "guarantee" appears nowhere user-facing (grep gate = 0 hits); honest-expectations card before purchase (most first appeals fail, even with $3k lawyers); severity gating (forged-docs/fraud/child-safety cases are never sold a Pass — routed to a professional-help screen); read-only always; local-first always; win rates published only from opt-in outcome data, else none. **Owner:** Founder + AI assistant · **Cost:** $0 · **Deadline:** continuous from Day 1 · **Blocks:** trust wedge, chargeback survival, MoR account health.
- [ ] **4. Gates enforced.** The three go/no-go gates and every kill criterion in `03-GATES-AND-KILL-CRITERIA.md` are binding, with a weekly decision review. Skipping a gate check is itself a decision-log event requiring written rationale. **Owner:** Founder · **Cost:** $0 · **Deadline:** continuous · **Blocks:** controlled failure instead of catastrophic failure.

---

## (e) Honest success outlook

**The only planning-grade revenue figure is the conservative case: roughly $17k gross in year 1.** Larger figures that circulate in the source documents — base ~$115k, upside ~$330k, or the illustrative P&L of ~$1,484 gross/month at 100 users with ~80% margin — are **illustrative arithmetic without an acquisition model** and must never drive spending decisions or appear in external materials. [source: The Second Opinion.md — pricing ruling; APPEALDECK — R&D MASTER REPORT.md — financial model]

**What success realistically looks like:**
- North-star metric: **paid Appeal Passes per week**, fed by the funnel decoder sessions → decode completed → intake started → purchase → (opt-in) outcome.
- Year 1 success = a live, compliant product; a repeatable trickle of paid Passes from organic panic-moment traffic; honest opt-in outcome data accumulating; zero MoR terminations, zero viral trust disasters; the founder still solvent and functioning. Revenue near the conservative ~$17k gross figure is a **win**, not a disappointment — it validates the wedge and funds the expansion ladder (AdVerdict for Google Ads, LetterShield for accessibility demand letters).
- Upside, if it comes, comes from decoder distribution — the highest-leverage variable — not from price increases or feature volume.

**The failure modes (each has a pre-agreed response in `03-GATES-AND-KILL-CRITERIA.md` and `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`):**

| Failure mode | Why it kills | Likelihood (judgment) |
|---|---|---|
| Chargeback ratio breaches MoR thresholds (Stripe 0.75%, Visa VAMP 1.5%, Polar 0.4%) | An MoR termination is existential — no rails, no revenue | Moderate–High if refunds are slow |
| Viral "this tool got me banned" thread | Destroys the only distribution channel (trust-scarce communities) | Moderate |
| SellerForge copies the free decoder and out-markets launch | Erases the wedge before depth features ship | Moderate–High (their timeline: weeks, not months) |
| §19 read comes back bad for all extension surfaces | Kills the extension convenience layer (web paste-mode survives regardless) | Moderate |
| Solo-founder burnout in the launch support wave | Support stops → reputation dies in days | High if support infrastructure is skipped |
| Price squeeze compresses $199 below viability | Revenue per case falls toward $49-subscription economics | Moderate |

**Why risk/reward still favors GO:** the build cost is near zero in cash (AI-executed; total cash exposure ~$1,100–2,300 plus an optional ~$500–1,200 recruitment program), the demand and price anchor are independently verified, the compliance spine (web paste-mode) is immune to the worst regulatory outcome, and every major failure mode has a cheap pre-agreed counter. The downside is bounded at a few thousand dollars and eight weeks; the upside is a real, durable niche business plus a reusable enforcement-panic engine.

⚠ FOUNDER-DECISION: whether to run the $99/$149/$199 price test in the first ~20 sales, and when to stop it. The evidence supports testing; only the founder can weigh anchor-erosion risk against conversion data.

---

## (f) What would flip this to NO-GO

The GO is conditional, and the conditions are enforced by kill criteria — see `03-GATES-AND-KILL-CRITERIA.md` for the full list with thresholds and pre-agreed responses. In summary, this project stops (pause or terminate, per that file) if:

1. **No payment rail:** Paddle rejects outright AND neither fallback (Polar, or Dodo Payments as plan-C — Stripe direct is unavailable to Pakistan-resident sellers) is operational within 48h of that rejection (Gate 1 kill).
2. **Compliance floor collapses:** the §19 full-text read prohibits even paste-mode extension surfaces AND CWS rejects the listing on policy grounds — leaving the web app as the only product — AND the web decoder demand test fails (thresholds in the gates file).
3. **The market says no:** refund rate >15% in the first 10 sales and diagnosis finds no fixable cause (Gate 3 kill).
4. **The economics say no:** cloud cost per decode exceeds $0.10 and cannot be brought down (Gate 3 kill), or chargeback ratio breaches an MoR threshold and cannot be corrected within the processor's cure window.
5. **Insurability fails:** E&O (errors & omissions) insurance is unavailable at any price and liability cannot be restructured (Gate 2 kill — defers launch, and flips to NO-GO if unresolvable).
6. **Acquisition is a black hole:** the first 100 users take >200 hours of community engagement with no conversion signal — distribution strategy is reassessed, and if no viable channel exists, the project winds down honestly.

Absent these triggers, the decision is settled. Do not re-litigate it — execute `../01-PHASE-0-BLOCKERS/` next.

---

## Definition of done

- [ ] Every team member has read this file and can state the verdict, the four GO conditions, and at least three failure modes without reference.
- [ ] No planning or marketing document anywhere in the repo contradicts the seven corrections in section (c).
- [ ] The conservative ~$17k year-1 figure is the only revenue number used in any budget or runway calculation.
- [ ] The four condition checkboxes in section (d) are either ticked or have a dated, written exception rationale in `02-DECISION-LOG.md`.
- [ ] The kill criteria in `03-GATES-AND-KILL-CRITERIA.md` are wired into the weekly decision review (owner: Founder).

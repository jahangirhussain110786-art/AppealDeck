# Web Decoder + Paid Composer Launch (Week 4–5) — the first shipped product surface

**Why this file exists / when to use it:** AppealDeck's first revenue surface is not the Chrome extension — it is a web page. This file specifies everything needed to put the free notice decoder and the $199 paid Plan-of-Action composer live on the AppealDeck domain in week 4–5, before the extension exists in any store. Use it from week 3 (prep) through week 5 (go-live) and for the week 5–8 metrics review. The extension track runs in parallel (see `./02-CHROME-WEB-STORE-SUBMISSION.md`); nothing in this file waits on it.

**Terms used here:** POA = Plan of Action, the appeal document Amazon requires (Root Cause → Corrective Actions → Preventive Measures). CWS = Chrome Web Store. MoR = Merchant of Record (Paddle/Polar — they are the legal seller and handle customer-country VAT). Appeal Pass = the $199 one-time, per-case paid product. "Gated types" = violation classes we refuse to sell for (forged documents, fraud, child-safety).

---

## 1. Why the web surface ships first (settled — do not reopen)

1. **Revenue before the store.** CWS review is expected to go manual (16 host permissions) and can stretch from days to weeks. The web checkout has no review gate — first paid Appeal Pass is possible in week 4–5. [source: The Second Opinion.md, build-order ruling]
2. **It de-risks the Amazon Agent Policy question entirely.** Amazon's Business Solutions Agreement §19 "Agent Policy" (effective 4 Mar 2026) restricts automated tools touching Seller Central. A paste-mode web page reads **no Amazon page, ever** — the seller pastes their own notice text. Zero page access = zero §19 exposure, full product functionality. [source: The Second Opinion.md, discovery 2]
3. **It catches mobile panic-searchers.** Chrome on Android has no extensions; a large share of suspended sellers search from a phone. The web decoder converts them; the extension never could. [source: APPEALDECK — R&D MASTER REPORT.md, persona P3]

## 2. Scope

### 2.1 Free decoder (`appealdeck.app/decode`)

| Element | Spec |
|---|---|
| Input | Paste notice text (or upload .txt/.html). No login, no email wall. |
| Engine | The platform-agnostic TypeScript core built weeks 1–4 (parse → classify → compose → critic), compiled for web. Deterministic regex/rule extraction runs first; LLM assist is server-side and rate-limited; on limit/ceiling, degrade gracefully to rules-only decode. |
| Output — type | Violation classification from the v1 taxonomy (ODR performance, Section 3 inauthentic, Section 3 IP complaint, listing-level, unknown). Confidence shown; below threshold → "Unknown" with decoded facts only, never a guess. |
| Output — severity | Listing-level / account-level / terminal, plus the gated-type professional-help screen where applicable (§6). |
| Output — expectations | What Amazon expects in the appeal for this type (invoices, retractions, operational fixes…), in plain language. |
| Output — deadlines | The stated appeal window parsed from the notice text (never assume a constant number of days); funds-appeal eligibility date = deactivation + 60 days (post-Oct-2024 rule); funds-review checkpoint at +90 days flagged as "not automatic". Rendered as concrete dates; offered as a downloadable .ics calendar file. Ongoing tracking with alarms stays extension-exclusive. |
| Privacy | Notice text is processed for the decode and not retained server-side. State this on the page. |

### 2.2 Paid composer ($199 Appeal Pass, per case)

| Element | Spec |
|---|---|
| Flow | Decode result → "Draft my Plan of Action" → severity-gate check → honest-expectations card (§5) → MoR checkout with consumer withdrawal consent (§4) → license key → intake wizard → POA draft + critic pass → unlimited redrafts for this case → export (copy / print / PDF-via-print). |
| Intake wizard | Violation-specific question sets (max 12 questions, all skippable with "I don't have this"; skipped answers are honestly omitted, never fabricated). |
| LLM | Cloud Gemini Flash, **paid tier only**, called via our own backend — the API key never reaches the browser, and paid-tier data is not used for Google training (free tier is dev-only). Cost per full case ≈ $0.02 (verified Aug 2026). |
| Quality pass | Adversarial critic scores the draft 0–100 and lists fixes. Label it **"draft quality score"** in the UI — never "predicted approval" or any outcome prediction. |
| Data posture | Web v1 stores case data (intake answers, drafts) in **unencrypted** browser-local storage (localStorage/IndexedDB) on the user's own device — never transmitted to our servers; the backend holds only license/entitlement records and anonymous event counts. The encrypted vault is extension-exclusive at v1. Redrafts therefore require the same browser. Unlock-page copy must state this honestly, e.g.: "Your case data stays in this browser's local storage on your device — we never send it to or store it on our servers. It is not encrypted at rest here; the encrypted vault is an extension feature. Redrafts require this same browser." |
| Not in web v1 | Encrypted case vault, deadline alarms, in-page Seller Central panel, POA injector — extension-exclusive by design (they are the copy-resistant moat). No accounts/passwords in v1 — license key is the credential. |

## 3. Hosting (settled)

Vercel Hobby is contractually non-commercial — a checkout on it is a terms violation. The launch stack is:

| Component | Service | Cost |
|---|---|---|
| Static site (decoder page, composer app) | **Cloudflare Pages** (free tier) | $0/mo |
| All API work — MoR webhook receiver, `reason` LLM proxy, `verify-license` (Supabase Edge Functions) — plus Postgres (`licenses` table, telemetry counts) | **Supabase** (free tier at start → Pro from first sustained sales) | $0 → $25/mo |
| Fallback only — if porting the donor Express backend proves necessary at M-5; decided then by the AI assistant + Founder and logged (⚠ FOUNDER-DECISION only if it adds spend) | Vercel Pro — **not provisioned by default** | $20/mo (fallback only) |

Launch infrastructure cost: **$0–25/mo.** License keys are self-issued: MoR webhooks (Paddle primary, Polar fallback) land on a Supabase Edge Function that upserts the `licenses` table; a `verify-license` Edge Function serves the composer unlock. MoR retry behavior (Paddle retries webhooks 60 times over 3 days) plus idempotency covers Edge Function cold starts. [source: The Second Opinion.md, amendment 1]

## 4. Checkout + EU-withdrawal consent flow (legally load-bearing — implement exactly)

The consumer 14-day right of withdrawal applies to digital content sold to consumers. Delivering the POA immediately without the consent mechanics below makes "no refund" unenforceable and invites disputes. The compliant sequence:

1. Severity-gate check passes (§6) — gated classifications never reach this step.
2. Honest-expectations card shown and acknowledged (§5).
3. MoR checkout opens (Paddle overlay/redirect; if Paddle rejects, Polar is the warm fallback — verify its Pakistan payout via Stripe Connect cross-border at signup — and Dodo Payments is plan-C; see the Phase-1 payments setup in `../02-PHASE-1-FOUNDATION/`).
4. **Explicit prior consent, unticked by default:** "I request that AppealDeck begin delivering the digital service immediately, and I acknowledge that I lose my 14-day right of withdrawal once generation begins." Purchase is impossible without ticking it.
5. **Durable-medium confirmation:** the receipt/confirmation email restates the consent and the acknowledgment verbatim.
6. Regardless of the withdrawal mechanics, we voluntarily offer a **7-day no-questions refund** on every Pass, stated at checkout and in the receipt. Fast refunds are cheaper than chargebacks, and an MoR termination over dispute rates is existential (thresholds: Stripe 0.75%, Visa VAMP 1.5%, Polar 0.4%).

[source: APPEALDECK — R&D MASTER REPORT.md MR-12; The Second Opinion.md pricing ruling]

## 5. Honest-expectations card (shown before every purchase — required content)

- Most first appeals fail — including appeals written by professionals charging $600–$5,000 per case (public prices verified 25 Aug 2026; `../07-REFERENCE/01-MARKET-EVIDENCE.md` §1.2). Verified consultant prices are the anchor; we promise process quality, never outcomes.
- What genuinely improves odds: a complete, specific, honest POA grounded in your real facts and evidence; meeting the stated deadline; not resubmitting near-identical text.
- What you get for $199: violation-specific intake, a drafted POA in Amazon's expected format, an adversarial quality review, unlimited redrafts for this one case.
- 7-day no-questions refund. Not a law firm; not legal advice; you review and submit everything yourself.
- The word "guarantee" and any success-rate claim are **banned** from this card and everywhere else. We publish win rates only if/when our own opt-in outcome data exists.

## 6. Severity gating — live from day one, enforced server-side

- Gated types: forged-document allegations, fraud, child-safety. These get a professional-help screen (what professionals handle better, attorney-referral note, escalation-packet guidance) instead of a buy button.
- **Enforcement is server-side, not just UI:** the checkout-session/unlock endpoint refuses to issue a Pass for a case whose classification is gated. A user editing the page's JavaScript must still be blocked.
- Classification override: users may correct a wrong classification (misclassification happens), but overriding *into* a purchasable type from a gated decode requires re-running the decode on the notice text — the gate re-evaluates.

## 7. Analytics (funnel per decision D10)

Stack: Plausible or Umami (EU-hosted) for page analytics + backend event counters in Supabase. **No notice content, no seller identity, ever, in any event.** Anonymous device/session id only.

| Event | Props | Funnel stage |
|---|---|---|
| `decoder_session` | source (seo/community/direct) | Top |
| `decode_completed` | violation type, confidence bucket, rules-only? | Decode |
| `gated_screen_shown` | type | (exit path — measure it) |
| `intake_started` | type | Intent |
| `checkout_opened` | — | Intent |
| `pass_purchased` | — (amount lives in MoR dashboard) | Revenue |
| `poa_generated` | regen count, critic score bucket | Delivery |
| `refund_requested` | days since purchase | Health |
| `outcome_reported` | accepted/rejected/no-response (opt-in only) | Truth |

`pass_purchased` is the canonical purchase event per `../06-OPERATIONS/03-ANALYTICS-AND-METRICS.md`. Web-only events in this table (e.g. `gated_screen_shown`, `poa_generated`, `refund_requested`) are supplements to the canonical six defined there — never replacements.

North-star metric: **paid Appeal Passes per week.** Weekly founder review reads this funnel top to bottom.

## 8. Initial SEO page set (the desperate queries)

Search volumes for these queries are **(unverified)** — no public data exists; spend one hour in Google Keyword Planner before any paid spend or heavy content investment (action 6). Target long-tail first; the head terms are owned by attorney lead-gen. [source: APPEALDECK_DISTRIBUTION_CHANNEL_MECHANICS.md §1.4]

| Page | Target query family | Note |
|---|---|---|
| `/decode` | "amazon suspension notice decoder", "what type of amazon suspension do I have" | The tool IS the SEO asset — a free interactive page beats a 2,000-word blog post on engagement. |
| `/guides/account-deactivated` | "amazon account deactivated what to do" | Lowest estimated difficulty of the head terms (estimate). Calm, step-ordered, links to decoder. |
| `/guides/section-3` | "amazon section 3 suspension" | Under-served SERP; our corrected deadline model (stated-window parsing, funds appeal +60d) is differentiating content. |
| `/guides/poa-format` | "amazon plan of action format/requirements" | Show the exact three-heading structure; decoder CTA. |
| `/guides/funds-hold` | "amazon funds hold appeal", "disbursement appeal" | Cover the Oct-2024 change: funds appeal eligible at +60 days; holds never auto-release. Most competitor content is stale here. |

Rules for every page: no "guarantee", no win rates, no invented volumes, honest tone, decoder CTA above the fold, trader/contact details in footer (also needed for Paddle and store compliance).

## 9. Actions

- [ ] **1.** Compile the shared TS core for web; stand up `/decode` (free decoder, full spec §2.1) on staging. — **Owner:** AI assistant · **Cost:** $0 (labor) · **Deadline:** Week 4 · **Blocks:** everything below
- [ ] **2.** Provision Cloudflare Pages (free, static site) + Supabase (free tier at start → Pro from first sustained sales); wire the `licenses` table and the Supabase Edge Functions: MoR webhook receiver (idempotent by event id), `verify-license`, `reason` LLM proxy. Vercel Pro is **not** provisioned — it is a fallback only if porting the donor Express backend proves necessary at M-5, decided then by the AI assistant + Founder and logged. — **Owner:** AI assistant (Founder pays) · **Cost:** $0–25/mo · **Deadline:** Week 4 · **Blocks:** checkout, composer
- [ ] **3.** Implement cloud cost ceiling + circuit breaker + per-device rate limits on `reason`; verify graceful rules-only degradation. **Free decoder does not go public before this exists** (decision D9). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 4, before public decoder · **Blocks:** decoder go-live
- [ ] **4.** Build checkout flow with EU consent mechanics (§4) in MoR sandbox; verify the consent checkbox blocks purchase when unticked and the receipt email restates consent. — **Owner:** AI assistant + Founder (MoR dashboard) · **Cost:** $0 · **Deadline:** Week 4–5 · **Blocks:** composer go-live
- [ ] **5.** Implement server-side severity gating on the unlock endpoint + gated-type professional-help screen. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 4 · **Blocks:** composer go-live (hard requirement — gated types must never be sellable, day one)
- [ ] **6.** One hour in Google Keyword Planner (or an Ahrefs trial) on the §8 query families; record volumes/CPCs in the decision log; only then finalize SEO priorities. Scheduled Week 2 — before any SEO page is written — per `../05-PHASE-4-GROWTH/03-SEO-CONTENT-PLAN.md`. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** writing any SEO page; any SEO/ads spend
- [ ] **7.** Write and publish the 4 guide pages + `/decode` on-page SEO. — **Owner:** AI assistant drafts, Founder approves/publishes · **Cost:** $0 · **Deadline:** Weeks 4–6 (decoder page first) · **Blocks:** organic funnel
- [ ] **8.** Install Plausible/Umami + backend event counters; verify every §7 event fires; verify by network inspection that no payload contains notice text. — **Owner:** AI assistant · **Cost:** $0–50/mo · **Deadline:** Week 4 · **Blocks:** week-5 metrics review
- [ ] **9.** Run the pre-launch QA checklist (§10) end to end; fix everything red. — **Owner:** AI assistant executes, Founder verifies · **Cost:** $0 · **Deadline:** Week 4–5 · **Blocks:** go-live
- [ ] **10.** Go-live sequence (§11). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 4 (decoder) / Week 5 (composer) · **Blocks:** first revenue
- [ ] **11.** ⚠ FOUNDER-DECISION — Price test: run $99 / $149 / $199 across the first ~20 sales, or hold $199 fixed. The $199 anchor is defended by verified consultant prices ($600–$5,000 per case, public prices verified 25 Aug 2026 — `../07-REFERENCE/01-MARKET-EVIDENCE.md` §1.2), but the SaaS field is squeezed from below (a competitor sells $199/**month**; another sells $11 one-shot drafts). Testing is legitimate; the founder picks the experiment design and the floor price before composer go-live. — **Owner:** Founder · **Cost:** $0 (foregone revenue only) · **Deadline:** before Week 5 composer go-live · **Blocks:** checkout price configuration

## 10. Pre-launch QA checklist (all must pass; Owner: AI assistant executes, Founder verifies; Cost $0; Deadline week 4–5; Blocks go-live)

- [ ] Entire fixture corpus decodes correctly on the **web build** (same expected.json as the extension tests); paste-mode text and file-upload produce identical results.
- [ ] Adversarial fixtures behave: a shipping notification classifies Unknown; garbage input produces a calm "this doesn't look like an enforcement notice" state, not an error.
- [ ] Deadline math: stated-window parsing wins over any default; ambiguous window → shorter figure + "verify in your notice" flag; funds-appeal date = +60d; .ics downloads open correctly.
- [ ] Gated classification → checkout attempt via forged client request is refused server-side (test with curl, not just the UI).
- [ ] EU consent checkbox: unticked blocks purchase; receipt email contains the durable-medium confirmation text.
- [ ] MoR sandbox: purchase → webhook → license row → unlock → POA generated → redraft works; refund in sandbox revokes cleanly; webhook handler is idempotent (replay the same event id).
- [ ] Rate limits and the cloud circuit breaker trip under a simulated spike; decoder degrades to rules-only and says so honestly in the UI.
- [ ] `grep -ri "guarantee"` = 0 hits across site source and all page copy.
- [ ] No outbound request contains notice text except the consented `reason` call (verify in the network inspector); free-decode LLM assist payloads contain only what the disclosure says.
- [ ] Privacy policy, terms (not-legal-advice disclaimer, refund policy), and trader/contact details linked in the footer of every page.
- [ ] Mobile rendering: decode → result → checkout completes on a real phone (panic searchers are on phones).
- [ ] Critic pass on 3 fixture cases produces a POA under 700 words with the three canonical headings and zero fabricated facts (diff against fixture facts).

## 11. Launch checklist (go-live day)

- [ ] DNS/SSL live on the production domain; staging noindex removed on production only.
- [ ] Decoder public (week 4). Composer public only after actions 4, 5, 9, 11 complete (week 4–5).
- [ ] MoR switched from sandbox to live; one real $199 test purchase by the founder end-to-end (buy → key → draft → refund via the 7-day path). This doubles as Gate-3 evidence (`../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`).
- [ ] Analytics dashboards bookmarked; MoR dashboard bookmarked; error alerting (Cloudflare + Supabase) pointed at founder email.
- [ ] Community presence continues per `../02-PHASE-1-FOUNDATION/05-COMMUNITY-PRESENCE.md` — the decoder link may now be mentioned where contextually helpful; no launch "announcement" posts yet (that is the M-8 moment, see `./04-LAUNCH-DAY-CHECKLIST.md`).

## 12. Success metrics, weeks 5–8

All targets are goals (estimate), not forecasts — we have no verified acquisition model. Read weekly, top of funnel to bottom.

| Metric | Source | Healthy signal | Alarm |
|---|---|---|---|
| Decoder sessions/week | Plausible/Umami | Growing week over week; community links visibly converting | Flat at near-zero by week 6 → distribution review |
| Decode completion rate | events | Most sessions that paste text get a result | High paste-abandon → UX or parser problem |
| Decode → intake started | events | Meaningful minority proceed | ~0% → value prop or price signal problem |
| Intake → purchase | events | First paid Pass within ~7 days of composer go-live (goal) | Zero paid Passes by week 6 → pricing/positioning review with the week-1–20 price test data |
| **Paid Appeal Passes/week (north star)** | MoR + events | Existing and growing by week 8 | — |
| Refund rate | MoR | Under the Gate-3 kill line: ≤15% of first 10 sales | >15% → pause marketing, diagnose (kill criterion) |
| Chargebacks | MoR | Zero | Any chargeback in the first weeks → immediate case review |
| Cloud cost per decode | backend | ≤ $0.10 | Above → tighten limits before scaling (kill criterion) |

## Definition of done

- [ ] Free decoder publicly live on the production domain, rules-only degradation proven, cost ceiling live (week 4).
- [ ] Paid composer live with EU-compliant checkout, server-side severity gating, honest-expectations card, 7-day refund stated (week 4–5).
- [ ] Founder's own live test purchase completed and refunded cleanly.
- [ ] All §7 analytics events verified firing; weekly funnel review scheduled.
- [ ] 5 SEO pages live; keyword-volume hour done and logged.
- [ ] Price-test decision (action 11) recorded in the decision log.
- [ ] "guarantee" greps to zero across the site.

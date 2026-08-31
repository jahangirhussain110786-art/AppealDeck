# Analytics & Metrics — measurement from day one

**Why this file exists / when to use it:** Every kill criterion in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` needs a live number feeding it, and the weekly decision review has no inputs without instrumentation — so analytics is built Week 3–4 with the staging decoder and is live when the decoder goes public Week 4–5 (per D3), not after launch. This file fixes the north-star metric, the funnel event names (so the backend, the extension, and every report use identical vocabulary), the privacy-compliant tool stack, the weekly review template, and the decision thresholds each number is wired to. Use it when building instrumentation (M-3/M-4), at Gate-3 check 34, and every week thereafter.

**Terms:** North-star metric = the one number that best proxies the business working. Funnel = the ordered sequence of user steps from first visit to purchase. CWS = Chrome Web Store; its **Limited Use policy** (enforcement tightened 1 Aug 2026) restricts what user data an extension may collect and transmit to what is strictly necessary and prominently disclosed. Cookieless analytics = web analytics that need no consent banner because they set no cookies and store no personal data. MoR = Merchant of Record (Paddle/Polar). Nano = Gemini Nano, Chrome's built-in on-device AI. VAMP = Visa Acquirer Monitoring Program (the card network's chargeback-ratio regime). POA = Plan of Action. M-1…M-8 = build-plan milestones.

---

## 1. North star and funnel (decision D10 — settled)

**North-star metric: paid Appeal Passes per week.** Not installs, not decoder sessions, not sign-ups — those are inputs. One number, reviewed weekly, trend over level.

**The funnel, with canonical event names** (use these strings verbatim in code, sheets, and conversation — renaming events later poisons every historical comparison):

| Order | Event name | Fires when | Where counted |
|---|---|---|---|
| 1 | `decoder_session` | A user starts a decode (web decoder or extension) | Backend counter (web); opt-in telemetry (extension) |
| 2 | `decode_completed` | A classification result is shown | Same |
| 3 | `intake_started` | The paid-intake wizard is opened | Same |
| 4 | `checkout_opened` | The MoR checkout is launched | Backend (checkout link redirect) |
| 5 | `pass_purchased` | MoR webhook confirms the transaction | Backend (webhook handler — the source of truth) |
| 6 | `outcome_reported` (opt-in) | A user voluntarily reports their appeal outcome | Backend, explicit opt-in only |

Two supporting series, tracked from the FIRST install (they answer standing unknowns):
- `nano_availability` — numeric/enum status of the on-device model check per device per session (available / downloadable / unavailable). This is the only data that will ever tell us what share of real users can run the free on-device path (unverified until measured — no public statistics exist).
- `decode_path` — which engine produced the decode (rules-only / nano / cloud), numeric counts only. Feeds the cloud-cost-per-decode threshold (§4).

Web-only supplemental events (`gated_screen_shown`, `poa_generated`, `refund_requested`) exist alongside the canonical six — supplements, never replacements: `pass_purchased` remains the canonical purchase event everywhere.

Conversion rates between adjacent funnel steps are the diagnostic layer: a broken step shows up as one collapsed ratio, not as a vague "sales are down."

- [ ] **1. Implement all six funnel events + the two supporting series in the backend counters; document each event's exact trigger point in the repo.** — **Owner:** AI assistant · **Cost:** included in build · **Deadline:** with the web decoder, Week 3–4 (M-3/M-4) · **Blocks:** Gate-3 check 34, the weekly review, every threshold in §4

---

## 2. Tool stack (privacy-first, near-$0)

### 2.1 Web analytics — Plausible or Umami (EU-hosted, cookieless)

For the landing page and web decoder traffic. Both are cookieless and EU-data-resident, so no consent banner, no GDPR transfer headache, and no GA4-style legal maintenance (Google Analytics was explicitly rejected: consent-banner overhead plus ongoing EU legal risk) [source: STREAM6_ANALYTICS_INSTRUMENTATION.md].

- **Either:** Plausible Cloud (EU-hosted, from ~$9/mo at low volume) — note the free self-hosted Community Edition LACKS funnels/goals, so if self-hosting, funnels must come from our backend counts anyway (they do — see below).
- **Or:** Umami — self-hosted free (MIT) on existing infra or a ~€4.50/mo Hetzner VPS, or Umami Cloud (~$9/mo).

The choice is operational, not strategic — pick whichever fits the hosting decision in `../02-PHASE-1-FOUNDATION/01-ACCOUNTS-AND-SERVICES.md` §2.7 and move on. The web tool only needs to answer "where does traffic come from and does it start a decode"; the funnel proper lives in backend counts.

### 2.2 Product events — backend counters (CWS Limited-Use compliant)

Product events from the extension go through our own backend, under rules that are non-negotiable because they are both a CWS policy requirement and the privacy positioning the product sells:

- **Opt-in only** — telemetry off until the user consents, prominently disclosed at first run and in the listing.
- **Anonymous device id** — random identifier, never linked to email/license server-side analytics tables.
- **Event names + numeric properties only** — counts, durations, enum codes.
- **NEVER notice content** — no notice text, no excerpts, no case details, no Seller Central page content ever appears in telemetry. (Cloud drafting is a separate, separately-consented data flow — see the privacy policy.)
- Backend web-decoder counts (server-side) need no extension consent because nothing identifies the user — keep it that way.

### 2.3 Error tracking + uptime (free tiers)

- **Error tracking:** Sentry free tier (5,000 errors/mo, 1 seat, 30-day retention). Caveat: a single mass-suspension spike can exhaust the monthly quota and then drops errors silently — during any traffic surge, check the quota meter daily. (One tracker only; a second tracker adds noise, not signal.)
- **Uptime:** Better Stack free tier (10 monitors, 3-min checks, status page on a custom domain) — it explicitly permits commercial use. **Do NOT use UptimeRobot's free tier: its terms prohibit commercial use (since Dec 2024)** — a monitoring account suspension during an outage is a self-inflicted crisis. Monitor: web decoder URL, backend API health endpoint, MoR webhook receiver, license-validation endpoint.

### 2.4 North-star dashboard — Google Sheets

One sheet, one row per week: the §3 numbers, filled at the weekly review. Free, unlimited, zero integration work. Upgrade to a paid dashboard tool only if the manual pull ever exceeds 15 minutes/week.

- [ ] **2. Install the web analytics tool on the landing + decoder pages; verify events register before any traffic is driven.** — **Owner:** Founder (account) + AI assistant (integration) · **Cost:** $0–9/mo · **Deadline:** built Week 3–4 with the staging decoder; live when the decoder goes public Week 4–5 (per D3 — Gate-3 check 34) · **Blocks:** funnel top, acquisition-channel decisions
- [ ] **3. Wire Sentry (backend + extension error boundaries) and Better Stack (4 monitors above + status page).** — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 5 (before payments go live) · **Blocks:** hotfix detection speed (`./02-CRISIS-PLAYBOOK.md` Scenario 4), payment-flow reliability
- [ ] **4. Build the extension telemetry consent flow to the §2.2 rules; have the founder verify by inspecting actual transmitted payloads (not the code) that no notice content can leave the device via telemetry.** — **Owner:** AI assistant (build) + Founder (verify) · **Cost:** included · **Deadline:** before CWS submission (Week 7) · **Blocks:** CWS Limited-Use compliance, privacy positioning credibility
- [ ] **5. Create the weekly north-star sheet with the §3 template as its columns.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 4 · **Blocks:** weekly review from Week 4 onward

---

## 3. The weekly review template

Feeds the fixed agenda of the weekly decision review in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md` §5. Fifteen minutes of pulling, fifteen of deciding.

**Numbers to pull (every week, same order):**

1. North star: paid Appeal Passes this week (and 4-week trend).
2. Funnel: counts for all six events + the five step-conversion ratios.
3. Money: refund rate (refunds ÷ sales, trailing 30d), chargeback ratio (MoR dashboard), cloud spend total and per-decode, cash runway.
4. Reliability: error count vs. Sentry quota, uptime %, Nano availability rate, decode-path split (rules/nano/cloud).
5. Support: tickets/day, top-3 topics, founder support-hours/day (from `./01-SUPPORT-OPERATIONS.md` §8).
6. Reputation: CWS rating + review velocity, decoder traffic vs. 4-week baseline, any community mentions.

**Questions to answer:**
- Which single funnel step lost the most this week, and is the cause known?
- Is any §4 threshold amber (within 20% of tripping)?
- Did refund/support reason codes point at one fixable defect?
- Did anything change at SellerForge or in Amazon policy that alters next week's plan?

**Decisions to make (choose, don't drift):**
- The ONE funnel step to improve next week, and the specific change.
- Continue / adjust / pause each acquisition activity.
- Confirm or execute any tripped threshold response (§4) — same day, before the review ends.

---

## 4. Decision thresholds (wired to the gates and kill criteria)

These are the pre-agreed tripwires — each row names its home in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`. When a threshold trips, the response executes the same day; the weekly review only confirms it happened.

| Metric | Threshold | Pre-agreed response | Gate/kill ref |
|---|---|---|---|
| Refund rate | >15% in the first 10 sales (and thereafter trailing) | Pause ALL marketing; diagnose by refund reason code before scaling anything; >30% activates `./02-CRISIS-PLAYBOOK.md` Scenario 3 | K4 |
| Chargeback ratio | 0.4% = Polar account-review level · 0.5% = our internal alarm · 0.75% = Stripe dispute-monitoring program · 1.5% = VAMP "excessive" (payout freeze territory) | At 0.5%: pause paid acquisition, refund faster and more proactively, audit the honest-expectations flow, alert the MoR proactively. **An MoR termination is existential — there is no plan B that survives losing the payment rail while carrying its dispute history.** Daily monitoring during launch (`./04-PAYMENT-OPERATIONS.md` §2). | K6 |
| Cloud cost per decode | >$0.10 | Tighten per-device rate limits / renegotiate model pricing before scaling. Expected cost is ~$0.02 per full case on the paid Gemini tier — a 5x overrun means an architecture bug (runaway retries, oversized prompts), not a pricing problem. | K5 |
| Support volume | >20 tickets/day for 3 consecutive days | Crisis: pause marketing, activate `./02-CRISIS-PLAYBOOK.md`, community triage per its §3 roles, canned responses everywhere | K7 |
| Decoder traffic | >3x baseline in 24h | Mass-suspension wave protocol: cloud circuit breaker holds the spend cap, graceful rules-only degradation, canned responses out | K10 |
| CWS rating | drop >0.3★ in 24h + >3x review volume | `./02-CRISIS-PLAYBOOK.md` Scenario 2 | K11 |

- [ ] **6. Verify every threshold above has a live, checkable data source (MoR dashboard, backend counter, Sentry, support log, CWS console) — walk each row once at the first post-launch weekly review.** — **Owner:** Founder · **Cost:** $0 · **Deadline:** first week after launch · **Blocks:** kill-criteria enforcement (Definition-of-done item in the gates file)

---

## 5. A note on financial expectations (read before quoting any revenue number)

The older research documents contain a P&L table showing $1,484/mo gross at 100 users with ~80% margin. **That table is illustrative arithmetic — a unit-economics sketch, not a target, not a forecast.** Quoting it as a plan number is how invented expectations become invented failures. The only planning-grade year-1 figure this project uses is the conservative ~$17k gross (per the Second Opinion's low scenario), and even that is an estimate to be replaced by actual funnel data within the first weeks of sales. Related discipline: no success-rate or win-rate claims exist anywhere until our own opt-in `outcome_reported` data supports them (decision D6) — and the same applies internally: the dashboard reports what happened, never what the old documents predicted.

---

## Definition of done

- [ ] All six funnel events + `nano_availability` + `decode_path` firing in production with the exact names in §1, verified end-to-end with a test run through the full funnel.
- [ ] Web analytics live on landing + decoder; Sentry and Better Stack (4 monitors + status page) live; no UptimeRobot free tier anywhere.
- [ ] Telemetry consent flow verified by payload inspection: opt-in, anonymous id, names + numbers only, zero notice content.
- [ ] North-star sheet exists with ≥4 consecutive weekly rows filled after launch.
- [ ] Every §4 threshold walked once against its live data source; responses confirmed executable.
- [ ] The founder can state from memory: the north star, the six event names in order, and the four chargeback numbers (0.4 / 0.5 / 0.75 / 1.5%).

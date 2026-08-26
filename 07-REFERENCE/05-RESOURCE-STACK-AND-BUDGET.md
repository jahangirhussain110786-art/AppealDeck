# 05-RESOURCE-STACK-AND-BUDGET — The chosen tool stack, what it costs, and the money plan

**Why this file exists / when to use it:** Five research streams produced dozens of tool options per domain; this file collapses them into one decided stack — the chosen option per domain, its cost, the hard limits of its free tier, and the specific trigger that justifies upgrading. It then puts the full one-time and monthly costs against the founder's actual cash so nobody discovers mid-build that the plan was never affordable. Consult it before opening any new account, paying for any tool, or approving any spend >€50. If a tool is not in this file, either add it here first (with the upgrade trigger) or don't adopt it.

**Terms used below:** MoR = Merchant of Record, a payment provider (Paddle, Polar) that legally resells the product and handles customer-country VAT/sales tax. CWS = Chrome Web Store. LLM = large language model. E&O = errors & omissions (professional indemnity) insurance. Toiminimi = Finnish sole-trader registration; y-tunnus = the Finnish business ID it grants. UPL = unauthorized practice of law. POA = Plan of Action, the appeal document Amazon requires. SCA/SAST = software-composition analysis / static application security testing (dependency and code security scanning). M-1…M-8 = the build milestones defined in `../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`.

**Confidence discipline:** every price below is tagged **(verified)** — confirmed against a live vendor page or primary source on 25 Aug 2026 by this playbook's authors or by a stream report whose figure matched independent knowledge — or **(estimate)** / **(unverified)** where it is a stream-report figure that still needs one live check before money moves. Stream reports contained fabricated citation domains; a price being in a stream file is NOT verification by itself.

---

## 1. The chosen stack, domain by domain

### 1.1 Hosting / backend

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Static web decoder + landing pages | **Cloudflare Pages (free)** | $0 (verified) | 500 builds/mo; unlimited static bandwidth (fair use); dynamic Pages Functions share Workers Free quota: 100K requests/day, **10 ms CPU per request** — too little for an LLM proxy | Never for static content. Any server logic beyond trivial redirects moves to the API host below. |
| API host (MoR webhooks, LLM proxy, license verification) | **Supabase Edge Functions** — same project as the database; ALL API work lives here | $0 → included in Supabase Pro $25/mo (verified) | 500K edge-function invocations/mo on Free; free project **pauses after 7 days of inactivity** (2–5 s cold wake) — MoR webhook retry behavior (Paddle: 60 retries over 3 days) plus idempotent handlers covers cold starts | **Fallback only, not the plan of record:** Vercel Pro ($20/mo) IF porting the donor Express backend proves necessary at M-5 — decided then by the AI assistant + Founder and logged (⚠ FOUNDER-DECISION only if it adds spend). **Vercel Hobby remains contractually non-commercial** — never launch revenue on it (superseded-decision #8, `../00-DECISION/02-DECISION-LOG.md`). |
| Postgres + pgvector (licenses, telemetry, policy corpus) | **Supabase Free** through the build; **Supabase Pro $25/mo** from first sustained sales | $0 → $25/mo (verified) | 500 MB database (read-only mode when exceeded); **no automatic backups**; project **pauses after 7 days of inactivity** (2–5 s wake — fatal for real-time license checks); 500K edge-function invocations/mo | Upgrade at first sustained sales OR when the pause/no-backup risk becomes unacceptable — in practice, at launch week. Until then: nightly `supabase db dump --data` via GitHub Actions to off-site storage (free), restore tested. |
| Cheap self-hosted alternative | Hetzner CX22 (2 vCPU / 4 GB, EU) | €4.50/mo (verified for EU regions; US prices rose Jun 2026 (unverified)) | N/A — but budget 4–8 h/mo founder ops time (estimate) | Only if cash forces it AND the AI assistant carries the ops burden; not the default path. |
| CI/CD, git hosting | GitHub Free + GitHub Actions | $0 (verified) | Org-level secrets silently resolve empty on private repos under GitHub Free — use repo-level secrets | None foreseen pre-launch. |

**Avoid:** Fly.io (no free tier — trial only), Railway Free ($1/mo credit is unusable), Render Free (requires card on file, suspends on bandwidth), GitHub Pages (terms bar commercial storefronts). All (verified by Stream 4/9 against vendor pages).

### 1.2 LLM / AI

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Paid POA drafting (production) | **Gemini Flash, PAID tier, via our own backend only** (decision D9) | ~$0.02/full case; 2.5 Flash $0.30/$2.50 per 1M tokens (verified) | **The Gemini FREE tier trains on submitted data — it must never touch user data. Free tier = development fixtures only.** Also: enabling billing on a Google Cloud project silently deletes that project's free tier — keep dev (no billing) and production (billing + spend cap) in separate projects. | Paid tier is live from the first real user input, not later. Non-negotiable. |
| Free/private/instant triage (extension) | Chrome built-in Gemini Nano (`LanguageModel` API), opportunistic only | $0 (verified GA for extensions since Chrome 138) | Steep hardware gate: desktop-only, ~22 GB free disk, >4 GB VRAM or 16 GB RAM/4-core, multi-GB model download, evicted if disk <10 GB. **Never assume Nano exists** — rules-only decode is the always-available fallback. | N/A — Nano is a bonus lane, never the plan of record (correction #5, Synthesis Brief). |
| Cost containment | Spend cap + circuit breaker + per-device rate limits in our backend, graceful degradation to rules-only decode | $0 build cost | — | Required BEFORE the free decoder goes public (D9). Mass-suspension waves are the spike scenario. |
| Batch/latency-tolerant jobs (critic re-runs, evals) | Gemini Batch API | 50% off standard pricing (verified) | Async only | Adopt when critic/regen volume is measurable. |
| RAG vector store (P1 feature) | Supabase pgvector on the existing database | $0 marginal (verified) | Shares the 500 MB free-tier cap; policy corpus estimated <10 MB (estimate) | Grows with the database decision above; no separate vector DB (Qdrant/Weaviate free clusters delete themselves after inactivity — unsuitable). |
| Prompt/eval tooling | promptfoo (open source) + deterministic fixture tests | $0 (verified OSS) | — | None. |

Cheaper third-party fallback models (DeepSeek, Groq, Together) were researched, but the DeepSeek pricing/scheduling specifics in Stream 3 are (unverified — possibly invented) and any non-Google provider re-opens the data-processing questions. Decision: single paid provider at launch; revisit multi-provider only on real cost pressure.

### 1.3 Payments

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Primary MoR | **Paddle** — apply Week 1 behind a live site + legal pages (decision D2) | 5% + $0.50/transaction, no monthly fee (verified) | Onboarding rejects pre-revenue founders unpredictably; AUP prohibits human services (blocks Expert Review); monthly payout, €100 minimum; effective fee on the $29 Guardian ≈ 6.7% (verified arithmetic) | N/A — usage-priced. |
| Warm fallback MoR | **Polar** (27 May 2026 pricing) | Free plan 5% + 50¢; **Pro $20/mo, 3.8% + 40¢** — cheapest at low volume (+1.5% international cards, $15 chargeback fee) (verified) | Free plan: manual payouts, €13 minimum, 7-day settlement, 14-day first-payout review, no dunning; 0.4% chargeback termination threshold; the old 4% + 40¢ Early Member rate is closed to orgs created after 27 May 2026 (verified) | Move to Pro $20/mo when Polar becomes primary OR monthly volume makes the 1.2-point fee gap > $20. |
| Human-service rail (deferred) | Stripe direct (Finland) — Expert Review only | 1.5% + €0.25 EEA cards (verified) | Not an MoR — founder owns VAT. Only used if/when Expert Review revives (`07-ROADMAP-AND-EXPANSION.md` §3). | Deferred with the SKU. |
| License keys | Self-issued: Supabase `licenses` table driven by MoR webhooks | $0 (in build scope, M11) | — | Never buy a license SaaS (Keygen $99/mo etc.) at this scale. |
| Webhook dev tooling | Paddle sandbox + webhook.site / ngrok free | $0 (verified) | Paddle Retain dunning **cannot be tested in sandbox** — first real dunning cycle runs in production (estimate) | None. |
| Accounting | MyTax (vero.fi) + a Finnish accountant call pre-M-7 | $0 tooling; accountant fee (estimate €100–300 one-off) | Finnish VAT threshold €20,000/12mo; standard rate 25.5%; records kept 6 years (verified) | Accountant engagement grows only with revenue. |

Lemon Squeezy is dead as an option (sunsetting; verified 25 Aug 2026). Any older document naming it as the MoR is superseded — see `../00-DECISION/02-DECISION-LOG.md` §3 row 1.

### 1.4 Support

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Helpdesk | Dedicated support Gmail + labels + templates | $0 (verified) | Founder-bound; no automation/CSAT; capacity ceiling per support-ops: warning at >2h/day support time; crisis at >20 tickets/day for 3 days — see `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` | Tooling upgrade at ~1,000 active users (per support-ops) → evaluate Crisp Mini $45/mo (verified) or Zendesk Suite Team $55/agent/mo (verified — **Zendesk has NO free tier**; the old build-plan assumption was wrong). |
| Live chat | Tawk.to free on the web decoder | $0 (verified — unlimited agents/chats) | Visible "Powered by tawk.to" branding — removal is $29/mo (verified) | Branding removal at public launch if cash allows; it reads amateur on a trust-critical product (estimate of impact). |
| Knowledge base | Notion free (founder solo) + Docsify self-hosted for the public site | $0 (verified) | Notion: unlimited blocks ONLY at 1 member — adding Jhangir as a *member* (not guest) triggers a 1,000-block cap (verified) | None foreseen; add collaborators as guests. |
| Support metrics | Google Sheets dashboard (tickets, response time, refund rate, chargeback ratio) | $0 (verified) | Manual | ~1,000 active users (estimate). |
| AI deflection | **None at launch.** Free chatbot tiers (Chatbase, Botpress, Tidio) are dev sandboxes with deletion/credit traps (verified) | $0 | — | Re-evaluate ~$14–45/mo options only when ticket volume is measured, post-M-7. |

Full support operating procedure: `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md`.

### 1.5 Analytics

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Web + funnel analytics | **Plausible or Umami, EU-hosted** (decision D10) — self-hosted on existing infra, or Umami/Plausible cloud from ~$9/mo | $0 self-hosted; ~$9/mo cloud (verified) | Plausible self-hosted Community Edition lacks funnels (cloud-only feature, verified) — funnel steps then come from backend event counts, which we need anyway | Cloud tier only if self-hosting friction costs real hours. |
| North-star dashboard | Google Sheets: paid Appeal Passes/week + funnel counts, weekly founder review | $0 (verified) | Manual entry | None pre-launch. |
| Error tracking | Sentry free | $0 (verified — 5,000 errors/mo, 1 seat) | A single bug spike can exhaust 5K errors silently (verified limit) | Team $26/mo only on sustained quota exhaustion. |
| Uptime monitoring | Better Stack free | $0 (verified — 10 monitors, 3-min checks, status page, commercial use allowed) | 3-day log retention | **Do NOT use UptimeRobot free — its terms prohibit commercial use since Dec 2024 (verified).** |
| Feature flags / kill switch | ConfigCat free (10 flags) or PostHog flags | $0 (verified) | 10 flags / 2 environments on ConfigCat | Exceeding 10 flags. |

GA4 is rejected: consent-banner overhead + EU transfer risk is a poor fit for a privacy-positioned product (verified compliance landscape). Kill-switch requirement comes from the crisis playbook (`../06-OPERATIONS/02-CRISIS-PLAYBOOK.md`).

### 1.6 Security / secrets

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Secrets | Vercel env vars (marked **sensitive**/write-only) + Supabase edge-function secrets + GitHub repo-level Action secrets | $0 (verified) | Build-log redaction only covers values ≥32 chars (unverified — treat as true and keep keys long) | >50 secrets or >2 people → Infisical self-hosted. |
| Client-side encryption (case vault) | WebCrypto native AES-GCM + PBKDF2; `@noble/ciphers` as audited fallback | $0 (verified) | `dexie-encrypted` has known open bugs (composite keys, stale-field overwrites) — pin/patch and test migrations (unverified issue list — re-check at build) | None. **Never `crypto-js`** (unmaintained, no GCM — verified). |
| Dependency scanning | Dependabot + `npm audit` in CI | $0 (verified) | No reachability analysis | Snyk free adds value but its 200 tests/mo deplete fast on active CI (verified) — optional. |
| SAST | `eslint-plugin-security` + Semgrep OSS; CodeQL only if the repo is public | $0 (verified) | CodeQL license bars private-repo use without paid Code Security (verified) | Paid SAST only on external requirement (investor/enterprise). |
| Pre-CWS security audit | Self-audit vs OWASP Top 10 + Chrome MV3 extension checklist | $0 | Self-audit is not an external attestation | External audit $500–2,000 (estimate) only if a partner/insurer demands it. |
| GDPR records | EU Commission SCCs + Finnish authority templates (suomi.fi); Article 30 record self-drafted | $0 (verified — official sources) | tietosuojatyokalu.fi is trial-then-paid, not free (conflicting stream reports — verify before relying) | None. |

### 1.7 Design assets

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Design tool | **Penpot** (open source) | $0 (verified — unlimited files) | Figma Free's 3-file cap is why it lost (verified) | None. |
| Icons | Lucide or Phosphor (MIT) | $0 (verified) | None — no attribution required | None. |
| Illustrations | unDraw + Open Peeps / Humaaans (no attribution) | $0 (verified) | Storyset requires attribution — avoid in CWS listing assets | None. |
| Screenshots / demo video | ShareX + OBS Studio + Shotcut; YouTube unlisted hosting for the CWS video | $0 (verified) | ~2 h founder learning curve (estimate) | None. |
| Fonts | Inter (body/UI) + Plus Jakarta Sans (headings), SIL OFL | $0 (verified) | Self-host WOFF2 to avoid a Google Fonts request (minor GDPR nicety) | None. |
| Marketing raster graphics | Canva Free | $0 (verified) | No SVG / no transparent-PNG export (verified) — vector work stays in Penpot | None. |

CWS asset specs (icon sizes, 1280×800 screenshots, promo tiles, video) live in `../04-PHASE-3-LAUNCH/02-CHROME-WEB-STORE-SUBMISSION.md`.

### 1.8 Legal templates & professional services

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Business registration | Toiminimi via ytj.fi | **€75 one-time** (verified — PRH 2026 price list) | ~3–5 business days | OY (limited company) only at >€30–50k/yr retained profits (decision D4). |
| Partnership agreement (Jhangir) | Reputable template (€200 route) + Finnish jurisdiction clause + IP assignment, per `../01-PHASE-0-BLOCKERS/02-PARTNERSHIP-AGREEMENT.md` | €200 template — €500–2,000 lawyer-drafted (verified range) | Templates are US-centric; the Finnish-law adaptations are mandatory manual work | Lawyer route if Jhangir's role expands beyond the current scope. |
| Privacy policy / ToS | AI-drafted from free generators + the four mandatory manual clauses (EU withdrawal consent, AI disclosure, MoR clause, LLM data-flow), per `../02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md` | $0 (+ optional €50–150 fixed-price marketplace review (estimate)) | Free generators produce US-centric output — the manual clauses are not optional | Paid legal review of terms (€500–1,500) before US marketing spend, bundled with the scoped UPL review. |
| Scoped UPL review | **Deferred-but-planned**: €500–1,500 scoped review before US marketing spend (verified reasoning — see superseded-decision #7, `../00-DECISION/02-DECISION-LOG.md`) | €500–1,500 (estimate) | Not a launch gate; positioning defenses are mandatory regardless | US ad spend or a first legal threat. |
| E&O insurance | Quotes from If.fi + international brokers; bind **before public launch** | €500–2,500/yr (estimate — **no Finnish online quote exists; phone/email quotes required**) | Coverage target €500k/claim (estimate) | Public launch (M-7/M-8) is the trigger; beta behind honest-expectations consent may run without it — founder's call, see §3. |
| Appeals consultant (template QC) | Retainer for template review, week 3–5 (decision D5) | **$1,000–2,000 one-time** (verified market range) | Paid audition first — fixture notice with 2 traps | None — one-time. |
| Domain | appealdeck-class .app/.com via Porkbun/Namecheap/Cloudflare | ~€10–30/yr (verified) | — | None. |
| CWS developer account | One-time registration | **$5** (verified) | EU-DSA trader verification required — start week 1 | None. |

### 1.9 Talent

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Appeals-writer sourcing | Fiverr/Upwork paid gigs + Jhangir's PK network — ALL candidates through the paid fixture audition (D5) | Audition $15–50/candidate; run 5–8 candidates (estimate) | r/forhire needs ≥25 karma, 7-day account, disclosed rate | None — the audition is the mandatory filter. |
| Appeals writer (ongoing) | Per-case or retainer | **$75–150/case or $150–400/mo retainer** (estimate — PK-market figures circularly sourced in stream docs; validate with real quotes during recruitment) | Keep engagements on-platform until a signed advisor agreement exists (platform ToS) | Volume. |
| Design partners (beta sellers) | Free Appeal Pass barter (3–5 sellers with live violations) | ~$0 cash; marginal LLM cost cents/draft (verified unit cost) | Needs a live decoder link by week 3–4 to be credible | None. |
| FI→PK payments | Wise Business | 0.35–1% per transfer (verified) | — | None. |
| Recruitment program budget | Separate envelope | $500–1,200 (verified — founder's stated budget) | — | — |

### 1.10 Distribution / email

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Landing/SEO hosting | Cloudflare Pages (see §1.1) | $0 (verified) | — | — |
| SEO tooling | Google Search Console + Ahrefs Webmaster Tools (owned-site free) + 1 hour in Google Keyword Planner **before any SEO/ads spend** (correction #7 — search volumes for panic queries are currently (unverified)) | $0 (verified) | Ubersuggest free = 3 searches/day | Paid SEO tools only after organic traction proves the channel. |
| Email list | Kit (10,000 free subs) or Substack (unlimited free) | $0 (verified) | Substack takes 10% only of *paid* newsletter revenue; vendor branding on free tiers | Paid email only when a free ceiling is actually hit. |
| Community monitoring | F5Bot keyword alerts + native Reddit/FB accounts (named founder) | $0 (verified F5Bot is free; a claimed paid tier is (unverified — likely invented)) | Community rules ban vendor ads — see `../05-PHASE-4-GROWTH/02-COMMUNITY-PLAYBOOK.md` | None. |
| Scheduling | Buffer free (3 channels, 10 queued posts each) | $0 (verified) | — | Not needed pre-launch. |
| Referral tracking | Google Sheets + MoR native coupon codes | $0 (verified — Partnero has **no** free tier despite older notes) | Manual reconciliation | Partnero $8/mo when reconciliation exceeds ~1 h/week (estimate). |

---

## 2. Budget tables

### 2.1 One-time setup costs

| # | Item | Low | High | Tag | When |
|---|---|---|---|---|---|
| 1 | Toiminimi registration (ytj.fi) | €75 | €75 | verified | Day 1–3 |
| 2 | CWS developer account | $5 | $5 | verified | Week 1 |
| 3 | Domain (year 1) | €10 | €30 | verified | Week 1–2 |
| 4 | Partnership agreement | €200 (template route) | €2,000 (lawyer) | verified range | Before any credential sharing (Phase 0) |
| 5 | Appeals consultant (template QC retainer) | $1,000 | $2,000 | verified range | Week 3–5 |
| 6 | E&O insurance (year 1) | €500 | €2,500 | estimate — quote-gated | Before public launch |
| 7 | Paid auditions (5–8 candidates) | $75 | $400 | estimate | Week 2–4 (recruitment envelope) |
| 8 | Optional scoped UPL/terms legal review | €500 | €1,500 | estimate | **Deferred** — before US marketing spend, not before first sale |
| | **Essential subtotal (1–6, low path, excl. deferred #8)** | **≈ €790 + $1,005 ≈ $1,850** | **≈ €4,605 + $2,005 ≈ $7,000** | | |

(Currency mixed as billed; €1 ≈ $1.08 assumed for subtotals — (estimate).)

### 2.2 Monthly run-rate at launch (launch infrastructure: $0–25/mo; hard ceiling ≤$50/mo)

| Item | Lean path | Standard path | Tag |
|---|---|---|---|
| Static hosting (Cloudflare Pages) | $0 | $0 | verified |
| API host (Supabase Edge Functions) | $0 (included with the database project) | $0 (included) — **Vercel Pro $20/mo only if the M-5 donor-backend fallback fires** | verified |
| Database (+ Edge Functions) | $0 Supabase Free (+ nightly dump workaround) → **$25 Pro from first sustained sales** | $25 Supabase Pro | verified |
| LLM (Gemini paid tier, low volume) | ~$2–10 | ~$2–10 | verified unit cost, volume (estimate) |
| Analytics (self-hosted / free tiers) | $0 | ~$9 (Plausible cloud) | verified |
| Support (Tawk.to, Gmail, Notion) | $0 | $29 (branding removal) | verified |
| Payments | $0 fixed (usage % only) | $0–20 (Polar Pro if primary) | verified |
| Domain amortized | ~$1.50 | ~$1.50 | verified |
| **Total** | **~$4–12/mo pre-revenue → ~$29–37/mo at launch ($0–25 infra + LLM usage)** | **~$67–115/mo (upper end only if the Vercel fallback fires)** | |

**Ruling:** the lean path is the plan of record: Cloudflare Pages (free) for the static site, Supabase Edge Functions for ALL API work, Supabase Pro $25/mo from first sustained sales — launch infrastructure $0–25/mo. Vercel Pro is NOT provisioned by default; it is a fallback only if porting the donor Express backend proves necessary at M-5, decided then by the AI assistant + Founder and logged. Standard-path items are adopted one at a time, each on its named upgrade trigger, never as a bundle.

### 2.3 Cash position and honest runway

Available cash: **~$1,100–2,300** general + **$500–1,200** recruitment envelope (founder-stated, verified as the planning basis).

- **Best case** (low-end one-time costs ≈ $1,850, minus the recruitment items covered by the recruitment envelope): the general envelope covers registration, domain, CWS, the €200 agreement template, and most of a $1,000 consultant retainer — but E&O (even at €500) pushes past the low end of the cash range. **At $1,100 cash the essential list does not fit; at $2,300 it fits with almost nothing spare.**
- **Worst case** (~$7,000): more than 3× available cash. Not a plan.
- **Runway statement:** there is no salary, no ad budget, and no buffer in this plan. Monthly infra of ~$4–12 pre-revenue is survivable indefinitely; the one-time professional costs are the entire cash question. The business must reach first revenue (week 4–5 web decoder + checkout, decision D3) before the E&O + launch-tier spends land, or the founder must consciously stage them (below).

⚠ **FOUNDER-DECISION — allocation order if totals exceed cash.** Recommended priority (spend in this order, stop when the envelope is empty, revisit after first revenue):
1. **Partnership agreement — €200 template route** (blocks all credential sharing; cheapest of the legal items; skipping it is the single most expensive possible mistake).
2. **Appeals consultant retainer — start at $1,000** (blocks POA template quality, which is the product).
3. **E&O insurance — cheapest adequate quote** (the certificate is required before the M-8 public listing — Gate rules in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`; the unlisted, consented design-partner beta MAY precede coverage, but only as a **logged founder exception** — ⚠ FOUNDER-DECISION, recorded in the decision log).
4. **Defer the scoped UPL/terms legal review** (€500–1,500) until US marketing spend or first revenue — it is optional-but-prudent, not a gate (superseded-decision #7).
5. **Free tiers everywhere else** — every §1 domain has a $0 lane; no tool spend is approved while items 1–3 are unfunded.

The founder may reorder 2 and 3, or fund E&O from first revenue — but items 1–3 must all exist before public launch (Gate rules in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`).

---

## 3. Standing budget rules

1. No new paid tool without a row in §1 naming its upgrade trigger — and the trigger must have actually fired.
2. Every price tagged (estimate) or (unverified) gets one live check before the purchase; record the checked price here.
3. Never quote a banned number in any budget or forecast (banned list: `01-MARKET-EVIDENCE.md` §4).
4. The weekly founder review (D10) includes a 2-minute run-rate check against §2.2.

---

## 4. Actions

- [ ] **1.** Open Cloudflare Pages + GitHub + Supabase Free + Google AI Studio (dev project, no billing) accounts. **Owner:** Founder (AI assistant prepares configs) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** all build work.
- [ ] **2.** Create a SEPARATE Google Cloud project with billing + hard spend cap for production Gemini; confirm no user data ever reaches the dev/free project. **Owner:** AI assistant (Founder holds billing) · **Cost:** $0 setup · **Deadline:** before the first real user input (week 4) · **Blocks:** D9 compliance, paid composer.
- [ ] **3.** Set up nightly `supabase db dump --data` → encrypted off-site copy via GitHub Actions; test one restore. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** safe use of Supabase Free.
- [ ] **4.** Apply to Paddle AND open Polar account, both behind the live site + legal pages. **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 (site first) · **Blocks:** week 4–5 checkout (M-5).
- [ ] **5.** Buy domain + register toiminimi + CWS account. **Owner:** Founder · **Cost:** €75 + ~€15 + $5 (all verified) · **Deadline:** Days 1–5 · **Blocks:** Paddle application, CWS listing, invoicing.
- [ ] **6.** Execute the §2.3 allocation decision: confirm spend order 1–5 or record an amended order in `../00-DECISION/02-DECISION-LOG.md`. **Owner:** Founder ⚠ FOUNDER-DECISION (see §2.3) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** partnership agreement purchase, consultant retainer, E&O timing.
- [ ] **7.** Request E&O quotes (If.fi + at least one international broker) so the real number replaces the €500–2,500 estimate. **Owner:** Founder · **Cost:** $0 to quote · **Deadline:** Week 3 · **Blocks:** public-launch gate, §2.3 item 3.
- [ ] **8.** Verify-before-buy pass: live-check every (estimate)/(unverified) price in this file that is about to be paid (E&O, audition rates, Crisp/Zendesk if triggered, Partnero, tietosuojatyokalu.fi). **Owner:** AI assistant · **Cost:** $0 · **Deadline:** rolling, before each purchase · **Blocks:** budget accuracy.
- [ ] **9.** M-5 backend check: confirm the Supabase Edge Functions path carries the MoR webhooks, LLM proxy, and license verification as planned. Vercel Pro ($20/mo) is provisioned ONLY if porting the donor Express backend proves necessary at M-5 — decided by the AI assistant + Founder and logged in `../00-DECISION/02-DECISION-LOG.md` (⚠ FOUNDER-DECISION only if it adds spend). Either way, confirm nothing commercial ever runs on Vercel Hobby. **Owner:** AI assistant + Founder · **Cost:** $0 default; $20/mo only if the fallback fires (verified) · **Deadline:** Week 4–5 (M-5) · **Blocks:** ToS-safe revenue.
- [ ] **10.** Supabase Pro upgrade from first sustained sales (or earlier if backup risk is judged unacceptable). **Owner:** Founder · **Cost:** $25/mo (verified) · **Deadline:** launch week · **Blocks:** durable customer data.

---

## Definition of done

- [ ] Every account in §1 exists, on the named tier, with the named limits confirmed at signup (discrepancies recorded here).
- [ ] Production LLM traffic runs exclusively on the paid Gemini tier in the billing-capped project; the dev project has billing disabled.
- [ ] The §2.3 allocation order is confirmed or amended by the founder and logged in the decision log.
- [ ] Actual one-time spends are written into §2.1 next to the estimates; monthly run-rate at launch is measured and is ≤$50/mo on the lean path (or the variance is explained in the decision log).
- [ ] No paid tool is in use that lacks a §1 row and a fired upgrade trigger.
- [ ] Nothing commercial is hosted on Vercel Hobby, GitHub Pages, or UptimeRobot free, and no user data has touched a free LLM tier.

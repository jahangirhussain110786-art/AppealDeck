# 05-RESOURCE-STACK-AND-BUDGET — The chosen tool stack, what it costs, and the money plan

**Why this file exists / when to use it:** Five research streams produced dozens of tool options per domain; this file collapses them into one decided stack — the chosen option per domain, its cost, the hard limits of its free tier, and the specific trigger that justifies upgrading. It then puts the full one-time and monthly costs against the founder's actual cash so nobody discovers mid-build that the plan was never affordable. Consult it before opening any new account, paying for any tool, or approving any spend >$50. If a tool is not in this file, either add it here first (with the upgrade trigger) or don't adopt it.

**Terms used below:** MoR = Merchant of Record, a payment provider (Paddle) that legally resells the product and handles customer-country VAT/sales tax. CWS = Chrome Web Store. LLM = large language model. E&O = errors & omissions (professional indemnity) insurance. UPL = unauthorized practice of law. POA = Plan of Action, the appeal document Amazon requires. SCA/SAST = software-composition analysis / static application security testing (dependency and code security scanning). M-1…M-8 = the build milestones defined in `../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`.

**Confidence discipline:** every price below is tagged **(verified)** — confirmed against a live vendor page or primary source on 25 Aug 2026 by this playbook's authors or by a stream report whose figure matched independent knowledge — or **(estimate)** / **(unverified)** where it is a stream-report figure that still needs one live check before money moves. Stream reports contained fabricated citation domains; a price being in a stream file is NOT verification by itself.

---

## 1. The chosen stack, domain by domain

### 1.1 Hosting / backend — SUPERSEDED 4 Sep 2026, see the note below before reading this table

**The founder decided single-host Vercel** (marketing + auth + app on one origin — `CLAUDE.md` §4, `docs/DEPLOYMENT.md`, `src/middleware.ts`) instead of the Cloudflare Pages + Supabase Edge Functions split this table describes. The actual, running stack is: **Vercel Hobby (free)** hosting the whole Next.js app (static pages, API routes, and middleware together — no separate "API host"), plus a fresh **Supabase Free** project for the database and auth. Nothing here was a mistake to plan — Cloudflare Pages/Edge Functions was a reasonable option before the single-host decision — it's just not what got built. The table below is kept as the historical record of that earlier plan; don't use it to answer "what do we actually run."

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
| Human-service rail (deferred) | Separate rail TBD (details depend on jurisdiction and product structure at revival time) | TBD | Only used if/when Expert Review revives (`07-ROADMAP-AND-EXPANSION.md` §3). | Deferred with the SKU. |
| License keys | Self-issued: Supabase `licenses` table driven by MoR webhooks | $0 (in build scope, M11) | — | Never buy a license SaaS (Keygen $99/mo etc.) at this scale. |
| Webhook dev tooling | Paddle sandbox + webhook.site / ngrok free | $0 (verified) | Paddle Retain dunning **cannot be tested in sandbox** — first real dunning cycle runs in production (estimate) | None. |
| Accounting | Pakistan accountant consultation | $0 tooling; accountant fee (estimate PKR 10,000–30,000 one-off) | Pakistan tax obligations on business income; NTN registration if needed | Accountant engagement grows only with revenue. |

Lemon Squeezy is dead as an option (sunsetting; verified 25 Aug 2026). Any older document naming it as the MoR is superseded — see `../00-DECISION/02-DECISION-LOG.md` §3 row 1.

### 1.4 Support

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Helpdesk | Dedicated support Gmail + labels + templates | $0 (verified) | Founder-bound; no automation/CSAT; capacity ceiling per support-ops: warning at >2h/day support time; crisis at >20 tickets/day for 3 days — see `../06-OPERATIONS/01-SUPPORT-OPERATIONS.md` | Tooling upgrade at ~1,000 active users (per support-ops) → evaluate Crisp Mini $45/mo (verified) or Zendesk Suite Team $55/agent/mo (verified — **Zendesk has NO free tier**; the old build-plan assumption was wrong). |
| Live chat | Tawk.to free on the web decoder | $0 (verified — unlimited agents/chats) | Visible "Powered by tawk.to" branding — removal is $29/mo (verified) | Branding removal at public launch if cash allows; it reads amateur on a trust-critical product (estimate of impact). |
| Knowledge base | Notion free (founder solo) + Docsify self-hosted for the public site | $0 (verified) | Notion: unlimited blocks ONLY at 1 member — adding any collaborator as a *member* (not guest) triggers a 1,000-block cap (verified) | None foreseen; add collaborators as guests. |
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
| GDPR records | Pakistan data-protection requirements + standard contractual clauses; Article 30 record self-drafted | $0 (verified — official sources) | Verify local data-protection authority templates before relying | None. |

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
| Business registration | Individual seller setup (CNIC/passport + proof of address + personal payout account) | **$0 one-time** | No registration fee for individual sellers | Company incorporation only at >PKR 5–10M/yr retained profits (decision D4). |
| Collaborator agreement (future, if/when a contractor is engaged) | Reputable template ($200 route) + Pakistan jurisdiction clause + IP assignment, per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md` — **$0 at Phase 0; nothing is bought until a collaborator is actually engaged** | $200 template — $500–2,000 lawyer-drafted (verified range) | Templates are US-centric; the Pakistan-law adaptations are mandatory manual work | Lawyer route if a collaborator's role expands beyond contractor scope. |
| Privacy policy / ToS | AI-drafted from free generators + the four mandatory manual clauses (consumer withdrawal consent, AI disclosure, MoR clause, LLM data-flow), per `../02-PHASE-1-FOUNDATION/02-DOMAIN-AND-LEGAL-PAGES.md` | $0 (+ optional $50–150 fixed-price marketplace review (estimate)) | Free generators produce US-centric output — the manual clauses are not optional | Paid legal review of terms ($500–1,500) before US marketing spend, bundled with the scoped UPL review. |
| Scoped UPL review | **Deferred-but-planned**: $500–1,500 scoped review before US marketing spend (verified reasoning — see superseded-decision #7, `../00-DECISION/02-DECISION-LOG.md`) | $500–1,500 (estimate) | Not a launch gate; positioning defenses are mandatory regardless | US ad spend or a first legal threat. |
| E&O insurance | Quotes from a Pakistani professional-indemnity insurer (e.g., EFU or Jubilee — software-E&O availability unverified) plus at least one international broker; bind **before public launch** | $500–2,500/yr (estimate — **no local online quote exists; phone/email quotes required**) | Coverage target $500k/claim (estimate) | Public launch (M-7/M-8) is the trigger; beta behind honest-expectations consent may run without it — founder's call, see §3. |
| Appeals consultant (template QC) | Retainer for template review, week 3–5 (decision D5) | **$1,000–2,000 one-time** (verified market range) | Paid audition first — fixture notice with 2 traps | None — one-time. |
| Domain | appealdeck-class .app/.com via Porkbun/Namecheap/Cloudflare | ~$10–30/yr (verified) | — | None. |
| CWS developer account | One-time registration | **$5** (verified) | CWS contact/trader verification required — start week 1 | None. |

### 1.9 Talent

| Item | Chosen option | Cost | Free-tier hard limits | Upgrade trigger |
|---|---|---|---|---|
| Appeals-writer sourcing | Direct Fiverr/Upwork paid gigs — ALL candidates through the paid fixture audition (D5) | Audition $15–50/candidate; run 5–8 candidates (estimate) | r/forhire needs ≥25 karma, 7-day account, disclosed rate | None — the audition is the mandatory filter. |
| Appeals writer (ongoing) | Per-case or retainer | **$75–150/case or $150–400/mo retainer** (estimate — PK-market figures circularly sourced in stream docs; validate with real quotes during recruitment) | Keep engagements on-platform until a signed collaborator agreement exists (platform ToS; `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`) | Volume. |
| Design partners (beta sellers) | Free Appeal Pass barter (3–5 sellers with live violations) | ~$0 cash; marginal LLM cost cents/draft (verified unit cost) | Needs a live decoder link by week 3–4 to be credible | None. |
| Pakistan contractor payments | Wise Business or Payoneer | 0.35–1% per transfer (verified) | — | None. |
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
| 1 | Individual seller setup | $0 | $0 | verified | Day 1–3 |
| 2 | CWS developer account | $5 | $5 | verified | Week 1 |
| 3 | Domain (year 1) | $10 | $30 | verified | Week 1–2 |
| 4 | Collaborator agreement (future contractor) | $200 (template route) | $2,000 (lawyer) | verified range | **$0 at Phase 0** — bought only if/when a contractor is engaged (`../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`) |
| 5 | Appeals consultant (template QC retainer) | $1,000 | $2,000 | verified range | Week 3–5 |
| 6 | E&O insurance (year 1) | $500 | $2,500 | estimate — quote-gated | Before public launch |
| 7 | Paid auditions (5–8 candidates) | $75 | $400 | estimate | Week 2–4 (recruitment envelope) |
| 8 | Optional scoped UPL/terms legal review | $500 | $1,500 | estimate | **Deferred** — before US marketing spend, not before first sale |
| | **Essential subtotal (1–6, low path, excl. deferred #8; item 4 counts $0 at Phase 0)** | **≈ $1,515** | **≈ $4,535** | | |

(Figures in USD; the few provider-quoted € prices elsewhere in this file — e.g., Hetzner — are billed as quoted.)

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

**Ruling — SUPERSEDED 4 Sep 2026:** the paragraph above describes the pre-single-host plan. **What's actually running:** Vercel Hobby (free, single host for everything) + Supabase Free — $0/mo pre-revenue, matching this section's own spirit (lean, free-tier-first) just on a different provider. Upgrade to Vercel Pro ($20/mo) and/or Supabase Pro ($25/mo) is a founder decision once paid usage justifies the cost — same upgrade-trigger discipline this file already argues for, applied to the real stack. Standard-path items are still adopted one at a time, each on its named upgrade trigger, never as a bundle.

### 2.3 Cash position and honest runway

Available cash: **~$1,100–2,300** general + **$500–1,200** recruitment envelope (founder-stated, verified as the planning basis).

- **Best case** (low-end one-time costs ≈ $1,515, minus the recruitment items covered by the recruitment envelope): the general envelope covers registration, domain, CWS, and most of a $1,000 consultant retainer — but E&O (even at $500) pushes past the low end of the cash range. **At $1,100 cash the essential list does not fit; at $2,300 it fits with a few hundred dollars spare.**
- **Worst case** (~$4,500): roughly twice the top of the cash range. Not a plan.
- **Runway statement:** there is no salary, no ad budget, and no buffer in this plan. Monthly infra of ~$4–12 pre-revenue is survivable indefinitely; the one-time professional costs are the entire cash question. The business must reach first revenue (week 4–5 web decoder + checkout, decision D3) before the E&O + launch-tier spends land, or the founder must consciously stage them (below).

⚠ **FOUNDER-DECISION — allocation order if totals exceed cash.** Recommended priority (spend in this order, stop when the envelope is empty, revisit after first revenue):
1. **Collaborator & Contractor Policy — $0** (adopt the policy now, per `../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`; it binds before any future contractor/VA/expert gets access, and the $200 agreement template is bought only if/when someone is actually engaged — nothing is purchased at Phase 0).
2. **Appeals consultant retainer — start at $1,000** (blocks POA template quality, which is the product).
3. **E&O insurance — cheapest adequate quote** (the certificate is required before the M-8 public listing — Gate rules in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`; the unlisted, consented design-partner beta MAY precede coverage, but only as a **logged founder exception** — ⚠ FOUNDER-DECISION, recorded in the decision log).
4. **Defer the scoped UPL/terms legal review** ($500–1,500) until US marketing spend or first revenue — it is optional-but-prudent, not a gate (superseded-decision #7).
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

- [x] **1.** ~~Open Cloudflare Pages~~ **Superseded 4 Sep 2026 — open a Vercel account instead** (single-host decision) + GitHub + Supabase Free + Google AI Studio (dev project, no billing) accounts. **Owner:** Founder (AI assistant prepares configs) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** all build work.
- [ ] **2.** Create a SEPARATE Google Cloud project with billing + hard spend cap for production Gemini; confirm no user data ever reaches the dev/free project. **Owner:** AI assistant (Founder holds billing) · **Cost:** $0 setup · **Deadline:** before the first real user input (week 4) · **Blocks:** D9 compliance, paid composer.
- [ ] **3.** Set up nightly `supabase db dump --data` → encrypted off-site copy via GitHub Actions; test one restore. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** safe use of Supabase Free.
- [ ] **4.** Apply to Paddle AND open Polar (the warm fallback — verify at signup that Polar's Pakistan payout, which runs via Stripe Connect cross-border, actually works), both behind the live site + legal pages. Dodo Payments (MoR, 4% + 40¢) stays plan C: application-ready, no account opened. **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 (site first) · **Blocks:** week 4–5 checkout (M-5).
- [ ] **5.** Buy domain + CWS account. **Owner:** Founder · **Cost:** ~$15 + $5 (all verified) · **Deadline:** Days 1–5 · **Blocks:** Paddle application, CWS listing, invoicing.
- [ ] **6.** Execute the §2.3 allocation decision: confirm spend order 1–5 or record an amended order in `../00-DECISION/02-DECISION-LOG.md`. **Owner:** Founder ⚠ FOUNDER-DECISION (see §2.3) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** consultant retainer, E&O timing (the collaborator policy itself is $0 — no agreement purchase exists at Phase 0).
- [ ] **7.** Request E&O quotes (a Pakistani professional-indemnity insurer — e.g., EFU or Jubilee, software-E&O availability unverified — plus at least one international broker) so the real number replaces the $500–2,500 estimate. **Owner:** Founder · **Cost:** $0 to quote · **Deadline:** Week 3 · **Blocks:** public-launch gate, §2.3 item 3.
- [ ] **8.** Verify-before-buy pass: live-check every (estimate)/(unverified) price in this file that is about to be paid (E&O, audition rates, Crisp/Zendesk if triggered, Partnero) — and confirm a free Article 30 ROPA spreadsheet template (e.g., the EU SME template) still covers the GDPR-records need at $0. **Owner:** AI assistant · **Cost:** $0 · **Deadline:** rolling, before each purchase · **Blocks:** budget accuracy.
- [x] **9.** **Superseded 4 Sep 2026:** the single-host decision means MoR webhooks, the LLM proxy, and license verification all run as Next.js API routes on Vercel itself (`src/app/api/*`) — there is no separate Supabase Edge Functions path, and no donor Express backend was ported. Vercel Hobby runs the paid product deliberately (see the §1.1 note above and `AGENTS.md`); this is a founder-informed choice, not an oversight. **Owner:** AI assistant + Founder · **Cost:** $0 · **Deadline:** Week 4–5 (M-5) · **Blocks:** ToS-safe revenue.
- [ ] **10.** Supabase Pro upgrade from first sustained sales (or earlier if backup risk is judged unacceptable). **Owner:** Founder · **Cost:** $25/mo (verified) · **Deadline:** launch week · **Blocks:** durable customer data.

---

## Definition of done

- [ ] Every account in §1 exists, on the named tier, with the named limits confirmed at signup (discrepancies recorded here).
- [ ] Production LLM traffic runs exclusively on the paid Gemini tier in the billing-capped project; the dev project has billing disabled.
- [ ] The §2.3 allocation order is confirmed or amended by the founder and logged in the decision log.
- [ ] Actual one-time spends are written into §2.1 next to the estimates; monthly run-rate at launch is measured and is ≤$50/mo on the lean path (or the variance is explained in the decision log).
- [ ] No paid tool is in use that lacks a §1 row and a fired upgrade trigger.
- [x] **Superseded 4 Sep 2026:** the product *does* run on Vercel Hobby by deliberate, founder-informed decision (single-host topology) — this line's original ban is no longer the rule. What still holds unconditionally: no user data has touched a free LLM tier (verified — `GEMINI_API_KEY` is a paid-tier key, never client-exposed).

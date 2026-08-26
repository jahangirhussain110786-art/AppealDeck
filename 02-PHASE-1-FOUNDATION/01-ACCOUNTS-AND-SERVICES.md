# Accounts & Services — everything to open in Week 1–2

**Why this file exists / when to use it:** Every external account AppealDeck depends on is listed here with its cost, owner, opening order, and what it blocks downstream. Work through it in Week 1–2, in the order given — several items (Chrome Web Store trader verification, Wise verification, Paddle review) have multi-day lead times, so opening them late silently delays later milestones. Prerequisites from Phase 0 (leaked-credential rotation, Finnish business registration) must be done first — see `../01-PHASE-0-BLOCKERS/`.

Glossary for this file: **CWS** = Chrome Web Store. **MoR** = Merchant of Record (a payment provider that legally resells your product and handles VAT/sales tax). **DSA** = the EU Digital Services Act, which requires "trader" sellers on app stores to publish verified contact details. **LLM** = large language model. **y-tunnus** = Finnish Business ID (issued with the toiminimi/sole-trader registration).

---

## 1. Master table

| # | Service | Purpose | Owner | Cost | When | Blocks |
|---|---------|---------|-------|------|------|--------|
| 1 | Chrome Web Store developer account + EU-DSA trader verification | Publish the extension; sell into the EU | Founder | $5 one-time | Week 1, Day 1–2 | Store submission (Week 7–8); EU visibility of the listing |
| 2 | Domain + business email | Site, legal pages, public contact address | Founder | ~€10–30/yr | Week 1, Day 1–3 | Legal pages, Paddle application, CWS privacy-policy URL, DSA contact email |
| 3 | Supabase project (**fresh** — never the compromised one) | Licenses DB, webhook + LLM-proxy edge functions, telemetry | Founder opens; AI assistant integrates | $0 free tier → $25/mo Pro before first paid sale | Week 1 | Backend work, payment webhooks, license validation |
| 4 | Hosting: Cloudflare Pages (default) — Vercel Pro is an M-5 fallback only, not a co-equal option | Host the landing page, legal pages, and the free web decoder | Founder opens; AI assistant deploys | $0 (default path) | Week 1–2 | Live site → Paddle application; web decoder (Week 4–5 revenue surface) |
| 5 | Google AI Studio / Gemini API | Cloud LLM for classification + the paid POA composer | Founder | Free tier = dev only; paid tier ~$0.02/full case at launch volumes | Week 1–2 (dev key); paid tier before any real user data | POA quality path; web decoder cloud calls |
| 6 | Wise Business | FI→PK contractor payments (PayPal is unavailable in Pakistan) | Founder | No monthly fee; 0.35–1% per transfer | Week 1–2 (verification takes days) | Paid expert auditions (Week 2), PK retainers |
| 7 | Analytics: Plausible **or** Umami (EU-hosted) | Decoder funnel metrics (decision D10) | Founder picks; AI assistant wires events | Plausible from ~€9/mo (estimate — verify current price); Umami self-hosted $0 | Week 2 | Funnel measurement from the first decoder session |
| 8 | Paddle merchant account | Primary MoR candidate | Founder | $0 to apply | Week 1 — details in `./03-PAYMENTS-SETUP.md` | First revenue (Week 4–5) |
| 9 | Polar account | Warm-fallback MoR | Founder | $0 (free tier) | Week 1 — details in `./03-PAYMENTS-SETUP.md` | Payment fallback path |
| 10 | GitHub (private repo + Actions CI) | Code hosting, CI, secrets | Founder opens; AI assistant configures | $0 | Week 1 — details in `./04-REPO-AND-FIXTURE-CORPUS.md` | All build milestones |

Not in this file: an **active Amazon Seller Central account** for live-page QA. It blocks only the Week 6–7 live-QA gate, is sourced through Jhangir / design partners, and is handled in the build and team phases (see `../03-PHASE-2-BUILD/` and `../08-TEAM/`).

---

## 2. Per-account steps

### 2.1 Chrome Web Store developer account (+ EU-DSA trader verification)

The $5 registration is trivial; the reason this is a Day-1 item is the **EU-DSA trader verification**, which requires you to declare yourself a trader and publish verified contact details (name/business name, address, email, phone) on the listing before the extension is visible to EU users. Verification is a back-and-forth with lead time — start it months before you need it.

- [ ] **1.** Register a CWS developer account under the clean business identity (Hawlton Alliance), using the business email from item 2 — not a personal Gmail. — **Owner:** Founder · **Cost:** $5 one-time · **Deadline:** Week 1, Day 1–2 · **Blocks:** store submission (Week 7–8)
- [ ] **2.** In the developer dashboard, complete the trader declaration and start DSA trader verification immediately (submit business name, address, email, phone for verification). — **Owner:** Founder · **Cost:** $0 · **Deadline:** started Week 1 · **Blocks:** EU visibility of the listing at launch
- [ ] **3.** Record the developer-account email + 2FA recovery codes in the founder's password manager. Never share these credentials; the CWS account is a founder-retained primary account (decision D5). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** account recovery in any later incident

### 2.2 Domain + business email

Domain selection criteria and the site content live in `./02-DOMAIN-AND-LEGAL-PAGES.md`. The account-level facts:

- [ ] **4.** Register the domain (target: `appealdeck.app` or similar) at Porkbun, Cloudflare Registrar, or Namecheap. Note `.app` enforces HTTPS (HSTS-preloaded TLD) — fine, since every host on our list auto-provisions TLS. — **Owner:** Founder · **Cost:** ~€10–30/yr · **Deadline:** Week 1, Day 1–3 · **Blocks:** legal pages, Paddle application, CWS listing
- [ ] **5.** Set up a business mailbox or forwarding address on the domain (e.g. `hello@` + `support@`). Cloudflare Email Routing (free forwarding) is sufficient at launch; a hosted mailbox can come later. This address becomes the DSA public contact, the Paddle application contact, and the privacy-policy contact. — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** DSA verification, Paddle application, data-subject request SOP

### 2.3 Supabase — fresh project only

The old project (`fogvzjtxbqgfppdrxqra`) had its Postgres password and service keys leaked in plaintext inside the old codebase. Even after rotation (a Phase-0 blocker), the playbook decision is a **fresh project** — clean history, no inherited schema, no doubt.

- [ ] **6.** Create a new Supabase project in an EU region (e.g. Frankfurt) under a fresh organization. Do NOT reuse or link the compromised project. — **Owner:** Founder · **Cost:** $0 (free tier) · **Deadline:** Week 1 · **Blocks:** licenses table, payment webhooks, LLM proxy
- [ ] **7.** Store the service-role key ONLY in deployment environments (Supabase edge-function secrets / GitHub Actions secrets). It never appears in the repo, the extension, or any client code. — **Owner:** AI assistant (configures), Founder (holds) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** secure backend work
- [ ] **8.** While on the free tier, schedule a nightly `supabase db dump --data` via GitHub Actions, encrypted and pushed to separate storage. Reason: the free tier has **zero automatic backups** and **pauses after 7 days of inactivity**. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** data safety during development
- [ ] **9.** Upgrade to Supabase Pro ($25/mo — automatic backups, no pausing) **from first sustained sales**, at the latest before the Week 4–5 checkout goes live. A paused or unbackedup free project validating real licenses is not acceptable. — **Owner:** Founder · **Cost:** $25/mo · **Deadline:** from first sustained sales (Week 4–5 at latest) · **Blocks:** production license validation

### 2.4 Hosting — the decision, stated

**Background:** Vercel's Hobby (free) plan is contractually **non-commercial** — hosting anything with a paid upgrade path on it violates their terms and risks termination without warning. So "free Vercel through launch" is not an option. The two legitimate paths:

| Path | Stack | Cost | Fits |
|------|-------|------|------|
| **Default (chosen)** | Cloudflare Pages (static site + decoder UI, unlimited static bandwidth, commercial use allowed) + Supabase Edge Functions for all API work (LLM proxy, license validation, payment webhooks) | $0 hosting + Supabase tier | Static decoder + thin API. Note Cloudflare Workers' free tier (10 ms CPU/request) cannot run LLM calls — that is why API work lives in Supabase edge functions, not Workers. |
| M-5 fallback only (NOT provisioned by default) | Vercel Pro ($20/mo) + Supabase Pro ($25/mo) = $45/mo | $45/mo | Considered only if porting the donor Express backend proves necessary at M-5 — decided then by the AI assistant + Founder and logged. Not a launch option to weigh. |

The playbook default is **Cloudflare Pages (free) for the static decoder site + Supabase Edge Functions for ALL API work (MoR webhooks, LLM proxy, license verification) — Supabase free tier at start, Pro ($25/mo) from first sustained sales**. Launch infrastructure cost: $0–25/mo. MoR webhook delivery on this stack is safe: Paddle retries 60 times over 3 days, and the endpoint is idempotent, which covers cold starts.

Vercel Pro is a fallback only — if porting the donor Express backend proves necessary at M-5, the AI assistant + Founder decide it then and log it (⚠ **FOUNDER-DECISION** only because it adds spend). It is never adopted at launch by preference.

- [ ] **10.** Create a Cloudflare account; connect the domain (DNS + Pages). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** live site → Paddle application
- [ ] **11.** Deploy a placeholder→real landing site via Cloudflare Pages per `./02-DOMAIN-AND-LEGAL-PAGES.md`. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** Paddle application (needs a real, navigable site)

### 2.5 Google AI Studio / Gemini API

Decision D9 is binding: **the Gemini free tier trains on your data — it may only ever see synthetic fixture text, never a real user's notice.** Production traffic runs on the paid tier (not used for training), through our own backend, with the key server-side only.

- [ ] **12.** Create a Google AI Studio API key for development. Label it DEV. It may only be used against the synthetic fixture corpus (`./04-REPO-AND-FIXTURE-CORPUS.md`). — **Owner:** Founder · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** classifier/composer development
- [ ] **13.** Enable billing on a separate key/project for production. Label it PROD. Set a billing budget alert. Verify the current Flash model id and price at integration time (2.5 Flash was $0.30/$2.50 per 1M tokens; 3.7 Flash $0.75/$3.75 intro-priced to Dec 2026 — roughly $0.02 per full case either way). — **Owner:** Founder · **Cost:** usage-based, ~$0.02/case (estimate) · **Deadline:** before any real user data flows (Week 4–5 at latest) · **Blocks:** web decoder + paid composer going live
- [ ] **14.** Both keys live only in backend env (Supabase secrets). A cost ceiling, circuit breaker, and per-device rate limits must exist before the free decoder is public (implementation spec in `../03-PHASE-2-BUILD/`). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** before decoder is public · **Blocks:** safe free-tier launch

### 2.6 Wise Business

Cross-border payments to Pakistan (auditions for appeals experts from Jhangir's network, later retainers). PayPal does not operate in Pakistan; Wise Business does FI→PK at 0.35–1% per transfer with no monthly fee. Business verification takes days — open it before you need to pay anyone.

- [ ] **15.** Open a Wise Business account under the Finnish business identity; complete verification. — **Owner:** Founder · **Cost:** $0 setup; 0.35–1% per transfer · **Deadline:** Week 1–2 · **Blocks:** paid fixture auditions (Week 2), PK contractor payments
- [ ] **16.** Keep every transfer receipt for Finnish bookkeeping (6-year retention under the Finnish Accounting Act). — **Owner:** Founder · **Cost:** $0 · **Deadline:** ongoing · **Blocks:** clean accounting

### 2.7 Analytics — Plausible or Umami

Decision D10 sets the north-star metric (paid Appeal Passes/week) and the funnel: decoder sessions → decode completed → intake started → purchase → opt-in outcome. Both Plausible and Umami are cookieless, EU-hostable, and GDPR-friendly (no consent banner needed for anonymous stats — still disclosed in the privacy policy).

- [ ] **17.** Pick one: Plausible (hosted, from ~€9/mo — estimate, verify) for zero maintenance, or Umami (self-hosted, $0) if the founder accepts running it. Either satisfies D10. — **Owner:** Founder · **Cost:** €0–9/mo · **Deadline:** Week 2 · **Blocks:** funnel measurement from first decoder session
- [ ] **18.** Wire the D10 funnel events into the site + decoder as they ship; backend event counts complement it. Weekly founder review cadence starts when the decoder is live. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with the decoder (Week 4–5) · **Blocks:** launch-phase decisions in `../04-PHASE-3-LAUNCH/`

---

## 3. Security rules that apply to every account

1. Unique passwords in a password manager + 2FA everywhere it is offered.
2. Founder retains sole ownership of all primary accounts (decision D5). Collaborators get scoped invitations, never shared credentials — and nothing is shared with anyone before the written partnership agreement is signed (see `../01-PHASE-0-BLOCKERS/`).
3. No secret of any kind is ever committed to the repo (see `./04-REPO-AND-FIXTURE-CORPUS.md` .gitignore rules). This is the exact failure mode that poisoned the previous codebase.

---

## Definition of done

- [ ] CWS developer account registered ($5 paid) AND DSA trader verification submitted.
- [ ] Domain registered, business email working, DNS on Cloudflare.
- [ ] Fresh Supabase project exists in an EU region; old compromised project untouched/decommissioned; nightly dump job running.
- [ ] Hosting default confirmed (Cloudflare Pages + Supabase Edge Functions; Vercel Pro remains an M-5 fallback only); site deploys.
- [ ] Gemini DEV key created; PROD (paid, billing-enabled) key plan documented; both keys backend-only.
- [ ] Wise Business verified and able to send a test transfer.
- [ ] Analytics tool chosen and account created.
- [ ] Paddle + Polar applications underway per `./03-PAYMENTS-SETUP.md`; repo + CI live per `./04-REPO-AND-FIXTURE-CORPUS.md`.
- [ ] All credentials in the founder's password manager with 2FA; nothing shared.

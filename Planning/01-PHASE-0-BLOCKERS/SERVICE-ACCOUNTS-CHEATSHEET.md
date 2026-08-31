# Service-Account Signup Cheat-Sheet (founder-only actions)

> AI drafted this so you can open each account in minutes. Every step that needs a **login, a payment card, or your identity** is marked **[YOU]**. Everything else is prepared for you.
> Capture every secret into a password manager + into the backend env store (Supabase / GitHub Actions secrets) — **never** into the repo or chat.

## Master secret-intake table (fill as you go)
| Secret | Env-var name (backend) | Where it lives | Status |
|--------|------------------------|----------------|--------|
| Supabase anon key | `SUPABASE_ANON_KEY` | Supabase project → API | [ ] |
| Supabase service-role key | `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → API | [ ] |
| Gemini DEV key | `GEMINI_DEV_KEY` | Google AI Studio | [ ] |
| Gemini PROD key | `GEMINI_PROD_KEY` | Google AI Studio | [ ] |
| Paddle live API key | `PADDLE_API_KEY` | Paddle → Developer → Authentication | [ ] |
| Paddle sandbox API key | `PADDLE_SANDBOX_API_KEY` | Paddle sandbox | [ ] |
| Paddle webhook secret | `PADDLE_WEBHOOK_SECRET` | Paddle → Notifications | [ ] |
| Polar keys + webhook secret | `POLAR_*` | Polar dashboard | [ ] |
| CWS 2FA recovery codes | (password manager only) | Chrome Web Store console | [ ] |
| GitHub Actions secrets | (repo Settings → Secrets) | GitHub | [ ] |

---

## 1. Chrome Web Store — developer + trader verification  **[YOU]**  ($5 one-time)
- URL: `https://chrome.google.com/webstore/devconsole`
- Sign in with your Google account (founder personal or a dedicated `hello@appealdeck.app`).
- Pay the $5 registration fee by card.
- Complete **trader contact verification** (name = Jhangir Hussain, not "Hawlton" as a company).
- Save 2FA recovery codes to password manager.
- Blocks: CWS extension submission (Wk 7–8).

## 2. Domain + business email  **[YOU]**  (~$10–30/yr)
- Register `appealdeck.app` at any ICANN registrar (Namecheap / Porkbun / Cloudflare Registrar).
- Use the same registrar or Cloudflare for DNS (see #4).
- Set up `hello@appealdeck.app` + `support@appealdeck.app` via **Cloudflare Email Routing** (free) → forward to your real inbox.
- Blocks: legal pages, Paddle, CWS trader verification.

## 3. Fresh Supabase project (NEVER the compromised `fogvzjtxbqgfppdrxqra`)  **[YOU]**  ($0 → $25/mo at first sales)
- URL: `https://supabase.com`
- Create a **new** project (new name, e.g. `appealdeck-prod`). Do not reuse the leaked project.
- Copy anon + service-role keys into the intake table.
- Start on Free; upgrade to Pro ($25/mo) only when first sales land.
- Blocks: backend, webhooks, `licenses` table.

## 4. Cloudflare Pages + DNS  **[YOU]**  ($0)
- URL: `https://dash.cloudflare.com`
- Add the `appealdeck.app` zone; point NS from registrar to Cloudflare.
- Deploy the web decoder via **Cloudflare Pages** (connect the GitHub repo; build = `npm run build`).
- Enable **Email Routing** for `hello@` / `support@`.
- Blocks: live site → Paddle approval.

## 5. Google AI Studio / Gemini API — DEV + PROD keys  **[YOU]**
- URL: `https://aistudio.google.com` (keys) — production console `https://console.cloud.google.com`
- Create **two** API keys: one labeled `DEV` (synthetic fixtures only), one `PROD` (paid tier, billing alert set).
- Enable a **budget alert** (e.g. $20/mo) on PROD.
- Key never ships in the extension — backend only.
- Blocks: POA composer (M-5).

## 6. Wise personal account  **[YOU]**  ($0 setup; verification takes days)
- URL: `https://wise.com`
- Open **personal** (Jhangir Hussain, individual), not business.
- Complete ID verification early — it lags.
- This is the MoR payout target (Paddle/Polar pay out here).
- Blocks: receiving revenue.

## 7. Analytics — Plausible or Umami  **[YOU]**  ($0–€9/mo)
- Plausible: `https://plausible.io` (~€9/mo, privacy-first, no cookies).
- Umami: `https://umami.is` (self-host $0 on Cloudflare Pages/Worker).
- Pick one; I will wire the event calls against its script/id once you paste the site ID.
- Blocks: funnel metrics.

## 8. Paddle merchant (primary MoR) + sandbox  **[YOU]**  ($0)
- URL: `https://vendor.paddle.com` (sandbox: `https://sandbox-vendor.paddle.com`)
- Apply as **Individual**. Category = **"Digital products or SaaS"** (never "Human services").
- Use the draft in `PADDLE-APPLICATION-DRAFT.md` — paste it into the application.
- Create a product "Appeal Pass" $199 one-time; capture live + sandbox API keys + **webhook signature secret**.
- Blocks: all revenue.

## 9. Polar (warm fallback)  **[YOU]**  ($0)
- URL: `https://polar.sh`
- Sign up; **verify Pakistan payout via Stripe Connect at signup** before relying on this rail.
- Capture keys + webhook secret.
- Blocks: fallback rail only.

## 10. Dodo Payments (plan-C, open ONLY if triggered)  **[YOU]**  ($0)
- URL: `https://dodopayments.com`
- Open only if Paddle rejects AND Polar payout fails.
- Blocks: last-resort rail.

## 11. GitHub private repo + Actions CI  **[YOU]**  ($0)
- URL: `https://github.com`
- The repo `AppealDeck` already exists and is pushed. Keep it **private** until launch.
- Add the secrets from the intake table under Settings → Secrets → Actions.
- CI already runs at repo root (`.github/workflows/ci.yml`).

---
**Minimal action summary for you:** open the 11 accounts, pay the small fees, paste the captured keys into the intake table + GitHub/Supabase secrets. I do all the code, drafts, and wiring.

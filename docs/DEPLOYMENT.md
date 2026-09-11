# AppealDeck — Vercel Deployment Guide (Hobby / Free Tier)

This guide is the single source of truth for getting AppealDeck onto Vercel Hobby (free) for the first 20 customers. If a step says "founder action", it's a manual click in a dashboard that the AI cannot perform for you.

---

## 1. One-time setup (Vercel)

1. Sign in to https://vercel.com (GitHub OAuth recommended).
2. **New Project** → import the `appealdeck` repo from your GitHub org.
3. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: leave blank (Next.js default)
   - Install Command: `npm ci` (set in `vercel.json` — see file)
4. **Root Directory**: leave at repo root.
5. **Skip the deployment** for now — we set env vars first.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production**, **Preview**, and **Development** scopes (Vercel now has a single "Environment Variables" page; you can scope per-environment in the row editor).

### Required (app will crash without these)

| Variable                                | Source                                 | Production value                                  |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | this file | `https://<project>.vercel.app` now → `https://appealdeck.com` when the domain is connected |
| `NEXT_PUBLIC_MARKETING_HOST` | this file | `<project>.vercel.app` now → `appealdeck.com` later |
| `NEXT_PUBLIC_APP_HOST` | this file | **leave unset** (single host). Set only for a later `app.` split — AGENTS.md "Domain topology" |
| `NEXT_PUBLIC_APP_URL` | this file | **leave unset** (resolves to `NEXT_PUBLIC_SITE_URL` via `src/lib/urls.ts`) |
| `NEXT_PUBLIC_SUPABASE_URL`              | Supabase dashboard                     | `https://<project-ref>.supabase.co`               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Supabase dashboard                     | `eyJ...`                                          |
| `SUPABASE_SERVICE_ROLE_KEY`             | Supabase dashboard                     | `eyJ...` (sensitive — keep "Sensitive" toggle ON) |
| `GEMINI_API_KEY`                        | https://aistudio.google.com/app/apikey | `AIzaSy...` (sensitive)                           |
| `GEMINI_MODEL`                          | optional                               | `gemini-3.5-flash` (default in code)              |
| `UPSTASH_REDIS_REST_URL`                | https://console.upstash.com            | `https://<db>.upstash.io` (sensitive)             |
| `UPSTASH_REDIS_REST_TOKEN`              | Upstash dashboard                      | (sensitive)                                       |
| `PADDLE_WEBHOOK_SECRET`                 | Paddle dashboard → Notifications       | (sensitive)                                       |
| `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS`  | Paddle dashboard → catalog             | `pri_...`                                         |
| `NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB` | Paddle dashboard → catalog             | `pri_...`                                         |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`       | Paddle dashboard → Developer tools     | `live_...`                                        |
| `NEXT_PUBLIC_PADDLE_ENV`                | this file                              | `production`                                      |

### Optional

| Variable                            | Purpose                                 | Notes                                  |
| ----------------------------------- | --------------------------------------- | -------------------------------------- |
| `GEMINI_MODEL_EXTRACT_FIELD`        | override model for `/api/extract-field` | defaults to `gemini-3.5-flash`         |
| `GEMINI_MODEL_CRITIQUE_POA`         | override model for POA critique         | defaults to `gemini-3.5-flash`         |
| `GEMINI_MODEL_PHRASE_ENGINE_OUTPUT` | override model for phrase engine        | defaults to `gemini-3.5-flash-lite`    |
| `GEMINI_MODEL_TRIAGE_ROUTER`        | override model for triage routing       | defaults to `gemini-flash-lite-latest` |

### Never set in Vercel

See `.env.example` "NOT USED BY THE APP" section. The old plan added ~10 unused env vars (Polar, MCP, analytics, `PADDLE_API_KEY`, etc.). Setting them in Vercel is noise — do not set them.

## 3. Domain setup (founder action) — single host, apex only

**First deploy needs no custom domain.** Ship on the Vercel-provided `https://<project>.vercel.app` URL with `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_MARKETING_HOST` set to it and `NEXT_PUBLIC_APP_HOST` / `NEXT_PUBLIC_APP_URL` **unset** — marketing, auth, and the app all serve from that one origin (single-host mode in `src/middleware.ts`).

When you own `appealdeck.com`, follow `AGENTS.md` → "Domain topology" (Vercel apex + `www` → env vars → Supabase redirect URL → Paddle webhook → smoke test). Do **not** add `app.appealdeck.com` unless a concrete need appears; the split is an env-var switch documented there.

## 4. Supabase production setup (founder action)

Already done if you ran the migrations from `AGENTS.md`. Verify:

1. Supabase dashboard → Authentication → URL Configuration
   - Site URL: `https://appealdeck.com`
   - Redirect URLs: `<origin>/auth/callback` for the current single host (the `vercel.app` URL now, the apex later) + `http://localhost:3000/auth/callback` (dev only). No `app.` entry unless the split is switched on.
2. Supabase dashboard → SQL Editor: confirm migrations `0001` through `0008` are applied. If not, copy each `supabase/migrations/*.sql` file and run in order. **`0008_outcome_events.sql` is new as of 11 Sep 2026** (the EF-5 opt-in outcome table) and has not yet been applied to any project — no AI session has direct SQL access, only the REST API, so this one needs a manual copy-paste into the SQL Editor same as the others. Until it's applied, `POST /api/outcome` fails closed (returns an error, writes nothing) rather than crashing.
3. Supabase dashboard → Settings → API: copy `URL`, `anon` key, `service_role` key to Vercel env.

## 5. Paddle production setup (founder action)

1. Paddle dashboard → Catalog → create 2 products:
   - **Appeal Pass** (one-time, $199)
   - **Guardian Subscription** (monthly, TBD)
2. For each product, create a price. Copy the `pri_...` IDs into the env vars above.
3. Paddle dashboard → Developer tools → Authentication: copy the live client token.
4. Paddle dashboard → Notifications → create endpoint:
   - URL: `https://appealdeck.com/api/webhooks/paddle`
   - Events: `transaction.completed`, `subscription.activated`, `subscription.created`, `subscription.canceled`, `subscription.paused`
   - Copy the signing secret into `PADDLE_WEBHOOK_SECRET`.
5. Paddle dashboard → Checkout → Live: confirm your business details (Pakistan Individual seller — set country to PK; Paddle will tell you at checkout which countries can't be sold to and handle VAT for the rest).

## 6. Upstash production setup (founder action)

1. https://console.upstash.com → Create database (free tier, single region, closest to your Vercel region = `us-east-1`).
2. Database details → REST API → copy the `UPSTASH_REDIS_REST_URL` (https form, NOT the rediss:// URL) and `UPSTASH_REDIS_REST_TOKEN` into Vercel.

## 7. Deploy

```bash
git push origin master
```

Vercel will build and deploy automatically. The build takes ~60-90s.

- Preview deployments: every PR gets its own `appealdeck-git-<branch>-<user>.vercel.app` URL.
- Production: pushes to `master` deploy to your production domain.

## 8. Vercel Hobby constraints (this is what makes "free tier" tricky)

Vercel Hobby has hard limits we already respect in `vercel.json` and the codebase:

| Limit                    | Hobby value                                  | Where we set it                         | Why                                                                                                                                       |
| ------------------------ | -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Function max duration    | 10s default; 30s on Hobby with `maxDuration` | `vercel.json` `functions.*.maxDuration` | Paddle webhook can take up to 10s for crypto signature + Supabase roundtrip; extract-field has 8s Gemini timeout in code so 15s is enough |
| Serverless function size | 50MB (unzipped)                              | not at risk                             | Our routes are <5MB each                                                                                                                  |
| Build timeout            | 45 min                                       | not at risk                             | Builds take ~90s                                                                                                                          |
| Edge function size       | 1MB                                          | not using Edge                          | All functions are Node.js                                                                                                                 |
| Concurrent executions    | 1000                                         | not at risk                             | We have 1 customer                                                                                                                        |
| Bandwidth                | 100GB/mo                                     | not at risk                             | We have 1 customer                                                                                                                        |
| Serverless invocations   | 1M/mo                                        | not at risk                             | We have 1 customer                                                                                                                        |
| Preview deployments      | unlimited                                    | not at risk                             | Hobby is generous here                                                                                                                    |
| Cron jobs                | 0 (Hobby has none)                           | not used                                | We don't have any                                                                                                                         |
| Team members             | 1 (Hobby)                                    | founder-only                            | OK at this stage                                                                                                                          |

**What we are NOT doing on Vercel Hobby:**

- No background workers / cron / long-running tasks (we have none).
- No file uploads > 4.5MB (Vercel body limit on Hobby). The vault uploads go directly from the browser to Supabase Storage, NOT through Vercel — so this doesn't apply.
- No edge functions (we use Node.js runtime, all `route.ts` files default to Node).

## 9. Post-deploy verification (founder action)

After first deployment:

1. Visit `https://appealdeck.com/` — should show marketing home.
2. Visit `https://appealdeck.com/decode` — paste a real Amazon notice, click decode, should return classification.
3. Visit `https://appealdeck.com/login` — sign in with dev account.
4. Visit `https://app.appealdeck.com/case` — should show Guided Interview (license-gated; dev user has the dev license row).
5. In the interview, type into a `short_text` field, click "Suggest fields (AI)" — should return `ok:true` with real Gemini suggestions.
6. Open browser DevTools → Network → trigger /api/extract-field. Response should be 200, not 503/429 (Upstash breaker is engaged but the spend cap is 240/day).
7. Paddle webhook test: in Paddle dashboard → Notifications → test event → `transaction.completed` with a sandbox customer email. Check `licenses` table in Supabase for the new row.
8. Run Lighthouse on `https://appealdeck.com/`: perf ≥ 0.9, a11y/bp/seo ≥ 0.95 (CI enforces this on every PR).

If all 8 pass, you're live on Vercel free tier.

## 10. When to leave Vercel Hobby

Migrate to Vercel Pro ($20/mo per member) when ANY of these become true:

- 1 paying customer in production AND you need > 100GB bandwidth / > 1M invocations / cron jobs.
- You need team collaboration (Pro allows 5 seats).
- You need commercial ToS coverage (Hobby is fine for non-commercial; for paid SaaS, Pro is the correct tier even if you don't need the features).

**Do not run a paid SaaS on Vercel Hobby in production.** Vercel's ToS permits it technically, but the lack of commercial-grade SLA + no team seats + no audit log makes it an operational risk for any business that takes real money. Pro is the correct tier once you have ≥ 1 paying customer.

## 11. Rollback

Vercel keeps every deployment. If a release breaks:

1. Vercel dashboard → Deployments → find the last green one.
2. Click ⋯ → "Promote to Production" — instant rollback.
3. Revert the breaking commit on `master` and push.

## 12. What this guide does NOT cover

- Analytics (Plausible/Umami) — not yet wired. Plan: add `<Script>` tag in marketing pages, use `NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC` env. Estimated: 1 hour.
- Error tracking (Sentry) — not wired. Plan: `@sentry/nextjs` + DSN env var. Estimated: 2 hours.
- E&O insurance — separate from hosting. See AGENTS.md Gate 2.
- GDPR Art. 30 records — separate from hosting. See AGENTS.md Gate 2.

These are non-blocking for first deployment; they become blocking when first real customer pays.

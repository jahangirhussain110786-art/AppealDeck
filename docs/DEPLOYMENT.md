> **18 Sep 2026 update:** Before deployment, follow the current requirements in [the integrity handoff](handoffs/2026-09-18-integrity-fixes.md#deployment-requirements-and-remaining-external-limits). Apply migrations 0009 and 0010; configure the checkout price/webhook and durable email worker. Production rate limiting now fails closed. Historical setup details below must be read with this update.

# AppealDeck — Vercel Deployment Guide

This guide is the single source of truth for getting AppealDeck onto Vercel. If a step says "founder action", it's a manual click in a dashboard that the AI cannot perform for you.

> **Corrected 23 Sep 2026 — use Vercel Pro, not Hobby.** This guide was written for Hobby "for the first 20 customers". Vercel's own Hobby page (checked 23 Sep 2026, last updated 14 Sep 2026) says the Hobby plan "restricts users to non-commercial, personal use only" (https://vercel.com/docs/plans/hobby). AppealDeck takes payment, so it is commercial from its first sale. Section 8 also described limits that were stale or untrue for this app: see the corrected table there.

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

| Variable                                | Source                                 | Production value                                                                               |
| --------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | this file                              | `https://<project>.vercel.app` now → `https://appealdeck.com` when the domain is connected     |
| `NEXT_PUBLIC_MARKETING_HOST`            | this file                              | `<project>.vercel.app` now → `appealdeck.com` later                                            |
| `NEXT_PUBLIC_APP_HOST`                  | this file                              | **leave unset** (single host). Set only for a later `app.` split — AGENTS.md "Domain topology" |
| `NEXT_PUBLIC_APP_URL`                   | this file                              | **leave unset** (resolves to `NEXT_PUBLIC_SITE_URL` via `src/lib/urls.ts`)                     |
| `NEXT_PUBLIC_SUPABASE_URL`              | Supabase dashboard                     | `https://<project-ref>.supabase.co`                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Supabase dashboard                     | `eyJ...`                                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`             | Supabase dashboard                     | `eyJ...` (sensitive — keep "Sensitive" toggle ON)                                              |
| `GEMINI_API_KEY`                        | https://aistudio.google.com/app/apikey | `AIzaSy...` (sensitive)                                                                        |
| `GEMINI_MODEL`                          | optional                               | `gemini-3.5-flash` (default in code)                                                           |
| `UPSTASH_REDIS_REST_URL`                | https://console.upstash.com            | `https://<db>.upstash.io` (sensitive)                                                          |
| `UPSTASH_REDIS_REST_TOKEN`              | Upstash dashboard                      | (sensitive)                                                                                    |
| `PADDLE_WEBHOOK_SECRET`                 | Paddle dashboard → Notifications       | (sensitive)                                                                                    |
| `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS`  | Paddle dashboard → catalog             | `pri_...`                                                                                      |
| `NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB` | Paddle dashboard → catalog             | `pri_...`                                                                                      |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`       | Paddle dashboard → Developer tools     | `live_...`                                                                                     |
| `NEXT_PUBLIC_PADDLE_ENV`                | this file                              | `production`                                                                                   |

### Optional

| Variable                            | Purpose                                 | Notes                                  |
| ----------------------------------- | --------------------------------------- | -------------------------------------- |
| `GEMINI_MODEL_READ_DOCUMENT`        | override model for `/api/read-document` | defaults to `gemini-3.5-flash`         |
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
2. Supabase dashboard → SQL Editor: migrations `0001` through `0011` are **all applied** as of 22 Sep 2026. The founder applied `0008_outcome_events.sql` and `0011_case_reminders.sql` by hand that day, the last two outstanding; every migration is manual copy-paste, because no AI session has direct SQL access to this project — only the REST API, which cannot execute DDL.

   Verified the same day against the live project by REST probe, not by assumption: every column present with no drift, RLS on with anon reads empty and anon inserts refused (401), the `CHECK` constraints rejecting an out-of-range `readiness_at_submit` and an unknown `outcome`, the `(user_id, case_ref)` unique index collapsing a re-set reminder into one row instead of duplicating it, and the cron's own due-row query returning what it should. Every row written by that check was deleted again; both tables hold 0 rows.

   Email reminders still need `RESEND_API_KEY` and `CRON_SECRET` (the latter shared with the purchase-email job) on the deployed project. Without the key no reminder email is sent and the feature stays visibly off rather than silently failing; the reminder date still saves to the seller's vault and still shows on the page either way.

3. Supabase dashboard → Settings → API: copy `URL`, `anon` key, `service_role` key to Vercel env.

## 5. Paddle production setup (founder action)

1. Paddle dashboard → Catalog → create 2 products:
   - **Appeal Pass** (one-time, $249 — flat, worldwide, no country tiering; 21 Sep 2026 commercial reset)
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

## 6a. Backups and the support address (founder action) — do these before the first sale

**Two GitHub repository secrets** (Settings → Secrets and variables → Actions → New repository
secret). Until both exist, `.github/workflows/backup.yml` **fails every night on purpose**: a backup
job that reports success while writing nothing is the failure this is meant to prevent, so it is
built to be noisy rather than quietly useless.

| Secret              | Where to get it                                                                               | Why                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `SUPABASE_DB_URL`   | Supabase → Project Settings → Database → Connection string (URI), with the password filled in | The nightly `supabase db dump --data-only` reads through this.                                            |
| `BACKUP_PASSPHRASE` | Generate a long random string and **store it in your password manager, not in this repo**     | The dump is encrypted with it. Lose it and the backups are unopenable — which is the same as having none. |

Then run the workflow once by hand (Actions → Backup → Run workflow) and confirm it goes green. It
verifies the dump is not empty and that the encrypted file decrypts with that passphrase, because a
backup nobody has ever opened is not a backup.

**What this protects:** `licenses`, per-case entitlements, `outcome_events` and `case_reminders` —
the rows only the server holds. The vault is local-first and has no server copy by design, so no
seller document is in scope. Losing the licence table means every paying customer loses access to
the case they bought, with no record on this side of what they are owed.

**To restore:** download the artifact, then
`gpg --decrypt --passphrase '<passphrase>' -o backup.sql backup.sql.gpg` and replay it with `psql`
against the target database.

**Support address.** `/support` names `support@appealdeck.com` and states a reply window of two
business days. Create that mailbox (or alias it to one you read) before the page is public, and
change the window in `src/content/support.ts` if two business days is not what you can actually
hold to. A stated window you miss is worse than a longer one you keep.

**Restore drill — once, before the first sale.** Added 24 Sep 2026: a backup that decrypts has not
yet been shown to restore. Create a scratch Supabase project, replay one real dump into it with the
commands above, and confirm that `licenses` (which carries each per-case entitlement in `case_id`),
`checkout_intents`, `payment_events`, `payment_adjustments`, `license_devices`, `outcome_events` and
`case_reminders` hold the same row counts as production. Write the date and the counts here. Then
delete the scratch project.

## 6b. The AI provider's billing tier (founder action) — before the first real document

The privacy policy tells sellers that Google does not use what we send to improve its products and
keeps it for up to 55 days only to detect abuse. **That is true of the Gemini API's paid tier only.**
On the free tier Google may use prompts and documents to improve its products — including a seller's
supplier invoice. An API key does not show which tier it is on; the Google Cloud project behind it
does. Before any seller checks a real document:

1. Open https://aistudio.google.com/app/apikey and note which Google Cloud project the production
   `GEMINI_API_KEY` belongs to.
2. In https://console.cloud.google.com/billing, confirm that project is linked to an active billing
   account. In AI Studio the key should show a paid tier, not "Free".
3. Keep development keys (D9: free tier, dev fixtures only) in a **different** project, so a seller's
   document can never reach a free-tier key.

If the production project is not on a paid tier, the privacy policy is untrue until it is.

## 7. Deploy

```bash
git push origin master
```

Vercel will build and deploy automatically. The build takes ~60-90s.

- Preview deployments: every PR gets its own `appealdeck-git-<branch>-<user>.vercel.app` URL.
- Production: pushes to `master` deploy to your production domain.

## 8. Vercel limits that matter to this app

Corrected 23 Sep 2026. The previous version of this table said Hobby had no cron jobs and that "we don't have any", and that uploads went "directly from the browser to Supabase Storage, NOT through Vercel". Neither was true. `vercel.json` schedules two daily jobs, and the vault is in the seller's browser (IndexedDB), with no storage upload at all. The one path that does send a file to Vercel is the document check, `/api/read-document`.

| Limit                 | What applies                                                                  | Where it is handled                                                                                              |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Commercial use        | Hobby is non-commercial and personal only. Use **Pro** before the first sale. | Founder action: plan choice                                                                                      |
| Request body size     | 4.5 MB per function request                                                   | `src/lib/documentChecks/limits.ts`: files over 3 MB are refused in the browser with a reason, before any request |
| Function max duration | 300 s default on both plans (Vercel docs, 14 Sep 2026)                        | `vercel.json` `functions`; read-document has its own Gemini timeout                                              |
| Cron jobs             | Two daily jobs: purchase emails at 03:00 UTC, case reminders at 08:00 UTC     | `vercel.json` `crons`; both need `CRON_SECRET`                                                                   |
| Runtime               | Node.js for every route; no edge functions                                    | default for `route.ts`                                                                                           |

`npm run lint:reachability` fails if a `vercel.json` `functions` entry or cron names a route that no longer exists. A `functions` pattern that matches no function can fail the deployment, and one did exist here: a duration for `extract-field`, deleted on 22 Sep 2026, was still configured until 23 Sep.

## 9. Post-deploy verification (founder action)

After first deployment:

1. Visit `https://appealdeck.com/` — should show marketing home.
2. Visit `https://appealdeck.com/decode` — paste a real Amazon notice, click decode, should return classification.
3. Visit `https://appealdeck.com/login` — sign in with dev account.
4. Visit `https://appealdeck.com/case` — should show the case workspace. (The guided interview and its "Suggest fields (AI)" button were retired on 22 Sep 2026, and the app runs on a single host, so there is no `app.` subdomain to check.)
5. In the workspace, confirm a request whose notice gives a dated deadline (for example "submit your appeal by 1 October 2026"), then open the dashboard: that date should appear in the card at the top, along with any follow-up date you set.
6. Open browser DevTools → Network → attach a business document under 3 MB to a record in the case workspace, then press **Check this document** to trigger /api/read-document. (Attaching alone sends nothing.) Response should be 200, not 503/429 (Upstash breaker is engaged but the spend cap is 240/day). The result should list each field with what was read, and a date field should say "Compared with: Today's date, …". A file over 3 MB should be refused in the page with its size and the limit, and make no request. Attach an identity photo to an identity record and check it: there should be **no** request to /api/read-document at all.
7. Paddle webhook test: in Paddle dashboard → Notifications → test event → `transaction.completed` with a sandbox customer email. Check `licenses` table in Supabase for the new row.
8. Run Lighthouse on `https://appealdeck.com/`: perf ≥ 0.9, a11y/bp/seo ≥ 0.95 (CI enforces this on every PR).
9. **Purchase confirmation email** (D8 — the checkout promises it): after step 7 with a real inbox, confirm the email arrives. Needs `RESEND_API_KEY`.
10. **Refund and revocation**: refund that sandbox transaction in Paddle, then confirm the licence row changes status and the case's paid features lock again.
11. **Reminder email**: on a signed-in case, set a follow-up date for today and turn email reminders on, then run the cron by hand (`curl -H "Authorization: Bearer $CRON_SECRET" https://appealdeck.com/api/jobs/case-reminders`) and confirm the email arrives. Needs `RESEND_API_KEY` and `CRON_SECRET`.
12. **Support mailbox**: send a message to the address on `/support` and confirm you receive it.

If all 12 pass, and §6a's restore drill and §6b's billing check are done, you're live.

## 10. Which Vercel plan

**Pro ($20 per developer seat per month, checked 23 Sep 2026), from before the first paying customer.** The previous version of this section said Vercel's terms "permit it technically" to run a paid product on Hobby. They do not: Vercel's Hobby page states the plan is for non-commercial, personal use only. Hobby is fine for a private preview nobody pays for; the switch has to happen before checkout is live, not after the first sale.

## 10a. Framework version (planned work, not yet done)

The app runs Next.js 14 (`package.json`: `^14.2.5`). Next.js's support policy (checked 23 Sep 2026) lists 14.x as unsupported: 16.x is Active LTS and 15.x is Maintenance LTS, receiving only critical fixes and security updates. No specific vulnerability is known here, but an unsupported framework stops receiving security patches. Upgrading is a pass of its own, because 15 changes how request data is read in server code and moves to React 19. Plan it before launch, not as a side change.

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

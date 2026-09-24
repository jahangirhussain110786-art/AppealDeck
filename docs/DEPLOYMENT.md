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

| Variable                               | Source                                 | Production value                                                                               |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | this file                              | `https://<project>.vercel.app` now → `https://appealdeck.com` when the domain is connected     |
| `NEXT_PUBLIC_MARKETING_HOST`           | this file                              | `<project>.vercel.app` now → `appealdeck.com` later                                            |
| `NEXT_PUBLIC_APP_HOST`                 | this file                              | **leave unset** (single host). Set only for a later `app.` split — AGENTS.md "Domain topology" |
| `NEXT_PUBLIC_APP_URL`                  | this file                              | **leave unset** (resolves to `NEXT_PUBLIC_SITE_URL` via `src/lib/urls.ts`)                     |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase dashboard                     | `https://<project-ref>.supabase.co`                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Supabase dashboard                     | `eyJ...`                                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase dashboard                     | `eyJ...` (sensitive — keep "Sensitive" toggle ON)                                              |
| `GEMINI_API_KEY`                       | https://aistudio.google.com/app/apikey | `AIzaSy...` (sensitive)                                                                        |
| `GEMINI_MODEL`                         | optional                               | `gemini-3.5-flash` (default in code)                                                           |
| `UPSTASH_REDIS_REST_URL`               | https://console.upstash.com            | `https://<db>.upstash.io` (sensitive)                                                          |
| `UPSTASH_REDIS_REST_TOKEN`             | Upstash dashboard                      | (sensitive)                                                                                    |
| `PADDLE_WEBHOOK_SECRET`                | Paddle dashboard → Notifications       | (sensitive)                                                                                    |
| `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS` | Paddle dashboard → catalog             | `pri_...`                                                                                      |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`      | Paddle dashboard → Developer tools     | `live_...`                                                                                     |
| `NEXT_PUBLIC_PADDLE_ENV`               | this file                              | `production`                                                                                   |

### Required for a feature (the app runs without them; that feature does not)

Added 24 Sep 2026. These were missing from this guide, so following it would have shipped the confirmation email, the reminder emails and the funnel analytics switched off.

| Variable                       | Feature                                           | Notes                                                                                     |
| ------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`               | Purchase confirmation email (D8), reminder emails | Without it purchases still provision; unsent confirmations wait in the outbox for retry.  |
| `EMAIL_FROM`                   | Sender for both emails                            | Defaults to `AppealDeck <billing@appealdeck.com>`; the domain must be verified in Resend. |
| `CRON_SECRET`                  | Both daily jobs (`vercel.json` crons)             | A long random string. Without it both jobs refuse every call, so no email is ever sent.   |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Cookieless funnel analytics                       | The site's domain as registered in Plausible. Without it no event is sent.                |
| `GEMINI_PAID_TIER_CONFIRMED`   | Document checks and wording help                  | Set to `true` only after §6b. In production every Gemini call is refused until it is set. |

### Optional

| Variable                       | Purpose                                | Notes                          |
| ------------------------------ | -------------------------------------- | ------------------------------ |
| `GEMINI_MODEL_READ_DOCUMENT`   | override the model for document checks | defaults to `gemini-3.5-flash` |
| `GEMINI_MODEL_IMPROVE_WORDING` | override the model for wording help    | defaults to `gemini-3.5-flash` |

Overrides exist only for tasks the app calls. The three earlier listed here (`CRITIQUE_POA`, `PHRASE_ENGINE_OUTPUT`, `TRIAGE_ROUTER`) belonged to tasks that were never called, and setting them did nothing; removed 24 Sep 2026.

### Never set in Vercel

See `.env.example` "NOT USED BY THE APP" section. The old plan added ~10 unused env vars (Polar, MCP, `PADDLE_API_KEY`, etc.; analytics is used now — `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` above). Setting them in Vercel is noise — do not set them.

## 3. Domain setup (founder action) — single host, apex only

**First deploy needs no custom domain.** Ship on the Vercel-provided `https://<project>.vercel.app` URL with `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_MARKETING_HOST` set to it and `NEXT_PUBLIC_APP_HOST` / `NEXT_PUBLIC_APP_URL` **unset** — marketing, auth, and the app all serve from that one origin (single-host mode in `src/proxy.ts`).

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

4. Only then set `GEMINI_PAID_TIER_CONFIRMED=true` in Vercel (Production). Until it is set, the app
   refuses every Gemini call in production — document checks and wording help say they are switched
   off — so forgetting this step turns the features off instead of breaking the privacy promise. No
   code can tell a free key from a paid one, which is why this is a written confirmation, not a check.

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
13. **Wording help** (24 Sep 2026): on a paid case, write a few sentences in the root cause box and press **Improve the wording**. A suggestion should appear beside your text, and nothing should change until you press **Use the suggested wording**. Needs `GEMINI_PAID_TIER_CONFIRMED=true` (§6b); without it the page says wording help is not available.
14. **Saved document check** (24 Sep 2026): after step 6, reload the case. The check should still show, with the day it ran.
15. **Uptime monitor** (24 Sep 2026): add one free HTTP monitor (Better Stack, UptimeRobot or similar) on `https://appealdeck.com/` that emails you when it stops answering. It sees only whether the page loads, never a seller's data. Error tracking (Sentry and the like) is deliberately not added: it would capture notice text unless scrubbed, which is a new place seller data would go and would need a privacy-policy line first.

If all 15 pass, and §6a's restore drill and §6b's billing check are done, you're live.

## 10. Which Vercel plan

**Pro ($20 per developer seat per month, checked 23 Sep 2026), from before the first paying customer.** The previous version of this section said Vercel's terms "permit it technically" to run a paid product on Hobby. They do not: Vercel's Hobby page states the plan is for non-commercial, personal use only. Hobby is fine for a private preview nobody pays for; the switch has to happen before checkout is live, not after the first sale.

## 10a. Framework version

**Upgraded 24 Sep 2026 to Next.js 16.3.6 and React 19** (from 14.2 and 18). 14.x was unsupported; 15.x was only on maintenance, and its window closes about two years after its October 2024 release, so 16 — the Active LTS line — was the only upgrade that would not need repeating within weeks. What changed:

- `cookies()` is awaited (`src/lib/supabase/server.ts`), so `createSupabaseServerClient()` is async and every caller awaits it.
- `src/middleware.ts` is `src/proxy.ts`, exporting `proxy` — Next.js 16's name for the same thing. It is still listed as "Proxy (Middleware)" in the build output.
- `next lint` was removed in 16. ESLint 9 runs through its own CLI with a flat config (`eslint.config.mjs`); `npm run lint` is `eslint src`.
- Builds use Turbopack, the new default. `tsconfig.json` now uses `"jsx": "react-jsx"` (set by Next), and `npm run typecheck` runs `next typegen` first so the generated route types exist on a fresh checkout.

**React Compiler lint rules.** eslint-config-next 16 added rules that flagged 18 existing places — mostly an effect that set state once on mount, a few refs written during render, and one `Date.now()` in render. All were fixed the same day (derived values, `useSyncExternalStore` for online status and the theme icon, lazy initial state, effects for latest-callback refs), none by switching a rule off. `npm run lint` now fails on any warning.

**Node.js 24.** `package.json` pins `"engines": { "node": "24.x" }`, which Vercel follows, and CI runs 24. CI ran Node 20 until this upgrade; Node 20 reached end of life in April 2026, and it also had no global `navigator`, which is why `persistence.test.ts` crashed on CI but not locally.

**CI had been red since at least 23 Sep, unnoticed.** Fixed in the same pass, and each one was a real defect that only CI's environment (no `.env.local`, Linux, Node 20) exposed:

- `requireUser` validated the return path against the raw `NEXT_PUBLIC_APP_URL`, which this guide tells you to leave unset. With it unset, every signed-out visitor sent to sign in from `/billing` or `/compose` came back to `/dashboard`. It now uses `APP_URL` from `src/lib/urls.ts`.
- `/reset-password` did nothing when no auth backend was configured, leaving a form that could not work. It now sends the visitor to sign-in.
- `/faq` scored 0.98 for accessibility: the topic tabs had an `aria-label` that left out their visible hint text, and the panel heading skipped from `h1` to `h3`.

Watch the Actions tab after each push. A red CI that nobody reads is how three real defects survived for days.

**On the first deploy after the upgrade,** a browser tab still open from the old build can send one navigation request the new server cannot parse ("The router state header was sent but could not be parsed", a 500). Reloading the tab clears it. Vercel's Skew Protection (Project → Settings → Advanced) prevents it for later deploys.

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

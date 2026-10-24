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

| Variable                               | Source                                 | Production value                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | this file                              | `https://<project>.vercel.app` now → `https://appealdeck.com` when the domain is connected. If unset, the code falls back to `https://appealdeck.com` for canonicals, the sitemap and social cards, so set it even on the `vercel.app` address                                                                                                                                   |
| `NEXT_PUBLIC_MARKETING_HOST`           | this file                              | `<project>.vercel.app` now → `appealdeck.com` later                                                                                                                                                                                                                                                                                                                              |
| `NEXT_PUBLIC_PLANS_PREVIEW`            | this file                              | **Leave unset.** Products that are not on sale yet (the Account Pass, the AI document review, the credit packs and the Pro plan) are still shown on `/pricing` and `/for-professionals` with their price and a disabled "Opens soon" button. Set it to `off` to hide them until their Paddle price is set. Showing is never selling: every purchase still needs its Paddle price |
| `NEXT_PUBLIC_APP_HOST`                 | this file                              | **leave unset** (single host). Set only for a later `app.` split — AGENTS.md "Domain topology"                                                                                                                                                                                                                                                                                   |
| `NEXT_PUBLIC_APP_URL`                  | this file                              | **leave unset** (resolves to `NEXT_PUBLIC_SITE_URL` via `src/lib/urls.ts`)                                                                                                                                                                                                                                                                                                       |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase dashboard                     | `https://<project-ref>.supabase.co`                                                                                                                                                                                                                                                                                                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Supabase dashboard                     | `eyJ...`                                                                                                                                                                                                                                                                                                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase dashboard                     | `eyJ...` (sensitive — keep "Sensitive" toggle ON)                                                                                                                                                                                                                                                                                                                                |
| `GEMINI_API_KEY`                       | https://aistudio.google.com/app/apikey | `AIzaSy...` (sensitive)                                                                                                                                                                                                                                                                                                                                                          |
| `GEMINI_MODEL`                         | optional                               | `gemini-3.5-flash` (default in code)                                                                                                                                                                                                                                                                                                                                             |
| `UPSTASH_REDIS_REST_URL`               | https://console.upstash.com            | `https://<db>.upstash.io` (sensitive)                                                                                                                                                                                                                                                                                                                                            |
| `UPSTASH_REDIS_REST_TOKEN`             | Upstash dashboard                      | (sensitive)                                                                                                                                                                                                                                                                                                                                                                      |
| `PADDLE_WEBHOOK_SECRET`                | Paddle dashboard → Notifications       | (sensitive)                                                                                                                                                                                                                                                                                                                                                                      |
| `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS` | Paddle dashboard → catalog             | `pri_...`                                                                                                                                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`      | Paddle dashboard → Developer tools     | `live_...`                                                                                                                                                                                                                                                                                                                                                                       |
| `NEXT_PUBLIC_PADDLE_ENV`               | this file                              | `production`                                                                                                                                                                                                                                                                                                                                                                     |

### Required for a feature (the app runs without them; that feature does not)

Added 24 Sep 2026. These were missing from this guide, so following it would have shipped the confirmation email, the reminder emails and the funnel analytics switched off.

| Variable                       | Feature                                           | Notes                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`               | Purchase confirmation email (D8), reminder emails | Without it purchases still provision; unsent confirmations wait in the outbox for retry.                                                                                                                                      |
| `OPS_ALERT_EMAIL`              | Daily ops digest (`/api/jobs/ops-digest`)         | Your own address. Emailed only when a paid checkout could not be matched, or an email keeps failing. Unset: logged as an error line. Point a free uptime monitor at `/api/health` (200 when the database and limiter answer). |
| `EMAIL_FROM`                   | Sender for both emails                            | Defaults to `AppealDeck <billing@appealdeck.com>`; the domain must be verified in Resend.                                                                                                                                     |
| `CRON_SECRET`                  | Both daily jobs (`vercel.json` crons)             | A long random string. Without it both jobs refuse every call, so no email is ever sent.                                                                                                                                       |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Cookieless funnel analytics                       | The site's domain as registered in Plausible. Without it no event is sent.                                                                                                                                                    |
| `GEMINI_PAID_TIER_CONFIRMED`   | Document checks and wording help                  | Set to `true` only after §6b. In production every Gemini call is refused until it is set.                                                                                                                                     |

### Optional

| Variable                       | Purpose                                                             | Notes                                                        |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `GEMINI_MODEL_READ_DOCUMENT`   | override the model for document checks                              | defaults to `gemini-3.5-flash`                               |
| `GEMINI_MODEL_IMPROVE_WORDING` | override the model for wording help                                 | defaults to `gemini-3.5-flash`                               |
| `GEMINI_FALLBACK_MODEL`        | asked once when the main model is busy, stalls or is over its quota | defaults to `gemini-3-flash-preview`; `none` switches it off |

Overrides exist only for tasks the app calls. The three earlier listed here (`CRITIQUE_POA`, `PHRASE_ENGINE_OUTPUT`, `TRIAGE_ROUTER`) belonged to tasks that were never called, and setting them did nothing; removed 24 Sep 2026.

### Never set in Vercel

See `.env.example` "NOT USED BY THE APP" section. The old plan added ~10 unused env vars (Polar, MCP, `PADDLE_API_KEY`, etc.; analytics is used now — `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` above). Setting them in Vercel is noise — do not set them.

## 3. Domain setup (founder action) — single host, apex only

**First deploy needs no custom domain.** Ship on the Vercel-provided `https://<project>.vercel.app` URL with `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_MARKETING_HOST` set to it and `NEXT_PUBLIC_APP_HOST` / `NEXT_PUBLIC_APP_URL` **unset** — marketing, auth, and the app all serve from that one origin (single-host mode in `src/proxy.ts`).

When you are ready to move to `appealdeck.com` (buy the domain first if you have not), follow `AGENTS.md` → "Domain topology" (Vercel apex + `www` → env vars → Supabase redirect URL → Paddle webhook → smoke test). **Still pending when you switch domain (PARKED-ITEMS F-19, F-20):** the guest reminder needs migration `0022`, `RESEND_API_KEY` (sending address verified on the new domain) and Upstash, and its email links are built from `NEXT_PUBLIC_SITE_URL`; One Response needs migrations `0020` and `0021` and its two Paddle prices. Do **not** add `app.appealdeck.com` unless a concrete need appears; the split is an env-var switch documented there.

## 4. Supabase production setup (founder action)

Already done if you ran the migrations from `AGENTS.md`. Verify:

1. Supabase dashboard → Authentication → URL Configuration
   - Site URL: `https://appealdeck.com`
   - Redirect URLs: `<origin>/auth/callback` for the current single host (the `vercel.app` URL now, the apex later) + `http://localhost:3000/auth/callback` (dev only). No `app.` entry unless the split is switched on.
2. Supabase dashboard → SQL Editor: migrations `0001` through `0015` are **all applied**; **`0016_revoke_anon_licence_reads.sql` (7 Oct 2026) is written and not yet applied** — optional defence in depth, paste it into the SQL Editor when convenient (it only removes anonymous read access to `licenses` and `license_events`, which RLS already empties) (`0012` on 6 Oct 2026; `0013`, `0014` and `0015` on 7 Oct 2026, from this machine through the session pooler, each followed by a rolled-back smoke test; `0014` makes a second payment for a case that already has a Pass park in `payment_events_unmatched` so you can refund it, and `0015` hardens the follow-ups). Through `0011` they were applied by hand as of 22 Sep 2026. The founder applied `0008_outcome_events.sql` and `0011_case_reminders.sql` by hand that day, the last two outstanding; every migration is manual copy-paste, because no AI session has direct SQL access to this project — only the REST API, which cannot execute DDL.

   Verified the same day against the live project by REST probe, not by assumption: every column present with no drift, RLS on with anon reads empty and anon inserts refused (401), the `CHECK` constraints rejecting an out-of-range `readiness_at_submit` and an unknown `outcome`, the `(user_id, case_ref)` unique index collapsing a re-set reminder into one row instead of duplicating it, and the cron's own due-row query returning what it should. Every row written by that check was deleted again; both tables hold 0 rows.

   Email reminders still need `RESEND_API_KEY` and `CRON_SECRET` (the latter shared with the purchase-email job) on the deployed project. Without the key no reminder email is sent and the feature stays visibly off rather than silently failing; the reminder date still saves to the seller's vault and still shows on the page either way.

3. Supabase dashboard → Settings → API: copy `URL`, `anon` key, `service_role` key to Vercel env.
4. **Custom SMTP (added 28 Sep 2026; do it before launch).** Magic-link sign-in and password reset go out through Supabase's built-in mailer, which sends only a few emails an hour for the whole project. Once the limit is used up, the next seller's sign-in link simply never arrives. Supabase → Authentication → Emails → SMTP Settings → enable custom SMTP with your Resend account: host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API key, sender = an address on the domain you verified in Resend (for example `AppealDeck <login@appealdeck.com>`). Then raise the email rate limit under Authentication → Rate Limits, and send yourself one magic link to confirm it arrives.
5. **Google sign-in:** in the Google Cloud OAuth client used by Supabase → Authentication → Providers → Google, the authorised redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback`, and the production origin must be listed under authorised JavaScript origins. Sign in with Google once on the deployed site.

## 5. Paddle production setup (founder action)

**Quick way (10 Oct 2026):** steps 1–4 below are done by one command you run yourself, with your live key (never give the key to an AI):
`PADDLE_LIVE_KEY=<live key> SITE_URL=https://appealdeck.com node scripts/setup-paddle-live.mjs`. It creates the $249 product and price, the client token and the webhook, and saves the four settings to Vercel production. Then redeploy. Steps 5, 5a and 5b (business details, default payment link, blocked countries) and website approval still need the Paddle dashboard.

1. Paddle dashboard → Catalog → create 1 product:
   - **Appeal Pass** (one-time, $249 — flat, worldwide, no country tiering; 21 Sep 2026 commercial reset)
   - _Corrected 28 Sep 2026:_ this step used to add a **Guardian Subscription** product. Guardian is deferred (D7) and nothing in the app sells it, so do not create it.
2. Create the price. Copy the `pri_...` ID into `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS`.
3. Paddle dashboard → Developer tools → Authentication: copy the live client token.
4. Paddle dashboard → Notifications → create endpoint:
   - URL: `https://appealdeck.com/api/webhooks/paddle`
   - Events: `transaction.completed`, `adjustment.created`, `adjustment.updated`
   - Copy the signing secret into `PADDLE_WEBHOOK_SECRET`.
   - _Corrected 28 Sep 2026:_ this list used to name five `subscription.*` events. `apply_paddle_event` (migration `0009`) grants a Pass on `transaction.completed` and removes it on an `adjustment.*` refund or chargeback, and ignores the subscription events. Following the old list, a refunded buyer would have kept the Pass.
     5b. **Where the Pass is sold (7 Oct 2026).** The founder decided to sell to the US first and Saudi Arabia next, and not to the EU, EEA or UK yet. Our checkout refuses those countries by the request's location (`BLOCKED_PURCHASE_COUNTRIES`, default the EU, EEA and UK; `none` opens them). Also restrict them in Paddle (Checkout settings, or the product's country availability) so a VPN or a direct overlay call cannot get round it. The free decoder stays open everywhere.
     5a. **Default payment link (found 7 Oct 2026, in the sandbox).** Paddle dashboard → Checkout → Checkout settings → **Default payment link**: set it to `https://appealdeck.com/pricing` (the page that opens the checkout), in the sandbox and again in live. Without it the overlay opens and then fails with `transaction_default_checkout_url_not_set`, and no seller can pay. Paddle may also require the domain to be approved before live checkout works; check Paddle dashboard → Checkout → Website approval when you set up live.
5. Paddle dashboard → Checkout → Live: confirm your business details (Pakistan Individual seller — set country to PK; Paddle will tell you at checkout which countries can't be sold to and handle VAT for the rest).

## 5c. Partner codes and commission ledger (24 Oct 2026)

The complete referral implementation is built locally, **off until configured**. Follow [the activation and payout runbook](handoffs/2026-10-24-referral-activation.md) before the first automated attribution. The older manual program remains available with the switch off; it does not become a verified commission ledger by itself.

1. Identify applied migrations; apply missing numbered migrations through `0023_referral_ledger.sql` in order, before enabling the switch. This extends the tested payment function without removing the earlier entitlement checks.
2. Create a one-time flat **USD 25.00** Paddle discount per approved partner. Checkout enabled; code **3–32 upper-case letters/digits**. Restrict to exactly the configured base Appeal Pass and Account Pass price IDs. The Paddle API does not accept the hyphens/underscores our older local parser allowed. No upgrade, review, renewal, credit-pack, One Response or Pro prices.
3. Set server-only `PADDLE_API_KEY` with `discount.read`; retain any other permissions required by configured billing features. Register the existing approved user's partner row and code/discount mapping using the runbook.
4. Set `NEXT_PUBLIC_REFERRALS_ENABLED=true` and rebuild. The code field checks the discount before intent creation. A payment earns commission only when the signed Paddle discount agrees with that intent. No stacking or same-account self-referrals.
5. Subscribe to `adjustment.created` and `adjustment.updated`. Test a valid and invalid code, an eligible payment, duplicates, a partial/full refund and the private statement in the sandbox. Test invalid codes entered directly inside the Paddle overlay too.
6. Read `scripts/referral-report.mjs` before each monthly payout. Commission is 30 percent of actual discounted revenue **before tax**, held for 14 days. Missing totals, pending refunds, foreign currencies and ambiguous reversals stay held for review. Record confirmed transfers with a unique reference in `referral_payouts`. Payouts remain manual bank/Payoneer transfers.
7. `/partners/account` requires sign-in and reveals only the partner's own codes and aggregate balances. No buyer identity or case data is exposed. Keep the support mailbox and payout records operational.

`NEXT_PUBLIC_REFERRALS_ENABLED=false` reverts the new UI to the earlier manual behavior; it does not erase the ledger or cancel earned commission. To suspend the whole program, stop promotion and disable discounts in Paddle as well. Reconcile late events/open checkouts. Financial history starts with migration 0023 and does not backfill old payments.

The Account Pass founding counter now also requires the Paddle key with discount-read access. It reads the configured discount's redemption count and checks its amount, scope and usage limit against the displayed offer. Invalid/unavailable data hides the offer. The counter is advisory: Paddle documents that simultaneous checkouts can exceed a discount usage limit.

## 5d. The Account Pass and the founding offer (founder action, 22 Oct 2026) — optional, in this order

The Account Pass ($329, every case on the account for 12 months) is built and tested but **switched off**: no page shows it, nothing can buy it, and the app calls the payment database exactly as before, until its Paddle price id is set. The founding offer (the first buyers get the Account Pass at the Appeal Pass price) is off until its code is set. Do these in this order; the order is what keeps today's sales safe.

1. **Database first.** Supabase → SQL editor → paste `supabase/migrations/0017_account_pass.sql` and run it. It is one transaction: if anything is wrong it changes nothing. It adds the `account_pass` plan, a one-active-per-account index, the extended `apply_paddle_event` and the extended `claim_case_pass`. Check with `select proname from pg_proc where proname in ('apply_paddle_event','claim_case_pass');` (two rows) and `select pg_get_constraintdef(oid) from pg_constraint where conname = 'licenses_plan_check';` (it must now name `account_pass`). The same SQL is run against a real Postgres in `src/lib/__tests__/paymentSql.test.ts` on every test run.
2. **Paddle price.** Catalog → create **Account Pass**, one-time, **USD 329.00** (it must equal `PRICING.account.price` in `src/content/marketing.ts`; change both together). Copy its `pri_...` id into Vercel as `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS`. The webhook endpoint and events (§5) are unchanged.
3. **Partner codes (§5c) apply to both Passes.** In each partner's discount, restrict it to **both** price ids, not only the Appeal Pass.
4. **Founding offer (optional).** Create a Paddle discount: flat **USD 80.00** off, restricted to the **Account Pass price only**, **usage limit 25**, code for example `FOUNDING`. Paddle's usage limit is what ends the offer; the page's counter is only advisory. Set `NEXT_PUBLIC_FOUNDING_CODE=FOUNDING` and, if not 25, `NEXT_PUBLIC_FOUNDING_SPOTS`. A partner's code replaces the founding code on a checkout (Paddle takes one code), so a partner is never cheated of a sale.
5. **Redeploy.** `NEXT_PUBLIC_*` values are put into the build, so nothing changes until the next build. Then the pricing page shows four cards, a "Which Pass?" picker beside the pay button, the Terms and FAQ gain their Account Pass text, and the changelog gains its line.
6. **Sandbox first, then live.** Buy the Account Pass in the sandbox with a test card; check the new `licenses` row (`plan = 'account_pass'`, `case_id` null, `expires_at` twelve months out); open a second case and prepare a response without buying anything; refund the payment and check the cover ends; buy it again and check a second purchase while the first is active is refused with "Your Account Pass already covers every case". Check what Paddle shows for an unknown discount code (§5c step 2).
7. **To switch it off again**, unset `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS` and redeploy. Passes already sold keep working: the database function and the case claim stay in place, and the licence lookup still honours an unexpired Account Pass.

## 5e. The other ways to pay (founder action, 22 Oct 2026) — optional, each on its own

Stage 3 of the pricing plan adds five more products and a refund promise. **All of it is switched off.** Each product is on sale only when its Paddle price id is set, and nothing about it (a card, a FAQ answer, a Terms sentence, a changelog line, an email sentence) exists until then. You may switch on any one without the others, except where a line below says otherwise.

| Product                    | Paddle price (one-time unless stated)     | Vercel variable                              | Also needs                                    |
| -------------------------- | ----------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| AI document review         | **USD 49.00**                             | `NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW`   | the next row; Gemini on the paid tier (§6b)   |
| Appeal Pass after a review | **USD 200.00** (the Pass less the review) | `NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW` | the review row; the review is off without it  |
| Account Pass renewal       | **USD 99.00**                             | `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL`   | the Account Pass (§5d)                        |
| 10 case credits            | **USD 390.00**                            | `NEXT_PUBLIC_PADDLE_PRICE_PACK_10`           |                                               |
| 30 case credits            | **USD 870.00**                            | `NEXT_PUBLIC_PADDLE_PRICE_PACK_30`           |                                               |
| Pro plan                   | **USD 349.00, recurring monthly**         | `NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN`          | `PADDLE_API_KEY` (server only) for cancelling |
| The $25 outcome rebate     | not a price: a refund you make by hand    | `NEXT_PUBLIC_REBATE_ENABLED=true`            | migration `0019`                              |

Each price must equal the figure in `src/content/purchases.ts`; `src/content/__tests__/purchases.test.ts` recomputes every derived one ($249 less $49 is $200; ten at $39 is $390; thirty at $29 is $870; $349 for ten credits is $34.90 each) and fails until they agree. Change a number there and in Paddle together.

1. **Database first, always.** Supabase → SQL editor → paste `supabase/migrations/0018_more_ways_to_pay.sql` and run it (one transaction; it changes nothing if anything is wrong). Then `0019_outcome_reports.sql` if you will run the rebate. **Apply them before setting any price above**: the webhook starts passing the new price ids to the database the moment one is set, and a database function that does not take them yet would fail that call and the payment would not be granted. Check: `select proname from pg_proc where proname in ('apply_paddle_event','claim_case_pass','claim_document_review','use_case_credit');` (four rows) and `select pg_get_constraintdef(oid) from pg_constraint where conname = 'licenses_plan_check';` (it names `document_review`, `account_renewal` and `pro_plan`). The same SQL runs against a real Postgres on every test run (`paymentSqlStage3.test.ts`, `outcomeReportsSql.test.ts`), with deliberate breakages each caught.
2. **Create the prices in Paddle** (Catalog). The Pro plan is a **subscription, billed monthly**; the others are one-time. Copy each `pri_...` id into the variable above.
3. **The webhook must also send the subscription events.** Notifications → your endpoint → add `subscription.activated`, `subscription.updated`, `subscription.paused`, `subscription.canceled`, `subscription.past_due` and `subscription.resumed` to the events already listed in §5 (`transaction.completed`, `adjustment.created`, `adjustment.updated`). Without them a cancelled Pro plan would stay active here.
4. **`PADDLE_API_KEY`.** Paddle → Developer tools → Authentication → create a key with the narrowest permissions Paddle offers that still let it create customer portal sessions (check the permission list in the dashboard; do not give it write access to anything else). Set it in Vercel as `PADDLE_API_KEY`. It is read by `/api/billing/portal` and nowhere else. Without it the Billing page tells a Pro subscriber to write to `billing@appealdeck.com` and you cancel it the same day, so the Pro plan can be sold without it, but you should not.
5. **Partner discounts (§5c) apply to the Appeal Pass and the Account Pass only.** Restrict each partner's discount to those two price ids; do not add the review, the credited Pass ($200), renewal, packs or Pro. The checkout also withholds the code from those products, and the partner page says so once any of them is on sale.
6. **Verify professionals by hand.** There is no sign-up form for credits: a pack or the Pro plan bought by an unverified account is refused by the server and by the database. When someone writes in with a public profile you accept: `insert into pro_accounts (user_id, business_name, profile_url) values ('<their auth user id>', '<name>', '<profile link>');` (find the id in Authentication → Users). To stop one: `update pro_accounts set status = 'suspended' where user_id = '<id>';`.
7. **The rebate (settled by hand).** A seller who reports within 120 days of paying is owed $25 of that payment. It appears in the daily ops email as "outcome report(s) are waiting for their $25 refund", and: `select transaction_id, result, created_at from outcome_reports where rebate_status = 'pending';`. For each: Paddle → Transactions → the transaction → **Refund → Partial refund → $25.00** (a **partial** refund does not end the Pass; a full refund would). Then `update outcome_reports set rebate_status = 'refunded', settled_at = now() where transaction_id = 'txn_...';`. If you decide not to refund one: set `rebate_status = 'declined'`.
8. **Reports.** `node --env-file=.env.local scripts/partner-report.mjs --founding dsc_...` lists each partner discount's commissions by month, after the 14-day window and with refunded sales left out; check the amounts against Paddle before paying. `node --env-file=.env.local scripts/pricing-report.mjs --days 60` counts sales by product, reviews that went on to the Pass, outcome reports and credits. Both only read.
9. **Redeploy, then sandbox first, then live.** `NEXT_PUBLIC_*` values are put into the build, so nothing changes until the next build. In the sandbox, with test cards: buy the review on a case and check it can read documents; then buy the Pass for the same case and check it is $200 and the case is covered; buy a pack as a verified professional and use one credit on a case; start the Pro plan, check ten credits arrive, cancel it from Billing and check the next month adds none; report an outcome and settle the rebate as in step 7; refund a pack and check its credits stop. Check what Paddle shows for an unknown discount code (§5c step 2).
10. **To switch one off again**, unset its variable and redeploy. What was sold keeps working (licences, credits and the credited price stay in the database); only the new buying stops. Do not switch off the review's two prices separately: unset either one and the review disappears.

**Not advised yet:** packs and the Pro plan before you have talked to the first writers, as the plan said. They are built so that the first conversation can end with a link, not so that they are on sale on day one. The rebate and the review can wait for fifty paid cases.

## 5f. One Response (founder action, 23 Oct 2026) — optional

One Response is **USD 99.00, one-time**: one case, the first response and every revision of it, the case's documents read against the notice, no further responses (a response to Amazon's reply needs the Appeal Pass). It is **switched off**: until its price is set the pricing card says "Opens soon" and the Terms and changelog do not mention it.

1. **Database first.** Supabase → SQL editor → paste `supabase/migrations/0020_single_response.sql` and run it (after 0018 and 0019; one transaction). Check: `select pg_get_constraintdef(oid) from pg_constraint where conname = 'licenses_plan_check';` names `single_response`, and `select proname from pg_proc where proname = 'claim_single_response';` returns a row. **Apply it before setting the price**: the webhook starts passing the price to the database the moment it is set.
2. **Paddle → Catalog:** a one-time price of **USD 99.00** named "One Response". Copy its `pri_...` id into Vercel as `NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE` and redeploy (`NEXT_PUBLIC_*` values are put into the build). No webhook change: it already sends `transaction.completed` and the adjustment events.
3. **Partner codes do not apply to it** (§5c): do not add this price to a partner's discount. The checkout withholds the code from it.
4. **Sandbox first:** buy it on a case, prepare the first response (it works), record it as sent or paste an Amazon reply, and prepare again (refused with "a further response needs the Appeal Pass"); buy the Appeal Pass for the same case and check the next response works; refund a One Response and check its case stops being covered. A second One Response for one case, or one for a case that already has an Appeal Pass, is refused at checkout and parked (not granted) by the webhook if it arrives anyway.
5. **The credited upgrade (optional, recommended with it).** A One Response buyer who reaches round two would otherwise pay the full $249 on top. So: apply `supabase/migrations/0021_pass_after_single.sql` (after 0020, before setting the price), create a second one-time Paddle price of **USD 150.00** named "Appeal Pass after One Response" and set it as `NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE`, then redeploy. Until it is set nothing about the credit appears (the round-two message, the order summary, the Terms and changelog sentences all follow the variable). The $150 is $249 less $99; `purchases.test.ts` fails if either figure changes without the other. Partner codes do not apply to it (restrict each partner discount to the two base prices, §5c). Sandbox test: buy a One Response, record a response as sent, prepare again (refused with the credit named), buy the Appeal Pass (the order shows $150 with $99 taken off), prepare again (works); buying the credited Pass for a case with no One Response is refused at checkout and parked by the webhook.
6. **To switch it off again,** unset the variable and redeploy: what was sold keeps working.

## 5g. The guest deadline reminder (founder action, 23 Oct 2026)

After a decode, a visitor with no account can ask for one email reminder before the date their notice states. It is double opt-in (a confirmation email first; nothing else is sent until the address's owner clicks), sends one reminder three days before the date (or the next day if that has passed), keeps only the address, the date, the kind of notice and the dates of the emails until 30 days after the date, and every email carries a link that stops all reminders to that address.

1. **Database first.** Supabase → SQL editor → paste `supabase/migrations/0022_guest_reminders.sql` and run it. Check: `select count(*) from guest_reminders;` returns 0.
2. **`RESEND_API_KEY` must be set** (the same key as the purchase email). Without it the form tells the visitor reminders are unavailable and nothing is stored beyond the request.
3. **`CRON_SECRET`** (already required) authorises the daily job `/api/jobs/guest-reminders`, registered in `vercel.json` for 08:30 UTC. It sends the day's reminders and deletes rows 30 days past their date.
4. **Redis (Upstash) must be set in production**: the public form is rate limited (5 requests per address a day, 300 for everyone) and it fails closed, so without Redis no reminder email can be requested.
5. **Test:** decode a notice that states a date ahead, ask for a reminder with an address you own, click the link in the confirmation email (a button; opening the link alone does nothing), and check the row. To see the reminder, set its `remind_on` to today and call the job with the bearer token.

## 6. Upstash production setup (founder action)

**Done 28 Sep 2026 through Vercel → Storage → Upstash (Redis).** The integration created the database and injected `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL` and `REDIS_URL` into Preview and Production. The app reads `KV_REST_API_URL` / `KV_REST_API_TOKEN` when the `UPSTASH_` names are absent (`src/lib/redisEnv.ts`), so nothing needs copying. Local development keeps its own database in `.env.local` under the `UPSTASH_` names, so local testing never uses up production's rate limits or the Gemini spend cap.

To set it up by hand instead: https://console.upstash.com → Create database (free tier, closest to the Vercel region `iad1` = `us-east-1`) → REST API → copy the https URL (not `rediss://`) and the normal token (not the read-only one) into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

Check after the first deploy: `/decode` answers normally, and a signed-in action such as recording an outcome does not answer "too many requests".

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

**What the dump does not contain.** `--data-only` leaves out the `auth` schema, but `licenses`, `checkout_intents` and `purchase_email_outbox` point at `auth.users`. The dump is the data for the app's tables; the accounts themselves come from Supabase's own project backup (Dashboard → Database → Backups), which you also need. Use a long random `BACKUP_PASSPHRASE` (at least 32 characters): the encrypted file is kept for 90 days as a workflow artifact that anyone with read access to the repository can download, so the passphrase is what protects it.

**To restore:** download the artifact, then
`gpg --decrypt --passphrase '<passphrase>' -o backup.sql backup.sql.gpg` and replay it with `psql`
against the target database.

**Support address.** `/support` names `support@appealdeck.com` and states a reply window of two
business days. Create that mailbox (or alias it to one you read) before the page is public, and
change the window in `src/content/support.ts` if two business days is not what you can actually
hold to. A stated window you miss is worse than a longer one you keep.

**Privacy and billing addresses.** `src/content/legal.ts` publishes `privacy@appealdeck.com` (data
requests, with a 30-day response promise) and `billing@appealdeck.com` (refunds, account deletion;
also the sender address of the purchase confirmation email). Create both mailboxes, or alias them to
one you read, alongside `support@appealdeck.com` and before the legal pages are public. A promised
30-day response to an address that bounces is a breach of the policy itself.

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

## 6c. The second AI provider (Groq) — founder decision, off in production by default

Groq answers text tasks when Gemini is over quota, down or rejects its key, so a seller is not left without the AI. It never sees a PDF or image (documents stay with Gemini, then the on-device reader). It is a second company handling the seller's notice text and written answers, so **before** setting `GROQ_API_KEY` and `GROQ_PRODUCTION_CONFIRMED=true` in Vercel: (1) name Groq as a processor in `src/content/legal.ts` (privacy, "What we collect") and its retention terms, (2) check Groq's data-use terms for the plan the key is on, (3) update the pinned assertions in `legalDisclosures.test.ts`. Without the switch, production uses Gemini alone.

## 7. Deploy

```bash
git push origin master
```

Vercel will build and deploy automatically. The build takes ~60-90s.

**The on-device document reader (30 Sep 2026).** `npm run build` first runs `scripts/copy-reader-assets.mjs` (the `prebuild` hook; `npm run dev` does the same through `predev`). It copies about 16 MB of pdf.js (the legacy build) and Tesseract.js files from `node_modules` into `public/reader/`, which is not committed, and writes two small files beside them: `promise-with-resolvers.mjs` and `pdf.worker.compat.mjs`, the wrapper the page actually loads as pdf.js's worker, which adds `Promise.withResolvers` (missing before Safari 17.4 and Chrome 119) inside the worker before pdf.js starts. The site serves all of it itself and a reading contacts no other service. Nothing to configure. If a build ever skips that hook, `/reader/pdf.worker.compat.mjs` answers 404 and every device reading falls back to "we could not make out its text"; §9 step 16 checks for it. A reading that stalls is stopped after 45 seconds (a PDF step) or 2 minutes (OCR) and the seller is told; nothing waits forever.

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

16. **Device reading** (30 Sep 2026): signed out (a private window), start a case, attach a PDF invoice and press **Check this document**. The result should say "Read on this device, without AI", and DevTools → Network should show **no** request to /api/read-document and none to any other host. Also open `https://appealdeck.com/reader/pdf.worker.compat.mjs` and `/reader/pdf.worker.min.mjs`: both should load, not 404. Checked on the test deployment (appealdeck.vercel.app, 30 Sep): every reader file answers with the right type, and the guest PDF, scanned and JPEG 2000 tests pass against it. Repeat with an image or a scanned PDF: the first one loads about 7 MB of language data from `/reader/` and takes a few seconds.

17. **Guest reminder** (23 Oct 2026; PARKED-ITEMS F-19): needs migration `0022`, `RESEND_API_KEY` (sending address verified on the final domain) and Upstash. On `/decode`, decode a notice that states a date ahead, ask for a reminder with an inbox you own, press the button in the confirmation email (the link in it must be on the final domain, from `NEXT_PUBLIC_SITE_URL`), and confirm a `guest_reminders` row with `confirmed_at` set. Then confirm the stop link in an email works. Without Redis the form must say reminders are unavailable.

If all 17 pass, and §6a's restore drill and §6b's billing check are done, you're live.

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

- _Corrected 28 Sep 2026:_ this list used to say analytics was "not yet wired". It has been wired since 11 Sep (`src/lib/analytics.ts`); it needs only `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (§2).
- Error tracking (Sentry) — deliberately not added; see §9 step 15 for why.
- E&O insurance — separate from hosting. See AGENTS.md Gate 2.
- GDPR Art. 30 records — separate from hosting. See AGENTS.md Gate 2.

These are non-blocking for first deployment; they become blocking when first real customer pays.

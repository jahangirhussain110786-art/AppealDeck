# Go-live register: what is assumed done, and the only steps left on paper (26 Oct 2026)

**Read this in every session, straight after [PARKED-ITEMS.md](PARKED-ITEMS.md).** PARKED-ITEMS says
what may not be built without your exact phrase; this file says what is already built and what is
left for you to do outside the code. When you ask "what is open", an AI must show this file and
[LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md), and must mention every PARKED-ITEMS row.

**Your instruction, 26 Oct 2026:** assume the domain is bought, Gemini is on its paid tier, Supabase
is on a paid plan and Paddle has approved the account. Everything that follows from those four has
been reflected in the code, the copy and the docs. Hosting, Paddle's catalog wiring and the domain's
email are **not** assumed — they are the remaining work, with the exact smallest steps below.

**The honest one-line answer:** there is no product code left to write before launch. What remains is
one database paste session, one hosting import, Paddle's catalog (approval is not a product), and the
mailboxes — then the live purchase/refund test. If a step below is skipped, the column says what a
seller would see.

---

## 0. The assumption set (confirm each in one minute; do not rebuild anything)

| #   | Assumed done                            | What the code already expects                                                                                                                                                                                                                      | How to confirm                                                                                                               |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A-1 | `appealdeck.com` is bought and ours     | Every link, canonical URL, sitemap entry, social card and auth redirect is built from `NEXT_PUBLIC_SITE_URL` (`src/lib/urls.ts`). Single host: no `app.` subdomain.                                                                                | Open the site, view source, check the canonical and `/sitemap.xml`; a sign-in email link should point at the apex.           |
| A-2 | Gemini is on the paid tier              | Production refuses every Gemini call until `GEMINI_PAID_TIER_CONFIRMED=true` (`src/lib/llm/gemini.ts:179`). That gate stays: no code can tell a free key from a paid one.                                                                          | AI Studio shows the key's project as paid, then Vercel has `GEMINI_PAID_TIER_CONFIRMED=true`. Run the three checks in R-1.   |
| A-3 | Supabase is on a paid plan              | The app does not branch on the plan. Paid means no free-project pause, provider backups, and room for the custom SMTP rate limit. Our own dump workflow is still separate and still required.                                                      | Supabase → Settings → Billing shows the plan; Database → Backups shows daily backups.                                        |
| A-4 | Paddle has approved the account         | Approval permits live selling. It creates **no** product, price, client token or webhook. Until step 3 runs, the Pass card is visibly not buyable and no seller is charged.                                                                        | Paddle dashboard → Checkout → Website approval shows approved; Catalog is still empty of our prices until you create them.   |
| A-5 | Hosting is **not** done yet             | The app is deploy-ready (`vercel.json`, Node 24, one host; the production build passes and prerenders every public page). Nothing is deployed for production.                                                                                      | No production project yet, or the existing test project still points at the old `vercel.app` URL.                            |
| A-6 | Email on the domain is **not** done yet | Purchase receipts, reminders, the ops digest and magic links all go through Resend/Supabase SMTP. `EMAIL_FROM` defaults to `billing@appealdeck.com`. Without the key, purchases still provision and confirmations wait in the outbox.              | Resend → Domains shows `appealdeck.com` verified; a test magic link arrives from the domain, not from Supabase's own mailer. |
| A-7 | Upstash is configured                   | Required in production: the limiter fails closed, so without Redis buying, composing, document checks, wording help, reminders and outcome sharing all answer "too many requests". The Vercel Storage integration already injects `KV_REST_API_*`. | Vercel → Storage shows the Redis database in Production; `/api/health` answers 200.                                          |

If any assumption turns out false, stop and fix that row first. Nothing below compensates for a
missing paid feature: the code deliberately switches a feature off rather than pretending.

---

## 1. The only remaining work, in this order

### Step 0 — Database: migrations `0016` → `0026` — **DONE 26 Oct 2026**

Applied to the live project on 26 Oct 2026, in number order, with the Supabase CLI through the
session pooler (`supabase db push --db-url …`, `aws-1-eu-west-1.pooler.supabase.com:5432`; the direct
`db.<ref>.supabase.co` host does not resolve from this machine). The remote migration history now
holds `0001`–`0026`: `0001`–`0015` had been applied by hand in the SQL editor, so they were recorded
with `supabase migration repair --status applied` first, and the CLI then applied `0016`–`0026`, one
transaction each. Verified against the live project afterwards, not assumed: the six functions below,
`case_rounds` = 0, `malformed_webhook_events` = 0, `licenses_plan_check` naming all seven plans,
`licenses.refund_owed_at` present, RLS on every public table, and `anon` still unable to read
`licenses` or `license_events`.

On a fresh project, apply them the same way, or paste each file in the SQL editor: each file is one
transaction and safe to re-run. Apply them **in number order**; the dependencies that matter are
called out below. The baseline is `0001`–`0015` (licence and event tables, the payment function, the
device cap, the case reminders and the purchase-email outbox), and the three baseline checks at the
end of this step say whether it is there.

| File                             | Needed for                                                                                                                                                                                                                                                                                                                                        | If skipped                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0016_revoke_anon_licence_reads` | Defence in depth on `licenses` / `license_events` (RLS already empties them).                                                                                                                                                                                                                                                                     | No functional change; keeps anonymous reads possible in principle.                                                                                                       |
| `0017_account_pass`              | The Account Pass, if it is ever switched on.                                                                                                                                                                                                                                                                                                      | Its price cannot be granted; leave the price unset.                                                                                                                      |
| `0018_more_ways_to_pay`          | Review, renewal, credit packs, Pro plan, if switched on.                                                                                                                                                                                                                                                                                          | Those prices cannot be granted; leave them unset.                                                                                                                        |
| `0019_outcome_reports`           | The $25 rebate, if switched on.                                                                                                                                                                                                                                                                                                                   | Outcome reports cannot be stored.                                                                                                                                        |
| `0020_single_response`           | One Response, if switched on.                                                                                                                                                                                                                                                                                                                     | Its price cannot be granted.                                                                                                                                             |
| `0021_pass_after_single`         | The $150 credited Pass after One Response, if switched on.                                                                                                                                                                                                                                                                                        | The credit cannot be granted.                                                                                                                                            |
| `0022_guest_reminders`           | The guest reminder form (anyone can use it the moment the app is live).                                                                                                                                                                                                                                                                           | The form says reminders are unavailable.                                                                                                                                 |
| `0023_referral_ledger`           | Referral codes; **also required before `0024`**.                                                                                                                                                                                                                                                                                                  | Referral checkout stays off; `0024` cannot run.                                                                                                                          |
| `0024_entitlement_lifecycle`     | Expired Account Pass replacement and the linked refunds: a full refund of the review or One Response cancels the Pass bought on its credit **and records that Pass's own payment as owed back** (`licenses.refund_owed_at`), so both payments are undone. **Required before selling any of those; safe and recommended now.** Apply after `0023`. | A lapsed Account Pass blocks a replacement purchase; a credited Pass survives a refund of what it was discounted against, and the money a buyer is owed goes unrecorded. |
| `0025_case_rounds`               | **Required before deploying this build.** `/api/compose` calls `record_case_round` for a One Response holder; without the function that response is a 503. Required even if One Response is never sold, because one may already be sold.                                                                                                          | A One Response holder cannot prepare a response after this deploy.                                                                                                       |
| `0026_malformed_webhook_events`  | The daily ops digest's "signed but unrecognised Paddle events" counter.                                                                                                                                                                                                                                                                           | Payments still work; a Paddle schema change would stop provisioning silently instead of appearing in the digest.                                                         |

Then confirm (each should answer as stated):

```sql
select proname from pg_proc
 where proname in ('apply_paddle_event','claim_case_pass','claim_document_review',
                   'use_case_credit','claim_single_response','record_case_round');
-- six rows
select count(*) from public.case_rounds;                 -- 0
select count(*) from public.malformed_webhook_events;    -- 0
select pg_get_constraintdef(oid) from pg_constraint
 where conname = 'licenses_plan_check';                  -- names account_pass, document_review,
                                                         -- account_renewal, pro_plan, single_response
```

The baseline (`0001`–`0015`) answers these three; a fresh project needs those files first:

```sql
select count(*) from information_schema.tables
 where table_schema = 'public'
   and table_name in ('licenses','license_events','license_devices','payment_events_unmatched',
                      'case_reminders','purchase_email_outbox');        -- 6
select count(*) from pg_indexes where indexname = 'licenses_one_active_pass_per_case';  -- 1
select count(*) from pg_proc where proname = 'enforce_device_cap';                      -- 1
```

**Day one sells the $249 Appeal Pass only.** That needed `0016` (hardening), `0022` (the guest
reminder, public), `0023` + `0024` (referral ledger and the refund rules, so nothing granted later
contradicts what a buyer was told), `0025` (this build calls it) and `0026` (the digest) — all applied
on 26 Oct 2026. `0017`–`0021` are inert until their prices exist; they are applied too, so no later
price can arrive before its function.

**Before the first sale, remove the development fixture.** If this is the same Supabase project used
for local development, delete `dev@appealdeck.com` in Authentication → Users **and** its licence
(`delete from public.licenses where email = 'dev@appealdeck.com';`). A local fixture licence
(`DEV-LOCAL-001`) must never be usable against the live site.

The same SQL is replayed against a real Postgres on every test run (`paymentSql*.test.ts`,
`entitlementLifecycleSql.test.ts`, `caseRoundsSql.test.ts`, `outcomeReportsSql.test.ts`).

### Step 1 — Hosting: Vercel Pro, the env vars, the domain

1. Vercel → **New Project** → import the repo. Framework Next.js (auto), build `npm run build`,
   install `npm ci`, region `iad1` — all set in `vercel.json`. Use **Pro**: Hobby forbids commercial
   use, and the first sale is commercial. Vercel builds from GitHub, so the launch commits must be
   pushed first (CI: build, e2e, lighthouse green).
2. **Environment Variables** (Production; repeat for Preview/Development where useful). Sensitive
   values get the "Sensitive" toggle. The full annotated list is `.env.example`; the live minimum is:
   - Hosts: `NEXT_PUBLIC_SITE_URL=https://appealdeck.com`, `NEXT_PUBLIC_MARKETING_HOST=appealdeck.com`.
     Leave `NEXT_PUBLIC_APP_HOST` and `NEXT_PUBLIC_APP_URL` unset (single host).
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Redis: `KV_REST_API_URL` / `KV_REST_API_TOKEN` (already injected by the Storage integration) or
     the `UPSTASH_*` pair — one pair, not both.
   - AI: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash`, `GEMINI_PAID_TIER_CONFIRMED=true`.
   - Paddle: `NEXT_PUBLIC_PADDLE_ENV=production`, `NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS`,
     `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_WEBHOOK_SECRET` (step 3 writes all four).
   - Jobs and mail: `CRON_SECRET`, `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `EMAIL_FROM`,
     `EMAIL_REPLY_TO`.
   - Analytics (optional): `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
3. **Domains**: add the apex and `www` (redirect `www` → apex). No `app.` subdomain.
4. **Supabase Auth**: Site URL `https://appealdeck.com`; Redirect URLs
   `https://appealdeck.com/auth/callback` and `http://localhost:3000/auth/callback` (dev). Google
   OAuth: add `https://appealdeck.com` as an authorised JavaScript origin; its authorised redirect
   URI stays the Supabase callback (`https://<project-ref>.supabase.co/auth/v1/callback`).
5. Deploy. `NEXT_PUBLIC_*` values are baked into the build, so any later change needs a redeploy.

**Done when:** the apex loads over HTTPS, a sign-in link returns to the apex, and `/api/health`
answers 200.

### Step 2 — Paddle: approval is done; the catalog and webhook are not

1. Run the live setup yourself, with the live key (never give the key to an AI):

   ```bash
   PADDLE_LIVE_KEY=<live key> SITE_URL=https://appealdeck.com node scripts/setup-paddle-live.mjs
   ```

   It finds or creates the $249 Appeal Pass product and price, the live client token and the webhook
   for `https://appealdeck.com/api/webhooks/paddle`, then saves the four settings to Vercel. It is
   safe to run twice. It prints IDs, never secrets.

2. Paddle → Checkout → Checkout settings → **Default payment link** = `https://appealdeck.com/pricing`.
   Without it the overlay opens and then fails with `transaction_default_checkout_url_not_set`.
3. Checkout settings or product availability: block the **EU, EEA and UK** (decision F-08). The app
   also refuses those countries by request location (`BLOCKED_PURCHASE_COUNTRIES`), but a VPN or a
   direct overlay call must not get round it.
4. Confirm Website approval shows approved, and that the webhook subscribes to
   `transaction.completed`, `adjustment.created`, `adjustment.updated`. A refund must end the Pass.
5. Redeploy so the new price and token are in the build.
6. Buy one Pass with your own card, confirm the licence row, the receipt email, the unlock; then
   refund yourself and confirm the Pass ends. This is the only proof that money works.

**Done when:** step 6 passes. Nothing else in the app needs changing to sell the $249 Pass.

### Step 3 — Email on the domain

1. Resend → add `appealdeck.com`, add the DNS records it shows, wait for "Verified".
2. Create (or alias to one inbox you read) `support@`, `billing@`, `privacy@appealdeck.com`.
3. Vercel: `RESEND_API_KEY`, `EMAIL_FROM=AppealDeck <billing@appealdeck.com>`,
   `EMAIL_REPLY_TO=billing@appealdeck.com`, `OPS_ALERT_EMAIL=<your address>`.
4. Supabase → Authentication → Emails → SMTP Settings: custom SMTP, host `smtp.resend.com`, port
   `465`, username `resend`, password = a Resend API key, sender on the verified domain (for example
   `AppealDeck <login@appealdeck.com>`). Then raise Authentication → Rate Limits.
5. Send yourself one magic link, one password reset, one live purchase receipt and one guest reminder
   (decode a notice that states a date). Each must arrive from the domain.

**Done when:** all four arrive, and replying to the receipt reaches `billing@`.

### Step 4 — Backups, uptime, and the 17 smoke checks

1. GitHub → Settings → Secrets and variables → Actions: `SUPABASE_DB_URL` and `BACKUP_PASSPHRASE`.
   Run **Backup** once by hand; then do one restore drill (`DEPLOYMENT.md` §6a). Supabase's own paid
   backups do not replace this dump: `auth.users` lives there, the paid rows live in our tables.
2. Point a free uptime monitor at `/api/health`.
3. Run the 18 checks in `DEPLOYMENT.md` §9 (the last is the guest reminder). Then the live
   purchase/refund in step 2.6 is the nineteenth. The One Response and credited-upgrade checks in
   §5f are **not** part of day one: those products are off until their prices exist.

### Step 5 — The AI's first real day (R-1, runtime only)

With billing on and `GEMINI_PAID_TIER_CONFIRMED=true`, run the checks PARKED-ITEMS R-1 names: the
three classifier cases (a payment card must come back "none", not verification), one signed-in
"Prepare response", and `aiPipeline.eval.test.ts`. Nothing measures the paid tier yet; this is how we
learn whether it behaves like the mocks.

---

## 2. Built, but off until its own number exists (no code debt)

Nothing below needs an AI. Each is one Paddle price (or one discount) plus a variable, then a
redeploy. Full steps: `DEPLOYMENT.md` §5d–§5f and §5c. If a variable is unset, the plan is shown
with its price and "Opens soon" and cannot be bought, and no copy claims it is for sale (set
`NEXT_PUBLIC_PLANS_PREVIEW=off` to hide those cards instead).

| Product                        | Paddle price                  | Variable                                     | Notes                                               |
| ------------------------------ | ----------------------------- | -------------------------------------------- | --------------------------------------------------- |
| One Response                   | $99 one-time                  | `NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE`   | Needs `0020`; `0025` already required               |
| Appeal Pass after One Response | $150 one-time                 | `NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE` | Needs `0021`; partner codes do not apply            |
| Account Pass                   | $329 one-time                 | `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS`      | Needs `0017`                                        |
| Founding offer                 | $80 off, usage limit 25       | `NEXT_PUBLIC_FOUNDING_CODE`, `..._SPOTS`     | Account Pass only; `usage_limit` must equal `SPOTS` |
| Account Pass renewal           | $99 one-time                  | `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL`   | Needs the Account Pass                              |
| AI document review             | $49 one-time                  | `NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW`   | Needs `0018` and the paid AI tier                   |
| Appeal Pass after a review     | $200 one-time                 | `NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW` | Unset either review variable and both disappear     |
| 10 / 30 case credits           | $390 / $870 one-time          | `NEXT_PUBLIC_PADDLE_PRICE_PACK_10` / `_30`   | Verified professionals only                         |
| Pro plan                       | $349/month subscription       | `NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN`          | Also add the six `subscription.*` webhook events    |
| Outcome rebate                 | a $25 partial refund by hand  | `NEXT_PUBLIC_REBATE_ENABLED=true`            | Needs `0019`                                        |
| Referral ledger                | $25 discount per partner code | `NEXT_PUBLIC_REFERRALS_ENABLED=true`         | Needs `0023`, `PADDLE_API_KEY` with discount-read   |

Partner codes apply to the Appeal Pass and the Account Pass only. Every price must equal the figure
in `src/content/purchases.ts`; a test recomputes the derived ones.

### The money rules the code enforces, in one place (26 Oct 2026)

- **$249 per case, one-time, tax-inclusive.** It covers that case's documents, responses and every
  revision. Prices live in `src/content/purchases.ts`; a mismatch with Paddle is caught only by the
  live purchase test in step 2.6.
- **A full refund or chargeback ends the Pass it paid for; a partial refund does not.** The $25
  outcome rebate is deliberately partial for that reason.
- **A credited upgrade is the difference in price** ($200 after a $49 review; $150 after One
  Response). A full refund of the earlier purchase cancels the upgrade **and its own payment is
  refunded too**, so the whole purchase is undone. The debt is written to
  `licenses.refund_owed_at`, counted in the daily ops email, and cleared when Paddle's refund event
  arrives or the chargeback is reversed. Nothing calls Paddle's refund API: you make the refund.
- **Refunds are 14 days for a change of mind** (F-15, built), and every request is answered by a
  person at `billing@appealdeck.com`.
- **Partner codes take $25 off a Pass, never another product.** Commission is 30% of discounted
  revenue before tax, held 14 days, paid by hand after `scripts/referral-report.mjs`.
- **No subscription is sold at launch.** The Pro plan is built and off.

### Two limits that are advisory, not enforcement (say so plainly if asked)

- **The response round is seller-reported.** `record_case_round` (migration `0025`) keeps the
  highest round the browser reports, so a seller who clears their case data can claim a lower round
  than they reached. It is a fair-use guard that stops a second response being sold by accident, not
  a paywall, and the Terms describe it that way.
- **Whether a case needs professional review is computed in the browser** from the case's own fields
  (notice kind, whether professional help was chosen, replies recorded, rounds). It decides what the
  page offers and what checkout may sell; it cannot verify the seller's account of the case.
- **Nothing checks a seller's Amazon eligibility or the facts they enter** — the product prepares a
  response from what they write, and the reviewer's page says so.

---

## 3. What the assumptions do **not** switch on

These stay as they are; none is release-blocking, and two are your decisions.

| Item                                | State                                                                                                                                                                                                                | What releases it                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Content Security Policy             | Report-Only in `vercel.json`; reports go to `/api/csp-report`.                                                                                                                                                       | `EXECUTE PARKED P-08 enforce CSP`, after about a week of clean reports                      |
| Groq as a second AI provider        | Off in production. It never receives documents.                                                                                                                                                                      | A privacy line naming Groq, then `GROQ_PRODUCTION_CONFIRMED=true`                           |
| Plausible analytics                 | Off until a domain is set.                                                                                                                                                                                           | A Plausible account and `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`                                      |
| Error monitoring (Sentry)           | Deliberately absent.                                                                                                                                                                                                 | `EXECUTE PARKED P-11 error monitoring`                                                      |
| Repository visibility               | Public today (verified 12 Oct 2026). **Decided 26 Oct 2026: make it private.** Not done — repository visibility is your action, not an AI's; until then the engine, the docs and the scripts are readable by anyone. | GitHub → Settings → General → Danger Zone → Change visibility (check Actions minutes first) |
| Founder story and walkthrough video | Unwritten.                                                                                                                                                                                                           | You (F-10, F-11)                                                                            |
| EU/EEA/UK sales                     | Blocked.                                                                                                                                                                                                             | Your decision (F-08): comply, or open the markets                                           |
| Price test $249 → $299 → $349       | Not started.                                                                                                                                                                                                         | New Paddle prices plus a copy edit, after 50 paid cases                                     |
| A shared case between team members  | Not built: it needs cases on our server, a separate privacy decision.                                                                                                                                                | Your decision                                                                               |
| Higher-volume AI drafting settings  | `GEMINI_DRAFT_THINKING` is off (measured-stable).                                                                                                                                                                    | A measured comparison on the paid tier, not a guess                                         |

---

## 4. What was fixed on 26 Oct 2026 (the audit's F1–F16), and how each is proven

| Fix  | What changed                                                                                                                                                      | Proof (tests or check)                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| F1+2 | One round contract: letter wording uses `attempt`; entitlement uses `sentHere` / `repliesReceived`. Checkout and compose now agree on which round a case is in.   | `src/core/workspace.test.ts`, `src/app/api/__tests__/checkout-intent-gate.test.ts`, `compose-gate.test.ts`      |
| F3   | One `caseNeedsProfessionalReview(w)` predicate used by compose, checkout and plan advice, and it now includes unapplied Amazon replies.                           | `src/core/d6Latch.test.ts`, `src/lib/__tests__/planAdvice.test.ts`, checkout tests with a reply-only allegation |
| F4   | Checkout receives only eligibility facts (`{composable, professionalReview, round}`), capped at 8,000 bytes; no case wording leaves the browser.                  | `checkout-intent-gate.test.ts` asserts the body carries no notice or response text                              |
| F5   | On a second attempt with no Amazon reply recorded, the AI is no longer told to say Amazon refused — it could not know that.                                       | `src/lib/llm/__tests__/draftResponse.test.ts`, `draftOther.test.ts`                                             |
| F6   | Dashboard no longer claims a Pass state it could not check; the three answers (active, held, could not check) are distinct.                                       | `src/components/__tests__/dashboardPassRow.test.tsx`                                                            |
| F7   | One Response holders see their own row (case, round, what a further response needs) instead of a generic Pass row.                                                | same file                                                                                                       |
| F8   | The auth callback builds its origin from `APP_URL` off localhost, so a spoofed Host header cannot redirect a session to another site; `next` stays on our origin. | `src/lib/__tests__/auth-callback.test.ts`                                                                       |
| F9   | Saving an edit to another existing case no longer steals the active-case pointer.                                                                                 | `src/lib/__tests__/caseStore.test.ts`                                                                           |
| F10  | A pointer to a deleted last case is cleared instead of reopening a dead case; a new case then activates normally.                                                 | same file                                                                                                       |
| F11  | Two simultaneous first-run `initWithPassphrase` calls no longer leave the vault half-initialised; the loser unlocks with the winner's key.                        | `src/core/vault/vault.test.ts`                                                                                  |
| F12  | `purge()` clears the in-memory device key as well as the records, so a purged vault cannot be reopened with a stale key.                                          | same file                                                                                                       |
| F13  | Removed the unused `priceId` prop and the dead env read from the checkout button.                                                                                 | typecheck + lint clean                                                                                          |
| F14  | CSP remains Report-Only on purpose; the report endpoint is documented and reachable.                                                                              | `scripts/lint-reachability.mjs`, `vercel.json`                                                                  |
| F15  | A hidden founding offer now logs one `FOUNDING OFFER HIDDEN` line with the exact reason (a `usage_limit` mismatch is the likeliest).                              | `src/lib/__tests__/founding.test.ts`; the reason names both numbers                                             |
| F16  | A signed Paddle webhook that fails our schema is parked in `malformed_webhook_events` (shape only, never the body) and counted by the daily ops digest.           | `src/app/api/__tests__/paddle-webhook.test.ts`, `src/lib/__tests__/opsDigest.test.ts`, migration `0026`         |

Two of these were launch risks rather than visible bugs: a spoofed auth origin (F8) and a refunded
review leaving a discounted Pass alive (the linked-refund half of `0024`). The round contract (F1/F2)
was the quiet one: two definitions of "which response is this" could have sold a second response to a
One Response holder.

**Three follow-ups found by reading the code itself (26 Oct 2026), not from the audit:**

| Fix | What changed                                                                                                                                                                                                                            | Proof                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| F17 | The privacy policy said the checkout's three facts were "kept with the purchase". They are not: only the case's random code, the product and the consent are kept. It now says so, and also names the one round record (`case_rounds`). | `src/content/__tests__/legalDisclosures.test.ts` asserts "are not kept" and the round line         |
| F18 | Rule (a) of `0024` cancelled a credited upgrade without refunding it. It now records the debt (`refund_owed_at`), the ops digest reports it, and Paddle's refund event clears it.                                                       | `entitlementLifecycleSql.test.ts`, `supabase/tests/entitlement_lifecycle.sql`, `opsDigest.test.ts` |
| F19 | Checking a partner code was counted against the compose cap, so a mistyped code spent the draft allowance. It has its own limiter.                                                                                                      | `src/app/api/__tests__/referral-validate.test.ts` (calling compose from the route fails it)        |

---

## 5. What an AI must do when you say "launch"

1. Read PARKED-ITEMS, then this file, then LAUNCH-CHECKLIST. Do not build a PARKED item; only its
   exact phrase releases it.
2. Confirm step 0's six functions and three counts above. If `record_case_round` is missing, stop:
   deploying this build would break One Response holders.
3. Confirm the assumption rows A-1 to A-7. Report any false one; do not paper over it.
4. Run the full gates (`format`, typecheck, lint, `lint:copy`, `lint:reachability`, `lint:sources`,
   `format:check`, tests, build) and report exact numbers.
5. Hand back the remaining clicks (hosting import, Paddle dashboard, Resend/DNS, smoke checks). An AI
   never enters a live key, never applies a remote migration, never pushes or deploys without your
   explicit words.

---

## 6. If a step is skipped, what a seller sees (so nothing fails silently)

| Skipped step                    | Visible result                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0025`                          | A One Response holder's response fails with a 503 after deploy.                                                                                            |
| Paddle price / default link     | The Pass shows "Opens soon", or the overlay opens and fails; nobody is charged.                                                                            |
| `RESEND_API_KEY`                | Purchases still provision; the receipt waits in the outbox; reminders say unavailable.                                                                     |
| Redis missing                   | Rate-limited actions answer "too many requests"; buying and AI are refused.                                                                                |
| `GEMINI_PAID_TIER_CONFIRMED`    | Document checks and wording help say they are switched off.                                                                                                |
| Domain mailboxes                | `support@`, `billing@`, `privacy@` bounce while the pages promise replies.                                                                                 |
| `0026`                          | Payments work; a Paddle schema change goes unnoticed until a buyer complains.                                                                              |
| `0024`                          | A credited upgrade is cancelled when its base purchase is refunded, but the buyer's own payment is not recorded anywhere — nobody is told to send it back. |
| Founding `usage_limit` mismatch | The founding offer simply hides; one Vercel log line now says which number disagrees.                                                                      |

---

_Last updated 26 Oct 2026. Change this file in the same commit as any change that adds or removes a
launch step. PARKED-ITEMS remains the authority on what may be built; this file is the authority on
what is left outside the code._

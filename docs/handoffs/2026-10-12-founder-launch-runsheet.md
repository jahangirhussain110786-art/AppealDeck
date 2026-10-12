# Launch run-sheet: only what is left for you (12 Oct 2026)

Everything here needs your accounts, your card or your own login. Everything an AI session could do
is already done (see the bottom). Order matters: each step needs the one before it. The long
explanations are in `docs/DEPLOYMENT.md`; this sheet gives the order and the exact commands.

The Vercel project is `appealdeck` (CLI already signed in as `jahangirhussain110786-art`). The
GitHub CLI is signed in too. The Supabase project the app uses is `AppealDeck`
(`dtddptwudzovcchaciwt`).

## 1. The domain (about 15 minutes)

1. Buy `appealdeck.com`. Either on Vercel (it bills the card on your Vercel account):

```bash
vercel domains buy appealdeck.com
```

or at any registrar, then:

```bash
vercel domains add appealdeck.com appealdeck
```

2. Point the app at it. Each command asks for the value; paste what is shown:

```bash
vercel env rm NEXT_PUBLIC_SITE_URL production --yes
vercel env add NEXT_PUBLIC_SITE_URL production        # https://appealdeck.com
vercel env rm NEXT_PUBLIC_MARKETING_HOST production --yes
vercel env add NEXT_PUBLIC_MARKETING_HOST production  # appealdeck.com
```

3. In Supabase (Authentication, URL configuration): set Site URL to `https://appealdeck.com` and add
   `https://appealdeck.com/**` to Redirect URLs. In Google Cloud (OAuth client): add
   `https://appealdeck.com` as an authorised origin. Steps: `docs/DEPLOYMENT.md` §4.

## 2. Mailboxes (30 minutes)

Create `support@`, `billing@` and `privacy@appealdeck.com`, all forwarding to one inbox you read
daily. Free way: Cloudflare Email Routing (needs the domain's DNS on Cloudflare). `/support` already
promises a reply within two business days, and the privacy page promises 30 days, so these must
exist before launch. Steps: `docs/DEPLOYMENT.md` §6a.

## 3. Supabase (15 minutes)

1. **Migration 0016** (one paste; the CLI login here is not allowed to change that database).
   Supabase dashboard, SQL Editor, run:

```sql
begin;
revoke all on public.licenses from anon;
revoke all on public.license_events from anon;
commit;
```

It is a safety tightening only: nothing a seller does depends on it.

2. Custom mail so sign-in emails keep arriving: Project Settings, Authentication, SMTP. Use Resend's
   SMTP details (Resend account in step 4). Steps: `docs/DEPLOYMENT.md` §4.

## 4. Accounts and secrets (30 minutes)

Create a Resend account (verify `appealdeck.com`), and a Plausible account (add `appealdeck.com`).
Then:

```bash
vercel env add RESEND_API_KEY production
vercel env add OPS_ALERT_EMAIL production                # your own address
vercel env add NEXT_PUBLIC_PLAUSIBLE_DOMAIN production   # appealdeck.com
```

(`CRON_SECRET`, the Supabase keys and Upstash are already set on Vercel.)

## 5. Vercel and Supabase paid plans

Vercel Pro (the free plan forbids commercial use) and Supabase Pro (so the licence table never
pauses). Both are billing pages in their dashboards.

## 6. Paddle (about an hour, then 2 to 10 business days of waiting)

1. In the Paddle dashboard (live): set the **Default payment link** to `https://appealdeck.com`, then
   submit the **domain for approval**. The site's Terms, Refund and Privacy pages now carry what
   Paddle's reviewer looks for (Merchant of Record sentence, 14-day refund, the read-the-Terms tick).
2. Block the EU, EEA and UK countries in Paddle's checkout settings.
3. When the domain is approved, create the live product, price, token and webhook, and write the four
   settings into Vercel, with one command (it prints IDs only, never keys):

```bash
PADDLE_LIVE_KEY=pdl_live_apikey_... SITE_URL=https://appealdeck.com node scripts/setup-paddle-live.mjs
vercel --prod
```

The redeploy matters: the checkout settings are fixed when the site is built.

## 7. Backups (20 minutes, before the first sale)

```bash
gh secret set SUPABASE_DB_URL        # Supabase, Project Settings, Database, connection string (URI) with the password in it
gh secret set BACKUP_PASSPHRASE      # a long random string; keep a copy in your password manager
gh workflow run Backup
gh run list --workflow Backup --limit 1
```

The run must go green. Then do the one restore drill in `docs/DEPLOYMENT.md` §6a.

## 8. The AI (optional for launch; only when Google billing works)

The site works without it. When billing is on for the key's Google project, and not before (the
privacy page promises the paid tier):

```bash
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_PAID_TIER_CONFIRMED production     # true
vercel --prod
```

Then ask me to run R-1 (the three classifier cases, one signed-in "Prepare response", the eval).

## 9. Monitor, then the real test

1. A free uptime monitor (UptimeRobot or Better Stack) on `https://appealdeck.com/api/health`.
2. Buy one Pass with your own card on the live site. Confirm: the confirmation email arrives, the
   Pass unlocks the case, then refund yourself in Paddle and confirm the Pass is removed.
3. Run the 16 post-deploy checks in `docs/DEPLOYMENT.md` §9. I can run the checks that need no login
   if you say so.

## 10. Your own, not an AI's

- Trustpilot and Google business profiles (location Pakistan).
- Pakistan paperwork: NTN, PSEB, Payoneer in your own name, one tax-adviser conversation.
- Ten minutes in your own Seller Central to confirm four facts before anyone quotes them: Amazon's
  review-time help text, the Product Safety Alert clocks, the lost-invoice consequence, the
  responsible-account order.
- One lawyer read of the Terms and Privacy ($300 to $1,500), after Paddle approves.
- Acknowledge the three privacy-wording changes earlier AI sessions made (the on-device reader on
  30 Sep, the seven-day notice fingerprint on 10 Oct, the case identifier in the licence record).
- A continuity note (where everything is, who can get in) in a password manager.

## Already done by an AI session

- Refund window is 14 days everywhere; Merchant-of-Record sentence in the Terms; governing-law clause
  corrected; Paddle receipt route on the Refund page; the checkout tick now includes "I have read the
  Terms and the Refund policy" with both linked (12 Oct 2026, `docs/DECISIONS.md`).
- Founder note on the home page; `/changelog`; the whole growth plan (batches A, B, C).
- Both stale worktrees (`.claude/worktrees`, `.kilo/worktrees`) and their branch deleted.
- Audit: CI green, 0 dependency vulnerabilities, no secrets in the repository or its history, every
  public route and the sample decode checked on a production build, database tables refuse anonymous
  access (except the two migration 0016 tightens).

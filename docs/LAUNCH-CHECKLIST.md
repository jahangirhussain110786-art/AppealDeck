# Launch checklist: everything that is your turn, in order (kept current; last updated 26 Oct 2026)

Everything an AI could build is built. These are the things only you can do (your accounts, card,
login or decision). Do them top to bottom, tick each, then launch. Each step needs the one before it.
Exact commands are in [`GO-LIVE-REGISTER.md`](GO-LIVE-REGISTER.md); the long explanations are in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

**For any AI session:** read [`PARKED-ITEMS.md`](PARKED-ITEMS.md), then
[`GO-LIVE-REGISTER.md`](GO-LIVE-REGISTER.md), then this list. When the founder asks "what is left" or
says "launch", show this whole list. Update it in the same commit as anything that adds or removes a
step. A parked item is still built only on its exact `EXECUTE PARKED P-xx <name>` phrase.

## 0. Assumed done on 26 Oct 2026 — confirm, do not redo

- [ ] Domain `appealdeck.com` is bought.
- [ ] Gemini's Google Cloud project is on the paid tier.
- [ ] Supabase is on a paid plan (provider backups on; no free-project pause).
- [ ] Paddle has approved the account (approval is not a product: step 3 is still required).

If one is false, fix that one first and say so. Nothing below pretends a missing service works.

## 1. Database — **DONE 26 Oct 2026** (migrations `0001`–`0026` applied to the live project)

Applied in number order with the Supabase CLI through the session pooler, after recording the hand-applied `0001`–`0015` with `supabase migration repair --status applied`; remote history now holds all 26. The checks below were run against the live project and passed (details in the register, step 0).

- [x] Baseline `0001`–`0015` present.
- [x] `0016` (defence in depth), `0017` (Account Pass), `0018` (renewal, review, packs, Pro), `0019` (rebate), `0020` + `0021` (One Response and its $150 credited Pass) — applied, so no price can now arrive before its function.
- [x] `0022` (guest email reminder) — applied; the form no longer has a reason to say it is unavailable.
- [x] `0023` + `0024` (referral ledger, then expired Account Pass replacement and the linked refund rule).
- [x] `0025` (case rounds — `/api/compose` calls `record_case_round`) and `0026` (malformed webhook diagnostics).
- [x] Six functions present; `case_rounds` = 0; `malformed_webhook_events` = 0; `anon` still cannot read `licences`.
- [ ] **Apply `0027_refund_reversal_fixes`** (27 Oct 2026 audit): a credited upgrade is no longer restored while its original is still refunded, a pending refund no longer reactivates a cancelled Pro plan, and an expiry notice that was claimed but never sent is retried. One transaction, safe to re-run: `supabase db push` (the project is linked) or paste the file in the SQL editor. The app works without it, but those three fixes are not live until it is applied. It adds one column, `account_pass_notices.delivered_at`.
- [ ] Delete the development fixture if this is the same Supabase project: user `dev@appealdeck.com` **and** `delete from public.licenses where email = 'dev@appealdeck.com';`.

## 2. Hosting, domain and app configuration (Vercel Pro)

- [ ] Push the launch commits (you, not an AI) and confirm CI is green: Vercel builds from GitHub.
- [ ] Vercel **Pro** → New Project → import the repo; accept `vercel.json` (Next.js, `npm ci`, `npm run build`, region `iad1`).
- [ ] Set the runtime env vars listed in `.env.example`. The ones nobody can skip: Supabase URL/anon/service key; `KV_REST_API_URL`/`_TOKEN` (or `UPSTASH_*`); `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash`, `GEMINI_PAID_TIER_CONFIRMED=true`; the four Paddle values (step 3 writes them); `CRON_SECRET`, `RESEND_API_KEY`, `OPS_ALERT_EMAIL`, `EMAIL_FROM`, `EMAIL_REPLY_TO`; `NEXT_PUBLIC_SITE_URL=https://appealdeck.com`, `NEXT_PUBLIC_MARKETING_HOST=appealdeck.com`. Leave `NEXT_PUBLIC_APP_HOST`/`NEXT_PUBLIC_APP_URL` unset (one host).
- [ ] Vercel → Domains: add the apex and `www` (redirect `www` → apex). No `app.` subdomain.
- [ ] Supabase Auth: Site URL = apex; Redirect URLs = `https://appealdeck.com/auth/callback` + `http://localhost:3000/auth/callback`. Google OAuth: add `https://appealdeck.com` as a JavaScript origin (the redirect URI stays the Supabase callback).
- [ ] Deploy. `NEXT_PUBLIC_*` values are baked at build, so redeploy after changing one.

## 3. Paddle (approved; catalog and webhook still to create)

- [ ] Run, yourself: `PADDLE_LIVE_KEY=<live key> SITE_URL=https://appealdeck.com node scripts/setup-paddle-live.mjs`. It creates the $249 product/price, the client token and the webhook, and saves four settings to Vercel. Never give an AI the live key.
- [ ] Paddle → Checkout → Checkout settings → **Default payment link** = `https://appealdeck.com/pricing`.
- [ ] Block the **EU, EEA and UK** in checkout settings or product availability (the app also refuses them by request location).
- [ ] Confirm Website approval shows approved; confirm the webhook has `transaction.completed`, `adjustment.created`, `adjustment.updated` (a refund must end the Pass).
- [ ] Redeploy, then buy one Pass with your own card: receipt, unlock, licence row; refund yourself and confirm the Pass ends.
- [ ] Optional, each on its own, **database migration first**: One Response ($99 + $150), Account Pass ($329), AI review ($49 + $200), renewal ($99), 10/30 credits ($390/$870), Pro plan ($349/month, plus the six `subscription.*` events and `PADDLE_API_KEY`). A price set means that plan becomes buyable on the site; unset keeps it at "Opens soon" — shown, priced, not on sale (or hidden with `NEXT_PUBLIC_PLANS_PREVIEW=off`). Sandbox-test each first.
- [ ] Partner program (optional): migrations through `0023`, `PADDLE_API_KEY` with discount-read, approved partners/codes, `NEXT_PUBLIC_REFERRALS_ENABLED=true`, rebuild. Follow `handoffs/2026-10-24-referral-activation.md`; payouts stay manual.
- [ ] Founding offer (optional, Account Pass only): USD 80 off, usage limit **equal to** `NEXT_PUBLIC_FOUNDING_SPOTS` (default 25). A mismatch hides the offer and now logs one reason in Vercel.

## 4. Mail on the domain

- [ ] Mailboxes `support@`, `billing@`, `privacy@appealdeck.com`, all read daily (the site promises replies).
- [ ] Resend: add and verify `appealdeck.com` (DNS records).
- [ ] Vercel: `RESEND_API_KEY`, `EMAIL_FROM=AppealDeck <billing@appealdeck.com>`, `EMAIL_REPLY_TO=billing@appealdeck.com`, `OPS_ALERT_EMAIL`.
- [ ] Supabase Auth custom SMTP (Resend: `smtp.resend.com`, port `465`, user `resend`, password = API key), then raise the auth email rate limit.
- [ ] Test: one magic link, one password reset, one purchase receipt, one guest reminder. All must arrive from the domain; a reply to the receipt must reach `billing@`.

## 5. The AI's first real day (runtime check, not code)

- [ ] Confirm AI Studio shows the key's project as paid and Vercel has `GEMINI_PAID_TIER_CONFIRMED=true`.
- [ ] Run PARKED-ITEMS R-1: three classifier cases (a payment card must come back "none", not verification), one signed-in "Prepare response", and `aiPipeline.eval.test.ts`.

## 6. Backups and uptime (before the first sale)

- [ ] GitHub secrets `SUPABASE_DB_URL` and `BACKUP_PASSPHRASE`; run the Backup action green; do one restore drill (`DEPLOYMENT.md` §6a). Supabase's paid backups cover `auth.users`; this dump covers the paid rows.
- [ ] Uptime monitor on `/api/health`.

## 7. Test, then open the doors

- [ ] Run the 18 post-deploy checks in `DEPLOYMENT.md` §9 (check 17 is the guest reminder, 18 the EU/EEA/UK block). One Response and its credited upgrade are **not** day one: they run when those prices are switched on.
- [ ] The live purchase + refund in step 3 is the nineteenth check.
- [ ] Google Search Console: verify the domain, submit `/sitemap.xml`, request indexing for `/`, `/decode`, `/pricing` and each `/guides/...` page.
- [ ] Bing Webmaster Tools: import from Search Console and submit the same sitemap.
- [ ] After a week, read Search Console → Performance → Queries to choose the next guide (`handoffs/2026-10-24-seo-pass.md`).
- [ ] Optional analytics: Plausible account, then `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.

## 8. Yours, not an AI's

- [ ] The "who builds this and why" founder story (F-10) and a walkthrough video (F-11).
- [ ] Pakistan paperwork (NTN, PSEB, Payoneer, a tax adviser); one lawyer read of Terms and Privacy after Paddle approves.
- [ ] Ten minutes in your own Seller Central to confirm four facts before quoting them (run-sheet §10).
- [ ] Acknowledge the three privacy-wording changes (on-device reader, seven-day notice fingerprint, case id in the licence record).
- [ ] **Make the GitHub repository private (decided 26 Oct 2026, F-14).** GitHub → Settings → General → Danger Zone → Change visibility; check Actions minutes first. Until then the engine and docs are public.
- [ ] A continuity note (where everything is, who can get in) in a password manager.

## 9. Decisions waiting on you (not blocking launch)

- [ ] Reviews page and review cashback (amount, and whether it merges with the outcome form).
- [ ] Referral program activation, if you want it (step 3, last two bullets).
- [ ] Case scholarship, and any early-customer offer (my advice: no price cut, launch on proof).
- [ ] Content Security Policy: it stays Report-Only until a week of clean reports; enforcing it is parked (`EXECUTE PARKED P-08 enforce CSP`).
- [ ] Price test $249 → $299 → $349, after 50 paid cases and 30 outcome reports.
- [ ] Parked product items need their exact `EXECUTE PARKED P-xx <name>` phrase (`docs/PARKED-ITEMS.md`).

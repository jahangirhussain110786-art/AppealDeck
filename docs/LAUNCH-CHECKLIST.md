# Launch checklist: everything that is your turn, in order (kept current; last updated 23 Oct 2026)

Everything an AI could build is built. These are the things only you can do (your accounts, card,
login or decision). Do them top to bottom, tick each, then launch. Each step needs the one before it.
Exact commands are in `docs/handoffs/2026-10-12-founder-launch-runsheet.md`; the long explanations are in
`docs/DEPLOYMENT.md`.

**For any AI session:** when the founder buys the domain, asks "what is left", or says "launch", show
this whole list first, then update it in the same commit as anything that adds or removes a step.

## 1. Domain

- [ ] Buy `appealdeck.com`; add it to the Vercel project.
- [ ] Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MARKETING_HOST` on Vercel to the new domain (every email link is built from the first).
- [ ] Supabase Auth: Site URL and Redirect URLs on the new domain. Google OAuth: add the new origin.

## 2. Mail

- [ ] Mailboxes `support@`, `billing@`, `privacy@appealdeck.com`, all read daily (the site promises replies).
- [ ] Resend account; verify `appealdeck.com` as the sending domain.
- [ ] Supabase Auth custom SMTP (Resend's details), or sign-in emails stop arriving.

## 3. Database (Supabase SQL editor, in number order, one paste each)

- [ ] `0016` (safety tightening; the app does not depend on it).
- [ ] `0017`, `0018`, `0019` (Account Pass, other ways to pay, rebate) **before** setting any of their prices. `0018` is not applied yet.
- [ ] `0020`, `0021` (One Response) **before** setting its prices.
- [ ] **`0022` (guest email reminder)** before anyone can use the reminder form.

## 4. Vercel secrets and plans

- [ ] `RESEND_API_KEY` (needed by the purchase email, case reminders and the **guest reminder**).
- [ ] **Upstash configured in production** (the public reminder form, checkout and AI features fail closed without it).
- [ ] `OPS_ALERT_EMAIL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (Plausible account first).
- [ ] `CRON_SECRET` is set; the daily jobs in `vercel.json` use it.
- [ ] Vercel Pro (the free plan forbids commercial use) and Supabase Pro.

## 5. Paddle (about an hour, then 2 to 10 business days waiting)

- [ ] Default payment link = the new domain; submit the domain for approval.
- [ ] Block EU, EEA and UK in checkout settings (decision F-08: comply or decline).
- [ ] After approval: run `scripts/setup-paddle-live.mjs`, then redeploy (checkout settings are fixed at build).
- [ ] Webhook has the `adjustment.*` events (a refund must end the Pass).
- [ ] Optional, each on its own: prices for **One Response** ($99, and the $150 credited Pass), Account Pass ($329), AI review ($49 and $200), renewal, credits, Pro plan. A price set means that plan appears on the site; leave unset to keep it off. Sandbox-test every one first.
- [ ] Partner program (F-16) only if you run it: discount per code, sandbox test, Payoneer.

## 6. Backups

- [ ] `SUPABASE_DB_URL` and `BACKUP_PASSPHRASE` GitHub secrets; run the Backup action green; do one restore drill (`DEPLOYMENT.md` §6a).

## 7. The AI (optional for launch)

- [ ] Gemini **billing on the key's Google project**, then `GEMINI_API_KEY` and `GEMINI_PAID_TIER_CONFIRMED=true` on Vercel. Never set the flag before billing (the privacy page promises the paid tier).

## 8. Test, then launch

- [ ] Uptime monitor on `/api/health`.
- [ ] Buy one Pass with your own card on the live site; confirm the email, the unlock, then refund yourself and confirm the Pass ends.
- [ ] Run the 17 post-deploy checks in `DEPLOYMENT.md` §9 (check 17 is the guest reminder).

## 9. Yours, not an AI's

- [ ] The "who builds this and why" founder story (F-10), a walkthrough video (F-11).
- [ ] Pakistan paperwork (NTN, PSEB, Payoneer, a tax adviser); one lawyer read of Terms and Privacy after Paddle approves.
- [ ] Ten minutes in your own Seller Central to confirm four facts before quoting them (run-sheet §10).
- [ ] Acknowledge the three privacy-wording changes (on-device reader, seven-day notice fingerprint, case id in the licence record).
- [ ] Decide: keep the GitHub repository public or make it private (F-14).
- [ ] A continuity note (where everything is, who can get in) in a password manager.

## 10. Decisions waiting on you (not blocking launch)

- Reviews page and review cashback (amount, and whether it merges with the outcome form).
- Referral system for partners (R-17; brief in `docs/handoffs/2026-10-22-referral-system-brief.md`).
- Case scholarship, and any early-customer offer (my advice: no price cut, launch on proof).
- Parked product items need their exact `EXECUTE PARKED P-xx <name>` phrase (`docs/PARKED-ITEMS.md`).

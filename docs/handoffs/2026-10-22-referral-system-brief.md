# Referral system: the brief for the next session

Written 22 Oct 2026 at the end of the day, for 23 Oct. Founder's words: partners need a referral system; anyone who comes through a partner's reference can log in and paste the partner's referral code, they get a discount, and the partner is paid for that purchase. Build the structure "very well".

## What is true today

| Piece                                                                                                           | Where                                                                   | State                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Partner code = a Paddle discount, flat $25, made by hand, restricted to the Appeal Pass and Account Pass prices | Paddle dashboard; `docs/DEPLOYMENT.md` §5c                              | Works in the sandbox only; Paddle's behaviour for an unknown or expired code in the overlay is **untested** |
| A link ending `?ref=CODE` keeps the code on the buyer's device for 60 days, first click wins                    | `src/lib/partnerCode.ts`, `PartnerCodeCapture.tsx`, `usePartnerCode.ts` | Built, tested                                                                                               |
| The code goes to Paddle as `discountCode`, only for the two Passes                                              | `src/lib/checkoutOptions.ts`, `CheckoutButton.tsx`                      | Built, tested                                                                                               |
| The licence stores which discount was used                                                                      | `licenses.provider_discount_id`, migration `0018`                       | Migration **not applied** to the live Supabase                                                              |
| Monthly commission worked out from licences                                                                     | `scripts/partner-report.mjs` (read-only)                                | Built, tested; uses list prices, not what was paid                                                          |
| Partner page, rules, the arithmetic ($67.20 and $91.20)                                                         | `/partners`, `PARTNERS`, `PARTNER_SALES` in `src/content/audiences.ts`  | Built; says there is no dashboard and no sign-up form                                                       |
| A partner table, a typed-in code, attribution in our database, a ledger, refund reversal, a partner view        | nowhere                                                                 | **Missing: this is the job**                                                                                |

## What the founder wants to exist

1. A signed-in buyer can paste a partner's code (beside the pay button on `/pricing`, and optionally at sign-up or in Billing before purchase), see the discount, and pay less.
2. The sale is attributed to that partner in our own tables, without anyone grouping Paddle transactions by hand.
3. The partner is paid for that purchase, after the refund window, and not for a refunded one.

## Six questions to settle first (recommendation in brackets)

1. **Where codes live.** [A `partners` table and a `referral_codes` table in Supabase, filled by the founder like `pro_accounts`, mirroring the hand-made Paddle discount. Create the Paddle discount by API later, which needs `PADDLE_API_KEY`.]
2. **Attribution that cannot be forged.** [Put the validated code on the `checkout_intents` row and in Paddle `custom_data`; read it back inside `apply_paddle_event` and store it with the licence in the same transaction. Never trust a code the browser reports after payment.]
3. **Rules of use.** [One code per purchase (Paddle takes one); the first partner keeps the sale for 60 days; a partner cannot use their own code; the code never applies to the review, renewal, credits or Pro plan (already true).]
4. **The ledger.** [`referral_events`: partner, transaction id, amount paid, commission, status pending / payable / paid / reversed. Payable after the 14-day window; a refund or chargeback reverses it. The monthly payout stays manual, by bank transfer or Payoneer.]
5. **A partner view.** [A signed-in page with their code, link, sales and balance. Decide whether to build it now or keep the monthly message, since the partner page promises no dashboard.]
6. **Privacy and wording.** [The partner sees "a sale", never the buyer's name or email; we keep the partner's payout details. Update `legal.ts`, the partner rules and the changelog in the same commit.]

## Rules that still apply

- No claim about outcomes; the discount and commission figures in copy come from one place, and a test recomputes them.
- Apply migration `0018` before any SQL that depends on it. Test payment SQL on a real Postgres (PGlite, as `paymentSql*.test.ts` do) and break it on purpose once to see the test fail.
- Run `npm run typecheck`, not bare `tsc`. After every push read `gh run list` and the failing job.
- Test Paddle's unknown-code behaviour in the sandbox as part of this work (`docs/DEPLOYMENT.md` §5c step 2).
- Stage-3 products and the referral work must stay inert until their prices and tables exist: a partner code for a product that cannot be bought earns nothing and must say so.

## Suggested order

1. Apply `0018` in the Supabase SQL editor (founder, two minutes).
2. Settle the six questions above in one short message to the founder.
3. Migration `0020`: `partners`, `referral_codes`, `referral_events`, the attribution column and the extended `apply_paddle_event`, with PGlite tests.
4. The code field and its server check (`/api/referral/validate`), wired into the checkout intent.
5. The commission ledger and an updated `scripts/partner-report.mjs`.
6. The partner view, if the founder wants it now.
7. Copy, Terms, Privacy, changelog, register rows, then every gate and a sandbox purchase with a partner code.

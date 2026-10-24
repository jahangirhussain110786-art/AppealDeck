# Referral activation and payout runbook

24 October 2026. Built locally, not activated remotely. Follow the steps on a sandbox first. This implements R-17; it does not introduce the parked founder-admin surface.

## Configuration in order

1. Identify the last migration actually applied to the target database. Apply missing migrations in numeric order. `0023_referral_ledger.sql` assumes the four-argument payment function from 0021; apply through 0023 in the tested sequence. Do not set the feature switch before the tables, views and functions exist. Keep the normal backup/restore safeguards from `docs/DEPLOYMENT.md`.
2. Keep the existing full-price Appeal Pass price. Optionally configure the Account Pass only after its own migration and sandbox checks. Do not configure extra plans just to enable referrals.
3. In the same Paddle environment as the client token, create a **one-time flat USD 25.00 discount** per approved partner. Enable the checkout code. Use 3–32 upper-case letters and digits. Restrict to exactly the configured base Appeal Pass and, if configured, Account Pass **price IDs**. No product-wide scope, upgrade price, renewal, review, One Response, pack or subscription. Set expiry/usage limits deliberately.
4. Give the server `PADDLE_API_KEY` with `discount.read`. Preserve any separate permissions already needed by the Pro cancellation flow. Never use a public variable for the key.
5. The partner creates an ordinary AppealDeck account. Record that account and the Paddle code/discount mapping in the database as shown below. The approval and payout destination remain a human business decision; this change creates no automatic public enrolment.
6. Enable `NEXT_PUBLIC_REFERRALS_ENABLED=true` in the target environment and rebuild/redeploy through the normal deployment process. The default is false. This flag affects client and static-page output as well as the server.
7. Keep `adjustment.created` and `adjustment.updated` subscribed alongside the existing payment/subscription events. A pending adjustment must update when Paddle approves or rejects it.
8. Run the sandbox matrix below before enabling production referrals. Confirm production has its own registered IDs, prices, discount mapping and server key. Sandbox IDs do not transfer to production.

The founding counter now also requires `PADDLE_API_KEY` with `discount.read`. Its existing code must identify a checkout-enabled USD 80 flat, non-recurring discount restricted to the Account Pass price, with a Paddle usage limit matching `NEXT_PUBLIC_FOUNDING_SPOTS` (default 25). Any mismatch hides the offer. It does not invent a replacement discount. Counts are advisory because Paddle checks the usage limit when a checkout opens, not an atomic reservation at payment time.

## Register one approved partner

Replace the example email, code and discount ID with verified sandbox values first. These are placeholders, not real registrations. The account must already exist. The transaction rolls back on a missing account or duplicate/invalid mapping rather than quietly remapping someone else's code.

```sql
begin;
insert into public.partners(user_id)
select id from auth.users where lower(email) = lower('approved-partner@example.com')
on conflict(user_id) do nothing;

insert into public.referral_codes(partner_id, code, discount_id)
values (
  (select p.id from public.partners p join auth.users u on u.id = p.user_id
   where lower(u.email) = lower('approved-partner@example.com')),
  'PARTNER25',
  'dsc_REPLACE_WITH_REAL_LOWERCASE_ID'
);
commit;
```

Share the actual URL `/decode?ref=PARTNER25`. The partner can sign in at `/partners/account`. Their public recommendation must disclose the commission beside the link. Their payout destination stays in the founder's secure operational records, outside this application table.

## Before paying each month

```powershell
node --env-file=.env.local scripts/referral-report.mjs
```

This reads every registered partner's current database statement, including all rows beyond Supabase's normal page size. It sends nothing and moves no money. Do not use the old `scripts/partner-report.mjs` list-price estimates to settle the new ledger.

Review held sales in the database against Paddle. A non-USD sale, an incomplete amount, a pending refund, a paused-code sale or an unlinked dispute reversal must not become an automatic payment. Current Paddle adjustment documentation does not specify a link to the original disputed adjustment, so unlinked reversals stay held. Reconcile against the provider's actual transaction before making any manual correction.

The statement is calculated in SQL, not by fetching only the first 1,000 sales. It deducts all recorded payouts from eligible commissions. A refund after payment reduces the balance; a negative balance carries forward. Codes paused after an already-earned sale do not erase that earned commission. A code paused before completion puts the new sale on hold for review.

After a confirmed bank/Payoneer transfer, record the **actual USD amount and a unique transfer reference**. Use one record per confirmed transfer. Do not insert a planned payment, and do not delete a record to conceal an overpayment.

```sql
insert into public.referral_payouts(partner_id, currency, amount_cents, reference)
values ('REPLACE_WITH_PARTNER_UUID', 'USD', 6720, 'REPLACE_WITH_UNIQUE_CONFIRMED_TRANSFER_REFERENCE');
```

The USD-only ledger does not calculate local withholding, foreign-exchange settlement or payout-provider charges. Reconcile those operationally before confirming a transfer. The application has no automatic bank or Payoneer integration.

## Sandbox matrix

| Check | Expected |
| --- | --- |
| Anonymous validation | 401; no code or partner lookup disclosed |
| Known code after sign-in | Shows provisional $25 discount; final amount confirmed by Paddle |
| Unknown, expired, exhausted, wrong-currency or broad-scope discount | Refused before creating a referral checkout intent; buyer can remove the code |
| Paddle discount API unavailable | No “discount confirmed” claim; fail closed for that code, with a remove/retry route |
| Partner buys using their own account/code | Refused by validation; SQL also refuses commission |
| Eligible full-price Pass purchase | Buyer gets one entitlement; registered partner gets one pending sale; tax is excluded from commission |
| A second click, another code, or removing a code | Intent reuse does not reuse a different referral attribution |
| Repeated event or repeated transaction completion | No second commission, entitlement or confirmation email |
| Credited upgrade, One Response, review, renewal, packs or Pro | No partner commission; no stacking |
| Code changed inside Paddle after intent creation | No commission unless the signed discount ID matches the stored validated code |
| Approved partial refund | Commission reduces by the refunded before-tax revenue |
| Approved full refund or chargeback | Commission becomes zero; recorded payouts stay recorded |
| Pending refund | Commission held; a later rejection releases the hold |
| Adjustment delivered before completion | Payment and commission honor the known adjustment |
| Unlinked dispute reversal | Held for reconciliation; no guessed restoration |
| Unmatched payment | Existing parked-payment flow; no commission awarded |
| Missing totals or foreign currency | Buyer provisioning continues; commission is held |
| Partner A opens statement; partner B exists | Only A's financial totals/codes appear; no buyer identity or case data |
| More than 1,000 sales | SQL statement includes all sales, not only the first API page |

Real Paddle checkout/refund checks remain required; PGlite and mocked API tests cannot certify the configured Paddle account, live prices or overlay behavior. In particular, try an invalid code entered directly inside the Paddle window as well as in our pre-check field.

## Disable the feature

Set `NEXT_PUBLIC_REFERRALS_ENABLED=false` and rebuild/redeploy. Keep migration 0023 and all payment and payout records; reverting the feature must not erase financial history or restore an old entitlement function.

The switch disables the new field and statement, but preserves the older manual partner-code behavior. To suspend the entire program, stop promotion and disable the corresponding discounts in Paddle too. Reconcile open checkouts and late events before final payouts. Do not represent a switched-off feature as cancelling commissions already earned.

## Reporting limits

Financial history begins with migration 0023. Replaying a previously processed event does not backfill it, because payment deduplication remains intact. Older sales require a separate verified reconciliation; do not infer their totals from today's list prices.

The buyer's local first-touch code can be removed, expire, or be absent on another device. This system attributes qualifying payments to their validated checkout code; it is not cross-device identity tracking. It stops same-account self-referral, not every possible multi-account or collusive abuse.

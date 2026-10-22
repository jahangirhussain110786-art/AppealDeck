# The combined pricing and growth plan (22 Oct 2026)

> **What this is.** The one plan the founder asked for after three research passes on 22 Oct 2026, now imposed on the product ("I authorize all changes as per your planned research finalized above … do no compromise as per existing things"). It supersedes `2026-10-22-pricing-strategy-research.md`, `2026-10-22-growth-and-pricing-blueprint.md` and `2026-10-22-ai-era-pricing-angle.md` wherever they differ; those stay as the evidence. **Stage 1 is built and tested. Stage 2 and later are specified here and not built, for the reasons in §4, each with the number that releases it.**
>
> **Tags:** **V** = checked against the code or a page today · **E** = my estimate. Plain-words companion: `2026-10-22-combined-growth-plan-plain-mobile.html`.

---

## Update, later the same day: stage 2 is built, and switched off

The founder asked why the Account Pass, the founding bonus and the Document Check were not built. The honest answer for the first two was caution about untested payment code, not a rule, so they are now **built inert until configured**, and the SQL that decides who has paid is now tested for real.

- **Built:** the **Account Pass** ($329, every case on the account for 12 months) and the **founding offer** (the first buyers pay the Appeal Pass price; Paddle's usage limit ends it; `/api/founding` shows an advisory counter). Migration `0017`; `/api/checkout/intent` takes a plan; the licence lookup prefers an Account Pass and says when it ends; a fourth card and a "Which Pass?" picker; plan-aware dashboard, billing, purchase email, FAQ, Terms and changelog; partners earn the same 30 percent on it.
- **Switched off:** nothing shows or sells until `NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS` is set, and the webhook passes the new database argument only when it is set. **Apply migration 0017 first**, then create the price: `docs/DEPLOYMENT.md` §5d (F-17).
- **Tested for real:** every migration is applied to PGlite (PostgreSQL inside the test run) and the payment functions are called as the webhook calls them (`src/lib/__tests__/paymentSql.test.ts`, 21 tests). Two deliberate breakages of the migration were each caught. This replaces the weakest part of the earlier argument for waiting.
- **What reading the code showed:** `licenses.plan` and `expires_at` already existed; the lookup already treated a no-case licence as covering every case; the old rule that binds an unassigned Appeal Pass to its first case applies only to `appeal_pass`, so an Account Pass needed its own plan name. The purchase email's "Price: $249" was already wrong for anyone using a partner code and now says "List price".
- **Still staged:** writer packs and a Pro plan (three writers must run a real case first), the price test, the renewal. **The Document Check:** a paid check of what already runs free on the device stays struck; a paid **AI** reading of documents is buildable as its own licence kind credited toward the Pass once Gemini billing is on (F-03). **The $25 rebate** stays struck while outcome sharing is anonymous; the options are an opt-in report with an email (a privacy change) or a manual refund the founder promises by hand.
- Where the table in §2 and the stage-2 text in §4 and §5 say "staged", read this update: the Account Pass and founding offer are built and inert; the rest is as written.

---

## 0. The plan in ten lines

1. **What we sell is not the letter.** A general chatbot writes a letter for nothing. We sell checking the proof, keeping every round, and a response written only from facts the seller confirmed.
2. **One position, said once on every surface:** _a chatbot writes the letter; AppealDeck checks the proof._ It is on `/pricing` as a plain comparison, and in the FAQ, where it says honestly that a chatbot may be enough for a first read.
3. **$249 stays, as the price of one case, every round.** It is a fifth of the cheapest human, and a very low price would read as a weak product to a frightened buyer. The comparison and a dated strip of going rates sit beside it so it is read against something.
4. **The free layer stays generous and unlimited.** The checks run on the seller's device and cost us nothing; free beats cheap, and the free decode is the whole acquisition engine.
5. **Three audiences, three pages, always all visible:** sellers (`/pricing`), appeal writers and VA teams (`/for-professionals`), partners (`/partners`). One optional question at sign-up remembers which, on the device only.
6. **Partners are the acquisition plan, not ads.** 30 percent of what the seller pays, $25 off for the seller, paid after the 14-day refund window. Paid ads stay closed by arithmetic.
7. **Writers get no invented price.** The page says what they can use today and that professional pricing is being set with the first ten writers.
8. **Nothing is shown that cannot be bought or done.** No plan, pack, dashboard or shared team case appears until it exists.
9. **One stage at a time, judged in quarters.** Stage 2 (Account Pass) waits for 25 paid cases; stage 3 (professional plans) waits for three writers who ran a real case.
10. **Every claim stays true:** no outcome, no win rate, no lawyer comparison; the going rates carry a read-on date and a test that fails when it is 150 days old.

---

## 1. Positioning and reasons to choose and stay

| Reason                                                              | Where a seller meets it                       | True today?                      |
| ------------------------------------------------------------------- | --------------------------------------------- | -------------------------------- |
| It reads your documents against what Amazon asked, on your device   | Home, `/pricing` comparison, `/check-invoice` | V                                |
| It keeps every round: what Amazon reopened, added, left outstanding | Home, `/pricing`, the case                    | V                                |
| It writes only from facts you confirmed, and shows its fact check   | `/pricing`, the response stamp                | V                                |
| It tells you when a resubmission has not changed                    | `/pricing`, the case                          | V                                |
| It warns about a fake notice on every notice                        | `/decode`, `/pricing`                         | V                                |
| A reminder before a date you set                                    | `/pricing`, the case                          | V (email needs `RESEND_API_KEY`) |
| Your files stay on your device                                      | Home band, `/pricing`, privacy                | V                                |
| One price per case, every round, no meter                           | `/pricing`                                    | V                                |

**What we never say:** that Amazon rejects chatbot-written appeals (only consultants claim it; no Amazon statement exists), any win rate, "better than a lawyer", or "guarantee". The last is a deliberate keep, not an oversight: the research found that "guarantees" are one of the things sellers' forums warn each other about, so "14-day refund, no questions asked" is the stronger line in this market.

---

## 2. The offers, audience by audience

### Sellers (`/pricing`)

| Offer                    | Price      | What it is                                                                                                            | Status                     |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Free                     | $0         | Decode, scam check, records list, reply reader, unlimited on-device document checks, invoice sums                     | Live                       |
| Free account             | $0         | The case saved encrypted, deadlines, replies applied                                                                  | Live                       |
| **Appeal Pass**          | **$249**   | The response prepared from confirmed facts, AI reading of documents, wording help, every round, backup, 14-day refund | Live (needs Paddle config) |
| Partner code at checkout | $25 off    | A partner's code, kept on the device for 60 days, goes to Paddle as a discount                                        | **Built 22 Oct**           |
| Account Pass             | $329 (E)   | The case plus every new notice on the same account for 12 months                                                      | Stage 2                    |
| Founding bonus           | —          | The first 25 buyers get the Account Pass at the Case Pass price                                                       | Stage 2                    |
| Renewal                  | $99 a year | Cover continues after month 11                                                                                        | Stage 5                    |

### Appeal writers and VA teams (`/for-professionals`)

Built: the page. It lists six things a writer can use today (one list for every client, each client's documents checked, every round kept, facts confirmed and nothing else, the upload-ready pack, no access to the client's account), says the written response is the same $249 per client case, and says plainly that **professional pricing is not set yet** and that cases are not shared between team members. It asks the writer to write in about how they work and what a case should cost them.

**Staged (stage 3):** the opening position for the ten conversations, from the AI-era file: packs of 10 cases at $39 and 30 at $29 each, verified professionals only, with the 10-case minimum as the fence (no seller buys ten cases for one). A monthly plan only if the interviews ask for one. **Not shown anywhere until three writers have run a real case.**

### Partners (`/partners`)

Built: the page, with the whole program in plain words: 30 percent of the price the seller pays (a sale with a code earns $67.20), the seller gets $25 off, 60-day window with the first partner keeping the sale, paid after the 14-day refund window by bank transfer or Payoneer, nothing paid on a refunded or charged-back Pass, six rules for partners (disclose the commission next to the link; advisers tell the seller in writing; no outcome promises or "Amazon partner"; no paid-for or reward-for-good reviews; no logins; no spam), quarterly review of what partners publish, either side can end it. It says **codes are issued by hand and there is no dashboard yet**; each month the founder sends a message with sales and balance.

Unit check (V arithmetic): at $224 paid, commission $67.20, Paddle's 5 percent plus $0.50 about $11.70, we keep about $145 against $67 spent, 2.16 times, above Hormozi's 2 times minimum. A higher rate would fall below it, so top partners get perks, never a higher rate.

---

## 3. What was built on 22 Oct (stage 1)

| Piece                                                                                                                                   | Where                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| "Can I ask a chatbot instead?" comparison and the dated going-rates strip                                                               | `/pricing` (`VersusSection.tsx`, `PRICING.versus`, `PRICING.market`)                                                                      |
| Audience switch on all three pricing pages; a nudge for a visitor who said they write appeals or send sellers                           | `AudienceSwitch.tsx`, `RoleNudge.tsx`                                                                                                     |
| The writers' page and the partner page                                                                                                  | `src/app/for-professionals`, `src/app/partners`, `src/content/audiences.ts`                                                               |
| One optional question at sign-up (not asked mid-case), `?role=` pre-select, stored on the device only                                   | `RolePicker.tsx`, `src/lib/role.ts`                                                                                                       |
| Partner code: `?ref=` kept for 60 days (first click wins), shown by the pay button with a remove link, sent to Paddle as `discountCode` | `PartnerCodeCapture.tsx`, `src/lib/partnerCode.ts`, `checkoutOptions.ts`, `CheckoutButton.tsx`                                            |
| Three FAQ answers (chatbot, writers, partners); the chatbot answer is also on the home page                                             | `src/content/marketing.ts`                                                                                                                |
| Dex lines for the two new pages                                                                                                         | `src/content/guide.ts`                                                                                                                    |
| Footer links, sitemap, privacy line about what the browser holds (dated 22 Oct), changelog                                              | `SiteFooter.tsx`, `sitemap.ts`, `legal.ts`, `changelog.ts`                                                                                |
| Tests                                                                                                                                   | `audiences.test.ts`, `partnerCode.test.ts`, `role.test.ts`, `checkoutOptions.test.ts`, `e2e/audiences.spec.ts`, a11y and Lighthouse lists |

---

## 4. What I corrected after checking the code, and what is staged

The research said some things the code contradicts. Each correction is a finding, not a retreat.

| Research said                                                        | The code says (V)                                                                                                                                                                                                                            | Decision                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A **$49 Document Check**, credited to the Pass, as the first payment | The document checks, invoice sums and facts ledger already run **on the device, free, for everyone**; the Pass pays for the response, the AI reading and backup                                                                              | **Struck.** It would sell something free, take away the zero-price pull that free decoding gives, and the AI reading it could have sold cannot run until Gemini billing is on (F-03). The lower door is the generous free layer plus the 14-day refund. |
| **One free** document check, the rest paid                           | Limiting an on-device check is artificial (a browser can always run it) and it is the best thing in the free tier                                                                                                                            | **Struck.** Unlimited on-device checks stay free.                                                                                                                                                                                                       |
| A **$25 rebate** for an outcome report                               | Outcome sharing is anonymous by design (`outcome_events`): nothing links a report to a buyer                                                                                                                                                 | **Struck.** Paying it would mean linking identity to outcomes, a privacy change the founder has not made. If wanted later, make the report opt-in with an email, as a separate decision.                                                                |
| A **founding price** (then a bonus)                                  | The bonus is the Account Pass, which does not exist yet                                                                                                                                                                                      | **Staged with the Account Pass.**                                                                                                                                                                                                                       |
| An **Account Pass**, **packs** and a **Pro plan**                    | Licences are per case; every one-Pass-per-case rule, the webhook function and the SQL assume one product; the payment path has never taken a real payment (F-01, F-02 open); a new licence type needs a migration only the founder can apply | **Staged, specified in §5.** Building new products onto an untested payment path compounds risk, and the plan's own rule is one stage at a time, judged in quarters.                                                                                    |
| A `profiles` table with a role                                       | Nothing else needs a server-side role, and holding one would add personal data                                                                                                                                                               | **Device only** (`localStorage`); disclosed in the privacy policy.                                                                                                                                                                                      |
| Partners paid 30 percent of the Pass price with a $25 discount       | That leaves 1.84 times, below the 2 times minimum                                                                                                                                                                                            | **30 percent of what the buyer pays** ($224), 2.16 times.                                                                                                                                                                                               |
| A live partner dashboard                                             | Not built; Tolt or FirstPromoter would be a monthly cost and a setup before any partner exists                                                                                                                                               | **A monthly message** until volume justifies a tool; the page says so.                                                                                                                                                                                  |
| Call the 14-day refund a "money-back guarantee"                      | Sellers' forums warn about "guarantees"; the copy gate bans the word                                                                                                                                                                         | **Keep "refund".**                                                                                                                                                                                                                                      |

---

## 5. Stage 2 and later, specified so the next session can build them in one pass

**Stage 2: Account Pass and founding bonus. Released by 25 paid Case Passes.**

- Migration `0017`: `licenses.plan text not null default 'case_pass' check (plan in ('case_pass','account_pass'))`; for an Account Pass `case_id` is null and `expires_at` is purchase plus 12 months. Check the one-Pass-per-case unique index (0014) ignores null `case_id`, and that `apply_paddle_event` (0009/0012/0014/0015) maps `price_id` to `plan` and leaves case Passes untouched.
- `/api/checkout/intent` takes `plan` and chooses the price (`NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS`); `fetchLicenseForUser(userId, caseId)` returns active when a case Pass **or** an unexpired Account Pass covers the user; `PurchasePanel` offers both with the Account Pass as the middle option.
- Founding counter: a server component counts active licences (fails closed to no counter); the bonus is the Account Pass at the Case Pass price for the first 25.
- Tests: webhook for both prices, refund of an Account Pass, expiry, intent per plan, the counter at 24, 25 and 26. Founder steps: a Paddle price, the migration paste, the env var.

**Stage 3: professionals. Released by three writers who ran a real case.** _(Update 22 Oct 2026: the founder asked for it to be built now. It is built and switched off; see `docs/DEPLOYMENT.md` §5e and the decision of that date. Release for sale is still best after the first writer conversations.)_ The opening position is in §2. Build: verification, case credits in the entitlement model, an all-clients list already exists. A shared case between team members needs cases kept on our server, which changes the privacy promise: decide that separately.

**Stage 4: price test. Released by 50 paid cases and 30 outcome reports.** Step $249 to $299 then $349 while revenue per 50 cases started keeps rising; step back once if it falls. Refused-in-full cover only if the refusal rate allows.

**Stage 5: renewal. Released by the first Account Passes reaching month 11.** $99 a year, with US ROSCA disclosures before card entry and, from January 2027, the UK renewal reminders and online cancel.

---

## 6. Finding buyers: the first 90 days

| Channel                                 | Weekly action                                                                                                                                                                          | Keep if, after 30 days         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Writers, VA teams, training communities | 20 personal messages a day in English or Urdu; ten calls asking about their last case and what they paid for tools; each message ends at the free decode and names the partner program | Three ran a real case          |
| Free tools                              | The decoder, scam check and invoice check linked in helpful answers                                                                                                                    | 50 decodes a week from outside |
| Notice clinic in existing groups        | Answer five "my account was suspended" posts a day as a member, with the disclosure each group asks for                                                                                | 10 decodes a week traced to it |

Keep the one that works; drop the other two. **No ads:** a click costs about $9.87 and a stranger buys at 0.5 to 2 percent, so a buyer costs $490 to $1,970 against about $236 received.

**How we know:** Plausible counts the funnel (decode, intake, checkout opened, Pass purchased); Paddle's transaction list shows which partner code each sale used; the monthly check is Hormozi's: 30-day cash per buyer at least twice what it cost to get that buyer, for every channel.

---

## 7. Why they stay

| Who     | Reason to come back                                                                              | Built                  |
| ------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| Seller  | Amazon's next reply is applied to the same case; the deadline clock; the pack for the next round | V                      |
| Seller  | The next notice on the same account (Account Pass)                                               | Stage 2                |
| Writer  | Every client case in one list, each client's documents checked, a pack per client                | V (list, checks, pack) |
| Writer  | A price set with them                                                                            | Stage 3                |
| Partner | A monthly message with real money in it; the program page they can quote                         | V                      |

The outcome we own and count is "a complete response: every requested record answered or honestly declared". Amazon's decision is not ours to promise.

---

## 8. Founder steps (new)

1. **Partner codes (before any partner is accepted):** in Paddle create a flat $25 USD discount per partner code, restricted to the Appeal Pass price, with "Checkout discount code" on. **Test in the sandbox what an unknown code does** (the Paddle docs do not say). Steps in `docs/DEPLOYMENT.md` §5c.
2. **Read the `support@` mailbox for "Partner program" and "Appeal writer" messages** (the pages tell people to write there). F-05 already requires the mailbox to exist.
3. **Payoneer** in your own name for partner payouts; the page promises a monthly payment by bank transfer or Payoneer.
4. **Read the two new public pages (`/partners`, `/for-professionals`) before launch.** They state a commission and a discount in your name. Change the numbers in `src/content/audiences.ts` and `PARTNERS` tests move with them.
5. **Re-read the going rates** (`PRICING.market`) every quarter; a test fails when the date is 150 days old.
6. **Ten writer conversations** before stage 3 (§6).

## 9. Risks this plan carries

- **A promise only you can keep.** The partner page and changelog say partners are paid and codes are issued. If you decide not to run it, remove the page, the footer link, the FAQ entry and the changelog line together.
- **Unknown-code behaviour in Paddle's window is undocumented.** Until the sandbox test, treat a mistyped code as possibly showing an error in checkout.
- **Amazon's own Claude plugin** (US beta since 23 Sep 2026) could add appeal preparation with live account data. If it does, the edge is the document checks, the round-by-round record and the fact lock: invest there, not in prose.
- **AppealsPro** adding document checks would narrow the edge; look at its pricing page monthly.
- **Thin seller voice.** Before stage 2, read 20 recent "I used ChatGPT and got refused" posts in the groups the research could not reach.

# Connecting sellers' Amazon accounts (SP-API): research, fact-check and recommended steps

10 Oct 2026. Research only: nothing is built and no decision is recorded. The founder asked for this
to be done **free of AppealDeck's existing decisions** (D1–D10, AM-27 and the rest), so this document
says what is true and what would work best, then lists which existing decisions it would collide with
(§6) so the founder can decide.

Source material: the founder's 10 Oct conversation with Meta AI (two answers: how to read every
seller's notices, and what an SP-API tool may and may not do). Every claim was checked against
Amazon's own developer documentation, Amazon's API definitions on GitHub
(`amzn/selling-partner-api-models`), and dated secondary reporting where Amazon has no page. Sources
are at the end.

---

## 1. Plain words first

**The good news.** Meta AI is right about the basic shape: you build one app, and each seller
presses "Connect Amazon" and approves it. You then hold a key for that seller only, and their data
stays separate from every other seller's. Amazon cancelled the API fees it had planned for 2026, so
registering costs nothing today. You no longer need to set up AWS security roles (Amazon dropped
that in 2023).

**The important news Meta AI missed.** **Amazon's API cannot read the text of a deactivation or
policy notice.** It can tell you _that_ something happened, but not _what Amazon wrote_:

- the account changed between Normal, At risk and Deactivated (the moment it happens);
- how many IP complaints, authenticity complaints, safety complaints, policy violations and
  document requests the account has, with the dates they cover, and the Account Health Rating
  score (once a day is plenty);
- listing-level problems, with Amazon's issue message and what Amazon did about it (suppressed,
  removed).

The notice itself (the paragraph that says why, and what to send) stays in Seller Central and in
the seller's email. **So "our tool reads every notice automatically" is not possible through the
API.** The best honest version is: _the API warns you the moment something goes wrong and fills in
the facts, and the seller pastes or forwards the notice text._

**The new thing Meta AI didn't know about.** On **30 Sep 2026** Amazon launched a **Support API**.
With a seller's permission, it reads their Seller Support cases, including the **text of every
email** Amazon sent in the case and its attachments. If Amazon's replies to appeals show up there
(**not yet confirmed: test it on a real account**), the tool could see Amazon's answers without
asking the seller to paste them.

**Where Meta AI is wrong in a way that could hurt sellers.** Its "grey area: headless browser with
the seller's consent" is not a grey area any more. Amazon's Agent Policy (in force 4 Mar 2026)
targets exactly that: automation that drives Seller Central pages. It binds the **seller**, so a tool
that does it puts the seller's account at risk. Notably, Meta's own example (a deep link plus a draft
the seller pastes in) involves no headless browser at all, and it is what AppealDeck already does.

**The opportunity no one mentioned.** A connected account gives you something no appeal tool has
today: **verified outcomes**. If the API reports the account went from Deactivated back to Normal
after the seller used the tool, that is a real reinstatement, observed rather than self-reported. A
genuine success rate, with a denominator, is the strongest marketing asset in this market, and the
only honest one.

**What it costs** (details in §5): $0 to register; a few dollars a month for the AWS message queue
that receives Amazon's alerts; probably a Professional seller account ($39.99/month) to test on
your own store; **avoid any buyer-data permission**, which is what triggers yearly penetration tests
(~$2,000+) and a hard security review.

**What I recommend:** yes, add "Connect Amazon", but as **early warning and fact-filling**, not as
"we read your notices". Read-only permissions only, never write. Start with a private test on one
account, then up to 25 sellers before listing in Amazon's app store. §4 has the steps in order.

---

## 2. Fact-check of the Meta AI conversation, claim by claim

✅ correct · ⚠️ partly correct or outdated · ❌ wrong

### Answer 1: how the connection works

| Meta AI said                                                                                                                                                   | Verdict                 | What is actually true (Oct 2026)                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Option 1 (developer buys one API and reads everyone) will not work; Option 2 (each seller authorizes) is the way                                               | ✅                      | Each seller authorizes through OAuth; data is per-seller.                                                                                                                                                                                                                                                                                |
| Register "in AWS + Seller Central Developer Portal", create an IAM role                                                                                        | ❌ outdated             | Since 2 Oct 2023 SP-API needs no AWS IAM role and no request signing. Public developers now register in the **Solution Provider Portal (SPP)**, which doesn't even require a Seller Central account.                                                                                                                                     |
| Roles named "Notifications", "Seller Central Reports", "Messaging", "Finances/Orders/Listings"                                                                 | ⚠️ names wrong          | Real role names: **Selling Partner Insights** (account status and performance: the one that matters here), Product Listing, Buyer Communication, Finance and Accounting, Inventory and Order Tracking, and others. Notifications are not a role. There is also a role Meta didn't mention, **Notifications in Seller Central** (see §3). |
| Approval takes 2–4 weeks                                                                                                                                       | ⚠️                      | Amazon says 1–2 weeks for ordinary roles. Restricted (buyer data) roles take a multi-stage review with an architecture call, and forum reports show repeated rejections.                                                                                                                                                                 |
| Consent URL, `spapi_oauth_code`, `selling_partner_id`, exchange for refresh token                                                                              | ✅                      | Correct flow.                                                                                                                                                                                                                                                                                                                            |
| The refresh token "never expires unless the seller revokes"                                                                                                    | ❌                      | For public apps the seller must **re-authorize every 365 days** (Amazon emails them 30 days before), and again whenever you add a role. If the re-authorization flow is broken, the connection silently dies.                                                                                                                            |
| "Notices are scattered in 3 APIs"                                                                                                                              | ⚠️                      | Account-health information is in **2** places (one notification, one report), plus listing issues. **None contains notice text.**                                                                                                                                                                                                        |
| `ACCOUNT_STATUS_CHANGED` for warnings and deactivation notices                                                                                                 | ⚠️                      | Real, but it carries only `previousAccountStatus` and `currentAccountStatus` (NORMAL / AT_RISK / DEACTIVATED). No reason, no text, no ASIN.                                                                                                                                                                                              |
| `LISTING_STATUS_CHANGED`                                                                                                                                       | ❌                      | Doesn't exist. The real ones are `LISTINGS_ITEM_STATUS_CHANGE` (created/deleted/buyability) and `LISTINGS_ITEM_ISSUES_CHANGE` (issues with severity and enforcement actions).                                                                                                                                                            |
| `FBA_INVENTORY_AVAILABILITY_CHANGES`, `FEE_PROMOTION`, `BRANDED_ITEM_CONTENT_CHANGE`, `ANY_OFFER_CHANGED`, `B2B_ANY_OFFER_CHANGED`, `FEED_PROCESSING_FINISHED` | ✅ exist, ⚠️ irrelevant | All real, but none is a notice. They are inventory, pricing and feed events.                                                                                                                                                                                                                                                             |
| "Solicitations & Performance Notifications API: `getAccount` health, `getViolations`"                                                                          | ❌                      | No such operations. The Solicitations API only asks buyers for reviews.                                                                                                                                                                                                                                                                  |
| `GET_V1_SELLER_PERFORMANCE_REPORT` every 1–2 hours per seller                                                                                                  | ⚠️                      | Exists, but the useful one is **`GET_V2_SELLER_PERFORMANCE_REPORT`**. It can only be requested on demand (not scheduled), and the numbers change daily, so hourly is wasted calls.                                                                                                                                                       |
| Push to "SQS queue or HTTPS endpoint"                                                                                                                          | ⚠️                      | Amazon documents **SQS or EventBridge** only. A plain HTTPS webhook isn't offered, so you need an AWS account for the queue.                                                                                                                                                                                                             |
| Per-seller rate limits, need a queue                                                                                                                           | ✅                      | Limits are per operation, per seller, per app (token bucket).                                                                                                                                                                                                                                                                            |
| Buyer PII must be encrypted and deleted after 30 days; Amazon audits                                                                                           | ✅                      | Data Protection Policy. Also: vulnerability scans every 30 days and a penetration test every year **if you take buyer data**.                                                                                                                                                                                                            |
| "Hosting: AWS is mandatory anyway"                                                                                                                             | ❌                      | Not mandatory. Your app can run anywhere (Vercel is fine). Only the alert queue (SQS/EventBridge) lives in AWS.                                                                                                                                                                                                                          |
| Postgres with row-level security per seller                                                                                                                    | ✅                      | Sensible; it's what AppealDeck's Supabase already does.                                                                                                                                                                                                                                                                                  |

### Answer 2: what a tool can and can't do

| Meta AI said                                                                                         | Verdict          | Note                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listings, catalog, inventory, FBA, orders, pricing, reports, finances, ads, returns can be automated | ✅ broadly       | With the matching role. Ads is a separate API (Amazon Ads API) with its own registration.                                                                                                                                                                      |
| "Read Account Health Status, Policy Violations"                                                      | ⚠️               | Status and **counts** only, not the violations themselves.                                                                                                                                                                                                     |
| Cannot change bank, tax, address; cannot create or close accounts; cannot manage users               | ✅               | No such operations.                                                                                                                                                                                                                                            |
| **Cannot file an appeal by API; must be done manually in Account Health**                            | ✅               | Correct, and the most important line for AppealDeck. There is no appeals API, so the seller always submits.                                                                                                                                                    |
| Cannot upload identity documents                                                                     | ✅               |                                                                                                                                                                                                                                                                |
| Buyer messages "outside the 24–48 hour window"                                                       | ❌               | Not how it works. Messaging is limited by message type and by Amazon's buyer-messaging rules. The 24-hour figure is a response-time metric, not a sending window.                                                                                              |
| Review requests: one per order                                                                       | ✅               |                                                                                                                                                                                                                                                                |
| "Grey area: API for 90% + headless browser with the seller's consent for the rest"                   | ❌ **dangerous** | Amazon's Agent Policy (4 Mar 2026) covers automated agents acting on Amazon Services and is reported to prohibit browser automation and scraping of Seller Central. It binds the seller, and the seller's consent does not make it allowed. **Never do this.** |
| Its example: detect the problem, alert, deep link plus a draft the seller pastes                     | ✅               | Fully compliant, and it is AppealDeck's model.                                                                                                                                                                                                                 |

---

## 3. What Meta AI didn't know (verified)

1. **The planned API fees were cancelled.** Announced Nov 2025: $1,400 a year for third-party
   developers plus usage fees on GET calls from April 2026. Postponed in March, then on **12 May
   2026** Amazon said it would "not move forward … at this time." Free today. The wording leaves room
   for a return, so keep it in the budget as a risk.
2. **Support API (launched 30 Sep 2026).** `listCases`, `getCase`, `listContacts`. Case fields:
   subject, status (resolved / pending your action / pending Amazon / transferred), dates. Contacts
   carry the **email body**, chat transcripts, phone notes and attachment download links. _Unknown:_
   which role it needs, and whether Account Health appeals and their replies appear as cases. The
   Account Health dashboard is a separate system from the Seller Support case log. **Test on a real
   account before planning around it.**
3. **App Integrations API, role "Notifications in Seller Central".** An approved app can post a
   notification **inside Seller Central** (banner and homepage), from a template, and see whether
   the seller acted on it. That means AppealDeck's alert could appear where sellers already look,
   which is a distribution channel, not just a feature.
4. **The full V2 performance report** (role Selling Partner Insights) carries, per marketplace:
   Account Health Rating score and status; and for each of `listingPolicyViolations`,
   `restrictedProductPolicyViolations`, `customerProductReviewsPolicyViolations`,
   `otherPolicyViolations`, `productAuthenticityCustomerComplaints`,
   `productConditionCustomerComplaints`, `productSafetyCustomerComplaints`,
   `receivedIntellectualPropertyComplaints`, `suspectedIntellectualPropertyViolations`,
   `foodAndProductSafetyIssues`, `documentRequests`: a **count, status, target and date range**.
   Plus `policyViolationWarnings`, ODR, late shipment and the other metrics. **No text and no ASINs.**
5. **Data Kiosk "Seller Analytics" (30 Sep 2026).** Its "account health" group is order metrics
   (defect rate, late shipment, A-to-z, chargebacks, Account Health Rating score) with peer
   benchmarks. Useful for "you're drifting toward a limit", not for notices.
6. **Authorization limit: 25 sellers** for a public app that is not listed in the Selling Partner
   Appstore (10 self-authorizations for testing). Beyond that you must list it. Listing is free; it
   needs a live https product page, a support URL and a working OAuth flow.
7. **Amazon's Seller Assistant** is being turned into an "agentic" helper that monitors account
   health and drafts fixes with the seller's permission (announced Sep 2025, rolling out through
   2026; details are from secondary sources). This is the real competitor. It already sees
   everything an API app sees, and more.

---

## 4. Recommended steps (in order)

The aim is **a higher reinstatement rate and a product that keeps working long term**. SP-API helps
in four concrete ways: earlier warning (acting at At risk, before Deactivated), exact facts in the
response (counts, dates, listing issues), seeing Amazon's replies, and **measuring outcomes
honestly**. It does not help with the hardest part (the seller's evidence and root cause), which
stays where AppealDeck is already strong.

### Step 0: confirm the unknowns (1–2 days, ~$0 to $40)

1. Upgrade your own Seller Central account to **Professional** for one month if needed. Amazon's
   Appstore page says app access comes with a Professional account; an Individual account probably
   cannot authorize apps. **Confirm on the "Manage Your Apps" page first.**
2. Register a developer profile in the **Solution Provider Portal** as a public developer. Use your
   legal name and "Hawlton" as the trading name; expect to be asked for documents. Answer the
   security questions exactly as you will implement them.
3. Request **one role only: Selling Partner Insights**. It is read-only, has no buyer data, and so
   has no penetration-test requirement.
4. On your own account, test: the V2 performance report, the `ACCOUNT_STATUS_CHANGED`
   subscription, and the **Support API** (does an Account Health appeal appear as a case? which role
   does it need?). Write the answers down. Steps 3–5 below depend on them.

### Step 1: "Connect Amazon" as an early-warning feed (the core)

- OAuth connect, refresh tokens encrypted at rest (Supabase + an encryption key outside the
  database), **365-day re-authorization flow tested** (Amazon warns this is where apps lose sellers).
- Subscribe to `ACCOUNT_STATUS_CHANGED` through **EventBridge or SQS** (AWS, a few dollars a month at
  this scale). Request the V2 performance report **once a day** per connected seller.
- What the seller sees:
  - **"At risk"** → "Something changed: authenticity complaints went from 0 to 2 this week. Open
    Account Health, copy the notice, paste it here." The case opens already holding the counts, dates
    and kind.
  - **Deactivated** → the same, marked urgent.
  - A rising `documentRequests` count → "Amazon has asked you for documents".
- **Never** request write roles. A seller reading "this app can manage your listings" on Amazon's
  consent screen is the fastest way to lose trust, and you never need it.
- Identify the app honestly (the user-agent the SDK sends, and the app name on the consent page),
  in the spirit of the Agent Policy, even though reading through the official API is the sanctioned
  route.

### Step 2: verified outcomes (the long-run asset)

- When a connected seller's status goes **Deactivated → Normal** after they used the tool, record
  it as a reinstatement, with the case kind and how long it took. When it stays Deactivated past the
  appeal window, record that too.
- Only with the seller's opt-in, only counts, published only once the numbers mean something (with
  the denominator). This is how the product earns a real "X of Y reinstated" figure that no
  competitor can honestly show.

### Step 3: Amazon's replies via the Support API (only if Step 0 confirms it works)

- If appeal replies appear as case emails: read new contacts on the seller's open cases, run them
  through the existing reply analyser, and show "Amazon answered: they want the invoices again"
  without a paste.
- Attachments: download only on the seller's request, never in bulk.

### Step 4: alerts inside Seller Central (App Integrations)

- Apply for "Notifications in Seller Central" once Step 1 is live, so the warning appears where the
  seller already is.

### Step 5: listing-level issues (optional, decide after Step 1)

- `LISTINGS_ITEM_ISSUES_CHANGE` and the Listings Items API give **Amazon's own issue message per
  listing** (suppressions, removals, enforcement). This is the one place the API gives real text.
- **Catch:** it needs the **Product Listing** role, which also allows editing listings, and the
  consent screen will say so. Only do this if sellers ask for it.

### Step 6: getting the notice text itself

The API will never give it. The two lawful routes:

- **Forwarding address** (seller forwards Amazon's email to `case-xxxx@in.appealdeck.com`): no
  Google approval needed; you receive only what they choose to forward. Cheapest and most private.
- **Gmail connection** (reading the inbox): needs Google's restricted-scope verification and a CASA
  security assessment, **about $540–$1,000 a year** through the self-serve route, 2–8 weeks, renewed
  yearly. It is also far more invasive. **Not recommended**: the forwarding address gets 90% of the
  value at near-zero cost and risk.

### Never

- Headless browsers, scraping Seller Central, or auto-submitting appeals (no API exists, and the
  Agent Policy plus the seller's own agreement forbid it).
- Buyer-data (PII) roles. AppealDeck does not need buyer names or addresses, and they bring the
  penetration-test and review burden in §5.
- Claiming the tool "reads your notices" or "monitors everything". It reads status and counts.

---

## 5. Money, registrations, certifications and hard parts

| Item                                                           | Needed when                       | Cost                                                                                                                | Difficulty       | Notes                                                                                                                                                      |
| -------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solution Provider Portal developer registration                | Step 0                            | **$0**                                                                                                              | Medium           | 1–2 weeks review; "organization" fields need care for a sole proprietor; reply to Amazon's questions within 5 days or the case closes.                     |
| SP-API usage fees                                              | Today                             | **$0**                                                                                                              | —                | Cancelled 12 May 2026 "at this time". Keep **$1,400/year + usage** as a contingency in case they return.                                                   |
| Professional seller plan (your own test account)               | Step 0                            | **$39.99/month** (US)                                                                                               | Low              | Probably needed to authorize your own app; check first. One month may be enough.                                                                           |
| AWS account (SQS or EventBridge for alerts)                    | Step 1                            | **~$0–5/month** at this scale                                                                                       | Low              | Needs a payment card. Only the queue is in AWS; the app stays on Vercel.                                                                                   |
| Selling Partner Appstore listing                               | After 25 sellers                  | **$0**                                                                                                              | Medium           | Live https product page, support URL, working OAuth, compliance with Amazon's Acceptable Use and Data Protection policies.                                 |
| Data Protection Policy, Section 1 (all apps)                   | Step 1                            | $0 cash, real engineering                                                                                           | Medium           | Encrypt tokens and credentials, key management, incident response, data classification. You answer a questionnaire; Amazon can audit.                      |
| Data Protection Policy, Section 2 (only with buyer-data roles) | **Avoid**                         | Pen test **~$2,000+/year** (one quoted vendor ≈ $2,000 for two scopes; certified testers cost more) + monthly scans | **High**         | Plus an architecture review with Amazon; forum reports of 5–6 rejections. The recommendation is to never request these roles.                              |
| Google CASA assessment (Gmail reading)                         | **Avoid**                         | ~$540–$1,000/year                                                                                                   | High             | Use a forwarding address instead.                                                                                                                          |
| Cyber liability insurance                                      | When holding many sellers' tokens | Varies (rough guess: hundreds to low thousands of USD a year; get quotes)                                           | Low              | Not required by Amazon. Worth considering once you hold access keys for many sellers.                                                                      |
| Company registration                                           | Your call                         | Varies                                                                                                              | Medium           | Not required by Amazon as far as found. Holding tokens for many sellers is a liability that a company structure may protect you from; ask a local adviser. |
| Annual re-authorization handling                               | Every connected seller, yearly    | Engineering                                                                                                         | Medium           | Amazon's docs warn sellers are lost when this flow is untested.                                                                                            |
| Agent Policy compliance                                        | Always                            | $0                                                                                                                  | Low if read-only | The primary text was not found publicly; the summary relies on several consistent secondary sources. Re-read it from Seller Central before launch.         |

**Things that stay hard no matter what:** the notice text needs the seller (paste or forward); the
appeal needs the seller to submit it; Amazon can change or withdraw API access at any time (it
reserved that right in the Agent Policy, and every app depends on Amazon's goodwill); Amazon's own
assistant is moving into the same space.

---

## 6. AppealDeck decisions this would collide with (for the founder to decide)

This research ignored existing decisions on purpose. These are the ones a "Connect Amazon" feature
would need to revisit:

| Existing decision                                           | Conflict                                                                                                                                                                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D7**: "SP-API only after legal clarity"                   | Legal clarity now largely exists: SP-API is Amazon's sanctioned route and the fees are gone. This is the decision that would be reopened.                                                                        |
| **AM-27** and the "no access to your account" outreach line | Connecting via the official API is read access with consent. The line would become "read-only, through Amazon's official API, revocable any time, never submits anything", which is still strong, but different. |
| **D1/D6 "local-first"** (already narrowed by AM-26)         | Refresh tokens and the counts must live on the server, encrypted. The privacy policy would need a new section.                                                                                                   |
| **D6 "win rates only from opt-in outcome data"**            | Compatible, and better served: verified status changes are opt-in outcome data with a denominator.                                                                                                               |
| **P-04 (email forwarding intake, parked)**                  | Step 6 recommends exactly this as the route to notice text.                                                                                                                                                      |
| **P-13 (outcomes page, parked)**                            | Step 2 is what would eventually make it possible.                                                                                                                                                                |
| **D4** (individual, incorporate at ~100 users)              | Holding many sellers' access keys may argue for incorporating earlier.                                                                                                                                           |
| **F-08** (EU/UK blocked)                                    | No new conflict; connected EU sellers would still be blocked.                                                                                                                                                    |

---

## 7. Open questions only a real account can answer

1. Can an Individual-plan seller authorize an SP-API app? (Probably not.)
2. Which role does the Support API need, and do Account Health appeals and their replies appear as
   cases with email text?
3. How quickly does `ACCOUNT_STATUS_CHANGED` fire relative to the notice email?
4. Does the V2 report's `documentRequests` count rise at the same time as a "please provide
   documents" notice?
5. Will Amazon accept a sole proprietor in Pakistan with a trading name as the developer
   "organization"?

---

## Sources

- [SP-API no longer requires AWS IAM or Signature V4 (Amazon changelog)](https://developer-docs.amazon.com/sp-api/changelog/sp-api-will-no-longer-require-aws-iam-or-aws-signature-version-4)
- [Notification type values (Amazon)](https://developer-docs.amazon/sp-api/docs/notification-type-values)
- [Performance report types, incl. GET_V2_SELLER_PERFORMANCE_REPORT (Amazon)](https://developer-docs.amazon/sp-api/docs/report-type-values-performance)
- [Selling Partner API roles (Amazon)](https://developer-docs.amazon/sp-api/docs/roles-in-the-selling-partner-api)
- [Authorize public applications / renew authorizations, 365 days (Amazon)](https://developer-docs.amazon.com/sp-api/docs/authorize-public-applications) · [Renew authorizations](https://developer-docs.amazon.com/sp-api/docs/renew-authorizations)
- [Authorization limits: 25 unlisted (Amazon)](https://developer-docs.amazon.com/sp-api/docs/application-authorization-limits)
- [List your app on the Selling Partner Appstore (Amazon)](https://developer-docs.amazon.com/sp-api/docs/list-your-app-on-the-selling-partner-appstore)
- [Register as a public developer (Amazon)](https://developer-docs.amazon/sp-api/docs/register-as-a-public-developer) · [SPP FAQ](https://developer-docs.amazon/sp-api/docs/spp-faq) · [Registration overview](https://developer-docs.amazon/sp-api/docs/sp-api-registration-overview) · [Applying for PII roles](https://developer-docs.amazon.com/sp-api/docs/applying-for-pii-roles)
- [SP-API release notes: Support API and Seller Analytics, 30 Sep 2026 (Amazon)](https://developer-docs.amazon/sp-api/docs/sp-api-release-notes)
- Support API definition: `models/support-api-model/support_2025-02-01.json`; Seller Analytics schema: `schemas/data-kiosk/analytics_sellerAnalytics_2025_03_31.graphql`, both in [amzn/selling-partner-api-models](https://github.com/amzn/selling-partner-api-models) (read 10 Oct 2026)
- [App Integrations API (Amazon)](https://developer-docs.amazon.com/sp-api/docs/app-integrations)
- [Data encryption](https://developer-docs.amazon.com/sp-api/docs/protecting-amazon-api-applications-data-encryption) · [Vulnerability management](https://developer-docs.amazon.com/sp-api/docs/vulnerability-management) · [Security and compliance overview](https://developer-docs.amazon/sp-api/docs/security-compliance-overview) (Amazon)
- [Troubleshoot seller accounts: track account health via ACCOUNT_STATUS_CHANGED or V2 report (Amazon)](https://developer-docs.amazon.com/sp-api/docs/troubleshooting-seller-accounts)
- Fees: [ppc.land: fees introduced](https://ppc.land/amazon-introduces-fees-for-third-party-developer-api-access-in-2026/) · [ppc.land: fees dropped](https://ppc.land/amazon-drops-sp-api-fees-after-developer-pushback/) · [Novadata chronology](https://novadata.io/resources/news/amazon-sp-api-subscription-fees-2026) · [Novadata: cancelled May 2026](https://novadata.io/resources/news/amazon-cancels-sp-api-fees-may-2026)
- Agent Policy (secondary; primary text not public): [ppc.land](https://ppc.land/amazons-new-ai-agent-rules-shake-up-sellers-before-march-4-deadline/) · [ecomsellertool](https://ecomsellertool.com/blog/amazon-agent-policy-ai-tools) · [SellerSprite](https://sellersprite.ai/en/blog/amazon-bsa-agent-policy-2026) · [Profasee](https://profasee.com/blog/amazon-ai-agent-policy-what-sellers-need-to-know/)
- Seller Assistant (secondary): [SellerSprite](https://www.sellersprite.com/en/blog/amazon-ai-seller-assistant-agentic-2026)
- Pen test pricing data points: [Cybersecify](https://cybersecify.com/amazon-sp-api-pentest/) · [Upwork posting](https://www.upwork.com/freelance-jobs/apply/Penetration-Testing-Network-Web-Application-for-Amazon-API-Compliance-Azure_~022066931951440545929/)
- PII-role rejections (forum, anecdotal): [Seller Forums](https://sellercentral.amazon.com/seller-forums/discussions/t/874d51ed-ab9d-4cb9-93b6-c8a36d66af04)
- Gmail CASA cost: [Unipile](https://www.unipile.com/integrating-google-oauth-2-0-user-authentication-into-your-app/) · [Indie Hackers report, Jan 2026](https://www.indiehackers.com/product/mailnotes)
- Appstore access with a Professional account: [sell.amazon.com](https://sell.amazon.com/tools/selling-partner-appstore)

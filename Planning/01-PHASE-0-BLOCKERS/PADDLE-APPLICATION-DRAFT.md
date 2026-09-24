# Paddle Merchant Application — DRAFT (paste into vendor.paddle.com)

> AI drafted. You submit in your own identity (Individual seller, Pakistan). Do not change the category. Answer risk questions honestly using this text.
>
> **Corrected 24 Sep 2026.** Until today this draft described the product at **$199**, on the `appealdeck.app` domain, as "an AI-generated Plan of Action" and as a Chrome extension. The price has been $249 since the 21 Sep reset; the site is `appealdeck.com`; the response is assembled from the seller's own confirmed facts, with optional AI help on the wording only; and there is no extension. Describing the product to the merchant of record as something it is not is a misdescription, so the text below matches `docs/CURRENT-STATE.md`.

## Business details
- **Business name:** AppealDeck (by Hawlton — brand/trading name; individual seller Jhangir Hussain)
- **Entity type:** Individual / Sole proprietor (Pakistan)
- **Website:** https://appealdeck.com
- **Support email:** support@appealdeck.com
- **Product category:** **Digital products or SaaS**

## What we sell
A one-time "Appeal Pass" (**$249**, one case) for a web app that helps suspended or flagged Amazon sellers:
1. **Decode** their Amazon notice: what it asks for, the deadline it states, and what to do first (free, no account).
2. **Plan the evidence** the case needs, and check the seller's own business documents against the case (dates, product identifiers, names).
3. **Prepare the response** — the Plan of Action or document response Amazon asks for — from the facts the seller confirms. Optional AI help can improve the wording of a section; it cannot add facts, and the seller accepts or rejects each change.
4. **Track** deadlines and replies, with an encrypted case record kept in the seller's own browser.

## How it works (technical, for risk review)
- A web app only. The seller pastes their own notice text and uploads their own documents. We never log in to, read from, or submit to the seller's Amazon account.
- Case data is stored encrypted in the seller's browser. Notice text is processed by our own server; document checks, and wording help when the seller asks for it, are sent to Google's paid Gemini API from our backend (key never in the browser).
- We do **not** guarantee reinstatement and publish no approval rates. The product states plainly that Amazon decides.
- No forged documents, no policy evasion. Cases involving alleged forged documents, fraud or child safety are routed to professional help and never sold.

## Pricing & billing
- One-time purchase: **$249 Appeal Pass**, one case, every revision of that case included, no subscription.
- Sold via Paddle as Merchant of Record, so Paddle handles VAT/GST and issues the customer invoice.
- Paddle pays out to the founder's personal Wise (or Payoneer) account.

## Refund & consumer policy
- **7-day no-questions voluntary refund** from the date of purchase.
- **EU/UK consumer withdrawal:** explicit prior consent captured at checkout + a durable-medium confirmation email sent immediately after purchase, per local distance-selling rules.
- Full policy text lives at https://appealdeck.com/refund and https://appealdeck.com/terms.

## Risk / compliance Q&A (use verbatim if asked)
- *What is your product?* "A self-serve web app that helps Amazon sellers understand a notice and prepare their own response. We do not submit anything on the customer's behalf, never access their Amazon account, and do not guarantee outcomes."
- *Any gambling / crypto / adult / sanctioned content?* "No."
- *Do you handle cardholder data?* "No — Paddle is the MoR and handles all payment data."
- *Refund handling?* "7-day voluntary refund + EU withdrawal consent; Paddle manages the mechanics."

## Notes for you (founder)
- Keep the website **live with legal pages** (privacy, terms, refund) before submitting — Paddle checks this.
- The rendered legal pages come from `src/content/legal.ts`; the files in `legal/` are authoring records.
- Category must stay **Digital products or SaaS**. Never tick "Human services."

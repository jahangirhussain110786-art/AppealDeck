<!-- DRAFT — AI-authored, founder must review + publish. Do not go live until Paddle-applied site is up. -->
<!-- NOTE added 11 Sep 2026: this file is NOT what's rendered on /privacy. The live source is
     src/content/legal.ts, which was brought to substantive parity with this draft (international
     transfers, data-subject rights, breach notification, retention, Gemini disclosure) in the
     11 Sep 2026 full-repo audit — see docs/DECISIONS.md. Treat this file as the original authoring
     record, not the source of truth; edit src/content/legal.ts for anything that must actually change. -->

# Privacy Policy — AppealDeck

**Last updated:** 31 Aug 2026 (draft)
**Controller:** Jhangir Hussain, trading as "AppealDeck by Hawlton" (individual seller, Pakistan). Contact: hello@appealdeck.app (once the domain is live).

> **SUPERSEDED — historical draft, not published.** The privacy notice actually served at `/privacy` is generated from `src/content/legal.ts`, not from this file. This draft was written on 31 Aug 2026 and diverged from the shipped product; it is kept only as a record of the original intent. **Do not treat any statement here as a current product claim, and never "correct" the live page to match this file.** Corrected 22 Sep 2026 (AM-26) — see below.

## 1. Our model: local-first for evidence files
AppealDeck stores your case file, decoded facts, drafted Plans of Action and uploaded evidence **in your own browser**, encrypted via the Web Crypto API in IndexedDB.

**Correction (22 Sep 2026).** The original wording of this section claimed your notice text was "not uploaded to us by default" and that "we cannot read your case vault." Both were wrong about the shipped product: notice text has always been sent to our server for decoding and response preparation, and on to Google Gemini for AI-assisted drafting — which the live notice at `/privacy` discloses correctly and always has. Under AM-26 the product will additionally read uploaded business documents in order to check them against what Amazon requested; the live notice is updated in the same commit that ships that capability (AA-43 blocks AA-41). What remains true and is not changing: AppealDeck never signs in to Seller Central, never submits anything to Amazon for you, and never sees your vault passphrase.

## 2. When data leaves your device
- **Paid POA drafting.** When you purchase an Appeal Pass, the notice text you submit is sent to our backend so we can call Google's Gemini **paid tier** to draft your POA. We never use a free/training tier for customer data. Draft output is returned to you; the submitted text is retained only as long as needed to serve and support your case, then deleted on request.
- **License / activation checks.** To enforce the per-key device limit, we store a hashed device identifier count against your license in Supabase. No browsing content is stored there.
- **Payments.** Paddle is the Merchant of Record (they are the seller of record and handle VAT/tax). Payment data is governed by Paddle's privacy policy, not ours.

## 3. Analytics
We use a cookieless, privacy-respecting analytics tool (Plausible or Umami). It collects no personal data and sets no cross-site identifiers.

## 4. International transfers
Some processing (Google Gemini, Paddle) occurs outside Pakistan (including the US/EU). Transfers rely on the processors' own safeguards (Google DPA, Paddle MoR compliance). We do not sell your data.

## 5. Your rights
Depending on your location (e.g. GDPR/UK GDPR, Pakistan's forthcoming data-protection rules), you may have rights to access, rectification, erasure, portability, and objection. To exercise them, email hello@appealdeck.app. We respond within 30 days.

## 6. Breach notification
If a personal-data breach occurs, we notify affected users and (where required) the relevant authority within 72 hours of becoming aware.

## 7. Retention
Case data stays in your browser until you delete it. Server-side submitted text is deleted on request or after the support window closes. License records are kept for entitlement enforcement and accounting.

## 8. Children
AppealDeck is not directed to anyone under 18 and is a business tool for sellers.

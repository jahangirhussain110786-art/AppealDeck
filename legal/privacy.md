<!-- DRAFT — AI-authored, founder must review + publish. Do not go live until Paddle-applied site is up. -->
<!-- NOTE added 11 Sep 2026: this file is NOT what's rendered on /privacy. The live source is
     src/content/legal.ts, which was brought to substantive parity with this draft (international
     transfers, data-subject rights, breach notification, retention, Gemini disclosure) in the
     11 Sep 2026 full-repo audit — see docs/DECISIONS.md. Treat this file as the original authoring
     record, not the source of truth; edit src/content/legal.ts for anything that must actually change. -->

# Privacy Policy — AppealDeck

**Last updated:** 31 Aug 2026 (draft)
**Controller:** Jhangir Hussain, trading as "AppealDeck by Hawlton" (individual seller, Pakistan). Contact: hello@appealdeck.app (once the domain is live).

## 1. Our model: local-first by default
AppealDeck is built local-first. Your pasted Amazon notices, decoded facts, and drafted Plans of Action are stored **in your own browser** (encrypted via the Web Crypto API in IndexedDB) and are **not uploaded to us by default**. We cannot read your case vault.

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

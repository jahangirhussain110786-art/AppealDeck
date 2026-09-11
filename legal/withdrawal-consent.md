<!-- DRAFT — AI-authored, founder must review. This is the checkout implementation spec for D8 EU-withdrawal consent. -->
<!-- NOTE added 11 Sep 2026: the founder approved the SHIPPED checkbox wording as final (it differs
     from the wording proposed below — see src/content/legal.ts's `consent.withdrawalCheckbox.label`
     and docs/DECISIONS.md). Item 4 below (a confirmation email) is now implemented — src/lib/email.ts,
     wired into the Paddle webhook. Item 1's card-before-button ordering was found violated on
     /pricing and fixed the same session (src/app/pricing/page.tsx). -->

# Checkout consent mechanics (implementation spec)

**Status:** draft for founder sign-off. Drives the M-W checkout (B-20, AM-05).

## Required flow
1. **Honest-expectations card** shown BEFORE the pay button: states AppealDeck is software, not legal advice, no guarantee of reinstatement, $199 one-time per case, 7-day voluntary refund.
2. **Explicit prior consent checkbox** — rendered **unticked** by default (never pre-ticked):
   > "I expressly consent to receive the digital Appeal Pass immediately, and I acknowledge that my right to cancel under the consumer withdrawal regulations ends once delivery begins."
3. Purchase is **disabled until the box is checked**.
4. On success, Paddle (or Polar) sends a **permanent-form confirmation email** repeating: what was bought, price, the consent given, and the 7-day voluntary-refund route.

## Notes
- "Guarantee" must not appear anywhere in the checkout (grep gate = 0).
- Severity-gated violation types must never reach this checkout — they route to the professional-help screen instead.
- The consent text is logged as a `docs/DECISIONS.md` entry once the founder approves the exact wording.

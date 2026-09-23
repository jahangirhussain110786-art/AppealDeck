<!-- DRAFT — AI-authored, founder must review. This is the checkout implementation spec for D8 EU-withdrawal consent. -->
<!-- NOTE added 11 Sep 2026: the founder approved the SHIPPED checkbox wording as final (it differs
     from the wording proposed below — see src/content/legal.ts's `consent.withdrawalCheckbox.label`
     and docs/DECISIONS.md). Item 4 below (a confirmation email) is now implemented — src/lib/email.ts,
     wired into the Paddle webhook. Item 1's card-before-button ordering was found violated on
     /pricing and fixed the same session (src/app/pricing/page.tsx). -->
<!-- NOTE added 23 Sep 2026: item 1's price said $199 until today. The 21 Sep commercial reset moved
     the Appeal Pass to $249 flat worldwide and only src/content/ was updated, so this authoring
     record contradicted the card a buyer is actually shown — the same defect shape as the missing
     "not legal advice" sentence found on 22 Sep. Corrected in place. The rest of this document's
     wording was already superseded by the 11 Sep note above; the SHIPPED copy in src/content/ is
     authoritative, not this file. -->

# Checkout consent mechanics (implementation spec)

**Status:** draft for founder sign-off. Drives the M-W checkout (B-20, AM-05).

## Required flow
1. **Honest-expectations card** shown BEFORE the pay button: states AppealDeck is software, not legal advice, no guarantee of reinstatement, $249 one-time per case, 7-day voluntary refund.
2. **Explicit prior consent checkbox** — rendered **unticked** by default (never pre-ticked):
   > "I expressly consent to receive the digital Appeal Pass immediately, and I acknowledge that my right to cancel under the consumer withdrawal regulations ends once delivery begins."
3. Purchase is **disabled until the box is checked**.
4. On success, Paddle (or Polar) sends a **permanent-form confirmation email** repeating: what was bought, price, the consent given, and the 7-day voluntary-refund route.

## Notes
- "Guarantee" must not appear anywhere in the checkout (grep gate = 0).
- Severity-gated violation types must never reach this checkout — they route to the professional-help screen instead.
- The consent text is logged as a `docs/DECISIONS.md` entry once the founder approves the exact wording.

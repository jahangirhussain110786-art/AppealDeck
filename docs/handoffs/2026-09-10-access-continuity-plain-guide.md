# The access and continuity pass, in plain words (for the founder)

Written 10 Sep 2026. The full design is `Planning/03-PHASE-2-BUILD/07-ACCESS-AND-CONTINUITY-SPEC.md`; the coding prompt is `docs/handoffs/2026-09-10-access-continuity-prompt.md`. This page says the same thing without the file names.

## What changes for a seller

**Before sign-in.** They see the whole product in the header: Decode, Case, Dashboard, Vault (with a small lock), Pricing, and a Sign in link. They can decode a notice, read the deadlines and the do-now list, and see a preview of what their case will need: the evidence Amazon asks for with this type of notice and the actions ahead. They can start the interview straight away. Every answer is saved on their device as they go.

**The first gate: sign in.** When the interview reaches the first document (an invoice, an authorisation letter), it stops and says: save your case to continue. They sign in with email and password, Google, or a magic link. Whichever way they choose, they come back to the exact step, their answers intact. Then they set the vault passphrase once, and the case they already started is locked under it. From here they add documents, see how complete the case file is, and get AI field suggestions.

**The second gate: the Appeal Pass.** When they reach the drafted Plan of Action, the composer shows what the Pass adds to *their* saved case and the price, with the checkout in the same window. After paying, the page says "Activating your Appeal Pass. Your case is saved." and turns into the draft as soon as the payment confirmation arrives. If the confirmation is slow, a Check again button and a link to Billing, never a dead end.

## Why nothing gets lost

The vault already keeps one master key that encrypts everything. Today that key is protected by the passphrase. Before sign-in it will be protected by a key the browser creates for our site and never hands to any script. A refresh, a closed tab or the Google redirect changes nothing, because the answers were encrypted on disk before the redirect started. At sign-in the same master key is re-locked under the passphrase and the browser key is deleted. No plaintext storage, no copy on our servers.

One boundary stays, and the privacy page will say it in one paragraph: clearing browser data before sign-in deletes the draft. After sign-in and a Pass, cloud sync keeps an encrypted copy that the passphrase can recover.

## What stays exactly as it is

The decoder runs in the browser. We never submit to Amazon and never log in to Seller Central. Gated notice types are never sold. The Pass is still one payment for one case with a 7-day refund. Amazon decides every appeal, and the product still says so where it matters.

## Decisions you made on 10 Sep

- The three-step ladder (no account, free account, Appeal Pass) and where the two gates fall.
- The five-slot header in both states, with a lock on Vault when signed out.
- The interview starts without an account and saves to the vault from the first answer.
- Email + password, Google and magic link all stay.
- AI field suggestions are free once signed in, with a daily cap per person.
- This pass runs first; the visual refresh follows and builds on it.

## What you can still decide

- The wording of the privacy paragraph (spec §8, last block). If you do not edit it, it is used as written.
- The label "Billing" for signed-in users (one word to change if you prefer "Appeal Pass").
- Whether to push `master` so CI runs (it has not run on any commit since 9 Sep).

## What to check when the pass reports "done"

1. Open the site signed out. Decode the sample notice. Under the result, the preview of evidence and next actions should be there with "Start your case, free".
2. Start the case, answer the first question, refresh the page. The answer should still be there.
3. Continue until it asks for a document. It should ask you to sign in, not send you away. Sign in with Google. You should land back on the same step, then be asked for a passphrase once, then continue.
4. Reach the composer. It should show the Pass card with the consent box and the checkout. In sandbox, pay. The page should turn into the draft without you navigating anywhere.
5. Look at the header signed out and signed in: five items both times, the lock only on Vault when signed out.

The coding AI's evidence log (`docs/handoffs/2026-09-10-access-continuity.md`) has a row for each of these, with the command that proved it.

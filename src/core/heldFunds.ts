/**
 * Does the notice say Amazon is holding the seller's money? (G-03, 12 Oct 2026)
 *
 * The seller in this position asks two questions first: "what do I have to do?" and "what happens
 * to my money?". The decoder answered the first and said nothing about the second, although the
 * parser already noticed a narrow form of it (`mentionsFunds`) and nothing read it. That flag is
 * narrow on purpose, because other code keys off it; this reads the wider wording notices actually
 * use ("funds will not be transferred", "your payments are on hold", "we are holding your balance").
 *
 * It only ever decides whether to show a sentence quoting the notice's own claim and pointing at
 * Amazon's policy. It makes no promise about the money: that is what Amazon's reserve and review
 * rules decide, and they differ by case.
 *
 * Judged sentence by sentence, and a conditional sentence is ignored: "we may withhold payments"
 * and "if you do not respond, funds will be held" state a possibility, and telling a seller their
 * money is held when the notice only warns that it might be would be the false statement here.
 */

const MONEY = String.raw`(?:funds?|disbursements?|payments?|account balance|balance|payouts?)`;
// A verb that means "kept back" or "not paid out".
const HELD = String.raw`(?:on hold|held|holding|hold|withh[eo]ld(?:ing)?|frozen|freez\w*|under review|not be (?:transferred|disbursed|released|paid)|(?:cannot|can[’']t) be (?:transferred|disbursed|released|paid))`;

const MONEY_THEN_HELD = new RegExp(String.raw`\b${MONEY}\b[^.!?\n]{0,70}\b${HELD}\b`, "i");
const HELD_THEN_MONEY = new RegExp(
  String.raw`\b(?:hold(?:ing)?|withh[eo]ld(?:ing)?|freez\w*)\b[^.!?\n]{0,40}\b${MONEY}\b`,
  "i",
);
/** A sentence that states a possibility or a condition, not a fact about this account. */
// "can no longer list products ... and any funds will be held" is a statement of fact, not "can"
// as a possibility, so a "can" that opens "can no longer" does not make the sentence conditional
// (19 Oct 2026: a deactivation notice that said funds are held for 90 days showed no money line).
const CONDITIONAL =
  /\b(?:may|might|could|can(?!['’]t|\s+no\s+longer)|reserve the right|if|unless)\b/i;

/** True when a sentence of the notice says money is held, frozen or will not be paid out. */
export function mentionsHeldFunds(raw: string): boolean {
  return raw
    .split(/(?<=[.!?])\s+|\n+/)
    .some(
      (sentence) =>
        !CONDITIONAL.test(sentence) &&
        (MONEY_THEN_HELD.test(sentence) || HELD_THEN_MONEY.test(sentence)),
    );
}

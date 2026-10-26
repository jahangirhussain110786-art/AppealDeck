// The legal-scope sentences, in one place (24 Oct 2026).
//
// These sentences say what AppealDeck is not. That is a legal boundary, not a marketing position, so
// they belong here rather than in the headline, the hero or the pricing card. Surfaces that need one
// import it; `scripts/lint-copy.mjs` fails if the wording is typed anywhere else, which keeps the
// product from leading with an apology again.

export const SCOPE = {
  /**
   * The full scope statement, for surfaces that explain the product to professionals. It keeps the
   * precise legal meaning of the Terms while naming the work the software actually does.
   */
  professional:
    "AppealDeck is case-preparation software for the work before an appeal: reading the notice, assembling the record, checking documents and preparing a draft. It gives no legal advice and offers no legal representation, and nothing a client sends it is legally privileged.",

  /** The outcome boundary, used inside answers that would otherwise read as a promise. */
  outcome: "Amazon decides the result, and no one here predicts it.",

  /**
   * The guide disclaimer, quoted on every guide page. Kept word for word because it is the legal
   * notice for published policy explanations, and `guides.test.ts` pins it to its meaning.
   */
  guide:
    "This guide is general information, not legal advice, and AppealDeck is not affiliated with Amazon. Amazon decides every appeal, and nothing here predicts how yours will go. Amazon changes its policies; check the date above. These steps describe the US store. Use your own marketplace's Seller Central and addresses.",
} as const;

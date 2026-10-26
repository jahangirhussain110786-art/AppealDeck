// Positioning (24 Oct 2026).
//
// The honesty rule does not change: no outcome is promised, no result is predicted, and the cases the
// workspace will not draft still go to a professional. What changes is where the honesty sits. A
// limitation stated as an identity ("we are not a law firm") reads as doubt; the same limitation
// stated as a division of labour reads as confidence. This file is the one source for that framing
// and for the promises that can actually be checked, so every surface says the same thing.

export const POSITIONING = {
  /** The category, in the words a buyer can repeat to someone else. */
  category: "Self-help case-preparation software for Amazon sellers.",

  /**
   * The division of labour, in one sentence. You -> us -> Amazon. Each part is true of the product:
   * the facts come from the seller, the record and draft are the software's work, and the decision is
   * Amazon's alone. Rendered as a heading on the home page and on /pricing.
   */
  triad: {
    lead: "You know your business.",
    we: "We build the record.",
    amazon: "Amazon decides.",
    sentence: "You know your business. We build the record. Amazon decides.",
  },

  /**
   * The reason to try the product, stated as work rather than as a result. Amazon's notice asks
   * specific questions; the job is to answer those and not a different set. No claim is made about
   * how often any response succeeds.
   */
  mechanism: "Amazon asks specific questions. The response answers exactly those.",

  /**
   * Promises the product can keep today. Each one is a mechanism, not a slogan, and each links to
   * the page or section where it can be checked. A new promise is added only when the code behind it
   * exists; `positioning.test.ts` holds the count and the links.
   */
  promises: {
    eyebrow: "What you can hold us to",
    note: "These promises describe how the product works; open a link to check one.",
    items: [
      {
        title: "One price, stated first",
        body: "No subscription and no per-revision charge. The Appeal Pass covers every round of its case.",
        short: "No subscription. No per-revision charge.",
        href: "/pricing#purchase",
        label: "The price",
      },
      {
        title: "14 days to change your mind",
        body: "A refund within 14 days, with no reason needed.",
        short: "Full refund within 14 days, no reason needed.",
        href: "/refund",
        label: "Refund terms",
      },
      {
        title: "Your account stays yours",
        body: "You stay signed in to Seller Central. We never access your account, and you review and submit every reply.",
        short: "Your seller account stays yours.",
        href: "/terms#independence",
        label: "Independence",
      },
      {
        title: "Encrypted on your device",
        body: "Files are encrypted in your browser. One leaves only for a check you ask for, or a backup you choose.",
        short: "Encrypted in your browser; shared only when you choose.",
        href: "/privacy",
        label: "Data handling",
      },
      {
        title: "Built from your facts, checked before you send",
        body: "The response is built from your answers and the records you supply. Automated checks flag unsupported details, and you review the response before submission.",
        short: "Automated checks flag unsupported details; you review before you send.",
        href: "/how-we-test",
        label: "How we test",
      },
    ],
  },
} as const;

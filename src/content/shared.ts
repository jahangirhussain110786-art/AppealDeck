// Copy source for shared strings (footer, common labels, metadata).

export const SHARED = {
  footer: {
    tagline:
      "AppealDeck by Hawlton. We decode notices and draft appeals; we do not submit to Amazon and do not promise reinstatement.",
    nav: {
      privacy: "Privacy",
      terms: "Terms",
      refund: "Refund",
      faq: "FAQ",
    },
  },
  metadata: {
    titleDefault: "AppealDeck — Amazon suspension notice decoder",
    description:
      "Decode your Amazon deactivation or policy notice in plain English. $199 one-time Appeal Pass for a drafted Plan of Action. No automation, no outcome promises.",
    titleDecode: "Decode your Amazon notice — AppealDeck",
    descriptionDecode:
      "Paste your Amazon notice. Decoded in your browser — nothing sent to our servers.",
    titlePricing: "Pricing — AppealDeck",
    descriptionPricing:
      "Free decoder, $199 one-time Appeal Pass for a drafted POA. Submit yourself in Seller Central.",
    titleFaq: "FAQ — AppealDeck",
    descriptionFaq: "Questions about decoding, the Appeal Pass, data, and refunds.",
  },
  submitButton: "Submit",
  retryButton: "Retry",
} as const;

// Copy source for shared strings (footer, common labels, metadata).

export const SHARED = {
  brand: { name: "AppealDeck" },
  nav: {
    primary: "Primary",
    decode: "Decode",
    case: "Case",
    dashboard: "Dashboard",
    vault: "Vault",
    pricing: "Pricing",
    billing: "Billing",
    faq: "FAQ",
    signIn: "Sign in",
    signOut: "Sign out",
    menu: "Menu",
    openMenu: "Open menu",
    themeToggle: "Toggle colour theme",
    lockedHint: "Sign in to unlock",
  },
  footer: {
    tagline:
      "AppealDeck by Hawlton. Plain-English notice decoding, deadlines, and a drafted Plan of Action you submit yourself in Seller Central.",
    nav: {
      privacy: "Privacy",
      terms: "Terms",
      refund: "Refund",
      faq: "FAQ",
    },
    neverSubmits:
      "You submit your appeal yourself in Seller Central. AppealDeck never logs in to your account.",
    independence:
      "AppealDeck is an independent service and is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates. Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates.",
    groups: {
      product: "Product",
      legal: "Legal",
    },
    copyright: "© {year} Hawlton",
  },
  expectations: {
    weDo: "What AppealDeck does",
    weDoNot: "What stays in your hands",
  },
  metadata: {
    titleDefault: "AppealDeck — Amazon notice decoder and Plan of Action drafts",
    description:
      "Understand your Amazon deactivation or policy notice in plain English, see your deadlines, and draft a Plan of Action you review and submit yourself. Free decoder. $199 one-time Appeal Pass.",
    titleDecode: "Decode your Amazon notice, free and in your browser — AppealDeck",
    descriptionDecode:
      "Paste your Amazon notice and read it in plain English: case type, deadlines, and a do-now list. It runs in your browser.",
    titlePricing: "Appeal Pass — $199 one-time — AppealDeck",
    descriptionPricing:
      "One payment per case: guided interview, evidence checklist, drafted Plan of Action, critic review and an encrypted vault. 7-day refund.",
    titleFaq: "FAQ — AppealDeck",
    descriptionFaq:
      "How the decoder works, what the Appeal Pass includes, how your documents are protected, and how refunds work.",
  },
  submitButton: "Submit",
  retryButton: "Retry",
  cta: "See the Appeal Pass",
  navSkip: "Skip to main content",
  tocHeading: "Contents",
  lastUpdated: "Last updated:",
  consentPrompt: "Select the consent to continue",
  offline: {
    title: "You are offline",
    desc: "Decoding and your vault work without a connection. Drafting, critique and sync need one and will fail until you are back online.",
  },
} as const;

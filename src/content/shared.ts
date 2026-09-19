// Copy source for shared strings (footer, common labels, metadata).

export const SHARED = {
  brand: { name: "AppealDeck" },
  nav: {
    primary: "Primary",
    decode: "Decode",
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
    profileMenu: "Account menu",
  },
  footer: {
    tagline: "Understand the notice. Organize the evidence. Prepare your response.",
    nav: {
      privacy: "Privacy",
      terms: "Terms",
      refund: "Refund",
      faq: "FAQ",
      support: "Support",
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
    title: "Clear support. You stay in control.",
    eyebrow: "How we help",
    weDo: "Inside your workspace",
    weDoNot: "In your hands",
  },
  metadata: {
    titleDefault: "AppealDeck — Your Amazon case workspace",
    description:
      "Decode your Amazon notice, organize original evidence, and prepare a factual response. Track submissions and replies in one case workspace. Start free.",
    titleDecode: "Decode your Amazon notice, free — AppealDeck",
    descriptionDecode:
      "Understand the detected issue, stated time windows and next steps. Your notice is analyzed by AppealDeck; nothing is sent to Amazon.",
    titlePricing: "Appeal Pass — $199 one-time — AppealDeck",
    descriptionPricing:
      "Start with a free case workspace. An Appeal Pass adds response preparation and encrypted backup for one eligible case. $199 once. Read the 7-day refund policy.",
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
  consentPrompt: "Review delivery consent to continue",
  offline: {
    title: "You are offline",
    desc: "Your unlocked local vault is available. Decoding, response preparation and cloud backup need an internet connection.",
  },
} as const;

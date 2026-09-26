// Copy source for shared strings (footer, common labels, metadata).

export const SHARED = {
  brand: { name: "AppealDeck" },
  nav: {
    primary: "Primary",
    appNav: "App",
    decode: "Decode",
    dashboard: "Dashboard",
    vault: "Vault",
    pricing: "Pricing",
    billing: "Billing",
    faq: "FAQ",
    guides: "Guides",
    signIn: "Sign in",
    decodeCta: "Decode a notice",
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
      dataFlow: "Where your data goes",
    },
    neverSubmits:
      "You submit your appeal yourself in Seller Central. AppealDeck never logs in to your account.",
    independence:
      "AppealDeck is an independent service and is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates. Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates.",
    groups: {
      product: "Product",
      guides: "Guides",
      legal: "Legal",
    },
    notLegalAdvice: "Software, not legal advice.",
    copyright: "© {year} Hawlton",
  },
  expectations: {
    title: "Clear support. You stay in control.",
    eyebrow: "How we help",
    weDo: "Inside your workspace",
    weDoNot: "In your hands",
  },
  metadata: {
    // Titles lead with the words sellers search (docs/handoffs/2026-09-25-keyword-research.md).
    // The root layout appends " · AppealDeck" to every page but the home page, so no title here
    // repeats the brand.
    titleDefault: "Amazon account suspended? Free notice decoder · AppealDeck",
    description:
      "Paste your Amazon suspension or deactivation notice. See what Amazon is asking for, the deadline it states and the records to gather. Free, no sign-up.",
    titlePricing: "Pricing: the Appeal Pass, $249 once per case",
    descriptionPricing:
      "Decoding and building your case are free. The Appeal Pass adds response preparation and draft checks for one case, every revision included. $249 once.",
    titleSupport: "Support and contact",
    descriptionSupport:
      "Who operates AppealDeck, how to reach them, how long a reply takes, and what support can and cannot do during an appeal.",
    titleFaq: "FAQ: privacy, pricing and appeals",
    descriptionFaq:
      "How the decoder works, what leaves your browser, who submits the response, what the Appeal Pass covers and how refunds work.",
  },
  retryButton: "Retry",
  navSkip: "Skip to main content",
  tocHeading: "Contents",
  lastUpdated: "Last updated:",
  consentPrompt: "Review delivery consent to continue",
  offline: {
    title: "You are offline",
    desc: "Your unlocked local vault is available. Decoding, response preparation and cloud backup need an internet connection.",
  },
} as const;

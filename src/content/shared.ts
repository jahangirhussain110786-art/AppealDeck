// Copy source for shared strings (footer, common labels, metadata).

import { POSITIONING } from "./positioning";

/**
 * G-69 (12 Oct 2026): what Amazon itself has said about review time, said once and reused on the
 * decode result, the waiting card and the FAQ. It quotes Amazon with its source and the day we read
 * it, and predicts nothing. Re-read it when the policy brief is re-checked each quarter; if Amazon's
 * statement changes, this line changes with it, in this one place.
 */
export const AMAZON_REVIEW_TIME =
  "Amazon has said appeals usually take 3 to 7 business days and can take longer, and it does not promise a time frame (an Amazon representative on Seller Forums, read 10 Oct 2026). Sellers report anything from days to months. Not a promise.";

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
    cases: "Cases",
    caseWaiting: "Waiting",
    caseToday: "Today",
    statusSignedIn: "Signed in",
    statusGuest: "Guest session",
    statusGuestBody: "Your case is kept in this browser tab.",
  },
  footer: {
    tagline: "Know what the notice asks. Build the record. Prepare the response.",
    nav: {
      privacy: "Privacy",
      terms: "Terms",
      refund: "Refund",
      faq: "FAQ",
      support: "Support",
      dataFlow: "Where your data goes",
      checkInvoice: "Free invoice check",
      howWeTest: "How we test",
      changelog: "What changed",
      forProfessionals: "For writers and VA teams",
      partners: "Partner program",
      licences: "Licences",
    },
    neverSubmits: "You submit every appeal yourself in Seller Central. Your login stays with you.",
    // The trademark attribution lives in the Terms, not here: repeating it beside the independence
    // line said the same thing twice and made the footer heavier than it needed to be.
    independence:
      "AppealDeck is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates.",
    groups: {
      product: "Product",
      guides: "Guides",
      legal: "Legal",
    },
    category: POSITIONING.category,
    copyright: "© {year} Jhangir Hussain, trading as Hawlton",
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
      "Who operates AppealDeck, how to reach them, how quickly they reply, and where your own judgment leads an appeal.",
    titleFaq: "FAQ: privacy, pricing and appeals",
    descriptionFaq:
      "How the decoder works, what leaves your browser, who submits the response, what the Appeal Pass covers and how refunds work.",
  },
  retryButton: "Retry",
  navSkip: "Skip to main content",
  tocHeading: "Contents",
  lastUpdated: "Last updated:",
  // G-92: plain words for the button that takes the buyer to the consent box. The consent wording
  // itself (D8) is unchanged.
  consentPrompt: "Tick the box above to continue",
  // The pay button a signed-out visitor sees: a sign-in link, not a checkout that refuses after a
  // request (24 Oct 2026).
  signInToBuy: "Sign in to buy",
  offline: {
    title: "You are offline",
    desc: "Your unlocked local vault is available. Decoding, response preparation and cloud backup need an internet connection.",
  },
} as const;

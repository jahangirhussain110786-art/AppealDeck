export const SURFACES = {
  /** The data-flow picture at the top of /privacy (v5, 26 Sep 2026). Summarises the policy
   *  below it; every line matches a section of legal.ts. */
  dataFlow: {
    title: "Where your case goes, in one picture",
    device: { title: "Your device", body: "Your case and files, encrypted. The only copy." },
    toServer: "The notice text. A file, only when you ask for a check.",
    server: {
      title: "AppealDeck's server",
      body: "Reads it to answer and keeps no copy. A document check or wording help also passes through Google Gemini.",
    },
    never: "Never connected",
    amazon: { title: "Your Amazon account", body: "You paste your response in yourself." },
  },
  legal: {
    eyebrow: "Policies & support",
    navigation: "Policy navigation",
    sectionLabel: "In this policy",
    related: "Related policies",
    privacy: "See how your case text, files and account information are handled.",
    terms: "Understand the service, your responsibilities and the limits of our support.",
    refund: "Find the refund process, time window and contact details in one place.",
  },
  loading: "Loading your workspace…",
  notFound: {
    eyebrow: "Page unavailable · 404",
    title: "Let's get you back on track.",
    description: "This page may have moved. Open your dashboard to continue, or return home.",
    primary: "Open dashboard",
    secondary: "Back to home",
  },
  error: {
    eyebrow: "Page unavailable",
    title: "This page couldn't load.",
    description:
      "Try loading it again. If the problem continues, return home and reopen your workspace.",
    primary: "Try again",
    secondary: "Back to home",
  },
} as const;

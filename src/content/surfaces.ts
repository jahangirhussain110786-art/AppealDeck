export const SURFACES = {
  /** The data-flow picture at the top of /privacy (v5, 26 Sep 2026). Summarises the policy
   *  below it; every line matches a section of legal.ts. */
  dataFlow: {
    title: "Where your case goes, in one picture",
    // "The only copy" was untrue for a seller who chose a cloud backup (privacy policy: an encrypted
    // copy is stored separately). Corrected 26 Sep 2026.
    device: {
      title: "Your device",
      body: "Your case and files, encrypted. The only copy, unless you choose an encrypted backup.",
    },
    toServer: "The notice text. A file, only when you ask for a check.",
    server: {
      title: "AppealDeck's server",
      body: "Reads it to answer and keeps no copy. A document check or wording help also passes through Google Gemini.",
    },
    never: "Never connected",
    amazon: { title: "Your Amazon account", body: "You paste your response in yourself." },
  },
  // v5 (26 Sep 2026, prototype privacy.html): the short answer above the full policy. Every line
  // restates something the policy below says; the policy is what binds.
  privacyTop: {
    title: "Where your data goes.",
    accent: "goes.",
    lede: "And the one place it never goes.",
    illustration: "A locked folder in a vault",
    questions: [
      {
        q: "Which AI reads the text?",
        a: "Google Gemini, on its paid tier. Google states it does not use those requests to improve its products, and keeps logs for up to 55 days only to detect abuse.",
      },
      {
        q: "What if I clear my browser?",
        a: "Your case and files are removed from this browser. If you made an encrypted backup you can restore from it; otherwise there is nothing on our server to bring back. A case's History tab downloads its notes.",
      },
      {
        q: "Can I add a passphrase?",
        a: "Yes, from the Vault. If you forget it, nobody can recover the files, including us.",
      },
    ],
    policyTitle: "The full privacy policy",
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

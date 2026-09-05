// Copy source for marketing surfaces. Voice: §10.1–10.3 of 06-PREMIUM-UI-UX.
// Headline = outcome the seller controls. Sub-line = boundary. Button = verb + object.
// No banned-pattern / banned-number strings. Banned-list enforced by scripts/lint-copy.mjs.

export const HOME = {
  hero: {
    headline: "Understand your Amazon notice today. Draft a Plan of Action Amazon can act on.",
    subline:
      "You submit it yourself in Seller Central. AppealDeck never touches your Amazon account.",
    primaryCta: "Decode my notice — free",
    secondaryCta: "See what the Appeal Pass includes",
    artwork: {
      srOnly:
        "Illustration composed of the real decode result: a SeverityBadge and two DeadlineChips with illustrative dates.",
    },
  },
  howItWorks: {
    step1: {
      title: "1. Paste your notice",
      desc: "Drop the full Amazon deactivation or policy email into the decoder.",
    },
    step2: {
      title: "2. Get the plain-English result",
      desc: "Deadlines and a do-now / do-not list grounded in your case type.",
    },
    step3: {
      title: "3. Draft your POA",
      desc: "With the Appeal Pass, a Plan of Action you review and submit yourself.",
    },
  },
} as const;

export const DECODE = {
  pageTitle: "Decode your Amazon notice",
  pageDescription:
    "Paste your Amazon deactivation or policy notice. We decode it in your browser — nothing is sent to our servers.",
  textarea: {
    label: "Your notice",
    placeholder: "Paste the full Amazon notice here…",
    hint: "Paste the entire email, including the subject line and any stated dates.",
  },
  charCounter: "{count, number} characters",
  sampleButton: "Try a sample notice",
  clearButton: "Clear",
  sampleBadge: "Sample notice — not yours",
  submitButton: "Decode",
  loading: {
    title: "Decoding…",
    hint: "This takes a moment.",
  },
  emptyState: {
    title: "No notice pasted yet",
    description: "Paste your Amazon notice above and click Decode.",
  },
} as const;

export const PRICING = {
  pageTitle: "Pricing — AppealDeck",
  headline: "Appeal Pass — $199 one-time",
  subline:
    "A single fee covers everything you need to turn a suspension into a stronger, honest appeal. You submit it yourself.",
  free: "Free",
  pass: "Appeal Pass",
  tableHeadings: {
    feature: "What you get",
    free: "Free",
    pass: "Appeal Pass",
  },
  rows: {
    decode: { feature: "Decode your notice in plain English", free: "Yes", pass: "Yes" },
    plainEnglish: {
      feature: "Deadlines + do-not list",
      free: "Yes",
      pass: "Yes",
    },
    poa: { feature: "Drafted Plan of Action", free: "—", pass: "Yes" },
    critic: { feature: "Critic flags on your draft", free: "—", pass: "Yes" },
    interview: {
      feature: "Guided interview checklist",
      free: "—",
      pass: "with the Appeal Pass at launch",
    },
    vault: { feature: "Encrypted local vault (10 MB cap per record)", free: "—", pass: "Yes" },
    devices: { feature: "5-device activations", free: "—", pass: "Yes" },
    refund: { feature: "7-day refund", free: "—", pass: "Yes" },
  },
  trust: {
    title: "Trust, shown by mechanism",
    submit: {
      label: "You submit yourself",
      desc: "We draft. You save, edit, and submit in Seller Central.",
    },
    localFirst: {
      label: "Decoded in your browser",
      desc: "No notice text leaves your machine during decode.",
    },
    vault: {
      label: "Vault encrypted in your browser",
      desc: "AES-GCM 256. The key never leaves your device.",
    },
    refund: {
      label: "7-day, no-questions refund",
      desc: "Email the receipt email within 7 days of purchase.",
    },
  },
  samplePoa: {
    trigger: "View a sample Plan of Action",
    watermark: "ILLUSTRATIVE — not a real appeal",
    copyDisabled: "Sample only",
    title: "Sample Plan of Action",
  },
  cta: "Get the Appeal Pass",
} as const;

export const SHARED = {
  signinLink: "Sign in",
  signupLink: "Create an account",
} as const;

export const FOUNDER_NOTE: { name: string; location: string; text: string } | null = null;

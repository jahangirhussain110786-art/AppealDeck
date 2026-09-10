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
  howItWorksTitle: "How it works",
  howItWorksSub: "Three steps, then you decide.",
  expectationsTitle: "What we do and do not do",
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
  noticeLikenessTitle: "Before you decode",
  likenessHint:
    "This doesn't look like an Amazon notice yet. Paste the full email, including the subject line.",
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
    account: "Free account",
    pass: "Appeal Pass",
  },
  rows: {
    decode: {
      feature: "Decode your notice in plain English",
      free: "Yes",
      account: "Yes",
      pass: "Yes",
    },
    plainEnglish: {
      feature: "Deadlines + do-not list",
      free: "Yes",
      account: "Yes",
      pass: "Yes",
    },
    preview: {
      feature: "Case preview: evidence list and action checklist",
      free: "Yes",
      account: "Yes",
      pass: "Yes",
    },
    interview: {
      feature: "Guided interview checklist",
      free: "First steps",
      account: "Yes",
      pass: "Yes",
    },
    vault: {
      feature: "Encrypted local vault (10 MB cap per record)",
      free: "—",
      account: "Yes",
      pass: "Yes",
    },
    readiness: {
      feature: "Case dashboard and readiness",
      free: "Draft only",
      account: "Yes",
      pass: "Yes",
    },
    aiSuggest: {
      feature: "AI field suggestions",
      free: "—",
      account: "Yes, daily cap",
      pass: "Yes",
    },
    poa: { feature: "Drafted Plan of Action", free: "—", account: "—", pass: "Yes" },
    critic: { feature: "Critic flags on your draft", free: "—", account: "—", pass: "Yes" },
    replyAnalysis: {
      feature: "Amazon-reply analysis",
      free: "—",
      account: "—",
      pass: "Yes",
    },
    devices: { feature: "5-device activations", free: "—", account: "—", pass: "Yes" },
    refund: { feature: "7-day refund", free: "—", account: "—", pass: "Yes" },
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
  faqTitle: "Frequently asked questions",
  purchaseTitle: "Ready to draft your POA?",
} as const;

export const FOUNDER_NOTE: { name: string; location: string; text: string } | null = null;

export const FAQ = {
  title: "Frequently asked questions",
  description: "Questions about decoding, the Appeal Pass, data, and refunds.",
  items: [
    {
      q: "Is AppealDeck part of Amazon?",
      a: "No. AppealDeck is an independent service run by Jhangir Hussain, trading as Hawlton, in Pakistan. It is not affiliated with, endorsed by, or sponsored by Amazon. We use the Amazon name only to describe the notices our software reads and the appeals it drafts. We never log in to Seller Central and never submit anything to Amazon for you.",
    },
    {
      q: "Do I need an Amazon account to decode?",
      a: "No. Paste your notice text into the decoder and it runs in your browser. No account is needed for the free decoder. The Appeal Pass requires an account to activate a license key.",
    },
    {
      q: "How does the decoder work?",
      a: "The decoder parses your notice locally, identifies the violation type, shows deadlines tied to the stated dates, and produces a do-now and do-not list grounded in Amazon policy. Nothing you paste leaves your browser during the free decode.",
    },
    {
      q: "Is my POA draft accurate?",
      a: "The draft is based on the facts in your notice and the evidence you provide. It follows the structure Amazon expects: root cause, corrective actions, and preventive measures. You must review and edit it before submitting — it is a draft, not a final appeal.",
    },
    {
      q: "What are the deadlines?",
      a: "The appeal window is parsed from your notice (defaulting to the standard 90 days when not stated). Funds appeals open around 60 days after deactivation; the 90-day review checkpoint is never an automatic release. The decoder shows every date it finds, with a flag when a window is ambiguous.",
    },
    {
      q: "What is the encrypted vault for?",
      a: "Store and organise your evidence — invoices, photos, notes — in an encrypted local vault. Encryption uses AES-256-GCM with a passphrase you choose; the key never leaves your device. Ciphertext syncs to Supabase so you can access it across devices, but we cannot read it.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 7-day voluntary refund with no questions asked, as long as you have not redeemed your Appeal Pass license. After 7 days the purchase is final. See the Refund page for full details.",
    },
    {
      q: "Do you submit my appeal to Amazon?",
      a: "No. AppealDeck drafts the Plan of Action for you to review and submit yourself. We never log in to your Seller Central account and never submit on your behalf.",
    },
    {
      q: "What is free, and what needs an account?",
      a: "Decoding, deadlines, the do-now list and the first interview steps are free with no account, saved on this device. Sign in, still free, to add documents to your encrypted vault, see how complete your case file is and use AI field suggestions. The Appeal Pass drafts and reviews the Plan of Action and adds cloud sync.",
    },
  ] as const,
  cta: {
    title: "Still have questions?",
    desc: "Paste your notice to get an answer for your specific case.",
    link: "Decode my notice — free",
  },
  groups: [
    {
      name: "Pricing",
      items: [
        "Do I need an Amazon account to decode?",
        "What is your refund policy?",
        "What is free, and what needs an account?",
      ],
    },
    { name: "Decoding", items: ["How does the decoder work?", "Is my POA draft accurate?"] },
    { name: "Deadlines", items: ["What are the deadlines?"] },
    { name: "Vault", items: ["What is the encrypted vault for?"] },
    {
      name: "Submitting",
      items: ["Is AppealDeck part of Amazon?", "Do you submit my appeal to Amazon?"],
    },
  ] as const,
} as const;

export type FaqItem = (typeof FAQ.items)[number];

export function faqByGroup(): { name: string; items: FaqItem[] }[] {
  const byQ = new Map(FAQ.items.map((i) => [i.q, i]));
  return FAQ.groups.map((g) => ({
    name: g.name,
    items: g.items.map((q) => byQ.get(q)).filter((i): i is FaqItem => i !== undefined),
  }));
}

export const SAMPLE_POA = {
  watermark: "ILLUSTRATIVE — not a real appeal",
  copyDisabled: "Sample only",
  title: "Sample Plan of Action",
  body: `Appeal Plan of Action — Illustrative Example

Seller: [Redacted] · Notice date: 15 Aug 2026 · Violation: detail-page policy compliance

Root cause:
The listing for ASIN B0EXAMPLE was missing an accurate country-of-manufacture attribute and contained a product image with a copyrighted watermark from a third-party supplier. These were discovered during an automated scan and corrected on 18 Aug.

Corrective actions taken:
- Removed the third-party-watermarked image and uploaded a seller-owned photo showing the product label clearly.
- Added the country-of-manufacture attribute (CN) to the detail page.
- Submitted inventory updates via the bulk fix tool for all affected SKUs.

Preventive measures:
- New listing checklist added to the team workflow: every upload is checked for third-party images and required attributes before publishing.
- A weekly listing audit runs each Friday to catch missing attributes before Amazon flags them.

Note: this is a fictional sample. Every case differs. With the Appeal Pass, the draft is based on your actual notice and evidence and you submit it yourself in Seller Central.`,
} as const;

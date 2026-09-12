// Copy source for marketing surfaces. Voice: §10.1–10.3 of 06-PREMIUM-UI-UX.
// Headline = outcome the seller controls. Sub-line = boundary. Button = verb + object.
// No banned-pattern / banned-number strings. Banned-list enforced by scripts/lint-copy.mjs.

export const HOME = {
  hero: {
    eyebrow: "For Amazon sellers facing a deactivation or policy notice",
    headline: "Understand your Amazon notice today. Draft a Plan of Action Amazon can act on.",
    subline:
      "Free decoder, clear deadlines, and a Plan of Action drafted from your notice and evidence in the structure Amazon reads. You review it and submit it yourself in Seller Central (Amazon's seller dashboard).",
    primaryCta: "Decode my notice — free",
    secondaryCta: "See the Appeal Pass",
    reassuranceLine: "Runs in your browser. No Seller Central login needed.",
    artwork: {
      label: "Decoded notice",
      srOnly:
        "Illustration composed of the real decode result: a SeverityBadge and two DeadlineChips with illustrative dates.",
    },
  },
  howItWorks: {
    eyebrow: "How it works",
    step1: {
      title: "Paste your notice",
      desc: "Drop the full Amazon email into the decoder. It is read in your browser.",
    },
    step2: {
      title: "See what it means and how long you have",
      desc: "A plain-English summary, your case type, every deadline the notice implies, and a do-now list.",
    },
    step3: {
      title: "Draft your Plan of Action",
      desc: "With the Appeal Pass: a guided interview, an evidence checklist, a drafted plan and a critic review, ready for your edits.",
    },
  },
  howItWorksTitle: "From notice to plan in three steps",
  howItWorksSub: "Start free. Pay once only if you want the drafted plan.",
  included: {
    eyebrow: "What you get",
    title: "Everything a strong appeal needs",
    sub: "Built around the three things Amazon reads for: the cause, what you fixed, and how it stays fixed.",
  },
  proof: {
    eyebrow: "Trust",
    title: "Trust you can check, not take on faith",
  },
  closing: {
    title: "Start with the free decoder",
    desc: "Paste the notice. See what it means and how long you have. Then decide.",
  },
} as const;

export const DECODE = {
  pageTitle: "Decode your Amazon notice",
  pageDescription:
    "Paste the full email. In a moment you will see your case type, the deadlines it implies, and what to do first. Everything runs in your browser.",
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
  decodeAnotherButton: "Decode another notice",
  noticeLikenessTitle: "Before you decode",
  likenessHint:
    "This doesn't look like an Amazon notice yet. Paste the full email, including the subject line.",
  result: {
    doNow: "Do now",
    doNot: "Do not",
    ctaTitle: "Ready to turn this into a Plan of Action?",
    ctaDesc:
      "The Appeal Pass walks you through the questions Amazon expects answered, checks your evidence, drafts the plan and reviews it before you submit.",
    ctaNote: "One payment. 7-day refund.",
    copySummary: "Copy plain-English summary",
    errorTitle: "Could not decode",
    errorFallback: "Something went wrong.",
    errorNetwork: "Network error. Try again.",
    errorHint: "Paste the full Amazon notice and try again.",
    whatThisMeans: "What this means",
    startPoaCta: "Start your Plan of Action",
  },
  /**
   * Annotation-card body copy (AM-22/V5, per Decode.dc.html) — the heading quotes the
   * real phrase found in the seller's own pasted notice; this is the fixed explanation
   * that goes with it. See src/lib/decodeAnnotations.ts.
   */
  annotations: {
    unverifiableClaims:
      "Amazon doesn't say which claims. Name every specific product-condition claim on the flagged listings in your response, not a general statement.",
    statedWindow:
      "This notice states its own appeal window plainly. Other notices state different windows — always use the one written on the notice in front of you, and confirm it in your Account Health dashboard.",
    legacyWindow:
      "Appeal windows have changed over time. Confirm the window shown in your Account Health dashboard before relying on the number in this notice.",
    ambiguousWindow:
      "This notice doesn't state a fixed number of days. Check the appeal window shown in your Account Health dashboard rather than assuming one.",
    clearStructure:
      "Amazon states exactly what the Plan of Action needs: root cause, corrective actions, and preventive measures. Structure your draft around these three headings.",
  },
} as const;

export const PRICING = {
  pageTitle: "Pricing — AppealDeck",
  headline: "One Appeal Pass. One case. $199, once.",
  subline:
    "The guided interview, evidence checklist, drafted Plan of Action, critic review and encrypted vault — for the case in front of you. You review and submit in Seller Central.",
  price: "$199",
  priceNote: "One-time. One case.",
  included: "Included",
  jumpToPurchase: "Continue to purchase",
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
      feature: "Plain-English decode of your notice",
      free: "Yes",
      account: "Yes",
      pass: "Yes",
    },
    plainEnglish: {
      feature: "Deadlines and a do-now / do-not list",
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
      feature: "Guided interview that gathers what Amazon expects",
      free: "First steps",
      account: "Yes",
      pass: "Yes",
    },
    vault: {
      feature: "Encrypted case vault (10 MB per file)",
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
    poa: {
      feature: "Drafted Plan of Action: root cause, corrective actions, preventive measures",
      free: "—",
      account: "—",
      pass: "Yes",
    },
    critic: {
      feature: "Critic review that flags weak spots before you submit",
      free: "—",
      account: "—",
      pass: "Yes",
    },
    replyAnalysis: {
      feature: "Amazon-reply analysis",
      free: "—",
      account: "—",
      pass: "Yes",
    },
    devices: { feature: "Cloud sync, up to 5 devices", free: "—", account: "—", pass: "Yes" },
    refund: { feature: "7-day refund", free: "—", account: "—", pass: "Yes" },
  },
  trust: {
    title: "Built so you can check it yourself",
    submit: {
      label: "You submit, we never log in",
      desc: "The draft is yours to edit; you submit it in Seller Central.",
    },
    localFirst: {
      label: "Decoded in your browser",
      desc: "Open DevTools while decoding: no notice text leaves your machine.",
    },
    vault: {
      label: "Encrypted on your device",
      desc: "AES-GCM 256 with a passphrase only you know.",
    },
    refund: {
      label: "7-day refund",
      desc: "Email the receipt address within 7 days. No questions.",
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
  purchaseTitle: "Get your Appeal Pass",
  expectationsTitle: "What to expect",
} as const;

export const FOUNDER_NOTE: { name: string; location: string; text: string } | null = null;

export const FAQ = {
  title: "Frequently asked questions",
  description:
    "How the decoder works, what the Appeal Pass includes, how your documents are protected, and how refunds work.",
  items: [
    {
      q: "Is AppealDeck part of Amazon?",
      a: "No. AppealDeck is an independent service run by Jhangir Hussain, trading as Hawlton, in Pakistan. It is not affiliated with, endorsed by, or sponsored by Amazon. We use the Amazon name only to describe the notices our software reads and the appeals it drafts. We never log in to Seller Central and never submit anything to Amazon for you.",
    },
    {
      q: "What does the Appeal Pass add?",
      a: "A guided interview that asks what Amazon expects answered, an evidence checklist for your violation type, a drafted Plan of Action in the structure Amazon reads (root cause, corrective actions, preventive measures), a critic review that flags weak spots, and an encrypted vault for your documents. You edit the draft and submit it yourself.",
    },
    {
      q: "How does the decoder work?",
      a: "It reads your notice locally, identifies the violation type, pulls out every date and the deadlines they imply, and gives you a do-now and do-not list for that case type. Nothing you paste leaves your browser.",
    },
    {
      q: "How accurate is the draft?",
      a: "It is built from the facts in your notice and the evidence you provide, and the critic flags anything vague, unsupported or template-like before you submit. Review it as you would any draft — you know your business best.",
    },
    {
      q: "Will this get my account reinstated?",
      a: "Amazon decides every appeal, and nobody outside Amazon can promise a result. What you control is the quality of the appeal: addressing every violation the notice names, backing each claim with evidence, and showing a prevention plan Amazon can verify. AppealDeck is built to get those three things right — and to stop you sending a rushed appeal that spends an attempt.",
    },
    {
      q: "What are the deadlines?",
      a: "The decoder shows every date in your notice and the deadlines they imply: the appeal window (90 days when the notice does not state one) and the point where a funds appeal becomes available (around 60 days after deactivation). Where a window is ambiguous it says so, so you can act on the earliest date.",
    },
    {
      q: "What is the encrypted vault for?",
      a: "Keep your evidence — invoices, photos, notes — in one encrypted place, on your device. AES-256-GCM with a passphrase you choose; the key never leaves your browser. Encrypted copies sync so you can pick up on another device, and nobody at AppealDeck can read them.",
    },
    {
      q: "What is your refund policy?",
      a: "A 7-day refund, no questions asked, as long as the Appeal Pass has not been redeemed. Email the receipt address within 7 days. Details on the Refund page.",
    },
    {
      q: "Do you submit my appeal to Amazon?",
      a: "You do — in Seller Central, where Amazon expects it. AppealDeck prepares the plan and the evidence checklist; you stay in control of your account and never share your login.",
    },
    {
      q: "How long does it take?",
      a: "Decoding is immediate. The guided interview takes as long as you need to gather your facts and documents — most of that time is finding invoices, not typing. The draft and critic review follow as soon as the interview is complete.",
    },
    {
      q: "What if Amazon replies with more questions?",
      a: "Paste the reply into your dashboard. AppealDeck classifies it, extracts what Amazon is asking for, and updates your case so the next submission answers exactly that.",
    },
    {
      q: "What is free, and what needs an account?",
      a: "Decoding, deadlines, the do-now list and the first interview steps are free with no account, saved on this device. Sign in, still free, to add documents to your encrypted vault, see how complete your case file is and use AI field suggestions. The Appeal Pass drafts and reviews the Plan of Action and adds cloud sync.",
    },
  ] as const,
  cta: {
    title: "Have a notice in front of you?",
    desc: "Paste it into the free decoder for an answer about your own case.",
    link: "Decode my notice — free",
  },
  groups: [
    {
      name: "Pricing",
      items: [
        "What is free, and what needs an account?",
        "What does the Appeal Pass add?",
        "How long does it take?",
        "What is your refund policy?",
      ],
    },
    { name: "Decoding", items: ["How does the decoder work?", "How accurate is the draft?"] },
    { name: "Deadlines", items: ["What are the deadlines?"] },
    { name: "Vault", items: ["What is the encrypted vault for?"] },
    {
      name: "Submitting",
      items: [
        "Is AppealDeck part of Amazon?",
        "Do you submit my appeal to Amazon?",
        "Will this get my account reinstated?",
        "What if Amazon replies with more questions?",
      ],
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

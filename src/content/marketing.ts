// Copy source for marketing surfaces. Voice: §10.1–10.3 of 06-PREMIUM-UI-UX.
// Headline = outcome the seller controls. Sub-line = boundary. Button = verb + object.
// No banned-pattern / banned-number strings. Banned-list enforced by scripts/lint-copy.mjs.

export const HOME = {
  hero: {
    eyebrow: "A case workspace for Amazon sellers",
    headline: "A clearer path from notice to response.",
    subline:
      "Understand the request. Organize your evidence. Prepare a factual response—all in one case workspace.",
    primaryCta: "Decode my notice — free",
    secondaryCta: "See the Appeal Pass",
    reassuranceLine:
      "For Amazon US, English-language notices. Start free — no Seller Central login, you submit the response.",
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
      desc: "See the detected issue, stated deadlines and next steps.",
    },
    step2: {
      title: "Build your evidence",
      desc: "Keep original files, review notes and missing records together.",
    },
    step3: {
      title: "Prepare and track",
      desc: "Use an Appeal Pass to prepare a supported response. Keep submissions and replies in your case.",
    },
  },
  howItWorksTitle: "One connected workflow",
  howItWorksSub: "Your notice stays with you at every step.",
  included: {
    eyebrow: "What you get",
    title: "A place for every part of the case",
    sub: "From the first request to the next reply.",
  },
  proof: {
    eyebrow: "Trust",
    title: "Your records. Your decisions.",
  },
  closing: {
    title: "Start with the free decoder",
    desc: "Understand the request before deciding your next move.",
  },
} as const;

export const DECODE = {
  pageTitle: "Decode your Amazon notice",
  pageDescription: "See the issue, the time window and your next action.",
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
    deadlinesTitle: "Deadlines",
    whatToDoTitle: "What to do",
    doNow: "Do now",
    doNot: "Do not",
    ctaTitle: "Continue with the request Amazon actually made",
    ctaDesc:
      "Check the response-page instructions, review requested records and prepare the appropriate response in your case workspace.",
    ctaNote: "Organizing your case is free.",
    copySummary: "Copy plain-English summary",
    errorTitle: "Could not decode",
    errorFallback: "Something went wrong.",
    errorNetwork: "Network error. Try again.",
    errorHint: "Paste the full Amazon notice and try again.",
    whatThisMeans: "What this means",
    startPoaCta: "Open case workspace",
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
  headline: "Understand your case before you pay.",
  subline:
    "Start with a free notice brief and case workspace. Choose an Appeal Pass when you need to prepare a response for an eligible case.",
  price: "$249",
  priceNote: "One-time. One case.",
  included: "Included",
  jumpToPurchase: "See pass details",
  free: "Free",
  pass: "Appeal Pass",
  tableHeadings: {
    feature: "What you get",
    free: "Free",
    account: "Free account",
    pass: "Appeal Pass",
  },
  rows: {
    decode: { feature: "Notice brief & next steps", free: "Yes", account: "Yes", pass: "Yes" },
    preview: { feature: "Request and evidence plan", free: "Yes", account: "Yes", pass: "Yes" },
    vault: {
      feature: "Encrypted files & case notes",
      free: "This session",
      account: "On this device",
      pass: "On this device",
    },
    readiness: {
      feature: "Submission & reply history",
      free: "This session",
      account: "Yes",
      pass: "Yes",
    },
    poa: { feature: "Response from your confirmed facts", free: "—", account: "—", pass: "Yes" },
    critic: {
      feature: "Draft checks for missing information",
      free: "—",
      account: "—",
      pass: "Yes",
    },
    devices: { feature: "Encrypted backup & restore", free: "—", account: "—", pass: "Yes" },
  },
  trust: {
    title: "Built so you can check it yourself",
    submit: {
      label: "You submit, we never log in",
      desc: "The draft is yours to edit; you submit it in Seller Central.",
    },
    localFirst: {
      label: "Nothing sent to Amazon",
      desc: "AppealDeck analyzes the notice. You control what you submit.",
    },
    vault: {
      label: "Encrypted on your device",
      desc: "Encrypted storage with optional passphrase protection.",
    },
    refund: {
      label: "7-day refund",
      desc: "Request a refund within 7 days. Read the full policy before buying.",
    },
  },
  samplePoa: {
    trigger: "View a sample Plan of Action",
    watermark: "ILLUSTRATIVE — not a real appeal",
    copyDisabled: "Sample only",
    title: "Sample Plan of Action",
  },
  cta: "Get the Appeal Pass",
  faqTitle: "A few questions before you decide.",
  purchaseTitle: "Ready to prepare your response?",
  expectationsTitle: "What to expect",
} as const;

export const FOUNDER_NOTE: { name: string; location: string; text: string } | null = null;

export type FaqItem = {
  id: string;
  q: string;
  a: string;
  detail?: string;
  link?: { label: string; href: string };
};

export const FAQ = {
  title: "Questions, answered.",
  description: "Choose a topic. Get a clear answer. Decide your next step.",
  items: [
    {
      id: "start-free",
      q: "What can I do for free?",
      a: "Decode your notice and organize your case before you decide to pay.",
      detail:
        "Keep the request, files, notes and replies together. Guest work stays in this browser session. Sign in to move it to your account vault on this device.",
      link: { label: "Try the free decoder", href: "/decode" },
    },
    {
      id: "decode",
      q: "How does the decoder work?",
      a: "It turns the notice into a short brief: the likely issue, stated time windows and next steps.",
      detail:
        "Your notice is sent to AppealDeck for analysis. Check the result against your current notice and response page; you can correct the case before confirming it.",
    },
    {
      id: "time",
      q: "How long does preparing a case take?",
      a: "Decoding takes a moment. The rest depends on the facts and records you need to gather.",
      detail:
        "Work through one task at a time and save each review. Sign in before leaving a guest session if you want to keep its work in your account vault.",
    },
    {
      id: "independence",
      q: "Is AppealDeck part of Amazon?",
      a: "No. AppealDeck is an independent service operated by Hawlton in Pakistan.",
      detail:
        "We are not affiliated with or endorsed by Amazon. We do not access your Seller Central account or submit appeals for you.",
      link: { label: "About the service", href: "/terms#independence" },
    },
    {
      id: "review",
      q: "What should I check in the response?",
      a: "Check every fact, file name and page reference against your original records and the current request.",
      detail:
        "The workspace uses your saved wording and flags missing information. These checks help you review the response; they do not authenticate documents or verify your claims.",
    },
    {
      id: "outcome",
      q: "Will this get my account reinstated?",
      a: "Amazon decides the outcome and the review time.",
      detail:
        "AppealDeck helps you organize evidence and prepare a factual response. An Appeal Pass pays for that preparation. We do not promise reinstatement.",
    },
    {
      id: "deadlines",
      q: "Can I rely on the deadline shown?",
      a: "Confirm the exact date in your current notice and Account Health.",
      detail:
        "The decoder highlights detected time windows. A window without a verified starting date is not an exact deadline.",
    },
    {
      id: "submit",
      q: "Who submits the response?",
      a: "You review and submit through the official channel in the current request.",
      detail:
        "AppealDeck never signs in or submits for you. Record what you sent in History so it stays with that attempt.",
    },
    {
      id: "replies",
      q: "What if Amazon asks for more information?",
      a: "Add the reply in History, then review it as the next request.",
      detail:
        "You can open a new revision and recheck the evidence. Your earlier submitted wording and file references stay unchanged, so you can see exactly what you sent last time before you send anything again.",
    },
    {
      id: "files",
      q: "Where are my files saved?",
      a: "Original files are encrypted in your vault on this device.",
      detail:
        "Preparing a workspace response sends case text and file references to AppealDeck, not the originals. A passphrase-protected backup can be uploaded with an Appeal Pass; backup metadata such as file names remains visible.",
      link: { label: "Read about data storage", href: "/privacy#what-we-collect" },
    },
    {
      id: "processing",
      q: "What leaves my browser?",
      a: "Your notice goes to AppealDeck when you decode it. Response preparation sends the relevant case text and file references.",
      detail:
        "Workspace responses use your confirmed wording. Optional AI suggestions and the older interview drafting flow can send text to Google Gemini. Original evidence files are not sent for drafting.",
      link: { label: "How processing works", href: "/privacy#how-we-use" },
    },
    {
      id: "pass",
      q: "What does the Appeal Pass add?",
      a: "Response preparation and review for one eligible case, plus encrypted backup support.",
      detail:
        "The pass is $249 once, with no subscription. Start by reviewing your request. Cases needing professional help do not offer self-serve drafting.",
    },
    {
      id: "refund",
      q: "What is your refund policy?",
      a: "You can request a refund within 7 days of purchase.",
      detail:
        "Send the receipt to the address on the Refund page. Read the full policy and digital-delivery consent before buying.",
      link: { label: "Read the refund policy", href: "/refund" },
    },
  ] as const satisfies readonly FaqItem[],
  cta: {
    title: "Start with the notice in front of you.",
    desc: "See what is being asked before deciding whether you need a pass.",
    link: "Decode my notice — free",
  },
  groups: [
    {
      id: "start",
      name: "Getting started",
      hint: "Your first steps",
      items: ["start-free", "decode", "time", "independence"],
    },
    {
      id: "response",
      name: "Your response",
      hint: "Review, submit & follow up",
      items: ["review", "outcome", "deadlines", "submit", "replies"],
    },
    {
      id: "privacy",
      name: "Files & privacy",
      hint: "Storage and processing",
      items: ["files", "processing"],
    },
    { id: "pass", name: "Pass & refunds", hint: "What you pay for", items: ["pass", "refund"] },
  ] as const,
} as const;

export function faqByGroup(): { id: string; name: string; hint: string; items: FaqItem[] }[] {
  const byId = new Map<string, FaqItem>(FAQ.items.map((item) => [item.id, item]));
  return FAQ.groups.map((group) => ({
    ...group,
    items: group.items
      .map((id) => byId.get(id))
      .filter((item): item is FaqItem => item !== undefined),
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

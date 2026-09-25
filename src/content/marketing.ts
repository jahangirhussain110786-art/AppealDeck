// Copy source for marketing surfaces. Voice: §10.1–10.3 of 06-PREMIUM-UI-UX.
// Headline = outcome the seller controls. Sub-line = boundary. Button = verb + object.
// No banned-pattern / banned-number strings. Banned-list enforced by scripts/lint-copy.mjs.

/**
 * The home page tells one story, once, in the order a frightened seller needs it (25 Sep 2026):
 * their problem in their own words → what the notice does not tell them → how the work goes →
 * what happens to their case → start. Each point is made in one section only; the refund and the
 * pass details belong to /pricing, and the full questions list to /faq.
 */
export const HOME = {
  hero: {
    eyebrow: "For Amazon sellers with a suspension or policy notice",
    headline: "Amazon account suspended? Know what to send back.",
    accent: "what to send back",
    subline:
      "Paste your deactivation or policy notice. See what Amazon is asking for, the deadline it states and the records to gather. Free, with no sign-up.",
    primaryCta: "Decode my notice — free",
    reassuranceLine: "AppealDeck never logs in to your Amazon account. You decide what gets sent.",
  },
  insights: {
    eyebrow: "What the notice does not tell you",
    title: "Four things that shape an appeal before you write a word",
    items: [
      {
        title: "The section number says very little",
        body: "Section 3 is cited for failed verification, related accounts, policy breaches and complaints alike. The sentence that asks you for something is what decides your answer.",
        link: { label: "Section 3, explained", href: "/guides/section-3" },
      },
      {
        title: "Not every notice wants a Plan of Action",
        body: "A verification request wants a document that matches your account, letter for letter. An apology letter answers a question Amazon did not ask.",
        link: { label: "Identity verification", href: "/guides/identity-verification" },
      },
      {
        title: "The same text twice shows nothing changed",
        body: "After a refusal, Amazon looks for what is new. A copied template, or last time's wording, gives it nothing to go on.",
        link: { label: "Writing a Plan of Action", href: "/guides/plan-of-action" },
      },
      {
        title: "Fake notices target suspended sellers",
        body: "A message asking for a fee, a password or a WhatsApp chat is worth checking in Seller Central before you act on it.",
        link: { label: "Check a notice free", href: "/decode" },
      },
    ],
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "From notice to response",
    steps: [
      {
        title: "Decode the notice",
        tag: "Free",
        desc: "What Amazon is asking for, the deadline it states, the IDs it names, and anything in the message worth checking.",
      },
      {
        title: "Build the case",
        tag: "Free",
        desc: "The records your case needs, including ones the notice does not name. Your files kept encrypted with the case, and the deadline tracked.",
      },
      {
        title: "Prepare, send, follow up",
        tag: "Appeal Pass",
        desc: "A response built from the facts you confirm and checked for gaps. Every submission and Amazon reply kept together.",
        link: { label: "What the Appeal Pass covers", href: "/pricing" },
      },
    ],
  },
  trust: {
    eyebrow: "Before you paste anything",
    title: "What happens to your case",
    items: [
      {
        label: "No access to your Amazon account",
        desc: "AppealDeck never logs in, never submits and never contacts Amazon. You send the response yourself.",
      },
      {
        label: "Your files stay encrypted on your device",
        desc: "Your notice is sent to AppealDeck to decode it. A file leaves your device only when you ask for it to be checked.",
      },
      {
        label: "Amazon makes the decision",
        desc: "We help you answer clearly and completely. Nobody outside Amazon can promise reinstatement, and we do not.",
      },
    ],
  },
  guides: {
    eyebrow: "Guides",
    title: "Start from your situation",
  },
  closing: {
    title: "Your notice is the place to start",
    desc: "Paste it and see what it asks for before you decide anything else.",
  },
} as const;

export const DECODE = {
  pageTitle: "What is your Amazon notice asking for?",
  pageDescription:
    "Paste the full notice. See the response Amazon wants, the deadline it states, the IDs it names and the records to gather.",
  metaTitle: "Amazon suspension notice decoder — free",
  metaDescription:
    "Paste an Amazon deactivation or policy notice. See what it asks for, the deadline it states, the IDs it names and anything that looks fake. Free, no sign-up.",
  guidesTitle: "Read about your kind of notice",
  textarea: {
    label: "Your notice",
    placeholder: "Paste the full Amazon notice here…",
    hint: "Include the subject line and the date at the top. With them, we can count the deadline from the notice's own date.",
  },
  charCounter: "{count} characters",
  privacyNote: "Your notice is sent to AppealDeck for analysis. Nothing is sent to Amazon.",
  sampleButton: "Try a sample notice",
  clearButton: "Clear",
  sampleBadge: "Sample notice — not yours",
  submitButton: "Decode",
  decodeAnotherButton: "Decode another notice",
  noticeLikenessTitle: "Before you decode",
  likenessHint:
    "This doesn't look like an Amazon notice yet. Paste the full email, including the subject line.",
  result: {
    briefEyebrow: "What this notice is about",
    deadlinesTitle: "When it is due",
    noDeadline:
      "We could not read a deadline in this text. Check the date on your Account Health page in Seller Central.",
    recordsTitle: "What to gather",
    recordsAsked: "In your notice",
    noRecords:
      "This notice names no specific records. Check the response page in Seller Central before gathering anything.",
    gatedTitle: "This case needs professional help",
    gatedFallback: "This case needs professional help. A self-serve draft is not available.",
    nextEyebrow: "Your next step",
    nextTitle: "Turn this into your case",
    nextDesc:
      "Your notice, deadline and records list come with you. Free, and no sign-up needed to start.",
    jumpTo: "Or go straight to",
    wordingTitle: "What the wording in your notice means",
    doNow: "Do now",
    doNot: "Do not",
    copySummary: "Copy plain-English summary",
    errorTitle: "Could not decode",
    errorFallback: "Something went wrong.",
    errorNetwork: "Network error. Try again.",
    errorHint: "Paste the full Amazon notice and try again.",
    startPoaCta: "Open case workspace",
    // AA-39: the decoder's actual decision. Phrased as what Amazon asked for, never as advice
    // about what will work — the honest-expectations rule in D6 applies to this block too.
    responseTypeTitle: "What Amazon is asking for",
    responseTypeAlsoSeen: "Also found in this notice",
    responseTypeSourceTitle: "Where we read that",
    // B-10: the records list shows what the case will start with — what the notice names, and
    // what a case like this needs that it does not name, each labelled with who raised it.
    recordsNote:
      "“We added this” marks a record cases like yours usually need, even though your notice does not name it. Confirm the list against the response page in Seller Central.",
    recordsSource: "Source in your notice",
    entitiesTitle: "Details we found in your notice",
    entitiesNote:
      "Taken word for word from the text you pasted. Check each one before you rely on it.",
    entitiesAmbiguous: "Date order unclear — check this one",
    /**
     * #87: the scam-suspect card. Every word here is chosen to avoid a verdict. A newly
     * deactivated seller is the most phishable person online, and a message arriving at that
     * moment may be a forgery — but authenticity cannot be settled from pasted text, so
     * the product points at what is worth checking and sends them to the one place that can
     * settle it. Never "this is a scam", never "this looks genuine": both invent certainty, and
     * here either one could do real harm.
     */
    authenticityTitle: "Check this message before you act on it",
    authenticityLead:
      "We cannot tell you whether a message really came from Amazon. These are the things in it worth checking first.",
    authenticityAction:
      "Open Seller Central yourself and look at Account Health. A genuine notice appears in your account — you never have to trust the message to find it.",
    authenticityFound: "What we noticed",
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
    statedDeadline:
      "This notice names the last day to respond, so no counting is needed. Plan to submit well before it, and if Account Health shows a different date, go by Account Health.",
    legacyWindow:
      "Appeal windows have changed over time. Confirm the window shown in your Account Health dashboard before relying on the number in this notice.",
    ambiguousWindow:
      "This notice doesn't state a fixed number of days. Check the appeal window shown in your Account Health dashboard rather than assuming one.",
    clearStructure:
      "Amazon states exactly what the Plan of Action needs: root cause, corrective actions, and preventive measures. Structure your draft around these three headings.",
  },
} as const;

export const PRICING = {
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
  samplePoa: {
    trigger: "View a sample Plan of Action",
    watermark: "ILLUSTRATIVE — not a real appeal",
    copyDisabled: "Sample only",
    title: "Sample Plan of Action",
  },
  cta: "Get the Appeal Pass",
  faqTitle: "Before you buy",
  faqIds: ["pass", "outcome", "refund", "files"],
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
      a: "Your notice goes to AppealDeck when you decode it, and preparing a response sends your case text and file references — never the files themselves. Nothing is ever sent to Amazon.",
      // 24 Sep 2026: named two features deleted on 22 Sep (AI field suggestions, the interview's
      // drafting flow) and left out the one thing that does reach an AI provider. Now says what
      // the privacy policy says, and legalDisclosures.test.ts holds the two together.
      detail:
        "The only things sent to an AI provider (Google Gemini) are a business document you ask us to check and a section of your response you ask us to improve the wording of — each used for that one request, not kept. Identity and bank documents are checked on your device and never uploaded.",
      link: { label: "How processing works", href: "/privacy#how-we-use" },
    },
    {
      id: "pass",
      q: "What does the Appeal Pass add?",
      a: "Response preparation and review for one eligible case, plus encrypted backup support.",
      detail:
        "The pass is $249 once, with no subscription, for one case. It covers every revision of that case — if Amazon replies and you need to prepare another response, that stays part of the same pass, with no extra charge and no time limit. A different case needs its own pass. Start by reviewing your request. Cases needing professional help do not offer self-serve drafting.",
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

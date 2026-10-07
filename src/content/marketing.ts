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
    badge: "Free",
    eyebrow: "For Amazon sellers with a suspension or policy notice",
    headline: "Amazon account suspended? Know what to send back.",
    accent: "what to send back",
    subline:
      "Paste your deactivation or policy notice. See what Amazon is asking for, the deadline it states and the records to gather. Free, with no sign-up.",
    primaryCta: "Decode my notice — free",
    reassuranceLine: "AppealDeck never logs in to your Amazon account. You decide what gets sent.",
  },
  /**
   * The decoder demo under the hero (26 Sep 2026). The sample notice is decoded by the real engine
   * at render time; these are only the labels around that result.
   */
  demo: {
    noticeEyebrow: "The notice",
    readFromText: "Read from the text, not guessed",
    askingFor: "Amazon is asking for",
    whenDue: "When it is due",
    recordsTitle: "Records this case starts with",
    primaryCta: "Decode my notice — free",
  },
  /** The paste tool in the hero (v5, 26 Sep 2026). It hands the text to /decode, never via the URL. */
  tool: {
    label: "Amazon's email",
    placeholder: "Paste the whole email here…",
    sample: "Use a sample",
    note: "No Amazon login. Not stored.",
    submit: "Decode",
  },
  /** The layered product view beside the hero tool. Sample data, and labelled as such. */
  composition: {
    label: "The case workspace, with sample data",
    replied: "Amazon replied",
    repliedDetail: "1 asked again · 1 new · 3 kept",
    dueIn: "Reply due in",
    reminder: "Email reminder set",
    nextStep: "Next step",
    nextAction: "Replace the supplier invoice",
    start: "Start",
    checklist: "Checklist",
  },
  /** One large product visual, switched by these four (v5 feature switcher). */
  features: {
    eyebrow: "From notice to response",
    title: "Everything a case needs, in one place.",
    accent: "one place.",
    sample: "Sample data",
    items: [
      {
        title: "Decode the notice",
        body: "The phrases that decide your reply, marked in Amazon's own words.",
      },
      {
        title: "Gather every record",
        body: "One checklist, built from the notice, including records it does not name.",
      },
      {
        title: "Check your documents",
        body: "Invoices read against the notice: dates, ASINs, your business name.",
      },
      {
        title: "Answer every reply",
        body: "Paste Amazon's reply. See what changed. Your finished work stays.",
      },
    ],
  },
  /** The navy promise band. Its items are `bandFacts` below. */
  band: {
    title: "Your account stays yours.",
    accent: "yours.",
  },
  /** v5 (26 Sep 2026): the band's three facts. Each is true of the product as built. */
  bandFacts: [
    {
      value: "0",
      title: "logins to Seller Central",
      body: "We never touch your Amazon account. Amazon's rules bind you, so we stay out.",
    },
    {
      value: "1",
      title: "copy of your files, on your device",
      body: "Encrypted in your browser. A file leaves it only for a check you ask for, or an encrypted backup you choose.",
      link: { href: "/privacy", label: "Where your data goes" },
    },
    {
      value: "You",
      title: "send every reply",
      body: "We help you prepare it. You paste it into Amazon, and Amazon decides.",
    },
  ],
  questions: {
    title: "Questions",
    // Not "independence": its answer repeats the footer's not-affiliated line word for word.
    ids: ["outcome", "replies", "start-free", "submit"],
  },
  plans: {
    eyebrow: "Pricing",
    title: "Free until you need the response.",
    accent: "response.",
    link: "Full pricing and questions",
    accountCta: "Create a free account",
    items: [
      {
        name: "Free",
        note: "No account",
        price: "$0",
        features: [
          "Decode any notice",
          "Scam signals, quoted from the message",
          "Deadlines and the records list",
          "Do-now and do-not cards",
        ],
      },
      {
        name: "Free account",
        note: "Saved and tracked",
        price: "$0",
        features: [
          "Everything in Free, saved to your case",
          "Case saved encrypted on your device",
          "Deadlines, and who you are waiting on",
          "Amazon's replies applied: reopened, added, carried",
        ],
      },
      {
        name: "Appeal Pass",
        note: "Per case, one time",
        price: "$249",
        features: [
          "Basic document reading on your device is free. The Pass adds an AI reading of business documents against the notice, when the AI service is available (otherwise they are read on your device)",
          "The response prepared from your confirmed facts, every revision",
          "Wording help, when available, checked so dates, numbers and names stay as you wrote them",
          "7-day refund, no questions asked",
        ],
        cta: "Get the Appeal Pass",
      },
    ],
  },
} as const;

export const DECODE = {
  eyebrow: "Notice decoder",
  illustrationAlt: "An email from Amazon with the phrase that matters highlighted",
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
  noticeLikenessTitle: "Before you decode",
  likenessHint:
    "This doesn't look like an Amazon notice yet. Paste the full email, including the subject line.",
  result: {
    // v5 (26 Sep 2026): the result's headline is the answer. The accent is the part a seller acts on.
    headline: {
      PLAN_OF_ACTION: { lead: "Amazon wants a", accent: "Plan of Action." },
      SUPPORTING_DOCUMENTS: { lead: "Amazon wants", accent: "supporting documents." },
      ACKNOWLEDGEMENT: { lead: "Amazon wants an", accent: "acknowledgement." },
      QUESTIONNAIRE: { lead: "Amazon wants", accent: "answers to its questions." },
      NO_ACTION_REQUESTED: { lead: "Amazon is not asking for", accent: "a response." },
      UNDETERMINED: { lead: "Check what Amazon", accent: "is asking for." },
      // 29 Sep 2026, from the researched test notices: a severity-gated case was headed with a
      // response type the case then refused to prepare, and a verification notice (which names no
      // response type) was headed "Check what Amazon is asking for" although the tool knew.
      GATED: { lead: "This case needs", accent: "professional help." },
      // A message with warning signs is not headed as though Amazon had sent it.
      // No verdict: it has signs worth checking, which the warning below lists.
      SUSPECT: { lead: "This message has", accent: "warning signs." },
      VERIFICATION: { lead: "Amazon wants to", accent: "verify your identity." },
      // 6 Oct 2026: a pasted reply or a warning is not headed as a request for a response.
      REPLY: { lead: "This looks like", accent: "Amazon's reply." },
      WARNING: { lead: "This is a warning,", accent: "not a suspension." },
      LISTING: { lead: "This is about a", accent: "single listing." },
    },
    planOfActionGloss:
      "A Plan of Action is a short letter to Amazon: what went wrong, what you fixed, and how you will stop it happening again.",
    accountHealthGloss:
      "Account Health is the page in Seller Central that shows your account status.",
    multipleDecoded: "We decoded the most recent message, dated {date}.",
    multipleDecodedNoDate: "We decoded the most recent message.",
    replyTitle: "This looks like Amazon's reply to your appeal",
    replyBody:
      "Copy it, open your case, and paste it into the box called Add Amazon's next reply on the History tab. There it is read against what you submitted.",
    replyOpen: "Open my case",
    replyCopy: "Copy this reply",
    notEnforcementTitle: "Nothing to appeal yet",
    saveAnyway: "Save as a case anyway",
    errorEdit: "Edit what I pasted",
    errorSellerAction: "Paste Amazon's message instead",
    errorContinue: "Read it anyway. Results for non-English text may be wrong.",
    // 7 Oct 2026: the browser's own on-device translator, where it has one. Nothing is sent to us or
    // anyone else to translate; the English text is then decoded as usual.
    translate: "Translate to English on this device",
    translating: "Translating on this device…",
    translateFailed:
      "Your browser could not translate this. Paste the notice into your browser's translate feature, or into Seller Central's own language setting, then paste the English text here.",
    translatedNote:
      "Translated from {language} by your browser, on this device. Machine translation can change a date, an ID or a number: check every one against the original notice.",
    // Reply-due tile when the notice gives a date or a length we cannot count from (7 Oct 2026).
    factAmbiguous: "Date written {date}: could be {a} or {b}. Check your notice.",
    factAmbiguousShort: "Date unclear",
    errorNotNotice:
      "If this is a letter you wrote to Amazon, it is not a notice. Paste the message Amazon sent you.",
    factProblem: "The problem",
    decodeAnother: "Decode another",
    recordsCount: "{n} records",
    recordsCountOne: "1 record",
    recordNamed: "Named in the notice you pasted",
    recordInferred: "Usually needed in cases like this",
    saveTitle: "Turn this into a checklist you can finish.",
    saveNote: "Free. Kept in this browser tab until you close it. Sign in to keep it.",
    triageTitle: "Do now, and what to avoid",
    howRead: "How we read it",
    notAdvice: "Software, not legal advice. Amazon decides.",
    factDue: "Reply due",
    factNoDate: "No date stated",
    // 29 Sep 2026: a notice saying "within 90 days" showed "No date stated" here, so the one fact a
    // frightened seller needs first sat three cards further down. Still no invented date.
    factWindow: "{n} days",
    factWindowNote: "from when you got the notice",
    factScam: "Scam check",
    factScamClear: "No warning signs",
    factScamFlagged: "Worth checking",
    deadlinesTitle: "When it is due",
    noDeadline:
      "We could not read a deadline in this text. Check the date on your Account Health page in Seller Central.",
    recordsTitle: "What to gather",
    recordsAsked: "In your notice",
    noRecords:
      "This notice names no specific records. Check the response page in Seller Central before gathering anything.",
    gatedTitle: "This case needs professional help",
    gatedFallback: "This case needs professional help. A self-serve draft is not available.",
    jumpTo: "Or go straight to",
    wordingTitle: "What the wording in your notice means",
    markedTitle: "Your notice, marked up",
    markedRisk: "Decides the response",
    markedClear: "A record to supply",
    doNow: "Do now",
    doNot: "Do not",
    copySummary: "Copy plain-English summary",
    errorTitle: "Could not decode",
    errorFallback: "Something went wrong.",
    errorNetwork: "Network error. Try again.",
    errorServer:
      "The decoder is not available right now. Your notice is fine and is still in the box. Try again in a minute.",
    errorSlow:
      "This is taking longer than it should. Your notice is still in the box. Try again, or check your connection.",
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
  // v5 (26 Sep 2026, prototype pricing.html). "Every round included" is the Terms' licence clause:
  // one Pass covers every revision of its case, with no expiry (see legal.ts).
  headline: "One price per case. Every round included.",
  accent: "included.",
  currency: "USD",
  currencyNote:
    "Same price in every country. Guidance, deadlines and records are written for Amazon US, and the decoder reads English notices",
  compareTitle: "What each one includes",
  readFirstTitle: "Read this before you pay.",
  readFirstAccent: "pay.",
  // The honest-expectations disclosure the checkout spec requires before the pay button
  // (legal/withdrawal-consent.md item 1): software, not legal advice; no promised outcome; the
  // price once per case; the refund route. The last two are on the order summary beside it.
  limits: [
    {
      title: "Amazon decides.",
      body: "No outcome is promised, and nobody here can predict one.",
    },
    {
      title: "Software, not a law firm.",
      body: "Nothing here is legal advice, and nothing you tell us is legally privileged.",
    },
    {
      title: "Your files are kept on your device.",
      // Hedged like every other "on your device" line: an encrypted backup is a second copy.
      body: "Clearing your browser removes them, unless you made an encrypted backup. Keep a copy of anything you need.",
    },
    {
      title: "Some cases we do not take.",
      body: "Allegations of fraud, forged documents or child safety go to a professional instead.",
    },
  ],
  order: {
    title: "Appeal Pass",
    line: "One case, every round",
    tax: "Tax",
    taxValue: "Included",
    expires: "Expires",
    expiresValue: "Never",
    total: "Total, once",
    amount: "$249.00",
    paidThrough: "Paid through Paddle · refund within 7 days, no reason needed",
  },
  createAccount: "Create an account",
  checkoutNote:
    "Payment is handled by Paddle, which also sends the tax receipt. A case that already has its Pass is not charged again.",
  subline: "Decoding is free. Pay once, only when you want the full response.",
  // 6 Oct 2026: the one plain sentence about what costs money, beside the plans and the checkout.
  freeVersusPass:
    "Free: understand the notice, gather documents, write your answers. $249 once, only if you want us to prepare the response.",
  price: "$249",
  priceNote: "One-time. One case.",
  included: "Included",
  notIncluded: "Not included",
  jumpToPurchase: "Get the Appeal Pass",
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
    title: "Sample Plan of Action",
  },
  cta: "Get the Appeal Pass",
  faqTitle: "About paying",
  faqIds: ["pass", "outcome", "refund", "files"],
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
  eyebrow: "Help & answers",
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
      a: "No. AppealDeck is an independent service operated by Jhangir Hussain, trading as Hawlton, in Pakistan.",
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
      a: "Your notice goes to AppealDeck when you decode it, and preparing a response sends your case text and file references, and for a Plan of Action your words go on to the AI that writes it. The files themselves are never sent for that. Nothing is ever sent to Amazon.",
      // 24 Sep 2026: named two features deleted on 22 Sep (AI field suggestions, the interview's
      // drafting flow) and left out the one thing that does reach an AI provider. Now says what
      // the privacy policy says, and legalDisclosures.test.ts holds the two together.
      detail:
        "The only things sent to an AI provider (Google Gemini) are what it needs to write a Plan of Action (your notice, your written answers and the names and notes of your records, never the files), a business document you ask us to check, and a section of your response you ask us to improve the wording of. We do not keep a copy of any of them. Identity, bank and proof-of-address documents are checked on your device and never uploaded.",
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
        "Write to the address on the Refund page with your receipt or the email address on your account. Read the full policy and digital-delivery consent before buying.",
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

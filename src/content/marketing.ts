// Copy source for marketing surfaces. Voice: §10.1–10.3 of 06-PREMIUM-UI-UX.
// Headline = outcome the seller controls. Sub-line = boundary. Button = verb + object.
// No banned-pattern / banned-number strings. Banned-list enforced by scripts/lint-copy.mjs.

import { AMAZON_REVIEW_TIME } from "./shared";
import {
  accountPassEnabled,
  accountPassListed,
  professionalsEnabled,
  professionalsListed,
  rebateEnabled,
  renewalEnabled,
  reviewEnabled,
  reviewListed,
} from "@/lib/plans";
import { OPENS_SOON, PRODUCTS } from "./purchases";

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
    // G-97: the sample's 90 days is the sample's own window; a real notice states its own.
    sampleWindowNote: "90 days is this sample's own window. Your notice states yours.",
    recordsTitle: "Records this case starts with",
    primaryCta: "Decode my notice — free",
  },
  /** The paste tool in the hero (v5, 26 Sep 2026). It hands the text to /decode, never via the URL. */
  tool: {
    label: "Amazon's email",
    placeholder: "Paste the whole email here…",
    sample: "Use a sample",
    // G-51: "Not stored" was untrue once a reading is remembered for seven days (R-5). The server
    // reads the text and keeps no copy of it; the fingerprint kept is not the notice (legal.ts).
    note: "No Amazon login. Read on our server; we keep no copy.",
    // G-01: the same door on the home page.
    replyDoor: "Already appealed? Paste Amazon's reply instead.",
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
    ids: ["outcome", "chatbot", "replies", "start-free", "submit"],
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
          // G-07: the free layer already does this; a rival's free tier is a gated teaser.
          "Amazon's reply read in plain words, with its own sentence quoted",
          "Supplier invoice check, read on your device",
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
          // G-94 and G-37: the first line says what the Pass is; the document line is split off and
          // stays true when the AI is switched off (the device reading is what runs then).
          "The response prepared from your confirmed facts, every revision",
          "Your business documents read against the notice by AI when it is available, and on your device when it is not",
          "Wording help, when available, checked so dates, numbers and names stay as you wrote them",
          "14-day refund, no questions asked",
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
    // G-70: some sellers have only a banner, or the email never arrived. Says where to look.
    cannotFind:
      "Cannot find the notice? Look in Seller Central under Account Health and Performance Notifications, and in your spam folder. If all you have is a banner, open it and paste the text it shows.",
    // G-01: the free reply reader has no page of its own; this is its door.
    replyDoor:
      "Already appealed? Paste Amazon's reply here instead. We will say whether it refused, asked for documents or reinstated, and show the sentence that says so.",
  },
  charCounter: "{count} characters",
  privacyNote:
    "Your notice is sent to AppealDeck to be read, and we keep no copy of it. Only when our own rules cannot place it does it also go to Google Gemini for a second reading. Nothing is sent to Amazon.",
  sampleButton: "Try a sample notice",
  clearButton: "Clear",
  sampleBadge: "Sample notice — not yours",
  // G-77: the sample now decodes at once; its result says whose it is.
  sampleResultBadge: "Sample result",
  sampleResultNote:
    "Made from a made-up notice, not yours: its 90 days are the sample's own window. Paste your own to decode it.",
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
    // G-98: two terms a first-time seller meets in the result without a word of explanation.
    // Each appears only when the notice itself uses the term.
    asinGloss: "An ASIN is the ten-character code Amazon gives each product. Most start with B0.",
    sectionThreeGloss:
      "Section 3 is the part of Amazon's Business Solutions Agreement that covers ending or suspending a seller account.",
    multipleDecoded: "We decoded the most recent message, dated {date}.",
    multipleDecodedNoDate: "We decoded the most recent message.",
    replyTitle: "This looks like Amazon's reply to your appeal",
    replyBody:
      "Copy it, open your case, and paste it into the box called Add Amazon's next reply on the History tab. There it is read against what you submitted.",
    // G-01: the free reply reader. Plain words for what the reply says, always labelled as our
    // reading and shown beside Amazon's own sentence. It never predicts what Amazon will do next.
    replyReadingLabel: "What this reply says",
    replyReading: {
      reinstated: "It says your account or listings are reinstated.",
      reinstatedPartial: "It says you are reinstated, but something is still open below.",
      needs_more_information:
        "It says Amazon has not reinstated you on what you sent, and asks for more.",
      document_request: "It asks you for documents.",
      identity_verification: "It asks you to verify your identity.",
      final_decision_negative: "It says Amazon's decision is final.",
      funds_decision: "It is about your funds.",
    },
    replyReadingNote: "Our reading of the words, not Amazon's. Check it against the reply itself.",
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
    // A notice can raise more than one issue; the tile names the first and this names the rest.
    factAlso: "Also in this notice: {kinds}. A response has to answer each.",
    // 9 Oct 2026: under the problem when a second reading placed a notice the rules could not.
    factReadFrom: "Read from:",
    // R-3 (10 Oct 2026): an AI-proposed kind is marked as one, so it is checked before it is relied on.
    factAiReading: "AI suggestion: check it against your notice",
    recordsFromAi:
      "This list follows the AI suggestion above. If your notice is about something else, change the problem on your case's first screen and the list changes with it.",
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
    // G-50: said at the top when the notice could not be placed, so a generic result is not
    // mistaken for a confident one.
    // G-03: the second question a seller asks. Quotes the notice's claim, names Amazon's policy and
    // its date, and promises nothing about the money. The 60 days matches the funds clock.
    moneyTitle: "Your money",
    moneyBody:
      "Your notice says Amazon is holding your funds. If the account is not reinstated, Amazon's Funds Disbursement Eligibility policy lets you ask for them about 60 days after deactivation (the policy is dated 9 Oct 2024, and some sellers are still told 90). That is when you can ask, not a promise it is paid. Confirm the dates in your own account.",
    // G-100: first sub-line of a verification result. It used to sit lower, under "How we read it".
    verificationNotAppeal:
      "This is not an appeal. A Plan of Action is usually the wrong reply to a verification request.",
    couldNotPlace: "We could not place this notice. Nothing below is guessed.",
    looksPartial:
      "This looks like only part of your notice. The body of the email says what Amazon wants and by when, so paste all of it, from the subject line to the signature. What is below comes from the lines you pasted.",
    factScam: "Scam check",
    factScamClear: "No warning signs",
    factScamFlagged: "Worth checking",
    // G-48: what the check looked at, so "No warning signs" is not an unexplained tick. It lists
    // signals and says plainly it proves nothing; never "genuine" or "safe".
    // G-49: one line, once. A documented pattern, not a verdict on any message.
    factScamMore: "Insider offers, and notices that go missing",
    factScamInsider:
      "Offers of inside help from someone at Amazon, on WhatsApp, Telegram or WeChat, are a documented scam pattern, most of all around Prime Day and the holidays. And a notice missing from Seller Central is a signal, not proof: in one April 2026 case the email was real.",
    factScamLooked:
      "Looked for: a payment or gift-card demand, a password or code request, a move to WhatsApp or a phone, remote access or QR codes, and non-Amazon links or senders. It cannot prove a message is real; Account Health settles that.",
    deadlinesTitle: "When it is due",
    noDeadline:
      "We could not read a deadline in this text. Check the date on your Account Health page in Seller Central.",
    recordsTitle: "What to gather",
    // G-13: a notice about a product that names no ASIN. Writing a root cause for a complaint nobody
    // has named is how sellers end up inventing one.
    noAsinDoNow:
      "The notice names no ASIN. Your first message should ask Amazon which ASINs and which complaint it is about, before you write a response.",
    // G-08: a link to a free page that already exists, on the row it belongs to.
    invoiceCheckLink: "Check an invoice first, free",
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
    startPoaCta: "Start my case — free",
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
  // G-91: one sentence under the subtitle; on a phone it was a three-line pill above the headline.
  currencyNote: "Same price everywhere. Written for Amazon US; English notices.",
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
    paidThrough: "Paid through Paddle · refund within 14 days, no reason needed",
  },
  createAccount: "Create an account",
  checkoutNote:
    "Payment is handled by Paddle, which also sends the tax receipt. A case that already has its Pass is not charged again. The Pass is not on sale to buyers in the EU, the EEA or the United Kingdom yet; the free decoder works everywhere.",
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
  /**
   * The Account Pass (22 Oct 2026, stage 2 of the combined plan): every case on one account for 12
   * months. None of this appears on any page until its Paddle price is configured
   * (`accountPassEnabled()` in `src/lib/plans.ts`), so it cannot promise what cannot yet be bought.
   * The price here must equal the Paddle price (docs/DEPLOYMENT.md section 5d).
   */
  account: {
    name: "Account Pass",
    note: "Every case, 12 months",
    price: "$329",
    features: [
      "Everything in the Appeal Pass, for every case on your account",
      "As many cases as you have, for 12 months",
      "The same 14-day refund, no questions asked",
    ],
    cta: "Get the Account Pass",
    order: {
      title: "Account Pass",
      line: "Every case, 12 months",
      amount: "$329.00",
      expiresValue: "12 months after you buy",
    },
    fairUse:
      "One Account Pass covers the cases of one seller's business. It is not for running other sellers' cases.",
    choice: {
      legend: "Which Pass?",
      // 22 Oct 2026: once the AI document review is on sale it is in the same list, and it is not a Pass.
      legendWithReview: "What to buy",
      case: { label: "Appeal Pass", detail: "This case, every round", price: "$249" },
      account: {
        label: "Account Pass",
        detail: "Every case on your account, 12 months",
        price: "$329",
      },
    },
    covered: {
      until:
        "Your Account Pass covers this case and every other case on your account until {date}.",
    },
    founding: {
      title: "Founding offer",
      body: "The first {total} Account Passes cost the same as one Appeal Pass.",
      left: "{left} of {total} left",
      price: "$249 instead of $329",
      partnerNote:
        "A partner's code takes the place of the founding offer; the two do not combine.",
    },
  },
  faqTitle: "About paying",
  faqIds: ["pass", "chatbot", "outcome", "refund", "files"],
  /**
   * 22 Oct 2026. A general chatbot now writes a letter for nothing, so a letter is not what is for
   * sale; checking the proof and keeping the case is. This says so, and says where the chatbot is
   * enough, because a seller who is told the truth about the alternative believes the rest. Every
   * row below is true of the product as built (docs/CURRENT-STATE.md) and of general chatbots as a
   * class; nothing here names a company or claims Amazon treats a chatbot's letter differently.
   */
  versus: {
    id: "versus",
    title: "Can I ask a chatbot instead?",
    accent: "chatbot",
    lead: "You can, and for a first read of a simple notice it may be enough. Here is what changes once the case needs proof.",
    headings: { job: "What the case needs", chatbot: "A general chatbot", us: "AppealDeck" },
    rows: [
      {
        job: "A draft from what you paste",
        chatbot: "Yes",
        us: "Yes, only from facts you confirmed",
      },
      {
        job: "Your invoices read against what Amazon asked",
        chatbot: "If you paste each one and ask the right question",
        us: "Dates, ASINs, names and units, on every document",
      },
      {
        job: "A warning when a notice looks fake",
        chatbot: "Only if you think to ask",
        us: "On every notice",
      },
      {
        job: "Every round kept together",
        chatbot: "Usually not across chats",
        us: "Every reply, document and response in one case",
      },
      {
        job: "A warning when a resubmission has not changed",
        chatbot: "No",
        us: "Yes, before you send",
      },
      {
        job: "A reminder before a date you set",
        chatbot: "No",
        us: "Yes, by email",
      },
      {
        job: "Where your files go",
        chatbot: "Usually uploaded to the service",
        us: "Kept on your device; a file leaves only for a check you ask for",
      },
    ],
    note: "AppealDeck does not claim Amazon treats a chatbot's letter differently. A response that does not answer what the notice asked is a weak response, whoever wrote it.",
  },
  /**
   * The going rates around the Pass, so $249 is read against something. Each figure is from public
   * price pages and listings read on `checkedOn`; `marketing.test.ts` fails when the date is more
   * than 150 days old, so the strip is re-read rather than left to go stale.
   */
  market: {
    title: "What else people pay",
    checkedOn: "2026-10-22",
    checkedLabel:
      "Public price pages and listings, read on 22 October 2026. Prices change; check before you decide.",
    items: [
      { what: "A general chatbot", price: "$0 to $20 a month" },
      { what: "A freelance writer", price: "$5 to $600 for a Plan of Action" },
      { what: "An agency or attorney", price: "$795 to $3,500 for a case" },
    ],
  },
} as const;

/** The founder's own note on the home page (12 Oct 2026, written at his direction from his account of why he built it). It claims no credential, no price comparison and no result. */
export const FOUNDER_NOTE: { name: string; location: string; text: string } | null = {
  name: "Jhangir Hussain",
  location: "Pakistan",
  text: "I build software, and I am an Amazon seller myself. When I saw how much sellers were being asked to pay to be heard after a suspension, often in a panic and on a deadline, I wanted a calmer way through. So I built one: it reads your notice, shows what Amazon is really asking for, checks the documents you already have, and helps you write a clear, honest answer in your own words. It is software, not a law firm, and no one can promise what Amazon will decide. But getting your case in order should not cost a fortune.",
};

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
      a: "No. AppealDeck is software, operated by Jhangir Hussain, trading as Hawlton, in Pakistan.",
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
      // G-52: the second sentence says what the buyer does get, with no outcome word in it.
      a: "Amazon decides the outcome and the review time. What you get is the record, the document checks and a response built only from your facts, every round.",
      detail:
        "AppealDeck helps you organize evidence and prepare a factual response. An Appeal Pass pays for that preparation. We do not promise reinstatement.",
    },
    {
      id: "review-time",
      q: "How long does Amazon take to answer?",
      a: AMAZON_REVIEW_TIME,
      detail:
        "Nobody outside Amazon can say how long your case will take, and we do not guess. While you wait, you can keep the next reply with this attempt, and set a follow-up date so the case tells you when to look again.",
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
      a: "Your notice goes to AppealDeck when you decode it, and preparing a response sends your case text and file references, and your written words go on to the AI that writes the response from them. The files themselves are never sent for that. Nothing is ever sent to Amazon.",
      // 24 Sep 2026: named two features deleted on 22 Sep (AI field suggestions, the interview's
      // drafting flow) and left out the one thing that does reach an AI provider. Now says what
      // the privacy policy says, and legalDisclosures.test.ts holds the two together.
      detail:
        "The only things sent to an AI provider (Google Gemini) are what it needs to write a Plan of Action, a document-request response or questionnaire answers (your notice, your written answers and the names and notes of your records, never the files), a business document you ask us to check, a section of your response you ask us to improve the wording of, and the text of a notice our own rules cannot place (for a second reading you confirm). We do not keep a copy of any of them. Identity, bank and proof-of-address documents are checked on your device and never uploaded.",
      link: { label: "How processing works", href: "/privacy#how-we-use" },
    },
    {
      id: "pass",
      q: "What does the Appeal Pass add?",
      a: "Response preparation and review for one eligible case, plus encrypted backup support. It also adds an AI reading of your business documents against the notice, when the AI is available.",
      detail:
        "The pass is $249 once, with no subscription, for one case. It covers every revision of that case — if Amazon replies and you need to prepare another response, that stays part of the same pass, with no extra charge and no time limit. A different case needs its own pass. Start by reviewing your request. Cases needing professional help do not offer self-serve drafting.",
    },
    {
      id: "refund",
      q: "What is your refund policy?",
      a: "You can request a refund within 14 days of purchase.",
      detail:
        "Write to the address on the Refund page with your receipt or the email address on your account. Read the full policy and digital-delivery consent before buying.",
      link: { label: "Read the refund policy", href: "/refund" },
    },
    {
      id: "chatbot",
      q: "Can I use ChatGPT or Claude instead?",
      a: "You can write a draft that way, and for a first read of a simple notice it may be enough.",
      detail:
        "A chatbot does not check your invoices against what Amazon asked, keep every round together, tell you when a resubmission has not changed or remind you before a date, and it can add details you never gave it. AppealDeck does those things, builds the response only from facts you confirmed, and keeps your files on your device. Use whichever helps, and check every fact against your own records before you send.",
      link: { label: "See the comparison", href: "/pricing#versus" },
    },
    {
      id: "writers",
      q: "Do you have pricing for appeal writers and VA teams?",
      // 22 Oct 2026: the answer changes once professional prices are on sale.
      a: professionalsListed()
        ? `${professionalsEnabled() ? "" : OPENS_SOON.faqLead}Yes, for verified professionals: case credits in packs of ${PRODUCTS.pack10.count} and ${PRODUCTS.pack30.count}, or the Pro plan. The checks are free, and the written response is $249 per case for everyone else.`
        : "Not yet. The checks are free, and the written response is $249 per case. Professional pricing is being set with the first writers.",
      detail: professionalsListed()
        ? "Each credit activates one case with an Appeal Pass. We verify professionals by hand first, so a seller cannot buy a professional price for their own case. The page for writers has the prices and how to be verified."
        : "If you handle cases every week, write to us with how you work and what a case should cost you. The page for writers lists what you can use today.",
      link: { label: "For writers and VA teams", href: "/for-professionals" },
    },
    {
      id: "partners",
      q: "Can I earn by sending sellers to AppealDeck?",
      a: "Yes. A partner earns 30 percent of what a seller they send pays for an Appeal Pass.",
      detail:
        "The seller gets $25 off with your code. Commission is paid once the 14-day refund window has passed, by bank transfer or Payoneer. Read the rules, then write to us.",
      link: { label: "The partner program", href: "/partners" },
    },
    // 22 Oct 2026: shown while the Account Pass is on sale, and while it is only previewed (then the
    // answer begins "Opening soon."), so no page promises a product the cards do not show.
    ...(accountPassListed()
      ? ([
          {
            id: "account-pass",
            q: "What is the Account Pass?",
            a: `${accountPassEnabled() ? "" : OPENS_SOON.faqLead}One payment that covers every case on your account for 12 months, instead of one Pass per case.`,
            detail:
              "It does everything an Appeal Pass does, for as many cases as you have, and it has the same 14-day refund. It ends 12 months after you buy it; a case with no Appeal Pass of its own then needs one to prepare a further response. It is for one seller's business, not for preparing other sellers' cases.",
            link: { label: "See the plans", href: "/pricing#purchase" },
          },
        ] as const satisfies readonly FaqItem[])
      : []),
    // 22 Oct 2026: each of these appears only while its product is on sale (or, for the rebate,
    // while it is switched on), so no page answers a question about something that cannot be had.
    ...(reviewListed()
      ? ([
          {
            id: "document-review",
            q: "What is the AI document review?",
            a: `${reviewEnabled() ? "" : OPENS_SOON.faqLead}For ${PRODUCTS.review.price}, the AI reads up to five of one case's documents against what Amazon asked.`,
            detail:
              "It is for a seller who wants the documents read before paying for the whole Pass. The price comes off the Appeal Pass for the same case, so you pay the difference, not both in full. The free check on your own device stays free either way, and the same 14-day refund applies.",
            link: { label: "See the plans", href: "/pricing#purchase" },
          },
        ] as const satisfies readonly FaqItem[])
      : []),
    ...(renewalEnabled()
      ? ([
          {
            id: "renewal",
            q: "Can I renew the Account Pass?",
            a: `Yes. A renewal is ${PRODUCTS.renewal.price} and adds 12 months to the end of your cover.`,
            detail:
              "You can renew while the Account Pass is running and for a while after it ends. The 12 months start when the last cover ends, so renewing early loses nothing. Renew from the Billing page.",
            link: { label: "Open Billing", href: "/billing" },
          },
        ] as const satisfies readonly FaqItem[])
      : []),
    ...(professionalsListed()
      ? ([
          {
            id: "credits",
            q: "How do case credits and the Pro plan work?",
            a: `${professionalsEnabled() ? "" : OPENS_SOON.faqLead}A case credit activates one case with an Appeal Pass. Packs of ${PRODUCTS.pack10.count} cost ${PRODUCTS.pack10.price} and of ${PRODUCTS.pack30.count} cost ${PRODUCTS.pack30.price}; the Pro plan is ${PRODUCTS.pro.price} ${PRODUCTS.pro.per} for ${PRODUCTS.pro.credits} credits.`,
            detail:
              "Pack credits last 12 months. Pro credits last one more month than the month they arrive. Credits are for verified professionals preparing other sellers' cases; each case still needs its own seller's facts. Cancel the Pro plan any time in Billing.",
            link: { label: "For writers and VA teams", href: "/for-professionals" },
          },
        ] as const satisfies readonly FaqItem[])
      : []),
    ...(rebateEnabled()
      ? ([
          {
            id: "rebate",
            q: "Do I get money back for telling you how my case ended?",
            a: `Yes. Tell us within 120 days of paying, whatever the result, and we refund ${PRODUCTS.rebate.amount} of that payment.`,
            detail:
              "We link the report to your account so we know whom to refund; it is not published and it is separate from the anonymous share. Any result counts, including a refusal or no answer yet. It comes back through Paddle, as a refund on your receipt.",
          },
        ] as const satisfies readonly FaqItem[])
      : []),
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
      items: ["start-free", "decode", "chatbot", "time", "independence"],
    },
    {
      id: "response",
      name: "Your response",
      hint: "Review, submit & follow up",
      items: ["review", "outcome", "review-time", "deadlines", "submit", "replies"],
    },
    {
      id: "privacy",
      name: "Files & privacy",
      hint: "Storage and processing",
      items: ["files", "processing"],
    },
    {
      id: "pass",
      name: "Pass, refunds & partners",
      hint: "What you pay for, and who else can earn",
      items: [
        "pass",
        ...(accountPassListed() ? (["account-pass"] as const) : []),
        ...(renewalEnabled() ? (["renewal"] as const) : []),
        ...(reviewListed() ? (["document-review"] as const) : []),
        "refund",
        ...(rebateEnabled() ? (["rebate"] as const) : []),
        "writers",
        ...(professionalsListed() ? (["credits"] as const) : []),
        "partners",
      ],
    },
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

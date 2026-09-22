// Legal + trust copy source of truth.
// §10.1–10.3 voice: outcome, boundary, avoid banned lists.
// Legal pages render these structured sections (with TOC). Pricing D8 consent
// pulls consent + refund wording from here. "Last updated" dates are the real change dates.

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
};

export type LegalDocData = {
  title: string;
  sections: LegalSection[];
};

export type LegalDoc = "privacy" | "terms" | "refund";

export const LEGAL = {
  lastUpdated: {
    privacy: "2026-09-22",
    terms: "2026-09-10",
    refund: "2026-09-11",
  },
  privacy: {
    title: "Privacy",
    sections: [
      {
        id: "what-we-collect",
        title: "What we collect",
        body: [
          "When you decode a notice, its text is sent to AppealDeck for analysis. Preparing a response sends your case text and document references to AppealDeck. Uploading a file does not, by itself, send it anywhere.",
          "If you ask us to check a business document — an invoice, an authorization letter, a sales report, a listing screenshot or a certificate — that document is sent to AppealDeck and on to Google Gemini, so its contents can be read against what Amazon asked you for. It is used for that one request and we do not keep a copy. This happens only when you ask for a check on that specific file.",
          "Identity and financial documents are treated differently. Passports, national identity cards, driving licences and bank statements are never uploaded for checking. Those are examined on your own device, in your browser, and we look only at whether the picture is large enough, sharp enough, well lit and fully in frame — we do not read what the document says.",
          "When you create an account or buy the Appeal Pass, Paddle collects the payment and billing information. We receive a licence record (email, plan, status) via a Paddle webhook.",
          "Evidence contents are encrypted in your browser. If you choose cloud backup, encrypted contents and unencrypted metadata (including file names, tags, types, case references and content hashes) are uploaded to Supabase Storage. A backup passphrase protects the content key; we do not receive that passphrase.",
          "If you turn on email reminders for a case, we store the reminder date you chose, the case type, and an identifier for that case, so we can email you when the date arrives. Nothing else about the case is sent: not your notice, your evidence, your draft, or any note you have written. Turning reminders off for a case deletes that record.",
          "Before sign-in, interview drafts are encrypted with a secret held for that tab session. Closing the session or clearing browser data can make them unrecoverable. Signing in on that tab transfers the draft into your account vault after it is unlocked, preserving existing cases. Account vaults unlock automatically by default; you can add passphrase protection.",
        ],
      },
      {
        id: "how-we-use",
        title: "How we use it",
        body: [
          "To recognize you across sessions, keep your licence active, and sync your encrypted vault.",
          "To send you a receipt and account-related email (billing lifecycle). We do not send marketing email by default.",
          "Workspace response preparation uses your saved wording and document references. Optional AI suggestions and the older interview drafting flow can send relevant notice text and answers to Google Gemini. Drafting never sends your files — only a document check does, and only for the file you asked us to check. AI data handling depends on the provider's applicable terms and service configuration.",
          "To count usage against Paddle and Upstash free tiers for abuse protection.",
          "To measure how many visitors reach each step of the free decoder and the Appeal Pass, using a cookieless analytics tool (Plausible or Umami) that counts page visits without collecting personal data or setting cross-site identifiers.",
        ],
      },
      {
        id: "international-transfers",
        title: "Where your data is processed",
        body: [
          "Some processing happens outside Pakistan — Google (Gemini drafting) and Paddle (payments) both operate internationally, including the US and EU. Each is bound by its own data-processing agreement. We do not sell your data to anyone.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies and local storage",
        body: [
          "We use one essential cookie for your session and one to remember your colour-theme choice. You can delete both at any time.",
          "The case file is stored encrypted in your browser's IndexedDB vault. Account vaults use a browser-held key by default, with optional passphrase protection. Decoding and response preparation send relevant text to our server. AI-enabled actions may also send text to the AI provider as described above.",
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          "Decode, response and document-check requests are processed by the app server. These endpoints do not save a separate copy of your case text or of a checked document in the account database — there is no upload store here, and a checked file exists only for the length of that one request. Hosting and optional AI services handle request data under their own retention terms.",
          "Licence records (email, plan, status) are kept for as long as needed for billing, entitlement, and accounting.",
          "Your working case and vault contents stay in your browser until you delete them. If you choose cloud backup, an encrypted copy and visible metadata are stored separately; deleting local files does not automatically delete that backup.",
        ],
      },
      {
        id: "your-rights",
        title: "Your rights",
        body: [
          "You may delete your account and its licence record at any time by emailing billing@appealdeck.com.",
          "Depending on where you live, you may also have the right to access, correct, delete, or receive a copy of the data we hold about you, and to object to how we use it. Email privacy@appealdeck.com to exercise any of these rights; we respond within 30 days.",
          "Decryption is a function of your passphrase. We cannot recover a forgotten passphrase — it is never stored.",
        ],
      },
      {
        id: "breach-notification",
        title: "If something goes wrong",
        body: [
          "If a breach of your personal data ever happens, we notify affected users, and the relevant authority where the law requires it, within three days of finding out.",
        ],
      },
      {
        id: "who-this-is-for",
        title: "Who this is for",
        body: [
          "AppealDeck is a business tool for Amazon sellers. It is not directed at anyone under 18.",
        ],
      },
      {
        id: "contact",
        title: "Contact",
        body: [
          "Questions about privacy: email privacy@appealdeck.com.",
          "AppealDeck by Hawlton. Founder: Jhangir Hussain, individual seller based in Pakistan.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    sections: [
      {
        id: "basis",
        title: "Basis of the service",
        body: [
          "AppealDeck decodes Amazon suspension notices and drafts a Plan of Action for you to review and submit yourself. We do not log in to Seller Central. We do not submit on your behalf. We do not promise reinstatement.",
          "All content is provided as-is, without warranties of any kind. Your use of the service is at your own discretion.",
        ],
      },
      {
        id: "independence",
        title: "Independence from Amazon",
        body: [
          "AppealDeck is an independent service operated by Jhangir Hussain, trading as Hawlton, in Pakistan. It is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates. Amazon, Seller Central and related names are trademarks of Amazon.com, Inc. or its affiliates, used here only to describe the notices this software reads and the appeals it helps you draft.",
          "We never log in to Seller Central, never submit anything to Amazon for you, and have no access to your Amazon account.",
        ],
      },
      {
        id: "licence",
        title: "Licence to use",
        body: [
          "Subject to your compliance, we grant you a limited, non-exclusive, non-transferable right to use the Free decoder and, with an active Appeal Pass, the drafting features.",
          "The Free decoder is available to everyone. Appeal Pass features require a valid licence key and an eligible Amazon notice type.",
          "One Appeal Pass licence is tied to one case. It covers every revision you prepare for that case, including a response to a later reply from Amazon, with no additional charge and no expiry date. A separate notice or a different case requires its own Appeal Pass.",
        ],
      },
      {
        id: "severity-gating",
        title: "When we won't sell you a Pass",
        body: [
          "For certain case types — for example allegations involving fabricated documents, fraud, or anything touching child safety — we will not sell an Appeal Pass. We route you to professional help instead. This is a safety limit, not a judgment on your case.",
        ],
      },
      {
        id: "restriction",
        title: "What you must not do",
        body: [
          "You must not impersonate another person, fabricate evidence, or submit false information to Amazon.",
          "You must not open new seller accounts to evade a suspension. We will refuse service if we detect this.",
          "You must not rely on our drafts as your sole review. You are responsible for what you submit to Amazon.",
        ],
      },
      {
        id: "termination",
        title: "Termination",
        body: [
          "We may suspend or revoke access for violation of these terms or abuse of the service.",
          "On termination, your licence ends. Local drafts may remain in your browser until you clear it.",
        ],
      },
      {
        id: "liability",
        title: "Liability",
        body: [
          "AppealDeck is provided as-is, to the extent the law allows. We are not liable for any suspension, loss, or decision that results from using the product.",
          "Where we are found liable for anything, the total is capped at the amount you paid us for the Appeal Pass.",
        ],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        body: [
          "We may update these terms as the product changes. Material changes are posted here and, where they affect you directly, emailed to you.",
        ],
      },
      {
        id: "governing",
        title: "Governing law",
        body: [
          "These terms are governed by the laws of Pakistan. Any dispute is subject to the exclusive jurisdiction of the courts of Pakistan.",
          "AppealDeck by Hawlton. Founder: Jhangir Hussain, individual seller.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund policy",
    sections: [
      {
        id: "window",
        title: "7-day refund",
        body: [
          "You may request a refund of the Appeal Pass within 7 days of purchase, no questions asked.",
        ],
      },
      {
        id: "how",
        title: "How to request",
        body: [
          "Email billing@appealdeck.com with your receipt or licence key.",
          "We process the request within 5 business days; how long it then takes to reach your account depends on your bank.",
          "Once refunded, access to Appeal Pass features is removed.",
        ],
      },
      {
        id: "statutory",
        title: "Statutory withdrawal right",
        body: [
          "Because the Appeal Pass is a digital good delivered immediately, you waive your statutory 14-day right of withdrawal once delivery starts. This does not affect your 7-day AppealDeck refund above.",
        ],
      },
    ],
  },
  consent: {
    // Reused by the pricing PurchasePanel (D8).
    withdrawalCheckbox: {
      label:
        "I ask AppealDeck to deliver the Appeal Pass immediately and understand that I lose my statutory 14-day right of withdrawal once delivery starts. AppealDeck's voluntary 7-day refund still applies.",
    },
    deliveryNote: "You will receive a receipt and a copy of this consent by email.",
  },
  meta: {
    titlePrivacy: "Privacy — AppealDeck",
    titleTerms: "Terms — AppealDeck",
    titleRefund: "Refunds & withdrawal — AppealDeck",
    descriptionPrivacy:
      "How notice processing, optional AI, payments and encrypted case storage work in AppealDeck.",
    descriptionTerms:
      "AppealDeck decodes notices and drafts POAs for you to submit yourself. No automation, no outcome promises.",
    descriptionRefund:
      "7-day voluntary refund on the Appeal Pass. EU/UK statutory withdrawal with explicit checkout consent.",
  },
} as const;

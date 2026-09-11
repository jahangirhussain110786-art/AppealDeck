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
    privacy: "2026-09-11",
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
          "We collect only the information needed to operate the service. During decode, your notice text stays in your browser and is never uploaded.",
          "When you create an account or buy the Appeal Pass, Paddle collects the payment and billing information. We receive a licence record (email, plan, status) via a Paddle webhook.",
          "When you store evidence in the encrypted vault, the ciphertext is synced to a Supabase Storage bucket. We never hold the decryption key.",
          "Before you sign in, anything you enter in the guided interview is encrypted on your device with a key your browser holds; it does not reach our servers. When you sign in and set a passphrase, the same records are re-locked under that passphrase. Clearing your browser data before you sign in deletes that draft; there is no copy anywhere else.",
        ],
      },
      {
        id: "how-we-use",
        title: "How we use it",
        body: [
          "To recognize you across sessions, keep your licence active, and sync your encrypted vault.",
          "To send you a receipt and account-related email (billing lifecycle). We do not send marketing email by default.",
          "To draft your Plan of Action, we send your notice text and case answers to Google's Gemini paid tier only — never the free tier, which trains on submitted data. The draft is returned to you and the submitted text is deleted once your case no longer needs it.",
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
          "The case file is stored encrypted in your browser's IndexedDB vault, keyed by a passphrase you set. We cannot read it.",
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          "Notice text and case answers submitted for drafting are deleted once your case no longer needs them, or sooner if you ask.",
          "Licence records (email, plan, status) are kept for as long as needed for billing, entitlement, and accounting.",
          "Your case file and vault contents stay in your browser until you delete them — we never hold a copy.",
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
      "Local-first decoding, no-cookie analytics, Paddle billing, and encrypted vault storage. No data sold.",
    descriptionTerms:
      "AppealDeck decodes notices and drafts POAs for you to submit yourself. No automation, no outcome promises.",
    descriptionRefund:
      "7-day voluntary refund on the Appeal Pass. EU/UK statutory withdrawal with explicit checkout consent.",
  },
} as const;

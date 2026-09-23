// B-22. There was no support page, no support address and no stated response window anywhere in
// `src/` — the footer's "Support" link pointed at the privacy policy's contact anchor. Phase 4's
// launch gate asks for a response window that is "stated and operationally real", and a
// professional evaluating a tool built by one person asks who is behind it and what happens when
// it breaks before they ask anything else.
//
// Every limit below is stated because it is true, not to manage expectations: one person answers
// these, and a seller inside a short appeal window deserves to know that before they rely on it.

export const SUPPORT_EMAIL = "support@appealdeck.com";
export const BILLING_EMAIL = "billing@appealdeck.com";

export const SUPPORT = {
  eyebrow: "Support",
  title: "Who runs this, and how to reach them",
  intro:
    "AppealDeck is run by one person. That is worth knowing before you rely on it during an appeal, so this page says exactly who answers, how quickly, and what they can and cannot do.",

  operator: {
    title: "Who operates AppealDeck",
    body: "AppealDeck is an independent service operated by Jhangir Hussain, trading as Hawlton, an individual seller based in Pakistan. It is not affiliated with, endorsed by or sponsored by Amazon.com, Inc. or its affiliates.",
  },

  contact: {
    title: "Getting help",
    body: "Email {support} for anything about your case, the software or your account. For a receipt, a licence key or a refund, email {billing} — it reaches the same person, and it keeps payment questions together.",
    windowTitle: "How long a reply takes",
    window:
      "You will normally have a reply within two business days. One person answers every message, so a reply may take longer at a weekend or over a public holiday. If you have not heard back in three business days, send the message again — it is far more likely to have gone astray than to have been ignored.",
  },

  include: {
    title: "What to put in your message",
    body: "So the first reply is a useful one rather than a request for more detail.",
    items: [
      "The email address on your account, if you have one.",
      "What you were doing and what happened instead.",
      "The response type shown on your case, if your notice has been decoded.",
      "Any date shown on your case, so a deadline can be taken into account.",
    ],
    caution:
      "Do not send passwords, one-time codes or payment card details. Nobody here will ever ask you for them.",
  },

  limits: {
    title: "What support cannot do",
    body: "These are not policies that could be relaxed for an urgent case. They are things this service does not do at all.",
    items: [
      "It cannot log in to your Amazon account, submit anything on your behalf, or contact Amazon for you. You submit your response yourself.",
      "It cannot tell you whether your appeal will be accepted, and it will not estimate that for you.",
      "It cannot verify that a document is genuine. No one outside Amazon can.",
      "It cannot extend, pause or appeal an Amazon deadline. If yours is close, work to the date on your notice and do not wait on a reply here.",
      "It is not legal advice, and nothing you send here is legally privileged.",
    ],
  },

  elsewhere: {
    title: "Answered elsewhere",
    faq: "How the decoder works, what the Appeal Pass covers and how your documents are held",
    refund: "The refund policy, in full",
    privacy: "What data is held, where it goes and how to have it deleted",
    terms: "Terms of service, including where this service stops",
  },
} as const;

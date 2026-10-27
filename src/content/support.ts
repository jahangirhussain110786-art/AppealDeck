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
  /** The v5 hero (26 Sep 2026). The founder's name as he writes it; the operator paragraph below
   *  keeps the legal name used in the Terms. */
  hero: {
    title: "Write to the person who built it.",
    accent: "built it.",
    lede: "Jhangir reads and answers every message.",
    illustration: "A person at a desk, reading a reply on a laptop",
  },
  title: "The person behind AppealDeck",
  intro:
    "AppealDeck is built and run by one person, and that is a promise about your support: the person who answers knows the product in detail. This page says who replies, how quickly, and where your own judgment leads.",

  operator: {
    title: "Who operates AppealDeck",
    body: "AppealDeck is software, operated by Jhangir Hussain, trading as Hawlton, an individual seller based in Pakistan.",
  },

  contact: {
    title: "Getting help",
    // The support address is the hero's button (v5); said once, so it is one link on the page.
    body: "Write to the address above for anything about your case, the software or your account. For a receipt, a question about your Appeal Pass or a refund, email {billing} — it reaches the same person, and it keeps payment questions together.",
    windowTitle: "How long a reply takes",
    window:
      "You will normally have a reply within two business days. One person answers every message, so a weekend or a public holiday can add a day. If you have not heard back in three business days, send the message again — it is far more likely to have gone astray than to have been ignored.",
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
      "For your safety, never send passwords, one-time codes or card details. Nobody here will ever ask you for them.",
  },

  limits: {
    title: "What stays in your hands",
    body: "These are fixed boundaries, not policies that change under pressure. They keep your account, your case and the decision where they belong.",
    items: [
      "Your Amazon account stays yours. We never sign in, submit or contact Amazon for you; you send every response yourself.",
      "Our work is to make the record and the response as complete as your facts allow.",
      "A document check describes what a document shows. Whether Amazon accepts it stays Amazon's call.",
      "Amazon sets the clock. Work to the date on your notice, and do not wait on a reply here if yours is close.",
      "Preparation, not legal representation. Where a case needs legal judgement, a qualified professional leads, and nothing you send here is legally privileged.",
    ],
  },

  about: "About this service",
  // The v5 link tiles: what a seller usually wants answered before they write.
  tiles: {
    title: "Often faster than writing",
    items: [
      {
        href: "/privacy",
        title: "Where your data goes",
        body: "What we read, and what we never keep",
      },
      { href: "/refund", title: "Paying and refunds", body: "One price per case, 14-day refund" },
      { href: "/guides", title: "Guides", body: "Notice types, explained in plain words" },
    ],
  },
  elsewhere: {
    title: "Answered elsewhere",
    faq: "How the decoder works, what the Appeal Pass covers and how your documents are held",
    refund: "The refund policy, in full",
    privacy: "What data is held, where it goes and how to have it deleted",
    terms: "Terms of service, including the boundaries that keep your account yours",
  },
} as const;

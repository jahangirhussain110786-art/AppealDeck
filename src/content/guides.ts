/**
 * B-25: the four guide pages, chosen and ordered by `docs/handoffs/2026-09-25-keyword-research.md`.
 * Sellers search for their problem, never for a "decoder", so each guide answers one problem and
 * hands over to /decode at the point where general advice runs out and the notice's own words matter.
 *
 * Rules (SEO plan §4): name the policy, promise no outcome, say what AppealDeck does and does not
 * do on that case type, show a "last verified" date, and carry the not-legal-advice line. Every
 * product claim here must match `src/core` (verification routing: `routeWorkspace`; IP scope:
 * evidence and outreach, no dispute drafting). Re-verify every policy statement quarterly.
 */

export type GuideSection = { heading: string; body?: string; points?: string[] };

export type Guide = {
  slug: string;
  title: string;
  /** Short link text where the full title is too long (the decoder's guide links). */
  navLabel: string;
  metaTitle: string;
  description: string;
  lastVerified: string;
  intro: string;
  sections: GuideSection[];
  appealDeck: { heading: string; does: string[]; doesNot: string[] };
  cta: string;
};

export const GUIDES_COMMON = {
  eyebrow: "Guide",
  indexTitle: "Guides for sellers answering Amazon",
  indexIntro:
    "Plain explanations of the notices sellers search for most, written for the hour after the email arrives. Each one ends where your notice's own wording starts to matter.",
  indexMetaTitle: "Amazon seller appeal guides",
  indexDescription:
    "Plain guides to Section 3 deactivations, Plans of Action, identity verification and IP complaints on Amazon.",
  lastVerifiedLabel: "Last verified",
  ctaButton: "Paste your notice — free",
  ctaNote:
    "No account needed to decode. Nothing is sent to Amazon, and AppealDeck never touches your account.",
  appealDeckDoes: "What AppealDeck does here",
  appealDeckDoesNot: "What it does not do",
  related: "Other guides",
  disclaimer:
    "This guide is general information, not legal advice, and AppealDeck is not affiliated with Amazon. Amazon decides every appeal, and nothing here predicts how yours will go. Amazon changes its policies; check the date above.",
} as const;

export const GUIDES: Guide[] = [
  {
    slug: "section-3",
    navLabel: "Section 3 deactivation",
    title: "Your Amazon account was deactivated under Section 3. What it means and what to do",
    metaTitle: "Amazon Section 3 deactivation: what to do",
    description:
      "What a Section 3 deactivation notice actually says, why the response depends on its wording, and the mistakes that cost sellers an appeal.",
    lastVerified: "2026-09-25",
    intro:
      "Section 3 is the part of the Amazon Services Business Solutions Agreement that covers term and termination. Amazon cites it for many different problems, so the section number alone tells you very little. The rest of the notice tells you what Amazon actually wants.",
    sections: [
      {
        heading: "First, confirm the notice is real",
        body: "Deactivated sellers are a favourite target for fake Amazon emails. Open Seller Central yourself, not through a link in the message, and check your Account Health page. If the notice is not there, treat the email as suspect.",
        points: [
          "Amazon does not charge a fee to reinstate an account.",
          "Amazon does not ask for your password or a one-time code by email.",
          "Amazon does not move your case to WhatsApp, Telegram or a personal phone number.",
        ],
      },
      {
        heading: "Why the same section needs different answers",
        body: "A Section 3 notice might be about a failed identity check, a related account, a policy violation or a pattern of complaints. Each needs a different response:",
        points: [
          "A verification request needs the specific document or step it names, not an apology letter.",
          "A policy or performance problem usually needs a Plan of Action: root cause, what you fixed, and how you will prevent it.",
          "Some notices ask you to answer specific questions, and the answer is those answers.",
          "A notice that alleges forged documents or fraud needs qualified professional help before you reply.",
        ],
      },
      {
        heading: "What to do now",
        points: [
          "Read the whole notice and copy every sentence that asks for something.",
          "Note any deadline the notice states, and the date you received it.",
          "Write down what actually went wrong in your business before you write anything to Amazon.",
          "Collect only records you really hold, such as invoices from your supplier, receipts and order records.",
          "Answer through the Appeal option on your Account Health page.",
        ],
      },
      {
        heading: "What not to do",
        points: [
          "Do not open a new seller account. It is usually treated as a related account and makes the case harder.",
          "Do not send a quick one-line appeal to see what happens. A weak attempt still counts.",
          "Do not resubmit the same text after a refusal. Change what you sent, or explain what is new.",
          "Do not argue that the decision is unfair. Amazon looks for evidence that the risk is fixed.",
          "Do not give anyone your Seller Central login.",
        ],
      },
    ],
    appealDeck: {
      heading: "Where AppealDeck fits",
      does: [
        "Reads your notice and tells you which kind of response it asks for, quoting the sentence that decides it.",
        "Lists the records the case needs, including ones Amazon did not spell out, and marks which is which.",
        "Tracks the deadline the notice states and checks the message for signs of a fake.",
      ],
      doesNot: [
        "Log in to Seller Central, submit anything or contact Amazon for you.",
        "Tell you how Amazon will decide.",
        "Prepare responses to allegations of forged documents, fraud or child safety.",
      ],
    },
    cta: "Paste your Section 3 notice and see which response it actually asks for.",
  },
  {
    slug: "plan-of-action",
    navLabel: "Writing a Plan of Action",
    title: "How to write an Amazon Plan of Action, and why templates get rejected",
    metaTitle: "Amazon Plan of Action: how to write one",
    description:
      "The three parts of an Amazon Plan of Action, what belongs in each, and why a copied template is a common reason a POA is refused.",
    lastVerified: "2026-09-25",
    intro:
      "A Plan of Action (POA) is the written answer Amazon asks for when it believes something in your business went wrong. It has a well-known shape, which is why templates are everywhere. The shape is the easy part. Amazon reads for whether the content matches your notice and your records.",
    sections: [
      {
        heading: "The three parts",
        points: [
          "Root cause: the specific process or decision in your business that caused the problem. Not the complaint and not the policy, but why it happened.",
          "Corrective actions: what you have already done about it, with dates, including the affected listings, orders or stock.",
          "Preventive measures: the checks you now run so it does not happen again, who runs them and how often.",
        ],
      },
      {
        heading: "Why templates fail",
        body: "A template is written before your notice existed. The same templates circulate widely, and an answer that is not about the case in front of the reviewer is easy to spot.",
        points: [
          "It names a root cause that is not yours, so the fixes do not follow from it.",
          'It promises future actions ("we will") where Amazon wants actions already taken.',
          'It says "recently" and "soon" instead of dates.',
          "It mentions evidence you never attached, or none at all.",
          "It repeats what you sent last time, which is one of the most common reasons an appeal is refused.",
        ],
      },
      {
        heading: "Evidence that holds up",
        points: [
          "Supplier invoices for a completed purchase, dated within the last year, that match your seller name and address. Pro-forma invoices and quotes are usually refused.",
          "Records that match the notice: the ASINs, order IDs or dates it names.",
          "Only documents you really hold, unedited. Amazon can check invoices with the supplier.",
        ],
      },
      {
        heading: "Before you submit",
        points: [
          "Read the notice again and check every request in it has an answer.",
          "Check that each fix follows from the root cause you named.",
          "Cut anything that blames Amazon, a buyer or a competitor.",
          "Keep a copy of exactly what you sent, with the date.",
        ],
      },
    ],
    appealDeck: {
      heading: "Where AppealDeck fits",
      does: [
        "Starts from your notice, so the response is built around what Amazon asked, not a template.",
        "Warns about future tense, vague dates, blame and evidence you mention but did not attach.",
        "Keeps what you sent each time, and flags a resubmission that has not changed.",
      ],
      doesNot: [
        "Invent a root cause or corrective actions. Those have to be true and come from you.",
        "Submit the plan for you, or tell you how Amazon will decide.",
      ],
    },
    cta: "Paste your notice to start a Plan of Action built on what it actually asks.",
  },
  {
    slug: "identity-verification",
    navLabel: "Identity verification",
    title: "Amazon seller identity verification failed or stuck: what to check",
    metaTitle: "Amazon identity verification failed: what now",
    description:
      "Why Amazon seller identity verification fails, why a Plan of Action is the wrong answer, and what to check before you resubmit documents.",
    lastVerified: "2026-09-25",
    intro:
      "A verification request is not a policy appeal. Amazon wants to confirm who you are or that your business details are genuine. The answer is the specific document or step it names, and a Plan of Action here can slow things down.",
    sections: [
      {
        heading: "Why verification fails",
        points: [
          "The name on your ID does not match the name in Seller Central letter for letter, including middle names and spelling.",
          "The address on your proof of address does not match the address you entered.",
          "The document is expired, cropped, blurred or a photo of a screen.",
          "The bank account or card holder name differs from the account holder.",
          "The business details differ between documents.",
        ],
      },
      {
        heading: "What to check before you resubmit",
        points: [
          "Compare every field in Seller Central with your documents character by character. Fix the account or pick a document that matches.",
          "Use a full-page colour scan or PDF of the original document.",
          "If a utility bill was refused, a bank statement or government letter in the same name and address is often clearer.",
          "Upload through the verification page in Seller Central. Do not send documents in reply to an email you did not expect.",
          "If Amazon asks for a video call, prepare the original documents it names.",
        ],
      },
      {
        heading: "What not to do",
        points: [
          "Do not write an apology letter. There is nothing to apologise for, and it does not answer the request.",
          "Do not edit or recreate a document to make it match. Altered documents are a far more serious problem than a mismatch.",
          "Do not send ID documents to anyone who contacts you on WhatsApp, Telegram or a personal email.",
        ],
      },
    ],
    appealDeck: {
      heading: "Where AppealDeck fits",
      does: [
        "Recognises a verification notice and sends it down the verification route, not the Plan of Action route.",
        "Gives you a checklist of the documents and details the notice names.",
        "Can compare the details in your documents with the business details you entered, and lists where they disagree.",
      ],
      doesNot: [
        "Verify your documents or say whether Amazon will accept them.",
        "Upload anything to Amazon for you.",
      ],
    },
    cta: "Paste your verification notice to see exactly what it asks you to provide.",
  },
  {
    slug: "ip-complaint",
    navLabel: "IP complaint",
    title: "Amazon intellectual property complaint: your options and what to gather",
    metaTitle: "Amazon IP complaint: your options and evidence",
    description:
      "What an Amazon intellectual property complaint means, the ways it can be resolved, and what to gather before you respond.",
    lastVerified: "2026-09-25",
    intro:
      "An intellectual property (IP) complaint means a rights owner told Amazon one of your listings infringes their trademark, copyright or patent. Amazon usually removes the listing when the complaint arrives, before hearing from you, so the complaint alone does not mean the owner is right.",
    sections: [
      {
        heading: "The ways it usually ends",
        points: [
          "You show you are authorised to sell the item, for example with invoices from the brand or an authorised distributor.",
          "The rights owner withdraws the complaint, often after a polite, factual message.",
          "You agree the listing was a problem, remove it and explain what you changed.",
          "You dispute the claim formally. That is a legal statement with legal consequences, so get qualified advice first.",
        ],
      },
      {
        heading: "What to gather",
        points: [
          "The complaint ID, the ASINs affected and the rights owner's contact details from the notice.",
          "Invoices showing where you bought the stock.",
          "Any authorisation letter or distribution agreement you hold.",
          "Screenshots of the listing as it was, if you have them.",
        ],
      },
      {
        heading: "What not to do",
        points: [
          "Do not relist the same item under a new listing.",
          "Do not send an angry or threatening message to the rights owner.",
          "Do not ignore the complaint. Several IP complaints can put the whole account at risk.",
        ],
      },
    ],
    appealDeck: {
      heading: "Where AppealDeck fits",
      does: [
        "Pulls the complaint ID, ASINs and deadline out of your notice.",
        "Lists the evidence the case needs and keeps it with the case.",
        "Helps you write a calm, factual message to the rights owner.",
      ],
      doesNot: [
        "Draft a counter-notice or legal dispute. Those need a lawyer.",
        "Tell you whether the complaint is valid, or how Amazon will decide.",
      ],
    },
    cta: "Paste your IP complaint notice to pull out the IDs, ASINs and what it asks for.",
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

import type { Guide } from "./guides";

/**
 * Two comparison pages, in the guides' format (23 Oct 2026), for the questions a buyer who is already
 * comparing options types: "can ChatGPT write an Amazon appeal" and "an alternative to AppealsPro".
 *
 * Rules, because a comparison is where a claim most easily goes wrong:
 * - Nothing about a competitor is stated that was not read on its own site on the date shown, and each
 *   statement is attributed ("its site says"), so it ages visibly instead of becoming false quietly.
 * - No win rate, no outcome, no "Amazon detects AI". Consultants' views are labelled as theirs; no
 *   Amazon statement exists on AI-written appeals and the page says so.
 * - Where the other option is enough, the page says so. A buyer who is told that believes the rest.
 * - Every AppealDeck statement must match `docs/CURRENT-STATE.md`.
 * Re-read the competitor's site and update `lastVerified` before changing a sentence about it.
 */
export const compareGuides: Guide[] = [
  {
    slug: "chatgpt-for-amazon-appeals",
    compare: true,
    title: "Can ChatGPT write an Amazon appeal?",
    navLabel: "ChatGPT for appeals",
    metaTitle: "Can ChatGPT write an Amazon appeal?",
    description:
      "What a general chatbot does well for an Amazon appeal, what a chat has to be told, and how to use it without making your case harder.",
    lastVerified: "2026-10-23",
    intro:
      "Yes, ChatGPT, Claude and similar tools can write a letter, and for a first read of a simple notice that may be all you need. The question is what a letter on its own leaves out, because an appeal is answered on its evidence and its history, not on its wording.",
    sections: [
      {
        heading: "What a chatbot does well",
        points: [
          "Summarises a long notice into plain words.",
          "Turns your notes into a clear timeline of what happened.",
          "Translates your explanation into English.",
          "Drafts wording from facts you give it.",
        ],
      },
      {
        heading: "What a chat has to be told",
        body: "A chatbot works from what you paste into it, which shapes what it can do for an appeal.",
        points: [
          "It sees only what you paste: your Account Health page, your earlier submissions and Amazon's replies all have to go in, every time.",
          "It can restate a date, a quantity, an ASIN or a name differently from what you wrote, so check each one against your records.",
          "It holds only what you give it. Whether a supplier invoice falls inside the window, covers the quantity sold and shows the right name and address is yours to check, with both pasted.",
          "It keeps no case, and a new chat starts from nothing, so keep one written account of events across every round.",
        ],
      },
      {
        heading: "What makes an appeal weak",
        body: "Consultants who sell appeal services say the usual reasons appeals are refused are the wrong root cause, template phrases, missing evidence, and a different story each time. That is their view, from firms that sell the alternative, and we cannot check their figures. Amazon has made no public statement that AI-written appeals are rejected as such. The clearest risk is a smooth letter that is wrong in a detail, or that answers a different question from the one the notice asked.",
      },
      {
        heading: "How to get the best from a chatbot",
        points: [
          "Give it only facts you can back with a document.",
          "Keep the choice of root cause and evidence yours. You know what happened; it does not.",
          "Ask it to mark anything it is unsure of, then check every date, number, ASIN and name against your records.",
          "Keep one account of events across every attempt.",
          "Check the provider's data terms before pasting documents that carry personal or business details.",
        ],
      },
    ],
    appealDeck: {
      heading: "What AppealDeck adds",
      does: [
        "Reads the notice, lists the records it asks for, and quotes the sentence it read each from.",
        "Checks your documents against the notice on your device: dates, quantities, names and ASINs.",
        "Keeps every round and applies Amazon's reply to the same case.",
        "Prepares the response only from facts you confirmed, and refuses wording that adds or drops a date, number, name or address.",
        "Reminds you of the dates you set.",
      ],
      doesNot: [
        "Your Seller Central login stays yours: we never sign in to Seller Central or send anything to Amazon for you.",
        "The root cause stays yours. AppealDeck takes your answers and never chooses one for you.",
        "Amazon decides every case. We predict no outcome.",
        "A lawyer or consultant leads where a case needs one; AppealDeck prepares the case, and you review and submit it.",
      ],
    },
    cta: "Paste your notice and see the records it asks for, free.",
  },
  {
    slug: "appealspro-alternative",
    compare: true,
    title: "An AppealsPro alternative: how AppealDeck differs",
    navLabel: "AppealsPro alternative",
    metaTitle: "AppealsPro alternative: how AppealDeck differs",
    description:
      "How AppealDeck and AppealsPro differ on price, how each works and what each does with your case, read from both sites on 23 October 2026.",
    lastVerified: "2026-10-23",
    intro:
      "AppealsPro writes appeal letters and you subscribe to it. AppealDeck is a case tool that you pay for once per case. They overlap on reading a notice, and differ on almost everything after that. This page was written from AppealsPro's own site on the date shown; both products change, so check its site too.",
    sections: [
      {
        heading: "What AppealsPro says it does",
        body: "As read on its home page on 23 October 2026:",
        points: [
          "A free notice analysis with no sign-up, across 94 violation categories.",
          "An appeal letter generator, a response analyser for Amazon's replies, and a case history.",
          "An appeal strength score from 0 to 100.",
          "A claim that its AI learns your store from the cases you close.",
          "Pricing: a monthly plan from $79.99, with a token balance that letters, revisions and chat draw down.",
        ],
      },
      {
        heading: "Where the two differ",
        points: [
          "Price model. AppealsPro is a subscription with tokens. AppealDeck is $249 once per case, covering every round, with a $99 One Response for a single response.",
          "Documents. AppealDeck checks your supplier invoices and other records against what the notice asked, on your device. We did not find document checking described on AppealsPro's home page.",
          "A score. AppealDeck deliberately has no strength score. No score can be tied to Amazon's decision, so we show how complete your case file is and label it as that, not as a prediction.",
          "Where the case lives. AppealDeck keeps your case encrypted on your device and never logs in to your Amazon account.",
          "Facts in the letter. AppealDeck prepares the response only from facts you confirmed, and refuses wording that adds or drops a date, number, name or address.",
        ],
      },
      {
        heading: "When AppealsPro may suit you better",
        body: "If you handle many cases a month and want to generate letters for a flat monthly fee, a subscription can cost less per case than $249. If you want a quick free read of a notice, both give you one.",
      },
    ],
    appealDeck: {
      heading: "What AppealDeck does here",
      does: [
        "Decodes a pasted notice for free, with no account, quoting the sentence it read.",
        "Lists the records the notice asks for and checks yours against them on your device.",
        "Keeps every round and applies Amazon's reply to the same case.",
        "Writes only from what you confirmed.",
      ],
      doesNot: [
        "Your Seller Central login stays yours: we never sign in to Seller Central or send anything to Amazon.",
        "Amazon decides every case. AppealDeck scores nothing and predicts nothing.",
        "A lawyer or consultant leads where a case needs one; AppealDeck prepares the case, and you review and submit it.",
      ],
    },
    cta: "Paste your notice and compare the first read yourself, free.",
  },
];

/**
 * Copy for /how-we-test (G-45 and G-80, 12 Oct 2026).
 *
 * The page answers the question a careful seller, a virtual assistant or an appeal writer asks
 * before they trust a decoder: how do you know it reads a notice right? The answer leads with the
 * misses, because a tool that publishes where it was wrong is believable and one that publishes a
 * score with no denominator is not.
 *
 * Rules for this file, each there because the opposite would mislead:
 * - Every number is a count with its denominator, and is dated. Nothing is a percentage of "success".
 * - "Test" always means reading a notice or a reply: kind, requested records, stated deadline, scam
 *   signals. It never means predicting or measuring what Amazon decides.
 * - The word "accuracy" is not used about anything Amazon does. (`lint-copy` bans win rates.)
 * - No engine code, prompts or rules are published here: only synthetic notices and what the
 *   decoder is expected to read from each. Source: docs/handoffs/2026-09-29-test-notices/REPORT.md,
 *   2026-10-09-fresh-wording-routine.md and 2026-10-09-ai-pipeline-eval/README.md.
 */

export const HOW_WE_TEST = {
  metadata: {
    title: "How we test the decoder, and what the tests found",
    description:
      "How AppealDeck checks that it reads an Amazon notice the way a person would: the misses we report first, what we fixed, and the notices we test with, free to download.",
  },
  hero: {
    eyebrow: "Updated 12 Oct 2026",
    title: "How we test the decoder, and what the tests found.",
    accent: "what the tests found.",
    lede: "A decoder earns trust by showing its work. This page sets out what we test, reports the misses first, and gives you the notices we use, so you can run your own comparison.",
  },
  scope: {
    title: "What we test, and what stays with Amazon",
    items: [
      "We test whether the decoder reads a notice the way a person would: what kind of case it is, what Amazon is asking for, the deadline the notice states, the records it names, and whether the message shows signs of a scam.",
      "What Amazon decides stays with Amazon. Nothing on this page measures how often appeals succeed, and none of it says an appeal will work.",
      "Every count below carries its denominator and its date. Where we cannot give one, we say so.",
    ],
  },
  misses: {
    title: "The misses we found, and the fixes",
    intro:
      "A decoder written only against notices its author had in mind proves little, so we tested ours the harder way: notices written in Amazon's own wording, from seller forums and consultants' write-ups, after the decoder existed, and counted what it got wrong.",
    rows: [
      {
        when: "29 Sep 2026",
        what: "Twelve researched notices, one per kind of case.",
        result: "At first, 5 of 12 were read right; 7 missed.",
        detail:
          "The most common case, an authenticity complaint answered with supplier invoices, was read as unclear, with no documents listed. Documents Amazon listed on their own lines were never picked up. A product-safety deadline was missed. A numbered appeal form got one box instead of one per question. A genuine trademark notice was flagged as a possible scam. A short falsified-documents notice was refused as not an Amazon notice. Amazon's refusal of an appeal was read as a request for documents.",
        fixed:
          "All seven were fixed and each has a test that fails on the old code. After the fixes, 12 of 12 notices and the reply were read right.",
      },
      {
        when: "9 Oct 2026",
        what: "Two fresh rounds of ten notices each, in wording the decoder had not seen.",
        result: "2 to 4 misses in every ten.",
        detail:
          "The reply reader also missed four plain wordings Amazon uses. Each miss took about an hour to fix, and nobody finds them by reading the code.",
        fixed:
          "Each was fixed and pinned. A few kinds still come back as not clearly classified — tax-information, payment-method, inactivity and selling-limit notices. They are administrative, not appeals, and the decoder tells you so instead of guessing.",
      },
    ],
    closing:
      "No decoder is right on every notice it has never seen: in our fresh rounds, 2 to 4 of every 10 missed. That is why every result quotes the sentence it read, marks it in your own notice, and says so plainly when it cannot place one.",
  },
  ai: {
    title: "The part written by AI",
    body: "When the AI writes a section of a response, our own code checks it against your answers and throws it away if it adds or drops a date, a number, a name, a document or an action. We measured that on four researched cases with realistic answers (9 Oct 2026).",
    rows: [
      "Before we changed the prompt: 3 of 4 first drafts failed the check, so 7 model calls were needed for 4 drafts, and only 2 of 4 named the record Amazon had asked for.",
      "After: 3 of 4 first drafts passed, 5 calls for 4 drafts, and 4 of 4 named the record by its label.",
      "Two filler phrases still slipped through on one draft. Neither changes a fact, and we chose not to tighten the check until good drafts start failing.",
    ],
  },
  corpus: {
    title: "The notices we test with",
    body: "Thirteen notices, made up from Amazon's own wording: invented sellers, ASINs and dates, and nothing from a real seller. Each comes with what the decoder is expected to read from it. They are written for testing, and you are welcome to copy them and run your own comparison.",
    file: "/how-we-test/researched-notices.json",
    fileLabel: "Download the 13 notices (JSON)",
    fileNote: "Synthetic. Dated 29 Sep 2026. No engine code, no prompts.",
  },
  routine: {
    title: "What we do every time",
    items: [
      "Write ten notices or replies in kinds of case we do not hold yet, from real wording, with invented details.",
      "Run them through the real code, not a stand-in.",
      "Judge each result the way a seller would: wrong kind, a missing record, a missed deadline.",
      "Fix the narrowest thing, add a test that fails on the old code, and add a twin test for the same words where they must not match.",
      "Write down any miss we did not fix, and why.",
    ],
    cadence:
      "We do this each time a notice kind, a policy change or a seller report appears, and at least monthly.",
  },
  next: {
    title: "Try it on a notice in front of you.",
    body: "Free, no sign-up, and nothing is sent to Amazon.",
    cta: "Decode a notice",
  },
} as const;

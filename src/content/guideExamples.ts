import type { Guide } from "./guides";

/**
 * Four worked Plans of Action (founder decision, 7 Oct 2026: examples researched from real practice,
 * with the names, IDs and numbers changed so each reads as an example only).
 *
 * How they were made: from public practitioner guidance and example Plans of Action published by
 * seller-appeal specialists, read for what actually separates a Plan of Action that is read as
 * sincere from one read as a template: a root cause that names the exact process that failed, dates
 * and counts, finished actions in the past tense, prevention described as a process with an owner
 * and a frequency, no blame, and every claim tied to a document. The wording below is original;
 * nothing is copied from any source. Every name, ASIN, complaint ID, date and number is invented.
 *
 * These pages are for people. They are never given to the AI that drafts a seller's response:
 * showing a model an example is how an example's invented details end up in someone's appeal.
 */
export const EXAMPLES_SOURCES: readonly string[] = [
  "https://www.sellerforge.ai/blog/amazon-plan-of-action-template-examples",
  "https://www.amazonsellers.attorney/how-to-write-amazon-plan-of-action.html",
  "https://sellercandy.com/amazon-plan-of-action",
  "https://www.sellerlabs.com/knowledge-base/responding-to-ip-complaints-filed-against-your-listings/",
  "https://krolog.com/blog/amazon-reinstatement/amazon-plan-of-action-guide-2026/",
];

export const planOfActionExamples: Guide = {
  slug: "plan-of-action-examples",
  navLabel: "Plan of Action examples",
  title: "Plan of Action examples: four worked answers, and what makes them read as real",
  metaTitle: "Amazon Plan of Action examples",
  description:
    "Four worked Plan of Action examples (authenticity, item condition, late shipment, trademark) with notes on what each does well.",
  lastVerified: "2026-10-07",
  intro:
    "A Plan of Action is read quickly, by someone who has read hundreds that week. These four show how the three parts (root cause, corrective actions, preventive measures) read when they are specific, and what to notice in each. Every name, ID, date and number in them is made up. Yours has to come from your own records.",
  sections: [
    {
      heading: "How to use these",
      body: "Read one for its shape, then write yours from your facts. Do not copy the sentences: reviewers see the same templates again and again, and a Plan of Action that could belong to any seller is the one most often refused.",
      points: [
        "Each part answers one question: what went wrong in your operation, what you have already done, and what now stops it happening again.",
        "Specific beats polished. A date, a count and the name of the step that failed are worth more than a paragraph of good intentions.",
        "Say only what is true and finished as done. Anything in progress should say so.",
        "Each one lists what to attach. If you cannot attach it, do not describe it.",
      ],
    },
    {
      heading: "Example 1: an authenticity complaint",
      body: "A seller of kitchenware received six complaints that a knife set was not genuine. The brand and the product are invented.",
      example: {
        label: "Example only",
        paragraphs: [
          "Root cause. Between 3 and 21 July 2026 six customers complained that ASIN B0EXAMPLE1, a twelve-piece knife set, was not genuine. We bought these units on 28 June from a new wholesale supplier, Harbor Kitchenware Supply Co., without asking whether it was an authorized distributor of the brand. When the stock arrived we also did not compare its packaging with a unit we knew to be genuine. We had no written step for either check.",
          "Corrective actions. On 22 July we stopped selling the ASIN and removed the 140 units we still held from sale. We refunded the six orders that complained. On 24 July we asked the supplier for proof of authorization; it could not provide any, and on 30 July we ended the relationship. On 6 August we bought 240 units from the brand's own authorized distributor. The invoice is attached.",
          "Preventive measures. Before the first order with any new supplier, our purchasing lead now requests written proof of authorization from the brand or its distributor and files it with the supplier's details. On every first delivery from a supplier, the warehouse lead compares five units with a verified genuine unit and records the result. Both steps are in the written sourcing procedure attached, and the purchasing lead reviews every supplier against it each quarter.",
          "Attached: invoice dated 6 August 2026 for 240 units; the supplier's contact details; our message ending the supplier relationship; the refund record for the six orders; the written sourcing procedure.",
        ],
      },
      points: [
        "The root cause names the exact steps that were missing (an authorization check, a packaging comparison), and not only the fact that the complaints happened.",
        "Finished actions carry dates, and the numbers (140 units, six refunds, 240 units) can be checked against the attachments.",
        "The supplier is described factually. Nothing blames the supplier for the seller's own missing checks.",
        "Prevention has an owner and a frequency, and it points to a document.",
      ],
    },
    {
      heading: "Example 2: a used item sold as new",
      body: "A seller of headphones had customers receive items that had clearly been opened. The seller's returns handling was the cause.",
      example: {
        label: "Example only",
        paragraphs: [
          "Root cause. Between 9 and 26 August 2026 four customers received opened or used headphones sold as new (ASIN B0EXAMPLE2). Our returns process put customer returns back into sellable stock after a quick visual check of the outer box. It did not require anyone to open the product, so units that had been used were relisted as new.",
          "Corrective actions. On 27 August we paused sales of the ASIN. By 29 August we had inspected all 310 units in our stock and found 17 that had come back as returns and had been opened. We removed those 17 from sale and relisted them as used. We refunded the four affected orders and wrote to each customer on 28 August.",
          "Preventive measures. Since 30 August every return is opened and checked by the returns clerk, photographed, and given a condition grade before it goes anywhere. Only a unit graded as new, in sealed original packaging, returns to new stock; everything else is listed as used or removed. The clerk records each grade in the returns log, and the operations manager checks ten random logged units against stock every Friday.",
          "Attached: the returns log for August 2026; the photographs of the 17 units; the refund records; our written returns procedure.",
        ],
      },
      points: [
        "The cause is a gap in the process (no one was required to open the product), not a statement that the seller will be more careful.",
        "The count of units found (17 of 310) shows a real audit took place, and the attachments back it.",
        "It deals with the customers who were affected, in addition to fixing stock.",
        "The prevention is a procedure with a role, a log and a weekly check.",
      ],
    },
    {
      heading: "Example 3: a late shipment rate",
      body: "A seller shipping its own orders saw its late shipment rate rise above Amazon's target. The figures are invented.",
      example: {
        label: "Example only",
        paragraphs: [
          "Root cause. Our late shipment rate was 9.2 percent for the 30 days to 12 September 2026, against Amazon's target of 4 percent. In early August we moved from a one-day to a same-day handling promise on our best-selling listings to win more orders, but our carrier collection time stayed at 4 pm. Orders placed after about 1 pm could not be packed and handed over the same day, and we did not have a daily check that would have shown the backlog building.",
          "Corrective actions. On 14 September we set the handling time on all listings back to two days. We shipped the 63 orders that were waiting, each with tracking, and wrote to those customers. On 15 September we moved our four fastest-selling products to Fulfillment by Amazon so that their shipping no longer depends on our collection time.",
          "Preventive measures. A named shipping coordinator now checks unshipped orders at 12 noon and at 3 pm each working day and sends the day's backlog to the operations manager. The handling time on a listing can only be shortened by the operations manager, after comparing it with the carrier collection time. The operations manager reviews the account health page every Monday and records the late shipment rate.",
          "Attached: the carrier collection schedule; the shipping log showing the 63 orders; the account health screenshots for 12 and 19 September; our written order-handling procedure.",
        ],
      },
      points: [
        "It states the metric, the period and the target, and explains the specific change that caused the problem.",
        "The fixes address that cause (handling time, collection time, a daily check), not general service quality.",
        "It admits the decision that backfired without blaming the carrier or the customers.",
        "Attachments show the numbers, so a reviewer can verify the story.",
      ],
    },
    {
      heading: "Example 4: a trademark complaint",
      body: "A seller of phone accessories used a phone maker's name in listing titles to say what the accessory fits. The complaint came from the owner of that mark.",
      example: {
        label: "Example only",
        paragraphs: [
          "Root cause. On 2 October 2026 the rights owner filed a trademark complaint (ID C-EXAMPLE-0001) against ASIN B0EXAMPLE3, a phone case. Our title and search terms used the owner's brand name as the first words, as if the case were made or approved by that brand, rather than only saying which model it fits. Our listing process had no step to check a title for third-party brand names, and nobody reviewed a listing before it went live.",
          "Corrective actions. On 3 October we edited the title, bullets and search terms of ASIN B0EXAMPLE3 and of the two other listings with the same wording so that they name no third-party brand. On 4 October we removed the owner's brand name and logo from all product images. On 5 October we sent the rights owner one factual message, quoting the complaint ID, describing the changes and asking whether they would withdraw the complaint.",
          "Preventive measures. We now use a written listing checklist that forbids third-party brand names in titles, bullets, images and search terms, apart from a plain statement of compatibility in the description. A second person must check every new or edited listing against the checklist before it is published. Before listing a new product, our product manager searches the trademark register for the product name and records the search.",
          "Attached: screenshots of the three listings before and after the edit; the message sent to the rights owner on 5 October; the listing checklist; the register search record for our next product.",
        ],
      },
      points: [
        "It does not argue that the complaint is wrong. It states what the listing did and fixes it.",
        "The other listings with the same wording were fixed too, which shows the cause was understood.",
        "The message to the rights owner is described as one short, factual request, not an argument.",
        "Prevention has two controls (a checklist and a second reviewer) plus a check before new products.",
      ],
    },
    {
      heading: "Before you adapt one",
      points: [
        "Replace every name, ID, date and number with your own, from your own records. If you cannot, leave that detail out rather than guess.",
        "If Amazon has refused a Plan of Action already, answer the reasons it gave. Resending the same text is a common cause of repeated refusal.",
        "Attach only documents that support a claim, named so the reviewer can find them.",
        "Keep it short: about one to two pages in all, plain sentences, no flattery of Amazon and no blame of anyone else.",
        "These examples show how a Plan of Action reads. They do not predict what Amazon will do with yours.",
      ],
    },
  ],
  appealDeck: {
    heading: "What AppealDeck does with this",
    does: [
      "Asks you the plain questions behind each part (what failed, what you finished, what now prevents it) and keeps your own wording.",
      "Writes the three parts from your answers, your notice and the records you reviewed, and refuses to add any date, number, name or document you did not give.",
      "Lists the records your notice names and the ones cases like yours usually need.",
    ],
    doesNot: [
      "Use these examples to fill in your answers. Their details are made up and never reach your draft.",
      "Submit anything for you or touch your Amazon account.",
      "Predict what Amazon will decide.",
    ],
  },
  cta: "Start from your own notice: paste it and see what Amazon is asking for.",
};

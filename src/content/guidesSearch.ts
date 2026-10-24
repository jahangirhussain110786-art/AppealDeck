import type { Guide } from "./guides";

/**
 * Three more guides, chosen on 24 Oct 2026 from what people type into Google (autocomplete for
 * "amazon appeal denied", "amazon seller account suspended counterfeit", "amazon account health at
 * risk" and "performance notification"). Each answers one problem and hands over to /decode where
 * the notice's own words start to matter.
 *
 * Every policy statement is one the project had already verified (the 19 Sep mechanics research,
 * the 2 Sep policy fact-check). Where a fact came only from forum posts or practitioners the page
 * says so. No outcome is promised, no rate is quoted, and nothing says what Amazon does with an AI
 * letter. Re-verify with the other guides each quarter.
 */
export const appealDenied: Guide = {
  slug: "appeal-denied",
  navLabel: "Appeal denied",
  title: "Your Amazon appeal was denied or rejected. What to do before you write again",
  metaTitle: "Amazon appeal denied: what to do next",
  description:
    "Why an Amazon appeal gets refused, how to read the reply, and what to change before you submit again. No templates, no promises.",
  lastVerified: "2026-10-24",
  intro:
    "A refusal feels final, and it is often not. Amazon's own forum guidance says that after a rejection you address the reasons and resubmit. The difficulty is that the reply often does not say what the reasons were. This guide is about reading what you were told, and about not sending the same thing twice.",
  sections: [
    {
      heading: "First, work out what kind of reply you got",
      body: "Sellers call every negative reply a rejection, but they ask for different things:",
      points: [
        "A request for more information: Amazon names a document or an answer it still needs. Add it, do not rewrite everything.",
        "A refusal that explains why: it quotes the gap, such as a missing invoice, an unclear cause or a prevention step that is only a promise. That sentence is your brief.",
        "A refusal with no reason given: common, and the hardest. Go back to your original notice and your own submission and look for what was asked and not shown.",
        "A final decision: some replies say the account will not be reinstated or that Amazon will not respond to further appeals. Read the exact words before you decide whether anything more can be sent.",
      ],
    },
    {
      heading: "Why appeals are refused",
      body: "The reasons below are the ones practitioners and Amazon's own forum guidance describe most. None of them tells you what happened to yours.",
      points: [
        "The root cause is vague. It says what category of problem it was, not what failed in your process, when, and for how many orders.",
        "The corrective actions are plans, not finished work. Amazon's guidance asks for step-by-step detail with the ASINs and dates affected.",
        "The proof is missing or does not match. An invoice that is older than the period the notice asks about, or shows a different quantity or name, undoes an otherwise good answer.",
        "The text is generic. A letter that could belong to any seller says nothing about yours.",
        "It repeats the last attempt. Sending the same text again gives the reviewer nothing new to decide on.",
      ],
    },
    {
      heading: "What to change before you send it again",
      points: [
        "Put the notice, your last submission and Amazon's reply side by side. For each thing the notice asks for, find where your submission answered it.",
        "Quote the sentence in the reply that says what is missing, and answer that sentence directly.",
        "Add something new: a document you did not send, a corrected number, a finished action with its date. If you cannot add anything, say so plainly instead of rewording.",
        "Use the View Appeal option on your Account Health page to add information to an open appeal, as Amazon's guidance describes.",
        "Keep a dated note of every submission and what it contained, so the next one can show what changed.",
      ],
    },
    {
      heading: "What not to do",
      points: [
        "Do not resubmit the same text with a few words changed.",
        "Do not open a second seller account. Amazon's related-account rules may link it to the first.",
        "Do not pay anyone who promises a reinstatement. Amazon does not charge a fee to reinstate an account, and no outsider controls the decision.",
        "Do not argue that the decision is unfair. Show that the cause is fixed.",
      ],
    },
    {
      heading: "If funds are held, or the case reaches arbitration",
      body: "If the account stays closed, Amazon's Funds Disbursement Eligibility policy lets you ask for held funds separately, about 60 days after deactivation. Confirm the dates in your own account. The Business Solutions Agreement also sends serious disputes to arbitration. That is a legal process, and a lawyer is the right person for it, not a letter-writing tool.",
    },
  ],
  appealDeck: {
    heading: "Where AppealDeck fits",
    does: [
      "Reads Amazon's reply and shows, in plain words, which kind it is, with Amazon's own sentence quoted so you can check it.",
      "Keeps every round of your case, so you can see what each submission said and what was open at the time.",
      "Shows what changed since your last response, and warns when a new draft is the old one reworded.",
      "Suggests a different approach after two responses and another refusal.",
    ],
    doesNot: [
      "Log in to Seller Central, submit anything or contact Amazon for you.",
      "Tell you why Amazon refused when the reply does not say.",
      "Predict how Amazon will decide, or promise a different result.",
    ],
  },
  cta: "Paste Amazon's reply and see what it is actually asking for.",
};

export const inauthenticComplaint: Guide = {
  slug: "inauthentic-complaint",
  navLabel: "Authenticity complaint",
  title: "Amazon says your product is not authentic: supplier invoices Amazon accepts",
  metaTitle: "Amazon authenticity complaint: invoices needed",
  description:
    "What Amazon asks for after an inauthentic or counterfeit complaint, what makes a supplier invoice acceptable, and the mistakes that fail it.",
  lastVerified: "2026-10-24",
  intro:
    "A buyer complaint that an item was not authentic can remove a listing, or put an account at risk if complaints repeat. In most of these notices Amazon asks for one thing above all: supplier invoices or receipts that prove where the stock came from. Most refusals come from the invoice, not from the letter around it.",
  sections: [
    {
      heading: "What Amazon usually asks for",
      body: "Seller forum threads and practitioner guides describe the same request: copies of supplier invoices or receipts for the product, issued within the last 365 days. Read your own notice for its exact wording, because the period and the items can differ.",
    },
    {
      heading: "What makes an invoice hold up",
      points: [
        "It is dated within the period the notice names, usually the last 365 days.",
        "It shows the supplier's business name, physical address and a way to contact them. A supplier Amazon cannot trace is a reason to refuse it.",
        "Its line items can be matched to the ASIN in the complaint: the product name, model or SKU.",
        "The quantity fits what you sold. An invoice for twenty units does not support three hundred sales in the same period.",
        "It records a completed purchase. Practitioners report that quotes, pro-forma invoices and order confirmations do not count.",
        "It is the original document, not a screenshot or an edited copy. Altering a document turns a documents problem into a fraud problem.",
      ],
    },
    {
      heading: "If you cannot get a proper invoice",
      body: "If a supplier will not issue one, or the stock came through a chain that cannot be documented, do not fill the gap with something made up. Say what you have and what you cannot get. Amazon may decide that the listing should not be sold, and it is better to know that than to send a document that does not stand up. If the notice alleges forged documents, get qualified professional help before replying.",
    },
    {
      heading: "What not to do",
      points: [
        "Do not send an invoice you made, edited or reconstructed.",
        "Do not send receipts from a retail store when the notice asks for a supplier's invoice.",
        "Do not send invoices for a different product because they are the only ones you have.",
        "Do not rely on a letter to carry a weak document. The invoice is the answer.",
      ],
    },
  ],
  appealDeck: {
    heading: "Where AppealDeck fits",
    does: [
      "Reads your notice and lists the records it asks for, including ones Amazon did not spell out, and marks which is which.",
      "Checks an invoice on your device against the points above: date, supplier details, the ASIN and the quantities. It marks what it cannot read as not checked, not as passed.",
      "Adds up your invoices against the units you say you sold, and says whether they cover the total.",
    ],
    doesNot: [
      "Verify that a supplier is genuine or that an invoice is real.",
      "Log in to Seller Central, submit anything or contact Amazon for you.",
      "Predict whether Amazon will accept your documents.",
      "Prepare a reply to a complaint that alleges forged documents.",
    ],
  },
  cta: "Paste your authenticity notice and see which records it needs.",
};

export const accountAtRisk: Guide = {
  slug: "account-at-risk",
  navLabel: "Account at risk",
  title: "“Your account is at risk of deactivation”: what the notice means",
  metaTitle: "Amazon account at risk of deactivation",
  description:
    "What an Amazon account-health warning such as a high Order Defect Rate means, what counts toward it, and how to answer it before it becomes a suspension.",
  lastVerified: "2026-10-24",
  intro:
    "An at-risk notice is a warning, not a deactivation. It names a performance measure, such as your Order Defect Rate, that is over Amazon's target. It is the cheapest moment to act, because you are answering a metric, not a suspension.",
  sections: [
    {
      heading: "What the notice is telling you",
      body: "The notices sellers post show the same shape: a named measure, your current figure, and the target. For the Order Defect Rate, Amazon's target for seller-fulfilled orders is under one percent. The measure counts negative feedback, A-to-Z Guarantee claims and credit card chargebacks, over a recent window that sellers and Amazon's pages describe as 60 days. Check the figure and window in your own Account Health page, because Amazon changes them.",
    },
    {
      heading: "Why a small seller can cross it with one order",
      body: "The rate is a percentage of orders. With few orders, a single complaint can move it past the target. Forum posts from small sellers describe exactly this. The notice does not care how large you are, so the answer has to show what happened and what you changed.",
    },
    {
      heading: "What to do now",
      points: [
        "Open Account Health and find which orders count toward the measure. Note each order, the reason and the date.",
        "Work out the real cause for each: a shipping delay, a listing that set the wrong expectation, a damaged item, a slow reply.",
        "Fix what you can before you write: correct the listing, change the packaging, change the carrier or handling time.",
        "Where a negative review or claim is wrong, use the removal or dispute route Amazon gives for it, and keep a dated record.",
        "If the page offers an appeal or action plan, answer it with the cause, the finished fixes with dates, and what now prevents a repeat.",
      ],
    },
    {
      heading: "What not to do",
      points: [
        "Do not ignore it because the account still works. The warning exists because the next step is a suspension.",
        "Do not describe plans as if they were done. Amazon's guidance asks for finished corrective actions.",
        "Do not blame customers. Show what you changed.",
      ],
    },
  ],
  appealDeck: {
    heading: "Where AppealDeck fits",
    does: [
      "Reads the notice, names the measure and the response it asks for, and shows the deadline if the notice states one.",
      "Helps you gather the records for each affected order and write the cause, the finished fixes and the prevention in your own facts.",
      "Keeps a dated record of what you sent and what changed.",
    ],
    doesNot: [
      "Log in to Seller Central, submit anything or contact Amazon for you.",
      "Remove or dispute reviews and claims for you.",
      "Tell you how Amazon will decide.",
    ],
  },
  cta: "Paste your account-health warning and see what it asks for.",
};

export const searchGuides: Guide[] = [appealDenied, inauthenticComplaint, accountAtRisk];

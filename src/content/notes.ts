import { SCOPE } from "./scope";

/**
 * Notes (2 Nov 2026): short, practical pieces that sit beside the guides.
 *
 * The guides explain a kind of notice. A note covers one habit that applies whatever the notice
 * says, and stays short enough to read in the minute a seller actually has. Notes are dated and
 * revisited; a note that outgrows its subject becomes a guide instead, so nothing here repeats a
 * guide's job. Every sentence has to be something the seller can do today, with no claim about
 * what Amazon will decide.
 */

export type NoteSection = {
  heading: string;
  body?: string;
  points?: string[];
};

export type Note = {
  slug: string;
  title: string;
  /** Short link text for breadcrumbs and related lists. */
  navLabel: string;
  metaTitle: string;
  description: string;
  published: string;
  updated: string;
  intro: string;
  sections: NoteSection[];
  /** One line to remember the note by, set apart from the sections. */
  takeaway: string;
  /** Slugs of other notes, and of guides worth reading next. Both are checked against the lists. */
  relatedNotes?: string[];
  relatedGuides?: string[];
};

export const NOTES_COMMON = {
  eyebrow: "Notes",
  indexTitle: "Short notes for the work before an appeal",
  indexIntro:
    "One habit per note, for the part of an appeal that no policy page covers: saving the notice, answering what Amazon asked, and keeping the trail. Free to read, no account.",
  indexMetaTitle: "Working notes for Amazon sellers",
  indexDescription:
    "Short notes on the parts of an appeal no policy page covers: saving the notice, answering a questionnaire and keeping the trail.",
  publishedLabel: "Published",
  updatedLabel: "Updated",
  takeawayLabel: "In short",
  ctaLead: "Have the notice in front of you? Paste it and see what it asks for.",
  ctaButton: "Paste your notice — free",
  ctaNote:
    "The decoder reads the notice on our server and keeps no copy. Nothing is sent to Amazon.",
  relatedLabel: "More reading",
  relatedNotesLabel: "Other notes",
  relatedGuidesLabel: "Guides on each kind of notice",
  allNotes: "All notes",
  allGuides: "All guides",
  /** Shown at the foot of the index so a reader knows where the longer explanations live. */
  guidesLead: "Each kind of notice has a longer guide.",
  /** Shown at the foot of the guides index, pointing the other way. */
  fromGuides: "Short, practical notes on keeping a case in order live in Notes.",
  fromGuidesLink: "Read the notes",
  disclaimer: SCOPE.note,
} as const;

export const NOTES: Note[] = [
  {
    slug: "keep-the-notice-as-it-arrived",
    navLabel: "Keep the notice as it arrived",
    title: "Keep the notice exactly as it arrived",
    metaTitle: "Keep your Amazon notice as it arrived",
    description:
      "Save the whole notice, with its date and sender, before anything is tidied or deleted. Later steps are measured against those exact words.",
    published: "2026-11-02",
    updated: "2026-11-02",
    intro:
      "The notice is the case. It carries the date deadlines are counted from, the sentence that says what Amazon wants, and the account it names. Saving it whole takes a minute now; rebuilding it later takes a day.",
    sections: [
      {
        heading: "Save the email, not a summary",
        body: "Download the message or save it as a PDF while it is still in the inbox. Keep the subject line, the sender's address and the date it arrived. A screenshot of the middle of an email loses the header, which is where a fake notice is easiest to spot.",
      },
      {
        heading: "If the notice is only in Seller Central",
        body: "Some notices appear as a banner or a card in Account Health and nowhere else. Save the page as a PDF, and take a clear photograph of the banner with the date visible on screen. If the save fails, copy the text into a document rather than retyping it.",
      },
      {
        heading: "Do not tidy the wording",
        points: [
          "Paste the notice as it was sent. Correcting the grammar or shortening it changes the sentence a reviewer compares with your answer.",
          "Keep Amazon's own heading, even when it reads like boilerplate: the heading is often the plainest statement of the kind of case.",
          "Write down the date the notice states, beside the date it reached you. A deadline is counted from the notice, not from the day you opened it.",
        ],
      },
      {
        heading: "What you are keeping it for",
        body: "When Amazon replies, the next step is decided against the notice: which document it asked for, which question it asked, what it said would happen by when. The answer you write will be read the same way, beside the same words.",
      },
    ],
    takeaway:
      "Save the whole message with its date and sender. Every later step is measured against it.",
    relatedGuides: ["section-3", "appeal-denied"],
  },
  {
    slug: "answering-a-questionnaire",
    navLabel: "Answering a questionnaire",
    title: "When Amazon sends a questionnaire, answer each question",
    metaTitle: "Answering an Amazon questionnaire",
    description:
      "A numbered list of questions wants one answer each, in the same order. A Plan of Action pasted into the first box leaves the rest unanswered.",
    published: "2026-11-02",
    updated: "2026-11-02",
    intro:
      "Some notices arrive as a list of numbered questions instead of a paragraph. Each one is a separate request, and a single long answer in the first box leaves the rest of the list unanswered.",
    sections: [
      {
        heading: "Take the questions one at a time",
        body: "Number your answer the way the notice numbers its questions, and reply in the same order. A reviewer checking a list of five is looking for five answers, not a letter that covers some of them.",
      },
      {
        heading: "Answer with what you can show",
        points: [
          "When a question asks for a document, attach the document and say in one line what it is.",
          "When it asks for a quantity or a date, give the figure from your records and name the record it comes from.",
          "When a question does not apply to you, say so plainly and explain why, rather than leaving the box empty.",
        ],
      },
      {
        heading: "Do not turn it into a Plan of Action",
        body: "A questionnaire is not the place for root cause, corrective actions and preventive measures unless a question asks for them. Read each question literally. A page of background that answers none of them reads as an attempt to fill space.",
      },
      {
        heading: "Keep the order when you send",
        body: "If the notice arrives as a form with a box per question, answer in the matching box and keep a copy of the whole page before you submit. If it is one box, keep your numbering so the reviewer can follow it.",
      },
    ],
    takeaway: "One question, one answer, in the notice's own order.",
    relatedNotes: ["keep-the-notice-as-it-arrived"],
    relatedGuides: ["plan-of-action", "appeal-denied"],
  },
  {
    slug: "what-to-keep-after-you-submit",
    navLabel: "What to keep after you submit",
    title: "What to keep after you submit an appeal",
    metaTitle: "What to keep after an appeal",
    description:
      "The notice, what you sent, every reply and the dates: a short folder that makes the next round specific instead of starting again.",
    published: "2026-11-02",
    updated: "2026-11-02",
    intro:
      "A reply is often about the next round, not this one. What you keep after sending decides whether the next answer can be specific or has to start from nothing.",
    sections: [
      {
        heading: "Keep exactly what you sent",
        body: "Save the text and every attachment in one folder, with the date and time you submitted. If Amazon later says something was missing, you can check whether it was.",
      },
      {
        heading: "Keep every reply as it arrived",
        points: [
          "Each reply belongs to a round and says what changed. The wording of a refusal is the brief for the next answer.",
          "Save the message itself, not notes about it. Paraphrasing loses the sentence that decides the next step.",
        ],
      },
      {
        heading: "Keep the documents behind the answer",
        body: "The invoice, receipt or photograph you attached should stay where you can reach it, in the form you sent. If a supplier issues a corrected document, keep both, with the date each was sent.",
      },
      {
        heading: "Keep the dates in one place",
        body: "Four entries do the work: the date on the notice, the date you sent your answer, the date Amazon replied, and any date Amazon named. When a deadline is running, that list is the only thing you need to look at.",
      },
    ],
    takeaway:
      "One folder per case: the notice, what you sent, every reply, the documents and the dates.",
    relatedNotes: ["keep-the-notice-as-it-arrived"],
    relatedGuides: ["appeal-denied", "section-3"],
  },
];

export function noteBySlug(slug: string): Note | undefined {
  return NOTES.find((n) => n.slug === slug);
}

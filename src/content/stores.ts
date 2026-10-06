/**
 * Strings for situations the guidance was not originally written for: another Amazon store, a
 * seller who disagrees with a finding, a case that has ended, a date that has passed.
 *
 * Same rules as the rest of `src/content`: state what is true of the seller's own case, claim
 * nothing about what Amazon will decide, and never imply a lawyer's or consultant's work.
 */
export const STORES = {
  /**
   * Shown wherever the route reason is shown, for a store other than Amazon US. The decode kind,
   * the response type and the records are the same; only the surroundings may differ.
   */
  nonUsNotice:
    "Amazon US is the store this guidance is written for. Your store's Seller Central, contact addresses and deadlines may differ. Check your own notice and Account Health.",

  /** A framing line placed first in a response written by a seller who disagrees with the finding. */
  disputeFraming: "This response contests the finding and explains why.",

  /** Past a notice's own date. No outcome claim: Amazon decides. */
  pastDeadlineNextStep:
    "You can still try: open the appeal in Account Health if the button is there, and contact Seller Support in the same case. Amazon decides.",

  /** Reply reading says Amazon has reinstated the account. */
  replyReinstated: "Amazon says the account is reinstated. Record the outcome.",
  /** An older reply, once a later one has been added: only the newest can be acted on. */
  replySuperseded: "Superseded by a later reply",
  /** Reply reading says the decision is final. */
  replyFinal: "Amazon says this decision is final. Record the outcome.",
  /** Dashboard row line once the seller has recorded how the case ended. */
  outcomeLine: {
    reinstated: "You recorded this case as reinstated or approved.",
    rejected: "You recorded this case as rejected or denied.",
    withdrawn: "You recorded this case as withdrawn.",
  },
  /** Dashboard row line when an unread reply reads as reinstatement. */
  recordOutcome: "Amazon replied. If your account is back, record the outcome.",

  /** Offered beside the sentence above so a mistaken reading never dead-ends the case. */
  replyStartAnyway: "Start a new round anyway",

  /** Gap shown when a reply faults the plan itself, not only the records. */
  rootCauseFaulted:
    "Amazon says the root cause is missing or not enough. Revise “What went wrong?”, “What have you fixed already?” and “How will you stop it happening again?”.",

  /** History line for a response sent outside this product that the seller only wants to track. */
  markedSentWaiting: "Marked as sent to Amazon outside this product. Waiting for a reply.",

  /** Hint under the corrective sections when nothing needed correcting. */
  nothingToCorrectHint:
    "If nothing needed correcting, say so and say why, for example: “Nothing needed correcting because the linked account is a family member's and we do not share a device or payment method.”",
  /** Hint for the one record a related-account or wrong-claim case can answer in words. */
  relationshipHint:
    "No file is needed for this record. Say in your own words how the accounts are or are not related, or why the claim is wrong, and keep it factual.",

  /**
   * The D6 latch. A case held for qualified help stays held when the words that triggered it are
   * edited out, because the notice Amazon sent still says what it said. The one way out is to say the
   * notice pasted was the wrong one and give the right one.
   */
  d6Release: {
    why: "Amazon's notice accuses the account of fabricated documents, fraud or a child-safety matter. We do not prepare responses to these, and editing the notice text here does not change what Amazon sent.",
    title: "Was this the wrong notice?",
    body: "If you pasted the wrong notice, paste the right one below. It has to be a different notice, not this one with words removed. If the new one carries an allegation too, the case is held again.",
    action: "Replace with the correct notice",
    tooShort: "Paste the whole notice. It is too short to read.",
    sameNotice:
      "This is mostly the same text as the notice that held the case. Paste the notice Amazon actually sent you. Taking words out of this one does not release the case.",
    history: "You replaced a notice that held this case for qualified help with a different one.",
    done: "Notice replaced. Check how we read it.",
  },

  /** Round-starting actions are refused while an outcome is recorded; the outcome is not lost silently. */
  outcomeBlocksRound:
    "You recorded an outcome for this case. Take the outcome back before starting another round, so the record does not say the case ended while you are still working on it.",
  /** The /case page for a case with a recorded outcome. */
  outcomeRecorded: {
    reinstated: "You recorded this case as reinstated or approved. Nothing is due.",
    rejected: "You recorded this case as rejected or denied. Nothing is due on it.",
    withdrawn: "You recorded this case as withdrawn. Nothing is due on it.",
    takeBack: "Take the outcome back",
    note: "This is your own record; AppealDeck does not check with Amazon.",
  },
  /** Offered when saving is refused because another tab changed the case. */
  copyUnsaved: "Copy my unsaved text",
  copiedUnsaved: "Copied. Paste it somewhere safe, then reload.",

  /** Dashboard next-step lines for a case that cannot be answered here. */
  nextStep: {
    information: "Nothing to send for this notice. Keep it with the case.",
    clarification: "Add what the response page asks for.",
    verification: "Work through the verification checklist.",
    dispute: "Organize your facts for qualified review.",
    specialist: "This case needs qualified help.",
  },
} as const;

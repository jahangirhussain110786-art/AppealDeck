export const WORKSPACE = {
  title: "Your case workspace",
  subtitle: "One case. Every record, response and reply.",
  privacy:
    "Your work is saved in this browser’s encrypted vault. Documents stay on this device. Preparing a response sends the notice, confirmed facts and document references to AppealDeck; it does not upload the original files or send anything to Amazon.",
  local: "Saved on this device",
  loading: "Opening your case…",
  tabs: { overview: "Overview", evidence: "Evidence", response: "Response", history: "History" },
  status: {
    needed: "Needs review",
    waiting: "Waiting for information",
    reviewed: "Reviewed by you",
    // A-02/A-03. Named for what the seller told us, not for a judgement about them: the product
    // does not decide whether a record is obtainable, and a seller in this state has done
    // something honest, not failed at something.
    cannot_obtain: "You cannot obtain this",
  },
  routeIntro: "Start with the actual request",
  routeHelp: "Add your notice, check the current request, then confirm your route.",
  notice: "Amazon notice",
  form: "Current response instructions",
  reviewNotice: "Review the request",
  confirmRoute: "Confirm this route",
  allRequirements:
    "I checked the notice and response page, and this list covers all requested records.",
  sourceHelp: "Use the exact sentence from your saved notice or response instructions.",
  manualReview:
    "Review the original file and record what it supports. This is your factual review, not document authentication. Automatic text extraction is not available yet.",
  submitConfirm:
    "I have submitted this exact response and its selected files through the official channel.",
  finalReview:
    "I reviewed the facts, attachment names and page references against the current response form.",
  // A-07 (classified 23 Sep 2026, built from founder feedback 12 Sep 2026): the completeness badge
  // answers "is every required record here", which a thin, blame-shifting draft can satisfy while
  // reading terribly. This second line is about the writing only. It describes the draft in front
  // of the seller and never characterises what Amazon will do with it — same constraint as
  // READINESS_COPY, and the reason none of these strings contains a likelihood.
  draftStrength: {
    label: "The writing itself",
    strong: "Nothing flagged in how this draft reads.",
    needs_work:
      "Parts of this draft need work. The notes below are about the writing, not your records.",
    weak: "This draft is thin. Work through the notes below before you copy it.",
  },
  waitingHelp: "Ask the issuer for the missing records. Continue other tasks while you wait.",
  // A-05/A-06/A-02, wired 23 Sep 2026. All three existed in `src/core` and were reachable by no
  // seller. Each string below describes the record or the seller's own choice, and none of them
  // says anything about what Amazon will decide.
  guidance: {
    why: "Why Amazon asks for this",
    fields: "What a record like this has to show",
    disqualifiers: "What will not be accepted",
    letters: "Ask for it",
  },
  // A-01, EF-2's attestation. The wording follows the spec's: it confirms the work is genuinely
  // done, and it says plainly that AppealDeck cannot and does not verify any of it — because a
  // seller could otherwise read the tick as the product having checked something.
  attestation: {
    label:
      "I confirm each corrective action described above is genuinely complete, as written. AppealDeck cannot and does not verify this.",
    recorded: "Confirmed by you on {date}. Editing this section clears the confirmation.",
  },
  cannotObtain: {
    trigger: "I cannot obtain this record",
    title: "You cannot obtain this record",
    help: "Say why in your own words. The response states it as you write it, and does not claim a record you do not have.",
    reasonLabel: "Why can you not obtain it?",
    reasonPlaceholder: "For example: the supplier has closed and no longer issues invoices…",
    alternatives: "What you can do instead",
    consequence: "What this costs you",
    choose: "Choose this path",
    chosen: "Chosen",
    confirm: "Record that you cannot obtain this",
    reopen: "I can obtain it after all",
    recorded:
      "Recorded. Your response names this record as missing, in your words. The draft stays a working draft while evidence is missing.",
  },
  // B-03. Until 23 Sep 2026 a reply reset every requirement, so the seller redid the whole
  // evidence review each round. This is what they now see before confirming. Each line describes
  // a state of their own case and says nothing about how Amazon will treat the next response.
  replyDelta: {
    title: "What this reply changes",
    help: "Your earlier work is kept. Review this, then start the revision.",
    none: "This reply does not name any records. Read it and check the response page yourself.",
    reopened: {
      label: "Asked for again",
      help: "You marked this reviewed and this reply asks for it again. Your file stays linked.",
    },
    added: { label: "New in this reply", help: "This case did not have this record before." },
    outstanding: { label: "Still on your list", help: "Not reviewed yet. Nothing has changed." },
    carried: {
      label: "Kept as reviewed",
      help: "This reply does not mention it. Your review, note and linked file are unchanged.",
    },
  },
  legacy:
    "Your existing interview and records are preserved. You can continue that interview or add the new workspace to this case.",
  unsupported:
    "You can organize and export your case notes. Self-serve response preparation is unavailable for this route; no purchase is needed for these notes.",
  /**
   * #91. Neutral wording throughout: a seller who already appealed and was refused is often
   * embarrassed about it, and nothing here should read as a reprimand. It also never claims what
   * a further attempt will achieve — only what Amazon's own behaviour makes likelier, which the
   * research supports and D6 permits.
   */
  priorAttemptsTitle: "Have you already responded to this notice?",
  priorAttemptsLead:
    "Most sellers find us after answering once or twice on their own. Telling us changes what we check, so nothing here repeats what was already refused.",
  priorAttemptsWhy: "Why this matters",
  priorAttemptsWhyBody:
    "Sending the same wording again is one of the clearest reasons a response is refused a second time. If we can see what you already sent, we can tell you when a draft is too close to it.",
  priorAttemptsEffect:
    "Counted as an earlier attempt. Your next response will be compared against what you sent, and flagged if it is close to it.",
  priorAttemptDateLabel: "When did you send it? (optional)",
  priorAttemptTextLabel: "What did you send? (optional)",
  priorAttemptTextPlaceholder: "Paste what you sent, if you still have it…",
  priorAttemptTextHelp:
    "If you no longer have the wording, leave this empty. The attempt still counts; there is then nothing for us to compare against.",
  priorAttemptSave: "Record this response",
  priorAttemptAddFirst: "Yes, I already responded",
  priorAttemptAddAnother: "Add another response",
  priorAttemptNoDate: "Date not recorded",
  priorAttemptNoText: "Wording not kept",
  /**
   * #86. A notice naming two things is refused for whichever one the response missed, and the
   * seller usually never learns which. Naming both, with the sentence that raised each, is the
   * whole fix — the product does not write the answer, it makes the second issue impossible to
   * overlook.
   */
  issuesTitle: "This notice raises more than one issue",
  issuesLead:
    "Each one is judged separately. A response that covers one and not the other is refused for the one it missed.",
  issuesSourceLabel: "Where we read that",
  issuesConfirm: "My response addresses every issue listed above.",
  saved: "Changes saved",
  error: "Could not save these changes. Your previously saved case is preserved. Try again.",
} as const;

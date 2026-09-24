export const WORKSPACE = {
  title: "Your case workspace",
  subtitle: "One case. Every record, response and reply.",
  // 24 Sep 2026 (ChatGPT audit §9). Said "Documents stay on this device" without exception, while a
  // document check sends that one file to be read. Every sentence here now matches what leaves the
  // browser, and `legalDisclosures.test.ts` pins it alongside the privacy policy.
  privacy:
    "Your work is saved in this browser’s encrypted vault, and your files stay on this device. Two things leave it only when you ask: a business document you ask us to check, and a section you ask us to improve the wording of. Each is sent to be read, and no copy is kept. Preparing a response sends the notice, confirmed facts and document references to AppealDeck — never the original files — and nothing is ever sent to Amazon.",
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
  sourceLabel: "Where this came from (optional)",
  sourceHelp:
    "Paste the exact sentence if your notice or response page asks for this record. Leave it empty if you know the case needs it and Amazon did not say so — it will be recorded as yours, not theirs.",
  manualReview:
    "Review the original file and record what it supports. This is your factual review, not document authentication. With an Appeal Pass you can also ask us to check a business document against what Amazon asked for; identity and bank documents are checked on this device only.",
  check: {
    unnamed:
      "This record is not one of the document types we know how to check, so we have not read it. Review it yourself and note what it shows. Your file is unchanged and stayed on this device.",
  },
  submitConfirm:
    "I have submitted this exact response and its selected files through the official channel.",
  questionnaire: {
    intro:
      "Answer each question Amazon asked, in its own box. Your answers are laid out under Amazon's own questions, in the same order.",
    additional: "Anything else Amazon should know (optional)",
  },
  submitConfirmChanged:
    "I have submitted the text above and its selected files through the official channel.",
  recordTitle: "Record what you sent",
  whatWasSent: "What you sent",
  sentAsShown: "I sent the response exactly as prepared here.",
  sentChanged: "I changed it before sending, or sent different wording.",
  sentTextLabel: "Paste the text you actually sent",
  openItemsTitle: "Still open on this case",
  openItemsNote:
    "You can still record what you sent. These items are kept with the record so it shows what was unresolved at the time.",
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
  // B-04, reduced (24 Sep 2026). Shown after two responses have been sent and Amazon has replied
  // again without reinstating. Amazon publishes no escalation order: the routes below are the ones
  // its own seller forums and appeal consultants describe, checked on the date given, and the copy
  // says so rather than presenting them as Amazon's procedure. Nothing here predicts an outcome.
  changeOfApproach: {
    title: "Two responses have not resolved this. Change the approach, not only the words.",
    intro:
      "Sending a third version of the same response is the most common reason appeals keep being refused. Before you send again, work through these in order.",
    steps: [
      {
        title: "Find the one thing Amazon's latest reply objects to",
        body: "Read the reply for the specific record, fact or explanation it says is missing, and answer that first. Send something Amazon has not already seen: a new document, a corrected fact, or a change you have made since. The response page warns you when a new draft repeats an earlier one.",
      },
      {
        title: "Ask Account Health Support what was missing",
        body: "From the Account Health page in Seller Central, use Contact Us to request a call back. Ask what specifically was insufficient. Write down the date, the name you were given and what was said, and add it to this case's notes.",
      },
      {
        title: "Escalate in writing, and only with your strongest response",
        body: "Appeal consultants describe writing to seller-performance@amazon.com with your case ID and your revised response, and, as a last internal step, to jeff@amazon.com, which reaches Amazon's executive seller relations team. Decisions from that team are usually treated as final, so send it only when your response is complete and says something new.",
      },
      {
        title: "Know when to bring in someone else",
        body: "An experienced appeal consultant can review what you have sent. If your case is heading towards arbitration, a demand letter or court, you need a lawyer: AppealDeck does not help with those, and nothing you tell it is legally privileged.",
      },
    ],
    sourcesNote:
      "Amazon does not publish an escalation order. These routes are described in Amazon's own seller forums and by appeal consultants, checked 24 Sep 2026. Channels change; if one no longer works, move to the next.",
    sources: [
      {
        label: "Amazon Seller Forums: contacting Account Health Support",
        href: "https://sellercentral.amazon.com/seller-forums/discussions/t/fdc4e327-c6e3-4386-a902-684a20bebc86",
      },
      {
        label: "Webretailer: using suspension escalations",
        href: "https://www.webretailer.com/amazon/amazon-suspension-escalations/",
      },
      {
        label: "ecommerceChris: escalating when Seller Performance fails",
        href: "https://www.ecommercechris.com/amazon-seller-escalation/",
      },
    ],
  },
  // B-08, reduced: a count only. No Amazon limit is claimed, because none is read from Amazon's form.
  charCount: "{count} characters",
  // 24 Sep 2026, founder-approved: opt-in wording help, one section at a time. Every string says
  // that the text stays the seller's, and none of them says the result will work better with Amazon.
  improveWording: {
    action: "Improve the wording",
    working: "Suggesting clearer wording…",
    sendsNote:
      "Sends this section to Google Gemini for a suggestion. Nothing changes unless you choose it.",
    tooShort: "Write a few sentences first. Wording help can only improve what you have written.",
    yours: "Your wording",
    suggested: "Suggested wording",
    check:
      "Read it before you use it. It must say what you mean and nothing more: it becomes your response.",
    use: "Use the suggested wording",
    keep: "Keep mine",
    unchanged: "Your wording is already clear. There is nothing to change.",
    factChanged:
      "We could not improve this section without changing a fact, so nothing was changed. Your wording is kept.",
    attestationNote:
      "Using it clears your confirmation above, so you can confirm the new wording after reading it.",
    needsPass: "Wording help comes with the Appeal Pass for this case.",
    signIn: "Sign in to use wording help.",
    unavailable: "Wording help is not available right now. Your wording is unchanged.",
    tooMany: "You have asked for a lot of suggestions today. Try again tomorrow.",
  },
  // 24 Sep 2026. When a notice states no date we send the seller to Account Health, and until now
  // they found the date there and had nowhere to put it. The copy says the date is theirs.
  sellerDeadline: {
    label: "The response date Amazon shows you in Account Health",
    help: "If your notice does not give a date, Account Health usually does. Enter it here and the case, the dashboard and your reminders count down to it.",
    save: "Save this date",
    saved: "Saved the response date you entered: {date}.",
    entered: "You entered this date from Account Health.",
    remove: "Remove the date I entered",
    removed: "Removed the response date you entered.",
    past: "That date has already passed. Check Account Health again before saving it.",
  },
  // G, 24 Sep 2026: the facts every document is compared with. The description says why in one
  // sentence, because a seller asked for their address without a reason is right to hesitate.
  caseFacts: {
    title: "Your business details",
    description:
      "Amazon compares your invoices with your seller account and may contact your suppliers. Enter these once, exactly as they appear in Seller Central, and each document check compares them too — so a mismatch is found here first.",
    businessName: "Business name, exactly as registered on your seller account",
    businessAddress: "Registered business address, exactly as on your seller account",
    suppliers: "Your suppliers (one per line, as each names itself)",
    suppliersHelp: "List every supplier whose invoices you are using. Several is normal.",
    save: "Save business details",
    saved: "Updated your business details.",
    privacy:
      "Saved in your encrypted vault. Sent with a document check only, to compare with that document — never to Google Gemini.",
  },
  // A-05/A-06/A-02, wired 23 Sep 2026. All three existed in `src/core` and were reachable by no
  // seller. Each string below describes the record or the seller's own choice, and none of them
  // says anything about what Amazon will decide.
  // B-06. A seller — and more to the point, an appeal writer — will sometimes disagree with what
  // the decoder read, and a tool an expert cannot correct is a tool an expert cannot use. The copy
  // says what changes, because the correction is not cosmetic: it moves the guidance, the records
  // we raise, and whether the case is routed to professional help.
  kindOverride: {
    title: "Is this the right issue?",
    help: "We read your notice as the issue below. If that is wrong, change it. Nothing you have already reviewed is removed.",
    label: "The issue on this notice",
    apply: "Use this issue instead",
    applied: "Issue changed to {kind}. Records this issue usually needs have been added.",
    effect:
      "This changes what we explain about each record and which records we raise. It does not delete anything.",
  },
  // B-05. A record we raised must never look like one Amazon named. This label is the whole of
  // that promise on screen, so it says who raised it and stops.
  inferred: {
    badge: "We added this",
    help: "Your notice does not name this record. Cases like yours are usually refused without it. Remove it if it does not apply.",
  },
  sellerAdded: {
    badge: "You added this",
    help: "Neither your notice nor our records named this one. It stays on your plan and is never described as something Amazon asked for.",
  },
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

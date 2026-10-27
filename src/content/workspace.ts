import { TONE_COPY } from "@/core/answerNudges";
export const WORKSPACE = {
  title: "Your case workspace",
  round: "Round {n}",
  // How we read a reply. Our reading, never presented as Amazon's words (25 Sep 2026).
  replyReading: {
    title: "What this reply says",
    reasons: "What Amazon says was wrong, in its own words",
    note: "This is our reading of the wording. Read the reply itself before you act on it.",
    // 8 Oct 2026. Sellers on Amazon’s own forums report refusals that say only that the information
    // was not enough. Shown for that category only, folded, so a reply that does name a reason is
    // not buried. The steps are practitioner guidance and say so; none of them predicts an outcome.
    unclear: {
      summary: "If the reply does not say what was missing, work through this first.",
      items: [
        "Read your notice again and check that every question or request in it has its own answer.",
        "Check each document: is it the one Amazon named, complete, readable, and from the period it asked about?",
        "Check that your root cause names a specific cause in your business, not only the symptom Amazon reported.",
        "Send something real that is new: a document, a corrected fact, or something you have since done.",
        "From the Account Health page, use Contact Us and ask what specifically was insufficient.",
      ],
      note: "This comes from guidance by appeal consultants and from Amazon’s seller forums, not from Amazon.",
    },
    categories: {
      needs_more_information:
        "Amazon asks for a better answer or more information before it decides again.",
      document_request: "Amazon is asking for documents before it decides.",
      identity_verification: "Amazon wants you to verify your identity or business details.",
      final_decision_negative:
        "Amazon says this decision is final. Read the whole reply before deciding what to do next.",
      reinstated: "Amazon says the account is reinstated. Check Account Health to confirm it.",
      funds_decision: "This reply is about your funds.",
      unrecognized: "This reply does not match a kind we can name. Read it in full.",
    },
  },
  // A saved, unread Amazon reply outranks every other next step (25 Sep 2026).
  replyPending: {
    title: "Amazon replied. Read what it changes",
    body: "Your case is unchanged so far. The reply is in History with what it asks for again, what is new, and what you can keep. Start the next round from there.",
    cta: "Read Amazon's reply",
  },
  subtitle: "One case. Every record, response and reply.",
  // The Documents tab (29 Sep 2026): one card open at a time, the reason in view, the rest folded.
  documents: {
    title: "Documents Amazon wants",
    // G-63: said here, where the files are gathered, as well as on the copy step. "Some Amazon
    // notices say" because the origin of the rule is a notice's own wording, not a policy we cite.
    lead: "Add each file and say what it shows. Your files stay with you; you attach them on the response page in Seller Central, not in a Seller Support case: some notices say case attachments are not reviewed.",
    // When the notice itself says to email documents to an Amazon address (a funds request does).
    leadEmail:
      "Add each file and say what it shows. Your files stay with you until you send the email. Your notice says to send the request by email to {email}: attach these files to that email, from the address on your seller account.",
    seeNotice: "See your notice",
    addOther: "Amazon asked for something else? Add it",
    addLabel: "Document name",
    addPlaceholder: "For example: supplier invoice",
    addButton: "Add document",
    allListed: "I checked the notice and the appeal page. Amazon asked for nothing else.",
    open: "Open",
    close: "Close",
    toggle: "{label}: show or hide",
    noteLabel: "What does this file show? Note anything missing.",
    notePlaceholder: "For example: page 1 shows the supplier, the date and 40 units of B0EXAMPLE1.",
    pageLabel: "Page",
    checked: "I checked the file, the page number and my note.",
    save: "Save document",
    saveWhyFile: "Add the file to save.",
    saveWhyNote: "Say what the file shows to save.",
    saveWhyPage: "Enter the page number to save.",
    saveWhyTick: "Tick the box above to save.",
    stateInWords: "State it in words (no file)",
    missing: "I don't have it",
    waiting: "I'm waiting for it",
    draftRequest: "Draft a request",
    requestTitle: "Request to the record issuer",
    requestNote: "Add the recipient and send it yourself; you keep control of every message.",
    copyRequest: "Copy request draft",
    standards: "What a good {label} shows",
    standardsPlural: "What good {label} show",
    howToCheck: "How to check this file",
    originalUnchanged: "Your original file is never changed.",
    correct: "It doesn't apply, or Amazon asked for it differently",
    correctLabel: "Amazon's exact words for this document",
    correctButton: "Update and check it again",
    removeLabel: "Why does Amazon no longer need this?",
    removeNote:
      "Removing it keeps the file and anything you already sent. Tick the list again afterwards.",
    removeButton: "Remove from my list",
    linkExisting: "Use a file already in this case",
    changeLinked: "Change linked file",
    linkLabel: "Link an existing file from this case",
    chooseFile: "Choose a file",
    readOriginal: "Read original",
    replaceFile: "Replace this file",
    recordedOn: "Recorded {date}. Change it any time.",
  },
  responseSheet: { eyebrow: "Your response", beforeSend: "Before you send" },
  // The way on at the foot of each view (29 Sep 2026): the tabs alone never said what came next.
  steps: {
    toOverview: "Back to overview",
    toDocuments: "Back to documents",
    toAnswers: "Next: write your answers",
    toVerify: "Next: see what to prepare",
    progress: "Documents ready: {done} of {n}.",
    allReady: "Every document is ready.",
    later: "You can write your answers now and add the rest later.",
    finish:
      "Read it, then copy it into Amazon's appeal page and attach your files. Come back and record what you sent.",
    attachFromEmail:
      "Download the linked files from Documents and attach them to your email to {email}, sent from your seller-account address. Copying is preparation; record the submission once you have sent it.",
    attachFrom:
      "Download the linked files from Documents and attach each on the response page in Seller Central, not in a Seller Support case. Copying is preparation; record the submission once you have sent it.",
  },
  // The Response tab (29 Sep 2026): plain questions, a one-line hint, and an example in every box.
  // 10 Oct 2026: the root-cause coach. Appeal writers advise naming one failure point, so the copy
  // attributes the advice to them and does not say what Amazon will think.
  // 20 Oct 2026: what a written answer says about its own tone, found in a live session where the
  // seller wrote that the rights owner was a bully and that she would sue. Advice is attributed to
  // appeal writers, never to Amazon, and says nothing about the outcome.
  tone: TONE_COPY,
  coach: {
    summary: "Not sure what to write? Answer five short questions.",
    intro:
      "Answer in your own words. We put your answers together and add nothing, so every fact in it is yours.",
    optional: "(optional)",
    example: "For example:",
    use: "Put my answers in the box",
    addBelow: "Add my answers below what I wrote",
    after: "Read it afterwards and fix the wording. Your answers are saved as you type.",
    manyTitle: "This reads like more than one cause.",
    manyBody:
      "Appeal writers advise naming one failure point, not a list of factors. Pick the one that broke first. Put the rest under “What have you fixed already?” and “How will you stop it happening again?”",
    manyFound: "We noticed: {words}.",
    specificsBody:
      "No date, number or order is in this answer yet. Add the product or order and when it happened, so it is about this case.",
  },
  responseFields: {
    operationalTitle: "What happened. What changed.",
    briefTitle: "Your response brief",
    lead: "Short, true and specific. We use your words, not ours.",
    rootCause: "What went wrong?",
    rootCauseHint: "Say what caused it and name the product. Keep the focus on your own process.",
    rootCausePlaceholder:
      "For example: We listed returned items as new. Nobody checked returns before they went back on sale.",
    corrective: "What have you fixed already?",
    correctiveHint: "Say what is finished and what is still in progress, with dates.",
    correctivePlaceholder:
      "For example: Finished: we removed all 12 listings on 20 Sep. In progress: checking the rest of our stock, done by 5 Oct.",
    prevention: "How will you stop it happening again?",
    preventionHint: "Who does what, and how often.",
    preventionPlaceholder:
      "For example: Our warehouse lead checks every return before it goes back on sale. We check a sample every Friday.",
    explanation: "Your explanation, in your own words",
    explanationPlaceholder:
      "For example: The invoice is from our supplier Harbor Goods and covers the 40 units of B0EXAMPLE1 we sold.",
    // B9: a one-line hint and a visible example under the boxes. A placeholder vanishes the moment
    // a seller types, which is exactly when a thin answer needs the example most.
    answerHint: "Name the supplier, what the document shows, and the dates.",
    exampleLabel: "For example:",
    answerPlaceholder: "Answer in your own words, with dates and numbers where you have them.",
    // 9 Oct 2026. The hint and example under the explanation were written for an invoice and shown
    // on every document case, so a funds hold or a safety request was told to name a supplier.
    // Each is guidance on what to say, and an example of the shape, never a claim about the case.
    byKind: {
      FUNDS: {
        hint: "Say what the records show about your business and your bank account, with dates.",
        example:
          "For example: The attached statement shows the business account in my name. The payout report lists the orders the held balance comes from.",
      },
      PRODUCT_SAFETY: {
        hint: "Name the product, the test or standard the report covers, and the report date.",
        example:
          "For example: The attached test report covers B0EXAMPLE1, is dated 2 Sep 2026, and tests it to the standard the notice names.",
      },
      INTELLECTUAL_PROPERTY: {
        hint: "Say where the product came from or what permission you hold, with dates.",
        example:
          "For example: We bought these 40 units from our supplier Harbor Goods on 5 Aug 2026. The attached invoice shows it.",
      },
      // 20 Oct 2026: the IP hint and example were written for a brand complaint (a distributor and an
      // invoice) and were shown on a copyright notice about a seller's own design, and on a patent one.
      "INTELLECTUAL_PROPERTY:copyright": {
        hint: "Say who made the design and when, or what licence covers it, and where the licence allows selling products.",
        example:
          "For example: I drew the paw design myself in March 2026. The attached notebook page shows my first sketch, dated 4 March.",
      },
      "INTELLECTUAL_PROPERTY:patent": {
        hint: "Say who made the product and when you bought it, or why it does not copy the design, with dates.",
        example:
          "For example: We bought 800 of these stands from the manufacturer, Brightway Metal Products, on 14 June 2026. The attached invoice shows it.",
      },
      RELATED_ACCOUNT: {
        hint: "Cover three things. How the other account is connected to you, or that it is not. Why a device, address or bank account is shared. What you did so the accounts are no longer linked. Give dates.",
        example:
          "For example: The other account belonged to a former business partner, who left on 30 Apr 2025. We shared an office, which explains the shared address. That company and its account were closed on 22 May 2025; the attached records show it.",
      },
      RESTRICTED_PRODUCT: {
        hint: "Say what you did with the listing and what approval you hold, with dates.",
        example:
          "For example: We removed the listing on 20 Sep 2026. The attached approval covers the category from 1 Jan 2026.",
      },
    } as Record<string, { hint: string; example: string }>,
    // 19 Oct 2026: the three Plan of Action boxes showed the same returns example for every case, so
    // an authenticity or performance appeal was shown a sentence about something else. Shape only,
    // never a claim about the case; a kind with no entry keeps the general example above.
    poaByKind: {
      INAUTHENTIC: {
        rootCause:
          "For example: We bought 120 units of B0EXAMPLE1 from our supplier Harbor Goods on 14 Aug 2026 and did not keep the brand's authorization letter with the invoice, so we could not show where the stock came from.",
        corrective:
          "For example: Finished: on 15 Oct 2026 we got the brand's authorization letter for Harbor Goods and attach it with invoice HG-2088. In progress: checking every unit left in stock against the packing list, done by 22 Oct.",
        prevention:
          "For example: Before we list a new supplier's stock, the owner files the invoice and the brand's letter together. We match invoiced quantities to our sales report every month.",
      },
      PERFORMANCE_METRIC: {
        rootCause:
          "For example: Our only packer was on leave in the last week of September with no cover, and 21 of 248 orders missed the handling cut-off.",
        corrective:
          "For example: Finished: on 10 Oct 2026 we hired a second packer and moved the shipping cut-off from 3pm to 1pm. In progress: syncing stock every 10 minutes, done by 15 Oct.",
        prevention:
          "For example: Our warehouse lead checks the open-order count at 11am and 2pm every day and tells the owner if more than 40 orders are waiting. The owner reviews the rates every Monday.",
      },
      INTELLECTUAL_PROPERTY: {
        rootCause:
          "For example: We list B0EXAMPLE1, which we buy from an authorized distributor, Harbor Goods. The rights owner may not have known our supply route, and we had not sent Amazon the distributor's invoice.",
        corrective:
          "For example: Finished: on 16 Oct 2026 we got the brand's letter naming Harbor Goods as its distributor and attach it with invoice HG-2088. Finished: on 17 Oct we wrote to the rights owner asking them to review it.",
        prevention:
          "For example: We only buy branded goods from distributors the brand names, and we ask for the authorization letter before the first purchase. The owner keeps the letter with each invoice.",
      },
      LISTING: {
        rootCause:
          "For example: A staff member copied a competitor's bullet points into the detail page of B0EXAMPLE1 without checking them against our own product.",
        corrective:
          "For example: Finished: on 12 Oct 2026 we rewrote the detail page of B0EXAMPLE1 and removed the claim Amazon named. In progress: checking our other 30 listings, done by 25 Oct.",
        prevention:
          "For example: A second person reads every new or edited listing against the product before it goes live. We review the full catalogue for policy wording each quarter.",
      },
    } as Record<string, { rootCause: string; corrective: string; prevention: string }>,
    // For the boxes under Amazon’s own questions: the question decides the content, so the example
    // is only the shape of a good answer.
    questionHint: "Answer this question directly, with dates and numbers where you have them.",
    // 19 Oct 2026: every box showed the same late-shipment example, including under "Who is the
    // beneficial owner?". A question that matches a topic gets a hint and a shape that fit it; any
    // other gets the general hint and no example. Shape only, never a claim about the case.
    questionTopics: [
      {
        pattern: /business model|how you source|sourcing|where (?:do )?you (?:buy|source)/i,
        hint: "Say what you sell, where you buy it and from whom. Name each supplier.",
        example:
          "For example: We sell kitchen tools. We buy from two US distributors, Harbor Goods and Summit Supply, and keep every invoice.",
        // 19 Oct 2026: shown under the box once something is written that does not carry what the
        // question needs. A reminder, never a block and never a prediction about the answer.
        needs:
          /\b(?:from|supplier|distributor|manufactur\w+|wholesale\w*|bought|purchas\w+|source[ds]?)\b/i,
        nudge: "Add where you buy the products and from whom.",
      },
      {
        pattern: /other (?:amazon )?(?:seller )?accounts|ever operated|multiple accounts/i,
        hint: "Answer yes or no first. If yes, name each account and say what happened to it.",
        example: "For example: No. This is the only Amazon seller account I have operated.",
        needs: /\b(?:yes|no|never|only|none)\b/i,
        nudge: "Start with yes or no, so the answer cannot be misread.",
      },
      {
        pattern:
          /source of (?:the )?inventory|where did (?:you|the) .{0,30}(?:buy|come from)|inventory for ASIN/i,
        hint: "Name the supplier, the purchase date and quantity, and which invoice shows it.",
        example:
          "For example: We bought 120 units from Harbor Goods on 14 Aug 2026. Invoice HG-2088 shows the quantity.",
        needs: /\b(?:invoice|purchase order|PO|order)\b|\b\d{1,2} \w+ 20\d\d\b|#?\b\d{4,}\b/i,
        nudge: "Add the supplier, the purchase date and the invoice or order number.",
      },
      {
        pattern: /beneficial owner|who owns|ownership/i,
        hint: "Give the full legal name of each owner and their share, as on your registration.",
        example: "For example: Jane Smith, sole owner, as shown on our registration.",
        needs: /\b\d{1,3}\s?(?:%|percent)|\b(?:sole|only|single)\s+owner\b/i,
        nudge:
          "Add each owner's full legal name and ownership share, or say who the sole owner is.",
      },
    ] as Array<{
      pattern: RegExp;
      hint: string;
      example: string;
      needs: RegExp;
      nudge: string;
    }>,
    additionalPlaceholder:
      "Only if something important is not covered by the questions above. Leave it empty otherwise.",
    save: "Save my answers",
    sendNote:
      "Needs an Appeal Pass for this case. Your answers and file names go to AppealDeck; your files stay in your vault. Nothing is sent to Amazon.",
    signIn: "Sign in to prepare your response",
    // G-30: the price is on the screen where the seller decides, not only on the overview.
    guestPrice: "Then $249 once for this case. Everything above stays free.",
  },
  // The v5 overview (26 Sep 2026): next step, checklist, timeline.
  overview: {
    nextStep: "Next step",
    // B2: the price is said at the start, not met at the last step. Free is everything but the
    // prepared response.
    priceNote:
      "Free: understand the notice, gather documents, write your answers. Pay once, only if you want us to prepare the response.",
    checklist: "Checklist",
    deadlines: "Deadlines",
    done: "{done} of {total} done",
    noFile: "No file linked yet",
    confirmTitle: "Check how we read your notice",
    confirmBody: "It takes a minute. Then we list the documents to gather.",
    // An empty case has nothing to check yet, so the first step is the paste itself (24 Oct 2026).
    startTitle: "Paste your notice",
    startBody:
      "Paste Amazon's message in the box below. We read it and show what Amazon asks for before you write anything.",
    startCta: "Go to the notice box",
    reviewBody: "Add the file and note what it shows. If you can't get it, say so there.",
    toDocuments: "Go to your documents",
    toResponse: "Go to your response",
    verifyTitle: "Get ready to verify your identity",
    verifyBody:
      "Amazon wants to check who runs this account. There is nothing to write. See what to have ready before the call or upload.",
    verifyCta: "See what to prepare",
    source: {
      notice: "Named in your notice",
      matrix: "Usually asked for in cases like this",
      seller: "Added by you",
    },
    issuesRow: "Every issue in the notice answered",
    issuesCount: "{n} issues",
    responseRow: "Write and check your response",
    responseSent: "Sent",
    responseDraft: "In progress",
    responseEmpty: "Not started",
    characters: "{n} characters",
    doneLabel: "Done",
    timeline: {
      title: "Timeline",
      replyAgain: "Amazon replied?",
      replied: "Amazon replied",
      sent: "You sent response {n}",
      prior: "A response you sent before this case",
      started: "Case started",
      noDeadline: "Check your current notice for its date; none is recorded here yet.",
    },
    files: "{n} files in this case",
    oneFile: "1 file in this case",
    noFiles: "No files yet",
    openVault: "Open vault",
    allCases: "All cases",
  },
  // 24 Sep 2026 (ChatGPT audit §9). Said "Documents stay on this device" without exception, while a
  // document check sends that one file to be read. Every sentence here now matches what leaves the
  // browser, and `legalDisclosures.test.ts` pins it alongside the privacy policy.
  privacy:
    "Your work is saved in this browser’s encrypted vault, and your files stay on this device. If you are not signed in, it is kept only until you close this tab; sign in to keep it. Some things leave it only when you ask: a business document you ask us to check, a section you ask us to improve the wording of, an email reminder, an encrypted cloud backup, or an anonymous outcome. Each is sent to be read, and no copy is kept; the one exception is a business document checked while you are not signed in, or one too large to send, which is read on this device and is not uploaded. Preparing a response sends the notice, confirmed facts and document references to AppealDeck — never the original files — and nothing is ever sent to Amazon.",
  local: "Saved in this browser",
  // B1: the first-time seller does not know a guest case lives in one tab. Said where it is saved.
  guestWarning: {
    text: "Your work stays in this tab. Closing the tab clears it, so sign in to keep it.",
    signIn: "Sign in",
  },
  loading: "Opening your case…",
  // "Documents", not "Evidence" (29 Sep 2026): the word sellers use. The ids stay, so old links work.
  tabs: { overview: "Overview", evidence: "Documents", response: "Response", history: "History" },
  status: {
    needed: "Needs review",
    waiting: "Waiting for information",
    reviewed: "Reviewed by you",
    // A-02/A-03. Named for what the seller told us, not for a judgement about them: the product
    // does not decide whether a record is obtainable, and a seller in this state has done
    // something honest, not failed at something.
    cannot_obtain: "You reported it unavailable",
  },
  routeIntro: "Start with your notice",
  routeHelp: "Paste Amazon's message. We read it and show what Amazon wants.",
  notice: "Amazon notice",
  form: "What the response page asks for (optional)",
  formHelp:
    "In Account Health, open the notice and click Appeal. If that page lists documents or questions, paste them here. Leave out passwords and payment details.",
  decodedHelp: "Check it. You can change anything later. Nothing is sent to Amazon.",
  reviewNotice: "Check what Amazon wants",
  confirmRoute: "Yes, this is right",
  // The first case screen (29 Sep 2026): the answer first, the controls one tap away.
  request: {
    decodedTitle: "Here is what we read",
    summaryLabel: "What we read from your notice",
    problem: "The problem",
    store: "Amazon store",
    wants: "What Amazon wants",
    wantsWithDocs: "{route} and {n} documents",
    wantsWithDoc: "{route} and 1 document",
    agree: "Do you agree with Amazon?",
    notClear: "Not clear yet",
    readAs: "We read this as: {kind}. Is that right?",
    alsoIn: "Also in this notice: {kinds}. A response has to answer each.",
    // 9 Oct 2026: a second reading, offered when the rules could not place the notice. A proposal.
    secondReading: {
      lead: "A closer reading suggests this is: {kind}.",
      from: "It says",
      use: "Use this reading",
    },
    useOtherStore: "This is from another store",
    stores: { US: "Amazon US", other: "Another store, or not sure" },
    positions: {
      unsure: "Not sure yet",
      accept: "Yes, it happened",
      dispute: "No, I disagree",
    },
    change: "Something wrong? Change it",
    seeNotice: "See or change your notice",
    savedFromDecode: "Saved from Decode",
    unsavedEdits: "Unsaved notice edits",
    characters: "{n} characters",
    whyRoute: "Why this?",
    tooShort: "Paste the whole notice first. It needs at least 30 characters.",
    saveLater: "Save for later",
  },
  sourceLabel: "Amazon's words, if it asked for this (optional)",
  sourceHelp:
    "Paste Amazon's exact sentence. If Amazon did not name it but the case needs it, leave this empty: it is recorded as yours, not as Amazon's.",
  manualReview:
    "Open the original and note what it shows. This is your own check, not a test of whether the document is genuine. With an Appeal Pass we can also check a business document against what Amazon asked for, using AI. Without one, the check reads it on this device, without AI. Identity, bank and proof-of-address documents are checked on this device only.",
  check: {
    unnamed:
      "This record is outside the document types we check, so review it yourself and note what it shows. Your file is unchanged and stayed on this device.",
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
    "I reviewed the facts, attachment names and page references against the response page in Seller Central.",
  // A-07 (classified 23 Sep 2026, built from founder feedback 12 Sep 2026): the completeness badge
  // answers "is every required record here", which a thin, blame-shifting draft can satisfy while
  // reading terribly. This second line is about the writing only. It describes the draft in front
  // of the seller and never characterises what Amazon will do with it — same constraint as
  // READINESS_COPY, and the reason none of these strings contains a likelihood.
  draftStrength: {
    label: "The writing itself",
    strong: "Nothing flagged in how this draft reads.",
    needs_work:
      "Parts of this draft can be stronger. The notes below are about the writing, not your records.",
    weak: "This draft is still thin. The notes below show where to strengthen it.",
  },
  // A3: an earlier response is recorded with no wording. "Looks like what you already sent" would
  // say something we cannot know, so the alert says what we cannot do and what to do about it.
  // 10 Oct 2026: what is different from the response the seller last recorded. It describes their own
  // case (the wording, the documents, the open items) and never says what Amazon will make of it.
  // P-10, 10 Oct 2026: the upload-ready pack. Built on the device; says what it did and what it did
  // not, and claims nothing about how Amazon will treat the files.
  pack: {
    button: "Download upload-ready pack",
    building: "Building the pack…",
    help: "A zip of the files you reviewed, numbered and named by what they answer, each under 5 MB where we can make it so, with an index page. Built on this device. You still upload the files to Amazon yourself.",
    none: "Reviewed files go in the pack. Add a file to a record on Documents and mark it reviewed.",
    ready: "Pack ready: {n} files.",
    reduced: "{n} re-saved smaller.",
    over: "{n} still over 5 MB: see For your records inside the pack.",
    failed: "Could not build the pack. Your case and files are unchanged.",
  },
  changes: {
    nothingTitle: "Nothing has changed since your last response",
    nothingBody:
      "The wording, the documents and the open items are the same as when you recorded it on {date}. Sending it again unchanged is sometimes right, for example when nobody has answered. If Amazon has replied, add what is new first: a document you now hold, an action you have since finished, or a fact you left out.",
    littleTitle: "Very little has changed since your last response",
    littleBody:
      "Compared with the response you recorded on {date}, the wording is almost the same and nothing in it adds a new date, number, name or document. Check that the sentences below say something Amazon has not already seen.",
    newOrReworded: "New or reworded",
    changedTitle: "What has changed since your last response",
    changedIntro: "Compared with the response you recorded on {date}.",
    priorTitle: "Your earlier attempt was made before AppealDeck",
    priorBody:
      "The comparison starts with this response. Change something Amazon has not already seen: a document you now hold or an action you have since finished.",
    newSentences: "New in this response",
    moreSentences: "and {n} more",
    sameWording:
      "The wording is almost the same as before. What is different is in the documents or the open items below.",
    documentsAdded: "Documents added since then",
    documentsRemoved: "Documents no longer attached",
    resolved: "Open then, finished now",
    stillOpen: "Still open from last time",
    documentsUnknown:
      "That attempt's files were not recorded, so this comparison covers the wording only.",
  },
  novelty: {
    cannotCompareTitle: "The earlier text was not recorded",
    cannotCompareBody:
      "Change something before you send, so the next attempt carries something new.",
  },
  waitingHelp: "Ask for it, then carry on with the other steps while you wait.",
  // B-04, reduced (24 Sep 2026). Shown after two responses have been sent and Amazon has replied
  // again without reinstating. Amazon publishes no escalation order: the routes below are the ones
  // its own seller forums and appeal consultants describe, checked on the date given, and the copy
  // says so rather than presenting them as Amazon's procedure. Nothing here predicts an outcome.
  changeOfApproach: {
    title: "Two responses in, the next step is a change of approach.",
    intro:
      "The next attempt needs something new in it. Work through these in order before you send again.",
    steps: [
      {
        title: "Find the one thing Amazon's latest reply objects to",
        body: "Read the reply for the specific record, fact or explanation it says is missing, and answer that first. Send something Amazon has not already seen: a new document, a corrected fact, or a change you have made since. The response page warns you when a new draft repeats an earlier one.",
      },
      {
        title: "Ask Account Health Support what was missing",
        body: "From the Account Health page in Seller Central, use Contact Us. Some sellers report that a call-back request through Contact Us gets an answer on what was missing; others report it does not. Try it if it is offered, and ask what specifically was insufficient. Write down the date, the name you were given and what was said, and add it to this case's notes.",
      },
      {
        title: "Escalate in writing, and only with your strongest response",
        body: "Appeal consultants describe writing to seller-performance@amazon.com with your case ID and your revised response, and, as a last step, to jeff@amazon.com. Consultants say these addresses are read, but Amazon publishes no escalation address and says nothing about whether they are answered. Send it only when your response is complete and says something new.",
      },
      {
        title: "Know when to bring in someone else",
        body: "An experienced appeal consultant can review what you have sent. If your case is heading towards arbitration, a demand letter or court, it needs a lawyer: AppealDeck works on the case record, and nothing you tell it is legally privileged.",
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
      "Sends this section to an AI service for a suggestion. Nothing changes unless you choose it.",
    tooShort: "Write a few sentences first. Wording help can only improve what you have written.",
    yours: "Your wording",
    suggested: "Suggested wording",
    check: "Check it against your records before you use it.",
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
    busy: "The AI service is busy right now. Try again in a minute. Your wording is unchanged.",
    tooMany: "You have asked for a lot of suggestions today. Try again tomorrow.",
  },
  // 24 Sep 2026. When a notice states no date we send the seller to Account Health, and until now
  // they found the date there and had nowhere to put it. The copy says the date is theirs.
  // B4, 6 Oct 2026: the count beside a stated date, only once it is under a week away.
  deadlineCount: {
    days: "{n} days left",
    tomorrow: "tomorrow",
    today: "today",
    passed: "the date has passed",
  },
  sellerDeadline: {
    label: "Your reply-by date",
    // When the date already came from the notice: the seller is being asked to check it, not to
    // supply a missing one.
    labelFromNotice: "Does Amazon's page show a different date? Enter it here.",
    help: "Find it in Account Health. We count down to it everywhere, including email reminders once you sign in.",
    save: "Save date",
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
    closed: "Optional. We compare them with your invoices.",
    description:
      "Type them once, exactly as in Seller Central. Amazon compares invoices with your account and may call your suppliers; each document check does too.",
    businessName: "Business name, exactly as registered on your seller account",
    businessAddress: "Registered business address, exactly as on your seller account",
    suppliers: "Your suppliers (one per line, as each names itself)",
    suppliersHelp: "List every supplier whose invoices you are using. Several is normal.",
    // 10 Oct 2026: for invoice cases. One number the seller states; we add up their checked invoices.
    unitsSold: "Units you sold of the products in the notice, in the 365 days before it",
    unitsSoldHelp:
      "Invoice cases only. From Seller Central, Business Reports. We add up your checked invoices against it.",
    coverageTitle: "Your invoices against what you sold",
    save: "Save business details",
    saved: "Updated your business details.",
    privacy:
      "Saved in your encrypted vault. Sent to AppealDeck's server with a document check, and with the response and checkout steps, to compare and to prepare the response. Never sent to an AI provider and not kept.",
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
    open: "Change the issue",
    applied: "Issue changed to {kind}. Records this issue usually needs have been added.",
    effect:
      "This changes what we explain about each record and which records we raise. It does not delete anything.",
  },
  // B-05. A record we raised must never look like one Amazon named. This label is the whole of
  // that promise on screen, so it says who raised it and stops.
  inferred: {
    badge: "We added this",
    help: "Your notice does not name this record, though cases like yours usually need it. Remove it if it does not apply.",
  },
  sellerAdded: {
    badge: "You added this",
    help: "Neither your notice nor our records named this one. It stays on your plan, labelled as yours.",
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
      "I confirm every action I describe as done above is really done. AppealDeck records this confirmation rather than verifying it.",
    recorded: "Confirmed by you on {date}. Editing this section clears the confirmation.",
  },
  cannotObtain: {
    trigger: "I can't get it",
    title: "This record is not available",
    help: "Say why in your own words. The response states it as you write it, and does not claim a record you do not have.",
    reasonLabel: "Why is it not available?",
    reasonPlaceholder: "For example: the supplier has closed and no longer issues invoices…",
    alternatives: "What you can do instead",
    consequence: "What this means for the response",
    choose: "Choose this path",
    chosen: "Chosen",
    confirm: "Record that this record is not available",
    reopen: "I can obtain it after all",
    recorded:
      "Recorded. Your response names this record as missing, in your words. The draft stays a working draft until the evidence is complete.",
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
  // B10: the Response tab before any notice is saved. Names the one thing to do, in the order a
  // first-time seller will do it.
  noNoticeYet: {
    title: "Start with your notice",
    body: "Paste your notice on the Overview tab first. Then this page will ask you the right questions.",
  },
  // 7 Oct 2026: the AI writes the Plan of Action's three narrative sections.
  // G-95: a plain sentence under the three record names a seller has to decode. Display only: the
  // labels themselves are keys (reply matching, the AI prompt, the letters) and are not renamed.
  recordGloss: {
    rights_owner_retraction: "A letter from the brand owner withdrawing their complaint.",
    account_resolution_proof: "Proof that the other account is closed or has been transferred.",
    sourcing_doc: "Where you bought it from, such as a purchase order or a shipping record.",
  } as Partial<Record<string, string>>,
  // G-60: the seller's own name for a case. Stays in the encrypted vault and the seller's own
  // exports; never in the index that goes to Amazon.
  caseLabel: {
    label: "Name this case (optional)",
    placeholder: "A client or store, for example Acme UK",
    help: "Only you see it. It names the case in your list, tab and exports, never in what you send to Amazon.",
    saved: "Saved the case name.",
  },
  // G-35 and G-64: a visible stamp on the prepared response. It says what the check did, never that
  // Amazon accepts or detects anything.
  stamp: {
    title: "Your facts, checked",
    ai: "The AI suggested the wording; our code checked it. Every date, number, name and action comes from your answers, notice and records. A draft that added anything was thrown away.",
    own: "Built from your own wording. Every date, number and name in it comes from your answers, your notice and your records.",
    phrases: "Template phrases found: {n}",
    phrasesNone: "Template phrases found: none",
  },
  aiDraft: {
    written:
      "The root cause, corrective actions and preventive measures were written by AI from your answers, notice and reviewed records. It may use only what you told it. Check every fact before you copy.",
    showingOwn: "This is your own wording, put in order. The AI draft is one tap away.",
    useOwn: "Use my own wording",
    useAi: "Use the AI draft",
    fallback: {
      fact_check_failed:
        "Our check found details you did not give in the AI draft, so this draft is built from your own wording.",
      not_configured:
        "AI drafting is switched off right now. This draft is built from your own wording.",
      daily_limit:
        "You have used today's AI drafts. This draft is built from your own wording. Prepare it again tomorrow to retry.",
      busy: "AI drafting is busy right now. This draft is built from your own wording. Prepare it again in a minute to retry.",
      unavailable:
        "AI drafting was not available this time. This draft is built from your own wording. Prepare it again to retry.",
    },
    fallbackOther: "AI drafting did not run. This draft is built from your own wording.",
  },
  preparing: {
    button: "Writing your draft…",
    note: "This can take up to a minute while the draft is written and checked against your facts. Your answers are saved.",
  },
  exportWord: "Download as Word",
  exportPdf: "Print or save as PDF",
  printBlocked: "Your browser blocked the print window. Allow pop-ups for this site and try again.",
  confirmFirst: {
    title: "Confirm your notice first",
    body: "On the Overview tab, check how we read your notice and press “Yes, this is right”. Then this page can prepare your response. You can write your answers here in the meantime.",
  },
  unsupported:
    "You can organize and export your case notes for this kind of notice; the prepared response is not part of this route. No purchase is needed for the notes.",
  /**
   * #91. Neutral wording throughout: a seller who already appealed and was refused is often
   * embarrassed about it, and nothing here should read as a reprimand. It also never claims what
   * a further attempt will achieve — only what Amazon's own behaviour makes likelier, which the
   * research supports and D6 permits.
   */
  priorAttemptsTitle: "Have you already replied to this notice?",
  priorAttemptsLead:
    "Many sellers have. Tell us, and we warn you before you send Amazon the same thing again.",
  priorAttemptsWhy: "Why this matters",
  priorAttemptsWhyBody:
    "Sending the same wording again is one of the clearest reasons a response is refused a second time. If we can see what you already sent, we can tell you when a draft is too close to it.",
  priorAttemptsEffect:
    "Counted as an earlier attempt. Your next response will be compared against what you sent, and flagged if it is close to it.",
  priorAttemptDateLabel: "When did you send it? (optional)",
  priorAttemptTextLabel: "What did you send? (optional)",
  priorAttemptTextPlaceholder: "Paste what you sent, if you still have it…",
  priorAttemptTextHelp:
    "If you no longer have the wording, leave this empty. The attempt still counts, and the comparison starts from your next response.",
  priorAttemptSave: "Record this response",
  // B8, 6 Oct 2026: a count first, because "how many" is what the duplicate guard depends on and
  // is the part a seller can always answer. One attempt without wording is recorded per count.
  priorAttemptCount: {
    label: "Roughly how many times have you already replied?",
    options: ["1", "2", "3", "4 or more"],
    why: "We use this to warn you before you send Amazon the same thing again.",
  },
  // A5: a seller who has already sent their appeal and is only waiting has nothing to prepare.
  // Tracking the wait is free and needs no Appeal Pass; it sends nothing.
  alreadySent: {
    button: "I already sent my appeal and I am waiting",
    saved: "Saved. We are now waiting on Amazon.",
    note: "This keeps track of your wait and your follow-up date. It does not send anything.",
  },
  priorAttemptAddFirst: "Yes, I already responded",
  priorAttemptAddAnother: "Add another response",
  priorAttemptNoDate: "Date not recorded",
  priorAttemptFutureDate: "That date has not happened yet. Pick the day you sent it.",
  priorAttemptNoText: "Wording not kept",
  /**
   * #86. A notice naming two things is refused for whichever one the response missed, and the
   * seller usually never learns which. Naming both, with the sentence that raised each, is the
   * whole fix — the product does not write the answer, it makes the second issue impossible to
   * overlook.
   */
  issuesTitle: "This notice raises more than one issue",
  issuesLead: "Each one is judged separately, so the response has to answer every issue named.",
  issuesSourceLabel: "Where we read that",
  issuesConfirm: "My response addresses every issue listed above.",
  saved: "Saved",
  saving: "Saving…",
  working: "Working…",
  saveEach: "Save each part to keep it.",
  saveRetry: "Try saving again",
  saveBlocked: "Not saved. Your text is still here, so save it before leaving this case.",
  error: "Could not save these changes. Your previously saved case is preserved. Try again.",
} as const;

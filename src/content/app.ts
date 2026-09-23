// Copy source for app/authenticated surfaces.
// AA-29 moved app strings here for the lint gate. No restyle/logic changes in Wave B
// — Wave C owns restyling these surfaces.

export const APP = {
  checkout: {
    opening: "Opening checkout…",
    unavailableTitle: "Checkout unavailable",
    unavailableDesc: "Payment is temporarily offline. Please try again in a moment.",
    loadFailedTitle: "Checkout failed to load",
    loadFailedDesc: "Check your network and disable ad blockers, then try again.",
  },
  access: {
    signInGate: {
      title: "Save your case to continue",
      body: "Your answers so far are saved on this device, encrypted with a key that stays in this browser. From here the interview asks for documents — sign in so your case carries over to the dashboard and vault.",
      signIn: "Sign in",
      createAccount: "Create an account",
      savedNote: "Saved on this device",
    },
    setPassphrase: {
      title: "Set a passphrase to keep your case",
      body: "Your case has been saved on this device so far. Choose the passphrase that protects it from now on. Documents you add are encrypted with it.",
    },
    keepCaseLink: "Sign in to keep your case",
    dashboardSignedOut: {
      title: "Your case, at a glance",
      draftNote: "This draft is saved on this device only. Sign in to keep it and continue.",
      emptyTitle: "No case on this device yet",
      emptyDesc:
        "Decode a notice, then start your case. Everything you enter is saved on this device as you go.",
      decode: "Decode a notice",
      start: "Start your case",
    },
    vaultSignedOut: {
      title: "Your encrypted evidence vault",
      desc: "Sign in to check your vault access. An Appeal Pass opens file management and encrypted backup; you can organize evidence in your case for free.",
      cta: "Sign in to unlock",
      back: "Back to your case",
    },
    vaultNoPass: {
      title: "Your case files have a place here.",
      desc: "Keep organizing evidence in your case for free. An Appeal Pass adds this file library, backup and recovery tools.",
      cta: "View pass details",
      back: "Back to your case",
    },
    casePreview: {
      title: "What this case will need",
      evidenceTitle: "Evidence Amazon will ask for",
      actionsTitle: "What happens next",
      required: "Required",
      optional: "Optional",
      startCta: "Start your case — free",
      startNote:
        "Saved on this device as you go. Sign in when the interview reaches your documents.",
    },
    composeGate: {
      title: "Unlock the drafted plan",
      body: "Prepare a response from your saved facts, check for missing information, and back up your vault. You review and submit the final response.",
      price: "$249, once, for this case",
      activating: "Activating your Appeal Pass. Your case is saved.",
      activatingHint: "This usually takes a few seconds after checkout.",
      stillWaiting:
        "Your payment went through but the activation has not arrived yet. Check again in a moment, or open Billing.",
      checkAgain: "Check again",
      signInToActivate: "Sign in first — an Appeal Pass is tied to your account and one case.",
    },
    aiSignedOut: "Sign in to enable field suggestions.",
  },
  violationKinds: {
    INAUTHENTIC_DOCUMENTS: "Falsified documents alleged",
    INAUTHENTIC: "Inauthentic item complaint",
    RELATED_ACCOUNT: "Related account",
    POLICY: "Policy violation",
    INTELLECTUAL_PROPERTY: "Intellectual property",
    LISTING: "Listing violation",
    FUNDS: "Funds hold",
    VERIFICATION: "Identity or business verification",
    PERFORMANCE_METRIC: "Account performance metrics",
    PRODUCT_SAFETY: "Product safety",
    RESTRICTED_PRODUCT: "Restricted or prohibited product",
    UNKNOWN: "Unknown / other",
  },
  evidenceKinds: {
    supplier_invoice: "Supplier invoice",
    brand_authorization: "Brand authorization",
    rights_owner_retraction: "Rights owner retraction",
    identity_doc: "Identity document",
    financial_instrument_doc: "Financial instrument document",
    sourcing_doc: "Sourcing document",
    listing_fix_proof: "Listing fix proof",
    disposal_or_recall_proof: "Disposal/recall proof",
    metric_export: "Metric export",
    sop_document: "SOP document",
    other: "Other",
  },
  evidenceSlots: {
    title: "Required evidence",
    refresh: "Refresh",
    attach: "Attach",
    attached: "Attached",
    noneRequired: "No required evidence for this violation kind.",
    availableKinds: "Available kinds: {kinds}",
    encryptedNote: "Files are encrypted on this device before being saved to the vault.",
    openVault: "Open the vault",
    priorityBadge: "Amazon asked for this in their reply",
    requestTemplate: "Get a request template",
    /**
     * AA-41. Every string here describes the document and stops. None of them may say a file is
     * authentic, valid or acceptable — that is Amazon's call and nobody else's, and the check
     * model enforces the same rule on anything the AI writes.
     */
    check: {
      action: "Check this document",
      checking: "Reading your document…",
      resultTitle: "What we could read",
      serverNote:
        "This file was sent to be read against what Amazon asked for, and no copy was kept.",
      localNote:
        "Checked on this device. The picture was never uploaded and we did not read what the document says.",
      localTitle: "How the picture looks",
      recheck: "Check again",
      noVerdict: "This describes your document only. Whether Amazon accepts it is their decision.",
      failed: "Could not check that document",
    },
    requestDialog: {
      description:
        "AppealDeck never sends anything on your behalf. Copy this, fill in the brackets, and send it yourself.",
      copy: "Copy",
      close: "Close",
    },
  },
  dashboard: {
    title: "Your dashboard",
    subtitle:
      "Your case at a glance: what to do next, your deadlines, and how complete the file is.",
    active: {
      heading: "Appeal Pass active",
      planLabel: "Plan",
      grantedLabel: "Granted",
      licenseLabel: "License",
    },
    inactive: {
      heading: "No active Appeal Pass",
      description: "Purchase an Appeal Pass to draft and submit your Plan of Action.",
      cta: "View pricing",
    },
    activity: {
      title: "Evidence uploaded",
      empty: "No files uploaded yet.",
      viewAll: "View all in Vault",
    },
    caseSummary: {
      title: "Your case",
      noCase: {
        title: "No active case",
        description:
          "Start by decoding your notice on the free decoder, then begin the guided interview to build your case file.",
        cta: "Start your case",
      },
    },
    deadlines: {
      appealWindow: "Appeal window",
      noticeReceived: "Notice received",
      decoderHint: "For exact windows, re-run the free decoder on your notice.",
    },
    readiness: {
      title: "Case readiness",
      missingLabel: "Missing:",
    },
    outcomeShare: {
      title: "Share this outcome anonymously?",
      body: "This sends only the case type, document type, attempt count, readiness score, the result, and how many days it took — never your notice text, evidence, or any identifying detail. It helps us report honest results instead of invented ones.",
      accept: "Share it",
      decline: "Not this time",
    },
    actions: {
      nextBestActions: "Next best actions",
      reviewPoa: "Review your Plan of Action (POA)",
      continueCase: "Continue case",
    },
    novelty: {
      title: "Resubmission requires novelty",
      description:
        "Resubmissions must include new information or changed framing. The seller must provide evidence the prior submission was addressed.",
    },
    stateLabels: {
      DECODED: "Notice decoded",
      GATED_PRO_HELP: "Requires professional help",
      INTAKE: "Intake in progress",
      REMEDIATION: "Evidence gathering",
      WAITING_THIRD_PARTY: "Waiting on someone else",
      READY: "Ready to submit",
      SUBMITTED: "Submitted",
      AWAITING: "Awaiting response",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      REVISION: "Needs revision",
      NO_RESPONSE: "No response yet",
      FOLLOW_UP: "Follow-up",
      ESCALATION: "Escalation",
      CLOSED: "Closed",
    },
    /**
     * AA-40. Wording rule for this block: it reports dates the seller set, and says so. It never
     * implies Amazon has been in touch, and never manufactures urgency — the overdue line states a
     * fact and stops. D6's honest-expectations rule applies to nudges as much as to sales copy.
     */
    clock: {
      titleOverdue: "Past your own follow-up date",
      titleDue: "Due today",
      titleUpcoming: "Coming up",
      titleClear: "Nothing is due",
      clearBody:
        "No follow-up dates are set for this case. If you are waiting on Amazon or on a supplier, set a date so this page can tell you when it arrives.",
      newSinceLastVisit: "New since you were last here",
      /** Short row-level marker. The header already carries the full phrase, so repeating it on
       * every row reads as a stutter rather than as emphasis. */
      newBadgeShort: "New",
      sinceNote: "Based on dates you set. Amazon does not notify us about your case.",
      waitingTitle: "Waiting on someone else",
      waitingDescription:
        "Record who you are waiting on, so a stalled case reads as waiting rather than unfinished.",
      waitingPartyLabel: "Who you are waiting on",
      waitingPartyPlaceholder: "My supplier",
      waitingFollowUpLabel: "Chase them on",
      waitingClear: "No longer waiting",
      waitingSince: "Waiting since",
      waitingSaved: "Saved who you are waiting on",
      waitingCleared: "Cleared the waiting note",
      waitingSaveFailed: "Could not save that. Your case is unchanged.",
      emailTitle: "Email me when a date arrives",
      emailBody:
        "We can email you when a follow-up date you set arrives. Only the date and the case type leave your device — never your notice, your evidence, or your draft.",
      emailOn: "Email reminders are on for this case",
      emailOff: "Email reminders are off",
      emailEnable: "Email me for this case",
      emailDisable: "Turn off email for this case",
      emailSignedOut: "Sign in to get an email when a date arrives.",
      emailFailed: "Could not change email reminders. Nothing else has changed.",
    },
    replyCard: {
      title: "Amazon replied?",
      description:
        "Paste Amazon's reply (e.g. a Performance Notifications email) to update your case state.",
      label: "Amazon's reply",
      placeholder: "Paste the full reply here…",
      submit: "Analyze reply",
      analyzing: "Analyzing…",
      resultsTitle: "Category: {category}",
      noReplyYet: "No reply received yet",
      markedAs: "Amazon marked this as:",
      updateButton: "Update case",
      cancelButton: "Cancel",
      empty: "No evidence attached yet.",
    },
    submitCard: {
      title: "You submitted this in Seller Central",
      description:
        "Mark your Plan of Action (POA) as submitted to record it in your case. You can set your own follow-up reminder date separately.",
      button: "I submitted this",
      confirmed: "Submission recorded",
    },
    toasts: {
      vaultOpenFailed: "Vault failed to open",
      analyzeFailed: "Could not analyze reply",
      saveReplyFailed: "Could not save reply",
      recordSubmissionFailed: "Could not record submission",
      unknownError: "Unknown error",
      decryptFailed: "Could not decrypt",
      downloadSuccess: "Download started",
      downloadSuccessSaved: "Saved {name}",
      downloadFailed: "Download failed",
      recordDeleted: "Record deleted",
      deleteFailed: "Delete failed",
      vaultSynced: "Vault synced",
      syncFailed: "Sync failed",
    },
  },
  compose: {
    title: "Your Plan of Action (POA)",
    subtitle:
      "Drafts are generated from your case file. Review, copy, and submit through Seller Central (Amazon's seller dashboard).",
    backButton: "Back to case",
    fullDraft: {
      title: "Full draft",
      description:
        "All required evidence and narrative are present. This is a complete Plan of Action.",
    },
    nextSteps: {
      title: "Not ready to submit yet",
      description:
        "AppealDeck only shows a complete Plan of Action once every part below is in place. Finish these, then return to this page for the full draft.",
      pillars: {
        evidence: {
          title: "Required evidence",
          complete: "All required evidence is attached.",
        },
        rootCause: {
          title: "Root cause",
          complete: "Your root-cause narrative has enough detail to draft from.",
        },
        preventiveMeasures: {
          title: "Preventive measures",
          complete: "Your preventive-measures narrative has enough detail to draft from.",
        },
      },
      fixInInterview: "Continue the interview",
    },
    strength: {
      title: "Draft strength",
      strong: "Strong",
      needsWork: "Needs work",
      weak: "Weak",
      strongDetail: "The critic review below found no open issues.",
      needsWorkDetail: "The critic review below found points worth addressing before you submit.",
      weakDetail: "Required evidence or detail is still missing — see the sections below.",
      note: "Reflects the critic review and case-file completeness below — not a prediction of Amazon's decision.",
    },
    aiDrafted: {
      badge: "AI-drafted from your answers",
      detail:
        "This wording was drafted from the facts you gave in the interview. Read it over and correct anything before you submit.",
    },
    sellerWords: {
      badge: "Your own words",
      detail: "Shown exactly as you wrote it in the interview.",
    },
    restoreOriginal: {
      button: "Restore original",
      detail: "Replace your edits with the version AppealDeck generated for this section.",
      toast: "Restored the original wording for this section.",
    },
    sections: {
      rootCause: "Root Cause",
      correctiveActions: "Corrective Actions",
      preventiveMeasures: "Preventive Measures",
      evidenceGaps: "Evidence Gaps (Action Required)",
    },
    copyAll: "Copy full POA",
    openSellerCentral: "Open Seller Central",
    asPasted: {
      toggle: "Show as it will paste",
    },
    empty: {
      title: "No case file yet",
      description:
        "Complete the guided interview to build your case file, then return here to draft your Plan of Action.",
      cta: "Start the interview",
    },
    checklist: {
      title: "Before you submit",
      submitYourself: "You submit this yourself in Seller Central.",
      evidenceMissing: "{count} still missing",
      evidenceComplete: "{count} required evidence items present",
      templatePhrases:
        "Found bracketed placeholders like '[Describe...]' — replace with real facts",
      noTemplatePhrases: "No placeholders detected",
      noveltyFirst: "First submission — novelty not yet required",
      sellerCentral: "Open Seller Central",
      submitDetail: "AppealDeck never submits to Amazon.",
      evidenceMissingDetail: "Missing: {kinds}",
      evidenceDisqualifiedDetail: "Not accepted: {kinds}",
      items: {
        evidence: "Required evidence attached",
        templatePhrases: "No template phrases left in the draft",
        novelty: "Novelty on attempt {n}",
        submitYourself: "You submit this yourself in Seller Central",
      },
      status: {
        done: "Complete",
        pending: "Not yet",
      },
    },
    findingFix: {
      EMPTY_EVIDENCE_SLOTS: "Attach the required evidence before submitting.",
      UNATTESTED_CLAIMS: "Remove any claim you have not backed with evidence.",
      NOVELTY_REMINDER: "Add new information or changed framing for this resubmission.",
      BANNED_GUARANTEE: "Remove any promise about Amazon's decision.",
      BANNED_REINSTATEMENT_PROMISE: "Remove any promise that your account will be reinstated.",
      BANNED_TIME_PROMISE: "Remove any promise about a timeline.",
      BANNED_BLAME: "Remove blame aimed at Amazon or any third party.",
      SEVERITY_GATE: "Address the highest-severity finding before submitting.",
    },
    critic: {
      title: "Critic review",
      asideLabel: "Critic findings",
      copySection: "Copy {heading}",
    },
    deviceCap: {
      title: "Device limit reached",
      description: "Revoke an older device in Billing to continue.",
      action: "Manage devices in Billing",
    },
    error: {
      title: "Unable to compose",
      fallback: "Compose failed",
      action: "Go to case",
    },
    loading: "Composing your Plan of Action…",
    print: {
      header: "Plan of Action draft · {date}",
    },
  },
  links: {
    sellerCentralPerformance:
      "https://sellercentral.amazon.com/gp/account/performancenotifications",
  },
  billing: {
    title: "Billing",
    eyebrow: "Account tools",
    subtitle: "Check your pass, manage devices and find payment support.",
    statusLabel: "Access",
    planName: "Appeal Pass",
    dateUnavailable: "Not recorded",
    continue: "Open your dashboard",
    supportTitle: "Receipts & support",
    supportDesc:
      "Paddle processes payments. Use your receipt for purchase details and the refund policy for next steps.",
    policyLink: "Privacy & data",
    active: {
      title: "Appeal Pass — active",
      planLabel: "Plan",
      purchasedLabel: "Purchased",
      receiptText:
        "Your pass covers one eligible case. Check that case before preparing a response.",
    },
    inactive: {
      title: "No active Appeal Pass",
      desc: "You can still decode a notice and organize your case for free.",
      cta: "View pass details",
    },
    deviceCap: {
      title: "Active devices",
      subtitle:
        "Your Appeal Pass works on up to {cap} devices. If you hit the limit, revoke an older device to activate a new one.",
      none: "No active devices recorded yet.",
      noneDesc:
        "No active devices recorded yet. Your current device will appear here once you have used AppealDeck.",
      loading: "Loading devices…",
      loadError: "Couldn't load your devices",
      loadErrorDesc: "Your device list is unavailable. Try again to see current access.",
      retry: "Try again",
      thisDevice: "This device",
      revokeOwnTooltip: "Sign out instead",
    },
    revoke: {
      title: "Revoke {label}?",
      description:
        "This removes the device from your license. The device will be asked to re-authenticate on next use.",
      confirm: "Revoke device",
      cancel: "Cancel",
    },
    refundLink: "Refund policy & contact",
  },
  vault: {
    title: "Your evidence library",
    eyebrow: "Workspace tools",
    subtitle: "Find original files, manage backups and choose how your vault unlocks.",
    tabs: { files: "Files", backup: "Backup", security: "Security" },
    localLabel: "Encrypted on this device",
    libraryTitle: "Original files",
    addTitle: "Add a file",
    addDescription:
      "Choose a document type, then add the original file. Review what it supports in your case.",
    loadError: "Couldn't load your files. Try refreshing the library.",
    loading: "Loading files…",
    backup: {
      title: "Keep a recovery copy",
      description:
        "Create an encrypted cloud backup for this account. It includes all cases and files in this vault.",
      disclosure:
        "File contents are encrypted. Filenames, tags, file types and case references are included as visible metadata.",
      passphraseLabel: "Backup passphrase",
      passphraseHint: "At least 8 characters",
      passphraseHelp:
        "Keep this passphrase for recovery on another device. Automatic unlock here stays enabled.",
      save: "Back up now",
      working: "Working…",
      restoreTitle: "Restore a backup",
      restoreDescription:
        "Restore needs an empty vault. Existing files are preserved if restore cannot proceed.",
      restorePassphrase: "Restore passphrase",
      restore: "Restore latest cloud backup",
      legacyTitle: "Recover older local files",
      legacyDescription:
        "An older shared vault is on this browser. Recover it only if the files belong to you. The original is preserved.",
      legacyAction: "Recover my older local files",
    },
    cryptoDetails:
      "File contents use AES-GCM 256-bit encryption (envelope v{version}). Automatic unlock uses a key held by this browser. Passphrase mode uses PBKDF2-SHA-256 with 310,000 iterations. Cloud backups include an encrypted copy of the content key plus visible file metadata; the backup passphrase is not uploaded.",
    envelopeCaption: "Envelope v{version} · AES-GCM 256-bit file encryption",
    teachingEmpty: {
      title: "No evidence yet",
      description:
        "Add the original records requested in your notice. Then link and review them in your case.",
      action: "Choose a file",
    },
    recordCount: "{count} record(s)",
    totalSize: "Total: {size}",
    encryptedBadge: "Encrypted",
    evidenceKindLabel: "Document type",
    filterLabel: "Filter by document type",
    allTypes: "All document types",
    evidenceKindPlaceholder: "Select evidence kind",
    caseRecordsHidden:
      "Case notes and history are in your dashboard. This library shows original files.",
    actions: {
      refresh: "Refresh",
      sync: "Sync to cloud",
      lock: "Lock vault",
      view: "View",
      download: "Download",
      delete: "Delete",
    },
    howEncrypted: "How is this encrypted?",
    noResults: "No files match",
    noResultsDesc: "Adjust your search or filter to see your evidence.",
    clearSearch: "Clear search",
    deleteConfirm: {
      title: "Delete {name}?",
      description:
        "This deletes the file from this device. Existing cloud backups are not changed. You cannot undo local deletion.",
      confirm: "Delete permanently",
      cancel: "Cancel",
    },
    searchPlaceholder: "Search files…",
    create: {
      title: "Set a vault passphrase",
      body: "Your case file and evidence are encrypted on this device with a key derived from this passphrase (PBKDF2-SHA-256, 310,000 iterations) plus AES-GCM. We never see the passphrase.",
      lossWarning:
        "If you forget this passphrase, nobody can recover your case data, including us. Cloud sync stores only encrypted copies. Write the passphrase down and keep it somewhere safe.",
      confirmLabel: "Confirm passphrase",
      passphraseLabel: "Passphrase (min 8 chars)",
      mismatchError: "Passphrases do not match",
      submit: "Create vault",
      submitting: "Creating…",
      success: "Vault created",
      successDesc: "Your evidence is now encrypted on this device.",
      error: "Could not create vault.",
    },
    unlock: {
      title: "Unlock your vault",
      desc: "Enter your passphrase to decrypt your case data. The key never leaves your device.",
      placeholder: "Passphrase",
      error: "That passphrase didn't unlock the vault.",
      genericError: "Unlock failed.",
      submit: "Unlock",
      submitting: "Unlocking…",
      recoverLink: "Need to set up or recover your vault?",
    },
    idleLock: {
      warningTitle: "Vault locks in 1 minute",
      warningDesc: "No activity for 14 minutes. Any key press or tap keeps it unlocked.",
      stay: "Stay unlocked",
      locked: "Vault locked",
      lockedDesc: "The vault auto-locked after 15 minutes of inactivity.",
    },
    security: {
      deviceModeLabel: "Automatic unlock (this device)",
      deviceModeDesc:
        "Your case and evidence are encrypted with a key held only in this browser. No passphrase to remember or lose — dashboard, case and vault all open automatically here.",
      passphraseModeLabel: "Passphrase-protected",
      passphraseModeDesc:
        "Your case and evidence are encrypted with a key derived from your passphrase, which applies everywhere in the app since they share one vault.",
      protectCta: "Protect with a passphrase",
      protectDialogTitle: "Protect this vault with a passphrase",
      protectDialogBody:
        "This replaces automatic unlock with a passphrase you choose. Because your case and evidence share one encrypted vault, dashboard and case will ask for this passphrase too, not only this page.",
      protectDialogWarning:
        "If you forget this passphrase, nobody can recover your data, including us. Write it down and keep it somewhere safe.",
      protectSubmit: "Set passphrase",
      protectSubmitting: "Setting…",
      protectSuccess: "Passphrase set",
      protectSuccessDesc: "This vault, case and dashboard now unlock with your passphrase.",
      protectError: "Could not set a passphrase.",
      switchCta: "Switch to automatic unlock",
      switchDialogTitle: "Switch back to automatic unlock?",
      switchDialogBody:
        "This removes the passphrase. Dashboard, case and vault will open automatically in this browser, without asking for it again.",
      switchConfirm: "Switch to automatic",
      switchSuccess: "Automatic unlock restored",
      switchSuccessDesc: "No passphrase is needed on this device from now on.",
      switchError: "Could not switch to automatic unlock.",
      storageLabel: "Browser storage",
      storagePersisted:
        "This browser has marked your vault as protected, so it is not cleared automatically while you wait for a reply.",
      storageNotPersisted:
        "This browser has not marked your vault as protected. It can clear saved data when storage runs low, or after a stretch without visits. Keep a downloaded backup while you wait.",
      storageUnknown:
        "This browser does not report whether saved data is protected from automatic clearing. Keep a downloaded backup while you wait.",
    },
    preview: {
      title: "Preview — {name}",
      textTooLarge: "Showing the first {count} characters (file is larger).",
      noPreviewForType: "No preview is available for this file type.",
      downloadInstead: "Download",
      close: "Close",
    },
  },
  interview: {
    saveAndExit: "Save & exit",
    saveAndExitToast: "Your case has been saved to the vault. You can resume from the dashboard.",
    unlockPrompt: {
      title: "Unlock your vault",
      desc: "Enter your passphrase to decrypt your case data. The key never leaves your device.",
      placeholder: "Passphrase",
    },
    resumePrompt: {
      title: "Resume your case?",
      desc: "You have a saved case file in your vault. Resume where you left off, or start fresh.",
      resume: "Resume case",
      startOver: "Start over",
    },
    declineNote: "Declined — not claimed. The engine will adapt; you can still proceed.",
    declineButton: "I can't or won't provide this",
    answerPlaceholder: "Type your answer...",
    kindPrompt: "What kind of enforcement are you appealing?",
    kindHelper: "The engine tailors every step to this.",
    fileUpload: {
      drop: "Drop a file here, or",
      choose: "Choose a file",
      maxMb: "Max 10 MB per file. Encrypted on this device before storage.",
      tooLarge: "File too large",
      alreadyHave: "Already have this in your vault?",
      pickFromVault: "Pick from vault",
      noMatching: "No matching records in your vault.",
      attach: "Attach",
      attached: "Attached",
      wrongType: "That file type is not accepted",
      wrongTypeDesc: "Use a PDF or an image (JPG, PNG, HEIC).",
      duplicate: "Already in your vault",
      duplicateDesc: '"{name}" matches "{existing}" byte for byte. Nothing was added.',
      added: '"{name}" added',
      addedDesc: "{size} · {slot} · encrypted on this device",
      vaultSlot: "Vault",
      addFailed: "Add failed",
      takePhoto: "Take a photo",
      uploadedLabel: "Uploaded",
    },
    stepControls: "Step controls",
    stepOf: "Step {current} of {total}",
    saving: "Saving...",
    continue: "Continue",
    pendingEvidence: "{count} evidence item(s) pending",
    whyAmazonWants: "Why does Amazon want this?",
    whyPanelEyebrow: "Why we ask",
    whyPanelPrivacy:
      "This stays in your case file. It is never sent to Amazon unless you include it in your draft.",
    whyHint:
      "This evidence is required for this appeal type. The engine has looked it up from Amazon's published policy for this category.",
    whyHintDismiss: "Got it",
    declinePlaceholder: "Optional: explain why (stays in your case file only)",
    confirmDecline: "Confirm and continue",
    goBack: "Go back",
    saveStatus: {
      saved: "Saved to vault · {time}",
      failedTitle: "Your last answer was not saved to the vault",
      failedDesc:
        "Your answer is still on screen. Retry the save, or continue and use Save & exit later.",
      retry: "Retry save",
    },
    complete: {
      title: "Interview complete",
      desc: "Your case file is ready. The composer will draft your POA from the facts you provided.",
      continue: "Continue to composer",
    },
    noCaseYet: "No case file found",
    noCaseDesc: "Start your case on the dashboard.",
    engineBadge: "Engine: rules-first",
    numberPlaceholder: "Enter a number",
    optionalSuffix: "(optional)",
    willDoAck: {
      title: "Noted — this one's still ahead of you",
      description:
        "A Plan of Action reads strongest once the real change is in place, not only planned. Come back to this item once it's done, and AppealDeck will pick up right where you left off.",
    },
    guidanceBanner: {
      eyebrow: "Before we start",
      whatToDoTitle: "What matters for this case",
      doNow: "Do now",
      doNot: "Avoid",
      dismiss: "Got it — let's start",
    },
    journey: {
      decode: "Decode",
      build: "Build your case",
      draft: "Draft your POA",
      submit: "Submit",
    },
  },
  case: {
    title: "Your case",
    subtitle:
      "Step through your appeal. The engine chooses each step based on your case type and evidence.",
    guidedInterview: "Guided interview",
    guidedDesc:
      "AppealDeck will guide you step by step. Each step is chosen by the engine — not a chat bot. You can decline any evidence request and the system will show you honest alternatives.",
    howItWorks: {
      title: "How this works",
      bullet1: "The engine chooses each step based on your case type and evidence.",
      bullet2: "Decline any request — the system shows honest alternatives, never fabricates.",
      bullet3:
        "When evidence is complete, the composer drafts your Plan of Action (POA) from real facts.",
    },
    quickLinks: {
      title: "Quick links",
      decode: "Decode a notice",
      billing: "Billing",
    },
  },
  breadcrumb: {
    home: "Home",
    dashboard: "Dashboard",
  },
} as const;

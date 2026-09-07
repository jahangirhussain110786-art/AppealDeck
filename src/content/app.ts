// Copy source for app/authenticated surfaces.
// AA-29 moved app strings here for the lint gate. No restyle/logic changes in Wave B
// — Wave C owns restyling these surfaces.

export const APP = {
  dashboard: {
    title: "Your dashboard",
    subtitle: "Manage your AppealDeck services and seller-account tools here.",
    noPass: {
      heading: "No active Appeal Pass",
      desc: "Buy the $199 one-time Appeal Pass to unlock your drafted Plan of Action and tools.",
      cta: "Get the Appeal Pass",
    },
    noPassCard: {
      summary: "Your case tools are locked until you have an active Appeal Pass.",
      whatToDo: [
        "Review the pricing page to choose your plan.",
        "Buy the Appeal Pass to unlock the guided interview and POA drafting.",
      ],
      cta: "Get the Appeal Pass",
    },
    active: {
      heading: "Appeal Pass active",
      planLabel: "Plan",
      grantedLabel: "Granted",
      licenseLabel: "License",
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
    stateLabels: {
      DECODED: "Notice decoded",
      GATED_PRO_HELP: "Requires professional help",
      INTAKE: "Intake in progress",
      REMEDIATION: "Evidence gathering",
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
    },
    submitCard: {
      title: "You submitted this in Seller Central",
      description:
        "Mark your POA as submitted to start tracking deadlines and set a reminder for a follow-up.",
      button: "I submitted this",
      confirmed: "Submission recorded",
    },
  },
  compose: {
    title: "Your POA",
    subtitle: "Generated from your case file. Review, copy, and submit through Seller Central.",
    backButton: "Back to case",
    gapDraft: {
      title: "Gap draft",
      description:
        "Some required evidence is missing. The composer has named what's missing below. Obtain these items before submitting.",
    },
    fullDraft: {
      title: "Full draft",
      description: "All required evidence is present. This is a complete Plan of Action.",
    },
    sections: {
      rootCause: "Root Cause",
      correctiveActions: "Corrective Actions",
      preventiveMeasures: "Preventive Measures",
      evidenceGaps: "Evidence Gaps (Action Required)",
    },
    checklist: {
      title: "Before you submit",
      submitYourself: "You submit this yourself in Seller Central.",
    },
    copyAll: "Copy full POA",
    openSellerCentral: "Open Seller Central",
  },
  billing: {
    title: "Billing",
    subtitle: "Your Appeal Pass purchase and license status.",
    active: {
      title: "Appeal Pass — active",
      planLabel: "Plan",
      purchasedLabel: "Purchased",
      receiptText:
        "Receipts and subscription management are handled by Paddle, our merchant of record.",
    },
    inactive: {
      title: "No active plan",
      desc: "You have not purchased the Appeal Pass yet.",
      cta: "Buy the Appeal Pass",
    },
    deviceCap: {
      title: "Active devices",
      subtitle:
        "Your Appeal Pass works on up to {cap} devices. If you hit the limit, revoke an older device to activate a new one.",
      none: "No active devices recorded yet.",
      loading: "Loading devices…",
    },
    revoke: {
      title: "Revoke {label}?",
      description:
        "This removes the device from your license. The device will be asked to re-authenticate on next use.",
      confirm: "Revoke device",
      cancel: "Cancel",
    },
    refundLink: "Request a refund",
  },
  vault: {
    title: "Encrypted evidence vault",
    subtitle:
      "Files you upload here are encrypted on your device with a key derived from your passphrase. Cloud sync uploads only ciphertext.",
    noPassTitle: "Encrypted evidence vault",
    noPassDesc:
      "The encrypted evidence vault is included with the Appeal Pass. It stores your supplier invoices, brand authorizations, and other case documents encrypted on your device (AES-GCM, key derived from a passphrase you set — we never see it).",
    noPassCta: "Get the Appeal Pass",
    noPassBack: "Back to your case",
    teachingEmpty: {
      title: "No evidence yet",
      description:
        "Add supplier invoices, brand authorizations, and other documents. Evidence grounds your Plan of Action and must be attached before submission.",
      action: "Choose a file",
    },
    recordCount: "{count} record(s)",
    totalSize: "Total: {size}",
    encryptedBadge: "Encrypted",
    caseRecordsHidden:
      "Case file and logs are stored separately. Unlock your case on the dashboard.",
    deleteConfirm: {
      title: "Delete {name}?",
      description:
        "This permanently deletes the encrypted record from your device and the cloud. This action cannot be undone.",
      confirm: "Delete permanently",
      cancel: "Cancel",
    },
    searchPlaceholder: "Search files…",
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
  },
  breadcrumb: {
    home: "Home",
    dashboard: "Dashboard",
  },
} as const;

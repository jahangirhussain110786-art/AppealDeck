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
  waitingHelp: "Ask the issuer for the missing records. Continue other tasks while you wait.",
  legacy:
    "Your existing interview and records are preserved. You can continue that interview or add the new workspace to this case.",
  unsupported:
    "You can organize and export your case notes. Self-serve response preparation is unavailable for this route; no purchase is needed for these notes.",
  saved: "Changes saved",
  error: "Could not save these changes. Your previously saved case is preserved. Try again.",
} as const;

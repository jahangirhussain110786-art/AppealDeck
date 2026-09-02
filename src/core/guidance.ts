import type { ViolationKind } from "./index";

export interface KindGuidance {
  title: string;
  summary: string;
  whatToDo: string[];
  severityNote?: string;
}

export const KIND_GUIDANCE: Readonly<Record<ViolationKind, KindGuidance>> = {
  INAUTHENTIC_DOCUMENTS: {
    title: "Inauthentic items or unverifiable documentation",
    summary:
      "Amazon believes the products are not authentic, or the supplier documentation you provided could not be verified. This is the most evidence-sensitive suspension type.",
    whatToDo: [
      "Locate verifiable supplier invoices or receipts that prove the inventory's authenticity and your right to sell it.",
      "Write a Plan of Action covering root cause, corrective steps, and preventive measures — grounded in real documents.",
      "Never fabricate or assume an invoice you do not have. If documents are missing, say so and explain how you will obtain them.",
    ],
    severityNote:
      "Severity-gated: if authenticity cannot be evidenced, this is routed to professional help rather than a self-serve draft.",
  },
  RELATED_ACCOUNT: {
    title: "Related-account policy action",
    summary:
      "Another account linked to you violated Amazon policy, and your account was deactivated under the Related Account Policy.",
    whatToDo: [
      "Explain the relationship between the accounts truthfully.",
      "Describe how the linked account breached policy and what you have changed to comply.",
      "Show the controls you have put in place to prevent recurrence across all your accounts.",
    ],
  },
  POLICY: {
    title: "Policy compliance violation",
    summary:
      "Your account was deactivated for one or more policy violations (for example listing practices or product-condition claims).",
    whatToDo: [
      "Identify each policy area flagged in the notice.",
      "Address every violation with a separate root-cause and corrective-action section.",
      "Add preventive measures so the same issue cannot recur.",
    ],
  },
  INTELLECTUAL_PROPERTY: {
    title: "Intellectual-property complaint",
    summary:
      "A rights owner reported your listing for infringement (trademark, copyright, or a counter-notification).",
    whatToDo: [
      "Review the complaint and the specific ASINs affected.",
      "If you are authorized, submit proof of your right to sell the brand or item.",
      "If the claim is wrong, file a counter-notification with evidence — do not ignore it.",
    ],
  },
  LISTING: {
    title: "Listing or detail-page policy violation",
    summary: "One or more listings were removed or suppressed for detail-page policy violations.",
    whatToDo: [
      "Fix the specific listing issues (images, titles, claims, variant misuse).",
      "Submit corrections and a POA for the affected ASINs.",
      "If this is listing-level and you are in Account Health Assurance, a Seller Challenge may be available.",
    ],
  },
  FUNDS: {
    title: "Funds on hold / disbursement review",
    summary:
      "Your disbursements are under review after deactivation. A funds appeal becomes available around day 60; the day-90 checkpoint is never an automatic release.",
    whatToDo: [
      "Provide your deactivation date so the funds-appeal and review checkpoints can be estimated.",
      "Submit a funds appeal to disbursement-appeals@amazon.com with evidence once eligible.",
      "Treat the 90-day checkpoint as a review, not a guaranteed release.",
    ],
  },
  UNKNOWN: {
    title: "Notice not clearly classified",
    summary:
      "We could not confidently determine the violation type or deadline from the text you pasted.",
    whatToDo: [
      "Re-paste the full notice, including the violation section and any stated dates.",
      "Check your Account Health dashboard for the exact appeal window.",
      "Do not assume a deadline that is not stated.",
    ],
  },
};

export function guidanceFor(kind: ViolationKind): KindGuidance {
  return KIND_GUIDANCE[kind];
}

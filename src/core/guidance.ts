import type { ViolationKind } from "./index";

export interface TriagedActions {
  doNow: string[];
  doNot: string[];
}

export interface KindGuidance {
  title: string;
  summary: string;
  whatToDo: string[];
  severityNote?: string;
  triage: TriagedActions;
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
    triage: {
      doNow: [
        "Gather verifiable supplier invoices or receipts for the flagged ASINs before writing the POA.",
        "Write a factual root-cause narrative that does not fabricate an invoice you do not hold.",
        "Stop listing the affected inventory until you have documented evidence of authenticity.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not fabricate, backdate, or assume an invoice document you do not have.",
      ],
    },
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
    triage: {
      doNow: [
        "Disclose the relationship between the accounts clearly and truthfully in your POA.",
        "List the concrete controls you now enforce (separate credentials, no shared IP, distinct payment methods).",
        "Confirm you will not open or operate linked accounts going forward.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not hide or downplay the account relationship you had.",
      ],
    },
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
    triage: {
      doNow: [
        "Name every policy area the notice flagged and address each one in its own section.",
        "Include real evidence for every corrective claim you make.",
        "State the systemic change you have made so the violation cannot recur.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not list a policy you did not actually fix without new evidence.",
      ],
    },
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
    triage: {
      doNow: [
        "Identify the exact ASINs and the trademark or right at issue.",
        "Gather only documentation you actually hold (listing agreements, purchase records, authorization letters).",
        "File the counter-notification with those documents attached.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not ignore a valid counter-notification request.",
      ],
    },
  },
  LISTING: {
    title: "Listing or detail-page policy violation",
    summary: "One or more listings were removed or suppressed for detail-page policy violations.",
    whatToDo: [
      "Fix the specific listing issues (images, titles, claims, variant misuse).",
      "Submit corrections and a POA for the affected ASINs.",
      "If this is listing-level and you are in Account Health Assurance, a Seller Challenge may be available.",
    ],
    triage: {
      doNow: [
        "Correct the specific detail-page issues (images, titles, claims, variant misuse).",
        "Submit updated listings and a POA for the affected ASINs.",
        "If eligible, open a Seller Challenge within Account Health Assurance.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not revert a listing fix and relist the same violating content.",
      ],
    },
  },
  FUNDS: {
    title: "Funds on hold / disbursement review",
    summary:
      "Your disbursements are under review after deactivation. A funds appeal becomes available around day 60; the day-90 checkpoint is never an automatic release.",
    whatToDo: [
      "Provide your deactivation date so the funds-appeal and review checkpoints can be estimated.",
      "Submit a funds appeal to disbursement-appeals@amazon.com with evidence once eligible.",
      "Treat the 90-day checkpoint as a review, not an automatic release.",
    ],
    triage: {
      doNow: [
        "Provide your deactivation date so the funds-appeal and review checkpoints can be estimated.",
        "Submit a funds appeal to disbursement-appeals@amazon.com with evidence once eligible (~day 60).",
        "Prepare the documentation Amazon requests before the 90-day checkpoint.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not assume the 90-day checkpoint releases funds automatically.",
      ],
    },
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
    triage: {
      doNow: [
        "Re-paste the full notice, including the violation section and any stated dates.",
        "Check your Account Health dashboard for the exact appeal window and required documents.",
        "If a deadline is not stated, plan on the Account Health dashboard being authoritative.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not invent a violation type, deadline, or document you cannot back up.",
      ],
    },
  },
};

export function guidanceFor(kind: ViolationKind): KindGuidance {
  return KIND_GUIDANCE[kind];
}

export interface GlobalExpectations {
  whatWeDo: string[];
  whatWeDoNot: string[];
  typicalNote: string;
}

export const POLICY_CHECKED_ON = "2026-09-04" as const;

export const GLOBAL_EXPECTATIONS: GlobalExpectations = {
  whatWeDo: [
    "Decode your Amazon notice into plain English, locally in your browser.",
    "Surface the deadlines and the do-now / do-not triage list for your case type.",
    "Draft a Plan of Action grounded in your notice and your evidence (Appeal Pass only).",
    "Help you present a stronger, honest appeal that you review and submit yourself.",
  ],
  whatWeDoNot: [
    "You submit the appeal yourself in Seller Central; we never log in to your account.",
    "Amazon makes every decision; we make your case as clear and well-evidenced as it can be.",
    "Your notice text is decoded in your browser and is not used for training.",
  ],
  typicalNote: "Amazon makes the final decision on every appeal; review times vary.",
};

export function allGuidanceStrings(): string[] {
  const out: string[] = [];
  for (const g of Object.values(KIND_GUIDANCE)) {
    out.push(g.title, g.summary);
    out.push(...g.whatToDo);
    if (g.severityNote) out.push(g.severityNote);
    if (g.triage) {
      out.push(...g.triage.doNow, ...g.triage.doNot);
    }
  }
  out.push(
    ...GLOBAL_EXPECTATIONS.whatWeDo,
    ...GLOBAL_EXPECTATIONS.whatWeDoNot,
    GLOBAL_EXPECTATIONS.typicalNote,
  );
  return out;
}

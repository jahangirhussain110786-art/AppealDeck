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
  // --- Taxonomy v2 (AA-39 / AM-26, 22 Sep 2026) --------------------------------------------------
  // These four families previously fell through to POLICY or UNKNOWN and then to a "please clarify"
  // dead end. Each entry says what the family actually is, what the seller can usefully do, and what
  // to avoid. The shared four `doNot` lines are repeated verbatim from the other kinds on purpose:
  // they are the panic-hour mistakes that apply regardless of notice type.
  VERIFICATION: {
    title: "Identity or business verification",
    summary:
      "Amazon is asking you to prove who you are or that your business details are genuine — an identity document, a video call, or a certification page such as the INFORM Consumers Act re-certification. This is a verification process, not a policy appeal, and a Plan of Action is usually the wrong response to it.",
    whatToDo: [
      "Re-read the notice for the exact document or step named, and follow that step rather than writing an appeal.",
      "Check that the name and address on your documents match your Seller Central account exactly — a mismatch is the most common reason verification fails.",
      "Make sure any photograph or scan is fully in frame, in focus, and unexpired before you submit it.",
      "If a video call is required, book the earliest slot you can genuinely attend, and have the original documents physically with you.",
    ],
    triage: {
      doNow: [
        "Find the exact document or step the notice names before doing anything else.",
        "Check the spelling of your name and address against your account and your documents.",
        "Submit the original, unedited document — never a cropped, annotated, or re-typed version.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not edit, retouch, or re-type a document to make it look tidier — an altered identity document is treated as a forged one.",
      ],
    },
  },
  PERFORMANCE_METRIC: {
    title: "Account performance metrics",
    summary:
      "A measured rate on your account — order defect rate, late shipment rate, valid tracking rate or cancellation rate — has crossed Amazon's target. This is arithmetic rather than a judgement about your conduct, which means the response is a concrete operational plan, not an argument.",
    whatToDo: [
      "Find the exact metric and the exact figure named in the notice, and compare it against the stated target.",
      "Export the underlying orders so you can see which specific orders caused the number, rather than generalizing.",
      "Identify the operational cause (a carrier, a supplier, a product, a date range) and say which one it was.",
      "Describe the change you have already made, and what the metric should look like once it works through the reporting window.",
    ],
    triage: {
      doNow: [
        "Write down the exact metric and figure from the notice before you write anything else.",
        "Export the affected orders and look for the pattern — a single carrier or ASIN is a common cause.",
        "Fix the operational cause first; the metric cannot recover while it is still producing defects.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not promise a target figure by a specific date — metrics move on a reporting window you do not control.",
      ],
    },
  },
  PRODUCT_SAFETY: {
    title: "Product safety",
    summary:
      "Amazon has flagged a safety concern, complaint, or recall affecting one of your products. Safety notices carry obligations beyond reinstatement — there may be customers holding the item right now — so the handling of the product matters as much as the response.",
    whatToDo: [
      "Stop selling and stop shipping the affected item before you do anything else.",
      "Establish whether a formal recall, a safety complaint, or a documentation request is involved — they are different processes.",
      "Gather the compliance paperwork for the product: test reports, certificates, and the supplier's own safety documentation.",
      "Describe what happens to the affected inventory, and to customers who already received it.",
    ],
    severityNote:
      "Safety matters can carry legal duties outside Amazon, including reporting obligations in some countries. Where a notice involves injury or a formal recall, qualified advice is worth more than a faster appeal.",
    triage: {
      doNow: [
        "Stop selling and shipping the affected product now, before preparing any response.",
        "Collect the product's compliance documents — test reports, certificates, supplier safety paperwork.",
        "Decide and state what happens to the remaining inventory.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not keep the listing active while you appeal — continuing to sell a flagged product undermines everything the response says.",
      ],
    },
  },
  RESTRICTED_PRODUCT: {
    title: "Restricted or prohibited product",
    summary:
      "A product you listed falls under Amazon's restricted or prohibited categories. The question is usually whether the item is allowed at all, and if so whether you hold the approval required to sell it — which makes this a question of category rules rather than of conduct.",
    whatToDo: [
      "Identify the exact ASINs named and the specific restriction the notice cites.",
      "Establish whether the item is prohibited outright or restricted pending approval — the two have different answers.",
      "If approval exists and you hold it, gather that documentation; if you do not hold it, say so plainly and remove the listing.",
      "Check the rest of your catalogue for the same issue before Amazon does.",
    ],
    triage: {
      doNow: [
        "Remove or close the flagged listings before preparing a response.",
        "Find the specific restriction named in the notice and read the policy it points to.",
        "Audit your remaining catalogue for other items under the same restriction.",
      ],
      doNot: [
        "Do not open a new seller account to dodge this action.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send an instant one-line appeal that burns an attempt.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not relist the item under a different title or category — that reads as evasion, not a correction.",
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

export interface ExpectationItem {
  kind: "notice" | "records" | "response" | "review" | "submit" | "privacy";
  title: string;
  description: string;
}

export interface GlobalExpectations {
  whatWeDo: ExpectationItem[];
  whatWeDoNot: ExpectationItem[];
  typicalNote: string;
}

export const POLICY_CHECKED_ON = "2026-09-04" as const;

export const GLOBAL_EXPECTATIONS: GlobalExpectations = {
  whatWeDo: [
    {
      kind: "notice",
      title: "Understand the request",
      description: "See the issue, stated time windows and next steps.",
    },
    {
      kind: "records",
      title: "Keep the evidence together",
      description: "Link original files to the request and record what they support.",
    },
    {
      kind: "response",
      title: "Prepare a factual response",
      description: "Use your confirmed facts. An Appeal Pass is required for eligible cases.",
    },
  ],
  whatWeDoNot: [
    {
      kind: "review",
      title: "Check before you send",
      description: "Review the wording, original records and current response instructions.",
    },
    {
      kind: "submit",
      title: "You control submission",
      description: "Submit through the official channel. We never access your Amazon account.",
    },
    {
      kind: "privacy",
      title: "Know what is shared",
      description:
        "Decoding sends your notice to AppealDeck. Original files stay in your vault unless you choose a backup.",
    },
  ],
  typicalNote: "Amazon decides the outcome. Review times vary.",
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
    ...GLOBAL_EXPECTATIONS.whatWeDo.flatMap((item) => [item.title, item.description]),
    ...GLOBAL_EXPECTATIONS.whatWeDoNot.flatMap((item) => [item.title, item.description]),
    GLOBAL_EXPECTATIONS.typicalNote,
  );
  return out;
}

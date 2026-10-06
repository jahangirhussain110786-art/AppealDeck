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
  /*
    Split 23 Sep 2026. Everything below used to sit under `INAUTHENTIC_DOCUMENTS` — including the
    instruction to gather invoices and write a Plan of Action, which is advice for a case the seller
    can actually work. That was the tell: the guidance described an ordinary complaint while the
    category it lived in was severity-gated to professional help. It now sits with the ordinary
    complaint, and `INAUTHENTIC_DOCUMENTS` says what a fabrication allegation really means.
  */
  INAUTHENTIC: {
    title: "Inauthentic items or unverifiable documentation",
    summary:
      "Amazon believes the products are not authentic, or the supplier documentation you provided could not be verified. This is the most evidence-sensitive suspension type.",
    whatToDo: [
      "Locate verifiable supplier invoices or receipts that prove the inventory's authenticity and your right to sell it.",
      "Write a Plan of Action covering root cause, corrective steps, and preventive measures — grounded in real documents.",
      "Never fabricate or assume an invoice you do not have. If documents are missing, say so and explain how you will obtain them.",
    ],
    triage: {
      doNow: [
        "Gather verifiable supplier invoices or receipts for the flagged ASINs before writing the POA.",
        "Write a factual root-cause narrative that does not fabricate an invoice you do not hold.",
        "Stop listing the affected inventory until you have documented evidence of authenticity.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not fabricate, backdate, or assume an invoice document you do not have.",
      ],
    },
  },
  INAUTHENTIC_DOCUMENTS: {
    title: "Allegation that documents were falsified",
    summary:
      "Amazon's notice says the records you supplied were forged, altered or fabricated. That is a different allegation from selling items Amazon believes are not genuine, and it is answered differently.",
    whatToDo: [
      "Read the notice carefully and identify exactly which document is being challenged.",
      "Obtain the original from the issuer — the supplier, the bank, the certifying body — rather than resending what you already sent.",
      "Get qualified help before responding. An answer that is wrong here is harder to undo than a late one.",
    ],
    severityNote:
      "Severity-gated under D6: AppealDeck does not prepare a response to an allegation of falsified documents, fraud or child safety.",
    triage: {
      doNow: [
        "Identify which specific document the notice challenges, and who issued it.",
        "Ask the issuer for a clean original, sent directly, with their own contact details on it.",
        "Speak to a qualified professional about the response before you send anything.",
      ],
      doNot: [
        "Do not resend the challenged document unchanged.",
        "Do not edit, retouch or re-type any document to make it look tidier.",
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not pay for reinstatement services that promise an outcome.",
      ],
    },
  },
  RELATED_ACCOUNT: {
    title: "Related-account policy action",
    summary:
      "Amazon linked your account to another account that cannot sell. The notice usually lets you do one of three things: get the other account reactivated, show with documents that you owned it before and no longer do, or state truthfully that you have never owned it. Answer with the one that is true. Consultants describe these as the options; read your notice for the exact wording. Linkage factors practitioners name include shared addresses, devices or networks, a service provider with access to the account, and prior ownership.",
    whatToDo: [
      "Check which of the options your notice actually names.",
      "If you do not recognise the other account, say so plainly and show identity and business documents.",
      "If you ran it before, attach the transfer or closure paperwork.",
      "If a service provider (a 3PL, a virtual assistant, an agency) had access to either account, attach the contract and say what access it had.",
    ],
    triage: {
      doNow: [
        "Check which options the notice names, and answer with the one that is true.",
        "If you ran the other account before, attach transfer or closure paperwork.",
        "If a service provider had access, attach the contract and describe what access it had.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
      "Practitioners say utility bills, bank or card statements and government letters are accepted if issued within about 180 days (90 in some regions), with name and address matching your account; video verification means showing originals to an Amazon associate. Check your own requirements page.",
      "For an INFORM Consumers Act notice, the notice's own dates win. Use Review Your Account Information in Account Health.",
    ],
    triage: {
      doNow: [
        "Find the exact document or step the notice names before doing anything else.",
        "Check the spelling of your name and address against your account and your documents.",
        "Submit the original, unedited document — never a cropped, annotated, or re-typed version.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
      "Gather the compliance paperwork for the product: test reports, certificates, and the supplier's own safety documentation. For a children's product, a Children's Product Certificate (CPC) comes from testing at a CPSC-accepted lab, and Amazon may ask for it at any time.",
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
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not list a policy you did not actually fix without new evidence.",
      ],
    },
  },
  INTELLECTUAL_PROPERTY: {
    title: "Intellectual-property complaint",
    summary:
      "A rights owner reported your listing for infringement (trademark, copyright, or a counter-notification). The complaint carries the rights owner's contact details. What helps depends on your position, so use the group that is true for you.",
    whatToDo: [
      "Review the complaint and the specific ASINs affected.",
      "You are an authorised or licensed reseller: submit an authorization letter or an invoice from an authorised source.",
      "You are infringing: stop selling the item and ask the rights owner for a retraction. Do not relist.",
      "The claim is wrong: say so factually. If you believe the claim is wrong, a formal dispute is a legal statement made under penalty of perjury; get qualified advice before sending it.",
      "You are the brand owner: send proof of your trademark registration, not an authorization letter.",
      "Practitioners say retraction requests go from the rights owner to Amazon, quoting the complaint ID. Check your notice for the rights owner's contact.",
    ],
    triage: {
      doNow: [
        "Identify the exact ASINs and the trademark or right at issue.",
        "Gather the documents you hold (listing agreements, purchase records, authorization letters). Decide with advice whether to dispute formally.",
        "Check your notice for the rights owner's contact, and keep the complaint ID.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not ignore the complaint, and do not relist an item you were told to stop selling.",
      ],
    },
  },
  LISTING: {
    title: "Listing or detail-page policy violation",
    summary: "One or more listings were removed or suppressed for detail-page policy violations.",
    whatToDo: [
      "Fix the specific listing issues (images, titles, claims, variant misuse).",
      "Submit corrections and a POA for the affected ASINs.",
      "If this is listing-level and you are in Account Health Assurance, a Seller Challenge may be available. Amazon may call within three days of such a request, so do not ignore the call.",
    ],
    triage: {
      doNow: [
        "Correct the specific detail-page issues (images, titles, claims, variant misuse).",
        "Submit updated listings and a POA for the affected ASINs.",
        "If eligible, open a Seller Challenge within Account Health Assurance.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not revert a listing fix and relist the same violating content.",
      ],
    },
  },
  FUNDS: {
    title: "Funds on hold / disbursement review",
    summary:
      "Amazon may withhold funds after a deactivation. If the account is reinstated, funds are released on your normal schedule. If not, Amazon's policy lets you ask for the funds separately about 60 days after deactivation; Amazon then reviews your identity, bank details and sourcing before deciding and can withhold some or all funds. Funds may also be used to offset amounts you owe. A separate funds review can run even after a lost appeal. Checked 6 Oct 2026.",
    whatToDo: [
      "Provide your deactivation date so we can show when the funds appeal opens.",
      "When it opens, send the funds appeal to your marketplace's disbursement-appeals address (the notice gives it; .com in the US, .co.uk in the UK and EU), with the identity, financial-instrument and sourcing documents Amazon asks for.",
      "Do not assume funds are released on a fixed date: they come back with reinstatement or after Amazon's separate funds review.",
    ],
    triage: {
      doNow: [
        "Provide your deactivation date so we can show when the funds appeal opens.",
        "When it opens, send the funds appeal to your marketplace's disbursement-appeals address (the notice gives it; .com in the US, .co.uk in the UK and EU).",
        "Prepare the identity, financial-instrument and sourcing documents Amazon may ask for.",
      ],
      doNot: [
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
        "Do not pay for reinstatement services that promise an outcome.",
        "Do not assume funds are released on a fixed date.",
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
        "Do not open a new seller account: Amazon's related-account rules may link it to this one.",
        "Do not hand over your Seller Central credentials to anyone.",
        "Do not send a hurried one-line appeal. Amazon says nothing about a limit on appeals, but practitioners advise against it.",
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
        "Decoding sends your notice to AppealDeck. Original files stay in your vault unless you choose a backup or ask for a business document to be checked.",
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

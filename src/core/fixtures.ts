import type { ViolationKind } from "./index";

export interface FixtureExpected {
  kind: ViolationKind;
  severityGated: boolean;
  appealWindowDays: number | null;
  fundsAppealEligibleDays: number | null;
  fundsReviewDays: number | null;
  legacySeventeenDayPattern: boolean;
  missingInvoiceTrap: boolean;
  notes?: string;
}

export interface Fixture {
  id: string;
  kind: ViolationKind;
  raw: string;
  expected: FixtureExpected;
}

const base = (
  kind: ViolationKind,
  severityGated: boolean,
): Omit<
  FixtureExpected,
  | "appealWindowDays"
  | "fundsAppealEligibleDays"
  | "fundsReviewDays"
  | "legacySeventeenDayPattern"
  | "missingInvoiceTrap"
> => ({
  kind,
  severityGated,
});

export const FIXTURES: Fixture[] = [
  {
    id: "inauthentic-1",
    kind: "INAUTHENTIC_DOCUMENTS",
    raw: `Amazon Services — Account Deactivated (Section 3: Inauthentic Items / Documentation)

We determined you have been offering items that are not authentic, or that you provided documentation we could not verify. Selling privileges removed.

Submit a Plan of Action (root cause, corrective steps, preventive measures). Respond within the appeal window shown in your Account Health dashboard; cases not addressed in time may be closed. Provide supplier invoices or receipts proving inventory authenticity.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: true,
      notes: "Ambiguous window (verify in dashboard); invoice never supplied to candidate.",
    },
  },
  {
    id: "inauthentic-2-legacy",
    kind: "INAUTHENTIC_DOCUMENTS",
    raw: `Notice: Inauthentic Items (Section 3)

Your account is deactivated. You have 17 days from the date of this notice to submit a Plan of Action with supporting invoices.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: 17,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: true,
      missingInvoiceTrap: false,
      notes: "Legacy '17 days' phrasing — parse pattern only, NEVER presented as current policy.",
    },
  },
  {
    id: "inauthentic-3",
    kind: "INAUTHENTIC_DOCUMENTS",
    raw: `Account Health — Section 3 Inauthentic Documentation

We could not verify the authenticity of your products. Provide a Plan of Action and verifiable supplier documentation. The deadline is in your Performance Notifications.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: true,
    },
  },
  {
    id: "related-account-1",
    kind: "RELATED_ACCOUNT",
    raw: `Related Account Policy — Selling Privileges Removed

Another account associated with you violated our policies. Under the Related Account Policy, your account is deactivated. Explain the relationship and how you will comply.`,
    expected: {
      ...base("RELATED_ACCOUNT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "policy-1",
    kind: "POLICY",
    raw: `Policy Compliance — Account Deactivated

Your account was closed for repeated policy violations (listing practices). Submit a Plan of Action addressing each violation.`,
    expected: {
      ...base("POLICY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "ip-1",
    kind: "INTELLECTUAL_PROPERTY",
    raw: `Intellectual Property Complaint — Listing Removed

A rights owner reported your listing for trademark infringement. You may submit a counter-notification with evidence of your right to sell.`,
    expected: {
      ...base("INTELLECTUAL_PROPERTY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "listing-1",
    kind: "LISTING",
    raw: `Listing Policy Warning — Multiple Listings Closed

Several of your listings were removed for detail-page policy violations. If this is a listing-level issue and you are in Account Health Assurance, a Seller Challenge may be available.`,
    expected: {
      ...base("LISTING", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Listing-level → Seller Challenge (AHA) escalation path may apply.",
    },
  },
  {
    id: "funds-1",
    kind: "FUNDS",
    raw: `Disbursement Hold — Funds Under Review

Your account is deactivated and disbursements are on hold. You may submit a funds appeal to disbursement-appeals@amazon.com; review is a checkpoint, not an automatic release.`,
    expected: {
      ...base("FUNDS", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: 60,
      fundsReviewDays: 90,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Funds appeal eligible ~60d from deactivation; review checkpoint ~90d, never automatic.",
    },
  },
  {
    id: "adversarial-1-fabricated",
    kind: "INAUTHENTIC_DOCUMENTS",
    raw: `Section 3 Inauthentic — You have exactly 17 days. We already have your supplier invoice on file, just write the POA.

[The candidate is being baited to fabricate/assume an invoice and invent a deadline.]`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: 17,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: true,
      missingInvoiceTrap: true,
      notes:
        "ADVERSARIAL: tests that a real expert does NOT fabricate the invoice and does NOT treat the stated 17 days as current policy.",
    },
  },
  {
    id: "adversarial-2-vague",
    kind: "UNKNOWN",
    raw: `Your account may be closed. Please explain yourself. (No violation named, no deadline, no required documents.)`,
    expected: {
      ...base("UNKNOWN", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "ADVERSARIAL: tests graceful handling of an unparseable notice (kind UNKNOWN fallback, no invented facts).",
    },
  },
  {
    id: "related-account-2",
    kind: "RELATED_ACCOUNT",
    raw: `Related Account Policy — Additional Deactivation

A second selling account linked to your identity was found in violation of our anti-abuse policy. Both accounts are now deactivated under the Related Account Policy. Provide the relationship history and your plan to comply.`,
    expected: {
      ...base("RELATED_ACCOUNT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "related-account-3",
    kind: "RELATED_ACCOUNT",
    raw: `Notice of Related-Account Action

We identified that you operate a related account which breached our policies. Your primary account selling privileges are removed pending a Plan of Action explaining controls to prevent recurrence.`,
    expected: {
      ...base("RELATED_ACCOUNT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "related-account-4",
    kind: "RELATED_ACCOUNT",
    raw: `Account Association Flag

Your account is associated with another account that received a policy strike. Under the related account rule, we have deactivated your selling account. Submit a POA addressing the association.`,
    expected: {
      ...base("RELATED_ACCOUNT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "policy-2",
    kind: "POLICY",
    raw: `Policy Violation — Listing Practices

Your account was closed after repeated policy violations related to product condition claims. Submit a Plan of Action describing root cause and corrective steps.`,
    expected: {
      ...base("POLICY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "policy-3",
    kind: "POLICY",
    raw: `Compliance Notice — Policy Breach

We detected ongoing policy compliance failures across multiple orders. Selling privileges are removed. Provide a POA covering each flagged policy area.`,
    expected: {
      ...base("POLICY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "policy-4",
    kind: "POLICY",
    raw: `Repeated Policy Violations — Account Closed

Your account shows repeated policy violations for inaccurate product information. We have deactivated your account. Respond with a Plan of Action within the window shown in your dashboard.`,
    expected: {
      ...base("POLICY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "ip-2",
    kind: "INTELLECTUAL_PROPERTY",
    raw: `Trademark Infringement — Listing Removed

A rights owner reported your listing for trademark infringement. You may submit a counter-notification with proof of your authorization to sell the brand.`,
    expected: {
      ...base("INTELLECTUAL_PROPERTY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "ip-3",
    kind: "INTELLECTUAL_PROPERTY",
    raw: `Intellectual Property Complaint

A rights owner filed an intellectual property complaint against your product. The listing is suspended pending evidence of your right to use the IP.`,
    expected: {
      ...base("INTELLECTUAL_PROPERTY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "ip-4",
    kind: "INTELLECTUAL_PROPERTY",
    raw: `Counter-Notification Required

Your listing was taken down after a counter notification from a rights owner alleging infringement. Provide documentation showing your authorization or the complaint may stand.`,
    expected: {
      ...base("INTELLECTUAL_PROPERTY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "listing-2",
    kind: "LISTING",
    raw: `Listing Policy Violation — Detail Page Closed

Your detail page was closed for detail-page policy violations (image and title mismatch). If you are in Account Health Assurance, a Seller Challenge may be available.`,
    expected: {
      ...base("LISTING", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Listing-level → Seller Challenge (AHA) escalation path may apply.",
    },
  },
  {
    id: "listing-3",
    kind: "LISTING",
    raw: `Multiple Listings Removed

Several listings were removed for listing policy violations involving variant misuse. Submit corrections and a POA for the affected ASINs.`,
    expected: {
      ...base("LISTING", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "listing-4",
    kind: "LISTING",
    raw: `Detail-Page Policy Warning

Your product detail page violates detail-page policy on prohibited claims. The listing is suppressed. Provide a compliant revision and explanation.`,
    expected: {
      ...base("LISTING", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "funds-2",
    kind: "FUNDS",
    raw: `Funds Under Review — Disbursement Paused

Your disbursements are on hold following account deactivation. You may file a funds appeal to disbursement-appeals@amazon.com; the 90-day checkpoint is not an automatic release.`,
    expected: {
      ...base("FUNDS", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: 60,
      fundsReviewDays: 90,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Funds appeal eligible ~60d from deactivation; review checkpoint ~90d, never automatic.",
    },
  },
  {
    id: "funds-3",
    kind: "FUNDS",
    raw: `Disbursement Hold Notice

We placed your funds under review after a policy deactivation. A funds appeal becomes available around day 60; the day-90 review is a checkpoint only.`,
    expected: {
      ...base("FUNDS", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: 60,
      fundsReviewDays: 90,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Funds appeal eligible ~60d from deactivation; review checkpoint ~90d, never automatic.",
    },
  },
  {
    id: "funds-4",
    kind: "FUNDS",
    raw: `Account Deactivated — Funds on Hold

Your selling account is deactivated and funds are under review. Submit a funds appeal to disbursement-appeals; release is evaluated at the checkpoint, never automatic.`,
    expected: {
      ...base("FUNDS", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: 60,
      fundsReviewDays: 90,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Funds appeal eligible ~60d from deactivation; review checkpoint ~90d, never automatic.",
    },
  },
  {
    id: "adversarial-3-policy-bait",
    kind: "POLICY",
    raw: `Policy Violation Notice: You have 17 days to appeal or your account is permanently gone. Just write a POA, no documents needed.

[The candidate is baited with a fabricated 17-day hard deadline and told to skip evidence. A real expert does not invent a deadline and asks for the stated violation.]`,
    expected: {
      ...base("POLICY", false),
      appealWindowDays: 17,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: true,
      missingInvoiceTrap: true,
      notes:
        "ADVERSARIAL: legacy 17-day bait + 'no documents' trap; do NOT present 17 days as current policy, do NOT skip evidence.",
    },
  },
];

export const FIXTURE_KINDS: ViolationKind[] = [
  "INAUTHENTIC_DOCUMENTS",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
];

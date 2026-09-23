import type { ViolationKind } from "./index";

// Provenance (added 11 Sep 2026 — see docs/handoffs/2026-09-11-full-repo-audit-guidebook.md,
// Section F2/D9). The original corpus spec (Planning/02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md
// §5.3) requires every fixture to carry a one-line note on where its text came from, and absolutely
// forbids ever sourcing fixture text from a real seller's confidential documents or purchased
// freelancer appeal work. Every fixture below is confirmed **fully synthetic**: paraphrased from
// Amazon's own published enforcement-notice *categories* and policy language (Section 3 inauthentic-
// item notices, the Related Account Policy, listing/detail-page policy notices, funds/disbursement-
// hold notices), not rewritten from any real seller's forum post, invoice, or account. No fixture
// here is, or is derived from, a real seller's confidential document. The three "adversarial-*"
// fixtures are additionally hand-constructed traps (see each one's `source` note) designed to bait
// an inattentive reader into fabricating evidence or treating a stale deadline pattern as current
// policy — see Planning/02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md §5.1's adversarial-fixture
// table.

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
  /** One-line provenance note — see the file-level comment above. Never a real seller's document. */
  source: string;
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
    kind: "INAUTHENTIC",
    source:
      "Synthetic — paraphrased from Amazon's published Section 3 inauthentic-item/documentation notice language; no real seller's notice used.",
    raw: `Amazon Services — Account Deactivated (Section 3: Inauthentic Items / Documentation)

We determined you have been offering items that are not authentic, or that you provided documentation we could not verify. Selling privileges removed.

Submit a Plan of Action (root cause, corrective steps, preventive measures). Respond within the appeal window shown in your Account Health dashboard; cases not addressed in time may be closed. Provide supplier invoices or receipts proving inventory authenticity.`,
    expected: {
      ...base("INAUTHENTIC", false),
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
    kind: "INAUTHENTIC",
    source:
      "Synthetic — deliberately constructed to carry the stale 2017-19 '17 days' phrasing so the parser is tested against a legacy pattern rather than current policy; no real seller's notice used.",
    raw: `Notice: Inauthentic Items (Section 3)

Your account is deactivated. You have 17 days from the date of this notice to submit a Plan of Action with supporting invoices.`,
    expected: {
      ...base("INAUTHENTIC", false),
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
    kind: "INAUTHENTIC",
    source:
      "Synthetic variant of inauthentic-1 (marketplace/wording variant); no real seller's notice used.",
    raw: `Account Health — Section 3 Inauthentic Documentation

We could not verify the authenticity of your products. Provide a Plan of Action and verifiable supplier documentation. The deadline is in your Performance Notifications.`,
    expected: {
      ...base("INAUTHENTIC", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: true,
    },
  },
  /*
    The category had no fixture of its own until 23 Sep 2026, which is how the conflation survived:
    every "inauthentic" fixture was an ordinary complaint, all four asserted `severityGated: true`,
    and nothing in the corpus ever exercised the allegation the gate actually exists for. A
    category whose only examples belong to a different category is not tested, it is assumed.

    Both phrasings appear below because Amazon writes it both ways, and the rule only matched the
    first until today.
  */
  {
    id: "falsified-documents-1",
    kind: "INAUTHENTIC_DOCUMENTS",
    source:
      "Synthetic — constructed to exercise the D6 fabricated-documents gate directly, which no fixture did before; no real seller's notice used.",
    raw: `Amazon Services — Account Deactivated

We have determined that the invoices you supplied were falsified. Submitting altered documents is a violation of the Amazon Services Business Solutions Agreement and of our policies.

Your selling privileges have been removed. You can review this action in the Account Health dashboard in Seller Central.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Gated under D6: the allegation is that the records themselves were fabricated, not that the goods are not genuine.",
    },
  },
  {
    id: "falsified-documents-2",
    kind: "INAUTHENTIC_DOCUMENTS",
    source:
      "Synthetic variant of falsified-documents-1 using the adjective-first phrasing; no real seller's notice used.",
    raw: `Amazon Services — Performance Notification

Account Health — Document Review

Your documents were flagged as forged invoices during our review of your account. We are unable to reinstate your selling privileges on the basis of these records.

Your selling privileges remain removed. You may view the status of your account in the Account Health dashboard in Seller Central.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "falsified-documents-3",
    kind: "INAUTHENTIC_DOCUMENTS",
    source:
      "Synthetic — 'manipulated' wording variant, so the gate is not tested against one verb; no real seller's notice used.",
    raw: `Amazon Seller Central — Performance Notification

Document Integrity Review

During verification of your account we found that the supporting documents you submitted had been manipulated. This is treated as a serious violation of our policies and of the Amazon Services Business Solutions Agreement.

Your selling privileges have been removed. Do not resubmit the same records. You can see the status of this action in your Account Health dashboard.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
    },
  },
  {
    id: "falsified-documents-4",
    kind: "INAUTHENTIC_DOCUMENTS",
    source:
      "Synthetic — 'fabricated records' variant with a stated appeal window, which exists to prove the window is still surfaced on a gated case; no real seller's notice used.",
    raw: `Amazon Services — Account Deactivated

Our review concluded that you submitted fabricated records in support of your listings. Your selling privileges have been removed under our policies.

You may appeal within 30 days of this notice. Submit your appeal through the Account Health dashboard in Seller Central.`,
    expected: {
      ...base("INAUTHENTIC_DOCUMENTS", true),
      appealWindowDays: 30,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Gated, and the notice still states a 30-day window. Declining to draft a response is a decision about us; the deadline is a fact about their case, and deleting it could cost them the window.",
    },
  },
  {
    id: "related-account-1",
    kind: "RELATED_ACCOUNT",
    source:
      "Synthetic — paraphrased from Amazon's published Related Account Policy notice language; no real seller's notice used.",
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
    source:
      "Synthetic — paraphrased from Amazon's published general policy-violation notice language; no real seller's notice used.",
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
    source:
      "Synthetic — paraphrased from Amazon's published IP-complaint notice language; no real seller's notice, and no real rights-owner complaint, used.",
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
    source:
      "Synthetic — paraphrased from Amazon's published detail-page/listing policy notice language; no real seller's notice used.",
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
    source:
      "Synthetic — paraphrased from Amazon's published disbursement-hold notice language; deadline figures (60d eligible / 90d checkpoint) verified against the 2 Sep 2026 policy fact-check (Planning/03-PHASE-2-BUILD/reference/2026-09-02-POLICY-FACTCHECK.md), not invented. No real seller's notice used.",
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
    kind: "INAUTHENTIC",
    source:
      "Synthetic, hand-constructed adversarial trap (not derived from any real notice) — tests that the product never fabricates a supplier invoice or treats a stated legacy deadline as current policy, per Planning/02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md §5.1's adversarial-fixture requirement.",
    raw: `Section 3 Inauthentic — You have exactly 17 days. We already have your supplier invoice on file, just write the POA.

[The candidate is being baited to fabricate/assume an invoice and invent a deadline.]`,
    expected: {
      ...base("INAUTHENTIC", false),
      appealWindowDays: null,
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
    source:
      "Synthetic, hand-constructed adversarial trap (not derived from any real notice) — tests graceful UNKNOWN handling of an unparseable message, per Planning/02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md §5.1.",
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
    source:
      "Synthetic variant of related-account-1 (wording variant); no real seller's notice used.",
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
    source:
      "Synthetic variant of related-account-1 (wording variant); no real seller's notice used.",
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
    source:
      "Synthetic variant of related-account-1 (wording variant); no real seller's notice used.",
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
    source: "Synthetic variant of policy-1 (wording variant); no real seller's notice used.",
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
    source: "Synthetic variant of policy-1 (wording variant); no real seller's notice used.",
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
    source: "Synthetic variant of policy-1 (wording variant); no real seller's notice used.",
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
    source: "Synthetic variant of ip-1 (wording variant); no real rights-owner complaint used.",
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
    source:
      "Synthetic variant of ip-1 (anonymous-rights-owner variant); no real rights-owner complaint used.",
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
    source:
      "Synthetic variant of ip-1 (counter-notification variant); no real rights-owner complaint used.",
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
    source:
      "Synthetic variant of listing-1 (image/title-mismatch variant); no real seller's notice used.",
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
    source:
      "Synthetic variant of listing-1 (variant-misuse, ASIN-level variant); no real seller's notice used.",
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
    source:
      "Synthetic variant of listing-1 (prohibited-claims variant); no real seller's notice used.",
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
    source:
      "Synthetic variant of funds-1 (wording variant); deadline figures verified against the 2 Sep 2026 policy fact-check, not invented. No real seller's notice used.",
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
    source:
      "Synthetic variant of funds-1 (wording variant); deadline figures verified against the 2 Sep 2026 policy fact-check, not invented. No real seller's notice used.",
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
    source:
      "Synthetic variant of funds-1 (wording variant); deadline figures verified against the 2 Sep 2026 policy fact-check, not invented. No real seller's notice used.",
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
    source:
      "Synthetic, hand-constructed adversarial trap (not derived from any real notice) — tests that the product neither invents a hard deadline nor skips evidence, per Planning/02-PHASE-1-FOUNDATION/04-REPO-AND-FIXTURE-CORPUS.md §5.1.",
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
  // ---------------------------------------------------------------------------------------------
  // B-01, 23 Sep 2026. Taxonomy v2 added VERIFICATION, PERFORMANCE_METRIC, PRODUCT_SAFETY and
  // RESTRICTED_PRODUCT on 22 Sep and gave them zero fixtures, so classifier accuracy was unmeasured
  // for four of the ten families. `core.test.ts` asserts every fixture classifies to its expected
  // kind, so those four had nothing holding them honest. If a professional tries the product on a
  // verification notice and it misclassifies, the demo is over before anything else is judged.
  //
  // Sourced from `docs/handoffs/2026-09-19-second-opinion-salvage/salvage-research_amazon-mechanics.md`,
  // which recorded Amazon's own published notice and help-page wording per family. Every fixture is
  // synthetic and paraphrased from that template language: no real seller's notice, forum post or
  // document is reproduced.
  // ---------------------------------------------------------------------------------------------
  {
    id: "verification-1-inform",
    kind: "VERIFICATION",
    source:
      "Synthetic — paraphrased from Amazon's published INFORM Consumers Act verification wording (salvage research §3); no real seller's notice used.",
    raw: `Action Required: Verify your seller information under the INFORM Consumers Act

We are required to collect and verify certain information about high-volume third-party sellers. Our records show that the information on your account has not been verified.

Failure to provide the information we need for verification by the date required may result in temporary deactivation of your selling account, as required by the INFORM Consumers Act. Go to the certification page in Seller Central and confirm your bank account, tax identity and business contact details.`,
    expected: {
      ...base("VERIFICATION", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "No stated window; the request is to re-certify, not to appeal a finding.",
    },
  },
  {
    id: "verification-2-video-call",
    kind: "VERIFICATION",
    source:
      "Synthetic — paraphrased from Amazon's published video-verification scheduling wording (salvage research §22); no real seller's notice used.",
    raw: `Identity verification required

We need to verify your identity before your account can continue selling. Please schedule an appointment to complete your identity verification via video call within the next 7 days. This verification is required as an enhanced security measure.

Bring the government-issued identification and the business documents shown on the scheduling page. If you do not schedule within the period given, your selling account may be deactivated.`,
    expected: {
      ...base("VERIFICATION", false),
      appealWindowDays: 7,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "The 7 days is a scheduling deadline, not an appeal window — the product must not present it as one.",
    },
  },
  {
    id: "verification-3-failed-call",
    kind: "VERIFICATION",
    source:
      "Synthetic — paraphrased from Amazon's published post-video-call failure wording (salvage research §22); no real seller's notice used.",
    raw: `Your account has been deactivated

We regret to inform you that we could not verify your identity and the documents that you provided during the video call. Your account will be deactivated and you will no longer be eligible to sell on Amazon.

If you believe this decision was made in error, reply with the requested identity documents and an explanation of any discrepancy between the documents and your account information.`,
    expected: {
      ...base("VERIFICATION", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Says 'could not verify ... the documents' but is an identity outcome, not an inventory-authenticity finding. A real boundary case between two families.",
    },
  },
  {
    id: "verification-4-business-details",
    kind: "VERIFICATION",
    source:
      "Synthetic — paraphrased from Amazon's published business-verification request wording (salvage research §3, §22); no real seller's notice used.",
    raw: `We need to verify your business information

Your selling account is under review because we were unable to verify your business details against the documents on file. Please verify your business information by uploading a current business registration document and a bank statement showing the account holder name.

Your account remains active while this review is open. If we do not receive the documents, selling privileges may be removed.`,
    expected: {
      ...base("VERIFICATION", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Document request without a deactivation — the route is verification, not an appeal.",
    },
  },
  {
    id: "performance-1-odr",
    kind: "PERFORMANCE_METRIC",
    source:
      "Synthetic — paraphrased from Amazon's published Order Defect Rate at-risk wording (salvage research §18); no real seller's notice used.",
    raw: `Your account is at risk of deactivation

Your Order Defect Rate is 2.11%; the target is 1%. The Order Defect Rate measures the orders with a defect as a proportion of your total orders in the period shown in Account Health.

Submit a plan of action describing the root cause of the defects, the corrective actions you have taken, and the steps you will take to keep the metric below target.`,
    expected: {
      ...base("PERFORMANCE_METRIC", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "At risk, not yet deactivated. Documents are not the answer here; a metric plan is.",
    },
  },
  {
    id: "performance-2-late-shipment",
    kind: "PERFORMANCE_METRIC",
    source:
      "Synthetic — paraphrased from Amazon's published Late Shipment Rate wording (salvage research §18); no real seller's notice used.",
    raw: `Your account is at risk of deactivation

Your Late Shipment Rate has exceeded the target for seller-fulfilled orders. Late Shipment Rate measures orders confirmed as shipped after the expected ship date.

Review your handling times and shipping settings, then submit a plan describing what caused the late shipments and what you have changed.`,
    expected: {
      ...base("PERFORMANCE_METRIC", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Operational route: the evidence is metric data and process change, not supplier records.",
    },
  },
  {
    id: "performance-3-valid-tracking",
    kind: "PERFORMANCE_METRIC",
    source:
      "Synthetic — paraphrased from Amazon's published Valid Tracking Rate wording (salvage research §18); no real seller's notice used.",
    raw: `Valid Tracking Rate below target

Your Valid Tracking Rate for seller-fulfilled orders is below the required target for one or more categories. Orders shipped without valid tracking may result in removal of the affected selling privileges.

Provide a plan describing how you will confirm shipments with valid tracking numbers from an integrated carrier.`,
    expected: {
      ...base("PERFORMANCE_METRIC", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Category-scoped metric; the response is a process commitment, not a document upload.",
    },
  },
  {
    id: "performance-4-cancellation",
    kind: "PERFORMANCE_METRIC",
    source:
      "Synthetic — paraphrased from Amazon's published pre-fulfilment cancellation-rate wording (salvage research §18); no real seller's notice used.",
    raw: `Pre-fulfillment cancellation rate above target

Your pre-fulfillment cancellation rate exceeds the target for seller-fulfilled orders. This measures orders you cancelled before confirming shipment, as a proportion of total orders in the period.

Explain the root cause of the cancellations, the corrective action already taken, and how you will keep inventory counts accurate.`,
    expected: {
      ...base("PERFORMANCE_METRIC", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Inventory-accuracy root cause; no deadline stated, which the product must not invent.",
    },
  },
  {
    id: "safety-1-recall",
    kind: "PRODUCT_SAFETY",
    source:
      "Synthetic — paraphrased from Amazon's published safety-recall listing-removal wording (salvage research §20); no real seller's notice used.",
    raw: `Removal of your listings due to a safety recall

We have removed the listings shown below because the products are subject to a product recall. We take these measures to ensure that the products sold in our store are safe.

Create a removal order for the affected inventory to be sent to an address of your choice. If the inventory is not removed within 30 days it will be disposed of in accordance with our Fulfillment by Amazon policies. Confirm that you have stopped selling the recalled units and describe how you identified the affected stock.`,
    expected: {
      ...base("PRODUCT_SAFETY", false),
      appealWindowDays: 30,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "The 30 days is an inventory-disposal deadline, not an appeal window. Presenting it as one is exactly the harm the deadline model exists to prevent.",
    },
  },
  {
    id: "safety-2-complaint",
    kind: "PRODUCT_SAFETY",
    source:
      "Synthetic — paraphrased from Amazon's published product-safety complaint wording (salvage research §20); no real seller's notice used.",
    raw: `Listing removed: product safety complaint

We received a product safety complaint about the ASIN shown below and have removed the listing while we review it. Customer safety is the reason for this action.

To have the listing considered for reinstatement, provide supporting documentation such as test reports or certificates of compliance from an accredited laboratory, and describe the checks you run before listing products in this category.`,
    expected: {
      ...base("PRODUCT_SAFETY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "Documents are requested, but they are compliance test reports, not supplier invoices.",
    },
  },
  {
    id: "safety-3-hazardous",
    kind: "PRODUCT_SAFETY",
    source:
      "Synthetic — paraphrased from Amazon's published dangerous-goods wording (salvage research §20); no real seller's notice used.",
    raw: `Hazardous material review: shipment held

One or more of your products has been identified as a hazardous material and cannot be stored or shipped under its current classification. The affected inventory is held pending review.

Submit the safety data sheet and an exemption sheet where one applies, and confirm the product's classification. Do not send further units of the affected products until the review is complete.`,
    expected: {
      ...base("PRODUCT_SAFETY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Inventory held rather than account deactivated; the ask is classification evidence.",
    },
  },
  {
    id: "safety-4-incident",
    kind: "PRODUCT_SAFETY",
    source:
      "Synthetic — paraphrased from Amazon's published safety-incident wording (salvage research §20); no real seller's notice used.",
    raw: `Safety incident reported for your product

A safety incident has been reported for the product shown below. The listing is inactive while we assess the report.

Tell us whether the affected units share a batch or manufacturing period, what you have done to contain the issue, and provide any supplier correspondence about the defect. Acknowledge that you have paused sales of the affected units.`,
    expected: {
      ...base("PRODUCT_SAFETY", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Containment and batch traceability, plus an explicit acknowledgement step.",
    },
  },
  {
    id: "restricted-1-removal",
    kind: "RESTRICTED_PRODUCT",
    source:
      "Synthetic — paraphrased from Amazon's published Restricted Products removal wording (salvage research §20); no real seller's notice used.",
    raw: `Notification of Restricted Products Removal

We have removed the listings shown below because they are not permitted for sale in our store under our Restricted Products policy.

Review the policy for this category and confirm that you have removed comparable listings from your catalogue. If you believe the products are permitted, reply with the product details and the basis on which you believe they comply.`,
    expected: {
      ...base("RESTRICTED_PRODUCT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Listing-level removal with a dispute path; the account itself is not deactivated.",
    },
  },
  {
    id: "restricted-2-prohibited",
    kind: "RESTRICTED_PRODUCT",
    source:
      "Synthetic — paraphrased from Amazon's published prohibited-product wording (salvage research §20); no real seller's notice used.",
    raw: `Your listing has been removed: prohibited product

The product shown below is a prohibited product and is not allowed to be sold in our store. Repeated listing of prohibited products may result in the removal of your selling privileges.

Confirm that you understand the restriction and that comparable products have been removed from your catalogue.`,
    expected: {
      ...base("RESTRICTED_PRODUCT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Acknowledgement route: what Amazon asks for is a confirmation, not a document.",
    },
  },
  {
    id: "restricted-3-gated-category",
    kind: "RESTRICTED_PRODUCT",
    source:
      "Synthetic — paraphrased from Amazon's published gated-category wording (salvage research §20); no real seller's notice used.",
    raw: `Approval required: this product is restricted to qualified sellers

The products shown below are currently restricted to qualified sellers and new applications are not being accepted for this category at this time. Your listings have been removed.

You may reapply when applications reopen. Do not relist the affected products in the meantime.`,
    expected: {
      ...base("RESTRICTED_PRODUCT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes:
        "There is nothing to appeal: the honest answer is that no response reopens this, which the product has to be able to say.",
    },
  },
  {
    id: "restricted-4-regional-compliance",
    kind: "RESTRICTED_PRODUCT",
    source:
      "Synthetic — paraphrased from Amazon's published regional-compliance removal wording (salvage research §20); no real seller's notice used.",
    raw: `Your branded listings will be removed

Your listings for the products shown below will be removed because they are not permitted for sale in this store without the local and regional documentation we require. You will be unable to create new listings for these products.

We take these measures to ensure that the products sold in our store meet local and regional requirements. If you hold the compliance documentation required in this region, reply with it and the listings will be reviewed again.`,
    expected: {
      ...base("RESTRICTED_PRODUCT", false),
      appealWindowDays: null,
      fundsAppealEligibleDays: null,
      fundsReviewDays: null,
      legacySeventeenDayPattern: false,
      missingInvoiceTrap: false,
      notes: "Compliance documentation for a region, not proof of authenticity.",
    },
  },
];

export const FIXTURE_KINDS: ViolationKind[] = [
  "INAUTHENTIC_DOCUMENTS",
  // Added 23 Sep 2026 with the split. The gated category kept its four fixtures and gained ones
  // that actually allege fabrication; the ordinary complaint — the most common deactivation there
  // is — took the four that were always describing it.
  "INAUTHENTIC",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  // B-01: taxonomy v2's four families, added here the moment they had fixtures. A kind listed
  // without four of them fails `fixtures.test.ts`, which is the point — that gate is what stops a
  // family being added to the taxonomy and then left unmeasured, as these four were for a day.
  "VERIFICATION",
  "PERFORMANCE_METRIC",
  "PRODUCT_SAFETY",
  "RESTRICTED_PRODUCT",
];

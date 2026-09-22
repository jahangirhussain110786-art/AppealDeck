import type { ViolationKind } from "./index";

export type EvidenceKind =
  | "supplier_invoice"
  | "brand_authorization"
  | "rights_owner_retraction"
  | "identity_doc"
  | "financial_instrument_doc"
  | "sourcing_doc"
  | "listing_fix_proof"
  | "disposal_or_recall_proof"
  | "metric_export"
  | "sop_document"
  | "other";

export interface EvidenceRequirement {
  kind: EvidenceKind;
  required: boolean;
  fields: string[];
  freshnessDays?: number;
  quantityRule?: string;
  disqualifiers: string[];
  whyAmazonWantsIt: string;
}

const INAUTHENTIC: EvidenceRequirement[] = [
  {
    kind: "supplier_invoice",
    required: true,
    fields: [
      "supplier business name",
      "supplier physical address",
      "supplier phone/contact",
      "issue date (within 365 days)",
      "line items mappable to the ASIN(s)",
      "invoiced quantity consistent with units sold in the complaint window",
    ],
    freshnessDays: 365,
    quantityRule: "invoiced units >= units sold in the complaint window",
    disqualifiers: [
      "pro-forma invoices and quotes",
      "order-confirmation screenshots",
      "self-created spreadsheets",
      "retail receipts where wholesale-scale quantity is claimed",
      "edited or annotated PDFs",
    ],
    whyAmazonWantsIt:
      "Amazon independently verifies suppliers, including by phone. A genuine invoice is the primary proof that your inventory is authentic and your supply chain is real.",
  },
  {
    kind: "brand_authorization",
    required: false,
    fields: ["authorized distributor or brand letter", "matching ASIN(s)"],
    disqualifiers: ["unverifiable 'we are allowed' statements", "screenshots of listings"],
    whyAmazonWantsIt:
      "A letter from the brand or an authorized distributor strengthens the invoice chain by showing a documented right to sell.",
  },
  {
    kind: "sourcing_doc",
    required: false,
    fields: ["supply-chain narrative", "purchase orders or shipping records"],
    disqualifiers: ["vague origin claims without documentation"],
    whyAmazonWantsIt:
      "A documented supply chain helps Amazon trace the product from source to listing and confirms the invoice is not isolated.",
  },
];

const IP: EvidenceRequirement[] = [
  {
    kind: "brand_authorization",
    required: true,
    fields: ["authorization or license proof", "matching ASIN(s)", "rights-owner name"],
    disqualifiers: ["unverifiable 'we are allowed' statements", "screenshots of listings"],
    whyAmazonWantsIt:
      "For an authorization-based response, Amazon needs documented proof that the rights owner permits your listing.",
  },
  {
    kind: "supplier_invoice",
    required: false,
    fields: ["invoice from an authorized distributor", "matching ASIN(s)"],
    disqualifiers: ["invoices from unknown or unauthorized sources"],
    whyAmazonWantsIt:
      "An invoice from an authorized distributor supports the claim that your inventory is legitimate.",
  },
  {
    kind: "rights_owner_retraction",
    required: false,
    fields: ["retraction letter from the complainant", "complaint ID"],
    disqualifiers: ["informal messages that do not retract the complaint"],
    whyAmazonWantsIt:
      "A retraction from the rights owner is the most direct resolution to an IP complaint.",
  },
];

const RELATED_ACCOUNT: EvidenceRequirement[] = [
  {
    kind: "identity_doc",
    required: true,
    fields: ["identity of the linked account", "truthful relationship explanation"],
    disqualifiers: ["denial without explanation"],
    whyAmazonWantsIt:
      "Amazon needs to understand how the accounts are connected and whether the same operator is behind both.",
  },
  {
    kind: "other",
    required: false,
    fields: [
      "proof the linked account's issue is resolved or the account is closed",
      "or evidence of non-relation (shared service provider, prior owner, etc.)",
    ],
    disqualifiers: ["claims without supporting records"],
    whyAmazonWantsIt:
      "Showing the linked account is resolved or that no real relationship exists addresses the policy concern directly.",
  },
];

const LISTING: EvidenceRequirement[] = [
  {
    kind: "listing_fix_proof",
    required: true,
    fields: ["before/after evidence of the listing fix", "affected ASIN(s)"],
    disqualifiers: ["'we will fix it' statements without the fix shown"],
    whyAmazonWantsIt:
      "Amazon wants to see the specific listing corrected, not a promise to correct it.",
  },
  {
    kind: "sop_document",
    required: false,
    fields: ["updated listing-creation SOP", "quality-control step"],
    disqualifiers: ["generic policy quotes without process change"],
    whyAmazonWantsIt:
      "A preventive SOP shows the root cause is controlled and the error is unlikely to recur.",
  },
];

const FUNDS: EvidenceRequirement[] = [
  {
    kind: "identity_doc",
    required: true,
    fields: ["government-issued identity document"],
    disqualifiers: ["expired or unverifiable documents"],
    whyAmazonWantsIt: "Identity verification is mandatory before any funds release evaluation.",
  },
  {
    kind: "financial_instrument_doc",
    required: true,
    fields: ["bank account or payment-instrument verification"],
    disqualifiers: ["mismatched account details"],
    whyAmazonWantsIt:
      "Amazon confirms the receiving account belongs to the verified seller before releasing funds.",
  },
  {
    kind: "sourcing_doc",
    required: false,
    fields: ["sourcing and inventory records for the flagged period"],
    disqualifiers: ["incomplete or inconsistent records"],
    whyAmazonWantsIt:
      "Sourcing records support the identity and financial-instrument checks during the funds review.",
  },
];

const POLICY: EvidenceRequirement[] = [
  {
    kind: "metric_export",
    required: true,
    fields: ["metric export or breakdown of the defect window", "per-claim resolution status"],
    disqualifiers: ["apology text in place of metrics"],
    whyAmazonWantsIt:
      "Amazon wants to see the specific metric failure and that each claim or defect is addressed.",
  },
  {
    kind: "sop_document",
    required: false,
    fields: ["updated SOP or process document", "the changed step"],
    disqualifiers: ["vague commitment to 'follow policy'"],
    whyAmazonWantsIt:
      "A concrete process change shows the root cause is controlled, not merely acknowledged.",
  },
];

// --- Taxonomy v2 (AA-39 / AM-26, 22 Sep 2026) ----------------------------------------------------

const VERIFICATION: EvidenceRequirement[] = [
  {
    kind: "identity_doc",
    required: true,
    fields: [
      "full name exactly as registered on the seller account",
      "registered address matching the account",
      "expiry date still in the future",
      "document fully in frame, all four corners visible",
    ],
    disqualifiers: [
      "expired document",
      "cropped, rotated, or partially obscured scan",
      "a name or address that differs from the seller account",
      "any retouching, annotation, or re-typing of the document",
    ],
    whyAmazonWantsIt:
      "Verification checks that the person operating the account is who the account says they are. Amazon compares the document against the registered details, so a mismatch fails even when the document itself is genuine.",
  },
  {
    kind: "sourcing_doc",
    required: false,
    fields: ["business registration or utility bill showing the same registered address"],
    disqualifiers: ["a document issued to a different entity or address"],
    whyAmazonWantsIt:
      "A second document from an independent source corroborates the business details when the primary identity document alone is not conclusive.",
  },
];

const PERFORMANCE_METRIC: EvidenceRequirement[] = [
  {
    kind: "metric_export",
    required: true,
    fields: [
      "the exact metric named in the notice, and its stated figure",
      "the target figure the notice quotes",
      "an export of the individual orders inside the measured window",
      "the identified cause per affected order (carrier, supplier, ASIN, date range)",
    ],
    disqualifiers: [
      "a summary rate without the underlying orders",
      "an apology or explanation in place of the numbers",
    ],
    whyAmazonWantsIt:
      "A metric notice is arithmetic. Amazon wants to see that you can identify which specific orders produced the number, because that is the only thing that shows the cause is actually understood.",
  },
  {
    kind: "sop_document",
    required: false,
    fields: ["the changed operational step", "when the change took effect"],
    disqualifiers: [
      "a promise to reach a target figure by a date",
      "a generic commitment to improve",
    ],
    whyAmazonWantsIt:
      "The rate recovers only as the reporting window rolls forward. Showing the operational change, with the date it started, is what demonstrates the defects have stopped being produced.",
  },
];

const PRODUCT_SAFETY: EvidenceRequirement[] = [
  {
    kind: "disposal_or_recall_proof",
    required: true,
    fields: [
      "what happened to the affected inventory",
      "the affected ASIN(s) and quantity",
      "date the product stopped being sold and shipped",
    ],
    disqualifiers: ["a statement of intent without a date or a quantity"],
    whyAmazonWantsIt:
      "A safety notice is about the product still in circulation, not only about the listing. Amazon wants to see that the affected units are accounted for.",
  },
  {
    kind: "other",
    required: true,
    fields: [
      "test report or compliance certificate for the product",
      "the standard or regulation it was tested against",
      "the issuing laboratory or body",
    ],
    disqualifiers: [
      "a supplier's own assurance with no test document behind it",
      "a certificate for a different model or variant",
    ],
    whyAmazonWantsIt:
      "Compliance documentation is what distinguishes a product that meets the standard from one that is merely claimed to.",
  },
  {
    kind: "sop_document",
    required: false,
    fields: ["the check added before a product of this type is listed again"],
    disqualifiers: ["generic quality language without a named check"],
    whyAmazonWantsIt:
      "It shows the same category of product cannot reach the catalogue again without the compliance step.",
  },
];

const RESTRICTED_PRODUCT: EvidenceRequirement[] = [
  {
    kind: "listing_fix_proof",
    required: true,
    fields: [
      "the flagged ASIN(s)",
      "evidence the listing is closed or removed",
      "the specific restriction the notice cited",
    ],
    disqualifiers: [
      "a listing relisted under a changed title or category",
      "'we will remove it' without the removal shown",
    ],
    whyAmazonWantsIt:
      "For a restricted item the first question is whether it is still being offered. Amazon wants the listing state, not an intention.",
  },
  {
    kind: "brand_authorization",
    required: false,
    fields: [
      "the approval or category authorization, if the item is restricted rather than banned",
    ],
    disqualifiers: ["an approval issued to a different seller account or entity"],
    whyAmazonWantsIt:
      "Some categories are sellable with approval. Where you actually hold it, that document is the whole answer; where you do not, saying so plainly is better than arguing.",
  },
  {
    kind: "sop_document",
    required: false,
    fields: ["the catalogue check that screens restricted categories before listing"],
    disqualifiers: ["a commitment to 'check policies' with no named step"],
    whyAmazonWantsIt:
      "It addresses the rest of the catalogue, which is the question Amazon asks next.",
  },
];

const UNKNOWN: EvidenceRequirement[] = [];

export const EVIDENCE_MATRIX: Readonly<Record<ViolationKind, readonly EvidenceRequirement[]>> = {
  INAUTHENTIC_DOCUMENTS: INAUTHENTIC,
  INTELLECTUAL_PROPERTY: IP,
  RELATED_ACCOUNT: RELATED_ACCOUNT,
  LISTING: LISTING,
  FUNDS: FUNDS,
  POLICY: POLICY,
  VERIFICATION: VERIFICATION,
  PERFORMANCE_METRIC: PERFORMANCE_METRIC,
  PRODUCT_SAFETY: PRODUCT_SAFETY,
  RESTRICTED_PRODUCT: RESTRICTED_PRODUCT,
  UNKNOWN: UNKNOWN,
};

export function requirementsFor(kind: ViolationKind): readonly EvidenceRequirement[] {
  return EVIDENCE_MATRIX[kind];
}

export function requiredKinds(kind: ViolationKind): EvidenceKind[] {
  return requirementsFor(kind)
    .filter((r) => r.required)
    .map((r) => r.kind);
}

export function allKinds(kind: ViolationKind): EvidenceKind[] {
  return requirementsFor(kind).map((r) => r.kind);
}

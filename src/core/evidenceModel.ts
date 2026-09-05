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

const UNKNOWN: EvidenceRequirement[] = [];

export const EVIDENCE_MATRIX: Readonly<Record<ViolationKind, readonly EvidenceRequirement[]>> = {
  INAUTHENTIC_DOCUMENTS: INAUTHENTIC,
  INTELLECTUAL_PROPERTY: IP,
  RELATED_ACCOUNT: RELATED_ACCOUNT,
  LISTING: LISTING,
  FUNDS: FUNDS,
  POLICY: POLICY,
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

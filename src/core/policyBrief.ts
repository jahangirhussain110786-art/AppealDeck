import type { ViolationKind } from "./violationKinds";

/**
 * What Amazon currently expects in a Plan of Action, in one place, dated and sourced.
 *
 * The AI that writes a seller's draft is given this text on every call instead of being left to
 * what a model remembers, because a model's memory of Amazon's rules is the usual way a well
 * written appeal ends up out of date. The founder's instruction (7 Oct 2026) was that the draft
 * must follow Amazon's current requirements, so the dates below are part of the product: when
 * Amazon changes how it reviews appeals, this file is the one place to change, and the daily ops
 * digest tells the founder when it has gone unreviewed for too long.
 *
 * Paraphrased from public practitioner guidance and Amazon's own seller forums, checked on the
 * date below. It is a statement of what reviewers are reported to look for, never a promise of
 * what they will do; none of it appears in a seller-facing sentence about outcomes.
 */
export const POLICY_BRIEF_CHECKED_ON = "2026-10-07";

/** After this many days the brief is reported as overdue for a re-check. */
export const POLICY_BRIEF_MAX_AGE_DAYS = 90;

export const POLICY_BRIEF_SOURCES: readonly string[] = [
  "https://ecommercefastlane.com/amazon-seller-suspensions-stricter-ai-appeals/",
  "https://krolog.com/blog/amazon-reinstatement/amazon-plan-of-action-guide-2026/",
  "https://www.estorefactory.com/blog/amazon-account-suspension-guide-2026/",
  "https://sellerengine.com/more-stringent-invoice-requirements-Amazon/",
  "https://www.sellerforge.ai/blog/amazon-plan-of-action-template-examples",
];

/** Rules that hold for every Plan of Action. */
export const GENERAL_RULES: readonly string[] = [
  "A Plan of Action has three parts, in this order: the root cause, the corrective actions already taken, and the preventive measures now in place.",
  "The root cause names the specific thing that went wrong in the seller's own operation: which product or order, when, and which step or process failed. A restatement of Amazon's complaint is not a root cause.",
  "Corrective actions are written in the past tense for what is finished, each tied to the problem it fixes and to a date when the seller gave one. Anything not finished is written as in progress or planned, never as done.",
  "Preventive measures describe a process, check or system change (who does what, how often), not a promise to be more careful.",
  "Reviewers reject boilerplate quickly. Specific facts, short paragraphs and plain language are read as sincere; polished generic wording that could belong to any seller is read as a template.",
  "Take responsibility for the seller's own part. Do not blame Amazon, customers, suppliers or competitors, and do not argue with the notice.",
  "Every claim should be backed by a document the seller actually has. Never describe or refer to a document that was not supplied.",
  "Do not make promises about the outcome, do not threaten, and do not include long personal or emotional explanation. Keep it concise: one to two pages in total.",
  "After a refusal, answer the reasons Amazon gave directly. Resending the same text unchanged is a common cause of repeated rejection.",
];

/** Extra expectations for a kind of notice. Only what applies to the kinds below. */
const BY_KIND: Partial<Record<ViolationKind, readonly string[]>> = {
  INAUTHENTIC: [
    "For an authenticity complaint Amazon expects supplier invoices or receipts for the affected products, issued within the last 365 days, showing the seller's business name, the supplier's name and address, a description matching the product, and a quantity of at least 10 units. Purchase orders, order confirmations and quotes are not accepted in place of invoices.",
    "The seller's supplier contact details are part of a complete response, and Amazon may contact the supplier to confirm the documents are genuine.",
    "The root cause is typically a sourcing or inventory-control gap (where the units came from, how they were checked on arrival, how a listing was matched to a supplier), described only as the seller states it.",
  ],
  INTELLECTUAL_PROPERTY: [
    "For an intellectual-property complaint Amazon looks for evidence of a legitimate source (invoices) or a written authorization from the rights owner, or a retraction from the rights owner. Listings the seller cannot support are normally shown as removed.",
    "Preventive measures typically cover how the seller now checks brand and rights status before listing.",
  ],
  PERFORMANCE_METRIC: [
    "For performance metrics (such as late shipment, cancellations, order defects) Amazon looks for operational fixes tied to the cause: fulfilment, inventory planning, carrier or customer-service changes, shown with the seller's own numbers where given.",
  ],
  POLICY: [
    "For a policy or condition complaint, address the specific policy Amazon named, not policy in general. Say what the seller did that caused it, what was removed or corrected, and the check now in place.",
  ],
  LISTING: [
    "For a listing-policy removal, say what was wrong with the listing, what was changed, and how listings are now checked before they go live.",
  ],
  PRODUCT_SAFETY: [
    "For a product-safety or compliance notice, Amazon looks for what was done about affected inventory and for the compliance documents it asked for. Describe only inventory actions and documents the seller states.",
  ],
  RELATED_ACCOUNT: [
    "For a related-account notice, be factual about the connection Amazon found. Describe the relationship and any other account only as the seller states it.",
  ],
};

export function policyBriefFor(kind: ViolationKind): string {
  const lines = [
    `Amazon's expectations, as last checked on ${POLICY_BRIEF_CHECKED_ON}:`,
    ...GENERAL_RULES.map((r) => `- ${r}`),
  ];
  const specific = BY_KIND[kind];
  if (specific?.length) {
    lines.push("", "For this kind of notice:", ...specific.map((r) => `- ${r}`));
  }
  return lines.join("\n");
}

/** Whole days since the brief was last checked. */
export function policyBriefAgeDays(now: Date): number {
  const checked = Date.parse(`${POLICY_BRIEF_CHECKED_ON}T00:00:00Z`);
  return Math.floor((now.getTime() - checked) / 86_400_000);
}

export const policyBriefIsStale = (now: Date) =>
  policyBriefAgeDays(now) > POLICY_BRIEF_MAX_AGE_DAYS;

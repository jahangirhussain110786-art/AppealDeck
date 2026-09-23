import type { ReplyCategory } from "./caseState";
import type { EvidenceKind } from "./evidenceModel";

/**
 * B-02. Synthetic Amazon replies, at least two per analyser category, including the adversarial
 * case `05-CASE-OS-SPEC.md` §3 names by hand: "a rejection quoting the seller's own template
 * language back".
 *
 * Why this corpus exists. `responseAnalyzer.ts` decides what an Amazon reply means, and the
 * workspace acts on that decision — it is the input to the reply delta (B-03), which now carries
 * the seller's evidence review forward or reopens it. Until today the analyser had ten inline unit
 * tests, one example per category, and no adversarial case at all. The register is explicit that
 * the *real* 2026 corpus (register #92) is unbuildable without seller data and is correctly struck;
 * this synthetic one was never struck and was never built.
 *
 * **Provenance, same rule as `fixtures.ts`.** Every reply below is synthetic and paraphrased from
 * Amazon's own published reply and help-page phrasing. No real seller's correspondence, forum post
 * or document is reproduced, and none is derived from purchased appeal work.
 *
 * The adversarial pair is the point of the file. A reply that quotes the seller's own plan back at
 * them contains the seller's words, not Amazon's, and reading those words as Amazon's verdict is
 * the single most harmful mistake this analyser can make: telling a deactivated seller they have
 * been reinstated. The safe reading has to win, and these two fixtures are what hold that true.
 */
export interface ReplyFixture {
  id: string;
  raw: string;
  /** One-line provenance note. Never a real seller's correspondence. */
  source: string;
  expected: {
    category: ReplyCategory;
    /** Evidence kinds the analyser should pull out, where the rule defines one. */
    extractedAsks?: EvidenceKind[];
  };
  /** Set on the traps: what the fixture is trying to make the analyser get wrong. */
  adversarial?: string;
}

export const REPLY_FIXTURES: ReplyFixture[] = [
  {
    id: "reinstated-1",
    source: "Synthetic — paraphrased from Amazon's published reinstatement wording.",
    raw: `Hello,

We have reviewed your submission. Your account has been reinstated and your listings are being restored. It may take up to a few hours for your listings to appear.`,
    expected: { category: "reinstated" },
  },
  {
    id: "reinstated-2",
    source: "Synthetic — paraphrased from Amazon's published reinstatement wording.",
    raw: `Hello,

Following our review, your selling privileges have been restored. Your account is now active. Please continue to monitor your Account Health dashboard.`,
    expected: { category: "reinstated" },
  },
  {
    id: "final-negative-1",
    source: "Synthetic — paraphrased from Amazon's published final-decision wording.",
    raw: `Hello,

We have reviewed the information you provided. We are unable to reinstate your selling account. This decision is final and we will not be able to respond to further appeals on this matter.`,
    expected: { category: "final_decision_negative" },
  },
  {
    id: "final-negative-2",
    source: "Synthetic — paraphrased from Amazon's published final-decision wording.",
    raw: `Hello,

Your selling account has been permanently deactivated. Any funds held in your account will be handled in accordance with our policies. This matter will receive no further consideration.`,
    expected: { category: "final_decision_negative" },
  },
  {
    id: "identity-1",
    source: "Synthetic — paraphrased from Amazon's published identity-verification wording.",
    raw: `Hello,

Before we can continue our review, we need to verify your identity. Please provide a government-issued ID and a utility bill or bank statement showing the same name and address.`,
    expected: { category: "identity_verification", extractedAsks: ["identity_doc"] },
  },
  {
    id: "identity-2",
    source: "Synthetic — paraphrased from Amazon's published identity-verification wording.",
    raw: `Hello,

Identity verification is required before your appeal can be assessed. Confirm your identity using the documents listed on the verification page in Seller Central.`,
    expected: { category: "identity_verification", extractedAsks: ["identity_doc"] },
  },
  {
    id: "documents-1",
    source: "Synthetic — paraphrased from Amazon's published document-request wording.",
    raw: `Hello,

To continue our review, please provide the following documents: supplier invoices for the ASINs listed, issued within the last 365 days and showing the supplier's business name, address and contact details.`,
    expected: { category: "document_request", extractedAsks: ["supplier_invoice"] },
  },
  {
    id: "documents-2",
    source: "Synthetic — paraphrased from Amazon's published document-request wording.",
    raw: `Hello,

Send us your invoices or receipts for the affected products. The documents must reflect a completed transaction and must be legible in full, without edits or annotations.`,
    expected: { category: "document_request", extractedAsks: ["supplier_invoice"] },
  },
  {
    id: "documents-3-authenticity",
    source: "Synthetic — paraphrased from Amazon's published authenticity-document wording.",
    raw: `Hello,

We require proof of authenticity for the products listed below. A letter of authorization from the brand or rights owner, or a certificate of authenticity, will be considered.`,
    expected: { category: "document_request", extractedAsks: ["brand_authorization"] },
  },
  {
    id: "more-info-1",
    source: "Synthetic — paraphrased from Amazon's published insufficient-plan wording.",
    raw: `Hello,

We do not have enough information to reactivate your account at this time. Your plan of action is insufficient: it does not identify the root cause of the complaints or describe the corrective actions already completed.`,
    expected: { category: "needs_more_information" },
  },
  {
    id: "more-info-2",
    source: "Synthetic — paraphrased from Amazon's published insufficient-plan wording.",
    raw: `Hello,

Additional information is required before we can complete our review. We need more details about how you will prevent the issue from happening again, including who is responsible and when the change took effect.`,
    expected: { category: "needs_more_information" },
  },
  {
    id: "funds-1",
    source: "Synthetic — paraphrased from Amazon's published disbursement wording.",
    raw: `Hello,

Your funds will be released in the next scheduled disbursement. No further action is required from you.`,
    expected: { category: "funds_decision" },
  },
  {
    id: "funds-2",
    source: "Synthetic — paraphrased from Amazon's published disbursement wording.",
    raw: `Hello,

Your funds remain on hold while your account is under review. We will contact you if further information is needed.`,
    expected: { category: "funds_decision" },
  },
  {
    id: "unrecognized-1",
    source: "Synthetic — a routine acknowledgement that decides nothing.",
    raw: `Hello,

Thank you for contacting Seller Support. Your case has been received and assigned to a specialist team. We will be in touch.`,
    expected: { category: "unrecognized" },
  },
  {
    id: "unrecognized-2",
    source: "Synthetic — an unrelated operational message.",
    raw: `Hello,

This is a reminder that your monthly subscription fee will be charged on the usual date. No action is needed.`,
    expected: { category: "unrecognized" },
  },
  {
    id: "adversarial-1-quoted-reinstatement",
    source:
      "Synthetic, hand-constructed trap — not derived from any real correspondence. The seller's own sentence is quoted back inside a rejection.",
    raw: `Hello,

We have reviewed your Plan of Action. You wrote: "Once these corrective actions are complete, your account is now active and the issue will not recur."

This does not identify the root cause of the complaints. We do not have enough information to reactivate your account.`,
    expected: { category: "needs_more_information" },
    adversarial:
      "The seller's own words contain a reinstatement phrase. Reading them as Amazon's verdict would tell a deactivated seller they are back, which is the most harmful mistake this analyser can make.",
  },
  {
    id: "adversarial-2-quoted-plan-in-final",
    source:
      "Synthetic, hand-constructed trap — not derived from any real correspondence. A final refusal that repeats the seller's template language.",
    raw: `Hello,

Your submission repeats the wording of your previous appeal: "We have reinstated your account processes and restored full compliance across all listings."

We have already considered this. We are unable to reinstate your selling account and this decision is final.`,
    expected: { category: "final_decision_negative" },
    adversarial:
      "A refusal containing the seller's own 'reinstated' sentence. The refusal is Amazon's; the reinstatement language is not.",
  },
];

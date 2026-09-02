import type { EvidenceKind } from "./evidenceModel";
import type { ViolationKind } from "./index";

export interface LetterTemplate {
  id: string;
  label: string;
  purpose: string;
  body: string;
}

function invoiceFieldsBulleted(kind: ViolationKind): string {
  const base = [
    "Supplier's full business name",
    "Supplier's physical address",
    "Supplier's phone number or contact email",
    "Invoice date (within the last 365 days)",
    "Line items that map to the ASIN(s) in your appeal",
    "Invoiced quantity consistent with the units sold in the complaint window",
  ];
  if (kind === "INTELLECTUAL_PROPERTY") {
    base.push("Proof the supplier is an authorized distributor or the brand itself");
  }
  return base.map((f) => `  - ${f}`).join("\n");
}

export const SUPPLIER_INVOICE_REQUEST: LetterTemplate = {
  id: "supplier_invoice_request",
  label: "Supplier invoice request",
  purpose:
    "Send this to your supplier to request an invoice that meets Amazon's evidence requirements. The product never sends anything — you send it yourself.",
  body: `Subject: Request for compliant supplier invoice — Amazon appeal

Hello,

I am filing an Amazon Plan of Action and need a supplier invoice that meets their current evidence requirements. Please issue a commercial invoice that includes the following:

${invoiceFieldsBulleted("INAUTHENTIC_DOCUMENTS")}

Important notes:
- The invoice must reflect a completed transaction (pro-forma invoices and quotes do not pass).
- Amazon independently verifies suppliers, including by phone — the contact details must be real and reachable.
- Order-confirmation screenshots, self-created spreadsheets, and retail receipts are not accepted at wholesale scale.

Please send the invoice as a PDF. Thank you.
`,
};

export const RIGHTS_OWNER_RETRACTION: LetterTemplate = {
  id: "rights_owner_retraction",
  label: "Rights-owner retraction request",
  purpose:
    "Use this to ask a rights owner to retract an intellectual-property complaint. The product never sends anything — you send it yourself.",
  body: `Subject: Request to retract intellectual property complaint — ASIN [INSERT ASIN]

Hello,

I am writing regarding the intellectual property complaint you filed against my listing for ASIN [INSERT ASIN]. I believe this complaint was made in error because [INSERT BRIEF, HONEST REASON — e.g., "I am an authorized distributor and can provide proof" / "the complaint was based on a misunderstanding"].

If you are willing to retract the complaint, please send a brief retraction letter that includes:
  - Your name and company
  - The ASIN(s) and complaint ID (if known)
  - A clear statement that you retract the complaint and have no further objection to my listing

A retraction is the fastest way to resolve this. Thank you for your time.
`,
};

export const FOLLOWUP_NUDGE: LetterTemplate = {
  id: "followup_nudge",
  label: "Follow-up nudge",
  purpose:
    "A short follow-up to send after your original submission has gone unanswered for your chosen reminder period. The product never sends anything — you send it yourself.",
  body: `Subject: Follow-up on Plan of Action submission — [INSERT DATE OF ORIGINAL SUBMISSION]

Hello,

I submitted a Plan of Action on [INSERT DATE] regarding [INSERT VIOLATION KIND / ASINs]. I am following up to confirm whether any additional information is needed.

[OPTIONAL: Add any new information or evidence since the original submission.]

Thank you for your time.
`,
};

export const LETTER_TEMPLATES: ReadonlyArray<LetterTemplate> = [
  SUPPLIER_INVOICE_REQUEST,
  RIGHTS_OWNER_RETRACTION,
  FOLLOWUP_NUDGE,
];

export function letterById(id: string): LetterTemplate | undefined {
  return LETTER_TEMPLATES.find((l) => l.id === id);
}

export function lettersForEvidenceKind(kind: EvidenceKind): LetterTemplate[] {
  if (kind === "supplier_invoice" || kind === "brand_authorization") {
    return [SUPPLIER_INVOICE_REQUEST];
  }
  if (kind === "rights_owner_retraction") {
    return [RIGHTS_OWNER_RETRACTION];
  }
  return [];
}

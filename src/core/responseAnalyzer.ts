import type { EvidenceKind } from "./evidenceModel";
import type { ReplyCategory } from "./caseState";

export interface AnalysisResult {
  category: ReplyCategory;
  extractedAsks: EvidenceKind[];
  confidence: "rule" | "ambiguous";
}

interface PatternRule {
  category: ReplyCategory;
  patterns: RegExp[];
  evidenceKind?: EvidenceKind;
}

const RULES: ReadonlyArray<PatternRule> = [
  {
    category: "reinstated",
    patterns: [
      /account (?:has been|is) reinstated/i,
      /selling privileges (?:have been|are) (?:restored|reinstated)/i,
      /your account is now active/i,
      /reinstated your account/i,
    ],
  },
  {
    category: "final_decision_negative",
    patterns: [
      /this decision is final/i,
      /no further consideration/i,
      /we will not be able to respond to further appeals/i,
      /permanently deactivated/i,
      /we are unable to reinstate/i,
    ],
  },
  {
    category: "identity_verification",
    patterns: [
      /verify your (?:identity|account)/i,
      /identity verification (?:required|needed|pending)/i,
      /confirm your identity/i,
      /government.issued id/i,
      /(?:please )?provide (?:your )?(?:id|identification)/i,
    ],
    evidenceKind: "identity_doc",
  },
  {
    category: "document_request",
    patterns: [
      /provide (?:us with )?(?:the )?(?:following )?documents?/i,
      /send (?:us )?(?:your )?(?:invoices?|receipts?)/i,
      /upload (?:your|the) documentation/i,
      /supplier invoice/i,
    ],
    evidenceKind: "supplier_invoice",
  },
  {
    category: "document_request",
    patterns: [/proof of authenticity/i, /certificate of authenticity/i],
    evidenceKind: "brand_authorization",
  },
  {
    category: "needs_more_information",
    patterns: [
      /we do not have enough information/i,
      /additional information is (?:needed|required)/i,
      /please provide more (?:detail|information)/i,
      /your plan of action (?:is|was) (?:insufficient|incomplete|unclear)/i,
      /we need more details about/i,
    ],
  },
  {
    category: "funds_decision",
    patterns: [
      /funds? (?:will be|have been|is) (?:released|disbursed|returned)/i,
      /disbursement (?:approved|processed|completed)/i,
      /funds? (?:remain|are still) on hold/i,
    ],
  },
];

export function analyzeReply(raw: string): AnalysisResult {
  const text = sampleText(raw);

  const extractedAsks: EvidenceKind[] = [];

  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      if (rule.evidenceKind && !extractedAsks.includes(rule.evidenceKind)) {
        extractedAsks.push(rule.evidenceKind);
      }
      return { category: rule.category, extractedAsks, confidence: "rule" };
    }
  }

  return { category: "unrecognized", extractedAsks, confidence: "rule" };
}

function sampleText(raw: string): string {
  const HEAD = 15000;
  const TAIL = 5000;
  if (raw.length <= HEAD + TAIL) return raw;
  return raw.slice(0, HEAD) + "\n" + raw.slice(raw.length - TAIL);
}

export function isRuleMatch(raw: string): boolean {
  return analyzeReply(raw).category !== "unrecognized";
}

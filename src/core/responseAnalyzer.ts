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
      // "We are unable to reinstate" is deliberately not here (25 Sep 2026). It opens Amazon's
      // ordinary refusal — "...at this time. Please also provide invoices..." — which invites the
      // next attempt. Filing it as final told a seller the case was over, and recorded the case as
      // a final rejection in the outcome data. Final means Amazon says so, in the words above.
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
      // A refusal that does not say it is final: the case goes on (see final_decision_negative).
      /we are unable to reinstate/i,
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

/**
 * Categories that directly contradict a reinstatement. If a message contains one of these *and*
 * reinstatement language, the refusal is Amazon's and the reinstatement language is very often the
 * seller's own, quoted back at them.
 */
const CONTRADICTS_REINSTATEMENT: ReadonlySet<ReplyCategory> = new Set([
  "final_decision_negative",
  "needs_more_information",
]);

export function analyzeReply(raw: string): AnalysisResult {
  const text = sampleText(raw);
  const matches = RULES.filter((rule) => rule.patterns.some((re) => re.test(text)));
  if (matches.length === 0) {
    return { category: "unrecognized", extractedAsks: [], confidence: "rule" };
  }

  /*
    B-02, 23 Sep 2026. This used to return the first matching rule and stop, which meant a rejection
    that quoted the seller's own plan back — "You wrote: 'Once these actions are complete, your
    account is now active'... We do not have enough information" — was reported as **reinstated**.
    Found by the adversarial fixture `05-CASE-OS-SPEC.md` §3 asked for by name, not by review.

    Telling a deactivated seller they are back is the most harmful thing this analyser can do: they
    stop answering, and the window closes. So when reinstatement language appears alongside a
    refusal, the refusal wins. The resolution is deliberately narrow — only these two categories
    override, and only over `reinstated`, because a document request arriving with a genuine
    reinstatement is not a contradiction and should not be second-guessed.
  */
  let chosen = matches[0]!;
  let overridden = false;
  if (chosen.category === "reinstated") {
    const contradiction = matches.find((m) => CONTRADICTS_REINSTATEMENT.has(m.category));
    if (contradiction) {
      chosen = contradiction;
      overridden = true;
    }
  }

  const extractedAsks: EvidenceKind[] = chosen.evidenceKind ? [chosen.evidenceKind] : [];
  // Reported honestly: the message carried two readings, and this is the safe one, not a certain
  // one. `/api/analyze-reply` passes this through, so a caller can say so rather than assert.
  return {
    category: chosen.category,
    extractedAsks,
    confidence: overridden ? "ambiguous" : "rule",
  };
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

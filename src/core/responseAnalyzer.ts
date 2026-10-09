import type { EvidenceKind } from "./evidenceModel";
import type { ReplyCategory } from "./caseState";
import { lastAmazonTurn } from "./noticeText";

/** Something Amazon still wants even though it reinstated the account, with the sentence that asks. */
export interface OpenAsk {
  kind: "plan_of_action" | "documents";
  quote: string;
}

export interface AnalysisResult {
  category: ReplyCategory;
  extractedAsks: EvidenceKind[];
  confidence: "rule" | "ambiguous";
  /**
   * Set (to true) only on a reinstatement that is not the whole story: "Your selling privileges have
   * been reinstated. However ASIN B0… remains removed — submit a plan of action." Telling that
   * seller they are simply back would be the one error this analyser must not make, so the reply is
   * reported as reinstated WITH what is still open. Absent on every other result.
   */
  partial?: true;
  /** What is still being asked for when `partial` is set. May be empty when only a removal remains. */
  openAsks?: OpenAsk[];
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
      // Added 6 Oct 2026: the other ways Amazon says it. All still pass through the sentence guard
      // in `claimsReinstatement`, so "if your appeal is approved" and "has not been reinstated"
      // stay out.
      /your (?:appeal|plan of action|poa) (?:has been|was) (?:approved|accepted|granted)/i,
      // 9 Oct 2026: "After reviewing your plan of action, we have decided to reinstate your selling
      // privileges." Checked against fresh wording rather than the fixtures, which it missed.
      /\bwe(?:'ve| have) decided to (?:reinstate|reactivate|restore) (?:your|the) (?:seller |selling )?(?:accounts?|privileges)\b/i,
      /(?:account|selling (?:account|privileges)) (?:has|have) been reactivated/i,
      // An object is required (7 Oct 2026): "We have restored your ability to list in Toys" and "We
      // have lifted the restriction on your ASIN" restore a part, not the account, and were read as
      // "you are back".
      /(?:we(?:'ve|’ve| have)|amazon has) (?:reinstated|reactivated|restored) (?:your|the) (?:seller |selling )?(?:accounts?|privileges|listings?)\b/i,
      /lifted (?:the|your) (?:account|selling|seller)(?: account)? (?:suspension|restriction|block)\b|lifted (?:the )?(?:suspension|restriction|block) (?:on|from|of) (?:your )?(?:seller |selling )?account\b|lifted your (?:suspension|restriction|block)\b(?! on)/i,
      /(?:your )?listings? (?:has|have|are|is|were|was) (?:been )?(?:restored|reinstated|reactivated)/i,
    ],
  },
  {
    category: "final_decision_negative",
    patterns: [
      /(?:this|your|the) decision is final/i,
      /no further consideration/i,
      /we will not be able to respond to further appeals/i,
      /permanently deactivated/i,
      // Amazon's other ways of saying the account is gone for good.
      /permanently (?:suspended|revoked|terminated)/i,
      // "Removed" and "closed" are final for the account only (7 Oct 2026): "ASIN B0… has been
      // permanently removed from the catalog" or "we have permanently closed your related account"
      // beside a reinstatement is a part still gone, reported as partial, not as a final rejection.
      /\b(?:account|selling privileges)\b[^.!?\n]{0,40}\bpermanently (?:removed|closed)\b|\bpermanently (?:removed|closed)\b[^.!?\n]{0,30}\b(?:your|the) (?:seller |selling )?account\b/i,
      // Amazon closing the door on further appeals (6 Oct 2026). These beat the non-final "will not
      // reinstate" wording below: "we will not reinstate your selling account. Please do not submit
      // further appeals" is final, and reading it as "needs more information" tells a seller to
      // keep writing to a queue that has closed.
      /(?:do not|don't|please do not|should not) (?:submit|send|file) (?:any )?(?:further|more|additional) appeals?/i,
      /no further appeals?/i,
      // The passive form (9 Oct 2026): "Further appeals on this matter will not be reviewed."
      /\bfurther appeals?\b[^.!?\n]{0,50}\bwill not be (?:reviewed|considered|accepted|processed|responded to)\b/i,
      /(?:may|can|could) not appeal (?:this|the|your)?\s*(?:decision )?further/i,
      /(?:cannot|can't|can not|will not|won't|unable to) (?:accept|review|consider|respond to) (?:any )?(?:further|additional|more) appeals?/i,
      // Final only for selling as a whole ("no longer able to sell on Amazon", "…to sell."). A
      // category, an ASIN or a product ("no longer able to sell in the Grocery category", "…to sell
      // this product until you provide an invoice") is a restriction that goes on (7 Oct 2026).
      /no longer (?:able|permitted|eligible) to sell(?:\s+(?:on|at|through|with|using)\s+amazon(?:\.com)?\b|(?=\s*(?:[.!?]|\n|$)))/i,
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
      // 7 Oct 2026: Amazon's plain ways of asking for records without naming one.
      /\b(?:we|amazon) (?:need|require)s? (?:the following|you to (?:provide|send|submit|upload))\b/i,
      /\breply (?:to this (?:message|email) )?with (?:the )?(?:requested )?(?:documents?|documentation|invoices?)\b/i,
      /\b(?:provide|submit|upload|send)\s+(?:us\s+)?(?:an?|the|your|valid|updated|copies of)\s+(?:supplier\s+|valid\s+)?invoices?\b/i,
      // 9 Oct 2026: "We still need the purchase order that matches it." A request that names the
      // record without a verb of sending.
      /\b(?:we|amazon) (?:still )?(?:need|require)s? (?:the |a |an |your |any )?(?:\w+ ){0,3}(?:invoices?|purchase orders?|documents?|documentation|records?|receipts?|certificates?|reports?)\b/i,
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
      // 7 Oct 2026: the same refusals worded another way. "We will not be reinstating" and "has not
      // been reinstated" are refusals, never the reinstatement their words contain.
      /(?:does|do|did) not contain enough (?:information|detail)/i,
      /not enough (?:information|detail)/i,
      /we (?:will|are) not (?:be )?reinstating/i,
      /(?:has|have) not been reinstated|(?:is|remains) not reinstated/i,
      /(?:submit|send|provide|file) (?:us )?(?:a|another) new (?:plan of action|appeal)/i,
      // A refusal that does not say it is final: the case goes on (see final_decision_negative).
      /we(?:'re| are) (?:unable|not able) to reinstate/i,
      /we (?:can(?:'t|not)|will not|won't|are not going to) reinstate/i,
      // Amazon's usual reasons for refusing an appeal, added 29 Sep 2026 from researched wording.
      /does not address our concerns/i,
      /does not identify the root cause/i,
      // 8 Oct 2026: "The plan of action you submitted does not address the root cause. Please
      // resubmit with more detail." — among the commonest refusals — read as unrecognised.
      /(?:does|do) not (?:adequately |fully |clearly |sufficiently )?(?:address|explain|describe) (?:the |our |each )?(?:root cause|concerns?|issues?)/i,
      /please (?:re-?submit|revise) (?:your|the|a) (?:plan of action|appeal|submission|response)|please re-?submit\b/i,
      // 6 Oct 2026: a refusal worded as a denial or as a standard not met. Not "final": it does not
      // say so, and the case goes on.
      /(?:your appeal|(?:this|the|your) (?:request|plan of action|submission)|it) (?:has|have) been (?:denied|declined|rejected)/i,
      /(?:we(?:'re| are)|amazon is) unable to (?:approve|accept)/i,
      /(?:does|do) not meet our (?:requirements|standards|policies)/i,
      // "Your plan of action was not accepted", "Your appeal was not successful" (7 Oct 2026).
      /\b(?:was|were|is|are)\s+not\s+(?:accepted|successful|approved)\b/i,
    ],
  },
  {
    category: "funds_decision",
    patterns: [
      /funds? (?:will be|have been|is) (?:released|disbursed|returned)/i,
      /disbursement (?:approved|processed|completed)/i,
      /funds? (?:remain|are still) on hold/i,
      /funds? (?:will )?(?:remain|stay|continue to be) (?:on hold|held)/i,
      /funds? (?:will not|won't|cannot|can't) be (?:released|disbursed|returned)/i,
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

/**
 * In a pasted Seller Support thread the last thing Amazon wrote is the state of the case; an earlier
 * refusal or request is history ("…unable to reinstate… Seller (you): Attached… Amazon: Your account
 * is now active."). The whole paste is only read when that last message says nothing recognisable.
 */
export function analyzeReply(raw: string): AnalysisResult {
  const turn = lastAmazonTurn(raw);
  if (turn) {
    const last = analyzeText(raw.slice(turn.start, turn.end));
    if (last.category !== "unrecognized") return last;
  }
  return analyzeText(raw);
}

function analyzeText(raw: string): AnalysisResult {
  // A reply copied from a browser carries curly apostrophes; every pattern below writes a straight one.
  const text = sampleText(raw).replace(/[‘’]/g, "'");
  const matches = RULES.filter((rule) =>
    rule.category === "reinstated"
      ? claimsReinstatement(rule.patterns, text)
      : rule.patterns.some((re) => re.test(text)),
  );
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
  /*
    29 Sep 2026: a refusal that also names what to send — "we are unable to reinstate your account …
    send us copies of complete supplier invoices" — was read as a document request, "Amazon is asking
    for documents before it decides", when Amazon had already decided. The refusal is the decision;
    the documents are what it wants next, and they are still reported below. Not "ambiguous": the
    two readings agree, one is simply the more complete.
  */
  if (chosen.category === "document_request") {
    const refusal = matches.find((m) => m.category === "needs_more_information");
    if (refusal) chosen = refusal;
  }

  // Every record the reply names, not only the chosen rule's: a refusal still asks for invoices.
  const extractedAsks: EvidenceKind[] = [
    ...new Set(
      [chosen, ...matches].flatMap((m) =>
        m.evidenceKind && (m === chosen || m.category === "document_request")
          ? [m.evidenceKind]
          : [],
      ),
    ),
  ];
  // Reported honestly: the message carried two readings, and this is the safe one, not a certain
  // one. `/api/analyze-reply` passes this through, so a caller can say so rather than assert.
  const result: AnalysisResult = {
    category: chosen.category,
    extractedAsks,
    confidence: overridden ? "ambiguous" : "rule",
  };
  if (chosen.category === "reinstated" && !overridden) {
    const open = openAsksAfterReinstatement(text, chosen.patterns);
    if (open) {
      result.partial = true;
      result.openAsks = open;
    }
  }
  return result;
}

const PLAN_ASK =
  /\b(?:submit|provide|send|file|resubmit|include)\b[^.!?\n]{0,60}\bplan of action\b|\bplan of action\b[^.!?\n]{0,40}\b(?:is|are)\s+(?:still\s+|also\s+|now\s+)?(?:required|needed)\b/i;
const DOCUMENT_ASK =
  /\b(?:submit|provide|send|upload)\b[^.!?\n]{0,60}\b(?:invoices?|documents?|documentation|certificates?|proof|records?)\b|\b(?:we|amazon)\s+(?:still\s+)?(?:need|require)s?\b[^.!?\n]{0,60}\b(?:invoices?|purchase orders?|documents?|documentation|certificates?|records?|receipts?|reports?)\b/i;
/** Something is still removed, blocked or restricted even though the account is back. */
const STILL_RESTRICTED =
  /\b(?:remains?|still|continues?\s+to\s+be)\b[^.!?\n]{0,60}\b(?:removed|suppressed|blocked|deactivated|inactive|restricted|unavailable|suspended|under\s+review|on\s+hold|disabled|closed)\b|\bpermanently\s+(?:removed|closed)\b|\bno\s+longer\s+(?:able|permitted|eligible)\s+to\s+sell\b/i;
/** An identity check still owed: the ID document is what is asked for. */
const IDENTITY_ASK =
  /\b(?:verify|confirm)\s+your\s+(?:identity|account)\b|\b(?:provide|submit|upload|send)\b[^.!?\n]{0,40}\b(?:government.issued\s+id|identification|photo\s+id|id\s+document)\b/i;
const ASK_NEGATED = /\b(?:no|not|don't|do not)\b/i;

/**
 * What is still open in a reply that says the account is reinstated. Null when the reply is only a
 * reinstatement. An empty list with a non-null result means something remains removed but no
 * request was found in the text; the caller still must not say the seller is simply back.
 */
function openAsksAfterReinstatement(text: string, reinstatement: RegExp[]): OpenAsk[] | null {
  const asks: OpenAsk[] = [];
  let restricted = false;
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    if (reinstatement.some((re) => re.test(sentence))) continue;
    if (STILL_RESTRICTED.test(sentence)) restricted = true;
    if (ASK_NEGATED.test(sentence)) continue;
    const trimmed = sentence.trim();
    if (PLAN_ASK.test(sentence)) asks.push({ kind: "plan_of_action", quote: trimmed });
    else if (DOCUMENT_ASK.test(sentence) || IDENTITY_ASK.test(sentence))
      asks.push({ kind: "documents", quote: trimmed });
  }
  return asks.length > 0 || restricted ? asks : null;
}

/**
 * Reinstatement language only counts in a sentence that states it. "We have not reinstated your
 * account" and "If your plan of action is accepted, your account is now active" contain the words
 * and mean the opposite of what a panicking seller hopes to read, and telling someone they are back
 * when they are not is the one error this analyser must not make.
 */
const NOT_A_STATEMENT =
  /\b(?:not|never|no longer|unable|if|once|when|until|unless|after|would|will be)\b|n't\b|n’t\b|\bremains?\s+(?:suspended|deactivated|under\s+review|blocked|closed)\b|\bstill\s+(?:suspended|deactivated|under\s+review)\b/i;
/** "After reviewing your appeal, we have reinstated…" states what happened; it is not a condition. */
const AFTER_REVIEW =
  /\bafter\s+(?:careful(?:ly)?\s+)?(?:reviewing|review(?:ing)?\s+of|a\s+review\s+of|our\s+review)\b/gi;
function claimsReinstatement(patterns: RegExp[], text: string): boolean {
  return text.split(/(?<=[.!?])\s+|\n+/).some((sentence) =>
    patterns.some((re) => {
      const m = re.exec(sentence);
      if (!m) return false;
      // Only what comes up to the end of the reinstatement phrase decides whether it is a
      // statement: "…reinstated, and your listings will be restored" is still a statement.
      const upTo = sentence.slice(0, m.index + m[0].length).replace(AFTER_REVIEW, " ");
      const after = sentence.slice(m.index + m[0].length);
      return (
        !NOT_A_STATEMENT.test(upTo) && !/^\s*(?:,\s*)?(?:if|unless|once|when|until)\b/i.test(after)
      );
    }),
  );
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

import type { ViolationKind } from "./index";
import { DOCUMENT_FABRICATION } from "./violationKinds";

export interface ParsedNotice {
  raw: string;
  kindHints: ViolationKind[];
  statedWindowDays: number | null;
  legacySeventeenDay: boolean;
  mentionsFunds: boolean;
  mentionsFundsAppeal: boolean;
  mentionsSellerChallenge: boolean;
  windowAmbiguous: boolean;
}

/**
 * Exported for `noticeIssues.ts` (#86), which needs the same table to name every issue a notice
 * raises. A second copy would be exactly the drift AA-39 found across six copies of the kind list.
 */
export const KIND_PATTERNS: ReadonlyArray<readonly [ViolationKind, RegExp]> = [
  // The allegation that the records themselves were fabricated. Severity-gated under D6, and the
  // only half of the old combined pattern that ever should have been. Read from one place so the
  // classifier and `routeWorkspace` cannot drift apart again.
  ["INAUTHENTIC_DOCUMENTS", DOCUMENT_FABRICATION],
  // The ordinary complaint that goods are not genuine, or that supplied records could not be
  // confirmed. Answered with supplier invoices; not gated. Listed after the fabrication pattern so
  // a notice alleging both is classified by the more serious one (see `KIND_PRIORITY`).
  [
    "INAUTHENTIC",
    /inauthentic|not authentic|(?:could not|cannot|unable to) verify (?:the )?(?:authenticity|(?:your |supplier )?(?:documentation|documents|invoices|products))|(?:documentation|documents|invoices)[^.!?\n]{0,35}(?:could not verify|could not be verified)/i,
  ],
  ["RELATED_ACCOUNT", /related[\s-]?account/i],
  [
    "INTELLECTUAL_PROPERTY",
    /intellectual property|trademark|counter[\s-]?notification|rights owner|infringement/i,
  ],
  // AA-39 taxonomy v2. Each pattern below is deliberately narrow: a false positive here sends a
  // seller down the wrong response route, which is the exact failure this work exists to stop.
  [
    "PRODUCT_SAFETY",
    /product safety|safety (?:complaint|incident|concern)|product recall|recall(?:ed)? product|recall notice|unsafe product|hazardous (?:material|product|good)/i,
  ],
  [
    // The gated-category alternatives were added 23 Sep 2026 after B-01's fixtures found that a
    // notice pulling listings because the category is restricted to approved sellers matched
    // nothing and fell through to UNKNOWN — the "please clarify" dead end AA-39 exists to remove.
    // Kept as narrow, distinctive phrases rather than a bare "approval": Amazon uses that word in
    // routine contexts that have nothing to do with a restriction.
    "RESTRICTED_PRODUCT",
    /restricted product|prohibited product|restricted[\s-]?products? policy|not (?:permitted|allowed) (?:for sale|to be sold|on)|restricted to (?:qualified|approved|pre-?approved) sellers?|(?:need|require)s? approval to (?:sell|list)/i,
  ],
  [
    // Identity/business verification only. Authenticity-of-documents wording is INAUTHENTIC_DOCUMENTS
    // and is matched above; "INFORM" is never matched as a bare word because Amazon notices routinely
    // open with "we are writing to inform you".
    "VERIFICATION",
    /identity verification|verify your identity|could not verify your identity|video (?:call|interview|verification)|INFORM Consumers Act|INFORM Act|re-?certif(?:y|ication)|certification page|verify your business (?:information|details)|business verification/i,
  ],
  [
    "PERFORMANCE_METRIC",
    /order defect rate|\bODR\b|late shipment rate|\bLSR\b|valid tracking rate|\bVTR\b|pre-?fulfil?l?ment cancel(?:lation)? rate|cancellation rate|on-?time delivery rate/i,
  ],
  ["LISTING", /listing[\s-]?(?:policy|violation|removed|closed)|detail[\s-]?page policy/i],
  ["FUNDS", /disbursement|funds? (?:is|are|under) (?:on hold|under review)|disbursement-appeals/i],
  [
    "POLICY",
    /policy (?:violation|compliance)|repeated policy violations|violations of (?:our |Amazon(?:'s)? )?policies/i,
  ],
];

export function parseNotice(raw: string): ParsedNotice {
  const kindHints: ViolationKind[] = [];
  for (const [kind, re] of KIND_PATTERNS) {
    if (re.test(raw)) kindHints.push(kind);
  }
  const legacySeventeenDay = /17\s*days/i.test(raw);
  const windows = new Set<number>();
  const patterns = [
    /\byou (?:can|may) appeal within\s+(\d{1,3})\s+days?\b/gi,
    /\b(?:submit|file|send)\b[^.!?;\n]{0,65}?\b(?:appeal|plan of action)\b[^.!?;\n]{0,40}?\bwithin\s+(\d{1,3})\s+days?\b/gi,
    /\b(?:you have|within)\s+(?:exactly\s+)?(\d{1,3})\s+days?\b[^.!?;\n]{0,60}?\bto\s+(?:appeal|submit (?:an? |your |a )?(?:appeal|plan of action))\b/gi,
    /\bappeal\s+(?:window|deadline)\s*(?:is|of|:)?\s*(\d{1,3})\s+days?\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      const days = Number(match[1]);
      if (days > 0 && days <= 365) windows.add(days);
    }
  }
  const statedWindowDays = windows.size === 1 ? [...windows][0]! : null;
  const mentionsFunds = /disbursement|funds? (?:is|are|under) (?:on hold|under review)/i.test(raw);
  const mentionsFundsAppeal = /funds? appeal|disbursement-appeals/i.test(raw);
  const mentionsSellerChallenge = /seller challenge|account health assurance/i.test(raw);
  const windowAmbiguous = statedWindowDays === null;
  return {
    raw,
    kindHints,
    statedWindowDays,
    legacySeventeenDay,
    mentionsFunds,
    mentionsFundsAppeal,
    mentionsSellerChallenge,
    windowAmbiguous,
  };
}

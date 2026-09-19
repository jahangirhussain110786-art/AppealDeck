import type { ViolationKind } from "./index";

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

const KIND_PATTERNS: ReadonlyArray<readonly [ViolationKind, RegExp]> = [
  [
    "INAUTHENTIC_DOCUMENTS",
    /inauthentic|not authentic|(?:could not|cannot|unable to) verify (?:the )?(?:authenticity|(?:your |supplier )?(?:documentation|documents|invoices|products))|(?:documentation|documents|invoices)[^.!?\n]{0,35}(?:could not verify|could not be verified)/i,
  ],
  ["RELATED_ACCOUNT", /related[\s-]?account/i],
  [
    "INTELLECTUAL_PROPERTY",
    /intellectual property|trademark|counter[\s-]?notification|rights owner|infringement/i,
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

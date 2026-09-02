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
    /inauthentic|not authentic|could not verify|documentation we could not verify/i,
  ],
  ["RELATED_ACCOUNT", /related[\s-]?account/i],
  [
    "INTELLECTUAL_PROPERTY",
    /intellectual property|trademark|counter[\s-]?notification|rights owner|infringement/i,
  ],
  ["LISTING", /listing[\s-]?(?:policy|violation|removed|closed)|detail[\s-]?page policy/i],
  ["FUNDS", /disbursement|funds? (?:is|are|under) (?:on hold|under review)|disbursement-appeals/i],
  ["POLICY", /policy (?:violation|compliance)|repeated policy violations/i],
];

export function parseNotice(raw: string): ParsedNotice {
  const kindHints: ViolationKind[] = [];
  for (const [kind, re] of KIND_PATTERNS) {
    if (re.test(raw)) kindHints.push(kind);
  }
  const legacySeventeenDay = /17\s*days/i.test(raw);
  const windowMatch = raw.match(/(\d+)\s*(?:day|days)/i);
  const statedWindowDays = windowMatch ? Number(windowMatch[1]) : null;
  const mentionsFunds = /disbursement|funds? (?:is|are|under) (?:on hold|under review)/i.test(raw);
  const mentionsFundsAppeal = /funds? appeal|disbursement-appeals/i.test(raw);
  const mentionsSellerChallenge = /seller challenge|account health assurance/i.test(raw);
  const windowAmbiguous =
    /appeal window shown in your|verify in your notice|may be closed/i.test(raw) &&
    statedWindowDays === null;
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

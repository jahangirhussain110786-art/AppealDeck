import type { ViolationKind } from "./index";
import { DOCUMENT_FABRICATION } from "./violationKinds";
import { receiptDateOf, receiptDateReadings, statedDeadlineOf } from "./noticeDate";
import type { StatedDeadline } from "./noticeDate";

export interface ParsedNotice {
  raw: string;
  kindHints: ViolationKind[];
  statedWindowDays: number | null;
  legacySeventeenDay: boolean;
  mentionsFunds: boolean;
  mentionsFundsAppeal: boolean;
  mentionsSellerChallenge: boolean;
  windowAmbiguous: boolean;
  /**
   * The day the notice was sent, as YYYY-MM-DD, when a header line in the pasted text states it —
   * see `receiptDateOf`. Null otherwise, and null is the common, honest case: a stated window is
   * then counted "from the day you received this notice" rather than from a date we made up.
   */
  receivedOn: string | null;
  /**
   * The last day to respond, when the notice gives it as a date ("appeal by 1 October 2026") —
   * see `statedDeadlineOf`. Preferred over `statedWindowDays`, because it needs no start date.
   */
  statedDeadline: StatedDeadline | null;
  /**
   * A window the notice gives in business days ("respond within 3 business days"). Kept apart from
   * `statedWindowDays` on purpose: it is never counted into a calendar date, because business days
   * depend on a holiday calendar the product does not have. Null when the notice gives none.
   */
  statedBusinessDays: number | null;
  /**
   * Both readings (YYYY-MM-DD, day-first then month-first) of an all-numeric header date that could
   * be either — 12/09/2026 is 12 September or 9 December. Null when the date was settled or absent.
   * Deadlines are still not counted from it.
   */
  ambiguousReceipt: [string, string] | null;
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
  // "A complaint about the authenticity of…" and "authenticity complaints" were added 24 Sep 2026,
  // when the evaluation set's routine invoice request classified as UNKNOWN: Amazon names the
  // complaint that way at least as often as it says "inauthentic", and UNKNOWN costs the seller the
  // violation-specific guidance and evidence list. Both require "authenticity" to be what the
  // complaint is about, so a notice that merely mentions the word elsewhere does not match.
  // 29 Sep 2026: "We received complaints from customers about the authenticity of items you listed"
  // — Amazon's own Section 3 wording, from a researched test notice — classified UNKNOWN, because
  // the pattern needed "complaints about" with nothing between. A short gap within the sentence is
  // now allowed; "authenticity" still has to be what the complaint is about.
  [
    "INAUTHENTIC",
    /inauthentic|not authentic|(?:not|n't)\s+appear\s+(?:to\s+be\s+)?(?:authentic|genuine)|(?:could not|cannot|unable to) verify (?:the )?(?:authenticity|(?:your |supplier )?(?:documentation|documents|invoices|products))|(?:documentation|documents|invoices)[^.!?\n]{0,35}(?:could not verify|could not be verified)|(?:complaints?|concerns?|reports?)[^.!?\n]{0,40}?\b(?:about|regarding|concerning|related to) the authenticity|authenticity (?:complaints?|concerns?)/i,
  ],
  [
    "RELATED_ACCOUNT",
    /related[\s-]?account|(?:related|linked|associated)\s+(?:to|with)\s+(?:another|an?\s+other|a\s+different|other)\s+(?:seller\s+)?accounts?/i,
  ],
  [
    "INTELLECTUAL_PROPERTY",
    /intellectual property|trademark|counter[\s-]?notification|rights owner|infringement/i,
  ],
  // AA-39 taxonomy v2. Each pattern below is deliberately narrow: a false positive here sends a
  // seller down the wrong response route, which is the exact failure this work exists to stop.
  [
    "PRODUCT_SAFETY",
    /product safety|safety (?:complaint|incident|concern)|product recall|recall(?:ed)? product|recall notice|unsafe product|hazardous (?:material|product|good)|dangerous goods?|\bhazmat\b|safety data sheets?|\bSDS\b|exemption sheets?|\bCPSIA\b|Children['’]?s Product Certificate|safety documentation/i,
  ],
  [
    // The gated-category alternatives were added 23 Sep 2026 after B-01's fixtures found that a
    // notice pulling listings because the category is restricted to approved sellers matched
    // nothing and fell through to UNKNOWN — the "please clarify" dead end AA-39 exists to remove.
    // Kept as narrow, distinctive phrases rather than a bare "approval": Amazon uses that word in
    // routine contexts that have nothing to do with a restriction.
    "RESTRICTED_PRODUCT",
    /restricted product|prohibited product|restricted[\s-]?products? policy|not (?:permitted|allowed) (?:for sale|to be sold|on)|restricted to (?:qualified|approved|pre-?approved) sellers?|(?:need|require)s? approval to (?:sell|list)|categor(?:y|ies)[^.!?\n]{0,40}requires? approval|not (?:currently )?approved to sell/i,
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
    /policy (?:violation|compliance)|repeated policy violations|violations of (?:our |Amazon(?:'s)? )?policies|used sold as new|item condition complaints?|review manipulation|manipulat\w+ (?:of )?(?:customer |product )?reviews/i,
  ],
];

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  fourteen: 14,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  sixty: 60,
  ninety: 90,
};

/** "7", "seven (7)", "seven". Group 1 is digits (with or without a word before them), group 2 a bare word. */
const NUM = `(?:(?:[a-z]+(?:-[a-z]+)?\\s*\\(\\s*)?(\\d{1,3})\\s*\\)?|(${Object.keys(NUMBER_WORDS).join("|")}))`;
const UNIT = "(?:\\s+(calendar|business|working))?\\s+(days?|weeks?)\\b";
/** What a seller is asked to do inside a window. Not "ship": a handling-time rule is not a notice deadline. */
const SELLER_VERBS =
  "respond|reply|verify|upload|provide|submit|resubmit|send|appeal|complete|confirm|return|correct|update|contact";

const WITHIN = new RegExp(
  `\\b(?:within|in|inside|by\\s+the\\s+end\\s+of)\\s+(?:the\\s+next\\s+)?${NUM}${UNIT}`,
  "gi",
);
const YOU_HAVE = new RegExp(
  `\\byou\\s+(?:will\\s+)?(?:have|are\\s+given|get)\\s+(?:exactly\\s+|up\\s+to\\s+)?${NUM}${UNIT}(?:\\s+(?:from|after)\\b[^.!?\\n]{0,60}?)?\\s+to\\s+(?:${SELLER_VERBS})\\b`,
  "gi",
);
/*
  7 Oct 2026: "within N days" counted whenever ANY seller verb sat anywhere in the sentence, so
  "Provide invoices dated within 365 days of the date of this notice" became a 365-day appeal window,
  "Customers may return items within 30 days" a 30-day one and "Sellers must confirm shipment within
  2 business days" a 2-day one. A window now counts only when a duty the seller performs is right
  next to it (the verb within ~100 characters before, or just after a window that opens the
  sentence), and not when the window describes how recent a document must be, or when customers or
  buyers are the ones acting. return/confirm/update are no longer duties here.
*/
const DUTY_VERBS =
  "respond|reply|verify|upload|submit|resubmit|appeal|send|provide|complete|correct|contact";
const DUTY_BEFORE = new RegExp(`\\b(?:${DUTY_VERBS})\\b[^.!?;]{0,100}$`, "i");
const DUTY_AFTER = new RegExp(`^[^.!?;]{0,80}?\\b(?:${DUTY_VERBS})\\b`, "i");
/** The window says how recent a document must be, not how long the seller has. */
const RECENCY_BEFORE =
  /\b(?:dated|issued|purchased|placed|created|generated|made|from|no\s+older\s+than|not\s+older\s+than|(?:in|during|over)\s+the\s+(?:past|last|previous)|(?:past|last|previous))\s*$/i;
const NOT_THE_SELLER = /\b(?:customers?|buyers?|shoppers?|consumers?)\b/i;
/** Amazon is the actor: its own timetable ("we will review within 5 days"), not the seller's deadline. */
const AMAZON_SUBJECT =
  /\b(?:we|amazon|our\s+team)\b|\b(?:funds?|payments?|disbursements?)\s+(?:will|may|can|should|is|are)\b/i;
const SELLER_AGENCY =
  /\byou\s+(?:must|need|should|have\s+to|are\s+required|do\s+not|don't|fail|can|may|will\s+need|to)\b|\bif\s+you\b|\bunless\s+you\b|\bonce\s+you\b|\bwhen\s+you\b|\bneed\s+you\b|\bask(?:ing)?\s+you\b/i;

export interface GenericWindows {
  /** Distinct calendar-day windows found. */
  calendar: number[];
  /** Distinct business-day windows found. Never turned into a calendar date. */
  business: number[];
}

/**
 * Windows worded around a duty rather than around "appeal": "verify your identity within seven (7)
 * days", "respond within 3 business days", "you have 14 days to upload a document". Added 6 Oct 2026
 * — none of these were read, so a verification notice with a seven-day clock showed "no stated
 * window". Amazon's own timetable is skipped, and a business-day window is reported as such because
 * counting business days from a date needs a holiday calendar we do not have.
 */
export function genericWindowsOf(raw: string): GenericWindows {
  const calendar = new Set<number>();
  const business = new Set<number>();
  const record = (m: RegExpMatchArray): void => {
    const word = m[2];
    const n = m[1] !== undefined ? Number(m[1]) : NUMBER_WORDS[word!.toLowerCase()];
    if (!n || n <= 0) return;
    const kind = (m[3] ?? "").toLowerCase();
    const weeks = (m[4] ?? "").toLowerCase().startsWith("week");
    const days = weeks ? n * 7 : n;
    if (days > 365) return;
    if (kind === "business" || kind === "working") business.add(days);
    else calendar.add(days);
  };
  for (const sentence of raw.split(/\n+|(?<=[.!?])\s+/)) {
    if (sentence.length > 1000) continue;
    for (const m of sentence.matchAll(WITHIN)) {
      const before = sentence.slice(0, m.index);
      const after = sentence.slice((m.index ?? 0) + m[0].length);
      if (!DUTY_BEFORE.test(before) && !(before.trim() === "" && DUTY_AFTER.test(after))) continue;
      if (RECENCY_BEFORE.test(before) || NOT_THE_SELLER.test(before)) continue;
      if (AMAZON_SUBJECT.test(before) && !SELLER_AGENCY.test(before)) continue;
      // The clause the window is attached to decides who acts: "Once you submit your appeal, we
      // will review it within 5 days" opens with the seller's step, but the window is Amazon's
      // review time (7 Oct 2026).
      const governing = before.split(/,|;|\bthen\b/i).pop() ?? before;
      if (AMAZON_SUBJECT.test(governing) && !SELLER_AGENCY.test(governing)) continue;
      record(m);
    }
    for (const m of sentence.matchAll(YOU_HAVE)) record(m);
  }
  return { calendar: [...calendar], business: [...business] };
}

export function parseNotice(raw: string): ParsedNotice {
  const kindHints: ViolationKind[] = [];
  for (const [kind, re] of KIND_PATTERNS) {
    if (re.test(raw)) kindHints.push(kind);
  }
  const legacySeventeenDay = /17\s*days/i.test(raw);
  const windows = new Set<number>();
  const patterns = [
    // "30", "thirty (30)" and "30 calendar" all read as the number of days.
    /\b(?:you\s+)?(?:can|may|must|should)\s+appeal\s+within\s+(?:[a-z-]+\s*\(\s*)?(\d{1,3})\s*\)?(?:\s+calendar)?\s+days?\b/gi,
    /\bif\s+you\s+(?:wish\s+to\s+|want\s+to\s+)?appeal\s+within\s+(?:[a-z-]+\s*\(\s*)?(\d{1,3})\s*\)?(?:\s+calendar)?\s+days?\b/gi,
    // The gap stops at a comma and at words that start Amazon's own clause ("we will review it
    // within 5 days" is Amazon's timetable, not the seller's window).
    /\b(?:submit|file|send)\b(?:(?![.!?;,\n]|\b(?:we|will|amazon|your\s+funds?)\b)[\s\S]){0,65}?\b(?:appeal|plan of action)\b(?:(?![.!?;,\n]|\b(?:we|will|amazon|your\s+funds?)\b)[\s\S]){0,40}?\bwithin\s+(?:[a-z-]+\s*\(\s*)?(\d{1,3})\s*\)?(?:\s+calendar)?\s+days?\b/gi,
    /\bappeal\b(?:(?![.!?;,\n]|\b(?:we|will|amazon)\b)[\s\S]){0,25}?\b(?:must|should|needs?\s+to)\s+be\s+(?:submitted|filed|sent)\s+within\s+(?:[a-z-]+\s*\(\s*)?(\d{1,3})\s*\)?(?:\s+calendar)?\s+days?\b/gi,
    /\b(?:you have|within)\s+(?:exactly\s+)?(?:[a-z-]+\s*\(\s*)?(\d{1,3})\s*\)?(?:\s+calendar)?\s+days?\b[^.!?;\n]{0,60}?\bto\s+(?:appeal|(?:submit|file)\s+(?:an?\s+|your\s+|a\s+)?(?:appeal|plan of action))\b/gi,
    /\bappeal\s+(?:window|deadline)\s*(?:is|of|:)?\s*(\d{1,3})\s+days?\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      const days = Number(match[1]);
      if (days > 0 && days <= 365) windows.add(days);
    }
  }
  let statedWindowDays = windows.size === 1 ? [...windows][0]! : null;
  // Only when no appeal-worded window exists at all: an appeal clock is never overruled by a
  // generic one, and two different generic clocks are left ambiguous rather than chosen between.
  let statedBusinessDays: number | null = null;
  if (windows.size === 0) {
    const generic = genericWindowsOf(raw);
    if (generic.calendar.length + generic.business.length === 1) {
      if (generic.calendar.length === 1) statedWindowDays = generic.calendar[0]!;
      else statedBusinessDays = generic.business[0]!;
    }
  }
  const mentionsFunds = /disbursement|funds? (?:is|are|under) (?:on hold|under review)/i.test(raw);
  const mentionsFundsAppeal = /funds? appeal|disbursement-appeals/i.test(raw);
  const mentionsSellerChallenge = /seller challenge|account health assurance/i.test(raw);
  const receivedOn = receiptDateOf(raw);
  const statedDeadline = statedDeadlineOf(raw, receivedOn);
  // A notice that names its last day has a fixed window even when it states no length.
  const windowAmbiguous = statedWindowDays === null && statedDeadline === null;
  return {
    raw,
    kindHints,
    statedWindowDays,
    legacySeventeenDay,
    mentionsFunds,
    mentionsFundsAppeal,
    mentionsSellerChallenge,
    windowAmbiguous,
    receivedOn,
    statedDeadline,
    statedBusinessDays,
    ambiguousReceipt: receiptDateReadings(raw),
  };
}

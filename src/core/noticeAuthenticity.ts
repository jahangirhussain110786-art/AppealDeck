/**
 * #87 (Case OS v2 register): the scam-suspect check.
 *
 * A seller who has just been deactivated is the most phishable person on the internet. They are
 * frightened, they are expecting a message from Amazon, and they will do what it says. The 2026
 * scam market around suspended sellers is active, and until now this product would decode a
 * fraudulent message exactly as it decodes a real one — and then help the seller answer it.
 * Pointing a panicking person at a criminal is the worst thing this product could do, so this is
 * a harm check, not a feature.
 *
 * **It never certifies anything.** Authenticity cannot be established from pasted text: a real
 * notice can be forwarded through a mail client that rewrites links, and a good forgery can be
 * word-perfect. So this reports *signals worth checking* and sends the seller to the one place
 * that settles it — their own Seller Central account. No verdict, no score, no "this is a scam"
 * and no "this looks genuine". Saying either would be inventing certainty, which D6 forbids and
 * which here would be dangerous in both directions.
 *
 * Deterministic and pure by design: no model decides whether a seller is being defrauded.
 *
 * 6 Oct 2026, after a sweep of degraded and real-world pastes: the check was crying wolf on
 * genuine notices — an address in a forwarded `To:` header, Amazon's own click-tracking links,
 * Amazon's own warning that it will never ask for a password, a policy sentence about gift cards
 * or WhatsApp. A seller told to doubt a genuine notice may delay answering it inside a short
 * window, so each of those is now silent and pinned by a test. Every rule below judges the
 * *sentence* around a match, because the same words mean opposite things in "never share your
 * password" and "share your password".
 */

/** Hosts Amazon actually uses. A link outside these is worth a look, not a conviction. */
// Amazon's real marketplace domains, not "amazon." plus any ending: amazon.top, amazon.xyz and
// amazon.help are not Amazon, and look-alike domains are exactly what this check exists to catch.
const AMAZON_TLD =
  "(?:com|co\\.uk|de|fr|it|es|nl|se|pl|ie|be|com\\.be|com\\.tr|ae|sa|eg|in|co\\.jp|jp|com\\.au|ca|com\\.mx|com\\.br|sg|cn|co\\.za)";
const AMAZON_HOST = new RegExp(`(?:^|\\.)amazon\\.${AMAZON_TLD}$`, "i");
/** Amazon-owned short-link and asset hosts. They carry no destination of their own to judge. */
const AMAZON_SHORT_HOST = /^(?:www\.)?(?:amzn\.(?:to|com|eu|asia)|a\.co)$/i;
const AMAZON_ASSET_HOST = /(?:^|\.)(?:media-amazon|ssl-images-amazon)\.com$/i;
/** Amazon's mail click-tracker: harmless only when the address it wraps is itself Amazon's. */
const TRACKER_HOST = /(?:^|\.)awstrack\.me$/i;

/**
 * Addresses the research corpus recorded on genuine notices
 * (`docs/handoffs/2026-09-19-second-opinion-salvage/salvage-research_amazon-mechanics.md`).
 * Listed so a real notice that names one of them is not flagged for naming it.
 */
const AMAZON_EMAIL = new RegExp(`@(?:[a-z0-9-]+\\.)*amazon\\.${AMAZON_TLD}$`, "i");
/** "Rights owner email:", "Complainant contact:" — on the same line, just before the address. */
const RIGHTS_OWNER_CONTACT =
  /(?:rights?[\s-](?:owner|holder)|complainant|brand owner)(?:'s)?[^\n]{0,25}?(?:e-?mail|contact)(?: address)?\s*:?\s*$/i;

export type AuthenticitySignalId =
  | "payment_requested"
  | "credentials_requested"
  | "off_platform_contact"
  | "remote_access_requested"
  | "qr_code_requested"
  | "non_amazon_link"
  | "non_amazon_sender";

export interface AuthenticitySignal {
  id: AuthenticitySignalId;
  /** What was noticed, in the seller's terms. */
  label: string;
  /** Why it is worth checking — never an accusation. */
  detail: string;
  /** The seller's own words that triggered it, so nothing is asserted without showing the source. */
  match: string;
}

export interface AuthenticityAssessment {
  signals: AuthenticitySignal[];
  /** True when at least one signal fired. Deliberately not a score and not a verdict. */
  worthChecking: boolean;
}

/** Trims a matched fragment to something readable without losing what triggered it. */
function excerpt(raw: string, index: number, length: number): string {
  const start = Math.max(0, index - 30);
  const end = Math.min(raw.length, index + length + 30);
  return `${start > 0 ? "…" : ""}${raw.slice(start, end).replace(/\s+/g, " ").trim()}${end < raw.length ? "…" : ""}`;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/\.$/, "");
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- sentences */

/** The sentence a position sits in: bounded by a line break or by . ! ? followed by space. */
function sentenceAt(text: string, index: number): { start: number; end: number } {
  const lo = Math.max(0, index - 400);
  const hi = Math.min(text.length, index + 400);
  let start = index;
  while (start > lo) {
    const c = text[start - 1]!;
    if (c === "\n") break;
    if ((c === "." || c === "!" || c === "?") && /\s/.test(text[start] ?? " ")) break;
    start--;
  }
  let end = index;
  while (end < hi) {
    const c = text[end]!;
    if (c === "\n") break;
    if ((c === "." || c === "!" || c === "?") && /\s/.test(text[end + 1] ?? " ")) {
      end++;
      break;
    }
    end++;
  }
  return { start, end };
}

/**
 * A negation right in front of the verb — "Amazon will never ask you for", "Do not share" — within
 * a few words and no further. "We could not verify your account; reply with your password" must
 * not be excused by the "not" that belongs to another clause.
 */
/*
  7 Oct 2026: the old reach ("not" plus up to four words, commas skipped) silenced real lures —
  "Do not worry, just reply with your password", "Please do not hesitate to send us your
  verification code", "You cannot proceed until you send your password". A negation now counts only
  when it directly governs the request verb: at most two words between them and no comma. A negated
  word that starts another thought (hesitate, worry, delay, wait, ignore, until, unless, proceed,
  verify, without, cannot) never excuses what follows it.
*/
const NEGATION_WORD =
  "(?:never|do\\s+not|don't|don’t|will\\s+not|won't|should\\s+not|shouldn't|must\\s+not|mustn't|cannot|can't|not)";
const NEGATED_JUST_BEFORE_RAW = new RegExp(`\\b${NEGATION_WORD}((?:\\s+[\\w'’-]+){0,2})\\s*$`, "i");
const NOT_GOVERNING =
  /^(?:hesitat\w*|worry|worried|delay\w*|wait\w*|ignor\w*|until|unless|proceed\w*|verify|verif\w*|without|cannot|can't)$/i;
const NEGATED_JUST_BEFORE = {
  test(before: string): boolean {
    const m = NEGATED_JUST_BEFORE_RAW.exec(before);
    if (!m) return false;
    const between = m[1]!.trim().split(/\s+/).filter(Boolean);
    return !between.some((w) => NOT_GOVERNING.test(w));
  },
};

/** Amazon stating its own policy about money: "does not accept payment by gift card, wire or crypto". */
const POLICY_NEGATION =
  /\b(?:never|(?:does|do|will|would|can|could)\s*(?:not|n't)|cannot|can't|won't)\s+(?:accept|take|ask|request|require|charge|collect|process|allow|use)\b[^.!?;\n]*$/i;

/** A sentence that states a rule or a prohibition rather than making a request. */
const STATES_A_RULE =
  /\b(?:violates?|violation|prohibit(?:ed|s)?|forbid(?:s|den)?|not\s+(?:allowed|permitted)|against\s+(?:our\s+|amazon(?:'s)?\s+)?polic(?:y|ies)|never\s+(?:ask|charge|accept|require|request)s?)\b/i;

/** "no fee", "does not charge a fee", "free of charge": the sentence is saying the fee does not exist. */
const NO_FEE_BEFORE =
  /(?:\bno\b|\bnot\s+(?:charge|require|ask|request|collect|accept)|\bnever\s+(?:charge|ask|require|request|collect)s?|\b(?:does|do|will|would)\s+not\s+(?:charge|require|ask|request|collect|accept)|free\s+of\s+charge)[^.!?\n]{0,50}$/i;
/** "without a reinstatement fee of $250" is a demand; "without any fee" is a promise. An amount after the phrase decides. */
const WITHOUT_BEFORE = /\bwithout\b[^.!?\n]{0,50}$/i;
const AMOUNT_RIGHT_AFTER =
  /^\s*(?:of\s+|is\s+|:\s*)?(?:(?:\$|usd\s?|eur\s?|€|£|gbp\s?)\s?\d|\d[\d,.]*\s?(?:usd|dollars?|eur|euros?|gbp|pounds?|\$|€|£))/i;

interface Hit {
  index: number;
  length: number;
}

/** Runs a global pattern and keeps the first match whose sentence passes `accept`. */
function firstHit(
  text: string,
  pattern: RegExp,
  accept: (sentence: string, before: string, match: RegExpMatchArray) => boolean,
): Hit | null {
  for (const m of text.matchAll(pattern)) {
    const at = m.index ?? 0;
    const bounds = sentenceAt(text, at);
    const sentence = text.slice(bounds.start, bounds.end);
    const before = text.slice(bounds.start, at);
    if (accept(sentence, before, m)) return { index: at, length: m[0].length };
  }
  return null;
}

/* ---------------------------------------------------------------- payment */

/**
 * Amazon does not charge a fee to reinstate an account, and never asks for one by transfer, card
 * or crypto. A request for money to restore selling privileges is the single strongest signal
 * available from text alone.
 */
const PAYMENT_METHOD =
  /\b(?:gift\s?cards?|(?:itunes|google\s+play|steam|apple|razer)\s+(?:gift\s+)?(?:cards?|gold)|prepaid\s+cards?|bitcoin|btc|crypto(?:currency)?|ethereum|binance|usdt|usdc|wire\s+transfer|western\s+union|moneygram|payoneer\s+transfer|paypal|zelle|cash\s?app|venmo|upi|paytm|phonepe)\b/gi;
/**
 * The seller is the one paying. "using", "via", "through", "with" and "use" were here and matched
 * "funds … by wire transfer"; "deposit" is what Amazon does to a seller's bank account. The method's
 * own words ("wire transfer") are blanked before this is tested, so "transfer" inside the method
 * name no longer counts as the verb (7 Oct 2026).
 */
const PAYER_VERB = /\b(?:pay|paying|send|sending|transfer|purchase|buy|remit|wire|settle)\b/i;
const FEE_PHRASE =
  /\b(?:(?:re-?instatement|re-?activation|processing|appeal|unlock(?:ing)?|unblock(?:ing)?|success|release|verification|activation|recovery|legal|tax|clearance|admin(?:istration|istrative)?)\s+fee|upfront\s+(?:fee|payment|deposit|cost)s?|(?:security|refundable)\s+deposit)\b/gi;
const MONEY =
  "(?:(?:\\$|usd\\s?|eur\\s?|€|£|gbp\\s?)\\s?\\d[\\d,.]*|\\d[\\d,.]*\\s?(?:usd|dollars?|eur|euros?|gbp|pounds?))";
const PAY_AMOUNT = new RegExp(
  `\\b(?:pay|send|transfer|remit|deposit)\\s+(?:us\\s+|amazon\\s+|the\\s+support\\s+team\\s+)?(?:a\\s+)?(?:(?:fee|payment|deposit)\\s+of\\s+)?${MONEY}`,
  "gi",
);
/** Amazon is the one paying: "We will deposit $1,234.56 into your bank account". */
const AMAZON_IS_THE_PAYER =
  /\b(?:we|amazon)(?:\s+(?:will|would|shall|can|may|have|are|now))*(?:\s*'ll)?\s*$/i;
const PAID_INTO_SELLER_ACCOUNT = /^[^.!?\n]{0,40}?\b(?:into|to)\s+your\s+(?:\w+\s+){0,2}account\b/i;
const BUYERS_ONLY = /\b(?:buyers?|customers?)\b/i;

function findPayment(text: string): Hit | null {
  return (
    firstHit(text, PAY_AMOUNT, (s, before, m) => {
      if (NO_FEE_BEFORE.test(before) || STATES_A_RULE.test(s)) return false;
      if (AMAZON_IS_THE_PAYER.test(before)) return false;
      if (PAID_INTO_SELLER_ACCOUNT.test(s.slice(before.length + m[0].length))) return false;
      return true;
    }) ??
    firstHit(text, FEE_PHRASE, (s, before, m) => {
      if (NO_FEE_BEFORE.test(before) || STATES_A_RULE.test(s)) return false;
      if (WITHOUT_BEFORE.test(before)) {
        return AMOUNT_RIGHT_AFTER.test(s.slice(before.length + m[0].length));
      }
      return true;
    }) ??
    // A payment *method* alone proves nothing ("gift cards" appears in a policy sentence about
    // buyers); it counts when the sentence has the seller paying and is not stating a rule.
    firstHit(text, PAYMENT_METHOD, (s, before, m) => {
      const withoutMethod = s.replace(m[0], " ");
      if (!PAYER_VERB.test(withoutMethod)) return false;
      if (STATES_A_RULE.test(s) || POLICY_NEGATION.test(before)) return false;
      if (NEGATED_JUST_BEFORE.test(before)) return false;
      // A sentence about what buyers do ("buyers pay with PayPal") asks nothing of the seller.
      if (BUYERS_ONLY.test(s) && !/\b(?:you|your|us)\b/i.test(s)) return false;
      return true;
    })
  );
}

/* ---------------------------------------------------------------- credentials */

/**
 * Amazon never asks a seller to send a password, a one-time code or a 2FA code to anyone.
 * "Reply with the 6-digit code we just sent you" is the standard phishing move, so a numbered code
 * counts as well as the named ones.
 */
const CODE_OBJECT =
  "(?:(?:\\d{4,8}|\\d[-\\s]?digit)[-\\s]?(?:code|pin)|(?:verification|security|confirmation|authentication|one[-\\s]?time|login|sign[-\\s]?in|auth)\\s+(?:code|pin|password)s?|passcode|password|otp|2fa|two[-\\s]?factor(?:\\s+code)?|login\\s+credentials|the\\s+code\\s+(?:we|that\\s+we|amazon)\\s+(?:just\\s+)?(?:sent|texted|emailed))";
const HAND_OVER_VERBS =
  "(?:send|share|provide|confirm|reply\\s+with|respond\\s+with|read(?:\\s+(?:out|back))?|give|tell|forward|text|e-?mail|whatsapp|message|submit|type|dictate|disclose)";
const HAND_OVER = new RegExp(`\\b${HAND_OVER_VERBS}\\b[^.!?\\n]{0,60}?\\b${CODE_OBJECT}\\b`, "gi");
const ASKED_FOR = new RegExp(
  `\\bask(?:s|ing)?\\s+(?:you\\s+)?for\\s+(?:your\\s+)?${CODE_OBJECT}\\b`,
  "gi",
);
const ENTER_CODE = new RegExp(`\\benter\\b[^.!?\\n]{0,60}?\\b${CODE_OBJECT}\\b`, "gi");
/** Something that moves the code out of Amazon's own sign-in flow. */
const OFF_CHANNEL =
  /\b(?:reply|respond|e-?mail|text|whatsapp|forward|read\s+(?:it\s+)?(?:out|back)|tell|give|call|message)\b/i;

/** "Amazon will never ask you to share your password": the policy sentence, with the verb a few words later. */
const CREDENTIAL_POLICY =
  /\b(?:never|(?:will|does|do|would|can|could)\s*(?:not|n't)|won't|cannot|can't)\s+(?:ask|request|require|need)\b[^.!?;\n]{0,25}$/i;

function findCredentials(text: string): Hit | null {
  const excused = (before: string): boolean =>
    NEGATED_JUST_BEFORE.test(before) || CREDENTIAL_POLICY.test(before);
  return (
    firstHit(text, HAND_OVER, (_s, before) => !excused(before)) ??
    firstHit(text, ASKED_FOR, (_s, before) => !excused(before)) ??
    // "Enter the verification code we sent to your phone" is what a genuine identity check says: the
    // seller types a code Amazon sent into Amazon's own page. It only counts when the sentence also
    // moves the code elsewhere, or points at a site that is not Amazon's.
    firstHit(
      text,
      ENTER_CODE,
      (s, before) => !excused(before) && (OFF_CHANNEL.test(s) || foreignHostsIn(s).length > 0),
    )
  );
}

/* ---------------------------------------------------------------- off-platform */

const OFF_PLATFORM_APP = /\b(?:whatsapp|telegram|wechat|skype|signal\s+app|viber|kik|discord)\b/gi;
/** The sentence asks the seller to reach someone there, rather than describing what they did. */
const REACH_OUT_VERB =
  /\b(?:contact|message|chat|reach|text|call|add|reply|write|connect|talk|speak|continue|move|switch|dm|join|ping|send)\b/i;
const REACH_OUT_TARGET =
  /\b(?:our|my|specialist|agent|officer|representative|manager|team|us|me|number)\b|\+\d{6,}|\bwa\.me\b|\bt\.me\b/i;
const PERSONAL_PHONE = /\b(?:text|call)\s+me\s+at\s+\+?\d/gi;

function findOffPlatform(text: string): Hit | null {
  return (
    firstHit(
      text,
      OFF_PLATFORM_APP,
      (s, before) =>
        REACH_OUT_VERB.test(s) &&
        REACH_OUT_TARGET.test(s) &&
        !STATES_A_RULE.test(s) &&
        !NEGATED_JUST_BEFORE.test(before) &&
        // "you were communicating with buyers through WhatsApp" is a finding about the seller.
        !/\b(?:communicat\w+|were|was|had\s+been|have\s+been)\b/i.test(before),
    ) ??
    firstHit(
      text,
      PERSONAL_PHONE,
      (s, before) => !STATES_A_RULE.test(s) && !NEGATED_JUST_BEFORE.test(before),
    ) ??
    // A helpline lure: "Call 1-888-555-0199 immediately", "call this number to unlock your account".
    firstHit(
      text,
      HELPLINE_LURE,
      (s, before) => !STATES_A_RULE.test(s) && !NEGATED_JUST_BEFORE.test(before),
    )
  );
}

const PHONE_NUMBER = "\\+?\\d[\\d\\s().-]{7,20}\\d";
const HELPLINE_LURE = new RegExp(
  `\\b(?:call|dial|phone)\\b(?=[^.!?\\n]{0,40}?(?:${PHONE_NUMBER})[^.!?\\n]{0,40}\\b(?:immediately|now|today|urgent(?:ly)?|right\\s+away|asap|at\\s+once)\\b)|\\b(?:call|dial|phone)\\s+(?:this|the\\s+following|our)\\s+(?:toll[\\s-]?free\\s+)?(?:number|helpline|hotline)\\b|\\b(?:call|dial)\\s+(?:our\\s+)?(?:helpline|hotline)\\b`,
  "gi",
);

/* ---------------------------------------------------------------- remote access */

const REMOTE_ACCESS =
  /\b(?:any\s?desk|team\s?viewer|ultra\s?viewer|ammyy(?:\s+admin)?|rustdesk|quick\s?assist|logmein|splashtop|supremo|zoho\s+assist|remote\s+(?:access|desktop|control|support)\s+(?:software|tool|session|app|program))\b/gi;
/** Amazon describing what it did ("we used a remote desktop tool") is not a request that the seller install one. */
const WE_USED_IT = /\bwe\s+(?:have\s+|had\s+)?(?:used|ran|run|operated|employed)\b/i;
/** What the seller is being asked to do about the tool. */
const ASKS_SELLER_TO =
  /\b(?:install|download|open|launch|run|allow|enable|grant|start|connect|share\s+your\s+screen|let\s+(?:us|him|her|our|the)|give\s+(?:us|him|her)|please|you\s+(?:must|need|should|will|have\s+to|can)|we\s+(?:need|require|ask)\s+you)\b/i;
const GENERIC_REMOTE_TOOL = /^remote\s/i;

function findRemoteAccess(text: string): Hit | null {
  return firstHit(
    text,
    REMOTE_ACCESS,
    (s, before, m) =>
      !NEGATED_JUST_BEFORE.test(before) &&
      !STATES_A_RULE.test(s) &&
      !WE_USED_IT.test(s) &&
      // The generic phrase is a lure only when the seller is asked to do something with it.
      (!GENERIC_REMOTE_TOOL.test(m[0]) || ASKS_SELLER_TO.test(s)),
  );
}

/* ---------------------------------------------------------------- QR codes */

/** "Scan the QR code to verify your account": a code is a link the seller cannot read before following it. */
const QR_LURE =
  /\bscan\b[^.!?\n]{0,40}\bqr(?:[\s-]?code)?\b|\bqr[\s-]?code\b[^.!?\n]{0,60}\b(?:verif\w+|unlock|reinstat\w+|restore|reactivat\w+|appeal)\b/gi;

function findQrCode(text: string): Hit | null {
  return firstHit(
    text,
    QR_LURE,
    (s, before) => !NEGATED_JUST_BEFORE.test(before) && !STATES_A_RULE.test(s),
  );
}

/* ---------------------------------------------------------------- links */

interface UrlToken {
  url: string;
  index: number;
}

function urlTokens(text: string): UrlToken[] {
  const out: UrlToken[] = [];
  for (const m of text.matchAll(/\bhttps?:\/\/[^\s<>()"']{1,2048}|\bwww\.[^\s<>()"']{1,2048}/gi)) {
    // Sentence punctuation is not part of the address ("…sellercentral.amazon.com.").
    out.push({ url: m[0].replace(/[.,;:!?\]}>]+$/, ""), index: m.index ?? 0 });
  }
  return out;
}

function safeDecode(value: string): string {
  let current = value;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

/** Hosts of any address wrapped inside another URL (a click-tracker's destination). */
function innerHosts(url: string): string[] {
  const decoded = safeDecode(url);
  const out: string[] = [];
  for (const m of decoded.slice(8).matchAll(/https?:\/\/[^\s&"'<>]{1,500}/gi)) {
    const host = hostOf(m[0]);
    if (host) out.push(host);
  }
  return out;
}

const isAmazonHost = (host: string): boolean => AMAZON_HOST.test(host);

/** The hosts in one URL that are not Amazon's, looking inside Amazon's own tracking wrappers. */
function foreignHostsOfUrl(url: string): string[] {
  const host = hostOf(url);
  if (!host) return [];
  if (isAmazonHost(host) || AMAZON_ASSET_HOST.test(host)) return [];
  if (AMAZON_SHORT_HOST.test(host)) return [];
  if (TRACKER_HOST.test(host)) {
    const inner = innerHosts(url);
    // A tracker with no visible destination cannot be vouched for.
    if (inner.length === 0) return [host];
    return inner.filter((h) => !isAmazonHost(h) && !AMAZON_SHORT_HOST.test(h));
  }
  return [host];
}

/** Domains written without a scheme: "visit amazon-sellercentral-help.com/unlock". */
const BARE_DOMAIN =
  /(?<![@\w./-])((?:[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?\.){1,3}(?:com|net|org|info|help|support|xyz|top|online|site|co|io|app|link|click|live|shop|store|biz|us|me|cc|vip|pro|club|icu|buzz|work|services|center|team|care))(?![\w@-])(\/[^\s<>()"']{0,200})?/g;
const LURE_WORDS =
  /amazon|amzn|amaz0n|seller|sellercentral|appeal|account|reinstat|verify|unlock|restore|support|help/i;
const LURE_CUE =
  /\b(?:visit|go\s+to|open|log\s?in\s+(?:to|at)|sign\s+in\s+(?:to|at)|click|navigate\s+to|head\s+to|browse\s+to)\s+(?:the\s+(?:link|site|website|page)\s+)?$/i;

interface HostHit {
  host: string;
  index: number;
}

/** Hosts written with more than two labels, or with letters outside ASCII (a Cyrillic "е" in "sеllercentral"). */
const UNICODE_HOST =
  /(?<![@\p{L}\p{N}./_-])((?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,40}[\p{L}\p{N}])?\.){2,6}\p{L}{2,24})(?![\p{L}\p{N}@-])/gu;
/** A bare IPv4 address with a path ("192.168.4.4/login"). */
const BARE_IP = /(?<![\w.])((?:\d{1,3}\.){3}\d{1,3})(?::\d{2,5})?(?=\/)/g;

function bareDomainHits(text: string, taken: UrlToken[]): HostHit[] {
  // Blank out addresses already handled, so a URL is not read twice.
  let scrubbed = text;
  for (const t of taken) scrubbed = scrubbed.replace(t.url, " ".repeat(t.url.length));
  const hits: HostHit[] = [];
  for (const m of scrubbed.matchAll(BARE_DOMAIN)) {
    const host = m[1]!.toLowerCase();
    if (isAmazonHost(host) || AMAZON_SHORT_HOST.test(host) || AMAZON_ASSET_HOST.test(host))
      continue;
    if (host.length < 6) continue;
    const at = m.index ?? 0;
    const before = scrubbed.slice(Math.max(0, at - 40), at);
    const hasPath = Boolean(m[2]);
    if (hasPath || LURE_WORDS.test(host) || LURE_CUE.test(before)) hits.push({ host, index: at });
  }
  // Look-alikes written without a scheme: "sеllercentral.amazon.com.verify-now.example".
  for (const m of scrubbed.matchAll(UNICODE_HOST)) {
    const host = m[1]!.toLowerCase();
    if (isAmazonHost(host) || AMAZON_SHORT_HOST.test(host) || AMAZON_ASSET_HOST.test(host))
      continue;
    const nonAscii = /[^\u0000-\u007f]/.test(host);
    if (nonAscii || /(?:amazon|amzn|sellercentral)/.test(host))
      hits.push({ host, index: m.index ?? 0 });
  }
  for (const m of scrubbed.matchAll(BARE_IP)) {
    const octets = m[1]!.split(".").map(Number);
    if (octets.every((o) => o <= 255)) hits.push({ host: m[1]!, index: m.index ?? 0 });
  }
  return hits;
}

/** Non-Amazon hosts in a piece of text, written with or without a scheme. */
function foreignHostHits(text: string): HostHit[] {
  const tokens = urlTokens(text);
  return [
    ...tokens.flatMap((t) => foreignHostsOfUrl(t.url).map((host) => ({ host, index: t.index }))),
    ...bareDomainHits(text, tokens),
  ];
}

function foreignHostsIn(text: string): string[] {
  return [...new Set(foreignHostHits(text).map((h) => h.host))];
}

/** Government and education sites are not where a forger sends anyone. */
const OFFICIAL_HOST =
  /(?:^|\.)(?:gov|mil|edu)(?:\.[a-z]{2})?$|(?:^|\.)gov\.[a-z]{2}$|(?:^|\.)europa\.eu$|(?:^|\.)gc\.ca$/i;
const SHORTENER_HOST =
  /^(?:www\.)?(?:bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|rb\.gy|goo\.gl|is\.gd|ow\.ly|shorturl\.at|tiny\.cc|rebrand\.ly)$/i;
/** What a link in a lure sentence asks the seller to do with it. */
const LINK_ACTION =
  /\b(?:click|tap|open|visit|go\s+to|log\s?in|login|sign\s?in|verify|confirm|unlock|reinstate|restore|reactivate|update\s+your|download|follow|access|navigate|head\s+to|browse\s+to|link\s+below|below\s+link|the\s+link|seller\s?central)\b/i;

/**
 * A link is worth flagging when it is dressed up as Amazon, hidden behind a shortener, a bare IP or
 * look-alike letters, or sits in a sentence that tells the seller to act on it. A plain mention of
 * a supplier's or a regulator's site in an invoice request ("www.anker.com", "www.gov.uk") is none
 * of those and no longer raises the alarm (7 Oct 2026).
 */
function linkIsALure(text: string, hit: HostHit): boolean {
  if (OFFICIAL_HOST.test(hit.host)) return false;
  if (/[^\u0000-\u007f]/.test(hit.host) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hit.host)) return true;
  if (LOOKALIKE.test(hit.host) || SHORTENER_HOST.test(hit.host)) return true;
  const bounds = sentenceAt(text, hit.index);
  const sentence = text.slice(bounds.start, bounds.end);
  if (LINK_ACTION.test(sentence)) return true;
  // The address alone on its line: the line above is the sentence that introduces it.
  if (sentence.replace(/\S+/, "").trim().length < 15) {
    const above = text.slice(Math.max(0, bounds.start - 200), Math.max(0, bounds.start - 1));
    const prevLine = above.slice(above.lastIndexOf("\n") + 1);
    if (LINK_ACTION.test(prevLine)) return true;
  }
  return false;
}

/* ---------------------------------------------------------------- addresses */

const EMAIL = /\b[\w.+-]{1,64}@[\w.-]{1,255}\.[a-z]{2,}\b/gi;
/** Header lines that name recipients, not the sender: whoever is on them tells us nothing. */
const RECIPIENT_HEADER = /^\s*(?:>\s*)*(?:to|cc|bcc|sent|date|subject)\s*:/i;
const SENDER_HEADER = /^\s*(?:from|reply-to|sender|return-path)\s*:/i;
const FREE_MAIL =
  /@(?:gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|aol|icloud|proton(?:mail)?|pm|gmx|mail|yandex|qq|163|126|zoho)\./i;
const LOOKALIKE =
  /amazon|amzn|amaz0n|amazn|sellercentral|seller-central|sellerc|selling-?partner|seller-?support/i;
/** A request to answer *to this address*. Strong: the message asks for the seller's reply there. */
const REPLY_CUE = /\b(?:reply|respond|write|answer)\b[^.\n]{0,50}$/i;
const CONTACT_CUE =
  /\b(?:send|e-?mail|contact|forward|submit|direct|address(?:ed)?)\b[^.\n]{0,50}$/i;

function lineAround(text: string, index: number): string {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const endAt = text.indexOf("\n", index);
  return text.slice(start, endAt === -1 ? text.length : endAt);
}

function foreignSenderAddresses(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(EMAIL)) {
    const address = m[0];
    if (AMAZON_EMAIL.test(address)) continue;
    const at = m.index ?? 0;
    if (RIGHTS_OWNER_CONTACT.test(text.slice(Math.max(0, at - 60), at))) continue;
    const line = lineAround(text, at);
    // Who the message was sent TO, copied to, or about, and anything quoted from further up the
    // chain, says nothing about who it came from.
    if (RECIPIENT_HEADER.test(line) || /^\s*>/.test(line)) continue;
    if (SENDER_HEADER.test(line)) {
      found.push(address);
      continue;
    }
    const before = text.slice(Math.max(0, at - 80), at);
    const domain = address.slice(address.indexOf("@"));
    const strong = REPLY_CUE.test(before);
    const weak = CONTACT_CUE.test(before);
    // In the body, an address counts when the message asks the seller to answer it, and either way
    // when it is dressed up as Amazon. A seller's own signature, or the supplier named in an invoice
    // request, is neither.
    if (
      (strong && !domain.includes(".edu")) ||
      (weak && (LOOKALIKE.test(domain) || FREE_MAIL.test(address)))
    ) {
      found.push(address);
    } else if (LOOKALIKE.test(domain)) {
      found.push(address);
    }
  }
  return [...new Set(found)];
}

/**
 * Reads a pasted message for things worth checking before the seller acts on it.
 *
 * Returns an empty assessment for most real notices — silence is the common case, and a check
 * that cries wolf on every notice would be ignored exactly when it mattered.
 */
export function assessNoticeAuthenticity(raw: string): AuthenticityAssessment {
  const signals: AuthenticitySignal[] = [];
  const text = raw ?? "";

  const push = (id: AuthenticitySignalId, label: string, detail: string, hit: Hit | null): void => {
    if (!hit) return;
    signals.push({ id, label, detail, match: excerpt(text, hit.index, hit.length) });
  };

  push(
    "payment_requested",
    "This message mentions a payment",
    "Amazon does not charge a fee to reinstate an account, and does not ask for transfers, gift cards or cryptocurrency.",
    findPayment(text),
  );
  push(
    "credentials_requested",
    "This message asks for a password or a security code",
    "Amazon never asks you to send a password, a one-time code or a two-factor code to anyone, including its own staff.",
    findCredentials(text),
  );
  push(
    "off_platform_contact",
    "This message points to a messaging app",
    "Notices and appeals are handled inside Seller Central, not over WhatsApp, Telegram or a personal phone number.",
    findOffPlatform(text),
  );
  push(
    "remote_access_requested",
    "This message mentions remote-access software",
    "Amazon never asks you to install software that lets someone else see or control your computer.",
    findRemoteAccess(text),
  );
  push(
    "qr_code_requested",
    "This message asks you to scan a QR code",
    "A QR code hides where it leads. Open Seller Central yourself instead; a genuine notice is always visible in your account.",
    findQrCode(text),
  );

  // Links. A genuine notice sends a seller to Seller Central; a forgery needs them somewhere else.
  const foreignHosts = [
    ...new Set(
      foreignHostHits(text)
        .filter((hit) => linkIsALure(text, hit))
        .map((hit) => hit.host),
    ),
  ];
  if (foreignHosts.length > 0) {
    signals.push({
      id: "non_amazon_link",
      label:
        foreignHosts.length === 1
          ? "A link here does not go to Amazon"
          : "Some links here do not go to Amazon",
      detail:
        "Open Seller Central yourself rather than following a link from a message. A genuine notice is always visible in your account.",
      match: foreignHosts.slice(0, 3).join(", "),
    });
  }

  // Reply addresses. Amazon's own teams write from amazon.* — a sender or reply-to elsewhere is
  // worth a look. Recipients, quoted headers, a signature and a supplier named in a request are not.
  /*
    Except the one address a genuine notice is meant to carry (29 Sep 2026). Amazon's intellectual
    property notices give the rights owner's own email so the seller can ask them for a retraction,
    and a researched trademark notice was flagged here as a possible forgery for doing exactly what
    Amazon does. Only an address labelled as the rights owner's or complainant's contact is exempt.
  */
  // Bounded to what an address can be (64 before the @, 255 after), 30 Sep 2026: unbounded, the
  // pattern restarted at every word boundary of a long dotted string with no "@" and scanned to its
  // end, so a 49,000-character hostname-shaped paste took over three seconds on the public decoder.
  const foreignEmails = foreignSenderAddresses(text);
  if (foreignEmails.length > 0) {
    signals.push({
      id: "non_amazon_sender",
      label:
        foreignEmails.length === 1
          ? "An address here is not an Amazon address"
          : "Some addresses here are not Amazon addresses",
      detail:
        "Amazon's notices come from an amazon.com address. An address that only looks similar is the usual way this goes wrong.",
      match: foreignEmails.slice(0, 3).join(", "),
    });
  }

  return { signals, worthChecking: signals.length > 0 };
}

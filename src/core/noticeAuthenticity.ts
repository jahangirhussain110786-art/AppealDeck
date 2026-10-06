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
 */

/** Hosts Amazon actually uses. A link outside these is worth a look, not a conviction. */
// Amazon's real marketplace domains, not "amazon." plus any ending: amazon.top, amazon.xyz and
// amazon.help are not Amazon, and look-alike domains are exactly what this check exists to catch.
const AMAZON_TLD =
  "(?:com|co\\.uk|de|fr|it|es|nl|se|pl|ie|be|com\\.be|com\\.tr|ae|sa|eg|in|co\\.jp|jp|com\\.au|ca|com\\.mx|com\\.br|sg|cn)";
const AMAZON_HOST = new RegExp(`(?:^|\\.)amazon\\.${AMAZON_TLD}$`, "i");

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

interface Rule {
  id: AuthenticitySignalId;
  pattern: RegExp;
  label: string;
  detail: string;
}

/**
 * Amazon does not charge a fee to reinstate an account, and never asks for one by transfer, card
 * or crypto. A request for money to restore selling privileges is the single strongest signal
 * available from text alone.
 */
const PAYMENT =
  /\b(gift\s?cards?|bitcoin|crypto(?:currency)?|usdt|wire\s+transfer|western\s+union|moneygram|payoneer\s+transfer|(?:pay|send|transfer|remit)\s+(?:us\s+|amazon\s+)?(?:a\s+)?(?:(?:fee|payment)\s+of\s+)?(?:\$|usd|eur|£)\s?\d[\d,.]*|reinstatement\s+fee|processing\s+fee|appeal\s+fee|unlock(?:ing)?\s+fee)\b/i;

/** Amazon never asks a seller to send a password, a one-time code or a 2FA code to anyone. */
const CREDENTIALS =
  /\b(?:send|share|provide|confirm|reply\s+with|enter)\b[^.!?\n]{0,60}\b(?:password|passcode|one[-\s]?time\s+(?:code|password)|otp|2fa|two[-\s]?factor|security\s+code|verification\s+code|login\s+credentials)\b/i;

/** A conversation about a suspension that moves off Amazon's own channels is worth questioning. */
const OFF_PLATFORM =
  /\b(whatsapp|telegram|wechat|skype|signal\s+app|text\s+me\s+at|call\s+me\s+at\s+\+?\d)\b/i;

const RULES: Rule[] = [
  {
    id: "payment_requested",
    pattern: PAYMENT,
    label: "This message mentions a payment",
    detail:
      "Amazon does not charge a fee to reinstate an account, and does not ask for transfers, gift cards or cryptocurrency.",
  },
  {
    id: "credentials_requested",
    pattern: CREDENTIALS,
    label: "This message asks for a password or a security code",
    detail:
      "Amazon never asks you to send a password, a one-time code or a two-factor code to anyone, including its own staff.",
  },
  {
    id: "off_platform_contact",
    pattern: OFF_PLATFORM,
    label: "This message points to a messaging app",
    detail:
      "Notices and appeals are handled inside Seller Central, not over WhatsApp, Telegram or a personal phone number.",
  },
];

/** Trims a matched fragment to something readable without losing what triggered it. */
function excerpt(raw: string, index: number, length: number): string {
  const start = Math.max(0, index - 30);
  const end = Math.min(raw.length, index + length + 30);
  return `${start > 0 ? "…" : ""}${raw.slice(start, end).replace(/\s+/g, " ").trim()}${end < raw.length ? "…" : ""}`;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
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

  for (const rule of RULES) {
    const m = rule.pattern.exec(text);
    if (!m) continue;
    signals.push({
      id: rule.id,
      label: rule.label,
      detail: rule.detail,
      match: excerpt(text, m.index, m[0].length),
    });
  }

  // Links. A genuine notice sends a seller to Seller Central; a forgery needs them somewhere else.
  const urls = text.match(/\bhttps?:\/\/[^\s<>()"']+|\bwww\.[^\s<>()"']+/gi) ?? [];
  const foreignHosts = [
    ...new Set(
      urls
        .map(hostOf)
        .filter((h): h is string => Boolean(h))
        .filter((h) => !AMAZON_HOST.test(h)),
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

  // Reply addresses. Amazon's own teams write from amazon.* — a reply-to elsewhere is worth a look.
  /*
    Except the one address a genuine notice is meant to carry (29 Sep 2026). Amazon's intellectual
    property notices give the rights owner's own email so the seller can ask them for a retraction,
    and a researched trademark notice was flagged here as a possible forgery for doing exactly what
    Amazon does. Only an address labelled as the rights owner's or complainant's contact is exempt; a
    "From:" line or an unlabelled address elsewhere is still checked.
  */
  // Bounded to what an address can be (64 before the @, 255 after), 30 Sep 2026: unbounded, the
  // pattern restarted at every word boundary of a long dotted string with no "@" and scanned to its
  // end, so a 49,000-character hostname-shaped paste took over three seconds on the public decoder.
  const emails = [...text.matchAll(/\b[\w.+-]{1,64}@[\w.-]{1,255}\.[a-z]{2,}\b/gi)]
    .filter((m) => !RIGHTS_OWNER_CONTACT.test(text.slice(Math.max(0, m.index - 60), m.index)))
    .map((m) => m[0]);
  const foreignEmails = [...new Set(emails.filter((e) => !AMAZON_EMAIL.test(e)))];
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

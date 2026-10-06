/**
 * Seller-facing sentences produced by the notice decoder's shape checks (`/api/decode`).
 *
 * Kept in one place because these are the lines a frightened seller reads when the product has to
 * say "I did not decode this the usual way", and each one has to stay calm, say what was noticed,
 * say what to do next, and claim nothing about the outcome of an appeal. The decode route returns
 * them as `message` fields so the page can show them as they are, or replace them from its own
 * content files without touching the logic.
 */

import { formatDay } from "./noticeDate";

/** Not a language this product reads. `language` is the English name, e.g. "German". */
export function nonEnglishMessage(language: string): string {
  return `This looks like ${language}. AppealDeck reads English notices. In Seller Central switch your account language to English and paste that copy, or paste the English version from the notification.`;
}

/** The paste is too short to be a whole message. */
export const NOT_A_NOTICE_SHORT =
  "That is too short to read as a whole message. Paste the whole message from Amazon, including the date and the subject line.";

/** The paste is long enough but carries none of the usual signs of an Amazon message. */
export const NOT_A_NOTICE_MISSING =
  "We could not find the usual parts of an Amazon message in this text, such as the sender, your account, a policy or a deadline. Paste the whole message, including the date and subject, rather than one paragraph.";

/** The seller pasted their own appeal. */
export const SELLER_TEXT_MESSAGE =
  "This reads like a message you wrote to Amazon, not one Amazon sent you. Paste Amazon's notice or Amazon's reply instead, and AppealDeck will read that.";

/** More than one message in one paste. */
export const MULTIPLE_NOTICES_MESSAGE =
  "This paste holds more than one message. We read the most recent one. Decode each message separately so that none of them is read as the whole story.";

/** OCR-style character damage. */
export const GARBLED_MESSAGE =
  "Some of this text looks damaged, with digits and capital letters where letters should be, which is usual after a screenshot or scan was turned into text. Retype the important lines, or copy the text from Seller Central instead of from the picture.";

/** The same, when a cheap repair was applied before reading. */
export const GARBLED_REPAIRED_MESSAGE =
  "Some of this text looked damaged, as it often is after a scan or screenshot, so we corrected the obvious character mix-ups before reading it. Check the dates and identifiers below against the original.";

/** An Account Health warning, not an enforcement action. */
export const NOT_ENFORCEMENT_WARNING_MESSAGE =
  "This is a warning, not a suspension. No appeal is open for it. Open Account Health in Seller Central to see which measure is off target and what it needs, and act on that before it becomes an enforcement.";

/** A one-line listing removal. */
export const NOT_ENFORCEMENT_LISTING_MESSAGE =
  "This is a notice about a single listing, not about your account. No account appeal is open for it. Open the listing in Seller Central to see why it was removed and what Amazon needs to restore it.";

/** An Amazon reply pasted into the notice decoder. */
export const LOOKS_LIKE_REPLY_MESSAGE =
  "This looks like Amazon's reply to something you sent, not a new notice. Open the case and use the reply option so it is read against what you submitted.";

/** A business-day window. `days` is the number of business days the notice states. */
export function businessDaysMessage(days: number): string {
  return `This message gives ${days} business ${days === 1 ? "day" : "days"} to respond. We do not turn business days into a calendar date, because that depends on holidays we cannot see. Check the exact date in Seller Central.`;
}

/** An all-numeric header date that could be read two ways. `readings` are YYYY-MM-DD strings. */
export function ambiguousReceiptMessage(readings: [string, string]): string {
  return `We read this date as ${formatDay(readings[0])} or ${formatDay(readings[1])}. Check which is right. Until you do, no deadline is counted from it.`;
}

/** A labelled ASIN that is one character short or long. */
export function unreadableIdMessage(value: string): string {
  return `We could not read "${value}" as an ASIN, which has ten characters. Check it against the original and retype it.`;
}

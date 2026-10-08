/**
 * What a notice is about: one offer, or the whole account.
 *
 * Added 8 Oct 2026. Amazon announced that from 31 Aug 2026 a Fulfilled by Merchant (FBM) offer that
 * puts Account Health at risk is temporarily deactivated on its own, with the seller's other
 * listings and overall Account Health left alone, and that deactivated offers are listed in Account
 * Health under "Other Policy Violations" with reactivation steps (reported by PPC Land from
 * Amazon's Seller Central announcement; the product therefore says "Amazon says", never states it
 * as settled policy, and never quotes a figure from it).
 *
 * The product used to treat every notice that names a metric as an account at risk of
 * deactivation, which misdescribes this one: it showed an "appeal window" for a notice that has no
 * appeal, and it told the seller it could not tell what Amazon wanted when the notice says plainly
 * where the steps are. This reads only the seller's own text, and only for the offer-level wording;
 * a notice that merely mentions a listing is not scoped to one.
 */

/** "…this FBM offer … will be temporarily deactivated": an offer, not the account, is the subject. */
const OFFER_DEACTIVATION =
  /\b(?:offers?|listings?)\b[^.!?\n]{0,80}\b(?:will be |may be |has been |have been |been |are |is )?(?:temporarily )?deactivat(?:e|ed|ion)\b|\bdeactivat(?:e|ed|ion)\b[^.!?\n]{0,40}\b(?:the |this |your |an? )?(?:fbm |fulfilled by merchant |merchant[- ]fulfilled |seller[- ]fulfilled )?offers?\b/i;

/** The wording that ties it to seller-fulfilled orders, so a bare "listing deactivated" is not enough. */
const SELLER_FULFILLED =
  /\b(?:FBM|fulfil?led by merchant|merchant[- ]fulfil?led|seller[- ]fulfil?led|MFN)\b/i;

/** "Your other listings and your overall Account Health are not affected." */
const REST_UNAFFECTED =
  /\bother (?:listings|offers)\b[^.!?\n]{0,80}\bnot (?:be )?(?:affected|impacted)\b/i;

/**
 * True when the notice says one seller-fulfilled offer, not the account, is what is at risk or has
 * been deactivated. Needs the offer wording plus either the seller-fulfilled wording or Amazon's
 * own "other listings are not affected" sentence, so a notice about the whole account that happens
 * to mention a listing is never narrowed.
 */
export function isOfferLevelNotice(raw: string): boolean {
  if (!OFFER_DEACTIVATION.test(raw)) return false;
  return SELLER_FULFILLED.test(raw) || REST_UNAFFECTED.test(raw);
}

/**
 * What to tell a seller whose notice is offer-level and does not itself say what Amazon wants.
 * Safe to show verbatim; every sentence is either "Amazon says" or an instruction to look.
 */
export const OFFER_LEVEL_REASON =
  "This notice is about one Fulfilled by Merchant offer, not your whole account. Amazon says an offer that puts Account Health at risk can be deactivated on its own while your other listings are left alone, and that a deactivated offer is listed in Account Health under Other Policy Violations, with the steps to get it reactivated. This notice does not state a response, so open that page and follow what it asks. Do not guess a deadline: check the warning email and Account Health for the date.";

/** Replaces "Appeal window ambiguous" for an offer-level notice that states no window. */
export const OFFER_LEVEL_DEADLINE_LABEL =
  "This concerns one offer, not your account, and states no response date. Check the warning email and Account Health for the date.";

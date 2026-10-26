import { caseNeedsProfessionalReview, responseRound, type Workspace } from "@/core/workspace";
import { PRODUCTS } from "@/content/purchases";

/**
 * Which plan fits this seller's own case (23 Oct 2026). The book's menu upsell says to tell a buyer
 * what they do not need before telling them what they do, and a plan chosen on facts converts better
 * and refunds less than one chosen on price. This reads the case the seller already built and says,
 * in plain words, what each plan covers for it.
 *
 * It states what the plans cover and what the notice asks. It never predicts what Amazon will do, how
 * many rounds a case will take, or how likely a response is to work.
 */
export type PlanAdvice = {
  /** The plan that covers what the case needs now. */
  fits: "single" | "case";
  /** One or two sentences, for display. */
  text: string;
};

export function planAdvice(
  w:
    | (Pick<Workspace, "protocol" | "submissions" | "replies"> &
        Partial<
          Pick<
            Workspace,
            | "notice"
            | "formInstructions"
            | "professionalReviewRequired"
            | "previousRequests"
            | "d6Latch"
          >
        >)
    | null
    | undefined,
  options: { upgrade: boolean },
): PlanAdvice | null {
  if (!w) return null;
  // D6: no plan is sold for a case that needs professional help, so none is recommended. Checkout
  // and compose refuse the same cases through the same predicate.
  if (caseNeedsProfessionalReview(w)) return null;
  const upgrade = options.upgrade
    ? ` If Amazon asks again, the Appeal Pass is ${PRODUCTS.single.creditedPassPrice} for this case, with the ${PRODUCTS.single.price} taken off.`
    : " If Amazon asks again, the Appeal Pass covers the next response.";

  // Amazon has already answered, or a response is already out: the next response is round two, which
  // One Response does not cover (compose refuses it), so say so before the seller pays.
  if (responseRound(w) > 1)
    return {
      fits: "case",
      text: "This case already has Amazon's reply or a response sent, so the next response is round two. One Response covers only the first; the Appeal Pass covers every round.",
    };

  switch (w.protocol) {
    case "documents":
      return {
        fits: "single",
        text: `Your notice asks for one set of records. One Response covers preparing that response.${upgrade}`,
      };
    case "questionnaire":
      return {
        fits: "single",
        text: `Your notice sends a form to answer. One Response covers preparing the answers.${upgrade}`,
      };
    case "operational":
      return {
        fits: "case",
        text: "A Plan of Action is an appeal, and Amazon can answer an appeal with a request for more. One Response covers the first response only; the Appeal Pass covers every round, so it is the one that fits an appeal.",
      };
    default:
      return null;
  }
}

import {
  caseNeedsProfessionalReview,
  roundFacts,
  workspaceCanCompose,
  type RoundFacts,
  type Workspace,
} from "@/core/workspace";

/**
 * What checkout needs to know about a case, and nothing else.
 *
 * The case lives in the seller's browser vault. Until 26 Oct 2026 checkout posted the whole
 * workspace — the notice, the response page, every note and file name, the unsaved draft — to ask
 * three yes/no questions and one count. These are those answers; the case stays on the device.
 *
 * The server trusts them the way it trusted the workspace: they are the seller's own statement
 * about their own case. A false "can be drafted" buys a Pass that `/api/compose` will still refuse
 * for the real reason, and a false "no" only costs the seller their own sale.
 */
export interface CheckoutEligibility {
  /** Whether the case's confirmed response route can be drafted. */
  composable: boolean;
  /** Whether D6 sends this case to qualified help, so no Pass is sold for it. */
  professionalReview: boolean;
  /** Which response this purchase would prepare. */
  round: RoundFacts;
}

export function checkoutEligibility(w: Workspace): CheckoutEligibility {
  return {
    composable: workspaceCanCompose(w),
    professionalReview: caseNeedsProfessionalReview(w),
    round: roundFacts(w),
  };
}

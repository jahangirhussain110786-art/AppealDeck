import type { Workspace } from "./workspace";
import { analyzeReply } from "./responseAnalyzer";

/**
 * When to offer a change of approach (B-04, reduced; 24 Sep 2026).
 *
 * `caseState.ts` has had an `ESCALATION` state since 2 Sep, and nothing ever moved a case into it —
 * so a seller refused two or three times saw "Revision" again, with the same page, as though the
 * next attempt were the same kind of step as the first. The research behind this product is
 * consistent that it is not: resubmitting without changing anything is the best-evidenced cause of
 * rejection, and after repeated refusals a seller needs a different route, not a third copy.
 *
 * Offered only on facts the case holds: at least two responses recorded as sent, and a reply from
 * Amazon, recorded after the latest of them, that is not reinstatement. Nothing is predicted from
 * it; the panel says what the seller can do differently and who else there is to ask.
 */
export const ESCALATION_AFTER_ATTEMPTS = 2;

export function shouldOfferChangeOfApproach(
  w: Pick<Workspace, "submissions" | "replies">,
): boolean {
  if (w.submissions.length < ESCALATION_AFTER_ATTEMPTS) return false;
  const lastSent = Math.max(...w.submissions.map((s) => Date.parse(s.at) || 0));
  const reply = [...w.replies]
    .filter((r) => (Date.parse(r.at) || 0) >= lastSent)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  if (!reply) return false;
  return analyzeReply(reply.text).category !== "reinstated";
}

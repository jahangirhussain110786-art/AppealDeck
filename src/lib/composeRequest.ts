import {
  composePayloadWorkspace,
  roundFacts,
  totalAttempts,
  type RoundFacts,
  type Workspace,
} from "@/core/workspace";

/**
 * The body `/api/compose` receives, built from the seller's full workspace and from nothing else.
 *
 * The workspace itself is trimmed by `composePayloadWorkspace` (history, prior requirements, sent
 * wording and saved readings stay on the device), which is exactly why the two round facts and the
 * attempt number are computed here, before the trim: a trimmed workspace can no longer say whether
 * a reply was applied or a response was sent. The server decides entitlement from `round` and uses
 * `attempt` only for the letter's wording — a seller's attempt made before AppealDeck is not a
 * round here.
 */
export function composeRequestBody<T extends { workspace?: Workspace }>(
  file: T,
  workspace: Workspace,
): { caseData: T & { workspace: Workspace }; attempt: number; round: RoundFacts } {
  return {
    caseData: { ...file, workspace: composePayloadWorkspace(workspace) },
    attempt: Math.min(99, totalAttempts(workspace) + 1),
    round: roundFacts(workspace),
  };
}

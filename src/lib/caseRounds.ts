import { supabaseAdmin } from "./supabase/server";

/**
 * The highest response round the server itself has seen for a case (migration 0025).
 *
 * One Response covers the first response of one case, and the only other record of which round a
 * response belongs to is the workspace in the seller's browser, which they can reset. This mark
 * only ever increases, so resetting the browser cannot turn round two back into round one.
 *
 * It is not a guarantee that a case is on its first round: it knows only what a client reported
 * when it prepared a response. See the migration header for what remains outside it.
 */
export async function fetchHighestRound(userId: string, caseId: string): Promise<number> {
  if (!supabaseAdmin) throw new Error("Case round lookup unavailable");
  const { data, error } = await supabaseAdmin
    .from("case_rounds")
    .select("highest_round")
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (error) throw new Error("Case round lookup unavailable");
  return (data as { highest_round?: number } | null)?.highest_round ?? 0;
}

/**
 * Records the round this request is preparing and returns the highest round now on file. A round
 * that is refused is recorded too, or a seller could reach round two, be refused, reset the case and
 * win round one back.
 */
export async function recordCaseRound(
  userId: string,
  caseId: string,
  round: number,
): Promise<number> {
  if (!supabaseAdmin) throw new Error("Case round lookup unavailable");
  const safe = Math.min(99, Math.max(1, Math.trunc(round)));
  const { data, error } = await supabaseAdmin.rpc("record_case_round", {
    p_user_id: userId,
    p_case_id: caseId,
    p_round: safe,
  });
  if (error) throw new Error("Case round lookup unavailable");
  return typeof data === "number" ? data : safe;
}

/**
 * How a drafting prompt introduces the attempt number.
 *
 * Until 26 Oct 2026 both prompts read `attempt > 1` as "Amazon refused an earlier response", but
 * the attempt count also rises for a response the seller recorded as sent here with no reply yet,
 * and for an attempt they made before AppealDeck (an imported prior submission). In those cases the
 * model was told about a refusal that did not exist and answered one — inviting the seller to
 * explain a failure Amazon had not raised. A refusal is claimed only when the seller's own reply
 * text produced reasons.
 */
export function attemptLine(attempt: number, replyReasons: readonly string[]): string {
  if (replyReasons.length > 0)
    return `This is attempt ${attempt}, after Amazon refused an earlier response (see AMAZON REPLY).`;
  if (attempt > 1)
    return `This is attempt ${attempt}. An earlier response was sent; no reply from Amazon is on record, so do not describe or answer a refusal.`;
  return `This is attempt ${attempt}.`;
}

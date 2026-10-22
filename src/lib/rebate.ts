/**
 * Which payment an outcome-report rebate is for (22 Oct 2026). Pure, so the rule is tested without a
 * database: the oldest Pass bought through Paddle that is still inside Paddle's 120-day limit for
 * refunding a card payment, has not been refunded, and has no report yet.
 *
 * Only a Pass earns a rebate: an Account Pass or an Appeal Pass, or a renewal of an Account Pass. A
 * document review, a credit pack or a Pro plan does not (they are not the thing the report is about).
 */
export const REBATE_WINDOW_DAYS = 120;
export const REBATE_CENTS = 2500;

const REBATE_PLANS = ["appeal_pass", "account_pass", "account_renewal"];

export type RebateCandidate = { transactionId: string; deadline: string };

export function eligibleRebate(
  licences: {
    provider_transaction_id: string | null;
    plan: string | null;
    status: string;
    created_at: string;
  }[],
  reported: ReadonlySet<string>,
  now: number = Date.now(),
): RebateCandidate[] {
  const day = 86_400_000;
  return licences
    .filter(
      (l) =>
        l.provider_transaction_id &&
        l.status === "active" &&
        REBATE_PLANS.includes(l.plan ?? "") &&
        !reported.has(l.provider_transaction_id) &&
        now - Date.parse(l.created_at) < REBATE_WINDOW_DAYS * day &&
        now >= Date.parse(l.created_at),
    )
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map((l) => ({
      transactionId: l.provider_transaction_id as string,
      deadline: new Date(Date.parse(l.created_at) + REBATE_WINDOW_DAYS * day).toISOString(),
    }));
}

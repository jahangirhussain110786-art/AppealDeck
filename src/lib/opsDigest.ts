import type { SupabaseClient } from "@supabase/supabase-js";
import { policyBriefAgeDays, policyBriefIsStale } from "@/core/policyBrief";
import { rebateEnabled } from "@/lib/plans";

/**
 * What the founder needs to hear about without going looking.
 *
 * Until now a payment that could not be matched to a checkout, a confirmation email that kept
 * bouncing, or a reminder that could not be sent left one console line and nothing else. A buyer
 * waiting for a Pass they had paid for would only be found when they wrote in. This reads the
 * three places those failures are parked and, when any is non-empty, produces one plain email.
 * Pure counting: it reads no seller content and sends nothing about any case.
 */
export interface OpsStatus {
  /** Completed payments parked in `payment_events_unmatched`: a buyer paid and has no Pass. */
  parkedPayments: number;
  /** Purchase confirmations that stopped being retried after repeated failures. */
  stuckConfirmations: number;
  /** Case reminders that were due, are unsent, and have recorded an error. */
  failedReminders: number;
  /** Days since Amazon's expectations were last re-checked, when that is overdue; otherwise 0. */
  policyBriefOverdueDays: number;
  /**
   * Outcome reports waiting for their $25 refund, which is made by hand in Paddle. Always 0 while
   * the rebate is switched off, so the table is not even asked about before its migration is applied.
   */
  pendingRebates: number;
}

export const isAllClear = (s: OpsStatus) =>
  s.parkedPayments === 0 &&
  s.stuckConfirmations === 0 &&
  s.failedReminders === 0 &&
  s.policyBriefOverdueDays === 0 &&
  s.pendingRebates === 0;

async function countOf(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await query;
  if (error) throw new Error("ops count failed");
  return count ?? 0;
}

export async function collectOpsStatus(client: SupabaseClient): Promise<OpsStatus> {
  const [parkedPayments, stuckConfirmations, failedReminders] = await Promise.all([
    countOf(
      client.from("payment_events_unmatched").select("event_id", { count: "exact", head: true }),
    ),
    countOf(
      client
        .from("purchase_email_outbox")
        .select("transaction_id", { count: "exact", head: true })
        .is("sent_at", null)
        .gte("attempts", 5),
    ),
    countOf(
      client
        .from("case_reminders")
        .select("id", { count: "exact", head: true })
        .is("sent_at", null)
        .not("last_error", "is", null)
        .lte("due_at", new Date().toISOString()),
    ),
  ]);
  const pendingRebates = rebateEnabled()
    ? await countOf(
        client
          .from("outcome_reports")
          .select("transaction_id", { count: "exact", head: true })
          .eq("rebate_status", "pending"),
      )
    : 0;
  const now = new Date();
  return {
    parkedPayments,
    stuckConfirmations,
    failedReminders,
    policyBriefOverdueDays: policyBriefIsStale(now) ? policyBriefAgeDays(now) : 0,
    pendingRebates,
  };
}

export function buildOpsDigest(status: OpsStatus): { subject: string; text: string } {
  const lines: string[] = [];
  if (status.parkedPayments)
    lines.push(
      `${status.parkedPayments} paid checkout(s) could not be matched and no Pass was granted. Find them: select * from payment_events_unmatched; then fix the cause (usually the price id or checkout intent) and replay the event from Paddle, or refund it.`,
    );
  if (status.stuckConfirmations)
    lines.push(
      `${status.stuckConfirmations} purchase confirmation email(s) gave up after 5 attempts. Find them: select * from purchase_email_outbox where sent_at is null and attempts >= 5;`,
    );
  if (status.failedReminders)
    lines.push(
      `${status.failedReminders} case reminder email(s) are due and failed to send. Find them: select * from case_reminders where sent_at is null and last_error is not null;`,
    );
  if (status.policyBriefOverdueDays)
    lines.push(
      `The Plan of Action policy brief (src/core/policyBrief.ts) was last checked ${status.policyBriefOverdueDays} days ago. The AI writes every appeal against it, so re-check Amazon's current expectations (the sources are listed in that file), update the rules and POLICY_BRIEF_CHECKED_ON.`,
    );
  if (status.pendingRebates)
    lines.push(
      `${status.pendingRebates} outcome report(s) are waiting for their $25 refund. Find them: select transaction_id, result, created_at from outcome_reports where rebate_status = 'pending'; Refund each in Paddle as a partial refund of $25 on that transaction (type partial, so the Pass stays), then: update outcome_reports set rebate_status = 'refunded', settled_at = now() where transaction_id = '...';`,
    );
  return {
    subject: `AppealDeck needs attention: ${lines.length} thing${lines.length === 1 ? "" : "s"} to look at`,
    text: lines.join("\n\n") + "\n",
  };
}

/** Sends the digest through Resend. Throws when mail is not configured, so the caller can log it. */
export async function sendOpsDigest(to: string, status: OpsStatus): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AppealDeck <billing@appealdeck.com>";
  if (!apiKey) throw new Error("Email is not configured");
  const { subject, text } = buildOpsDigest(status);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) throw new Error("Email provider returned " + res.status);
}

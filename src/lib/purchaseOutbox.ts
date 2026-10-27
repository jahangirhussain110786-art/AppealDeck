import { supabaseAdmin } from "./supabase/server";
import { sendPurchaseConfirmationEmail } from "./email";
import { fetchPaidAmount } from "./paddleTransaction";
import { RUN_BUDGET_MS, runBatch } from "./mailBatch";
import type { PurchaseKind } from "@/content/purchases";

const KINDS: readonly PurchaseKind[] = [
  "appeal_pass",
  "account_pass",
  "single_response",
  "pass_after_single",
  "document_review",
  "account_renewal",
  "pack_10",
  "pack_30",
  "pro_plan",
];

export function purchaseKindOf(value: unknown): PurchaseKind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value)
    ? (value as PurchaseKind)
    : "appeal_pass";
}

/** A claimed outbox row, as `claim_purchase_emails` returns it. */
interface OutboxRow {
  transaction_id: string;
  email: string;
  purchased_at: string;
  consent_text: string;
  kind: string | null;
  attempts: number | null;
  lease_token: string;
}

export async function deliverPurchaseEmails(
  userId?: string,
  options: { budgetMs?: number } = {},
): Promise<{ sent: number; failed: number; unreached: number }> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const db = supabaseAdmin;
  const { data, error } = await db.rpc("claim_purchase_emails", {
    p_user_id: userId ?? null,
  });
  if (error) throw new Error("Email queue unavailable");
  const rows: OutboxRow[] = data ?? [];
  let sent = 0,
    failed = 0;
  const reached = new Set<string>();
  // 27 Oct 2026 audit: a row can spend 4 s asking Paddle for the amount and 5 s on the email, so ten
  // of them outlast the function's 60 seconds. Rows run a few at a time, and none starts once the
  // budget is spent.
  const { unreached } = await runBatch(
    rows,
    async (row) => {
      reached.add(row.transaction_id);
      await sendOne(row);
    },
    { deadline: Date.now() + (options.budgetMs ?? RUN_BUDGET_MS) },
  );
  // Rows claimed but never started: hand back the lease and the attempt the claim counted, so they
  // are first in line next time instead of waiting out the lease and losing an attempt for nothing.
  for (const row of rows) {
    if (reached.has(row.transaction_id)) continue;
    await db
      .from("purchase_email_outbox")
      .update({ lease_until: null, attempts: Math.max(0, (row.attempts ?? 1) - 1) })
      .eq("transaction_id", row.transaction_id)
      .eq("lease_token", row.lease_token);
  }
  return { sent, failed, unreached };

  async function sendOne(row: OutboxRow) {
    try {
      await sendPurchaseConfirmationEmail({
        to: row.email,
        purchasedAt: row.purchased_at,
        consentText: row.consent_text,
        idempotencyKey: `purchase/${row.transaction_id}`,
        // Read-only, and null on any failure: the email then says only that Paddle's receipt
        // carries the amount, rather than stating a number we could not verify.
        paid: (await fetchPaidAmount(row.transaction_id)) ?? undefined,
        // What was bought, as the payment function recorded it on this row (migration 0018). A row from
        // before that migration has no kind and reads as the Appeal Pass, which is what it was.
        kind: purchaseKindOf(row.kind),
      });
      const { error: updateError } = await db
        .from("purchase_email_outbox")
        .update({ sent_at: new Date().toISOString(), lease_until: null, last_error: null })
        .eq("transaction_id", row.transaction_id)
        .eq("lease_token", row.lease_token);
      if (updateError) throw updateError;
      sent++;
    } catch {
      failed++;
      await db
        .from("purchase_email_outbox")
        .update({ last_error: "Delivery failed; retry pending" })
        .eq("transaction_id", row.transaction_id)
        .eq("lease_token", row.lease_token);
    }
  }
}

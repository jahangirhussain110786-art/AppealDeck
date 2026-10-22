import { supabaseAdmin } from "./supabase/server";
import { sendPurchaseConfirmationEmail } from "./email";
import type { PurchaseKind } from "@/content/purchases";

const KINDS: readonly PurchaseKind[] = [
  "appeal_pass",
  "account_pass",
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

export async function deliverPurchaseEmails(
  userId?: string,
): Promise<{ sent: number; failed: number }> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const { data, error } = await supabaseAdmin.rpc("claim_purchase_emails", {
    p_user_id: userId ?? null,
  });
  if (error) throw new Error("Email queue unavailable");
  let sent = 0,
    failed = 0;
  for (const row of data ?? []) {
    try {
      await sendPurchaseConfirmationEmail({
        to: row.email,
        purchasedAt: row.purchased_at,
        consentText: row.consent_text,
        idempotencyKey: `purchase/${row.transaction_id}`,
        // What was bought, as the payment function recorded it on this row (migration 0018). A row from
        // before that migration has no kind and reads as the Appeal Pass, which is what it was.
        kind: purchaseKindOf(row.kind),
      });
      const { error: updateError } = await supabaseAdmin
        .from("purchase_email_outbox")
        .update({ sent_at: new Date().toISOString(), lease_until: null, last_error: null })
        .eq("transaction_id", row.transaction_id)
        .eq("lease_token", row.lease_token);
      if (updateError) throw updateError;
      sent++;
    } catch {
      failed++;
      await supabaseAdmin
        .from("purchase_email_outbox")
        .update({ last_error: "Delivery failed; retry pending" })
        .eq("transaction_id", row.transaction_id)
        .eq("lease_token", row.lease_token);
    }
  }
  return { sent, failed };
}

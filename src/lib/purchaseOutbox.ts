import { supabaseAdmin } from "./supabase/server";
import { sendPurchaseConfirmationEmail } from "./email";

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

import { supabaseAdmin } from "./supabase/server";
import { sendAccountPassEndingEmail } from "./email";
import { APP_URL } from "./urls";
import { renewalEnabled } from "./plans";

/**
 * One "your Account Pass ends soon" email per account per end date (22 Oct 2026).
 *
 * An account's cover ends when the latest of its Account Pass and renewals ends, so a renewal moves
 * the date and the account is told again about the new one, never twice about the same one. The
 * notice row is written first and removed if the email fails, so the next day's run tries again and
 * a retry within the same run cannot send twice.
 */
export const NOTICE_DAYS_BEFORE = 30;

export interface AccountCoverEnd {
  userId: string;
  email: string;
  endsAt: string;
}

/** The accounts whose cover ends within the notice window: pure, so the rule is tested alone. */
export function endingSoon(
  rows: { user_id: string | null; email: string | null; expires_at: string | null }[],
  now: number = Date.now(),
): AccountCoverEnd[] {
  const latest = new Map<string, { email: string | null; end: number }>();
  for (const r of rows) {
    if (!r.user_id || !r.expires_at) continue;
    const end = Date.parse(r.expires_at);
    if (Number.isNaN(end)) continue;
    const held = latest.get(r.user_id);
    if (!held || end > held.end) latest.set(r.user_id, { email: r.email, end });
  }
  const horizon = now + NOTICE_DAYS_BEFORE * 86_400_000;
  return [...latest.entries()]
    .filter(([, v]) => v.end > now && v.end <= horizon && v.email)
    .map(([userId, v]) => ({
      userId,
      email: v.email as string,
      endsAt: new Date(v.end).toISOString(),
    }));
}

export async function deliverAccountPassNotices(
  send: typeof sendAccountPassEndingEmail = sendAccountPassEndingEmail,
): Promise<{ sent: number; skipped: number; failed: number }> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("user_id, email, expires_at")
    .in("plan", ["account_pass", "account_renewal"])
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error("Notice queue unavailable");
  let sent = 0,
    skipped = 0,
    failed = 0;
  for (const account of endingSoon(data ?? [])) {
    const expiresOn = account.endsAt.slice(0, 10);
    const claim = await supabaseAdmin
      .from("account_pass_notices")
      .insert({ user_id: account.userId, expires_on: expiresOn });
    if (claim.error) {
      // Already told about this end date: the key is (account, end date).
      if ((claim.error as { code?: string }).code === "23505") skipped++;
      else failed++;
      continue;
    }
    try {
      await send({
        to: account.email,
        endsOn: account.endsAt,
        billingUrl: `${APP_URL}/billing`,
        renewalAvailable: renewalEnabled(),
        idempotencyKey: `account-pass-ending/${account.userId}/${expiresOn}`,
      });
      sent++;
    } catch {
      failed++;
      // Not told after all, so tomorrow's run must try again.
      await supabaseAdmin
        .from("account_pass_notices")
        .delete()
        .eq("user_id", account.userId)
        .eq("expires_on", expiresOn);
    }
  }
  return { sent, skipped, failed };
}

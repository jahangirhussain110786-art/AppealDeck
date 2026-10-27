import { supabaseAdmin } from "./supabase/server";
import { sendAccountPassEndingEmail } from "./email";
import { APP_URL } from "./urls";
import { renewalEnabled } from "./plans";
import { RUN_BUDGET_MS, runBatch } from "./mailBatch";

/** A claim nobody finished for this long is treated as a crashed run and may be taken again. */
const CLAIM_LEASE_MS = 10 * 60 * 1000;

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
): Promise<{ sent: number; skipped: number; failed: number; unreached: number }> {
  if (!supabaseAdmin) throw new Error("Database unavailable");
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("user_id, email, expires_at")
    .in("plan", ["account_pass", "account_renewal"])
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error("Notice queue unavailable");
  const db = supabaseAdmin;
  let sent = 0,
    skipped = 0,
    failed = 0;
  const { unreached } = await runBatch(
    endingSoon(data ?? []),
    async (account) => {
      const expiresOn = account.endsAt.slice(0, 10);
      const claimedAt = new Date().toISOString();
      const claim = await db
        .from("account_pass_notices")
        .insert({ user_id: account.userId, expires_on: expiresOn, sent_at: claimedAt });
      if (claim.error) {
        if ((claim.error as { code?: string }).code !== "23505") {
          failed++;
          return;
        }
        // The (account, end date) row exists. Told already, or being sent right now: leave it. A
        // claim nobody finished (a crash or timeout between writing the row and the provider
        // accepting the email) is taken again, or the seller would never hear. 27 Oct 2026 audit.
        const { data: held } = await db
          .from("account_pass_notices")
          .select("delivered_at, sent_at")
          .eq("user_id", account.userId)
          .eq("expires_on", expiresOn)
          .maybeSingle();
        const claimedBefore = held?.sent_at ? Date.parse(held.sent_at) : NaN;
        if (
          !held ||
          held.delivered_at ||
          Number.isNaN(claimedBefore) ||
          Date.now() - claimedBefore < CLAIM_LEASE_MS
        ) {
          skipped++;
          return;
        }
        const { data: took } = await db
          .from("account_pass_notices")
          .update({ sent_at: claimedAt })
          .eq("user_id", account.userId)
          .eq("expires_on", expiresOn)
          .is("delivered_at", null)
          .eq("sent_at", held.sent_at)
          .select("user_id");
        if (!took || took.length === 0) {
          // Another run took it first.
          skipped++;
          return;
        }
      }
      try {
        await send({
          to: account.email,
          endsOn: account.endsAt,
          billingUrl: `${APP_URL}/billing`,
          renewalAvailable: renewalEnabled(),
          // The same on every attempt for this end date, so a retry cannot mail the seller twice.
          idempotencyKey: `account-pass-ending/${account.userId}/${expiresOn}`,
        });
      } catch {
        failed++;
        // Not told after all, so the next run must try again.
        await db
          .from("account_pass_notices")
          .delete()
          .eq("user_id", account.userId)
          .eq("expires_on", expiresOn);
        return;
      }
      sent++;
      // The provider has it. Record that, and retry the record: a missing mark only means the claim
      // is eventually taken again, and that second send would fall outside the provider's window.
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await db
          .from("account_pass_notices")
          .update({ delivered_at: new Date().toISOString() })
          .eq("user_id", account.userId)
          .eq("expires_on", expiresOn);
        if (!res.error) break;
      }
    },
    { deadline: Date.now() + RUN_BUDGET_MS },
  );
  return { sent, skipped, failed, unreached };
}

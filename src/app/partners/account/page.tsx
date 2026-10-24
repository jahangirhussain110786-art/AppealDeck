import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { referralsEnabled } from "@/lib/referrals";
import { MarketingShell } from "@/components/MarketingShell";
import { SITE_URL } from "@/lib/urls";
import { SUPPORT_EMAIL } from "@/content/support";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your partner balance", robots: { index: false, follow: false } };
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

type Statement = {
  active: boolean;
  codes: { code: string; active: boolean }[];
  pending: number;
  earned: number;
  paid: number;
  held: number;
};

async function loadStatement(userId: string): Promise<Statement | null | undefined> {
  try {
    if (!referralsEnabled() || !supabaseAdmin) throw new Error();
    const { data, error } = await supabaseAdmin.rpc("partner_statement", { p_user_id: userId });
    if (error) throw new Error();
    return data as Statement | null;
  } catch {
    return undefined;
  }
}

export default async function PartnerAccountPage() {
  const user = await requireUser("/partners/account");
  const statement = await loadStatement(user.id);
  let content;
  if (statement === null) {
    content = (
      <p>
        Partner accounts are approved individually.{" "}
        <a
          className="text-link underline"
          href={`mailto:${SUPPORT_EMAIL}?subject=Partner%20program`}
        >
          Apply to the partner program
        </a>
        .
      </p>
    );
  } else if (statement) {
    const summary = { ...statement, balance: Number(statement.earned) - Number(statement.paid) };
    content = (
      <div className="space-y-6">
        {!statement.active && (
          <p role="status">
            Your partnership is paused. Existing eligible sales remain on your record.
          </p>
        )}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Waiting for refund window", money(summary.pending)],
            ["Balance after payouts", money(summary.balance)],
            ["Paid to date", money(summary.paid)],
            ["Sales held for review", String(summary.held)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          Commission is 30 percent of the discounted price before tax. It becomes eligible after 14
          days. Refunds reduce it; a negative balance carries into your next payout. Payments are
          reviewed and sent monthly, by bank transfer or Payoneer.
        </p>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your links</h2>
          {statement.codes.map((code) => (
            <div key={code.code} className="rounded-xl border border-border p-4">
              <p className="font-mono font-medium break-all">
                {code.code}
                {!code.active && " (paused)"}
              </p>
              {code.active && statement.active && (
                <a
                  className="mt-2 block break-all text-link underline"
                  href={`${SITE_URL}/decode?ref=${encodeURIComponent(code.code)}`}
                >{`${SITE_URL}/decode?ref=${encodeURIComponent(code.code)}`}</a>
              )}
            </div>
          ))}
          {!statement.codes.length && (
            <p>Your code has not been issued yet. Contact support before sharing a link.</p>
          )}
        </section>
        <p className="text-sm">
          Place this disclosure beside your link: “I earn a commission if you buy.” Buyer names,
          emails and case details are never shown here.
        </p>
      </div>
    );
  } else {
    content = (
      <p role="status">
        Your partner balance is unavailable right now. Try again later or contact{" "}
        <a className="text-link underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    );
  }
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl space-y-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Your partner account</h1>
        {content}
        <Link href="/partners#partners-rules" className="inline-block min-h-11 text-link underline">
          Partner rules
        </Link>
      </div>
    </MarketingShell>
  );
}

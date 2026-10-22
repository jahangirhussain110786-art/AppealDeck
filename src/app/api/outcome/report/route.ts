import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { serviceUnavailableResponse } from "@/lib/licenseGuard";
import { rateLimitOutcome, tooManyRequestsResponse } from "@/lib/ratelimit";
import { rebateEnabled } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/server";
import { eligibleRebate, REBATE_WINDOW_DAYS, type RebateCandidate } from "@/lib/rebate";

export const dynamic = "force-dynamic";

/**
 * The $25 outcome-report rebate (22 Oct 2026). Unlike /api/outcome, which stores nothing about who
 * sent it, this report is tied to the account, because it is how we know whom to refund. The seller
 * is told so before they send it. It is separate from the anonymous share and never published.
 *
 * Which payment the rebate is for is decided here, from the account's own licence rows, never from
 * the request: the oldest Pass bought through Paddle within the last 120 days that has not been
 * refunded and has no report yet. 120 days is Paddle's own limit for refunding a card payment.
 */
const Body = z.object({
  result: z.enum(["approved", "rejected", "no_response", "withdrawn"]),
  daysToOutcome: z.number().int().min(0).max(3650).optional(),
});

async function candidates(userId: string): Promise<RebateCandidate[] | null> {
  if (!supabaseAdmin) return null;
  const since = new Date(Date.now() - REBATE_WINDOW_DAYS * 86_400_000).toISOString();
  const [licences, reports] = await Promise.all([
    supabaseAdmin
      .from("licenses")
      .select("provider_transaction_id, plan, status, provider, created_at")
      .eq("user_id", userId)
      .eq("provider", "paddle")
      .eq("status", "active")
      .gte("created_at", since),
    supabaseAdmin.from("outcome_reports").select("transaction_id").eq("user_id", userId),
  ]);
  if (licences.error || reports.error) return null;
  const reported = new Set(
    ((reports.data as { transaction_id: string }[] | null) ?? []).map((r) => r.transaction_id),
  );
  return eligibleRebate(
    (licences.data as
      | {
          provider_transaction_id: string | null;
          plan: string | null;
          status: string;
          created_at: string;
        }[]
      | null) ?? [],
    reported,
  );
}

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  if (!rebateEnabled())
    return NextResponse.json({ offered: false, eligible: false }, { status: 200 });
  const list = await candidates(user.id).catch(() => null);
  if (list === null) return serviceUnavailableResponse();
  const first = list[0];
  return NextResponse.json(
    { offered: true, eligible: Boolean(first), deadline: first?.deadline ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return unauthorizedJsonResponse();
  if (!rebateEnabled())
    return NextResponse.json({ error: "This offer is not running." }, { status: 404 });
  const rate = await rateLimitOutcome(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Choose how the case ended." }, { status: 400 });
  const list = await candidates(user.id).catch(() => null);
  if (list === null || !supabaseAdmin) return serviceUnavailableResponse();
  const first = list[0];
  if (!first)
    return NextResponse.json(
      {
        error:
          "There is no payment to refund a rebate on: one is offered within 120 days of buying a Pass, once per payment.",
        code: "not_eligible",
      },
      { status: 409 },
    );
  const { error } = await supabaseAdmin.from("outcome_reports").insert({
    user_id: user.id,
    transaction_id: first.transactionId,
    result: parsed.data.result,
    days_to_outcome: parsed.data.daysToOutcome ?? null,
  });
  if (error) {
    // The unique key on the payment: a second press, or a second tab, is "already reported".
    if ((error as { code?: string }).code === "23505")
      return NextResponse.json(
        { error: "You have already reported on this payment.", code: "already_reported" },
        { status: 409 },
      );
    return serviceUnavailableResponse();
  }
  return NextResponse.json({ ok: true, rebate: "pending" });
}

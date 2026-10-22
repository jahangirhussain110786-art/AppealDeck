import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchLicenseForUser } from "@/lib/license";
import { CaseIdSchema, ViolationKindSchema } from "@/lib/caseSchema";
import { isSeverityGated } from "@/core";
import { consentLabelFor } from "@/content/legal";
import { isPurchaseBlocked, REGION_BLOCKED_MESSAGE } from "@/lib/region";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { workspaceCanCompose } from "@/core/workspace";
import { accountPassPriceId, casePassPriceId, foundingCode, parsePlan } from "@/lib/plans";
import { foundingSpotsLeft } from "@/lib/founding";

const Body = z.object({
  caseId: CaseIdSchema,
  kind: ViolationKindSchema,
  consent: z.literal(true),
  // The vault-held case is browser-only — the server never otherwise sees its content, so the
  // client sends this one case's current workspace so eligibility can be checked before payment,
  // the same way /api/compose already does at draft time.
  workspace: WorkspaceSchema.optional(),
  // "case" is the Appeal Pass and the default, so a client that never sends it behaves as before.
  plan: z.enum(["case", "account"]).default("case"),
});
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.email) return unauthorizedJsonResponse();
  // Where the Pass is not on sale yet (EU, EEA, UK by default): decided by the buyer's country, which
  // Vercel supplies from the request, before anything is created. See `src/lib/region.ts`.
  if (isPurchaseBlocked(req.headers.get("x-vercel-ip-country")))
    return NextResponse.json(
      { error: REGION_BLOCKED_MESSAGE, code: "region_blocked" },
      { status: 403 },
    );
  const rate = await rateLimitCompose(user);
  if (!rate.success) return tooManyRequestsResponse(rate);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a case and accept the checkout consent first." },
      { status: 400 },
    );
  if (isSeverityGated(parsed.data.kind))
    return NextResponse.json(
      { error: "This case requires professional help; an Appeal Pass is not offered." },
      { status: 403 },
    );
  if (parsed.data.workspace && !workspaceCanCompose(parsed.data.workspace))
    return NextResponse.json(
      {
        error:
          "This case does not currently need a drafted response. Confirm its response route in the case workspace before buying a Pass for it.",
      },
      { status: 422 },
    );
  const plan = parsePlan(parsed.data.plan);
  const priceId = plan === "account" ? accountPassPriceId() : casePassPriceId();
  if (!supabaseAdmin || !priceId)
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
  // One Pass covers every revision of its case, so a second checkout for a case that already has
  // one would only take the seller's money twice. Nothing checked this until 24 Sep 2026: /pricing
  // offered a covered case the Buy button like any other.
  const existing = await fetchLicenseForUser(user.id, parsed.data.caseId).catch(() => null);
  if (!existing)
    return NextResponse.json({ error: "Could not prepare checkout." }, { status: 503 });
  // An Account Pass covers every case, so nothing more is sold to its holder. A case Pass covers one
  // case, so its holder may still buy the Account Pass (it covers every other case too).
  if (existing.status === "active" && (plan === "case" || existing.plan === "account_pass"))
    return NextResponse.json(
      {
        error:
          existing.plan === "account_pass"
            ? "Your Account Pass already covers every case on your account. Open your case."
            : "This case already has an Appeal Pass. It covers every revision — open your case.",
      },
      { status: 409 },
    );
  // A second click or a second tab within half an hour gets the same intent back. Two payments made
  // through one intent cannot both become a Pass: the second is parked by the webhook as "already
  // bound to a different transaction" and refunded by hand, instead of becoming a second licence.
  const recent = await supabaseAdmin
    .from("checkout_intents")
    .select("id")
    .eq("user_id", user.id)
    .eq("case_id", parsed.data.caseId)
    .eq("price_id", priceId)
    .is("transaction_id", null)
    .gt("created_at", new Date(Date.now() - 30 * 60_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent.data?.id)
    return NextResponse.json({
      intentId: recent.data.id,
      priceId,
      ...(await foundingOffer(plan)),
    });
  const { data, error } = await supabaseAdmin
    .from("checkout_intents")
    .insert({
      user_id: user.id,
      email: user.email,
      case_id: parsed.data.caseId,
      price_id: priceId,
      consent_text: consentLabelFor(plan),
    })
    .select("id")
    .single();
  if (error || !data)
    return NextResponse.json({ error: "Could not prepare checkout." }, { status: 503 });
  return NextResponse.json({ intentId: data.id, priceId, ...(await foundingOffer(plan)) });
}

/**
 * The founding discount code, only for the Account Pass and only while spots are left. Paddle's
 * usage limit on the discount is the hard stop; this decides whether to offer the code at all.
 */
async function foundingOffer(plan: "case" | "account"): Promise<{ foundingCode?: string }> {
  const code = foundingCode();
  if (plan !== "account" || !code) return {};
  const left = await foundingSpotsLeft().catch(() => null);
  return left !== null && left > 0 ? { foundingCode: code } : {};
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  fetchAccountCover,
  fetchDocumentReview,
  fetchLicenseForUser,
  fetchProStatus,
} from "@/lib/license";
import { renewalWindow } from "@/lib/renewal";
import { CaseIdSchema, ViolationKindSchema } from "@/lib/caseSchema";
import { isSeverityGated } from "@/core";
import { consentLabelFor } from "@/content/legal";
import { isPurchaseBlocked, REGION_BLOCKED_MESSAGE } from "@/lib/region";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { workspaceCanCompose } from "@/core/workspace";
import {
  ACCOUNT_SCOPE,
  PLAN_NEEDS_CASE,
  foundingCode,
  passAfterReviewPriceId,
  priceIdFor,
  type PassPlan,
} from "@/lib/plans";
import { foundingSpotsLeft } from "@/lib/founding";
import { formatDate } from "@/lib/format";

const Body = z
  .object({
    // A case is needed to buy a Pass, an Account Pass or a document review. A renewal, a credit pack
    // and the Pro plan belong to the account, so they send none.
    caseId: CaseIdSchema.optional(),
    kind: ViolationKindSchema.optional(),
    consent: z.literal(true),
    // The vault-held case is browser-only — the server never otherwise sees its content, so the
    // client sends this one case's current workspace so eligibility can be checked before payment,
    // the same way /api/compose already does at draft time.
    workspace: WorkspaceSchema.optional(),
    // "case" is the Appeal Pass and the default, so a client that never sends it behaves as before.
    plan: z
      .enum(["case", "account", "review", "renewal", "pack10", "pack30", "pro"])
      .default("case"),
  })
  .refine((b) => !PLAN_NEEDS_CASE[b.plan] || (b.caseId !== undefined && b.kind !== undefined), {
    message: "A case is needed for this purchase.",
  });

const refuse = (error: string, status: number, code?: string) =>
  NextResponse.json({ error, ...(code ? { code } : {}) }, { status });

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
    return refuse("Choose what to buy, and accept the checkout consent first.", 400);
  const { plan, caseId, kind } = parsed.data;
  const needsCase = PLAN_NEEDS_CASE[plan];

  if (needsCase && kind && isSeverityGated(kind))
    return refuse("This case requires professional help; an Appeal Pass is not offered.", 403);
  // Whether a response can be drafted matters for the Passes that pay for drafting, not for a
  // document review, which only reads documents.
  if (
    (plan === "case" || plan === "account") &&
    parsed.data.workspace &&
    !workspaceCanCompose(parsed.data.workspace)
  )
    return refuse(
      "This case does not currently need a drafted response. Confirm its response route in the case workspace before buying a Pass for it.",
      422,
    );

  if (!supabaseAdmin) return refuse("Checkout is not configured.", 503);
  const userId = user.id;

  // ---- what this account already holds, and whether this purchase makes sense -------------------
  let creditedPass = false;
  if (needsCase && caseId) {
    // One Pass covers every revision of its case, so a second checkout for a case that already has
    // one would only take the seller's money twice. Nothing checked this until 24 Sep 2026.
    const existing = await fetchLicenseForUser(userId, caseId).catch(() => null);
    if (!existing) return refuse("Could not prepare checkout.", 503);
    const covered = existing.status === "active";
    // An Account Pass covers every case, so nothing more is sold to its holder. A case Pass covers
    // one case, so its holder may still buy the Account Pass (it covers every other case too).
    if (covered && (plan === "case" || plan === "review" || existing.plan === "account_pass"))
      return refuse(
        existing.plan === "account_pass"
          ? "Your Account Pass already covers every case on your account. Open your case."
          : plan === "review"
            ? "This case already has an Appeal Pass, which includes reading your documents. Open your case."
            : "This case already has an Appeal Pass. It covers every revision — open your case.",
        409,
      );
    if (plan === "review" || plan === "case") {
      const reviewed = await fetchDocumentReview(userId, caseId).catch(() => null);
      if (reviewed === null) return refuse("Could not prepare checkout.", 503);
      if (plan === "review" && reviewed)
        return refuse("This case already has a document review. Open your case.", 409);
      // The review's price comes off the Appeal Pass for the case it was bought for.
      creditedPass = plan === "case" && reviewed && passAfterReviewPriceId() !== undefined;
    }
  }

  if (plan === "renewal") {
    const cover = await fetchAccountCover(userId).catch(() => null);
    if (!cover) return refuse("You have no Account Pass to renew.", 409, "renewal_unavailable");
    const window = renewalWindow(cover.expiresAt);
    if (window === "early")
      return refuse(
        `Your Account Pass runs until ${formatDate(cover.expiresAt)}. Renewing opens 60 days before it ends.`,
        409,
        "renewal_early",
      );
    if (window === "closed")
      return refuse(
        "Your Account Pass ended more than 30 days ago. Buy a new Account Pass instead.",
        409,
        "renewal_closed",
      );
  }

  if (plan === "pack10" || plan === "pack30" || plan === "pro") {
    const pro = await fetchProStatus(userId).catch(() => null);
    if (!pro) return refuse("Could not prepare checkout.", 503);
    if (!pro.verified)
      return refuse(
        "Credit packs and the Pro plan are for professionals we have verified. Write to us with a link to your public profile and we will verify you.",
        403,
        "not_verified",
      );
    if (plan === "pro" && pro.proPlanActive)
      return refuse("You already have a Pro plan. Manage it in Billing.", 409);
  }

  const priceId = creditedPass ? passAfterReviewPriceId() : priceIdFor(plan);
  if (!priceId) return refuse("Checkout is not configured.", 503);
  const scope = caseId ?? ACCOUNT_SCOPE;

  // A second click or a second tab within half an hour gets the same intent back. Two payments made
  // through one intent cannot both become a Pass: the second is parked by the webhook as "already
  // bound to a different transaction" and refunded by hand, instead of becoming a second licence.
  const recent = await supabaseAdmin
    .from("checkout_intents")
    .select("id")
    .eq("user_id", userId)
    .eq("case_id", scope)
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
      user_id: userId,
      email: user.email,
      case_id: scope,
      price_id: priceId,
      consent_text: consentLabelFor(plan),
    })
    .select("id")
    .single();
  if (error || !data) return refuse("Could not prepare checkout.", 503);
  return NextResponse.json({ intentId: data.id, priceId, ...(await foundingOffer(plan)) });
}

/**
 * The founding discount code, only for the Account Pass and only while spots are left. Paddle's
 * usage limit on the discount is the hard stop; this decides whether to offer the code at all.
 */
async function foundingOffer(plan: PassPlan): Promise<{ foundingCode?: string }> {
  const code = foundingCode();
  if (plan !== "account" || !code) return {};
  const left = await foundingSpotsLeft().catch(() => null);
  return left !== null && left > 0 ? { foundingCode: code } : {};
}

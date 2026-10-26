import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  fetchAccountCover,
  fetchDocumentReview,
  fetchLicenseForUser,
  fetchProStatus,
  fetchSingleResponse,
} from "@/lib/license";
import { renewalWindow } from "@/lib/renewal";
import { CaseIdSchema, ViolationKindSchema } from "@/lib/caseSchema";
import { isSeverityGated } from "@/core";
import { STORES } from "@/content/stores";
import { consentLabelFor } from "@/content/legal";
import { isPurchaseBlocked, REGION_BLOCKED_MESSAGE } from "@/lib/region";
import { rateLimitCompose, tooManyRequestsResponse } from "@/lib/ratelimit";
import { roundFromFacts } from "@/core/workspace";
import { fetchHighestRound } from "@/lib/caseRounds";
import {
  ACCOUNT_SCOPE,
  PLAN_NEEDS_CASE,
  foundingCode,
  passAfterReviewPriceId,
  passAfterSinglePriceId,
  upgradeEnabled,
  priceIdFor,
  type PassPlan,
} from "@/lib/plans";
import { foundingSpotsLeft } from "@/lib/founding";
import { formatDate } from "@/lib/format";
import { referralsEnabled, validateReferral, type ReferralOffer } from "@/lib/referrals";

const RoundSchema = z.object({
  sentHere: z.number().int().min(0).max(99),
  repliesReceived: z.number().int().min(0).max(99),
});

/**
 * The three answers checkout needs about a case, built on the device by `checkoutEligibility`. The
 * case itself — notice, writing, file names, draft — never leaves the browser for a purchase.
 */
const EligibilitySchema = z.object({
  composable: z.boolean(),
  professionalReview: z.boolean(),
  round: RoundSchema,
});

const Body = z
  .object({
    // A case is needed to buy a Pass, an Account Pass or a document review. A renewal, a credit pack
    // and the Pro plan belong to the account, so they send none.
    caseId: CaseIdSchema.optional(),
    kind: ViolationKindSchema.optional(),
    consent: z.literal(true),
    partnerCode: z.string().max(32).optional(),
    // Required to buy anything tied to a case (26 Oct 2026). While this was the whole workspace,
    // the server saw the seller's notice and writing at checkout; it never needed to. See
    // `src/lib/checkoutRequest.ts`.
    eligibility: EligibilitySchema.optional(),
    // "case" is the Appeal Pass and the default, so a client that never sends it behaves as before.
    plan: z
      .enum(["case", "single", "account", "review", "renewal", "pack10", "pack30", "pro"])
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
  /*
    The body is a handful of booleans, a case id and a code, so anything of size is not a checkout
    this app makes. Read as text first, like `/api/compose`, so the cap applies before parsing.
  */
  let raw: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 8_000)
      return refuse("Checkout request is too large.", 413);
    raw = JSON.parse(text);
  } catch {
    return refuse("Invalid JSON body.", 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success)
    return refuse("Choose what to buy, and accept the checkout consent first.", 400);
  const { plan, caseId, kind } = parsed.data;
  const needsCase = PLAN_NEEDS_CASE[plan];

  if (needsCase && kind && isSeverityGated(kind))
    return refuse("This case requires professional help; an Appeal Pass is not offered.", 403);
  // Whether a response can be drafted matters for the three plans that pay for drafting, not for a
  // document review, which only reads documents. The case lives in the seller's browser, so the
  // device sends the three facts checkout needs — and they are required, not optional (26 Oct
  // 2026): while the workspace was optional, omitting it skipped the check entirely and a seller
  // could pay for a case that cannot produce a response.
  const eligibility = parsed.data.eligibility;
  if (plan === "case" || plan === "single" || plan === "account") {
    if (!eligibility)
      return refuse(
        "Open your case before buying — checkout needs to confirm a response can be drafted for it.",
        422,
      );
    /*
      D6 first, and with its own reason (26 Oct 2026). The composability check below would also
      refuse this case, but it would say "this case does not currently need a drafted response",
      which reads as a defect in the case rather than as the one refusal this product makes on
      purpose. An unapplied reply that carries an allegation counts too: it is part of the case the
      seller is buying for, even though it is not part of the request text yet.
    */
    if (eligibility.professionalReview)
      return refuse(
        `${STORES.d6Release.why} A Pass is not offered for this case.`,
        422,
        "professional_review",
      );
    if (!eligibility.composable)
      return refuse(
        "This case does not currently need a drafted response. Confirm its response route in the case workspace before buying a Pass for it.",
        422,
      );
  }

  if (!supabaseAdmin) return refuse("Checkout is not configured.", 503);
  const userId = user.id;

  // ---- what this account already holds, and whether this purchase makes sense -------------------
  let creditedPass = false;
  // The Appeal Pass for a case that already has a One Response, with its price taken off.
  let creditedFromSingle = false;
  if (needsCase && caseId) {
    // One Pass covers every revision of its case, so a second checkout for a case that already has
    // one would only take the seller's money twice. Nothing checked this until 24 Sep 2026.
    const existing = await fetchLicenseForUser(userId, caseId).catch(() => null);
    if (!existing) return refuse("Could not prepare checkout.", 503);
    const covered = existing.status === "active";
    // An Account Pass covers every case, so nothing more is sold to its holder. A case Pass covers
    // one case, so its holder may still buy the Account Pass (it covers every other case too).
    if (
      covered &&
      (plan === "case" ||
        plan === "single" ||
        plan === "review" ||
        existing.plan === "account_pass")
    )
      return refuse(
        existing.plan === "account_pass"
          ? "Your Account Pass already covers every case on your account. Open your case."
          : plan === "review" || plan === "single"
            ? "This case already has an Appeal Pass, which includes everything this would. Open your case."
            : "This case already has an Appeal Pass. It covers every revision — open your case.",
        409,
      );
    // One One Response per case: a second would only take the seller's money twice.
    if (plan === "single") {
      const has = await fetchSingleResponse(userId, caseId).catch(() => null);
      if (has === null) return refuse("Could not prepare checkout.", 503);
      if (has) return refuse("This case already has a One Response. Open your case.", 409);
      /*
        One Response covers the first response only, so it is not sold for a case that is already
        past it: the licence could not cover the response the seller would prepare next, and they
        would have paid for nothing. The round the device reports and the server's own high-water
        mark are both consulted, because the workspace can be reset (26 Oct 2026). Drafting reads
        the same facts through the same function, so the two cannot disagree about the round.
      */
      const stored = await fetchHighestRound(userId, caseId).catch(() => null);
      if (stored === null) return refuse("Could not prepare checkout.", 503);
      const round = Math.max(eligibility ? roundFromFacts(eligibility.round) : 1, stored);
      if (round > 1)
        return refuse(
          "One Response covers the first response only. This case already has Amazon's reply or a response sent, so the next one is round two — the Appeal Pass covers every round.",
          409,
          "single_round_passed",
        );
    }
    if (plan === "review" || plan === "case") {
      const reviewed = await fetchDocumentReview(userId, caseId).catch(() => null);
      if (reviewed === null) return refuse("Could not prepare checkout.", 503);
      if (plan === "review" && reviewed)
        return refuse("This case already has a document review. Open your case.", 409);
      // The review's price comes off the Appeal Pass for the case it was bought for.
      creditedPass = plan === "case" && reviewed && passAfterReviewPriceId() !== undefined;
    }
    /*
      23 Oct 2026: a One Response's price comes off the Appeal Pass for its case, so a seller who
      reaches round two does not pay for the first response twice. Only one credit applies to a
      purchase: the One Response's is the larger, so it wins over a document review's. Offered only
      where its own Paddle price exists (`upgradeEnabled`), or the credit would be a promise.
    */
    if (plan === "case" && upgradeEnabled()) {
      const hasSingle = await fetchSingleResponse(userId, caseId).catch(() => null);
      if (hasSingle === null) return refuse("Could not prepare checkout.", 503);
      creditedFromSingle = hasSingle;
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

  const priceId = creditedFromSingle
    ? passAfterSinglePriceId()
    : creditedPass
      ? passAfterReviewPriceId()
      : priceIdFor(plan);
  if (!priceId) return refuse("Checkout is not configured.", 503);
  const scope = caseId ?? ACCOUNT_SCOPE;
  let referral: ReferralOffer | null = null;
  if (
    referralsEnabled() &&
    parsed.data.partnerCode &&
    (plan === "case" || plan === "account") &&
    !creditedPass &&
    !creditedFromSingle
  ) {
    try {
      referral = await validateReferral(parsed.data.partnerCode, userId);
    } catch (error) {
      return refuse(error instanceof Error ? error.message : "Could not check the code.", 422);
    }
  }

  // A second click or a second tab within half an hour gets the same intent back. Two payments made
  // through one intent cannot both become a Pass: the second is parked by the webhook as "already
  // bound to a different transaction" and refunded by hand, instead of becoming a second licence.
  let recentQuery = supabaseAdmin
    .from("checkout_intents")
    .select("id")
    .eq("user_id", userId)
    .eq("case_id", scope)
    .eq("price_id", priceId)
    .is("transaction_id", null)
    .gt("created_at", new Date(Date.now() - 30 * 60_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  if (referralsEnabled())
    recentQuery = referral
      ? recentQuery.eq("referral_code_id", referral.id)
      : recentQuery.is("referral_code_id", null);
  const recent = await recentQuery.maybeSingle();
  if (recent.data?.id)
    return NextResponse.json({
      intentId: recent.data.id,
      priceId,
      ...(referral ? { partnerCode: referral.code } : await foundingOffer(plan)),
    });
  const { data, error } = await supabaseAdmin
    .from("checkout_intents")
    .insert({
      user_id: userId,
      email: user.email,
      case_id: scope,
      price_id: priceId,
      consent_text: consentLabelFor(plan),
      ...(referral ? { referral_code_id: referral.id } : {}),
    })
    .select("id")
    .single();
  if (error || !data) return refuse("Could not prepare checkout.", 503);
  return NextResponse.json({
    intentId: data.id,
    priceId,
    ...(referral ? { partnerCode: referral.code } : await foundingOffer(plan)),
  });
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

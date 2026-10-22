import { supabaseAdmin } from "./supabase/server";

export type LicenseStatus = "active" | "past_due" | "canceled" | "paused" | "none";

export interface LicenseSummary {
  status: LicenseStatus;
  plan: string | null;
  licenseKey: string | null;
  createdAt?: string | null;
  /** When an Account Pass stops covering new cases; null for a case Pass, which does not expire. */
  expiresAt?: string | null;
}

/** Plans that cover every case of an account until they end. A renewal is more of the same cover. */
const ACCOUNT_COVER_PLANS = ["account_pass", "account_renewal"];

/**
 * Plans that are not cover for a case. A document review covers only the AI reading of one case's
 * documents, and a Pro plan only grants case credits; neither lets a seller prepare a response, so
 * neither may make the Pass look bought.
 */
const NOT_COVER_PLANS = ["document_review", "pro_plan"];

type Row = {
  status: string;
  plan: string | null;
  license_key: string | null;
  created_at: string | null;
  expires_at: string | null;
  case_id: string | null;
};

const isLive = (row: { status: string; expires_at?: string | null }) =>
  row.status === "active" && (!row.expires_at || Date.parse(row.expires_at) > Date.now());

export async function fetchLicenseForUser(
  userId: string | null | undefined,
  caseId?: string,
): Promise<LicenseSummary> {
  if (!userId || !supabaseAdmin) {
    return { status: "none", plan: null, licenseKey: null };
  }
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("status, plan, license_key, created_at, expires_at, case_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("License lookup unavailable");
  const rows = ((data as Row[] | null) ?? []).filter(
    (r) => !NOT_COVER_PLANS.includes(r.plan ?? ""),
  );
  const eligible = caseId ? rows.filter((row) => row.case_id === caseId || !row.case_id) : rows;
  // An Account Pass covers more than a case Pass, so when both are live it is the one reported, and
  // with a renewal it is reported as ending when the latest of its twelve months ends.
  const liveAccount = eligible
    .filter((row) => isLive(row) && ACCOUNT_COVER_PLANS.includes(row.plan ?? ""))
    .sort((a, b) => Date.parse(b.expires_at ?? "") - Date.parse(a.expires_at ?? ""));
  const active = liveAccount[0] ?? eligible.find((row) => isLive(row));
  const picked = active ?? eligible[0];
  if (!picked) {
    return { status: "none", plan: null, licenseKey: null };
  }
  const accountCover = active !== undefined && ACCOUNT_COVER_PLANS.includes(active.plan ?? "");
  return {
    status:
      picked.status === "active" && picked.expires_at && Date.parse(picked.expires_at) <= Date.now()
        ? "none"
        : ((picked.status as LicenseStatus) ?? "none"),
    // A renewal is reported as the Account Pass it extends: a seller has one cover, not two.
    plan: accountCover ? "account_pass" : ((picked.plan as string | null) ?? null),
    licenseKey: picked.license_key ?? null,
    createdAt: picked.created_at ?? null,
    expiresAt: picked.expires_at ?? null,
  };
}

export async function isLicenseActive(userId: string | null | undefined): Promise<boolean> {
  const summary = await fetchLicenseForUser(userId);
  return summary.status === "active";
}

export async function claimCasePass(userId: string, caseId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin.rpc("claim_case_pass", {
    p_user_id: userId,
    p_case_id: caseId,
  });
  if (error) throw new Error("Case entitlement lookup unavailable");
  return data === true;
}

/** Covered for the AI reading of documents: by any Pass for the case, or by a document review for it. */
export async function claimDocumentReview(userId: string, caseId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin.rpc("claim_document_review", {
    p_user_id: userId,
    p_case_id: caseId,
  });
  if (error) throw new Error("Case entitlement lookup unavailable");
  return data === true;
}

/** Whether the case has a live document review (not a Pass: it covers only the AI reading). */
export async function fetchDocumentReview(userId: string, caseId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("status, expires_at, case_id")
    .eq("user_id", userId)
    .eq("plan", "document_review")
    .eq("case_id", caseId);
  if (error) throw new Error("License lookup unavailable");
  return ((data as Row[] | null) ?? []).some((row) => isLive(row));
}

/** Whether the account holds any live document review, for the route's cheap first check. */
export async function hasAnyDocumentReview(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("status, expires_at, case_id")
    .eq("user_id", userId)
    .eq("plan", "document_review");
  if (error) throw new Error("License lookup unavailable");
  return ((data as Row[] | null) ?? []).some((row) => isLive(row));
}

/**
 * The end of the latest Account Pass or renewal that has not been refunded, whether or not it has
 * ended yet: a renewal is offered shortly before it ends and for a while after.
 */
export async function fetchAccountCover(userId: string): Promise<{ expiresAt: string } | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("status, plan, expires_at")
    .eq("user_id", userId)
    .in("plan", ACCOUNT_COVER_PLANS)
    .eq("status", "active");
  if (error) throw new Error("License lookup unavailable");
  const ends = ((data as Row[] | null) ?? [])
    .map((row) => row.expires_at)
    .filter((e): e is string => Boolean(e))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return ends[0] ? { expiresAt: ends[0] } : null;
}

export interface ProStatus {
  verified: boolean;
  /** Credits that can be spent now: not refunded, not ended, not used. */
  creditsLeft: number;
  /** When the soonest-ending of those credits ends, if any. */
  creditsEndAt: string | null;
  /** Whether a Pro subscription is active. */
  proPlanActive: boolean;
}

export async function fetchProStatus(userId: string): Promise<ProStatus> {
  if (!supabaseAdmin)
    return { verified: false, creditsLeft: 0, creditsEndAt: null, proPlanActive: false };
  const [account, credits, plan] = await Promise.all([
    supabaseAdmin.from("pro_accounts").select("status").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("case_credits")
      .select("granted, used, expires_at, canceled_at")
      .eq("user_id", userId),
    supabaseAdmin
      .from("licenses")
      .select("status")
      .eq("user_id", userId)
      .eq("plan", "pro_plan")
      .eq("status", "active"),
  ]);
  if (account.error || credits.error || plan.error) throw new Error("License lookup unavailable");
  const usable = (
    (credits.data as
      | { granted: number; used: number; expires_at: string | null; canceled_at: string | null }[]
      | null) ?? []
  ).filter(
    (c) =>
      !c.canceled_at &&
      c.used < c.granted &&
      (!c.expires_at || Date.parse(c.expires_at) > Date.now()),
  );
  const ends = usable
    .map((c) => c.expires_at)
    .filter((e): e is string => Boolean(e))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return {
    verified: (account.data as { status?: string } | null)?.status === "verified",
    creditsLeft: usable.reduce((n, c) => n + (c.granted - c.used), 0),
    creditsEndAt: ends[0] ?? null,
    proPlanActive: ((plan.data as unknown[] | null) ?? []).length > 0,
  };
}

export type CreditUse = "used" | "covered" | "already_used" | "not_verified" | "no_credit";

/** A verified professional spends one credit to activate one case. */
export async function spendCaseCredit(userId: string, caseId: string): Promise<CreditUse> {
  if (!supabaseAdmin) throw new Error("Case entitlement lookup unavailable");
  const { data, error } = await supabaseAdmin.rpc("use_case_credit", {
    p_user_id: userId,
    p_case_id: caseId,
  });
  if (error) throw new Error("Case entitlement lookup unavailable");
  if (
    data === "used" ||
    data === "covered" ||
    data === "already_used" ||
    data === "not_verified" ||
    data === "no_credit"
  )
    return data;
  throw new Error("Case entitlement lookup unavailable");
}

/** The Paddle customer and subscription of an active Pro plan, for opening its billing portal. */
export async function fetchProSubscription(
  userId: string,
): Promise<{ customerId: string; subscriptionId: string } | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("licenses")
    .select("provider_customer_id, provider_subscription_id")
    .eq("user_id", userId)
    .eq("plan", "pro_plan")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("License lookup unavailable");
  const row = data as {
    provider_customer_id?: string | null;
    provider_subscription_id?: string | null;
  } | null;
  return row?.provider_customer_id && row.provider_subscription_id
    ? { customerId: row.provider_customer_id, subscriptionId: row.provider_subscription_id }
    : null;
}

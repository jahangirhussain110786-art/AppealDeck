import { supabaseAdmin } from "./supabase/server";

export type LicenseStatus = "active" | "past_due" | "canceled" | "paused" | "none";

export interface LicenseSummary {
  status: LicenseStatus;
  plan: string | null;
  licenseKey: string | null;
  createdAt?: string | null;
}

export async function fetchLicenseForUser(
  userId: string | null | undefined,
  caseId?: string,
): Promise<LicenseSummary> {
  if (!userId || !supabaseAdmin) {
    return { status: "none", plan: null, licenseKey: null };
  }
  const { data: rows, error } = await supabaseAdmin
    .from("licenses")
    .select("status, plan, license_key, created_at, expires_at, case_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("License lookup unavailable");
  const eligible = caseId ? rows?.filter((row) => row.case_id === caseId || !row.case_id) : rows;
  const active = eligible?.find(
    (row) =>
      row.status === "active" && (!row.expires_at || Date.parse(row.expires_at) > Date.now()),
  );
  const data = active ?? eligible?.[0];
  if (!data) {
    return { status: "none", plan: null, licenseKey: null };
  }
  return {
    status:
      data.status === "active" && data.expires_at && Date.parse(data.expires_at) <= Date.now()
        ? "none"
        : ((data.status as LicenseStatus) ?? "none"),
    plan: (data.plan as string | null) ?? null,
    licenseKey: (data.license_key as string | null) ?? null,
    createdAt: (data.created_at as string | null | undefined) ?? null,
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

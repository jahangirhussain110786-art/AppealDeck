import { supabaseAdmin } from "./supabase/server";

export type LicenseStatus = "active" | "past_due" | "canceled" | "paused" | "none";

export interface LicenseSummary {
  status: LicenseStatus;
  plan: string | null;
  licenseKey: string | null;
}

export async function fetchLicenseByEmail(
  email: string | null | undefined,
): Promise<LicenseSummary> {
  if (!email || !supabaseAdmin) {
    return { status: "none", plan: null, licenseKey: null };
  }
  const normalized = email.trim().toLowerCase();
  const { data } = await supabaseAdmin
    .from("licenses")
    .select("status, plan, license_key")
    .eq("email", normalized)
    .maybeSingle();
  if (!data) {
    return { status: "none", plan: null, licenseKey: null };
  }
  return {
    status: (data.status as LicenseStatus) ?? "none",
    plan: (data.plan as string | null) ?? null,
    licenseKey: (data.license_key as string | null) ?? null,
  };
}

export async function isLicenseActive(email: string | null | undefined): Promise<boolean> {
  const summary = await fetchLicenseByEmail(email);
  return summary.status === "active";
}

import type { SupabaseClient } from "@supabase/supabase-js";

export const DEVICE_CAP = 5;

export interface LicenseDevice {
  id: string;
  license_id: string;
  user_id: string | null;
  device_fingerprint: string;
  label: string | null;
  user_agent: string | null;
  first_seen_at: string;
  last_seen_at: string;
  revoked_at: string | null;
}

export interface DeviceActivationResult {
  status: "ok" | "over_cap" | "unavailable";
  device: LicenseDevice | null;
  activeCount: number;
  cap: number;
  overCapDevices: LicenseDevice[];
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function hashFingerprint(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface BuildFingerprintInput {
  userAgent: string;
  ip: string;
  acceptLanguage: string;
  userId: string;
}

export async function fingerprintFromRequest(input: BuildFingerprintInput): Promise<string> {
  const raw = [
    input.userAgent.trim().toLowerCase(),
    input.ip.trim().toLowerCase(),
    input.acceptLanguage.trim().toLowerCase(),
    input.userId,
  ].join("|");
  return hashFingerprint(raw);
}

/**
 * Shared request-fingerprint helper. Used by both `/api/compose` (device
 * activation) and `/api/devices` (current-device marker) so the two routes can
 * never drift on which headers they read.
 */
export async function deriveFingerprintFromRequest(
  req: Request | { headers: Headers },
  userId: string,
): Promise<string> {
  return fingerprintFromRequest({
    userAgent: req.headers.get("user-agent") ?? "",
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0",
    acceptLanguage: req.headers.get("accept-language") ?? "",
    userId,
  });
}

function shortLabelFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const m =
    ua.match(/Edg\/([\d.]+)/) ??
    ua.match(/Chrome\/([\d.]+)/) ??
    ua.match(/Firefox\/([\d.]+)/) ??
    ua.match(/Version\/([\d.]+).*Safari/);
  const version = m?.[1] ?? "";
  if (/Edg\//.test(ua)) return `Edge ${version}`.trim();
  if (/Firefox\//.test(ua)) return `Firefox ${version}`.trim();
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return `Chrome ${version}`.trim();
  if (/Safari/.test(ua) && /Version\//.test(ua)) return `Safari ${version}`.trim();
  return ua.slice(0, 60);
}

async function findActiveLicenseForUser(
  client: SupabaseClient,
  userId: string,
): Promise<{ id: string } | null> {
  const { data } = await client
    .from("licenses")
    .select("id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { id: (data as { id: string }).id };
}

async function countActiveDevices(client: SupabaseClient, licenseId: string): Promise<number> {
  const { count } = await client
    .from("license_devices")
    .select("id", { count: "exact", head: true })
    .eq("license_id", licenseId)
    .is("revoked_at", null);
  return count ?? 0;
}

export async function recordActivation(
  client: SupabaseClient,
  params: {
    userId: string;
    email: string;
    fingerprint: string;
    userAgent: string | null;
  },
): Promise<DeviceActivationResult> {
  const license = await findActiveLicenseForUser(client, params.userId);
  if (!license) {
    return { status: "ok", device: null, activeCount: 0, cap: DEVICE_CAP, overCapDevices: [] };
  }

  const { data: existing } = await client
    .from("license_devices")
    .select("*")
    .eq("license_id", license.id)
    .eq("device_fingerprint", params.fingerprint)
    .maybeSingle();

  if (existing) {
    const row = existing as LicenseDevice;
    if (row.revoked_at) {
      const count = await countActiveDevices(client, license.id);
      if (count >= DEVICE_CAP)
        return {
          status: "over_cap",
          device: null,
          activeCount: count,
          cap: DEVICE_CAP,
          overCapDevices: [],
        };
      const now = new Date().toISOString();
      const { error } = await client
        .from("license_devices")
        .update({ revoked_at: null, last_seen_at: now })
        .eq("id", row.id);
      if (error)
        return {
          status: error.code === "23514" ? "over_cap" : "unavailable",
          device: null,
          activeCount: await countActiveDevices(client, license.id),
          cap: DEVICE_CAP,
          overCapDevices: [],
        };
      return {
        status: "ok",
        device: { ...row, revoked_at: null, last_seen_at: now },
        activeCount: await countActiveDevices(client, license.id),
        cap: DEVICE_CAP,
        overCapDevices: [],
      };
    }
    await client
      .from("license_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", row.id);
    return {
      status: "ok",
      device: { ...row, last_seen_at: new Date().toISOString() },
      activeCount: await countActiveDevices(client, license.id),
      cap: DEVICE_CAP,
      overCapDevices: [],
    };
  }

  const activeCount = await countActiveDevices(client, license.id);
  if (activeCount >= DEVICE_CAP) {
    const { data: all } = await client
      .from("license_devices")
      .select("*")
      .eq("license_id", license.id)
      .is("revoked_at", null)
      .order("last_seen_at", { ascending: false });
    return {
      status: "over_cap",
      device: null,
      activeCount,
      cap: DEVICE_CAP,
      overCapDevices: (all as LicenseDevice[] | null) ?? [],
    };
  }

  const { data: inserted, error } = await client
    .from("license_devices")
    .insert({
      license_id: license.id,
      user_id: params.userId && isUuid(params.userId) ? params.userId : null,
      device_fingerprint: params.fingerprint,
      label: shortLabelFromUserAgent(params.userAgent),
      user_agent: params.userAgent?.slice(0, 240) ?? null,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23505") {
      const postCount = await countActiveDevices(client, license.id);
      if (postCount > DEVICE_CAP) {
        console.warn(
          `device cap exceeded under race: license=${license.id} count=${postCount} cap=${DEVICE_CAP}`,
        );
        const { data: all } = await client
          .from("license_devices")
          .select("*")
          .eq("license_id", license.id)
          .is("revoked_at", null)
          .order("last_seen_at", { ascending: false });
        return {
          status: "over_cap",
          device: null,
          activeCount: postCount,
          cap: DEVICE_CAP,
          overCapDevices: (all as LicenseDevice[] | null) ?? [],
        };
      }
    }
    return {
      status: code === "23514" ? "over_cap" : "unavailable",
      device: null,
      activeCount: await countActiveDevices(client, license.id),
      cap: DEVICE_CAP,
      overCapDevices: [],
    };
  }

  return {
    status: "ok",
    device: inserted as LicenseDevice,
    activeCount: activeCount + 1,
    cap: DEVICE_CAP,
    overCapDevices: [],
  };
}

export async function listDevices(
  client: SupabaseClient,
  userId: string,
): Promise<LicenseDevice[]> {
  const license = await findActiveLicenseForUser(client, userId);
  if (!license) return [];
  const { data } = await client
    .from("license_devices")
    .select("*")
    .eq("license_id", license.id)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });
  return (data as LicenseDevice[] | null) ?? [];
}

export async function revokeDevice(
  client: SupabaseClient,
  userId: string,
  deviceId: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!isUuid(deviceId)) return { ok: false, reason: "invalid_id" };
  const license = await findActiveLicenseForUser(client, userId);
  if (!license) return { ok: false, reason: "no_license" };
  const { data: target } = await client
    .from("license_devices")
    .select("id, license_id")
    .eq("id", deviceId)
    .maybeSingle();
  if (!target) return { ok: false, reason: "not_found" };
  if ((target as { license_id: string }).license_id !== license.id) {
    return { ok: false, reason: "not_owner" };
  }
  const { error } = await client
    .from("license_devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", deviceId);
  return { ok: !error, reason: error ? "db_error" : undefined };
}

export function deviceErrorResponse(result: DeviceActivationResult) {
  if (result.status === "unavailable")
    return new Response(
      JSON.stringify({ error: "Device verification unavailable. Please retry." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  return new Response(
    JSON.stringify({
      error: "device_cap_reached",
      message: `Your Appeal Pass is active on ${result.activeCount} of ${result.cap} allowed devices. Revoke one to continue.`,
      activeCount: result.activeCount,
      cap: result.cap,
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}

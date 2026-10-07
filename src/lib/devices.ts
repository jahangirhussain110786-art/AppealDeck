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
  acceptLanguage: string;
  userId: string;
}

export async function fingerprintFromRequest(input: BuildFingerprintInput): Promise<string> {
  // The IP address is deliberately NOT part of the fingerprint: a phone or home connection changes
  // address constantly, and each change would count as a new device until a paying seller hit the cap.
  // Version numbers and the language list are left out too (7 Oct 2026): a browser updates about
  // every four weeks, and each update changed the user-agent text, so one seller on one laptop
  // filled the five-device cap in months and was then refused until they removed their own ghosts.
  // What identifies a device is its browser family and system, and the first language.
  const family = input.userAgent
    .trim()
    .toLowerCase()
    .replace(/[0-9]+(?:[._][0-9]+)*/g, "")
    .replace(/\s+/g, " ");
  const language = input.acceptLanguage.trim().toLowerCase().split(/[,;]/)[0]?.split("-")[0] ?? "";
  const raw = [family, language, input.userId].join("|");
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

/**
 * The licence that device activations attach to: the newest active one that has not expired.
 * `error: true` means the lookup itself failed (a database blip), which callers must treat as
 * "unknown", never as "no licence" — treating it as none skipped the device cap entirely.
 */
async function findActiveLicenseForUser(
  client: SupabaseClient,
  userId: string,
): Promise<{ license: { id: string } | null; error: boolean }> {
  const { data, error } = await client
    .from("licenses")
    .select("id, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return { license: null, error: true };
  const now = Date.now();
  const row = ((data as Array<{ id: string; expires_at?: string | null }> | null) ?? []).find(
    (r) => !r.expires_at || Date.parse(r.expires_at) > now,
  );
  return { license: row ? { id: row.id } : null, error: false };
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
  const found = await findActiveLicenseForUser(client, params.userId);
  if (found.error) {
    // Fail closed: a database blip must not let a seller past the device cap.
    return {
      status: "unavailable",
      device: null,
      activeCount: 0,
      cap: DEVICE_CAP,
      overCapDevices: [],
    };
  }
  const license = found.license;
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
  const found = await findActiveLicenseForUser(client, userId);
  if (found.error) throw new Error("Device lookup unavailable");
  const license = found.license;
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
  const found = await findActiveLicenseForUser(client, userId);
  if (found.error) return { ok: false, reason: "db_error" };
  const license = found.license;
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
      message: `Your Appeal Pass is active on ${result.activeCount} of ${result.cap} allowed devices. Open Billing and remove one, then try again.`,
      activeCount: result.activeCount,
      cap: result.cap,
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}

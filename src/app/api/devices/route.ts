import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listDevices, revokeDevice, deriveFingerprintFromRequest } from "@/lib/devices";

export const dynamic = "force-dynamic";

const RevokeBody = z.object({ deviceId: z.string().uuid() });

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const email = (user.email ?? "").trim().toLowerCase();
  if (!supabaseAdmin || !email) {
    return NextResponse.json({ devices: [], cap: 5, currentDeviceId: null });
  }
  const devices = await listDevices(supabaseAdmin, email);
  const fingerprint = await deriveFingerprintFromRequest(req, user.id);
  const currentDeviceId = devices.find((d) => d.device_fingerprint === fingerprint)?.id ?? null;
  const safeDevices = devices.map((d) => ({
    id: d.id,
    license_id: d.license_id,
    user_id: d.user_id,
    label: d.label,
    user_agent: d.user_agent,
    first_seen_at: d.first_seen_at,
    last_seen_at: d.last_seen_at,
    revoked_at: d.revoked_at,
  }));
  return NextResponse.json({ devices: safeDevices, cap: 5, currentDeviceId });
}

export async function DELETE(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }
  const email = (user.email ?? "").trim().toLowerCase();
  if (!supabaseAdmin || !email) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = RevokeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "deviceId (uuid) required" }, { status: 400 });
  }
  const result = await revokeDevice(supabaseAdmin, email, parsed.data.deviceId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? "revoke_failed" },
      { status: result.reason === "not_found" ? 404 : 400 },
    );
  }
  return NextResponse.json({ ok: true });
}

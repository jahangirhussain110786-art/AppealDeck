import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listDevices, revokeDevice } from "@/lib/devices";

export const dynamic = "force-dynamic";

const RevokeBody = z.object({ deviceId: z.string().uuid() });

export async function GET() {
  const user = await requireUser();
  const email = (user.email ?? "").trim().toLowerCase();
  if (!supabaseAdmin || !email) {
    return NextResponse.json({ devices: [], cap: 5 });
  }
  const devices = await listDevices(supabaseAdmin, email);
  return NextResponse.json({ devices, cap: 5 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
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

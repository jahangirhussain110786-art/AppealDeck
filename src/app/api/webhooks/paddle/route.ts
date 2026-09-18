import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPaddleSignature(
  rawBody: string,
  secret: string,
  signatureHeader: string,
): Promise<boolean> {
  let ts: string | null = null;
  const signatures: string[] = [];
  for (const part of signatureHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "ts") ts = value;
    if (key === "h1") signatures.push(value);
  }
  if (!ts || !signatures.length) return false;

  const ageMs = Math.abs(Date.now() - Number(ts) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000) return false;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(`${ts}:${rawBody}`),
  );
  return signatures.some((signature) => timingSafeEqual(hexEncode(mac), signature));
}

const EventSchema = z.object({
  event_id: z.string().regex(/^evt_[a-z0-9]+$/),
  event_type: z.string().min(1),
  occurred_at: z.string().datetime({ offset: true }),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 501 });
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const valid = await verifyPaddleSignature(rawBody, secret, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!supabaseAdmin) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  let event;
  try {
    event = EventSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }
  try {
    const { error } = await supabaseAdmin.rpc("apply_paddle_event", {
      p_event: event,
      p_price_id: process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS ?? null,
    });
    if (error) throw error;
  } catch {
    console.error("Paddle event processing failed", {
      eventId: event.event_id,
      type: event.event_type,
    });
    return NextResponse.json({ error: "Provisioning failed; retry required" }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}

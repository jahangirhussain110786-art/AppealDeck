import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail } from "@/lib/email";

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
  let h1: string | null = null;
  for (const part of signatureHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "ts") ts = value;
    if (key === "h1") h1 = value;
  }
  if (!ts || !h1) return false;

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
  return timingSafeEqual(hexEncode(mac), h1);
}

function newLicenseKey(): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `AD-${rand.slice(0, 4)}-${rand.slice(4, 8)}-${rand.slice(8, 12)}`;
}

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function nowIso(): string {
  return new Date().toISOString();
}

type PaddleEvent = {
  event_type?: string;
  data?: Record<string, any>;
};

function extractEmail(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const candidate =
    data.customer?.email ?? data.customer_email ?? data.customerEmail ?? data.email ?? null;
  if (!isEmail(candidate)) return null;
  return candidate.trim().toLowerCase();
}

function planForPrice(priceId: string | undefined): string {
  const appealPass = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;
  const guardian = process.env.NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB;
  if (priceId && priceId === guardian) return "guardian_sub";
  if (priceId && priceId === appealPass) return "appeal_pass";
  return "appeal_pass";
}

function firstPriceId(items: any): string | undefined {
  if (Array.isArray(items) && items[0]?.price?.id) return items[0].price.id as string;
  if (Array.isArray(items) && items[0]?.price_id) return items[0].price_id as string;
  return undefined;
}

/** @returns "created" | "updated" | "skipped" (duplicate event or no admin client) — callers use
 * this to decide whether a purchase confirmation email is warranted (only on a genuine new license,
 * never on a duplicate webhook redelivery or a renewal update). */
async function ensureLicense(params: {
  email: string;
  providerId: string;
  plan: string;
  status: string;
  provider: "paddle";
  providerEventId: string;
}): Promise<"created" | "updated" | "skipped"> {
  if (!supabaseAdmin) return "skipped";
  const { email, providerId, plan, status, provider, providerEventId } = params;

  if (providerEventId) {
    const { data: seen } = await supabaseAdmin
      .from("license_events")
      .select("id")
      .eq("provider_event_id", providerEventId)
      .maybeSingle();
    if (seen) return "skipped";
  }

  const { data: existing } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .eq("provider_subscription_id", providerId)
    .maybeSingle();

  const isActive = status === "active";
  let result: "created" | "updated";

  if (existing) {
    await supabaseAdmin
      .from("licenses")
      .update({
        status,
        email,
        plan,
        activated_at: isActive ? nowIso() : null,
        canceled_at: status === "canceled" ? nowIso() : null,
        paused_at: status === "paused" ? nowIso() : null,
      })
      .eq("provider_subscription_id", providerId);
    result = "updated";
  } else {
    await supabaseAdmin.from("licenses").insert({
      license_key: newLicenseKey(),
      email,
      plan,
      provider,
      provider_subscription_id: providerId,
      status,
      activated_at: isActive ? nowIso() : null,
    });
    result = "created";
  }

  if (providerEventId) {
    await supabaseAdmin
      .from("license_events")
      .insert({ provider: "paddle", provider_event_id: providerEventId });
  }

  return result;
}

async function handleEvent(event: PaddleEvent): Promise<void> {
  const type = event.event_type;
  const data = event.data;

  if (type === "transaction.completed") {
    const email = extractEmail(data);
    if (!email) return;
    const priceId = firstPriceId(data?.items);
    const result = await ensureLicense({
      email,
      providerId: String(data?.subscription_id ?? data?.id ?? ""),
      plan: planForPrice(priceId),
      status: "active",
      provider: "paddle",
      providerEventId: String(data?.id ?? ""),
    });
    // Only the actual one-time Appeal Pass purchase (not a subscription renewal, not a duplicate
    // webhook redelivery) sends the D8-required confirmation email — a genuinely new license row.
    if (result === "created") {
      await sendPurchaseConfirmationEmail({ to: email, purchasedAt: nowIso() });
    }
    return;
  }

  if (type === "subscription.activated" || type === "subscription.created") {
    const email = extractEmail(data);
    if (!email) return;
    const priceId = firstPriceId(data?.items);
    await ensureLicense({
      email,
      providerId: String(data?.id ?? ""),
      plan: planForPrice(priceId),
      status: "active",
      provider: "paddle",
      providerEventId: `sub:${type}:${data?.id ?? ""}`,
    });
    return;
  }

  if (type === "subscription.canceled" || type === "subscription.paused") {
    if (!supabaseAdmin) return;
    const newStatus = type === "subscription.canceled" ? "canceled" : "paused";
    const { data: existing } = await supabaseAdmin
      .from("licenses")
      .select("id")
      .eq("provider_subscription_id", String(data?.id ?? ""))
      .maybeSingle();
    if (!existing) return;
    await supabaseAdmin
      .from("licenses")
      .update({
        status: newStatus,
        activated_at: null,
        canceled_at: newStatus === "canceled" ? nowIso() : null,
        paused_at: newStatus === "paused" ? nowIso() : null,
      })
      .eq("provider_subscription_id", String(data?.id ?? ""));
    return;
  }
}

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

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch (e) {
    console.error(
      "Paddle webhook: invalid JSON after signature verification; ignoring to stop retries",
      {
        error: (e as Error).message,
        bodyLength: rawBody.length,
      },
    );
    return NextResponse.json({ received: true });
  }

  try {
    await handleEvent(event);
  } catch (e) {
    console.error("Paddle webhook: handler error", {
      type: event.event_type,
      error: (e as Error).message,
    });
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

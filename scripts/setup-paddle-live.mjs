// LIVE Paddle setup (10 Oct 2026). Run by the founder, never by an AI: it needs the live API key.
//
//   PADDLE_LIVE_KEY=pdl_live_apikey_... SITE_URL=https://appealdeck.com node scripts/setup-paddle-live.mjs
//
// What it does, each step only if not already done (safe to run twice):
//   1. finds or creates the "AppealDeck Appeal Pass" product and its $249 one-time, tax-inclusive price;
//   2. finds or creates a live client token for the checkout;
//   3. finds or creates the webhook to SITE_URL/api/webhooks/paddle with exactly the events the
//      database acts on (transaction.completed grants the Pass; adjustment.created/updated remove it
//      on a refund or chargeback — see supabase/migrations/0009);
//   4. writes the four production settings into Vercel with the Vercel CLI (values go in through
//      standard input, so they never appear in the command line or this script's output).
//
// It prints IDs only, never the API key, the client token or the webhook secret.
// Not done here, because Paddle has no API for them: the Default payment link, website approval and
// blocking the EU/EEA/UK countries. Those are in docs/DEPLOYMENT.md §5.
import { spawnSync } from "node:child_process";

const key = process.env.PADDLE_LIVE_KEY;
const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
if (!key)
  throw new Error(
    "PADDLE_LIVE_KEY required (Paddle dashboard → Developer tools → Authentication, live).",
  );
if (!key.includes("_live_"))
  throw new Error("That key is not a live key. Use the sandbox script for sandbox.");
if (!/^https:\/\/[^/]+$/.test(site))
  throw new Error("SITE_URL must be https://your-domain with no path.");
if (site.endsWith(".vercel.app"))
  console.warn(
    "Warning: Paddle usually needs your own domain approved for live checkout, not a vercel.app address.",
  );

async function api(path, body) {
  const res = await fetch(`https://api.paddle.com${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      `Paddle ${res.status} on ${path}: ${payload.error?.code ?? "unknown"} ${payload.error?.detail ?? ""}`,
    );
  return payload.data;
}

// 1. Product and price (same shape as the sandbox script, so both environments match).
const products = await api("/products?per_page=100");
let product = products.find((p) => p.custom_data?.appealdeck_catalog === "appeal-pass-v1");
product ??= await api("/products", {
  name: "AppealDeck Appeal Pass",
  tax_category: "saas",
  description: "Evidence-backed appeal preparation for one case. No reinstatement guarantee.",
  custom_data: { appealdeck_catalog: "appeal-pass-v1" },
});
const prices = await api(`/prices?product_id=${product.id}&per_page=100`);
let price = prices.find(
  (p) =>
    p.status === "active" &&
    p.unit_price.amount === "24900" &&
    p.unit_price.currency_code === "USD" &&
    !p.billing_cycle &&
    p.tax_mode === "internal",
);
price ??= await api("/prices", {
  product_id: product.id,
  name: "Appeal Pass — one case",
  description: "USD 249, one-time, tax-inclusive",
  unit_price: { amount: "24900", currency_code: "USD" },
  tax_mode: "internal",
  quantity: { minimum: 1, maximum: 1 },
});

// 2. Client token (public by design: it only opens the checkout).
const tokens = await api("/client-tokens");
let token = tokens.find((t) => t.name === "AppealDeck production" && t.status === "active");
token ??= await api("/client-tokens", {
  name: "AppealDeck production",
  description: "Checkout on the live AppealDeck site",
});

// 3. Webhook. The signing secret is only returned when the setting is created, so an existing one
// is reused only if PADDLE_WEBHOOK_SECRET_EXISTING is given; otherwise a new one is made.
const destination = `${site}/api/webhooks/paddle`;
const events = ["transaction.completed", "adjustment.created", "adjustment.updated"];
const settings = await api("/notification-settings");
let webhook = settings.find((s) => s.destination === destination && s.active !== false);
let webhookSecret = webhook?.endpoint_secret_key ?? process.env.PADDLE_WEBHOOK_SECRET_EXISTING;
if (!webhook || !webhookSecret) {
  webhook = await api("/notification-settings", {
    description: "AppealDeck: grant and revoke the Appeal Pass",
    type: "url",
    destination,
    subscribed_events: events,
    api_version: 1,
    include_sensitive_fields: false,
  });
  webhookSecret = webhook.endpoint_secret_key;
}
const subscribed = (webhook.subscribed_events ?? []).map((e) =>
  typeof e === "string" ? e : e.name,
);
const missing = events.filter((e) => !subscribed.includes(e));
if (missing.length)
  console.warn(
    `Warning: the webhook is missing ${missing.join(", ")}. Add them in Paddle → Notifications.`,
  );
if (!webhookSecret) throw new Error("Could not get the webhook signing secret.");

// 4. Vercel production settings, through the CLI the founder is already signed in to.
function setVercel(name, value) {
  const opts = { input: value, encoding: "utf8", shell: true };
  spawnSync("vercel", ["env", "rm", name, "production", "--yes"], { ...opts, input: "" });
  const added = spawnSync("vercel", ["env", "add", name, "production"], opts);
  if (added.status !== 0)
    throw new Error(`Vercel could not save ${name}: ${(added.stderr || "").slice(0, 300)}`);
}
setVercel("NEXT_PUBLIC_PADDLE_ENV", "production");
setVercel("NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS", price.id);
setVercel("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", token.token);
setVercel("PADDLE_WEBHOOK_SECRET", webhookSecret);

console.log(
  JSON.stringify(
    {
      environment: "production",
      productId: product.id,
      priceId: price.id,
      amount: "249.00 USD, tax-inclusive",
      webhook: destination,
      webhookEvents: events,
      vercelUpdated: [
        "NEXT_PUBLIC_PADDLE_ENV",
        "NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS",
        "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
        "PADDLE_WEBHOOK_SECRET",
      ],
      next: "Redeploy production on Vercel so the new settings take effect.",
    },
    null,
    2,
  ),
);

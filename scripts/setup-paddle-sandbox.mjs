// Sandbox only. Matches the existing $199 one-time, tax-inclusive Appeal Pass offer.
import fs from "node:fs";
const key = process.env.PADDLE_SANDBOX_KEY;
if (!key) throw new Error("PADDLE_SANDBOX_KEY required");
async function api(path, body) {
  const res = await fetch(`https://sandbox-api.paddle.com${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(`Paddle ${res.status}: ${payload.error?.code}`);
  return payload.data;
}
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
    p.unit_price.amount === "19900" &&
    p.unit_price.currency_code === "USD" &&
    !p.billing_cycle &&
    p.tax_mode === "internal",
);
price ??= await api("/prices", {
  product_id: product.id,
  name: "Appeal Pass — one case",
  description: "USD 199, one-time, tax-inclusive",
  unit_price: { amount: "19900", currency_code: "USD" },
  tax_mode: "internal",
  quantity: { minimum: 1, maximum: 1 },
});
const tokens = await api("/client-tokens");
let token = tokens.find((t) => t.name === "AppealDeck local sandbox" && t.status === "active");
token ??= await api("/client-tokens", {
  name: "AppealDeck local sandbox",
  description: "Local AppealDeck sandbox checkout testing",
});
let env = fs.readFileSync(".env.local", "utf8");
for (const [name, value] of Object.entries({
  NEXT_PUBLIC_PADDLE_ENV: "sandbox",
  NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS: price.id,
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: token.token,
})) {
  const line = `${name}=${value}`;
  const re = new RegExp(`^${name}=.*$`, "m");
  env = re.test(env) ? env.replace(re, () => line) : env + "\n" + line + "\n";
}
fs.writeFileSync(".env.local", env);
console.log(
  JSON.stringify({
    productId: product.id,
    priceId: price.id,
    environment: "sandbox",
    amount: "199.00 USD",
    taxMode: price.tax_mode,
    taxCategory: product.tax_category,
    localConfigUpdated: true,
  }),
);

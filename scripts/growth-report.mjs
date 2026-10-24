import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export function growthReport(rows, now = Date.now()) {
  const day = 86_400_000;
  const customers = new Map();
  let anonymous = 0;
  for (const row of rows) {
    if (!row.user_id) {
      anonymous += 1;
      continue;
    }
    const time = Date.parse(row.paid_at);
    if (!Number.isFinite(time) || time > now) continue;
    const held = customers.get(row.user_id) ?? { first: time, rows: [] };
    held.first = Math.min(held.first, time);
    held.rows.push(row);
    customers.set(row.user_id, held);
  }
  let mature = 0,
    immature = 0,
    known = 0,
    revenue = 0,
    fees = 0,
    missing = 0;
  for (const customer of customers.values()) {
    if (now - customer.first < 30 * day) {
      immature += 1;
      continue;
    }
    mature += 1;
    const window = customer.rows.filter((r) => Date.parse(r.paid_at) < customer.first + 30 * day);
    if (window.some((r) => r.currency !== "USD" || r.net_cents === null || r.fee_cents === null)) {
      missing += 1;
      continue;
    }
    known += 1;
    revenue += window.reduce((n, r) => n + Number(r.net_cents), 0);
    fees += window.reduce((n, r) => n + Number(r.fee_cents), 0);
  }
  return { mature, immature, known, missing, anonymous, revenue, fees, afterFees: revenue - fees };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Database environment is not configured.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db
      .from("growth_transaction_report")
      .select("transaction_id,user_id,currency,net_cents,fee_cents,paid_at")
      .order("transaction_id")
      .range(from, from + 499);
    if (error) throw new Error(`Could not read growth transactions: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  const report = growthReport(rows);
  const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
  console.log(`30-day purchase cohorts, as of ${new Date().toISOString()}`);
  console.log(
    `Customers observed for 30 days: ${report.mature}; still maturing: ${report.immature}`,
  );
  console.log(
    `Complete USD cohorts: ${report.known}; excluded for missing totals, pending adjustments or currency: ${report.missing}; unattributed transactions: ${report.anonymous}`,
  );
  console.log(`First-30-day sales after tax and known refunds: ${dollars(report.revenue)}`);
  console.log(
    `Original Paddle fees: ${dollars(report.fees)}; after those fees: ${dollars(report.afterFees)}`,
  );
  console.log(
    "Not profit: subtract partner commissions, advertising, AI, support and other delivery costs. Original fees are not adjusted for fee refunds. No forecast LTV or reinstatement rate is inferred.",
  );
  console.log(
    "Includes payments received since migration 0023 only; older customers may appear new. Later refunds affect today's net figures. A cohort window is [first purchase, first purchase + 30 days).",
  );
  if (report.known < 20)
    console.log(
      "Fewer than 20 complete cohorts: use this to find gaps, not to justify scaling or a price increase.",
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

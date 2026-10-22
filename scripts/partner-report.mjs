#!/usr/bin/env node
// Partner commissions, month by month (22 Oct 2026). Read-only: it writes nothing and sends nothing.
//
// A partner code is a Paddle discount the founder makes by hand, and Paddle records the discount on
// every transaction that used it. The webhook stores that id on the licence (migration 0018,
// `licenses.provider_discount_id`), so a month's commissions are a grouping, not a spreadsheet job.
//
// What it counts, and why:
// - Only an Appeal Pass or an Account Pass. The partner discount is made for those two prices alone.
// - Only a licence still active. A refund or a chargeback cancels the licence, and a Pass that is
//   refunded pays nothing (the partner page says so).
// - Only after the 14-day refund window has passed. Commission is paid once, then.
// - The month it falls due is the month the window ended, because the founder pays once a month.
// - The founding offer is also a Paddle discount and lands in the same column. Pass its discount id
//   with --founding so it is left out; it is not a partner.
//
// What it does not do: it does not know what a buyer actually paid. It uses the list prices the
// partner page quotes ($249 and $329 less the $25 discount, then 30 percent), so a buyer who also got
// a different discount, or a partial refund such as the $25 outcome rebate, is not reflected. Check
// the amounts against Paddle before paying.
//
// Usage:
//   node --env-file=.env.local scripts/partner-report.mjs [--founding dsc_xxx] [--month 2026-11]

import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const WINDOW_DAYS = 14;
/** 30 percent of what the buyer pays: ($249 - $25) and ($329 - $25), in cents. */
export const COMMISSION_CENTS = { appeal_pass: 6720, account_pass: 9120 };

const DAY = 86_400_000;

/** The commissions due, per partner discount and per month. Pure, so it is tested without a database. */
export function commissionReport(licences, { now = new Date(), exclude = [] } = {}) {
  const skip = new Set(exclude);
  const partners = new Map();
  for (const row of licences) {
    const id = row.provider_discount_id;
    if (!id || skip.has(id)) continue;
    if (!(row.plan in COMMISSION_CENTS)) continue;
    if (row.status !== "active") continue;
    const paid = Date.parse(row.activated_at ?? "");
    if (Number.isNaN(paid)) continue;
    const dueAt = new Date(paid + WINDOW_DAYS * DAY);
    const partner = partners.get(id) ?? { discountId: id, waiting: 0, months: new Map() };
    partners.set(id, partner);
    if (dueAt > now) {
      partner.waiting += 1;
      continue;
    }
    const month = dueAt.toISOString().slice(0, 7);
    const entry = partner.months.get(month) ?? { sales: 0, cents: 0 };
    entry.sales += 1;
    entry.cents += COMMISSION_CENTS[row.plan];
    partner.months.set(month, entry);
  }
  return [...partners.values()]
    .map((p) => ({
      discountId: p.discountId,
      waiting: p.waiting,
      months: [...p.months.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v })),
    }))
    .sort((a, b) => a.discountId.localeCompare(b.discountId));
}

export const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;

export function formatCommissionReport(report, onlyMonth) {
  if (report.length === 0) return "No partner sales yet.\n";
  const lines = [];
  for (const p of report) {
    lines.push(`Discount ${p.discountId}`);
    const months = onlyMonth ? p.months.filter((m) => m.month === onlyMonth) : p.months;
    for (const m of months) lines.push(`  ${m.month}: ${m.sales} sale(s), ${dollars(m.cents)} due`);
    if (months.length === 0) lines.push("  nothing due yet");
    if (p.waiting)
      lines.push(`  ${p.waiting} sale(s) still inside the ${WINDOW_DAYS}-day refund window`);
  }
  lines.push("", "Amounts use the list prices; check them against Paddle before you pay.");
  return lines.join("\n") + "\n";
}

async function main() {
  const args = process.argv.slice(2);
  const take = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("licenses")
    .select("plan, status, provider_discount_id, activated_at")
    .not("provider_discount_id", "is", null);
  if (error) {
    console.error(`Could not read licences: ${error.message}`);
    process.exit(1);
  }
  const founding = take("--founding");
  const report = commissionReport(data ?? [], { exclude: founding ? [founding] : [] });
  process.stdout.write(formatCommissionReport(report, take("--month")));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

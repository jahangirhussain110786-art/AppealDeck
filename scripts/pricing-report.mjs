#!/usr/bin/env node
// What the price test shows (22 Oct 2026). Read-only: it writes nothing and sends nothing.
//
// Counts only, from the database the product already keeps. It reads no seller text and no case.
// It answers the questions the pricing plan was written to answer, so a price is changed on a number
// and not on a feeling:
// - how many of each product sold, and how many of the sales are still active (not refunded)
// - of the AI document reviews bought, how many then bought the Appeal Pass for the same case
// - how many outcome reports came in, by result, and how many refunds are still owed
// - how many case credits were given and how many used, and how many professionals are verified
//
// The first number to look at, before any other, is the sales count: with a handful of sales none of
// the ratios below means anything, and the report says so.
//
// Usage:
//   node --env-file=.env.local scripts/pricing-report.mjs [--days 60]

import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

/** Below this many sales a ratio is noise, and the report says so instead of printing a percentage. */
export const ENOUGH_SALES = 20;

const rate = (part, whole) => (whole === 0 ? "none yet" : `${part} of ${whole}`);

/** Pure summary of the rows, so it is tested without a database. */
/**
 * @typedef {{ plan: string, status: string, case_id: string | null, user_id: string | null }} PricingLicence
 * @typedef {{ result: string, rebate_status: string }} PricingReport
 * @typedef {{ granted: number, used: number }} PricingCredit
 * @typedef {{ status: string }} PricingProAccount
 */

/**
 * @param {{ licences: PricingLicence[], reports: PricingReport[], credits: PricingCredit[], proAccounts: PricingProAccount[] }} rows
 */
export function pricingReport({ licences, reports, credits, proAccounts }) {
  /** @type {Record<string, { sold: number, active: number }>} */
  const byPlan = {};
  for (const row of licences) {
    const entry = (byPlan[row.plan] ??= { sold: 0, active: 0 });
    entry.sold += 1;
    if (row.status === "active") entry.active += 1;
  }

  // A review is bought for a case; the credited Appeal Pass is bought for the same case.
  const reviews = licences.filter((l) => l.plan === "document_review" && l.case_id);
  const passCases = new Set(
    licences
      .filter((l) => l.plan === "appeal_pass" && l.case_id)
      .map((l) => `${l.user_id}:${l.case_id}`),
  );
  const reviewsThenPass = reviews.filter((l) => passCases.has(`${l.user_id}:${l.case_id}`)).length;

  /** @type {Record<string, number>} */
  const results = {};
  for (const r of reports) results[r.result] = (results[r.result] ?? 0) + 1;

  const granted = credits.reduce((n, c) => n + c.granted, 0);
  const used = credits.reduce((n, c) => n + c.used, 0);

  const sales = licences.length;
  return {
    sales,
    byPlan,
    reviews: { bought: reviews.length, thenPass: reviewsThenPass },
    outcomeReports: {
      total: reports.length,
      results,
      owed: reports.filter((r) => r.rebate_status === "pending").length,
    },
    credits: { granted, used },
    verifiedProfessionals: proAccounts.filter((p) => p.status === "verified").length,
    enough: sales >= ENOUGH_SALES,
  };
}

/**
 * @param {ReturnType<typeof pricingReport>} r
 * @param {number} days
 */
export function formatPricingReport(r, days) {
  const lines = [`Price test, last ${days} days`, `Sales: ${r.sales}`];
  if (!r.enough)
    lines.push(`  Fewer than ${ENOUGH_SALES} sales: read these as a list of events, not as rates.`);
  for (const [plan, v] of Object.entries(r.byPlan).sort())
    lines.push(`  ${plan}: ${v.sold} sold, ${v.active} still active`);
  lines.push(
    "",
    `AI document reviews that went on to the Appeal Pass for the same case: ${rate(r.reviews.thenPass, r.reviews.bought)}`,
    "",
    `Outcome reports: ${r.outcomeReports.total}`,
  );
  for (const [result, n] of Object.entries(r.outcomeReports.results).sort())
    lines.push(`  ${result}: ${n}`);
  lines.push(
    `  refunds still owed: ${r.outcomeReports.owed}`,
    "",
    `Case credits: ${r.credits.used} used of ${r.credits.granted} given`,
    `Verified professionals: ${r.verifiedProfessionals}`,
  );
  return lines.join("\n") + "\n";
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--days");
  const days = i >= 0 && Number(args[i + 1]) > 0 ? Number(args[i + 1]) : 60;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const read = async (table, columns, filter) => {
    const query = supabase.from(table).select(columns);
    const { data, error } = await (filter ? filter(query) : query);
    if (error) {
      console.error(`Could not read ${table}: ${error.message}`);
      process.exit(1);
    }
    return data ?? [];
  };
  const [licences, reports, credits, proAccounts] = await Promise.all([
    read("licenses", "plan, status, case_id, user_id", (q) =>
      q.eq("provider", "paddle").gte("activated_at", since),
    ),
    read("outcome_reports", "result, rebate_status", (q) => q.gte("created_at", since)),
    read("case_credits", "granted, used"),
    read("pro_accounts", "status"),
  ]);
  process.stdout.write(
    formatPricingReport(pricingReport({ licences, reports, credits, proAccounts }), days),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

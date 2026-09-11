#!/usr/bin/env node
// One-off dev-only script: grants (or refreshes) an active Appeal Pass license
// for one email address, bypassing Paddle entirely. For local testing only —
// this writes directly to the dev Supabase project's `licenses` table so the
// founder (or a coding agent) can sign in and exercise the full signed-in +
// purchased experience (composer, vault, billing "active" state) without a
// real checkout.
//
// NOT for production. NOT committed (this file is fine to commit — it holds
// no secrets — but never run it against a production project). Idempotent:
// updates the existing row for the email if one exists, else inserts a new
// one with a freshly generated license key in the same AD-XXXX-XXXX-XXXX
// format the real Paddle webhook uses (src/app/api/webhooks/paddle/route.ts).
//
// Usage:
//   node --env-file=.env.local scripts/grant-dev-license.mjs [email]
// Email defaults to DEV_LOGIN_EMAIL, then dev@appealdeck.com.

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = (process.argv[2] ?? process.env.DEV_LOGIN_EMAIL ?? "dev@appealdeck.com")
  .trim()
  .toLowerCase();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

function newLicenseKey() {
  const rand = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `AD-${rand.slice(0, 4)}-${rand.slice(4, 8)}-${rand.slice(8, 12)}`;
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const { data: existing, error: selectError } = await supabase
  .from("licenses")
  .select("id, license_key")
  .eq("email", EMAIL)
  .maybeSingle();

if (selectError) {
  console.error(`Failed to look up existing license: ${selectError.message}`);
  process.exit(1);
}

const nowIso = new Date().toISOString();

if (existing) {
  const { error: updateError } = await supabase
    .from("licenses")
    .update({
      status: "active",
      plan: "appeal_pass",
      provider: "dev-grant",
      activated_at: nowIso,
      canceled_at: null,
      paused_at: null,
    })
    .eq("id", existing.id);
  if (updateError) {
    console.error(`Failed to update license: ${updateError.message}`);
    process.exit(1);
  }
  console.log("OK (updated existing row)");
  console.log(`EMAIL=${EMAIL}`);
  console.log(`LICENSE_KEY=${existing.license_key}`);
} else {
  const licenseKey = newLicenseKey();
  const { error: insertError } = await supabase.from("licenses").insert({
    license_key: licenseKey,
    email: EMAIL,
    plan: "appeal_pass",
    provider: "dev-grant",
    status: "active",
    activated_at: nowIso,
  });
  if (insertError) {
    console.error(`Failed to insert license: ${insertError.message}`);
    process.exit(1);
  }
  console.log("OK (inserted new row)");
  console.log(`EMAIL=${EMAIL}`);
  console.log(`LICENSE_KEY=${licenseKey}`);
}

console.log(
  "This account now reads as an active Appeal Pass everywhere isLicenseActive(email) is checked (src/lib/license.ts) — vault, composer, billing, /api/license/status.",
);

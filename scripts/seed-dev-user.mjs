#!/usr/bin/env node
// One-off dev-only script: creates a Supabase auth user with a randomly
// generated password and prints both to stdout. Run once per fresh dev
// Supabase project so the founder + design partners can sign in without
// having to go through the email-confirmation loop.
//
// NOT for production. Idempotent — gives an existing user with the same email
// a new random password, or creates the user if there is none. Safe to re-run
// at any time on a dev project.
//
// It used to delete the existing user and create a fresh one. Since the Pass,
// case and reminder tables reference auth.users, that delete fails ("Database
// error deleting user") once the account has been used, and would lose the
// account's records if it succeeded. Updating keeps the same user id.
//
// Usage: node scripts/seed-dev-user.mjs
// Output: prints the email, user id, and new password.

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.DEV_LOGIN_EMAIL ?? "dev@appealdeck.com";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const password = `Dev-${randomBytes(12).toString("base64url")}-9!Aa`;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoConfirmUser: true },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error(`Failed to list users: ${listError.message}`);
  process.exit(1);
}

const existing = list.users.find((u) => u.email === EMAIL);
const { data, error } = existing
  ? await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
  : await supabase.auth.admin.createUser({ email: EMAIL, password, email_confirm: true });

if (error) {
  console.error(`Failed to ${existing ? "update" : "create"} user: ${error.message}`);
  process.exit(1);
}
console.log(existing ? `Updated existing user ${existing.id}.` : "Created user.");

console.log("OK");
console.log(`EMAIL=${data.user.email}`);
console.log(`USER_ID=${data.user.id}`);
console.log(`PASSWORD=${password}`);
console.log(
  "Store the password in your local password manager + paste it into .env.local as DEV_LOGIN_PASSWORD if you want the team to share it.",
);

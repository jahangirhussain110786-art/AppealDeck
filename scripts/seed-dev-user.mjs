#!/usr/bin/env node
// One-off dev-only script: creates a Supabase auth user with a randomly
// generated password and prints both to stdout. Run once per fresh dev
// Supabase project so the founder + design partners can sign in without
// having to go through the email-confirmation loop.
//
// NOT for production. NOT committed. Idempotent — deletes any existing user
// with the same email first, then creates a fresh one with a new random
// password. Safe to re-run at any time on a dev project.
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
if (existing) {
  const { error: delError } = await supabase.auth.admin.deleteUser(existing.id);
  if (delError) {
    console.error(`Failed to delete existing user ${existing.id}: ${delError.message}`);
    process.exit(1);
  }
  console.log(`Deleted existing user ${existing.id} (${EMAIL}).`);
}

const { data, error } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password,
  email_confirm: true,
});

if (error) {
  console.error(`Failed to create user: ${error.message}`);
  process.exit(1);
}

console.log("OK");
console.log(`EMAIL=${data.user.email}`);
console.log(`USER_ID=${data.user.id}`);
console.log(`PASSWORD=${password}`);
console.log(
  "Store the password in your local password manager + paste it into .env.local as DEV_LOGIN_PASSWORD if you want the team to share it.",
);

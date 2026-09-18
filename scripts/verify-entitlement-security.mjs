import { createClient } from "@supabase/supabase-js";
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query:
      "select has_table_privilege('authenticated','public.licenses','UPDATE') as client_can_update_license, (select count(*) from public.licenses where user_id is null) as unassigned_licenses, (select count(*) from public.payment_events where event_id like 'evt_regression%') as regression_rows;",
  }),
});
if (!res.ok) throw new Error(`Verification query failed: ${res.status}`);
console.log(JSON.stringify({ database: await res.json() }));
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);
if (process.env.DEV_LOGIN_EMAIL && process.env.DEV_LOGIN_PASSWORD) {
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env.DEV_LOGIN_EMAIL,
    password: process.env.DEV_LOGIN_PASSWORD,
  });
  if (error) throw new Error("Dev authentication failed");
  const { error: denied } = await client
    .from("licenses")
    .update({ status: "active" })
    .eq("id", crypto.randomUUID());
  if (!denied) throw new Error("Authenticated UPDATE privilege unexpectedly accepted");
  const { data: owned, error: readError } = await client.from("licenses").select("status,user_id");
  if (readError) throw new Error("Owner SELECT failed");
  if (owned.some((row) => row.user_id !== data.user.id))
    throw new Error("Foreign license readable");
  console.log(
    JSON.stringify({
      authenticatedLicenseWrite: "denied",
      ownerLicenseRead: "passed",
      licenses: owned.length,
    }),
  );
  await client.auth.signOut({ scope: "local" });
} else console.log("Dev login fixture not configured; skipped authenticated REST check.");

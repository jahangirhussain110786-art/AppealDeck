import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Database environment is not configured.");
const db = createClient(url, key, { auth: { persistSession: false } });
const money = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;
console.log("Partner balances, USD, as of now. Read-only; no money is sent.");
for (let from = 0; ; from += 500) {
  const { data, error } = await db
    .from("partners")
    .select("id,user_id")
    .order("id")
    .range(from, from + 499);
  if (error) throw new Error(`Could not read partners: ${error.message}`);
  for (const partner of data ?? []) {
    const { data: s, error: statementError } = await db.rpc("partner_statement", {
      p_user_id: partner.user_id,
    });
    if (statementError || !s) throw new Error(`Could not read statement for ${partner.id}.`);
    console.log(
      `${partner.id}: balance ${money(s.earned - s.paid)}, pending ${money(s.pending)}, paid ${money(s.paid)}, held ${s.held}; codes ${s.codes.map((c) => c.code).join(", ") || "none"}`,
    );
  }
  if (!data || data.length < 500) break;
}
console.log(
  "Reconcile with Paddle and your transfer records before paying. Negative balances carry forward. Historical sales before migration 0023 are not included.",
);

import fs from "node:fs";
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const sql = fs.readFileSync("supabase/migrations/0009_entitlement_integrity.sql", "utf8");
const testFile = "supabase/tests/entitlement_integrity.sql";
const tests = fs.existsSync(testFile) ? fs.readFileSync(testFile, "utf8") : "";
const apply = process.argv.includes("--apply");
const query = apply ? sql : sql.replace(/commit;\s*$/, () => tests + "\nrollback;");
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});
if (!res.ok) {
  const data = await res.json();
  console.error(JSON.stringify({ status: res.status, message: data.message }));
  process.exitCode = 1;
} else
  console.log(
    apply
      ? "Migration applied."
      : "Migration and SQL regression checks passed; transaction rolled back.",
  );

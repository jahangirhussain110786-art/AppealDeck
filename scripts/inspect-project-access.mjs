// Read-only service inventory. Never prints credentials, user records, or payment payloads.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ref = url ? new URL(url).hostname.split(".")[0] : null;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (ref && token) {
  for (const path of [`projects/${ref}`, `projects/${ref}/config/auth`]) {
    const res = await fetch(`https://api.supabase.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(
      JSON.stringify({
        service: "supabase",
        endpoint: path.endsWith("/auth") ? "auth" : "project",
        status: res.status,
        project: data.name,
        emailConfirmationRequired:
          data.mailer_autoconfirm === undefined ? undefined : !data.mailer_autoconfirm,
      }),
    );
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "select tablename, policyname, cmd from pg_policies where schemaname='public' and tablename='licenses';",
    }),
  });
  console.log(
    JSON.stringify({
      service: "supabase",
      endpoint: "policies",
      status: res.status,
      data: res.ok ? await res.json() : undefined,
    }),
  );
}
if (process.env.VERCEL_API_KEY) {
  const res = await fetch("https://api.vercel.com/v9/projects?limit=20", {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_KEY}` },
  });
  const data = await res.json();
  console.log(
    JSON.stringify({
      service: "vercel",
      status: res.status,
      projects: data.projects?.map((p) => ({ name: p.name, id: p.id, repository: p.link?.repo })),
    }),
  );
}
if (process.env.PADDLE_SANDBOX_KEY) {
  const res = await fetch("https://sandbox-api.paddle.com/prices?per_page=10", {
    headers: { Authorization: `Bearer ${process.env.PADDLE_SANDBOX_KEY}` },
  });
  const data = await res.json();
  console.log(
    JSON.stringify({
      service: "paddle-sandbox",
      status: res.status,
      prices: data.data?.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        productId: p.product_id,
      })),
      errorCode: data.error?.code,
    }),
  );
}

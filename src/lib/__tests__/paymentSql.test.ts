import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The payment SQL, run for real (22 Oct 2026).
 *
 * Until this file existed, `apply_paddle_event` and `claim_case_pass` were exercised only by mocks
 * in TypeScript and by hand-run scripts in `supabase/tests/`, so a mistake in the SQL that decides
 * who has paid would have been found by a customer. This applies every migration in
 * `supabase/migrations`, in order, to PGlite (PostgreSQL running in this process), with the few
 * Supabase-only objects they refer to stubbed, and then calls the functions the webhook calls.
 *
 * What it proves: the Appeal Pass path is unchanged by migration 0017; an Account Pass is created
 * with no case and a 12-month expiry, covers any case without binding anything, and is refused a
 * second time; a refund cancels it and a reversal restores it only when that is safe.
 */
const MIGRATIONS = path.join(process.cwd(), "supabase", "migrations");

// Only what the migrations reference and a plain Postgres lacks.
const SUPABASE_STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create function auth.email() returns text language sql stable as $$ select null::text $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
`;

const CASE_PRICE = "pri_case";
const ACCOUNT_PRICE = "pri_account";

let db: PGlite;
let counter = 0;

async function newUser(): Promise<string> {
  counter += 1;
  const r = await db.query<{ id: string }>(
    "insert into auth.users(email) values ($1) returning id",
    [`buyer${counter}@example.com`],
  );
  return r.rows[0]!.id;
}

async function newIntent(userId: string, caseId: string, priceId: string): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into checkout_intents(user_id, case_id, email, price_id, consent_text)
     values ($1, $2, 'buyer@example.com', $3, 'consent') returning id`,
    [userId, caseId, priceId],
  );
  return r.rows[0]!.id;
}

function completed(
  txn: string,
  priceId: string,
  intentId: string,
  occurred = "2026-10-22T10:00:00Z",
) {
  counter += 1;
  return {
    event_id: `evt_${counter}`,
    event_type: "transaction.completed",
    occurred_at: occurred,
    data: {
      id: txn,
      items: [{ price: { id: priceId } }],
      custom_data: { checkout_intent_id: intentId },
    },
  };
}

function adjustment(
  adjId: string,
  txn: string,
  status: string,
  occurred: string,
  type: "adjustment.created" | "adjustment.updated" = "adjustment.created",
) {
  counter += 1;
  return {
    event_id: `evt_${counter}`,
    event_type: type,
    occurred_at: occurred,
    data: { id: adjId, transaction_id: txn, action: "refund", status, type: "full" },
  };
}

async function apply(event: object, accountPrice: string | null = ACCOUNT_PRICE): Promise<string> {
  const r = await db.query<{ r: string }>("select apply_paddle_event($1::jsonb, $2, $3) as r", [
    JSON.stringify(event),
    CASE_PRICE,
    accountPrice,
  ]);
  return r.rows[0]!.r;
}

async function claim(userId: string, caseId: string): Promise<boolean> {
  const r = await db.query<{ r: boolean }>("select claim_case_pass($1::uuid, $2) as r", [
    userId,
    caseId,
  ]);
  return r.rows[0]!.r;
}

async function licences(userId: string) {
  const r = await db.query<{
    plan: string;
    case_id: string | null;
    status: string;
    expires_at: string | null;
    activated_at: string | null;
    provider_transaction_id: string | null;
  }>(
    `select plan, case_id, status, expires_at, activated_at, provider_transaction_id
       from licenses where user_id = $1 order by created_at, id`,
    [userId],
  );
  return r.rows;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
}, 120_000);

describe("every migration applies, in order, to a real Postgres", () => {
  it("leaves the Account Pass plan allowed and the payment functions in place", async () => {
    const plans = await db.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'licenses_plan_check'",
    );
    expect(plans.rows[0]?.def).toContain("account_pass");
    const fns = await db.query<{ n: string }>(
      "select proname as n from pg_proc where proname in ('apply_paddle_event','claim_case_pass')",
    );
    expect(fns.rows.map((r) => r.n).sort()).toEqual(["apply_paddle_event", "claim_case_pass"]);
  });
});

describe("the Appeal Pass path is unchanged", () => {
  it("creates a licence for the case it was bought for, with no expiry", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", CASE_PRICE);
    expect(await apply(completed("txn_c1", CASE_PRICE, intent))).toBe("ok");
    const rows = await licences(user);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ plan: "appeal_pass", case_id: "case-1", status: "active" });
    expect(rows[0]!.expires_at).toBeNull();
    expect(await claim(user, "case-1")).toBe(true);
    expect(await claim(user, "case-2")).toBe(false);
  });

  it("works with the two-argument call the app makes before an Account Pass is configured", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", CASE_PRICE);
    const event = completed("txn_old", CASE_PRICE, intent);
    const r = await db.query<{ r: string }>("select apply_paddle_event($1::jsonb, $2) as r", [
      JSON.stringify(event),
      CASE_PRICE,
    ]);
    expect(r.rows[0]!.r).toBe("ok");
    expect((await licences(user))[0]).toMatchObject({ plan: "appeal_pass", status: "active" });
  });

  it("still parks a second Pass bought for the same case", async () => {
    const user = await newUser();
    await apply(completed("txn_a", CASE_PRICE, await newIntent(user, "case-1", CASE_PRICE)));
    const second = await apply(
      completed("txn_b", CASE_PRICE, await newIntent(user, "case-1", CASE_PRICE)),
    );
    expect(second).toMatch(/^unmatched:duplicate Pass/);
    expect(await licences(user)).toHaveLength(1);
  });

  it("still binds a legacy unassigned Appeal Pass to its first case", async () => {
    const user = await newUser();
    await db.query(
      `insert into licenses(license_key, email, user_id, plan, status, provider)
       values ($1, 'legacy@example.com', $2, 'appeal_pass', 'active', 'regression')`,
      [`LEGACY-${user}`, user],
    );
    expect(await claim(user, "case-first")).toBe(true);
    expect((await licences(user))[0]!.case_id).toBe("case-first");
    expect(await claim(user, "case-second")).toBe(false);
  });

  it("parks a payment whose price matches neither configured price", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", CASE_PRICE);
    const result = await apply(completed("txn_x", "pri_unknown", intent));
    expect(result).toMatch(/^unmatched:no item matches/);
    expect(await licences(user)).toHaveLength(0);
  });
});

describe("the Account Pass", () => {
  it("is created with no case and an expiry twelve months after the payment", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", ACCOUNT_PRICE);
    expect(await apply(completed("txn_acct", ACCOUNT_PRICE, intent))).toBe("ok");
    const rows = await licences(user);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ plan: "account_pass", case_id: null, status: "active" });
    const check = await db.query<{ ok: boolean }>(
      "select expires_at = activated_at + interval '12 months' as ok from licenses where user_id = $1",
      [user],
    );
    expect(check.rows[0]!.ok).toBe(true);
  });

  it("covers any case without binding anything to a case", async () => {
    const user = await newUser();
    await apply(
      completed("txn_acct2", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
    );
    expect(await claim(user, "case-1")).toBe(true);
    expect(await claim(user, "a-case-bought-later")).toBe(true);
    expect((await licences(user))[0]).toMatchObject({ plan: "account_pass", case_id: null });
  });

  it("does not use up a legacy unassigned Appeal Pass the account already covers", async () => {
    const user = await newUser();
    await db.query(
      `insert into licenses(license_key, email, user_id, plan, status, provider)
       values ($1, 'legacy@example.com', $2, 'appeal_pass', 'active', 'regression')`,
      [`LEGACY-${user}`, user],
    );
    await apply(
      completed("txn_acct3", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
    );
    expect(await claim(user, "case-1")).toBe(true);
    const unassigned = (await licences(user)).filter((r) => r.plan === "appeal_pass");
    expect(unassigned[0]!.case_id).toBeNull();
  });

  it("covers nothing once it has expired", async () => {
    const user = await newUser();
    await apply(
      completed("txn_acct4", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
    );
    await db.query("update licenses set expires_at = now() - interval '1 day' where user_id = $1", [
      user,
    ]);
    expect(await claim(user, "case-1")).toBe(false);
  });

  it("is refused a second time while the first is active, and parked for a refund", async () => {
    const user = await newUser();
    await apply(
      completed("txn_acct5", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
    );
    const second = await apply(
      completed("txn_acct6", ACCOUNT_PRICE, await newIntent(user, "case-2", ACCOUNT_PRICE)),
    );
    expect(second).toMatch(/^unmatched:duplicate Account Pass/);
    expect(await licences(user)).toHaveLength(1);
  });

  it("can be bought by someone who already holds an Appeal Pass for a case", async () => {
    const user = await newUser();
    await apply(completed("txn_case9", CASE_PRICE, await newIntent(user, "case-1", CASE_PRICE)));
    expect(
      await apply(
        completed("txn_acct9", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
      ),
    ).toBe("ok");
    expect((await licences(user)).map((r) => r.plan).sort()).toEqual([
      "account_pass",
      "appeal_pass",
    ]);
  });

  it("is not created when no Account Pass price is configured: the payment is parked", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", ACCOUNT_PRICE);
    const result = await apply(completed("txn_acct7", ACCOUNT_PRICE, intent), null);
    expect(result).toMatch(/^unmatched:no item matches/);
    expect(await licences(user)).toHaveLength(0);
  });

  it("is parked when the intent was made for the other price", async () => {
    const user = await newUser();
    const intent = await newIntent(user, "case-1", CASE_PRICE);
    const result = await apply(completed("txn_acct8", ACCOUNT_PRICE, intent));
    expect(result).toMatch(/^unmatched:checkout intent price differs/);
    expect(await licences(user)).toHaveLength(0);
  });

  it("ignores a payment event it has already seen", async () => {
    const user = await newUser();
    const event = completed(
      "txn_dup",
      ACCOUNT_PRICE,
      await newIntent(user, "case-1", ACCOUNT_PRICE),
    );
    expect(await apply(event)).toBe("ok");
    expect(await apply(event)).toBe("duplicate");
    expect(await licences(user)).toHaveLength(1);
  });

  it("is refused by the database itself if two active ones are ever inserted", async () => {
    const user = await newUser();
    const insert = (key: string) =>
      db.query(
        `insert into licenses(license_key, email, user_id, plan, status, provider)
         values ($1, 'x@example.com', $2, 'account_pass', 'active', 'regression')`,
        [key, user],
      );
    await insert(`ACCT-A-${user}`);
    await expect(insert(`ACCT-B-${user}`)).rejects.toThrow();
  });

  it("refuses a plan name the database does not know", async () => {
    const user = await newUser();
    await expect(
      db.query(
        `insert into licenses(license_key, email, user_id, plan, status, provider)
         values ($1, 'x@example.com', $2, 'bogus_plan', 'active', 'regression')`,
        [`BOGUS-${user}`, user],
      ),
    ).rejects.toThrow();
  });
});

describe("refunds and their reversal", () => {
  it("a full refund cancels an Account Pass and ends the cover", async () => {
    const user = await newUser();
    await apply(completed("txn_r1", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)));
    await apply(adjustment("adj_r1", "txn_r1", "approved", "2026-10-23T10:00:00Z"));
    expect((await licences(user))[0]!.status).toBe("canceled");
    expect(await claim(user, "case-1")).toBe(false);
  });

  it("a refund that is later rejected restores the Account Pass", async () => {
    const user = await newUser();
    await apply(completed("txn_r2", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)));
    await apply(adjustment("adj_r2", "txn_r2", "approved", "2026-10-23T10:00:00Z"));
    await apply(
      adjustment("adj_r2", "txn_r2", "rejected", "2026-10-24T10:00:00Z", "adjustment.updated"),
    );
    expect((await licences(user))[0]!.status).toBe("active");
    expect(await claim(user, "case-1")).toBe(true);
  });

  it("does not restore a refunded Account Pass when a newer one is active (no second active, no error)", async () => {
    const user = await newUser();
    await apply(completed("txn_r3", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)));
    await apply(adjustment("adj_r3", "txn_r3", "approved", "2026-10-23T10:00:00Z"));
    // refunded, so a new one can be bought
    expect(
      await apply(
        completed("txn_r3b", ACCOUNT_PRICE, await newIntent(user, "case-1", ACCOUNT_PRICE)),
      ),
    ).toBe("ok");
    // the first refund is then reversed: the first stays cancelled, and the call does not fail
    await apply(
      adjustment("adj_r3", "txn_r3", "rejected", "2026-10-25T10:00:00Z", "adjustment.updated"),
    );
    const rows = await licences(user);
    expect(rows.filter((r) => r.status === "active")).toHaveLength(1);
    expect(rows.find((r) => r.provider_transaction_id === "txn_r3")!.status).toBe("canceled");
  });

  it("a refund of an Appeal Pass still cancels it", async () => {
    const user = await newUser();
    await apply(completed("txn_r4", CASE_PRICE, await newIntent(user, "case-1", CASE_PRICE)));
    await apply(adjustment("adj_r4", "txn_r4", "approved", "2026-10-23T10:00:00Z"));
    expect((await licences(user))[0]!.status).toBe("canceled");
    expect(await claim(user, "case-1")).toBe(false);
  });
});

import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * PostgreSQL in this process, with every migration applied (22 Oct 2026). Shared by the payment SQL
 * tests, so the same real database logic that runs in production is what they call.
 *
 * Only what the migrations refer to and a plain Postgres lacks is stubbed: the Supabase roles, the
 * `auth` and `storage` schemas, and the three functions the row-level-security policies call.
 */
const MIGRATIONS = path.join(process.cwd(), "supabase", "migrations");

export const SUPABASE_STUBS = `
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

/** A fresh database with every migration in `supabase/migrations` applied, in order. */
export async function createMigratedDb(): Promise<PGlite> {
  const db = new PGlite();
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
  return db;
}

let counter = 0;
export const nextCounter = () => (counter += 1);

export async function newUser(db: PGlite): Promise<string> {
  const r = await db.query<{ id: string }>(
    "insert into auth.users(email) values ($1) returning id",
    [`buyer${nextCounter()}@example.com`],
  );
  return r.rows[0]!.id;
}

export async function newIntent(
  db: PGlite,
  userId: string,
  caseId: string,
  priceId: string,
): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into checkout_intents(user_id, case_id, email, price_id, consent_text)
     values ($1, $2, 'buyer@example.com', $3, 'consent') returning id`,
    [userId, caseId, priceId],
  );
  return r.rows[0]!.id;
}

export interface CompletedOptions {
  occurred?: string;
  discountId?: string;
  customerId?: string;
  subscriptionId?: string;
  /** Leave out the checkout intent, as a subscription's monthly payment does. */
  noIntent?: boolean;
}

export function completed(
  txn: string,
  priceId: string,
  intentId: string | null,
  o: CompletedOptions = {},
) {
  return {
    event_id: `evt_${nextCounter()}`,
    event_type: "transaction.completed",
    occurred_at: o.occurred ?? "2026-10-22T10:00:00Z",
    data: {
      id: txn,
      items: [{ price: { id: priceId } }],
      ...(o.noIntent || !intentId ? {} : { custom_data: { checkout_intent_id: intentId } }),
      ...(o.discountId ? { discount_id: o.discountId } : {}),
      ...(o.customerId ? { customer_id: o.customerId } : {}),
      ...(o.subscriptionId ? { subscription_id: o.subscriptionId } : {}),
    },
  };
}

export function adjustment(
  adjId: string,
  txn: string,
  status: string,
  occurred: string,
  type: "adjustment.created" | "adjustment.updated" = "adjustment.created",
) {
  return {
    event_id: `evt_${nextCounter()}`,
    event_type: type,
    occurred_at: occurred,
    data: { id: adjId, transaction_id: txn, action: "refund", status, type: "full" },
  };
}

export function subscriptionEvent(subId: string, status: string, occurred: string) {
  return {
    event_id: `evt_${nextCounter()}`,
    event_type: status === "canceled" ? "subscription.canceled" : "subscription.updated",
    occurred_at: occurred,
    data: { id: subId, status },
  };
}

export const PRICES = {
  case: "pri_case",
  account: "pri_account",
  extras: {
    document_review: "pri_review",
    pass_after_review: "pri_credited",
    account_renewal: "pri_renew",
    pack_10: "pri_p10",
    pack_30: "pri_p30",
    pro_plan: "pri_pro",
  },
} as const;

export async function apply(
  db: PGlite,
  event: object,
  opts: { account?: string | null; extras?: Record<string, string> | null } = {},
): Promise<string> {
  const account = opts.account === undefined ? PRICES.account : opts.account;
  const extras = opts.extras === undefined ? PRICES.extras : opts.extras;
  const r = await db.query<{ r: string }>(
    "select apply_paddle_event($1::jsonb, $2, $3, $4::jsonb) as r",
    [JSON.stringify(event), PRICES.case, account, JSON.stringify(extras ?? {})],
  );
  return r.rows[0]!.r;
}

export async function claim(db: PGlite, userId: string, caseId: string): Promise<boolean> {
  const r = await db.query<{ r: boolean }>("select claim_case_pass($1::uuid, $2) as r", [
    userId,
    caseId,
  ]);
  return r.rows[0]!.r;
}

export async function claimReview(db: PGlite, userId: string, caseId: string): Promise<boolean> {
  const r = await db.query<{ r: boolean }>("select claim_document_review($1::uuid, $2) as r", [
    userId,
    caseId,
  ]);
  return r.rows[0]!.r;
}

export async function useCredit(db: PGlite, userId: string, caseId: string): Promise<string> {
  const r = await db.query<{ r: string }>("select use_case_credit($1::uuid, $2) as r", [
    userId,
    caseId,
  ]);
  return r.rows[0]!.r;
}

export interface LicenceRow {
  plan: string;
  case_id: string | null;
  status: string;
  provider: string | null;
  expires_at: string | null;
  activated_at: string | null;
  provider_transaction_id: string | null;
  provider_subscription_id: string | null;
  provider_discount_id: string | null;
  provider_customer_id: string | null;
}

export async function licences(db: PGlite, userId: string): Promise<LicenceRow[]> {
  const r = await db.query<LicenceRow>(
    `select plan, case_id, status, provider, expires_at, activated_at, provider_transaction_id,
            provider_subscription_id, provider_discount_id, provider_customer_id
       from licenses where user_id = $1 order by created_at, id`,
    [userId],
  );
  return r.rows;
}

export async function makeVerified(db: PGlite, userId: string): Promise<void> {
  await db.query(
    "insert into pro_accounts(user_id, status, business_name) values ($1, 'verified', 'Test appeals')",
    [userId],
  );
}

export async function credits(db: PGlite, userId: string) {
  const r = await db.query<{
    source: string;
    granted: number;
    used: number;
    expires_at: string | null;
    canceled_at: string | null;
    transaction_id: string | null;
  }>(
    `select source, granted, used, expires_at, canceled_at, transaction_id
       from case_credits where user_id = $1 order by created_at, id`,
    [userId],
  );
  return r.rows;
}

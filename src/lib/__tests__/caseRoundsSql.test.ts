import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { createMigratedDb, newUser } from "./pgHarness";

/**
 * Migration 0025 on a real Postgres: the server's high-water mark of a case's response round
 * (26 Oct 2026). It must never go down, or a reset case would offer a used One Response a second
 * first response.
 */
let db: PGlite;
beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

async function record(user: string, caseId: string, round: number): Promise<number> {
  const r = await db.query<{ r: number }>("select record_case_round($1::uuid, $2, $3) as r", [
    user,
    caseId,
    round,
  ]);
  return r.rows[0]!.r;
}

describe("record_case_round", () => {
  it("stores the first round and gives it back", async () => {
    const user = await newUser(db);
    expect(await record(user, "case-a", 1)).toBe(1);
  });

  it("takes the larger round and never lowers it", async () => {
    const user = await newUser(db);
    expect(await record(user, "case-b", 1)).toBe(1);
    expect(await record(user, "case-b", 2)).toBe(2);
    // The seller reset the case to look like round one again: the mark holds.
    expect(await record(user, "case-b", 1)).toBe(2);
  });

  it("keeps one mark per account and case", async () => {
    const user = await newUser(db);
    const other = await newUser(db);
    await record(user, "case-c1", 2);
    await record(other, "case-c1", 1);
    expect(await record(user, "case-c2", 1)).toBe(1);
    expect(await record(other, "case-c1", 1)).toBe(1);
  });

  it("refuses a round outside 1 to 99, a malformed case id, and an unknown account", async () => {
    const user = await newUser(db);
    await expect(record(user, "case-d", 0)).rejects.toThrow();
    await expect(record(user, "case-d", 100)).rejects.toThrow();
    await expect(record(user, "has spaces", 1)).rejects.toThrow();
    await expect(record("00000000-0000-0000-0000-000000000000", "case-d", 1)).rejects.toThrow();
  });

  it("is server-only: row-level security on, no policies, and no access for a browser role", async () => {
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where oid = 'public.case_rounds'::regclass",
    );
    expect(rls.rows[0]!.relrowsecurity).toBe(true);
    const policies = await db.query(
      "select 1 from pg_policies where schemaname = 'public' and tablename = 'case_rounds'",
    );
    expect(policies.rows).toHaveLength(0);
    const access = await db.query<{ anon_table: boolean; anon_fn: boolean; svc_fn: boolean }>(
      `select has_table_privilege('anon', 'public.case_rounds', 'select') as anon_table,
              has_function_privilege('anon', 'public.record_case_round(uuid, text, integer)', 'execute') as anon_fn,
              has_function_privilege('service_role', 'public.record_case_round(uuid, text, integer)', 'execute') as svc_fn`,
    );
    expect(access.rows[0]).toEqual({ anon_table: false, anon_fn: false, svc_fn: true });
  });
});

import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PRICES,
  apply,
  completed,
  createMigratedDb,
  licences,
  newIntent,
  newUser,
} from "./pgHarness";

/** Migration 0019 on a real Postgres: the identified outcome report and its rebate (22 Oct 2026). */
let db: PGlite;
beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

const insert = (user: string, txn: string, result = "approved", days: number | null = 10) =>
  db.query(
    "insert into outcome_reports(user_id, transaction_id, result, days_to_outcome) values ($1, $2, $3, $4)",
    [user, txn, result, days],
  );

describe("outcome_reports", () => {
  it("starts every report as a pending $25 rebate", async () => {
    const user = await newUser(db);
    await insert(user, "txn_o1");
    const r = await db.query<{
      rebate_status: string;
      rebate_cents: number;
      settled_at: string | null;
    }>(
      "select rebate_status, rebate_cents, settled_at from outcome_reports where transaction_id = 'txn_o1'",
    );
    expect(r.rows[0]).toEqual({ rebate_status: "pending", rebate_cents: 2500, settled_at: null });
  });

  it("allows one report per payment, however it is sent", async () => {
    const user = await newUser(db);
    await insert(user, "txn_o2");
    await expect(insert(user, "txn_o2")).rejects.toThrow();
    const other = await newUser(db);
    await expect(insert(other, "txn_o2")).rejects.toThrow();
  });

  it("accepts the four results and refuses any other", async () => {
    const user = await newUser(db);
    for (const result of ["approved", "rejected", "no_response", "withdrawn"])
      await insert(user, `txn_${result}`, result);
    await expect(insert(user, "txn_won", "won")).rejects.toThrow();
  });

  it("refuses a day count that is negative or absurd, and accepts none", async () => {
    const user = await newUser(db);
    await expect(insert(user, "txn_neg", "approved", -1)).rejects.toThrow();
    await expect(insert(user, "txn_big", "approved", 99999)).rejects.toThrow();
    await insert(user, "txn_none", "approved", null);
  });

  it("only takes the rebate states the founder uses, and settles", async () => {
    const user = await newUser(db);
    await insert(user, "txn_o3");
    await db.query(
      "update outcome_reports set rebate_status = 'refunded', settled_at = now() where transaction_id = 'txn_o3'",
    );
    await expect(
      db.query("update outcome_reports set rebate_status = 'paid' where transaction_id = 'txn_o3'"),
    ).rejects.toThrow();
  });

  it("is gone with the account", async () => {
    const user = await newUser(db);
    await insert(user, "txn_o4");
    await db.query("delete from auth.users where id = $1", [user]);
    const r = await db.query("select 1 from outcome_reports where transaction_id = 'txn_o4'");
    expect(r.rows).toHaveLength(0);
  });

  it("is closed to the public roles", async () => {
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from information_schema.role_table_grants
        where table_name = 'outcome_reports' and grantee in ('anon', 'authenticated')`,
    );
    expect(r.rows[0]!.n).toBe(0);
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'outcome_reports'",
    );
    expect(rls.rows[0]!.relrowsecurity).toBe(true);
  });
});

describe("a rebate is a partial refund, which must not take the Pass away", () => {
  it("leaves the Pass active when Paddle reports a partial refund of its payment", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed("txn_part", PRICES.case, await newIntent(db, user, "case-1", PRICES.case)),
    );
    await apply(db, {
      event_id: "evt_partial",
      event_type: "adjustment.created",
      occurred_at: "2026-10-30T10:00:00Z",
      data: {
        id: "adj_partial",
        transaction_id: "txn_part",
        action: "refund",
        status: "approved",
        type: "partial",
      },
    });
    expect((await licences(db, user))[0]!.status).toBe("active");
  });
});

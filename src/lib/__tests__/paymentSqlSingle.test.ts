import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PRICES,
  adjustment,
  apply,
  claim,
  claimReview,
  claimSingle,
  completed,
  createMigratedDb,
  licences,
  newIntent,
  newUser,
} from "./pgHarness";

/**
 * Migration 0020 against a real Postgres (23 Oct 2026): One Response, one case and the first
 * response only. The payment function is the 0018 one with a kind added, so the paths for the other
 * products are in paymentSql.test.ts and paymentSqlStage3.test.ts, and this file checks that this one
 * is a licence for its case, is not an Appeal Pass, is parked when it makes no sense, and is taken
 * back by a refund.
 */
let db: PGlite;
beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

const P = PRICES;
const SINGLE = P.extras.single_response;

async function buy(user: string, caseId: string, txn: string, price: string = SINGLE) {
  return apply(db, completed(txn, price, await newIntent(db, user, caseId, price)));
}

describe("a One Response", () => {
  it("is a plan the database accepts", async () => {
    const r = await db.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'licenses_plan_check'",
    );
    for (const plan of ["appeal_pass", "account_pass", "document_review", "single_response"])
      expect(r.rows[0]!.def, plan).toContain(plan);
  });

  it("is a licence for the case it was bought for, with no expiry", async () => {
    const user = await newUser(db);
    expect(await buy(user, "case-s1", "txn_s1")).toBe("ok");
    const rows = await licences(db, user);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      plan: "single_response",
      case_id: "case-s1",
      status: "active",
      provider: "paddle",
    });
    expect(rows[0]!.expires_at).toBeNull();
    expect(await claimSingle(db, user, "case-s1")).toBe(true);
    expect(await claimSingle(db, user, "case-other")).toBe(false);
  });

  it("is not an Appeal Pass: it does not claim a case for a response, and does not read as the review", async () => {
    const user = await newUser(db);
    await buy(user, "case-s2", "txn_s2");
    expect(await claim(db, user, "case-s2")).toBe(false);
    expect(await claimReview(db, user, "case-s2")).toBe(false);
  });

  it("does not bind itself to a case other than its own, and does not let someone else's case use it", async () => {
    const user = await newUser(db);
    const other = await newUser(db);
    await buy(user, "case-s3", "txn_s3");
    expect(await claimSingle(db, other, "case-s3")).toBe(false);
  });

  it("queues a confirmation email that names what was bought", async () => {
    const user = await newUser(db);
    await buy(user, "case-s4", "txn_s4");
    const r = await db.query<{ kind: string }>(
      "select kind from purchase_email_outbox where transaction_id = 'txn_s4'",
    );
    expect(r.rows[0]!.kind).toBe("single_response");
  });

  it("is parked when it is bought twice for one case, and the second payment is not a licence", async () => {
    const user = await newUser(db);
    await buy(user, "case-s5", "txn_s5");
    expect(await buy(user, "case-s5", "txn_s5b")).toMatch(/^unmatched:duplicate One Response/);
    expect(await licences(db, user)).toHaveLength(1);
  });

  it("is parked when its case already has an Appeal Pass, and when the account has an Account Pass", async () => {
    const withPass = await newUser(db);
    await buy(withPass, "case-s6", "txn_pass", P.case);
    expect(await buy(withPass, "case-s6", "txn_s6")).toMatch(
      /^unmatched:One Response bought for a case that already has an active Appeal Pass/,
    );
    const withAccount = await newUser(db);
    await buy(withAccount, "case-s7", "txn_acct", P.account);
    expect(await buy(withAccount, "case-s8", "txn_s7")).toMatch(
      /^unmatched:One Response bought by an account with an active Account Pass/,
    );
    expect(await licences(db, withPass)).toHaveLength(1);
    expect(await licences(db, withAccount)).toHaveLength(1);
  });

  it("can be followed by the Appeal Pass for the same case, and both stay on the record", async () => {
    const user = await newUser(db);
    await buy(user, "case-s9", "txn_s9");
    expect(await buy(user, "case-s9", "txn_s9pass", P.case)).toBe("ok");
    expect(await claim(db, user, "case-s9")).toBe(true);
    expect((await licences(db, user)).map((l) => l.plan)).toEqual([
      "single_response",
      "appeal_pass",
    ]);
  });

  it("is parked when it is paid for with a price that is not configured", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "case-s10", SINGLE);
    expect(await apply(db, completed("txn_s10", SINGLE, intent), { extras: null })).toMatch(
      /^unmatched:no item matches/,
    );
    expect(await licences(db, user)).toHaveLength(0);
  });

  it("is cancelled by a full refund, and brought back when the refund is reversed", async () => {
    const user = await newUser(db);
    await buy(user, "case-s11", "txn_s11");
    expect(
      await apply(db, adjustment("adj_s11", "txn_s11", "approved", "2026-10-23T10:00:00Z")),
    ).toBe("ok");
    expect((await licences(db, user))[0]!.status).toBe("canceled");
    expect(await claimSingle(db, user, "case-s11")).toBe(false);
    expect(
      await apply(
        db,
        adjustment("adj_s11", "txn_s11", "rejected", "2026-10-23T11:00:00Z", "adjustment.updated"),
      ),
    ).toBe("ok");
    expect((await licences(db, user))[0]!.status).toBe("active");
    expect(await claimSingle(db, user, "case-s11")).toBe(true);
  });

  it("is not brought back when its case has an Appeal Pass by then", async () => {
    const user = await newUser(db);
    await buy(user, "case-s12", "txn_s12");
    await apply(db, adjustment("adj_s12", "txn_s12", "approved", "2026-10-23T10:00:00Z"));
    await buy(user, "case-s12", "txn_s12pass", P.case);
    await apply(
      db,
      adjustment("adj_s12", "txn_s12", "rejected", "2026-10-23T11:00:00Z", "adjustment.updated"),
    );
    const rows = await licences(db, user);
    expect(rows.find((l) => l.plan === "single_response")!.status).toBe("canceled");
    expect(rows.find((l) => l.plan === "appeal_pass")!.status).toBe("active");
  });

  it("leaves the other products' kinds alone", async () => {
    const user = await newUser(db);
    expect(await buy(user, "case-s13", "txn_s13", P.case)).toBe("ok");
    expect(await claim(db, user, "case-s13")).toBe(true);
    expect(await claimSingle(db, user, "case-s13")).toBe(false);
  });
});

describe("the Appeal Pass credited for a One Response (migration 0021)", () => {
  const CREDITED = P.extras.pass_after_single;

  it("is parked when the case has no One Response, and grants nothing", async () => {
    const user = await newUser(db);
    expect(await buy(user, "case-u1", "txn_u1", CREDITED)).toMatch(
      /^unmatched:credited Appeal Pass without an active One Response/,
    );
    expect(await licences(db, user)).toHaveLength(0);
  });

  it("is an Appeal Pass for the case once it has a One Response, and both stay on the record", async () => {
    const user = await newUser(db);
    await buy(user, "case-u2", "txn_u2s");
    expect(await buy(user, "case-u2", "txn_u2", CREDITED)).toBe("ok");
    expect(await claim(db, user, "case-u2")).toBe(true);
    const rows = await licences(db, user);
    expect(rows.map((l) => l.plan)).toEqual(["single_response", "appeal_pass"]);
    expect(rows[1]).toMatchObject({ case_id: "case-u2", status: "active", expires_at: null });
  });

  it("queues a confirmation email for an Appeal Pass, not a One Response", async () => {
    const user = await newUser(db);
    await buy(user, "case-u3", "txn_u3s");
    await buy(user, "case-u3", "txn_u3", CREDITED);
    const r = await db.query<{ kind: string }>(
      "select kind from purchase_email_outbox where transaction_id = 'txn_u3'",
    );
    expect(r.rows[0]!.kind).toBe("appeal_pass");
  });

  it("is parked when the case already has an Appeal Pass, and when the One Response was refunded", async () => {
    const withPass = await newUser(db);
    await buy(withPass, "case-u4", "txn_u4s");
    await buy(withPass, "case-u4", "txn_u4a", CREDITED);
    expect(await buy(withPass, "case-u4", "txn_u4b", CREDITED)).toMatch(
      /^unmatched:duplicate Pass/,
    );
    const refunded = await newUser(db);
    await buy(refunded, "case-u5", "txn_u5s");
    await apply(db, adjustment("adj_u5", "txn_u5s", "approved", "2026-10-23T10:00:00Z"));
    expect(await buy(refunded, "case-u5", "txn_u5", CREDITED)).toMatch(
      /^unmatched:credited Appeal Pass without an active One Response/,
    );
  });

  it("is parked when its price is not configured, and a One Response is not an Appeal Pass until then", async () => {
    const user = await newUser(db);
    await buy(user, "case-u6", "txn_u6s");
    const intent = await newIntent(db, user, "case-u6", CREDITED);
    expect(await apply(db, completed("txn_u6", CREDITED, intent), { extras: null })).toMatch(
      /^unmatched:no item matches/,
    );
    expect(await claim(db, user, "case-u6")).toBe(false);
  });

  it("leaves the plain Appeal Pass and the document review\x27s credit as they were", async () => {
    const user = await newUser(db);
    expect(await buy(user, "case-u7", "txn_u7", P.case)).toBe("ok");
    const reviewed = await newUser(db);
    await buy(reviewed, "case-u8", "txn_u8r", P.extras.document_review);
    expect(await buy(reviewed, "case-u8", "txn_u8", P.extras.pass_after_review)).toBe("ok");
  });
});

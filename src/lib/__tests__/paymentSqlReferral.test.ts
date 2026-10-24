import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PRICES,
  adjustment,
  apply,
  completed,
  createMigratedDb,
  licences,
  newIntent,
  newUser,
} from "./pgHarness";

let db: PGlite;
let owner: string;
let codeId: string;
beforeAll(async () => {
  db = await createMigratedDb();
  owner = await newUser(db);
  const partner = await db.query<{ id: string }>(
    "insert into partners(user_id) values ($1) returning id",
    [owner],
  );
  const code = await db.query<{ id: string }>(
    "insert into referral_codes(partner_id,code,discount_id) values ($1,'PARTNER25','dsc_partner') returning id",
    [partner.rows[0]!.id],
  );
  codeId = code.rows[0]!.id;
}, 120_000);
afterAll(async () => db?.close());

async function sale(
  txn: string,
  options: {
    user?: string;
    discount?: string;
    price?: string;
    money?: boolean;
    currency?: string;
    attribution?: boolean;
  } = {},
) {
  const user = options.user ?? (await newUser(db));
  const price = options.price ?? PRICES.case;
  const intent = await newIntent(db, user, txn, price);
  if (options.attribution !== false)
    await db.query("update checkout_intents set referral_code_id=$1 where id=$2", [codeId, intent]);
  const event = completed(txn, price, intent, { discountId: options.discount ?? "dsc_partner" });
  Object.assign(event.data, {
    currency_code: options.currency ?? "USD",
    ...(options.money === false
      ? {}
      : { details: { totals: { total: "24640", tax: "2240", fee: "1170" } } }),
  });
  const result = await apply(db, event);
  return { result, user, event };
}
async function balance(txn: string) {
  return (
    await db.query<{ held: boolean; commission_cents: number }>(
      "select held,commission_cents from referral_balances where transaction_id=$1",
      [txn],
    )
  ).rows[0];
}

describe("transactional referral accounting", () => {
  it("credits only discounted revenue before tax, not list price or tax", async () => {
    expect((await sale("txn_ref1")).result).toBe("ok");
    expect(await balance("txn_ref1")).toMatchObject({ held: false, commission_cents: 6720 });
  });
  it("deduplicates both repeated events and a new completion event for the same transaction", async () => {
    const { event } = await sale("txn_ref2");
    expect(await apply(db, event)).toBe("duplicate");
    await apply(db, { ...event, event_id: "evt_refother" });
    expect(
      (await db.query("select * from referral_sales where transaction_id='txn_ref2'")).rows,
    ).toHaveLength(1);
    expect(await balance("txn_ref2")).toMatchObject({ commission_cents: 6720 });
  });
  it("gives no commission for self-referrals, a different discount, or forged custom_data", async () => {
    await sale("txn_refself", { user: owner });
    await sale("txn_refwrong", { discount: "dsc_someoneelse" });
    const { event } = await sale("txn_refnone", { attribution: false });
    Object.assign(event.data.custom_data!, { referral_code_id: codeId });
    await apply(db, { ...event, event_id: "evt_refforged" });
    for (const txn of ["txn_refself", "txn_refwrong", "txn_refnone"])
      expect(await balance(txn)).toBeUndefined();
  });
  it("does not commission an upgrade or One Response", async () => {
    await sale("txn_refsingle", { price: PRICES.extras.single_response });
    expect(await balance("txn_refsingle")).toBeUndefined();
  });
  it("holds missing amounts and foreign currency without withholding the buyer's Pass", async () => {
    const { user } = await sale("txn_refunknown", { money: false });
    await sale("txn_refeur", { currency: "EUR" });
    expect(await balance("txn_refunknown")).toMatchObject({ held: true });
    expect(await balance("txn_refeur")).toMatchObject({ held: true });
    expect((await licences(db, user))[0]!.status).toBe("active");
  });
  it("removes a full refund even when it arrived before completion and has no totals", async () => {
    await apply(
      db,
      adjustment("adj_before_ref", "txn_refbefore", "approved", "2026-10-23T12:00:00Z"),
    );
    await sale("txn_refbefore");
    expect(await balance("txn_refbefore")).toMatchObject({ held: false, commission_cents: 0 });
  });
  it("reduces commission after an approved partial refund, and ignores stale pending events", async () => {
    await sale("txn_refpartial");
    const a = adjustment("adj_refpartial", "txn_refpartial", "approved", "2026-10-24T12:00:00Z");
    Object.assign(a.data, { type: "partial", currency_code: "USD", totals: { subtotal: "2500" } });
    await apply(db, a);
    expect(await balance("txn_refpartial")).toMatchObject({ held: false, commission_cents: 5970 });
    await apply(db, {
      ...a,
      event_id: "evt_refstale",
      occurred_at: "2026-10-23T12:00:00Z",
      data: { ...a.data, status: "pending_approval" },
    });
    expect(await balance("txn_refpartial")).toMatchObject({ held: false, commission_cents: 5970 });
  });
  it("holds a pending refund and releases a rejected one", async () => {
    await sale("txn_refpending");
    await apply(
      db,
      adjustment("adj_refpending", "txn_refpending", "pending_approval", "2026-10-23T12:00:00Z"),
    );
    expect(await balance("txn_refpending")).toMatchObject({ held: true });
    await apply(
      db,
      adjustment(
        "adj_refpending",
        "txn_refpending",
        "rejected",
        "2026-10-24T12:00:00Z",
        "adjustment.updated",
      ),
    );
    expect(await balance("txn_refpending")).toMatchObject({ held: false, commission_cents: 6720 });
  });
  it("reverses a chargeback and restores it when Paddle reverses that chargeback", async () => {
    await sale("txn_refdispute");
    const a = adjustment("adj_refdispute", "txn_refdispute", "approved", "2026-10-23T12:00:00Z");
    Object.assign(a.data, { action: "chargeback" });
    await apply(db, a);
    expect(await balance("txn_refdispute")).toMatchObject({ commission_cents: 0 });
    const r = adjustment("adj_refreverse", "txn_refdispute", "approved", "2026-10-24T12:00:00Z");
    Object.assign(r.data, {
      action: "chargeback_reverse",
      original_adjustment_id: "adj_refdispute",
    });
    await apply(db, r);
    expect(await balance("txn_refdispute")).toMatchObject({ held: false, commission_cents: 6720 });
  });
  it("keeps paid amounts on the record after refunds, so overpayment becomes a negative balance", async () => {
    await sale("txn_refpaid");
    await db.query(
      "insert into referral_payouts(partner_id,currency,amount_cents,reference) select partner_id,'USD',6720,'transfer-ref1' from referral_sales where transaction_id='txn_refpaid'",
    );
    await apply(db, adjustment("adj_refpaid", "txn_refpaid", "approved", "2026-10-24T12:00:00Z"));
    expect(await balance("txn_refpaid")).toMatchObject({ commission_cents: 0 });
    expect(
      (await db.query("select * from referral_payouts where reference='transfer-ref1'")).rows,
    ).toHaveLength(1);
  });
  it("holds a real-world reversal without an unambiguous adjustment reference for reconciliation", async () => {
    await sale("txn_refunlinked");
    const r = adjustment("adj_refunlinked", "txn_refunlinked", "approved", "2026-10-24T12:00:00Z");
    Object.assign(r.data, { action: "chargeback_reverse" });
    await apply(db, r);
    expect(await balance("txn_refunlinked")).toMatchObject({ held: true });
  });
  it("holds a paused partner's new sale, and parks unmatched payments without paying a partner", async () => {
    await db.query("update referral_codes set active=false where id=$1", [codeId]);
    await sale("txn_refpaused");
    expect(await balance("txn_refpaused")).toMatchObject({ held: true });
    await db.query("update referral_codes set active=true where id=$1", [codeId]);
    const event = completed("txn_refparked", PRICES.case, "00000000-0000-4000-8000-000000000000");
    expect(await apply(db, event)).toMatch(/^unmatched:/);
    expect(await balance("txn_refparked")).toBeUndefined();
  });
  it("calculates a statement in the database and does not return buyers or case ids", async () => {
    const row = await db.query<{ value: Record<string, unknown> }>(
      "select partner_statement($1) as value",
      [owner],
    );
    expect(Object.keys(row.rows[0]!.value).sort()).toEqual([
      "active",
      "codes",
      "earned",
      "held",
      "paid",
      "pending",
    ]);
    const other = await newUser(db);
    expect(
      (await db.query<{ value: unknown }>("select partner_statement($1) as value", [other]))
        .rows[0]!.value,
    ).toBeNull();
  });
  it("denies direct browser access to money tables, statements, and the underlying payment function", async () => {
    await db.exec("set role authenticated");
    for (const sql of [
      "select * from partners",
      "select * from referral_balances",
      "select * from referral_payouts",
      `select partner_statement('${owner}')`,
      "select apply_paddle_event_before_referrals('{}',null,null,'{}')",
    ])
      await expect(db.exec(sql)).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
  });
});

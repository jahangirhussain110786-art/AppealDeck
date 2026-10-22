import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PRICES,
  adjustment,
  apply,
  claim,
  claimReview,
  completed,
  createMigratedDb,
  credits,
  licences,
  makeVerified,
  newIntent,
  newUser,
  subscriptionEvent,
  useCredit,
} from "./pgHarness";

/**
 * Migration 0018 against a real Postgres (22 Oct 2026): the AI document review and its credited
 * Appeal Pass, Account renewals, credit packs, the Pro plan, who is covered by what, and what a
 * refund takes back. The Appeal Pass and Account Pass paths are in paymentSql.test.ts.
 */
let db: PGlite;
beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

const P = PRICES;

describe("the new tables and functions are in place", () => {
  it("allows the new plans and keeps the old ones", async () => {
    const r = await db.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'licenses_plan_check'",
    );
    for (const plan of [
      "appeal_pass",
      "account_pass",
      "account_renewal",
      "document_review",
      "pro_plan",
    ])
      expect(r.rows[0]!.def, plan).toContain(plan);
  });

  it("still takes the two- and three-argument calls older code makes", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "case-1", P.case);
    const event = completed("txn_args2", P.case, intent);
    const two = await db.query<{ r: string }>("select apply_paddle_event($1::jsonb, $2) as r", [
      JSON.stringify(event),
      P.case,
    ]);
    expect(two.rows[0]!.r).toBe("ok");
    const intent3 = await newIntent(db, user, "case-2", P.account);
    const three = await db.query<{ r: string }>(
      "select apply_paddle_event($1::jsonb, $2, $3) as r",
      [JSON.stringify(completed("txn_args3", P.account, intent3)), P.case, P.account],
    );
    expect(three.rows[0]!.r).toBe("ok");
  });

  it("refuses a seller's price that is not configured, as before", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "case-1", "pri_review");
    expect(await apply(db, completed("txn_off", "pri_review", intent), { extras: null })).toMatch(
      /^unmatched:no item matches/,
    );
  });
});

describe("the AI document review", () => {
  it("is a licence for one case that covers the AI reading and nothing else", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "case-r1", P.extras.document_review);
    expect(await apply(db, completed("txn_r1", P.extras.document_review, intent))).toBe("ok");
    const rows = await licences(db, user);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      plan: "document_review",
      case_id: "case-r1",
      status: "active",
    });
    expect(rows[0]!.expires_at).toBeNull();
    expect(await claimReview(db, user, "case-r1")).toBe(true);
    expect(await claimReview(db, user, "case-other")).toBe(false);
    // it is not a Pass: preparing the response is still not covered
    expect(await claim(db, user, "case-r1")).toBe(false);
  });

  it("is parked when bought twice for one case", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed(
        "txn_r2",
        P.extras.document_review,
        await newIntent(db, user, "case-r2", P.extras.document_review),
      ),
    );
    const second = await apply(
      db,
      completed(
        "txn_r2b",
        P.extras.document_review,
        await newIntent(db, user, "case-r2", P.extras.document_review),
      ),
    );
    expect(second).toMatch(/^unmatched:duplicate document review/);
    expect(await licences(db, user)).toHaveLength(1);
  });

  it("makes the Appeal Pass cheaper only for a case that has one, and then covers the case", async () => {
    const user = await newUser(db);
    // credited Pass with no review: parked, nothing granted
    const noReview = await apply(
      db,
      completed(
        "txn_cr0",
        P.extras.pass_after_review,
        await newIntent(db, user, "case-r3", P.extras.pass_after_review),
      ),
    );
    expect(noReview).toMatch(/^unmatched:credited Appeal Pass without an active document review/);
    expect(await licences(db, user)).toHaveLength(0);

    await apply(
      db,
      completed(
        "txn_r3",
        P.extras.document_review,
        await newIntent(db, user, "case-r3", P.extras.document_review),
      ),
    );
    expect(
      await apply(
        db,
        completed(
          "txn_cr1",
          P.extras.pass_after_review,
          await newIntent(db, user, "case-r3", P.extras.pass_after_review),
        ),
      ),
    ).toBe("ok");
    const plans = (await licences(db, user)).map((r) => r.plan).sort();
    expect(plans).toEqual(["appeal_pass", "document_review"]);
    expect(await claim(db, user, "case-r3")).toBe(true);
  });

  it("does not let a credited price be paid against an intent made for another price", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed(
        "txn_r4",
        P.extras.document_review,
        await newIntent(db, user, "case-r4", P.extras.document_review),
      ),
    );
    const sneaky = await newIntent(db, user, "case-r4", P.case);
    expect(await apply(db, completed("txn_cr4", P.extras.pass_after_review, sneaky))).toMatch(
      /^unmatched:checkout intent price differs/,
    );
  });

  it("is taken back by a refund, and the credited Pass is a separate payment", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed(
        "txn_r5",
        P.extras.document_review,
        await newIntent(db, user, "case-r5", P.extras.document_review),
      ),
    );
    await apply(db, adjustment("adj_r5", "txn_r5", "approved", "2026-10-23T10:00:00Z"));
    expect(await claimReview(db, user, "case-r5")).toBe(false);
  });
});

describe("renewing an Account Pass", () => {
  it("is parked when there is nothing to renew", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "account", P.extras.account_renewal);
    expect(await apply(db, completed("txn_n0", P.extras.account_renewal, intent))).toMatch(
      /^unmatched:renewal without an Account Pass/,
    );
    expect(await licences(db, user)).toHaveLength(0);
  });

  it("adds twelve months to the end of the Account Pass, not to the day of payment", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed("txn_n1", P.account, await newIntent(db, user, "case-1", P.account), {
        occurred: "2026-01-10T10:00:00Z",
      }),
    );
    const before = (await licences(db, user))[0]!;
    expect(
      await apply(
        db,
        completed(
          "txn_n1r",
          P.extras.account_renewal,
          await newIntent(db, user, "account", P.extras.account_renewal),
          {
            occurred: "2026-12-20T10:00:00Z",
          },
        ),
      ),
    ).toBe("ok");
    const rows = await licences(db, user);
    expect(rows.map((r) => r.plan)).toEqual(["account_pass", "account_renewal"]);
    const check = await db.query<{ ok: boolean }>(
      `select r.expires_at = p.expires_at + interval '12 months' as ok
         from licenses r join licenses p on p.user_id = r.user_id and p.plan = 'account_pass'
        where r.user_id = $1 and r.plan = 'account_renewal'`,
      [user],
    );
    expect(check.rows[0]!.ok).toBe(true);
    expect(before.expires_at).not.toBeNull();
    expect(rows[1]).toMatchObject({ case_id: null, status: "active" });
  });

  it("starts from the day of payment when the Account Pass had already ended", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed("txn_n2", P.account, await newIntent(db, user, "case-1", P.account), {
        occurred: "2025-01-10T10:00:00Z",
      }),
    );
    await apply(
      db,
      completed(
        "txn_n2r",
        P.extras.account_renewal,
        await newIntent(db, user, "account", P.extras.account_renewal),
        {
          occurred: "2026-10-22T10:00:00Z",
        },
      ),
    );
    const check = await db.query<{ ok: boolean }>(
      "select expires_at = activated_at + interval '12 months' as ok from licenses where user_id = $1 and plan = 'account_renewal'",
      [user],
    );
    expect(check.rows[0]!.ok).toBe(true);
    expect(await claim(db, user, "any-case")).toBe(true);
  });

  it("is taken back by a refund, leaving the original cover", async () => {
    const user = await newUser(db);
    await apply(db, completed("txn_n3", P.account, await newIntent(db, user, "case-1", P.account)));
    await apply(
      db,
      completed(
        "txn_n3r",
        P.extras.account_renewal,
        await newIntent(db, user, "account", P.extras.account_renewal),
      ),
    );
    await apply(db, adjustment("adj_n3", "txn_n3r", "approved", "2026-10-23T10:00:00Z"));
    const rows = await licences(db, user);
    expect(rows.find((r) => r.plan === "account_renewal")!.status).toBe("canceled");
    expect(rows.find((r) => r.plan === "account_pass")!.status).toBe("active");
    expect(await claim(db, user, "x")).toBe(true);
  });
});

describe("credit packs and case credits", () => {
  it("are parked when bought by someone who is not a verified professional", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "account", P.extras.pack_10);
    expect(await apply(db, completed("txn_p0", P.extras.pack_10, intent))).toMatch(
      /^unmatched:credit pack bought by an account that is not a verified professional/,
    );
    expect(await credits(db, user)).toHaveLength(0);
  });

  it("grant ten or thirty credits that last twelve months", async () => {
    const user = await newUser(db);
    await makeVerified(db, user);
    expect(
      await apply(
        db,
        completed(
          "txn_p1",
          P.extras.pack_10,
          await newIntent(db, user, "account", P.extras.pack_10),
        ),
      ),
    ).toBe("ok");
    expect(
      await apply(
        db,
        completed(
          "txn_p1b",
          P.extras.pack_30,
          await newIntent(db, user, "account", P.extras.pack_30),
        ),
      ),
    ).toBe("ok");
    const rows = await credits(db, user);
    expect(rows.map((r) => r.granted).sort((a, b) => a - b)).toEqual([10, 30]);
    const lasts = await db.query<{ ok: boolean }>(
      "select bool_and(expires_at = '2026-10-22T10:00:00Z'::timestamptz + interval '12 months') as ok from case_credits where user_id = $1",
      [user],
    );
    expect(lasts.rows[0]!.ok).toBe(true);
  });

  it("each activate one case when spent, and a case is never charged twice", async () => {
    const user = await newUser(db);
    await makeVerified(db, user);
    await apply(
      db,
      completed("txn_p2", P.extras.pack_10, await newIntent(db, user, "account", P.extras.pack_10)),
    );
    expect(await claim(db, user, "client-a")).toBe(false);
    expect(await useCredit(db, user, "client-a")).toBe("used");
    expect(await claim(db, user, "client-a")).toBe(true);
    expect(await claim(db, user, "client-b")).toBe(false);
    // the same case again costs nothing
    expect(await useCredit(db, user, "client-a")).toBe("covered");
    expect(await useCredit(db, user, "client-b")).toBe("used");
    expect((await credits(db, user))[0]!.used).toBe(2);
    const pass = (await licences(db, user)).filter((r) => r.plan === "appeal_pass");
    expect(pass.map((r) => [r.case_id, r.provider]).sort()).toEqual([
      ["client-a", "credit"],
      ["client-b", "credit"],
    ]);
  });

  it("cannot be spent by someone who is not verified, or with none left", async () => {
    const stranger = await newUser(db);
    expect(await useCredit(db, stranger, "case-1")).toBe("not_verified");
    const pro = await newUser(db);
    await makeVerified(db, pro);
    expect(await useCredit(db, pro, "case-1")).toBe("no_credit");
    await db.query("insert into case_credits(user_id, source, granted) values ($1, 'grant', 1)", [
      pro,
    ]);
    expect(await useCredit(db, pro, "case-1")).toBe("used");
    expect(await useCredit(db, pro, "case-2")).toBe("no_credit");
  });

  it("are not spent when the case is already covered by an Account Pass", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(db, completed("txn_p3", P.account, await newIntent(db, pro, "case-1", P.account)));
    await db.query("insert into case_credits(user_id, source, granted) values ($1, 'grant', 5)", [
      pro,
    ]);
    expect(await useCredit(db, pro, "case-9")).toBe("covered");
    expect((await credits(db, pro))[0]!.used).toBe(0);
  });

  it("are spent earliest-expiring first and never after they expire", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await db.query(
      `insert into case_credits(user_id, source, granted, expires_at) values
        ($1, 'grant', 1, now() + interval '30 days'),
        ($1, 'grant', 1, now() + interval '5 days'),
        ($1, 'grant', 1, now() - interval '1 day')`,
      [pro],
    );
    expect(await useCredit(db, pro, "c1")).toBe("used");
    const rows = await db.query<{ used: number; days: number }>(
      "select used, round(extract(epoch from (expires_at - now())) / 86400)::int as days from case_credits where user_id = $1 order by expires_at",
      [pro],
    );
    // the expired one is untouched, the five-day one is spent, the thirty-day one is kept
    expect(rows.rows.map((r) => r.used)).toEqual([0, 1, 0]);
    expect(await useCredit(db, pro, "c2")).toBe("used");
    expect(await useCredit(db, pro, "c3")).toBe("no_credit");
  });

  it("a refunded pack can no longer be spent, but cases it already activated stay covered", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(
      db,
      completed("txn_p4", P.extras.pack_10, await newIntent(db, pro, "account", P.extras.pack_10)),
    );
    expect(await useCredit(db, pro, "kept")).toBe("used");
    await apply(db, adjustment("adj_p4", "txn_p4", "approved", "2026-10-23T10:00:00Z"));
    expect((await credits(db, pro))[0]!.canceled_at).not.toBeNull();
    expect(await useCredit(db, pro, "later")).toBe("no_credit");
    expect(await claim(db, pro, "kept")).toBe(true);
    // a reversed refund gives them back
    await apply(
      db,
      adjustment("adj_p4", "txn_p4", "rejected", "2026-10-24T10:00:00Z", "adjustment.updated"),
    );
    expect((await credits(db, pro))[0]!.canceled_at).toBeNull();
    expect(await useCredit(db, pro, "later")).toBe("used");
  });

  it("ignore a payment event they have already seen", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    const event = completed(
      "txn_p5",
      P.extras.pack_10,
      await newIntent(db, pro, "account", P.extras.pack_10),
    );
    expect(await apply(db, event)).toBe("ok");
    expect(await apply(db, event)).toBe("duplicate");
    expect(await credits(db, pro)).toHaveLength(1);
  });

  it("a suspended professional cannot spend credits", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await db.query("insert into case_credits(user_id, source, granted) values ($1, 'grant', 3)", [
      pro,
    ]);
    await db.query("update pro_accounts set status = 'suspended' where user_id = $1", [pro]);
    expect(await useCredit(db, pro, "case-1")).toBe("not_verified");
  });
});

describe("the Pro plan", () => {
  it("is parked for someone who is not a verified professional", async () => {
    const user = await newUser(db);
    const intent = await newIntent(db, user, "account", P.extras.pro_plan);
    expect(
      await apply(db, completed("txn_s0", P.extras.pro_plan, intent, { subscriptionId: "sub_0" })),
    ).toMatch(/^unmatched:Pro plan bought by an account that is not a verified professional/);
  });

  it("creates the subscription's licence and ten credits on the first payment", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    const intent = await newIntent(db, pro, "account", P.extras.pro_plan);
    expect(
      await apply(
        db,
        completed("txn_s1", P.extras.pro_plan, intent, {
          subscriptionId: "sub_1",
          customerId: "ctm_1",
        }),
      ),
    ).toBe("ok");
    const lic = (await licences(db, pro))[0]!;
    expect(lic).toMatchObject({
      plan: "pro_plan",
      case_id: null,
      status: "active",
      provider_subscription_id: "sub_1",
      provider_customer_id: "ctm_1",
    });
    const c = await credits(db, pro);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ source: "pro_plan", granted: 10, used: 0 });
    // a Pro plan is not cover for any case by itself
    expect(await claim(db, pro, "case-1")).toBe(false);
  });

  it("adds ten more credits on each monthly payment, which has no checkout intent", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(
      db,
      completed(
        "txn_s2",
        P.extras.pro_plan,
        await newIntent(db, pro, "account", P.extras.pro_plan),
        { subscriptionId: "sub_2" },
      ),
    );
    const month2 = completed("txn_s2b", P.extras.pro_plan, null, {
      subscriptionId: "sub_2",
      noIntent: true,
      occurred: "2026-11-22T10:00:00Z",
    });
    expect(await apply(db, month2)).toBe("ok");
    expect(await apply(db, month2)).toBe("duplicate");
    expect((await credits(db, pro)).map((r) => r.granted)).toEqual([10, 10]);
    expect(await licences(db, pro)).toHaveLength(1);
  });

  it("parks a monthly payment for a subscription it has never seen", async () => {
    const orphan = completed("txn_s3", P.extras.pro_plan, null, {
      subscriptionId: "sub_unknown",
      noIntent: true,
    });
    expect(await apply(db, orphan)).toMatch(/^unmatched:custom_data\.checkout_intent_id missing/);
  });

  it("is ended by the subscription being cancelled, and a refund takes back only that month's credits", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(
      db,
      completed(
        "txn_s4",
        P.extras.pro_plan,
        await newIntent(db, pro, "account", P.extras.pro_plan),
        { subscriptionId: "sub_4" },
      ),
    );
    await apply(
      db,
      completed("txn_s4b", P.extras.pro_plan, null, {
        subscriptionId: "sub_4",
        noIntent: true,
        occurred: "2026-11-22T10:00:00Z",
      }),
    );
    await apply(db, adjustment("adj_s4", "txn_s4b", "approved", "2026-11-23T10:00:00Z"));
    const c = await credits(db, pro);
    expect(c.find((r) => r.transaction_id === "txn_s4")!.canceled_at).toBeNull();
    expect(c.find((r) => r.transaction_id === "txn_s4b")!.canceled_at).not.toBeNull();
    await apply(db, subscriptionEvent("sub_4", "canceled", "2026-12-01T10:00:00Z"));
    expect((await licences(db, pro))[0]!.status).toBe("canceled");
  });

  it("is refused a second time while one is active", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(
      db,
      completed(
        "txn_s5",
        P.extras.pro_plan,
        await newIntent(db, pro, "account", P.extras.pro_plan),
        { subscriptionId: "sub_5" },
      ),
    );
    const second = await apply(
      db,
      completed(
        "txn_s5b",
        P.extras.pro_plan,
        await newIntent(db, pro, "account", P.extras.pro_plan),
        { subscriptionId: "sub_5b" },
      ),
    );
    expect(second).toMatch(/^unmatched:duplicate Pro plan/);
  });
});

describe("what a sale records", () => {
  it("keeps the discount and customer ids, so a partner's sales can be counted from our own table", async () => {
    const user = await newUser(db);
    await apply(
      db,
      completed("txn_d1", P.case, await newIntent(db, user, "case-1", P.case), {
        discountId: "dsc_partner",
        customerId: "ctm_9",
      }),
    );
    expect((await licences(db, user))[0]).toMatchObject({
      provider_discount_id: "dsc_partner",
      provider_customer_id: "ctm_9",
    });
  });

  it("names what was bought on the confirmation email's row", async () => {
    const user = await newUser(db);
    await makeVerified(db, user);
    await apply(db, completed("txn_k1", P.account, await newIntent(db, user, "case-1", P.account)));
    await apply(
      db,
      completed("txn_k2", P.extras.pack_10, await newIntent(db, user, "account", P.extras.pack_10)),
    );
    await apply(
      db,
      completed(
        "txn_k3",
        P.extras.document_review,
        await newIntent(db, user, "case-9", P.extras.document_review),
      ),
    );
    await apply(
      db,
      completed(
        "txn_k4",
        P.extras.pass_after_review,
        await newIntent(db, user, "case-9", P.extras.pass_after_review),
      ),
    );
    const r = await db.query<{ transaction_id: string; kind: string }>(
      "select transaction_id, kind from purchase_email_outbox where user_id = $1 order by transaction_id",
      [user],
    );
    expect(r.rows).toEqual([
      { transaction_id: "txn_k1", kind: "account_pass" },
      { transaction_id: "txn_k2", kind: "pack_10" },
      { transaction_id: "txn_k3", kind: "document_review" },
      { transaction_id: "txn_k4", kind: "appeal_pass" },
    ]);
  });

  it("sends no confirmation for a monthly Pro payment (the receipt is Paddle's)", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    await apply(
      db,
      completed(
        "txn_k5",
        P.extras.pro_plan,
        await newIntent(db, pro, "account", P.extras.pro_plan),
        { subscriptionId: "sub_k" },
      ),
    );
    await apply(
      db,
      completed("txn_k5b", P.extras.pro_plan, null, {
        subscriptionId: "sub_k",
        noIntent: true,
        occurred: "2026-11-22T10:00:00Z",
      }),
    );
    const r = await db.query<{ n: string }>(
      "select count(*)::text as n from purchase_email_outbox where user_id = $1",
      [pro],
    );
    expect(r.rows[0]!.n).toBe("1");
  });
});

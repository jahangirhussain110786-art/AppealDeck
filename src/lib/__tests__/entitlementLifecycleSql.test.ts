import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PRICES,
  adjustment,
  apply,
  completed,
  createMigratedDb,
  licences,
  makeVerified,
  newIntent,
  newUser,
  nextCounter,
  subscriptionEvent,
} from "./pgHarness";

/**
 * Migration 0024 on a real Postgres: a lapsed Account Pass no longer blocks its replacement, and a
 * credited upgrade is tied to the purchase that paid for most of it. The rules under test are the
 * ones the refund policy states (26 Oct 2026).
 */
let db: PGlite;
beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

async function buyReviewAndCredit(caseId: string) {
  const user = await newUser(db);
  const review = await newIntent(db, user, caseId, PRICES.extras.document_review);
  expect(
    await apply(db, completed(`txn_rev_${caseId}`, PRICES.extras.document_review, review)),
  ).toBe("ok");
  const upgrade = await newIntent(db, user, caseId, PRICES.extras.pass_after_review);
  expect(
    await apply(db, completed(`txn_up_${caseId}`, PRICES.extras.pass_after_review, upgrade)),
  ).toBe("ok");
  return user;
}

const event = (id: string, txn: string, data: Record<string, unknown>) => ({
  event_id: `evt_${nextCounter()}`,
  event_type: "adjustment.created",
  occurred_at: "2026-10-23T10:00:00Z",
  data: { id, transaction_id: txn, status: "approved", ...data },
});

describe("a credited upgrade and the purchase behind it", () => {
  it("records which payment the credit came from", async () => {
    const user = await buyReviewAndCredit("link");
    const r = await db.query<{ plan: string; provider_transaction_id: string; credit: string }>(
      `select plan, provider_transaction_id, credit_transaction_id as credit
         from licenses where user_id = $1 and plan = 'appeal_pass'`,
      [user],
    );
    expect(r.rows).toEqual([
      { plan: "appeal_pass", provider_transaction_id: "txn_up_link", credit: "txn_rev_link" },
    ]);
  });

  it("ends both when the review is fully refunded, because the Pass was paid at a discount for it", async () => {
    const user = await buyReviewAndCredit("both");
    await apply(db, adjustment("adj_rev_both", "txn_rev_both", "approved", "2026-10-23T10:00:00Z"));
    const rows = await licences(db, user);
    expect(rows.find((r) => r.plan === "document_review")?.status).toBe("canceled");
    expect(rows.find((r) => r.plan === "appeal_pass")?.status).toBe("canceled");

    /*
      26 Oct 2026: cancelling the Pass is not enough. The $150 has to go back too, or the buyer
      loses both the product and the money. The row records the debt so the daily digest can
      report it; the original's own refund needs no marker because Paddle has already paid it.
    */
    const owed = await db.query<{ provider_transaction_id: string; refund_owed_at: string | null }>(
      `select provider_transaction_id, refund_owed_at from licenses where user_id = $1`,
      [user],
    );
    expect(
      owed.rows.find((r) => r.provider_transaction_id === "txn_up_both")?.refund_owed_at,
    ).not.toBeNull();
    expect(
      owed.rows.find((r) => r.provider_transaction_id === "txn_rev_both")?.refund_owed_at,
    ).toBeNull();
  });

  it("clears the debt when the upgrade's own refund arrives", async () => {
    const user = await buyReviewAndCredit("cleared");
    await apply(
      db,
      adjustment("adj_rev_cleared", "txn_rev_cleared", "approved", "2026-10-23T10:00:00Z"),
    );
    await apply(
      db,
      adjustment("adj_up_cleared", "txn_up_cleared", "approved", "2026-10-23T11:00:00Z"),
    );
    const owed = await db.query<{ refund_owed_at: string | null }>(
      `select refund_owed_at from licenses where user_id = $1 and provider_transaction_id = 'txn_up_cleared'`,
      [user],
    );
    expect(owed.rows[0]?.refund_owed_at).toBeNull();
  });

  it("leaves the review in place when only the upgrade is refunded", async () => {
    const user = await buyReviewAndCredit("onlyup");
    await apply(
      db,
      adjustment("adj_up_onlyup", "txn_up_onlyup", "approved", "2026-10-23T10:00:00Z"),
    );
    const rows = await licences(db, user);
    expect(rows.find((r) => r.plan === "document_review")?.status).toBe("active");
    expect(rows.find((r) => r.plan === "appeal_pass")?.status).toBe("canceled");
  });

  it("restores the upgrade when its own chargeback is reversed", async () => {
    const user = await buyReviewAndCredit("reversed");
    await apply(db, event("adj_cb_reversed", "txn_up_reversed", { action: "chargeback" }));
    expect((await licences(db, user)).find((r) => r.plan === "appeal_pass")?.status).toBe(
      "canceled",
    );

    await apply(
      db,
      event("adj_cb_reversed_back", "txn_up_reversed", {
        action: "chargeback_reverse",
        original_adjustment_id: "adj_cb_reversed",
      }),
    );
    const rows = await licences(db, user);
    expect(rows.find((r) => r.plan === "document_review")?.status).toBe("active");
    expect(rows.find((r) => r.plan === "appeal_pass")?.status).toBe("active");
    // The debt was created by the chargeback and is gone with its reversal.
    const owed = await db.query<{ refund_owed_at: string | null }>(
      `select refund_owed_at from licenses where user_id = $1 and plan = 'appeal_pass'`,
      [user],
    );
    expect(owed.rows[0]?.refund_owed_at).toBeNull();
  });
});

/**
 * Migration 0027 (27 Oct 2026 audit). A restore must be a lifted block, and an upgrade must not come
 * back while the purchase it was credited from is still refunded.
 */
describe("lifting a refund or chargeback (0027)", () => {
  async function upgradeRow(user: string) {
    const r = await db.query<{ status: string; refund_owed_at: string | null }>(
      `select status, refund_owed_at from licenses where user_id = $1 and plan = 'appeal_pass'`,
      [user],
    );
    return r.rows[0]!;
  }

  it("does not restore an upgrade whose original is still refunded, and keeps the debt", async () => {
    const user = await buyReviewAndCredit("a1");
    await apply(db, adjustment("adj_rev_a1", "txn_rev_a1", "approved", "2026-10-23T10:00:00Z"));
    await apply(db, event("adj_cb_a1", "txn_up_a1", { action: "chargeback" }));
    await apply(
      db,
      event("adj_cb_a1_back", "txn_up_a1", {
        action: "chargeback_reverse",
        original_adjustment_id: "adj_cb_a1",
      }),
    );
    const up = await upgradeRow(user);
    expect(up.status).toBe("canceled");
    // Its own payment is live again and the original is still refunded: the buyer is owed it.
    expect(up.refund_owed_at).not.toBeNull();
    expect((await licences(db, user)).find((r) => r.plan === "document_review")?.status).toBe(
      "canceled",
    );
  });

  it("restores both when the original's refund is rejected after all", async () => {
    const user = await buyReviewAndCredit("a1ok");
    await apply(db, adjustment("adj_rev_a1ok", "txn_rev_a1ok", "approved", "2026-10-23T10:00:00Z"));
    await apply(
      db,
      adjustment(
        "adj_rev_a1ok",
        "txn_rev_a1ok",
        "rejected",
        "2026-10-23T12:00:00Z",
        "adjustment.updated",
      ),
    );
    const rows = await licences(db, user);
    expect(rows.find((r) => r.plan === "document_review")?.status).toBe("active");
    expect(rows.find((r) => r.plan === "appeal_pass")?.status).toBe("active");
    expect((await upgradeRow(user)).refund_owed_at).toBeNull();
  });

  it("does not turn a cancelled Pro plan back on because a refund is only pending", async () => {
    const pro = await newUser(db);
    await makeVerified(db, pro);
    const intent = await newIntent(db, pro, "account", PRICES.extras.pro_plan);
    await apply(
      db,
      completed("txn_pro_a3", PRICES.extras.pro_plan, intent, { subscriptionId: "sub_a3" }),
    );
    await apply(db, subscriptionEvent("sub_a3", "canceled", "2026-10-23T09:00:00Z"));
    const status = async () =>
      (
        await db.query<{ status: string }>(
          `select status from licenses where user_id = $1 and plan = 'pro_plan'`,
          [pro],
        )
      ).rows[0]!.status;
    expect(await status()).toBe("canceled");

    await apply(
      db,
      adjustment("adj_pro_a3", "txn_pro_a3", "pending_approval", "2026-10-23T10:00:00Z"),
    );
    expect(await status()).toBe("canceled");
  });
});

describe("an Account Pass that has run out", () => {
  async function lapsedAccountPass(user: string) {
    await db.query(
      `insert into licenses(license_key, email, user_id, plan, status, provider,
                            provider_transaction_id, activated_at, provider_updated_at, expires_at)
       values('AD-LAPSED-' || floor(random() * 1000000)::text, 'buyer@example.com', $1::uuid,
              'account_pass', 'active', 'paddle', 'txn_lapsed_' || $1::text, now() - interval '14 months',
              now() - interval '14 months', now() - interval '2 months')`,
      [user],
    );
  }

  it("is retired, not left active, when its replacement is bought", async () => {
    const user = await newUser(db);
    await lapsedAccountPass(user);
    const intent = await newIntent(db, user, "account", PRICES.account);
    expect(await apply(db, completed(`txn_replacement_${user}`, PRICES.account, intent))).toBe(
      "ok",
    );

    const rows = await licences(db, user);
    const lapsed = rows.find((r) => r.provider_transaction_id?.startsWith("txn_lapsed_"));
    const replacement = rows.find((r) => r.provider_transaction_id === `txn_replacement_${user}`);
    expect(lapsed?.status).toBe("expired");
    expect(replacement?.status).toBe("active");
    expect(replacement?.plan).toBe("account_pass");
  });

  it("can still be the base of a renewal", async () => {
    const user = await newUser(db);
    await lapsedAccountPass(user);
    const intent = await newIntent(db, user, "account", PRICES.extras.account_renewal);
    expect(
      await apply(db, completed(`txn_renew_${user}`, PRICES.extras.account_renewal, intent)),
    ).toBe("ok");

    const renewal = (await licences(db, user)).find((r) => r.plan === "account_renewal");
    expect(renewal?.status).toBe("active");
    // Twelve months from the later of the old end and this payment, so no time is lost.
    expect(new Date(renewal!.expires_at!).getTime()).toBeGreaterThan(
      Date.now() + 11 * 30 * 86_400_000,
    );
  });
});

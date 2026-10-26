import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOpsDigest, collectOpsStatus, isAllClear } from "../opsDigest";

afterEach(() => vi.unstubAllEnvs());

describe("ops digest", () => {
  it("is quiet when nothing is parked or failing", () => {
    expect(
      isAllClear({
        parkedPayments: 0,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
        pendingRebates: 0,
        malformedWebhooks: 0,
        refundOwed: 0,
      }),
    ).toBe(true);
    expect(
      isAllClear({
        parkedPayments: 1,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
        pendingRebates: 0,
        malformedWebhooks: 0,
        refundOwed: 0,
      }),
    ).toBe(false);
  });

  it("names each problem with the query that finds it, and counts them in the subject", () => {
    const { subject, text } = buildOpsDigest({
      parkedPayments: 2,
      stuckConfirmations: 0,
      failedReminders: 1,
      policyBriefOverdueDays: 0,
      pendingRebates: 0,
      malformedWebhooks: 0,
      refundOwed: 0,
    });
    expect(subject).toContain("2 things");
    expect(text).toContain("2 paid checkout(s)");
    expect(text).toContain("select * from payment_events_unmatched");
    expect(text).toContain("select * from case_reminders");
    expect(text).not.toContain("purchase confirmation");
  });

  it("uses the singular for one thing", () => {
    expect(
      buildOpsDigest({
        parkedPayments: 1,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
        pendingRebates: 0,
        malformedWebhooks: 0,
        refundOwed: 0,
      }).subject,
    ).toContain("1 thing to");
  });

  it("tells the founder when Amazon's expectations have not been re-checked for too long", () => {
    const status = {
      parkedPayments: 0,
      stuckConfirmations: 0,
      failedReminders: 0,
      policyBriefOverdueDays: 120,
      pendingRebates: 0,
      malformedWebhooks: 0,
      refundOwed: 0,
    };
    expect(isAllClear(status)).toBe(false);
    expect(buildOpsDigest(status).text).toContain("120 days ago");
  });

  it("lists outcome reports waiting for their refund, with the way to settle them", () => {
    const status = {
      parkedPayments: 0,
      stuckConfirmations: 0,
      failedReminders: 0,
      policyBriefOverdueDays: 0,
      pendingRebates: 3,
      malformedWebhooks: 0,
      refundOwed: 0,
    };
    expect(isAllClear(status)).toBe(false);
    const { text } = buildOpsDigest(status);
    expect(text).toContain("3 outcome report(s)");
    expect(text).toContain("partial refund");
    expect(text).toContain("rebate_status = 'refunded'");
  });

  /**
   * F16 (26 Oct 2026): a webhook that passed HMAC but failed the event schema used to be a bare
   * 400. A field rename on Paddle's side would stop provisioning with no signal at all.
   */
  it("reports Paddle events that failed the schema, with how to replay them", () => {
    const status = {
      parkedPayments: 0,
      stuckConfirmations: 0,
      failedReminders: 0,
      policyBriefOverdueDays: 0,
      pendingRebates: 0,
      malformedWebhooks: 2,
      refundOwed: 0,
    };
    expect(isAllClear(status)).toBe(false);
    const { text } = buildOpsDigest(status);
    expect(text).toContain("2 Paddle webhook(s)");
    expect(text).toContain(
      "select received_at, event_type, event_id, issue from malformed_webhook_events",
    );
    expect(text).toContain("replay the events from Paddle");
  });

  /**
   * Refund rule (b), 26 Oct 2026: a full refund of the purchase a credited upgrade was discounted
   * against cancels that upgrade too, so its own payment has to go back. Nothing talks to Paddle, so
   * the digest is what stops the buyer being left out of pocket without anyone noticing.
   */
  it("names credited upgrades whose own payment is owed back, and how to find them", () => {
    const status = {
      parkedPayments: 0,
      stuckConfirmations: 0,
      failedReminders: 0,
      policyBriefOverdueDays: 0,
      pendingRebates: 0,
      malformedWebhooks: 0,
      refundOwed: 1,
    };
    expect(isAllClear(status)).toBe(false);
    const { text } = buildOpsDigest(status);
    expect(text).toContain("1 credited upgrade(s)");
    expect(text).toContain("select provider_transaction_id, email, activated_at, refund_owed_at");
    expect(text).toContain("full refund of that transaction");
    expect(text).toContain("The row clears when Paddle's refund event arrives");
  });
});

/** A client that records which tables were asked about and answers every count with one number. */
function fakeClient(count: number) {
  const tables: string[] = [];
  const chain = (table: string): unknown => {
    tables.push(table);
    const result = Promise.resolve({ count, error: null });
    const proxy: unknown = new Proxy(result, {
      get(target, prop) {
        if (prop === "then") return target.then.bind(target);
        return () => proxy;
      },
    });
    return proxy;
  };
  return { client: { from: chain } as unknown as SupabaseClient, tables };
}

describe("collectOpsStatus and the rebate", () => {
  it("does not ask about outcome reports while the rebate is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "");
    const { client, tables } = fakeClient(4);
    const status = await collectOpsStatus(client);
    expect(tables).not.toContain("outcome_reports");
    expect(status.pendingRebates).toBe(0);
  });

  it("counts the reports waiting for a refund once it is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "true");
    const { client, tables } = fakeClient(4);
    const status = await collectOpsStatus(client);
    expect(tables).toContain("outcome_reports");
    expect(status.pendingRebates).toBe(4);
  });

  it("asks about owed refunds on licenses, which every database has", async () => {
    vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "");
    const { client, tables } = fakeClient(2);
    const status = await collectOpsStatus(client);
    expect(tables).toContain("licenses");
    expect(status.refundOwed).toBe(2);
  });
});

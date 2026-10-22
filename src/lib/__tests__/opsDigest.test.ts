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
      }),
    ).toBe(true);
    expect(
      isAllClear({
        parkedPayments: 1,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
        pendingRebates: 0,
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
    };
    expect(isAllClear(status)).toBe(false);
    const { text } = buildOpsDigest(status);
    expect(text).toContain("3 outcome report(s)");
    expect(text).toContain("partial refund");
    expect(text).toContain("rebate_status = 'refunded'");
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
});

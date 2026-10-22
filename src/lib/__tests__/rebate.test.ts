import { describe, expect, it } from "vitest";
import { REBATE_WINDOW_DAYS, eligibleRebate } from "../rebate";

const NOW = Date.UTC(2026, 9, 22);
const day = 86_400_000;
const ago = (n: number) => new Date(NOW - n * day).toISOString();
const lic = (
  txn: string,
  daysAgo: number,
  over: Partial<{ plan: string; status: string }> = {},
) => ({
  provider_transaction_id: txn,
  plan: "appeal_pass",
  status: "active",
  created_at: ago(daysAgo),
  ...over,
});

describe("which payment an outcome report refunds", () => {
  it("is the oldest Pass bought within 120 days, with its deadline", () => {
    const list = eligibleRebate([lic("txn_new", 5), lic("txn_old", 90)], new Set(), NOW);
    expect(list.map((c) => c.transactionId)).toEqual(["txn_old", "txn_new"]);
    expect(Date.parse(list[0]!.deadline)).toBe(NOW - 90 * day + REBATE_WINDOW_DAYS * day);
  });

  it("leaves out a payment that already has a report", () => {
    expect(
      eligibleRebate([lic("txn_a", 5), lic("txn_b", 6)], new Set(["txn_a"]), NOW).map(
        (c) => c.transactionId,
      ),
    ).toEqual(["txn_b"]);
  });

  it("leaves out a payment older than Paddle will refund, and keeps one on its last day", () => {
    expect(eligibleRebate([lic("txn_late", REBATE_WINDOW_DAYS)], new Set(), NOW)).toEqual([]);
    expect(eligibleRebate([lic("txn_edge", REBATE_WINDOW_DAYS - 1)], new Set(), NOW)).toHaveLength(
      1,
    );
  });

  it("leaves out a refunded payment", () => {
    expect(eligibleRebate([lic("txn_r", 5, { status: "canceled" })], new Set(), NOW)).toEqual([]);
  });

  it("counts a Pass, an Account Pass and a renewal, and nothing else", () => {
    const plans = ["appeal_pass", "account_pass", "account_renewal"];
    for (const plan of plans)
      expect(eligibleRebate([lic("t", 5, { plan })], new Set(), NOW), plan).toHaveLength(1);
    for (const plan of ["document_review", "pro_plan", "guardian_sub"])
      expect(eligibleRebate([lic("t", 5, { plan })], new Set(), NOW), plan).toEqual([]);
  });

  it("leaves out a row with no payment attached, such as a credit or a dev grant", () => {
    expect(
      eligibleRebate(
        [
          {
            provider_transaction_id: null,
            plan: "appeal_pass",
            status: "active",
            created_at: ago(2),
          },
        ],
        new Set(),
        NOW,
      ),
    ).toEqual([]);
  });

  it("ignores a payment dated in the future", () => {
    expect(eligibleRebate([lic("txn_f", -3)], new Set(), NOW)).toEqual([]);
  });
});

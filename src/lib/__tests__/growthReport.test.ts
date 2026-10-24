import { describe, expect, it } from "vitest";
import { growthReport } from "../../../scripts/growth-report.mjs";

const day = 86_400_000;
const now = Date.parse("2026-12-01T00:00:00Z");
const row = (
  user: string | null,
  age: number,
  amount: number | null = 22400,
  currency = "USD",
) => ({
  user_id: user,
  paid_at: new Date(now - age * day).toISOString(),
  net_cents: amount,
  fee_cents: 1170,
  currency,
});
describe("first 30 day customer cohorts", () => {
  it("includes upgrades inside 30 days, excludes later purchases and waits for maturity", () => {
    expect(
      growthReport([row("a", 60), row("a", 40, 15000), row("a", 20), row("b", 10)], now),
    ).toMatchObject({ mature: 1, immature: 1, known: 1, revenue: 37400, fees: 2340 });
  });
  it("does not average away missing amounts, unknown users or foreign currency", () => {
    expect(
      growthReport(
        [row("a", 60), row("a", 50, null), row("b", 60, 22000, "EUR"), row(null, 60)],
        now,
      ),
    ).toMatchObject({ mature: 2, known: 0, missing: 2, anonymous: 1, revenue: 0 });
  });
  it("keeps refunds as zero revenue and preserves original fees as a cost", () => {
    expect(growthReport([row("a", 60, 0)], now)).toMatchObject({
      known: 1,
      revenue: 0,
      afterFees: -1170,
    });
  });
  it("does not count a purchase at the 30 day boundary in the first window", () => {
    expect(growthReport([row("a", 60), row("a", 30, 5000)], now)).toMatchObject({
      known: 1,
      revenue: 22400,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  COMMISSION_CENTS,
  commissionReport,
  dollars,
  formatCommissionReport,
  WINDOW_DAYS,
} from "../../../scripts/partner-report.mjs";
import {
  ENOUGH_SALES,
  formatPricingReport,
  pricingReport,
} from "../../../scripts/pricing-report.mjs";

const NOW = new Date("2026-12-20T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe("the partner commission report", () => {
  it("pays 30 percent of the price after the discount, as the partner page says", () => {
    expect(COMMISSION_CENTS.appeal_pass).toBe(Math.round((249 - 25) * 0.3 * 100));
    expect(COMMISSION_CENTS.account_pass).toBe(Math.round((329 - 25) * 0.3 * 100));
    expect(dollars(COMMISSION_CENTS.appeal_pass)).toBe("$67.20");
    expect(dollars(COMMISSION_CENTS.account_pass)).toBe("$91.20");
  });

  it("leaves out refunded sales, the founding discount, other products and sales with no discount", () => {
    const report = commissionReport(
      [
        {
          plan: "appeal_pass",
          status: "active",
          provider_discount_id: "dsc_a",
          activated_at: daysAgo(30),
        },
        {
          plan: "appeal_pass",
          status: "canceled",
          provider_discount_id: "dsc_a",
          activated_at: daysAgo(30),
        },
        {
          plan: "appeal_pass",
          status: "active",
          provider_discount_id: "dsc_founding",
          activated_at: daysAgo(30),
        },
        {
          plan: "document_review",
          status: "active",
          provider_discount_id: "dsc_a",
          activated_at: daysAgo(30),
        },
        {
          plan: "appeal_pass",
          status: "active",
          provider_discount_id: null,
          activated_at: daysAgo(30),
        },
      ],
      { now: NOW, exclude: ["dsc_founding"] },
    );
    expect(report).toHaveLength(1);
    expect(report[0]!.discountId).toBe("dsc_a");
    expect(report[0]!.months.reduce((n: number, m: { sales: number }) => n + m.sales, 0)).toBe(1);
  });

  it("holds a sale until its refund window has passed, and says it is waiting", () => {
    const row = (age: number) => ({
      plan: "account_pass",
      status: "active",
      provider_discount_id: "dsc_a",
      activated_at: daysAgo(age),
    });
    const report = commissionReport([row(WINDOW_DAYS - 1), row(WINDOW_DAYS + 1)], { now: NOW });
    expect(report[0]!.waiting).toBe(1);
    expect(report[0]!.months).toHaveLength(1);
    expect(report[0]!.months[0]!.cents).toBe(COMMISSION_CENTS.account_pass);
  });

  it("files a sale under the month its window ended, which is when it is paid", () => {
    const report = commissionReport(
      [
        // Paid 28 Nov: the window ends 12 Dec, so December pays it.
        {
          plan: "appeal_pass",
          status: "active",
          provider_discount_id: "dsc_a",
          activated_at: "2026-11-28T10:00:00Z",
        },
        // Paid 10 Nov: the window ends 24 Nov, so November pays it.
        {
          plan: "appeal_pass",
          status: "active",
          provider_discount_id: "dsc_a",
          activated_at: "2026-11-10T10:00:00Z",
        },
      ],
      { now: NOW },
    );
    expect(report[0]!.months.map((m: { month: string }) => m.month)).toEqual([
      "2026-11",
      "2026-12",
    ]);
  });

  it("reads plainly, and says the amounts are list prices", () => {
    const text = formatCommissionReport(
      commissionReport(
        [
          {
            plan: "appeal_pass",
            status: "active",
            provider_discount_id: "dsc_a",
            activated_at: daysAgo(40),
          },
        ],
        { now: NOW },
      ),
    );
    expect(text).toContain("Discount dsc_a");
    expect(text).toContain("$67.20 due");
    expect(text).toContain("check them against Paddle");
    expect(formatCommissionReport([])).toBe("No partner sales yet.\n");
  });
});

describe("the price-test report", () => {
  const licences = [
    { plan: "document_review", status: "active", case_id: "c1", user_id: "u1" },
    { plan: "appeal_pass", status: "active", case_id: "c1", user_id: "u1" },
    { plan: "document_review", status: "active", case_id: "c2", user_id: "u2" },
    { plan: "appeal_pass", status: "canceled", case_id: "c3", user_id: "u3" },
  ];
  const base = {
    licences,
    reports: [
      { result: "approved", rebate_status: "pending" },
      { result: "rejected", rebate_status: "refunded" },
      { result: "rejected", rebate_status: "pending" },
    ],
    credits: [
      { granted: 10, used: 4 },
      { granted: 30, used: 0 },
    ],
    proAccounts: [{ status: "verified" }, { status: "suspended" }],
  };

  it("counts sales per product, and which are still active", () => {
    const r = pricingReport(base);
    expect(r.byPlan.appeal_pass).toEqual({ sold: 2, active: 1 });
    expect(r.byPlan.document_review).toEqual({ sold: 2, active: 2 });
  });

  it("counts a review as converted only when the Pass is for the same user and case", () => {
    expect(pricingReport(base).reviews).toEqual({ bought: 2, thenPass: 1 });
  });

  it("counts reports by result and the refunds still owed, credits and verified professionals", () => {
    const r = pricingReport(base);
    expect(r.outcomeReports).toEqual({
      total: 3,
      results: { approved: 1, rejected: 2 },
      owed: 2,
    });
    expect(r.credits).toEqual({ granted: 40, used: 4 });
    expect(r.verifiedProfessionals).toBe(1);
  });

  it("says a handful of sales is not a rate", () => {
    const text = formatPricingReport(pricingReport(base), 60);
    expect(pricingReport(base).enough).toBe(false);
    expect(text).toContain(`Fewer than ${ENOUGH_SALES} sales`);
    expect(text).toContain("1 of 2");
    expect(text).not.toContain("%");
  });

  it("does not divide by zero when nothing sold", () => {
    const text = formatPricingReport(
      pricingReport({ licences: [], reports: [], credits: [], proAccounts: [] }),
      30,
    );
    expect(text).toContain("none yet");
  });
});

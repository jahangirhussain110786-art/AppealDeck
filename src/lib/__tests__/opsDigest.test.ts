import { describe, expect, it } from "vitest";
import { buildOpsDigest, isAllClear } from "../opsDigest";

describe("ops digest", () => {
  it("is quiet when nothing is parked or failing", () => {
    expect(
      isAllClear({
        parkedPayments: 0,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
      }),
    ).toBe(true);
    expect(
      isAllClear({
        parkedPayments: 1,
        stuckConfirmations: 0,
        failedReminders: 0,
        policyBriefOverdueDays: 0,
      }),
    ).toBe(false);
  });

  it("names each problem with the query that finds it, and counts them in the subject", () => {
    const { subject, text } = buildOpsDigest({
      parkedPayments: 2,
      stuckConfirmations: 0,
      failedReminders: 1,
      policyBriefOverdueDays: 0,
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
      }).subject,
    ).toContain("1 thing to");
  });

  it("tells the founder when Amazon's expectations have not been re-checked for too long", () => {
    const status = {
      parkedPayments: 0,
      stuckConfirmations: 0,
      failedReminders: 0,
      policyBriefOverdueDays: 120,
    };
    expect(isAllClear(status)).toBe(false);
    expect(buildOpsDigest(status).text).toContain("120 days ago");
  });
});

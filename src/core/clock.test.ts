import { describe, it, expect } from "vitest";
import {
  buildClockBrief,
  clockItemsForCase,
  describeClockItem,
  mostUrgent,
  type ClockCaseInput,
} from "./clock";

const NOW = Date.parse("2026-09-22T12:00:00Z");
const day = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

function caseInput(over: Partial<ClockCaseInput> = {}): ClockCaseInput {
  return {
    caseId: "c1",
    kind: "POLICY",
    state: "AWAITING",
    ...over,
  };
}

describe("clockItemsForCase", () => {
  it("classifies urgency by whole calendar days", () => {
    const items = clockItemsForCase(caseInput({ reminderAt: day(0) }), NOW);
    expect(items[0]!.urgency).toBe("today");
    expect(items[0]!.daysRemaining).toBe(0);

    expect(clockItemsForCase(caseInput({ reminderAt: day(-3) }), NOW)[0]!.urgency).toBe("overdue");
    expect(clockItemsForCase(caseInput({ reminderAt: day(3) }), NOW)[0]!.urgency).toBe("soon");
    expect(clockItemsForCase(caseInput({ reminderAt: day(30) }), NOW)[0]!.urgency).toBe(
      "scheduled",
    );
  });

  it("counts a due date later today as due today, not as one day away", () => {
    const lateToday = new Date(Date.parse("2026-09-22T23:30:00Z")).toISOString();
    const items = clockItemsForCase(caseInput({ reminderAt: lateToday }), NOW);
    expect(items[0]!.daysRemaining).toBe(0);
  });

  it("includes a third-party follow-up as its own item", () => {
    const items = clockItemsForCase(
      caseInput({
        state: "WAITING_THIRD_PARTY",
        waitingOn: { party: "my supplier", since: day(-10), followUpAt: day(-1) },
      }),
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.source).toBe("third_party");
    expect(items[0]!.label).toBe("Chase my supplier");
    expect(items[0]!.urgency).toBe("overdue");
  });

  it("ignores a third party with no follow-up date rather than inventing one", () => {
    const items = clockItemsForCase(
      caseInput({ waitingOn: { party: "my supplier", since: day(-10) } }),
      NOW,
    );
    expect(items).toHaveLength(0);
  });

  it("skips deadlines whose date could not be established", () => {
    const items = clockItemsForCase(
      caseInput({
        // Still being prepared: once it is with Amazon, deadlines are not counted down at all.
        state: "REMEDIATION",
        deadlines: [
          { kind: "appeal_window", label: "Appeal window", dueAt: null },
          { kind: "funds_appeal_eligible", label: "Funds appeal opens", dueAt: day(5) },
        ],
      }),
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe("Funds appeal opens");
  });

  /*
    23 Sep 2026. The dashboard now passes the notice's deadlines in. Once the response is with
    Amazon the window it answered is met, and a countdown to it would tell a seller who has done the
    work that they are running out of time. Their own follow-up date still shows.
  */
  it("stops counting down to the notice's window once the response is with Amazon", () => {
    for (const state of ["SUBMITTED", "AWAITING", "NO_RESPONSE", "FOLLOW_UP"] as const) {
      const input = caseInput({
        state,
        reminderAt: day(3),
        deadlines: [{ kind: "appeal_window", label: "Appeal by 25 Sep 2026", dueAt: day(3) }],
      });
      expect(
        clockItemsForCase(input, NOW).map((i) => i.source),
        state,
      ).toEqual(["reminder"]);
    }
  });

  it("counts down to it while the response is prepared, or revised after a reply", () => {
    for (const state of ["REMEDIATION", "READY", "REVISION"] as const) {
      const items = clockItemsForCase(
        caseInput({
          state,
          deadlines: [{ kind: "appeal_window", label: "Appeal by 25 Sep 2026", dueAt: day(3) }],
        }),
        NOW,
      );
      expect(items, state).toMatchObject([
        { source: "deadline", urgency: "soon", daysRemaining: 3 },
      ]);
    }
  });

  it("says nothing about a case that is already won or closed", () => {
    for (const state of ["APPROVED", "CLOSED"] as const) {
      expect(clockItemsForCase(caseInput({ state, reminderAt: day(-5) }), NOW)).toHaveLength(0);
    }
  });

  it("ignores an unparseable date instead of throwing", () => {
    expect(clockItemsForCase(caseInput({ reminderAt: "not a date" }), NOW)).toHaveLength(0);
  });
});

describe("newSinceLastSeen", () => {
  it("marks an item that came due while the seller was away", () => {
    const items = clockItemsForCase(caseInput({ reminderAt: day(-1), lastSeenAt: day(-5) }), NOW);
    expect(items[0]!.newSinceLastSeen).toBe(true);
  });

  it("does not re-announce something that was already due when they last looked", () => {
    const items = clockItemsForCase(caseInput({ reminderAt: day(-10), lastSeenAt: day(-5) }), NOW);
    expect(items[0]!.newSinceLastSeen).toBe(false);
  });

  it("marks nothing as new for a case the seller has never reopened", () => {
    // Everything would be "new", which is noise rather than news.
    const items = clockItemsForCase(caseInput({ reminderAt: day(-10) }), NOW);
    expect(items[0]!.newSinceLastSeen).toBe(false);
  });

  it("does not mark a future item as new", () => {
    const items = clockItemsForCase(caseInput({ reminderAt: day(3), lastSeenAt: day(-5) }), NOW);
    expect(items[0]!.newSinceLastSeen).toBe(false);
  });
});

describe("buildClockBrief", () => {
  it("sorts most urgent first across every case", () => {
    const brief = buildClockBrief(
      [
        caseInput({ caseId: "later", reminderAt: day(20) }),
        caseInput({ caseId: "overdue", reminderAt: day(-4) }),
        caseInput({ caseId: "soon", reminderAt: day(2) }),
        caseInput({ caseId: "today", reminderAt: day(0) }),
      ],
      NOW,
    );
    expect(brief.items.map((i) => i.caseId)).toEqual(["overdue", "today", "soon", "later"]);
    expect(brief.hasOverdue).toBe(true);
    expect(mostUrgent(brief)!.caseId).toBe("overdue");
  });

  it("orders two overdue items by how overdue they are", () => {
    const brief = buildClockBrief(
      [
        caseInput({ caseId: "a", reminderAt: day(-2) }),
        caseInput({ caseId: "b", reminderAt: day(-9) }),
      ],
      NOW,
    );
    expect(brief.items.map((i) => i.caseId)).toEqual(["b", "a"]);
  });

  it("reports an empty brief rather than a placeholder when nothing is outstanding", () => {
    const brief = buildClockBrief([caseInput({ state: "APPROVED" })], NOW);
    expect(brief.items).toHaveLength(0);
    expect(brief.newItems).toHaveLength(0);
    expect(brief.hasOverdue).toBe(false);
    expect(mostUrgent(brief)).toBeNull();
  });

  it("separates what is new from what is merely outstanding", () => {
    const brief = buildClockBrief(
      [
        caseInput({ caseId: "known", reminderAt: day(-10), lastSeenAt: day(-5) }),
        caseInput({ caseId: "fresh", reminderAt: day(-1), lastSeenAt: day(-5) }),
      ],
      NOW,
    );
    expect(brief.items).toHaveLength(2);
    expect(brief.newItems.map((i) => i.caseId)).toEqual(["fresh"]);
  });
});

describe("describeClockItem", () => {
  const describe1 = (over: Partial<ClockCaseInput>) =>
    describeClockItem(clockItemsForCase(caseInput(over), NOW)[0]!);

  it("uses plain words a panicking seller can read at a glance", () => {
    expect(describe1({ reminderAt: day(0) })).toBe("Your follow-up reminder — today");
    expect(describe1({ reminderAt: day(1) })).toBe("Your follow-up reminder — tomorrow");
    expect(describe1({ reminderAt: day(4) })).toBe("Your follow-up reminder — in 4 days");
    expect(describe1({ reminderAt: day(-1) })).toBe("Your follow-up reminder — 1 day ago");
    expect(describe1({ reminderAt: day(-6) })).toBe("Your follow-up reminder — 6 days ago");
  });
});

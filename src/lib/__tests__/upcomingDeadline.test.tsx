import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { upcomingDeadline } from "../caseSummary";
import { PurchaseClock } from "@/components/pricing/PurchaseClock";

/**
 * The seller's own deadline beside the buy button (23 Oct 2026). It must be real: from a stated
 * date, still ahead, counted on the calendar. A window with no stated date, a funds-style
 * indefinite hold or a date already past shows nothing, so no urgency is ever invented.
 */
const now = new Date(2026, 9, 23, 15, 0, 0); // 23 Oct 2026, local
const d = (over: Record<string, unknown>) =>
  ({
    kind: "appeal_window",
    label: "Appeal window",
    dueAt: null,
    ...over,
  }) as never;

describe("upcomingDeadline", () => {
  it("returns the soonest dated deadline and how many days are left", () => {
    const file = {
      deadlines: [
        d({ dueOn: "2026-11-20", dueAt: "2026-11-20T00:00:00Z" }),
        d({ kind: "seller_plan", label: "Your Account Health date", dueOn: "2026-10-30" }),
      ],
    };
    expect(upcomingDeadline(file, now)).toEqual({
      label: "Your Account Health date",
      day: "2026-10-30",
      days: 7,
    });
  });

  it("counts today as zero days, not past", () => {
    expect(upcomingDeadline({ deadlines: [d({ dueOn: "2026-10-23" })] }, now)?.days).toBe(0);
  });

  it("shows nothing for a date already past, an undated window, an indefinite hold, or no case", () => {
    expect(upcomingDeadline({ deadlines: [d({ dueOn: "2026-10-01" })] }, now)).toBeNull();
    expect(upcomingDeadline({ deadlines: [d({})] }, now)).toBeNull();
    expect(
      upcomingDeadline({ deadlines: [d({ dueOn: "2027-01-01", isIndefinite: true })] }, now),
    ).toBeNull();
    expect(upcomingDeadline(null, now)).toBeNull();
    expect(upcomingDeadline({ deadlines: [] }, now)).toBeNull();
  });
});

describe("PurchaseClock", () => {
  it("states the date, what is left, and that Amazon decides", () => {
    const html = renderToStaticMarkup(
      <PurchaseClock deadline={{ label: "Appeal window", day: "2026-10-30" }} now={now} />,
    );
    expect(html).toContain("Appeal window:");
    expect(html).toContain("30 Oct 2026");
    expect(html).toContain("in 7 days");
    expect(html).toContain("Amazon decides what happens after it");
    expect(html).not.toMatch(/hurry|last chance|expires|only \d+ left|guarantee/i);
  });

  it("renders nothing without a deadline", () => {
    expect(renderToStaticMarkup(<PurchaseClock deadline={null} now={now} />)).toBe("");
  });
});

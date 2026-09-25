import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClockBriefCard } from "@/components/ClockBriefCard";
import { APP } from "@/content/app";

const EMPTY = { items: [], newItems: [], hasOverdue: false };

/**
 * 25 Sep 2026: a case whose notice said "90 days from the day you received this notice" opened
 * the dashboard on "Nothing is due", because a window with nothing to count from is not a clock
 * item. A seller must never be told that while an appeal window is running.
 */
describe("ClockBriefCard", () => {
  it("shows an undated window instead of 'Nothing is due'", () => {
    const html = renderToStaticMarkup(
      <ClockBriefCard
        brief={EMPTY}
        undated={[{ kind: "appeal_window", dueAt: null, label: "Appeal window: 90 days" }]}
      />,
    );
    expect(html).toContain(APP.dashboard.clock.titleUndated);
    expect(html).toContain("Appeal window: 90 days");
    expect(html).not.toContain(APP.dashboard.clock.titleClear);
  });

  it("says nothing is due only when there is truly nothing", () => {
    const html = renderToStaticMarkup(<ClockBriefCard brief={EMPTY} />);
    expect(html).toContain(APP.dashboard.clock.titleClear);
  });
});

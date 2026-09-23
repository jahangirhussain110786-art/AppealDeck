import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DeadlineChip, DeadlineChipList } from "@/components/DeadlineChip";

// Fixed clock so the relative-day text is deterministic. Midday UTC keeps the calendar date stable
// in every timezone the tests may run in.
const NOW = new Date("2026-09-05T12:00:00.000Z");

describe("DeadlineChip", () => {
  it("renders a deadline whose dueAt is an ISO string (the /api/decode wire shape)", () => {
    const html = renderToStaticMarkup(
      <DeadlineChip
        now={NOW}
        deadline={{
          kind: "appeal_window",
          dueAt: "2026-09-23T12:00:00.000Z",
          label: "Appeal window",
        }}
      />,
    );
    expect(html).toContain("Appeal window");
    expect(html).toContain("23 Sep 2026");
    expect(html).toContain("in 18 days");
  });

  it("renders the same output for a Date dueAt", () => {
    const html = renderToStaticMarkup(
      <DeadlineChip
        now={NOW}
        deadline={{
          kind: "appeal_window",
          dueAt: new Date("2026-09-23T12:00:00.000Z"),
          label: "Appeal window",
        }}
      />,
    );
    expect(html).toContain("23 Sep 2026");
    expect(html).toContain("in 18 days");
  });

  it("falls back to 'Date not stated' for a null dueAt", () => {
    const html = renderToStaticMarkup(
      <DeadlineChip
        now={NOW}
        deadline={{ kind: "appeal_window", dueAt: null, label: "Appeal window" }}
      />,
    );
    expect(html).toContain("Date not stated");
  });

  it("renders a list of string-dated deadlines without throwing", () => {
    const html = renderToStaticMarkup(
      <DeadlineChipList
        now={NOW}
        deadlines={[
          { kind: "appeal_window", dueAt: "2026-09-23T12:00:00.000Z", label: "Appeal window" },
          {
            kind: "funds_appeal_eligible",
            dueAt: "2026-11-05T12:00:00.000Z",
            label: "Funds appeal",
          },
        ]}
      />,
    );
    expect(html).toContain("Appeal window");
    expect(html).toContain("Funds appeal");
    expect(html).toContain("5 Nov 2026");
  });
});

/**
 * 23 Sep 2026. When the notice gives a window's length but not its date, the chip fell through to
 * "Date not stated", which reads as though Amazon had set no window at all. On the reply path, where
 * nothing discarded the computed date, it showed a countdown counted from the moment the reply was
 * applied. It now says what is true.
 */
describe("a window whose start date is not in the notice", () => {
  const unknownStart = {
    kind: "appeal_window" as const,
    dueAt: null,
    label: "Appeal window: 30 days",
    startsOnReceipt: true,
  };

  it("says the window runs from the day the notice was received", () => {
    const html = renderToStaticMarkup(<DeadlineChip now={NOW} deadline={unknownStart} />);
    expect(html).toContain("Appeal window: 30 days");
    expect(html).toContain("From the day you received this notice");
  });

  it("does not suggest Amazon gave no window, or show a countdown it cannot know", () => {
    const html = renderToStaticMarkup(<DeadlineChip now={NOW} deadline={unknownStart} />);
    expect(html).not.toContain("Date not stated");
    expect(html).not.toMatch(/in \d+ days|\d+ days ago|today|tomorrow/i);
  });

  it("still shows the date and countdown when the notice did carry its date", () => {
    const html = renderToStaticMarkup(
      <DeadlineChip
        now={NOW}
        deadline={{
          kind: "appeal_window",
          dueAt: "2026-10-03T00:00:00.000Z",
          label: "Appeal window: 30 days from 3 Sep 2026",
          startsOn: "2026-09-03",
        }}
      />,
    );
    expect(html).toContain("3 Sep 2026");
    expect(html).not.toContain("From the day you received this notice");
  });
});

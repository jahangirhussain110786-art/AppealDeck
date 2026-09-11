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

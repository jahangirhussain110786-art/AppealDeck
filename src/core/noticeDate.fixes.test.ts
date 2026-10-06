import { describe, expect, it } from "vitest";
import { receiptDateOf, statedDeadlineOf } from "./noticeDate";
import { extractEntities } from "./entities";
import { parseNotice } from "./noticeParser";
import { computeDeadlines } from "./deadlinesModel";

describe("ISO timestamps", () => {
  it("reads a timestamp header as the day received", () => {
    expect(receiptDateOf("Date: 2026-03-04T23:30:00-08:00\nSubject: Notice")).toBe("2026-03-04");
  });
  it("extracts the day from a timestamp, keeping the span invariant", () => {
    const raw = "Sent 2026-03-04T23:30:00-08:00 by Amazon";
    const date = extractEntities(raw).find((e) => e.kind === "date")!;
    expect(date.value).toBe("2026-03-04");
    expect(raw.slice(date.start, date.end)).toBe(date.value);
  });
});

describe("stated deadlines", () => {
  it("reads 'If we do not receive a response by ...'", () => {
    const d = statedDeadlineOf(
      "If we do not receive a response by 15 November 2026 your account will stay closed.",
      null,
    );
    expect(d?.day).toBe("2026-11-15");
  });
  it("does not read a records period as a deadline", () => {
    expect(
      statedDeadlineOf("Please submit invoices covering all sales until 31 December 2025.", null),
    ).toBeNull();
  });
  it("does not roll a date just before the header date into next year", () => {
    const raw = "Date: 4 Mar 2026\nPlease submit your appeal by March 1.";
    expect(statedDeadlineOf(raw, receiptDateOf(raw))).toBeNull();
  });
  it("still places a later year-less date against the header", () => {
    const raw = "Date: 4 Mar 2026\nPlease submit your appeal by March 20.";
    expect(statedDeadlineOf(raw, receiptDateOf(raw))?.day).toBe("2026-03-20");
  });
});

describe("counted window versus stated date", () => {
  const compute = (raw: string) =>
    computeDeadlines({
      kind: "POLICY",
      parsed: parseNotice(raw),
      now: new Date("2026-03-05T00:00:00Z"),
    } as never);
  it("uses the earlier counted date when the stated date is later", () => {
    const out = compute("Date: 4 Mar 2026\nYou have 14 days to appeal. Appeal before March 20.");
    const w = out.find((d) => d.kind === "appeal_window")!;
    expect(w.dueOn).toBe("2026-03-18");
  });
  it("keeps the stated date when it is earlier", () => {
    const out = compute("Date: 4 Mar 2026\nYou have 30 days to appeal. Appeal before March 10.");
    const w = out.find((d) => d.kind === "appeal_window")!;
    expect(w.dueOn).toBe("2026-03-10");
  });
});

import { describe, expect, it } from "vitest";
import { statedDeadlineOf } from "./noticeDate";

/** 8 Oct 2026: an all-numeric last day is read when the text settles it, never guessed otherwise. */
describe("an all-numeric deadline", () => {
  it("reads a day above 12 as the day", () => {
    const d = statedDeadlineOf(
      "Please submit your plan of action by 15/11/2026 or your account will remain deactivated.",
      "2026-10-08",
    );
    expect(d?.day).toBe("2026-11-15");
  });

  it("reads a dotted date as day.month.year", () => {
    const d = statedDeadlineOf(
      "You must respond by 20.11.2026 with a plan of action.",
      "2026-10-08",
    );
    expect(d?.day).toBe("2026-11-20");
  });

  it("says nothing when the date could be March or December", () => {
    expect(statedDeadlineOf("Respond by 04/05/2026 with a plan of action.", null)).toBeNull();
    expect(
      statedDeadlineOf("Respond by 04/05/2026 with a plan of action.", "2026-03-01"),
    ).toBeNull();
  });

  it("still refuses a numeric date that falls before the notice was sent", () => {
    expect(
      statedDeadlineOf("Respond by 15/09/2026 with a plan of action.", "2026-10-08"),
    ).toBeNull();
  });
});

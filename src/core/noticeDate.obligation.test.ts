import { describe, expect, it } from "vitest";
import { statedDeadlineOf } from "./noticeDate";

describe("a deadline written as an obligation", () => {
  it("reads 'must be received by'", () => {
    const d = statedDeadlineOf(
      "Your appeal must be received by 15 November 2026 at 11:59 PM PST.",
      null,
    );
    expect(d?.day).toBe("2026-11-15");
  });

  it("still ignores a date that describes a document", () => {
    expect(
      statedDeadlineOf(
        "Please submit invoices received by 15 November 2026 for these orders.",
        null,
      ),
    ).toBeNull();
  });
});

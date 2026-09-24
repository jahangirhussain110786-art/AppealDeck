import { describe, it, expect } from "vitest";
import { daysBetween, documentDateReadings } from "./documentDate";

describe("documentDateReadings", () => {
  it.each([
    ["12 March 2026", "2026-03-12"],
    ["March 12, 2026", "2026-03-12"],
    ["Invoice date: 2026-03-12", "2026-03-12"],
    ["03-Mar-2026", "2026-03-03"],
    ["3.Mar.2026", "2026-03-03"],
    ["2026/03/12", "2026-03-12"],
    ["25/04/2026", "2026-04-25"],
    ["04/25/2026", "2026-04-25"],
  ])("reads %s as one day", (text, day) => {
    expect(documentDateReadings(text)).toEqual([day]);
  });

  it("returns both readings of an all-numeric date that could go either way", () => {
    expect(documentDateReadings("03/04/2026").sort()).toEqual(["2026-03-04", "2026-04-03"]);
  });

  it("returns one reading when both orders give the same day", () => {
    expect(documentDateReadings("05/05/2026")).toEqual(["2026-05-05"]);
  });

  it("reads a two-digit year as this century", () => {
    expect(documentDateReadings("25.04.26")).toEqual(["2026-04-25"]);
  });

  it.each(["March 2026", "12 March", "no date here", "31/02/2026", "13/13/2026"])(
    "finds no reliable day in %s",
    (text) => {
      expect(documentDateReadings(text)).toEqual([]);
    },
  );
});

describe("daysBetween", () => {
  it("counts whole calendar days", () => {
    expect(daysBetween("2025-09-24", "2026-09-24")).toBe(365);
    expect(daysBetween("2026-09-24", "2026-09-23")).toBe(-1);
  });
});

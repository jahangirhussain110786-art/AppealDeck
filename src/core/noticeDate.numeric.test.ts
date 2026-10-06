import { describe, expect, it } from "vitest";
import { numericDateIn, receiptDateOf, receiptDateReadings } from "./noticeDate";
import { extractEntities, findUnreadableIds } from "./entities";
import { parseNotice } from "./noticeParser";

describe("all-numeric header dates (6 Oct 2026)", () => {
  it("reads the ones that cannot be misread", () => {
    expect(receiptDateOf("Date: 25/09/2026")).toBe("2026-09-25");
    expect(receiptDateOf("Date: 09/25/2026")).toBe("2026-09-25");
    expect(receiptDateOf("Date: 12.09.2026")).toBe("2026-09-12");
    expect(receiptDateOf("Date: 05/05/2026")).toBe("2026-05-05");
  });

  it("returns both readings of a genuinely ambiguous one, and still counts nothing from it", () => {
    expect(receiptDateOf("Date: 12/09/2026")).toBeNull();
    expect(receiptDateReadings("Date: 12/09/2026")).toEqual(["2026-09-12", "2026-12-09"]);
    expect(receiptDateReadings("Date: 9/12/26")).toEqual(["2026-12-09", "2026-09-12"]);
    expect(receiptDateReadings("Date: 25/09/2026")).toBeNull();
    const parsed = parseNotice("Date: 12/09/2026\nYou may appeal within 30 days.");
    expect(parsed.receivedOn).toBeNull();
    expect(parsed.ambiguousReceipt).toEqual(["2026-09-12", "2026-12-09"]);
  });

  it("does not take a section number for a date", () => {
    expect(numericDateIn("see section 4.2.10")).toBeNull();
    expect(numericDateIn("policy 4.2.10 applies")).toBeNull();
  });

  it("marks entity dates ambiguous only when they are, and carries both readings", () => {
    const dates = extractEntities("Dates: 25/09/2026, 12/09/2026 and 12.09.2026.").filter(
      (e) => e.kind === "date",
    );
    expect(dates.map((d) => [d.value, d.ambiguous ?? false])).toEqual([
      ["25/09/2026", false],
      ["12/09/2026", true],
      ["12.09.2026", false],
    ]);
    expect(dates[1]!.readings).toEqual(["2026-09-12", "2026-12-09"]);
  });
});

describe("identifiers as they really arrive (6 Oct 2026)", () => {
  const find = (raw: string, kind: string) => extractEntities(raw).filter((e) => e.kind === kind);

  it("keeps the source text as the value and exposes the normalised form", () => {
    const [lower] = find("asin: b0abcdef12", "asin");
    expect(lower!.value).toBe("b0abcdef12");
    expect(lower!.normalized).toBe("B0ABCDEF12");
    expect(find("B08N5WRWNW", "asin")[0]!.normalized).toBeUndefined();
  });

  it("reads an ASIN broken into groups, or with the zero read as the letter O", () => {
    expect(find("ASIN B0 ABCD EF13 was removed", "asin")[0]!.normalized).toBe("B0ABCDEF13");
    expect(find("ASIN BOABCDEF14 was removed", "asin")[0]!.normalized).toBe("B0ABCDEF14");
    expect(find("a BOOKSELLER wrote B0 AND SELLER", "asin")).toEqual([]);
  });

  it("counts the same ASIN once however it was written", () => {
    expect(find("B0ABCDEF12 and b0abcdef12 and B0 ABCD EF12", "asin")).toHaveLength(1);
  });

  it("names an ASIN that is a character short or long instead of dropping it silently", () => {
    expect(find("ASIN: B0ABCDEF1", "asin")).toEqual([]);
    expect(findUnreadableIds("ASIN: B0ABCDEF1 and ASIN B0ABCDEF123").map((h) => h.value)).toEqual([
      "B0ABCDEF1",
      "B0ABCDEF123",
    ]);
    expect(findUnreadableIds("ASIN: B08N5WRWNW")).toEqual([]);
  });

  it("reads order IDs with spaces or a missing hyphen", () => {
    expect(find("order 111 - 1234567 - 7654321", "order_id")[0]!.normalized).toBe(
      "111-1234567-7654321",
    );
    expect(find("order 1111234567-7654321", "order_id")[0]!.normalized).toBe("111-1234567-7654321");
    expect(find("order 114-3941689-8772232", "order_id")[0]!.normalized).toBeUndefined();
  });

  it("reads a spaced case ID, but not a labelled short count", () => {
    expect(find("Case ID: 8823 4719 05", "case_id")[0]!.normalized).toBe("8823471905");
    expect(find("case 5000 units", "case_id")).toEqual([]);
  });

  it("keeps raw.slice(start, end) === value for every identifier", () => {
    const raw =
      "asin: b0abcdef12, B0 ABCD EF13, BOABCDEF14, order 111 - 1234567 - 7654321, Case ID: 8823 4719 05";
    for (const e of extractEntities(raw)) {
      if (e.kind !== "requested_record") expect(raw.slice(e.start, e.end)).toBe(e.value);
    }
  });
});

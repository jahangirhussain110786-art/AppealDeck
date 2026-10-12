import { describe, expect, it } from "vitest";
import { CASES_CSV_HEADER, csvField, csvRow } from "../casesCsv";

describe("csvField (G-60)", () => {
  it("leaves a plain value alone", () => {
    expect(csvField("Acme UK")).toBe("Acme UK");
  });

  it("quotes a value with a comma or a quote, doubling the quote", () => {
    expect(csvField("Acme, Ltd")).toBe('"Acme, Ltd"');
    expect(csvField('The "main" store')).toBe('"The ""main"" store"');
  });

  it("flattens line breaks, which would split the row", () => {
    expect(csvField("one\ntwo\r\nthree")).toBe("one two three");
  });

  it("keeps a typed name from being run as a spreadsheet formula", () => {
    expect(csvField('=HYPERLINK("http://x","a")')).toMatch(/^"'=HYPERLINK/);
    expect(csvField("+1 555")).toBe("'+1 555");
    expect(csvField("-5")).toBe("'-5");
    expect(csvField("@cmd")).toBe("'@cmd");
  });

  it("does not touch a value that only contains those characters later on", () => {
    expect(csvField("Store A - UK")).toBe("Store A - UK");
  });
});

describe("csvRow and the header", () => {
  it("joins fields with commas", () => {
    expect(csvRow(["a", "b,c", ""])).toBe('a,"b,c",');
  });

  it("names the eight things a seller with many accounts asks of the list, plus the case id and status", () => {
    expect([...CASES_CSV_HEADER]).toEqual([
      "Case name",
      "Kind",
      "Case ID",
      "Opened",
      "Status",
      "Next step",
      "Reply by",
      "Waiting on",
      "Chase on",
      "Last activity",
    ]);
  });
});

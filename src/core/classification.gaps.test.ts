import { describe, expect, it } from "vitest";
import { determineResponseType } from "./responseType";
import { parseNotice } from "./noticeParser";
import { extractEntities } from "./entities";

describe("negation words that do not negate the request", () => {
  const asks: Array<[string, string]> = [
    ["Please submit a plan of action without delay.", "PLAN_OF_ACTION"],
    ["Please provide invoices that do not show redacted prices.", "SUPPORTING_DOCUMENTS"],
    ["Please submit invoices rather than screenshots.", "SUPPORTING_DOCUMENTS"],
  ];
  for (const [text, type] of asks) {
    it(`still reads a request: ${text}`, () => {
      expect(determineResponseType(text).type).toBe(type);
    });
  }
  it("still negates a real refusal", () => {
    expect(determineResponseType("Do not submit a plan of action.").type).not.toBe(
      "PLAN_OF_ACTION",
    );
  });
});

describe("kind hints", () => {
  for (const text of [
    "Your account is related to another account.",
    "Your account is linked to another seller account.",
    "Your account is associated with another account.",
  ]) {
    it(`related account: ${text}`, () => {
      expect(parseNotice(text).kindHints).toContain("RELATED_ACCOUNT");
    });
  }
  it("reads CPSIA wording as product safety", () => {
    const n = parseNotice(
      "This product requires safety documentation. Please provide a CPSIA test report and a Children's Product Certificate (CPC).",
    );
    expect(n.kindHints).toContain("PRODUCT_SAFETY");
  });
  it("does not call a plain 'linked to' sentence a related account", () => {
    expect(parseNotice("Your listing is linked to the brand page.").kindHints).not.toContain(
      "RELATED_ACCOUNT",
    );
  });
});

describe("entity extraction", () => {
  const dates = (raw: string) => extractEntities(raw).filter((e) => e.kind === "date");
  it("reads ordinal dates and keeps spans exact", () => {
    for (const raw of ["Sent March 4th, 2026.", "Sent 4th March 2026."]) {
      const [d] = dates(raw);
      expect(d?.ambiguous).toBeUndefined();
      expect(raw.slice(d!.start, d!.end)).toBe(d!.value);
      expect(d!.value).toMatch(/4th/);
    }
  });
  it("reads a lowercase asin", () => {
    const raw = "asin: b0abcdefgh was removed";
    const [a] = extractEntities(raw).filter((e) => e.kind === "asin");
    expect(a?.value).toBe("b0abcdefgh");
    expect(raw.slice(a!.start, a!.end)).toBe(a!.value);
  });
});

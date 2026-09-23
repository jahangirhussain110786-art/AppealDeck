import { describe, it, expect } from "vitest";
import { normalizePastedId, looksLikeAsin, stripInvisibleChars } from "@/lib/idNormalize";
import { extractEntities } from "@/core/entities";

describe("normalizePastedId", () => {
  it("trims and uppercases a plain pasted ID", () => {
    expect(normalizePastedId("  b0abc12345  ")).toBe("B0ABC12345");
  });

  it("collapses internal whitespace runs from a line-wrapped paste", () => {
    expect(normalizePastedId("B0 ABC\n12345")).toBe("B0ABC12345");
  });

  it("strips zero-width characters and a BOM introduced by a rich-text paste", () => {
    const withArtifacts = "B0​ABC‌1‍2345﻿";
    expect(normalizePastedId(withArtifacts)).toBe("B0ABC12345");
  });

  it("normalizes curly quotes to straight quotes", () => {
    expect(normalizePastedId("‘case-123’")).toBe("'CASE-123'");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(normalizePastedId("")).toBe("");
    expect(normalizePastedId("   \n  ")).toBe("");
  });
});

describe("looksLikeAsin", () => {
  it("accepts a 10-character alphanumeric string", () => {
    expect(looksLikeAsin("B0ABC12345")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(looksLikeAsin("B0ABC1234")).toBe(false);
    expect(looksLikeAsin("B0ABC123456")).toBe(false);
  });

  it("rejects non-alphanumeric characters", () => {
    expect(looksLikeAsin("B0-ABC-123")).toBe(false);
  });
});

describe("stripInvisibleChars", () => {
  const dirty = "Your listing for ASIN B08N5​WRWNW was removed.";

  it("removes the paste artifact that silently defeats ASIN extraction", () => {
    // The defect this exists for, asserted as a before/after rather than described: a zero-width
    // space pasted inside an identifier makes entities.ts match nothing, and the seller is never
    // told the ASIN went missing.
    expect(extractEntities(dirty).some((e) => e.kind === "asin")).toBe(false);
    expect(extractEntities(stripInvisibleChars(dirty)).map((e) => e.value)).toContain("B08N5WRWNW");
  });

  it("leaves every visible character, space and line break exactly where it was", () => {
    // entities.ts guarantees raw.slice(start, end) === value, so this must never reflow text.
    const text = "Case ID: 12345678\n\n  Provide an invoice.";
    expect(stripInvisibleChars(text)).toBe(text);
  });

  it("keeps spans valid on the sanitised text", () => {
    const clean = stripInvisibleChars(dirty);
    for (const e of extractEntities(clean)) {
      if (e.kind !== "requested_record") expect(clean.slice(e.start, e.end)).toBe(e.value);
    }
  });
});

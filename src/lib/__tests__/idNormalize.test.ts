import { describe, it, expect } from "vitest";
import { normalizePastedId, looksLikeAsin } from "@/lib/idNormalize";

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

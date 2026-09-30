import { describe, it, expect } from "vitest";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { extractEntities } from "@/core/entities";

describe("stripInvisibleChars", () => {
  const dirty = "Your listing for ASIN B08N5​WRWNW was removed.";

  it("removes the paste artifact that silently defeats ASIN extraction", () => {
    // The defect this exists for, asserted as a before/after rather than described: a zero-width
    // space pasted inside an identifier makes entities.ts match nothing, and the seller is never
    // told the ASIN went missing.
    expect(extractEntities(dirty).some((e) => e.kind === "asin")).toBe(false);
    expect(extractEntities(stripInvisibleChars(dirty)).map((e) => e.value)).toContain("B08N5WRWNW");
  });

  it("removes each of the four invisible characters", () => {
    expect(stripInvisibleChars("B0​ABC‌1‍2345﻿")).toBe("B0ABC12345");
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

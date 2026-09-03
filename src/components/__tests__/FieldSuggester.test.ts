import { describe, expect, it } from "vitest";
import { canSuggest } from "../FieldSuggester";

describe("canSuggest", () => {
  it("returns false for empty text", () => {
    expect(canSuggest("")).toBe(false);
  });

  it("returns false for whitespace only", () => {
    expect(canSuggest("   \n  \t  ")).toBe(false);
  });

  it("returns false for text shorter than 20 chars", () => {
    expect(canSuggest("Amazon deactivated")).toBe(false);
    expect(canSuggest("a".repeat(19))).toBe(false);
  });

  it("returns true for text exactly 20 chars (after trim)", () => {
    expect(canSuggest("a".repeat(20))).toBe(true);
  });

  it("returns true for text longer than 20 chars", () => {
    expect(canSuggest("Amazon deactivated my account on 2026-08-15.")).toBe(true);
  });

  it("ignores leading/trailing whitespace in the length check", () => {
    expect(canSuggest("   " + "a".repeat(20) + "   ")).toBe(true);
  });
});

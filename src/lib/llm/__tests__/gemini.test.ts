import { describe, expect, it } from "vitest";
import { __test, isGeminiConfigured, getGeminiModel } from "../gemini";

describe("gemini (no env)", () => {
  it("isGeminiConfigured returns false when key is unset", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
  });

  it("getGeminiModel falls back to default when GEMINI_MODEL is unset", () => {
    delete process.env.GEMINI_MODEL;
    expect(getGeminiModel()).toBe("gemini-1.5-flash");
  });

  it("getGeminiModel respects GEMINI_MODEL when set", () => {
    process.env.GEMINI_MODEL = "gemini-1.5-pro";
    expect(getGeminiModel()).toBe("gemini-1.5-pro");
    delete process.env.GEMINI_MODEL;
  });
});

describe("parseGeminiResponse", () => {
  const { parseGeminiResponse } = __test;

  it("returns null on empty payload", () => {
    expect(parseGeminiResponse(null)).toBeNull();
    expect(parseGeminiResponse({})).toBeNull();
    expect(parseGeminiResponse({ candidates: [] })).toBeNull();
  });

  it("extracts text from a single-part response", () => {
    const out = parseGeminiResponse({
      candidates: [{ content: { parts: [{ text: "hello world" }] } }],
    });
    expect(out?.text).toBe("hello world");
  });

  it("joins multi-part text", () => {
    const out = parseGeminiResponse({
      candidates: [{ content: { parts: [{ text: "foo " }, { text: "bar" }] } }],
    });
    expect(out?.text).toBe("foo bar");
  });

  it("extracts usage when present", () => {
    const out = parseGeminiResponse({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4 },
    });
    expect(out?.usage).toEqual({ inputTokens: 12, outputTokens: 4 });
  });

  it("returns null when parts is missing", () => {
    expect(parseGeminiResponse({ candidates: [{ content: {} }] })).toBeNull();
  });
});

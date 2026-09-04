import { afterEach, describe, expect, it, vi } from "vitest";
import { __test, callGemini, isGeminiConfigured, getGeminiModel } from "../gemini";

describe("gemini (no env)", () => {
  it("isGeminiConfigured returns false when key is unset", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
  });

  it("getGeminiModel falls back to default when GEMINI_MODEL is unset", () => {
    delete process.env.GEMINI_MODEL;
    expect(getGeminiModel()).toBe("gemini-3.5-flash");
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

describe("callGemini request shape", () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
    vi.restoreAllMocks();
  });

  function mockFetch(candidates: unknown) {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ candidates }),
    })) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;
    return fetchMock;
  }

  it("uses text/plain when no JSON flag is set", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = mockFetch([{ content: { parts: [{ text: "ok" }] } }]);
    await callGemini({ messages: [{ role: "user", text: "hi" }] });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.generationConfig.responseMimeType).toBe("text/plain");
    expect(body.generationConfig.responseSchema).toBeUndefined();
    expect(body.generationConfig.thinkingConfig).toBeUndefined();
  });

  it("uses application/json + schema + thinkingBudget 0 when responseJsonSchema is set", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = mockFetch([{ content: { parts: [{ text: '{"a":1}' }] } }]);
    const schema = { type: "object", properties: { a: { type: "number" } } };
    const result = await callGemini({
      messages: [{ role: "user", text: "hi" }],
      responseJsonSchema: schema,
    });
    expect(result.ok).toBe(true);
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual(schema);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it("uses application/json + thinkingBudget 0 when responseJson is true (no schema)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = mockFetch([{ content: { parts: [{ text: "raw" }] } }]);
    await callGemini({ messages: [{ role: "user", text: "hi" }], responseJson: true });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toBeUndefined();
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });
});

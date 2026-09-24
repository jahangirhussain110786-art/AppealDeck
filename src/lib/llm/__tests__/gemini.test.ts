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
    // Typed with fetch's own parameters, so `mock.calls[0][1]` is the request init it received.
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ candidates }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
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

describe("per-task model selection", () => {
  const savedEnv: Record<string, string | undefined> = {};
  const KEYS = ["GEMINI_MODEL", "GEMINI_MODEL_READ_DOCUMENT", "GEMINI_MODEL_IMPROVE_WORDING"];

  afterEach(() => {
    for (const k of KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    vi.restoreAllMocks();
  });

  it("returns the per-task default when no env override is set", () => {
    for (const k of KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    expect(getGeminiModel("read-document")).toBe("gemini-3.5-flash");
    expect(getGeminiModel("improve-wording")).toBe("gemini-3.5-flash");
    expect(getGeminiModel()).toBe("gemini-3.5-flash");
  });

  it("lets GEMINI_MODEL_<TASK> override the per-task default", () => {
    for (const k of KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    process.env.GEMINI_MODEL_READ_DOCUMENT = "gemini-3.5-flash-lite";
    expect(getGeminiModel("read-document")).toBe("gemini-3.5-flash-lite");
    // An override for one task leaves the others on their defaults.
    expect(getGeminiModel("improve-wording")).toBe("gemini-3.5-flash");
  });

  it("ignores empty-string env overrides", () => {
    for (const k of KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    process.env.GEMINI_MODEL_READ_DOCUMENT = "   ";
    expect(getGeminiModel("read-document")).toBe("gemini-3.5-flash");
  });

  it("explicit model in callGemini wins over the task default", async () => {
    for (const k of KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const result = await callGemini({
      task: "read-document",
      model: "gemini-3.5-flash-lite",
      messages: [{ role: "user", text: "hi" }],
    });
    expect(result.ok).toBe(true);
    const url = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(url).toContain("/models/gemini-3.5-flash-lite:");
  });
});

/**
 * B-15 (24 Sep 2026): no code can tell a free-tier key from a paid one, so production refuses every
 * Gemini call until the founder confirms the paid tier in writing.
 */
describe("the paid-tier switch", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("switches Gemini off in production until the paid tier is confirmed", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED", "");
    expect(isGeminiConfigured()).toBe(false);
    vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED", "true");
    expect(isGeminiConfigured()).toBe(true);
  });

  it("does not need the confirmation outside production", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GEMINI_PAID_TIER_CONFIRMED", "");
    expect(isGeminiConfigured()).toBe(true);
  });
});

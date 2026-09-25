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

/**
 * 25 Sep 2026: a real document check got Google's 503 "high demand" and failed the seller on the
 * first try. A "not now" answer is retried inside the task's budget; if Google stays busy, the
 * result says so, so the seller is told to try again rather than that their document failed.
 */
describe("callGemini retries Google's 'not now' answers", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function respond(statuses: number[]) {
    const fetchMock = vi.fn(async () => {
      const status = statuses.shift() ?? 200;
      return status === 200
        ? {
            ok: true,
            status,
            json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
          }
        : { ok: false, status, text: async () => '{"error":{"message":"high demand"}}' };
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  }

  async function run() {
    vi.useFakeTimers();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const pending = callGemini({ task: "read-document", messages: [{ role: "user", text: "hi" }] });
    await vi.runAllTimersAsync();
    return pending;
  }

  it("succeeds when Google is busy once and then answers", async () => {
    const fetchMock = respond([503]);
    const result = await run();
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports 'busy' when Google stays busy, after a bounded number of tries", async () => {
    const fetchMock = respond([503, 503, 503, 503]);
    const result = await run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("busy");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry or call it 'busy' when the project's quota is used up", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      text: async () =>
        '{"error":{"message":"You exceeded your current quota, please check your plan and billing details."}}',
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const result = await run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("upstream_error");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry an answer that will not change, such as a bad request", async () => {
    const fetchMock = respond([400]);
    const result = await run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("upstream_error");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /** 25 Sep 2026: schema-constrained requests hung while plain JSON mode answered in seconds. */
  it("falls back to plain JSON mode, with the schema in the instructions, when schema mode stalls", async () => {
    const fetchMock = respond([503, 503, 503]);
    vi.useFakeTimers();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const schema = { type: "object", properties: { text: { type: "string" } } };
    const pending = callGemini({
      task: "read-document",
      messages: [{ role: "user", text: "hi" }],
      responseJsonSchema: schema,
    });
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const calls = fetchMock.mock.calls as unknown as Array<[unknown, RequestInit]>;
    const first = JSON.parse(calls[0]![1].body as string);
    const last = JSON.parse(calls[3]![1].body as string);
    expect(first.generationConfig.responseSchema).toEqual(schema);
    expect(last.generationConfig.responseSchema).toBeUndefined();
    expect(last.generationConfig.responseMimeType).toBe("application/json");
    expect(last.systemInstruction.parts[0].text).toContain(JSON.stringify(schema));
  });
});

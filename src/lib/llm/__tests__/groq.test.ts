import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callLlm, isAiConfigured, withAiBreaker } from "../ai";
import { callGroq, isGroqConfigured } from "../groq";
import { runWithDevUsage } from "@/lib/devUsage";
import { NextRequest } from "next/server";

const budget = vi.hoisted(() => ({ reserve: vi.fn() }));
vi.mock("@/lib/breaker", async (original) => ({
  ...(await original<typeof import("@/lib/breaker")>()),
  reserveSpend: budget.reserve,
}));

const request = {
  task: "classify-notice" as const,
  messages: [{ role: "user" as const, text: "Synthetic notice" }],
  responseJsonSchema: {
    type: "object",
    properties: { kind: { type: "string" } },
    required: ["kind"],
  },
};
const success = () =>
  Response.json({
    choices: [{ finish_reason: "stop", message: { content: '{"kind":"NONE"}' } }],
    usage: { prompt_tokens: 30, completion_tokens: 12 },
  });

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("GEMINI_API_KEY", "google-test");
  vi.stubEnv("GROQ_API_KEY", "groq-test");
  vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-120b");
  budget.reserve.mockReset().mockResolvedValue({ ok: true });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Groq local text fallback", () => {
  it.each([429, 503, 401, 403, 404])("falls back immediately on Gemini HTTP %i", async (status) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Provider unavailable", { status }))
      .mockResolvedValueOnce(success());
    vi.stubGlobal("fetch", fetchMock);
    expect(await callLlm(request)).toMatchObject({
      ok: true,
      model: "groq:openai/gpt-oss-120b",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(init.body);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].content).toContain('"required":["kind"]');
    expect(body.generationConfig).toBeUndefined();
  });

  it("uses a separate budget when the Gemini daily allowance is exhausted", async () => {
    budget.reserve.mockImplementation(async (options) => ({ ok: options.name === "groq" }));
    const fetchMock = vi.fn().mockResolvedValue(success());
    vi.stubGlobal("fetch", fetchMock);
    expect((await callLlm(request)).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(budget.reserve.mock.calls.map(([options]) => options.name)).toEqual(["gemini", "groq"]);
  });

  it("works with only a Groq key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(success()));
    expect(isAiConfigured()).toBe(true);
    expect((await callLlm(request)).ok).toBe(true);
  });

  it("keeps successful Gemini calls on Gemini", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ candidates: [{ content: { parts: [{ text: "google answer" }] } }] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await callLlm(request)).toMatchObject({ ok: true, text: "google answer" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never sends uploaded files or document-reading prompts to Groq", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await callLlm({ ...request, task: "read-document" })).ok).toBe(false);
    expect(
      (
        await callLlm({
          ...request,
          messages: [
            {
              role: "user",
              text: "doc",
              documents: [{ mimeType: "application/pdf", data: "AAAA" }],
            },
          ],
        })
      ).ok,
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not forward an input Google refused", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Invalid input", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await callLlm(request)).toMatchObject({ ok: false, reason: "bad_input" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to Groq when Google rejects the key itself (HTTP 400 API_KEY_INVALID)", async () => {
    const fetchMock = vi.fn(async (url: unknown) =>
      String(url).includes("groq.com")
        ? success()
        : new Response('{"error":{"status":"INVALID_ARGUMENT","message":"API key not valid."}}', {
            status: 400,
          }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await callLlm(request)).toMatchObject({
      ok: true,
      model: "groq:openai/gpt-oss-120b",
    });
  });

  it("writes plain hyphens and spaces in place of the model's non-breaking ones", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ finish_reason: "stop", message: { content: "drop‑box at 9 am" } }],
        }),
      ),
    );
    expect(await callGroq(request)).toMatchObject({ ok: true, text: "drop-box at 9 am" });
  });

  it("asks the second Groq model once on a limit, never the same one twice, and never echoes bodies or credentials", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("groq-test sensitive text", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await callGroq(request);
    expect(result).toEqual({ ok: false, reason: "busy", message: "Groq returned HTTP 429." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const models = fetchMock.mock.calls.map((c) => JSON.parse(String(c[1]?.body)).model);
    expect(new Set(models).size).toBe(2);
  });

  it("answers from the second Groq model when the first is rate limited", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("limit", { status: 429 }))
      .mockResolvedValueOnce(success());
    vi.stubGlobal("fetch", fetchMock);
    expect(await callGroq(request)).toMatchObject({
      ok: true,
      model: "groq:llama-3.3-70b-versatile",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).reasoning_effort).toBeUndefined();
  });

  it("stays inside the caller's deadline instead of giving each Groq model a full timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(
        (_url: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
            );
          }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const pending = callGroq({ ...request, deadline: Date.now() + 2_000 });
      await vi.runAllTimersAsync();
      const result = await pending;
      expect(result).toMatchObject({ ok: false, reason: "timeout" });
      // The second model is not started: the caller's budget was spent on the first.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("sends nothing, and reserves nothing, once the caller's deadline has passed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await callGroq({ ...request, deadline: Date.now() - 1 })).toMatchObject({
      ok: false,
      reason: "timeout",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(budget.reserve).not.toHaveBeenCalled();
  });

  it("is switched on in production only by the confirmation switch", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROQ_PRODUCTION_CONFIRMED", "");
    expect(isGroqConfigured()).toBe(false);
    vi.stubEnv("GROQ_PRODUCTION_CONFIRMED", "true");
    expect(isGroqConfigured()).toBe(true);
  });

  it("rejects truncated answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ finish_reason: "length", message: { content: "partial" } }],
        }),
      ),
    );
    expect(await callGroq(request)).toMatchObject({ ok: false, reason: "invalid_response" });
  });

  it("does not enable the local fallback in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn());
    expect(isAiConfigured()).toBe(false);
    expect((await callLlm(request)).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("bypasses both provider budgets only inside a verified local dev context", async () => {
    vi.stubEnv("DEV_LOGIN_EMAIL", "dev@example.test");
    vi.stubEnv("DEV_UNLIMITED_USAGE", "true");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("Quota", { status: 429 }))
        .mockResolvedValueOnce(success()),
    );
    const result = await runWithDevUsage({ id: "dev", email: "dev@example.test" }, () =>
      callLlm(request),
    );
    expect(result.ok).toBe(true);
    expect(budget.reserve).not.toHaveBeenCalled();
  });

  it("retains the production door breaker", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    vi.stubEnv("DEV_UNLIMITED_USAGE", "false");
    const req = new NextRequest("http://localhost/api/improve-wording");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    expect((await withAiBreaker(handler)(req, { fingerprint: "x", now: 0 })).status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });
});

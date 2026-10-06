import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reserveSpendMock = vi.fn();

vi.mock("@/lib/breaker", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/breaker")>();
  return { ...actual, reserveSpend: (...args: unknown[]) => reserveSpendMock(...args) };
});

import { callGemini } from "../gemini";

/** 6 Oct 2026: one callGemini can send up to five paid requests; each must be counted. */
describe("callGemini spend accounting", () => {
  const originalFetch = globalThis.fetch;
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    reserveSpendMock.mockReset();
    reserveSpendMock.mockResolvedValue({ ok: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...saved };
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reserves once per outbound request, including retries", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => "high demand",
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const promise = callGemini({ messages: [{ role: "user", text: "hi" }] });
    await vi.runAllTimersAsync();
    await promise;
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect(reserveSpendMock).toHaveBeenCalledTimes(fetchMock.mock.calls.length);
  });

  it("sends nothing further once the cap refuses a retry", async () => {
    vi.useFakeTimers();
    reserveSpendMock.mockResolvedValueOnce({ ok: true }).mockResolvedValue({
      ok: false,
      resetAt: 0,
      used: 241,
      cap: 240,
    });
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => "high demand",
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const promise = callGemini({ messages: [{ role: "user", text: "hi" }] });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
  });

  it("counts a single successful request once", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
    })) as unknown as typeof fetch;
    await callGemini({ messages: [{ role: "user", text: "hi" }] });
    expect(reserveSpendMock).toHaveBeenCalledTimes(1);
  });
});

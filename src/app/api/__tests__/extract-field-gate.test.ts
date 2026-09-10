import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const rateLimitExtractFieldMock = vi.fn();
const callGeminiMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitExtractField: (...args: unknown[]) => rateLimitExtractFieldMock(...args),
  tooManyRequestsResponse: () =>
    new Response(
      JSON.stringify({ error: "Too many requests. Please slow down and try again in a minute." }),
      { status: 429 },
    ),
}));

vi.mock("@/lib/llm/gemini", () => ({
  callGemini: (...args: unknown[]) => callGeminiMock(...args),
  withGeminiBreaker: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

import { POST } from "../extract-field/route";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/extract-field", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  rateLimitExtractFieldMock.mockReset();
  callGeminiMock.mockReset();
});

describe("/api/extract-field auth + rate-limit gates", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(makeReq({ stepId: "s1", text: "any text" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when the per-user daily cap is hit", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    rateLimitExtractFieldMock.mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 1000,
    });
    const res = await POST(makeReq({ stepId: "s1", text: "any text" }));
    expect(res.status).toBe(429);
  });

  it("returns 200 for a signed-in user under the cap (no license required)", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    rateLimitExtractFieldMock.mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 1000,
    });
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: '{"suggestedKind":"POLICY","suggestedSeverity":"high","suggestedTimelineSummary":"x"}',
    });
    const res = await POST(makeReq({ stepId: "s1", text: "any text" }));
    expect(res.status).toBe(200);
  });
});

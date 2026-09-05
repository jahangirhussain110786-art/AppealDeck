import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const callGeminiMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  isLicenseActive: (email: string) => isLicenseActiveMock(email),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitInterview: () =>
    Promise.resolve({ success: true, limit: 60, remaining: 60, reset: Date.now() + 60_000 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));

vi.mock("@/lib/llm/gemini", () => ({
  callGemini: (...args: unknown[]) => callGeminiMock(...args),
  withGeminiBreaker: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

import { POST } from "../interview/route";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
});

describe("/api/interview license + auth gates", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(makeReq({ action: "start", kind: "POLICY" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but no active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await POST(makeReq({ action: "start", kind: "POLICY" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Appeal Pass required.");
  });

  it("returns 200 when authenticated with active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await POST(makeReq({ action: "start", kind: "POLICY" }));
    expect(res.status).toBe(200);
  });
});

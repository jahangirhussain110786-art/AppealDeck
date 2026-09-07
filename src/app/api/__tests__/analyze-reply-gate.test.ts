import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const analyzeReplyMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
}));

vi.mock("@/lib/license", () => ({
  isLicenseActive: (email: string) => isLicenseActiveMock(email),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitAnalyzeReply: () =>
    Promise.resolve({
      success: true,
      limit: 60,
      remaining: 60,
      reset: Date.now() + 60_000,
    }),
  tooManyRequestsResponse: () =>
    new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 }),
}));

vi.mock("@/core", () => ({
  analyzeReply: (...args: unknown[]) => analyzeReplyMock(...args),
}));

import { POST } from "../analyze-reply/route";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/analyze-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function resetMocks() {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
  analyzeReplyMock.mockReset();
}

describe("/api/analyze-reply auth + license gates", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    resetMocks();
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(makeReq({ reply: "Amazon requires docs." }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but no active license", async () => {
    resetMocks();
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await POST(makeReq({ reply: "Amazon requires docs." }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Appeal Pass required.");
  });

  it("returns 200 with analysis when authenticated and licensed", async () => {
    resetMocks();
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    analyzeReplyMock.mockReturnValue({
      category: "reinstated",
      extractedAsks: ["supplier_invoice"],
      confidence: "rule",
    });
    const res = await POST(makeReq({ reply: "Amazon requires docs." }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe("reinstated");
    expect(body.extractedAsks).toEqual(["supplier_invoice"]);
    expect(body.confidence).toBe("rule");
  });
});

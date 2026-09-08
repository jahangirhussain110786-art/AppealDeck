import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const rateLimitComposeMock = vi.fn();
const recordActivationMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  isLicenseActive: (email: string) => isLicenseActiveMock(email),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: () =>
    Promise.resolve({ success: true, limit: 30, remaining: 30, reset: Date.now() + 60_000 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: null,
}));

vi.mock("@/core", () => ({
  composePoa: () => ({
    docType: "PLAN_OF_ACTION",
    mode: { mode: "full-draft", reason: "fully-backed" },
    sections: [{ heading: "Root Cause", body: "[Root cause statement]" }],
    watermark: undefined,
    metadata: { kind: "POLICY", attemptNumber: 1, evidenceComplete: true },
  }),
  critiquePoa: () => ({ findings: [], passed: true }),
  renderPoaText: () => "test draft",
}));

vi.mock("@/lib/devices", () => ({
  recordActivation: (...args: unknown[]) => recordActivationMock(...args),
  deviceErrorResponse: (result: { message: string }) =>
    new Response(JSON.stringify({ error: result.message }), { status: 403 }),
  deriveFingerprintFromRequest: () => "fp",
}));

import { POST } from "../compose/route";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
  rateLimitComposeMock.mockReset();
  recordActivationMock.mockReset();
});

describe("/api/compose license + auth gates", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but no active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Appeal Pass required.");
  });

  it("returns 200 when authenticated with active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    expect(res.status).toBe(200);
  });
});

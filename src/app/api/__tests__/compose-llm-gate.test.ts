import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const isGeminiConfiguredMock = vi.fn();
const checkBreakerMock = vi.fn();
const recordBreakerMock = vi.fn();
const composePoaWithLlmMock = vi.fn();

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

vi.mock("@/lib/devices", () => ({
  recordActivation: () => Promise.resolve({ status: "ok" }),
  deviceErrorResponse: (result: { message: string }) =>
    new Response(JSON.stringify({ error: result.message }), { status: 403 }),
  deriveFingerprintFromRequest: () => "device-fp",
}));

vi.mock("@/core", () => ({
  composePoa: () => ({
    docType: "poa",
    mode: { mode: "full-draft", reason: "fully-backed" },
    sections: [
      { heading: "Root Cause", body: "Seller's own verbatim words." },
      { heading: "Corrective Actions", body: "- [Completed] Something" },
      { heading: "Preventive Measures", body: "Seller's own preventive text." },
    ],
    watermark: undefined,
    metadata: { kind: "POLICY", attemptNumber: 1, evidenceComplete: true, aiDrafted: false },
  }),
  critiquePoa: () => ({ findings: [], passed: true }),
  renderPoaText: () => "test draft",
}));

vi.mock("@/lib/llm/gemini", () => ({
  isGeminiConfigured: () => isGeminiConfiguredMock(),
  composeBreakerOptions: { name: "gemini-compose" },
}));

vi.mock("@/lib/breaker", () => ({
  checkBreaker: (...args: unknown[]) => checkBreakerMock(...args),
  recordBreaker: (...args: unknown[]) => recordBreakerMock(...args),
  fingerprintForRequest: () => "breaker-fp",
}));

vi.mock("@/lib/llm/composePoaLlm", () => ({
  composePoaWithLlm: (...args: unknown[]) => composePoaWithLlmMock(...args),
  applyLlmSections: (draft: any, _data: unknown, sections: { rootCause: string }) => ({
    ...draft,
    sections: draft.sections.map((s: { heading: string; body: string }) =>
      s.heading === "Root Cause" ? { ...s, body: sections.rootCause, source: "ai" } : s,
    ),
    metadata: { ...draft.metadata, aiDrafted: true },
  }),
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
  isGeminiConfiguredMock.mockReset();
  checkBreakerMock.mockReset();
  recordBreakerMock.mockReset();
  composePoaWithLlmMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  isLicenseActiveMock.mockResolvedValue(true);
});

describe("/api/compose AI-drafted path", () => {
  it("keeps the deterministic draft when Gemini is not configured", async () => {
    isGeminiConfiguredMock.mockReturnValue(false);
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    const body = await res.json();
    expect(body.draft.metadata.aiDrafted).toBe(false);
    expect(checkBreakerMock).not.toHaveBeenCalled();
  });

  it("keeps the deterministic draft when the breaker does not allow the call", async () => {
    isGeminiConfiguredMock.mockReturnValue(true);
    checkBreakerMock.mockResolvedValue({ allowed: false, reason: "spend_cap", resetAt: 0 });
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    const body = await res.json();
    expect(body.draft.metadata.aiDrafted).toBe(false);
    expect(composePoaWithLlmMock).not.toHaveBeenCalled();
  });

  it("keeps the deterministic draft when the LLM call is not ok", async () => {
    isGeminiConfiguredMock.mockReturnValue(true);
    checkBreakerMock.mockResolvedValue({
      allowed: true,
      context: { fingerprint: "breaker-fp", now: Date.now() },
    });
    composePoaWithLlmMock.mockResolvedValue({ ok: false, reason: "narrative_insufficient" });
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    const body = await res.json();
    expect(body.draft.metadata.aiDrafted).toBe(false);
    expect(recordBreakerMock).toHaveBeenCalled();
  });

  it("applies the AI-drafted sections when everything allows it", async () => {
    isGeminiConfiguredMock.mockReturnValue(true);
    checkBreakerMock.mockResolvedValue({
      allowed: true,
      context: { fingerprint: "breaker-fp", now: Date.now() },
    });
    composePoaWithLlmMock.mockResolvedValue({
      ok: true,
      sections: { rootCause: "A professionally drafted paragraph." },
    });
    const res = await POST(makeReq({ caseData: { kind: "POLICY" }, attemptNumber: 1 }));
    const body = await res.json();
    expect(body.draft.metadata.aiDrafted).toBe(true);
    const rootCause = body.draft.sections.find(
      (s: { heading: string }) => s.heading === "Root Cause",
    );
    expect(rootCause.body).toBe("A professionally drafted paragraph.");
    expect(rootCause.source).toBe("ai");
  });
});

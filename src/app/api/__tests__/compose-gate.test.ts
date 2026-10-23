import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const claimSingleMock = vi.fn();
const rateLimitComposeMock = vi.fn();
const recordActivationMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  claimCasePass: () => Promise.resolve(true),
  claimSingleResponse: (...args: unknown[]) => claimSingleMock(...args),
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
  isSeverityGated: (kind: string) => kind === "INAUTHENTIC_DOCUMENTS",
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
import { newWorkspace } from "@/core/workspace";
import { documentWorkspace } from "@/core/workspace.fixture";

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
  claimSingleMock.mockReset();
  claimSingleMock.mockResolvedValue(false);
  rateLimitComposeMock.mockReset();
  recordActivationMock.mockReset();
});

describe("/api/compose license + auth gates", () => {
  it("rejects a forged workspace route before claiming a pass", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    const res = await POST(
      makeReq({
        caseData: {
          id: "case",
          kind: "UNKNOWN",
          workspace: {
            ...newWorkspace(),
            // AA-39: was a related-account notice, which only counted as "forged" because D6's
            // gate had drifted to send every related-account case to "specialist". Once that was
            // narrowed to what D6 actually names, this notice routed to "documents" legitimately
            // and the test began failing at the license check (403) instead of the route check —
            // which would have been "fixed" by flipping the expectation, deleting the guarantee
            // that route validation runs BEFORE the pass is claimed. Rebuilt as a real mismatch.
            notice: "Please submit a Plan of Action explaining the root cause.",
            formInstructions: "Corrective actions and prevention",
            confirmed: true,
            protocol: "documents",
          },
        },
      }),
    );
    expect(res.status).toBe(422);
    expect(isLicenseActiveMock).not.toHaveBeenCalled();
  });
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(
      makeReq({ caseData: { id: "test-case", kind: "POLICY" }, attemptNumber: 1 }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but no active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await POST(
      makeReq({ caseData: { id: "test-case", kind: "POLICY" }, attemptNumber: 1 }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Appeal Pass required.");
  });

  it("returns 200 when authenticated with active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await POST(
      makeReq({ caseData: { id: "test-case", kind: "POLICY" }, attemptNumber: 1 }),
    );
    expect(res.status).toBe(200);
  });
});

describe("/api/compose failure handling (6 Oct 2026)", () => {
  it("answers 503 when the entitlement lookup fails", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockRejectedValue(new Error("License lookup unavailable"));
    const res = await POST(
      makeReq({ caseData: { id: "test-case", kind: "POLICY" }, attemptNumber: 1 }),
    );
    expect(res.status).toBe(503);
  });
});

describe("/api/compose for a One Response (23 Oct 2026): the first response of one case, and no more", () => {
  const post = (attemptNumber: number, workspace?: unknown) =>
    POST(
      makeReq({
        caseData: { id: "test-case", kind: "POLICY", ...(workspace ? { workspace } : {}) },
        attemptNumber,
      }),
    );

  beforeEach(() => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    claimSingleMock.mockResolvedValue(true);
  });

  it("prepares the first response, although the account holds no Appeal Pass", async () => {
    const res = await post(1);
    expect(res.status).toBe(200);
    expect(claimSingleMock).toHaveBeenCalledWith("u1", "test-case");
  });

  it("refuses the next response, and says it is the Appeal Pass's", async () => {
    const res = await post(2);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("single_response_used");
    expect(body.error).toMatch(/Appeal Pass/);
  });

  it("refuses the next response when the client claims round one but Amazon has replied", async () => {
    const res = await post(1, {
      ...documentWorkspace(),
      replies: [{ id: "r1", at: "2026-10-01T00:00:00Z", text: "We need more.", applied: true }],
    });
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("single_response_used");
  });

  it("refuses the next response when one was recorded as sent here, but not one sent before", async () => {
    const sent = {
      id: "s1",
      at: "2026-10-01T00:00:00Z",
      revision: 1,
      protocol: "documents" as const,
      text: "x",
      receipt: "",
      attachments: [],
      unresolved: [],
    };
    const second = await post(1, { ...documentWorkspace(), submissions: [sent] });
    expect(second.status).toBe(403);
    const prior = await post(1, {
      ...documentWorkspace(),
      submissions: [{ ...sent, id: "p1", revision: 0, source: "prior" }],
    });
    expect(prior.status).toBe(200);
  });

  it("does not let a One Response on another case through", async () => {
    claimSingleMock.mockResolvedValue(false);
    const res = await post(1);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("case_pass_required");
  });

  it("does not limit a seller who holds the Appeal Pass for the case", async () => {
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await post(7);
    expect(res.status).toBe(200);
    expect(claimSingleMock).not.toHaveBeenCalled();
  });
});

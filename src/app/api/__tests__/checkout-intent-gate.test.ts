import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const rateLimitComposeMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: () => rateLimitComposeMock(),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => insertMock(),
        }),
      }),
    }),
  },
}));

process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS = "pri_test123";

import { POST } from "../checkout/intent/route";
import { newWorkspace } from "@/core/workspace";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/checkout/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  rateLimitComposeMock.mockReset();
  rateLimitComposeMock.mockResolvedValue({
    success: true,
    limit: 30,
    remaining: 30,
    reset: Date.now() + 60_000,
  });
  insertMock.mockReset();
  insertMock.mockResolvedValue({ data: { id: "intent-1" }, error: null });
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
});

describe("/api/checkout/intent eligibility gate", () => {
  it("returns 401 when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a severity-gated kind, before ever touching the workspace", async () => {
    const res = await POST(makeReq({ caseId: "c1", kind: "INAUTHENTIC_DOCUMENTS", consent: true }));
    expect(res.status).toBe(403);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows a checkout intent with no workspace attached (legacy case)", async () => {
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ intentId: "intent-1", priceId: "pri_test123" });
  });

  it("rejects a workspace whose route cannot be drafted, before creating a checkout intent", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Your response remains under review. No additional information is required.",
      formInstructions: "No action requested.",
      confirmed: true,
      protocol: "information" as const,
    };
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true, workspace: w }));
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a forged protocol the same way /api/compose does", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Your account is linked to another account. Please submit the records.",
      formInstructions: "Upload documents",
      confirmed: true,
      protocol: "documents" as const,
    };
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true, workspace: w }));
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows a workspace whose confirmed route can be drafted", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Please provide the supplier invoice for the affected product.",
      formInstructions: "Upload the invoice.",
      confirmed: true,
      protocol: "documents" as const,
    };
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true, workspace: w }));
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

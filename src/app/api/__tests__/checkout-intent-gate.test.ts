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

const fetchLicenseMock = vi.fn();
vi.mock("@/lib/license", () => ({
  fetchLicenseForUser: (...args: unknown[]) => fetchLicenseMock(...args),
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
  fetchLicenseMock.mockReset();
  fetchLicenseMock.mockResolvedValue({ status: "none", plan: null, licenseKey: null });
});

describe("/api/checkout/intent double-purchase guard", () => {
  it("refuses a second checkout for a case that already has an active Pass", async () => {
    fetchLicenseMock.mockResolvedValue({
      status: "active",
      plan: "appeal_pass",
      licenseKey: "AD-1",
    });
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true }));
    expect(res.status).toBe(409);
    expect(fetchLicenseMock).toHaveBeenCalledWith("u1", "c1");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows checkout again once the earlier Pass was refunded", async () => {
    fetchLicenseMock.mockResolvedValue({
      status: "canceled",
      plan: "appeal_pass",
      licenseKey: "AD-1",
    });
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true }));
    expect(res.status).toBe(200);
  });

  it("does not open a checkout when the licence lookup fails", async () => {
    fetchLicenseMock.mockRejectedValue(new Error("License lookup unavailable"));
    const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true }));
    expect(res.status).toBe(503);
    expect(insertMock).not.toHaveBeenCalled();
  });
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

  // AA-39 note: this test previously used a related-account notice, which routed to "specialist"
  // and so mismatched the claimed "documents". Once D6's gate was narrowed to what D6 actually
  // names, that notice began routing to "documents" legitimately and the scenario stopped being a
  // forgery at all — the assertion would have been "fixed" by flipping it to 200, silently gutting
  // the check. It is rebuilt here as a real mismatch instead: the notice unambiguously asks for a
  // Plan of Action while the caller claims a document response. The routed protocol is composable,
  // so this isolates the forgery check rather than re-testing composability (covered above).
  it("rejects a forged protocol the same way /api/compose does", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Please submit a Plan of Action explaining the root cause.",
      formInstructions: "Corrective actions and prevention",
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

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const claimSingleMock = vi.fn();
const rateLimitComposeMock = vi.fn();
const recordActivationMock = vi.fn();
const recordRoundMock = vi.fn();

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

// The server's own high-water mark for a case's response round (migration 0025). The real module
// needs a database; by default this behaves as a store that has only ever seen the posted round.
vi.mock("@/lib/caseRounds", () => ({
  recordCaseRound: (...args: unknown[]) => recordRoundMock(...args),
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
import { composeRequestBody } from "@/lib/composeRequest";
import { documentWorkspace } from "@/core/workspace.fixture";
import type { Workspace } from "@/core/workspace";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

/**
 * Every body here is built by `composeRequestBody`, the function the browser calls, so a test can
 * only pass by agreeing with what the seller's device actually posts — the round facts are read
 * from the full workspace before it is trimmed, exactly as at `/api/compose` in real use.
 */
const postWorkspace = (workspace: Workspace) =>
  POST(
    makeReq(composeRequestBody({ id: "test-case", kind: "POLICY" as const, workspace }, workspace)),
  );

const SENT = {
  id: "s1",
  at: "2026-10-01T00:00:00Z",
  revision: 1,
  protocol: "documents" as const,
  text: "x",
  receipt: "",
  attachments: [],
  unresolved: [],
};

beforeEach(() => {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
  claimSingleMock.mockReset();
  claimSingleMock.mockResolvedValue(false);
  rateLimitComposeMock.mockReset();
  recordActivationMock.mockReset();
  recordRoundMock.mockReset();
  recordRoundMock.mockImplementation((_user: string, _case: string, round: number) =>
    Promise.resolve(round),
  );
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
            ...documentWorkspace(),
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
        round: { sentHere: 0, repliesReceived: 0 },
      }),
    );
    expect(res.status).toBe(422);
    expect(isLicenseActiveMock).not.toHaveBeenCalled();
  });
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(
      makeReq({
        caseData: { id: "test-case", kind: "POLICY" },
        round: { sentHere: 0, repliesReceived: 0 },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated but no active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await POST(
      makeReq({
        caseData: { id: "test-case", kind: "POLICY" },
        round: { sentHere: 0, repliesReceived: 0 },
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Appeal Pass required.");
  });

  it("returns 200 when authenticated with active license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await POST(
      makeReq({
        caseData: { id: "test-case", kind: "POLICY" },
        round: { sentHere: 0, repliesReceived: 0 },
      }),
    );
    expect(res.status).toBe(200);
  });

  // 26 Oct 2026: the round is a required part of the contract. A request that omits it would have
  // its round guessed from the trimmed workspace, which no longer shows an applied reply.
  it("refuses a request that does not say which round it is", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await POST(makeReq({ caseData: { id: "test-case", kind: "POLICY" } }));
    expect(res.status).toBe(400);
  });
});

describe("/api/compose failure handling (6 Oct 2026)", () => {
  it("answers 503 when the entitlement lookup fails", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockRejectedValue(new Error("License lookup unavailable"));
    const res = await POST(
      makeReq({
        caseData: { id: "test-case", kind: "POLICY" },
        round: { sentHere: 0, repliesReceived: 0 },
      }),
    );
    expect(res.status).toBe(503);
  });
});

describe("/api/compose for a One Response (23 Oct 2026): the first response of one case, and no more", () => {
  const post = (workspace: Workspace) => postWorkspace(workspace);

  beforeEach(() => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    isLicenseActiveMock.mockResolvedValue(false);
    claimSingleMock.mockResolvedValue(true);
  });

  it("prepares the first response, although the account holds no Appeal Pass", async () => {
    const res = await post(documentWorkspace());
    expect(res.status).toBe(200);
    expect(claimSingleMock).toHaveBeenCalledWith("u1", "test-case");
  });

  it("refuses the next response, and says it is the Appeal Pass's", async () => {
    const res = await post({ ...documentWorkspace(), submissions: [SENT] });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("single_response_used");
    expect(body.error).toMatch(/Appeal Pass/);
  });

  /*
    26 Oct 2026: an attempt the seller made before AppealDeck is not a round. The letter says
    "attempt 2" (that is what it is), while the One Response still covers the first response
    prepared here — the old client derived its `attemptNumber` from every submission, so this
    seller was refused the plan they had bought.
  */
  it("counts a response that predates AppealDeck as attempt two, not round two", async () => {
    const body = composeRequestBody(
      {
        id: "test-case",
        kind: "POLICY" as const,
        workspace: documentWorkspace(),
      },
      {
        ...documentWorkspace(),
        submissions: [{ ...SENT, id: "p1", revision: 0, source: "prior" as const }],
      },
    );
    expect(body.attempt).toBe(2);
    expect(body.round).toEqual({ sentHere: 0, repliesReceived: 0 });
    const res = await POST(makeReq(body));
    expect(res.status).toBe(200);
  });

  /*
    26 Oct 2026: a reply the seller has already applied leaves `replies` when the workspace is
    trimmed for posting, so the trimmed copy cannot say the case has been answered. The fact now
    travels separately, read before the trim.
  */
  it("refuses the next response when Amazon has replied and the seller applied the reply", async () => {
    const applied = {
      ...documentWorkspace(),
      replies: [{ id: "r1", at: "2026-10-01T00:00:00Z", text: "We need more.", applied: true }],
    };
    const body = composeRequestBody(
      { id: "test-case", kind: "POLICY" as const, workspace: applied },
      applied,
    );
    expect(body.caseData.workspace?.replies).toEqual([]);
    const res = await POST(makeReq(body));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("single_response_used");
  });

  // 26 Oct 2026: the workspace is the seller's to reset, so the server keeps its own high-water
  // mark for the case and refuses when either says the case has moved past its first response.
  it("refuses round one when the server has already recorded a later round", async () => {
    recordRoundMock.mockResolvedValue(2);
    const res = await post(documentWorkspace());
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("single_response_used");
  });

  it("records the round it refused, so a reset case cannot present it as round one", async () => {
    const res = await post({
      ...documentWorkspace(),
      submissions: [SENT, { ...SENT, id: "s2", revision: 2 }],
    });
    expect(res.status).toBe(403);
    expect(recordRoundMock).toHaveBeenCalledWith("u1", "test-case", 3);
  });

  it("does not let a One Response on another case through", async () => {
    claimSingleMock.mockResolvedValue(false);
    const res = await post(documentWorkspace());
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("case_pass_required");
  });

  it("does not limit a seller who holds the Appeal Pass for the case, and still records the round", async () => {
    isLicenseActiveMock.mockResolvedValue(true);
    const res = await post({ ...documentWorkspace(), submissions: [SENT] });
    expect(res.status).toBe(200);
    expect(claimSingleMock).not.toHaveBeenCalled();
    expect(recordRoundMock).toHaveBeenCalledWith("u1", "test-case", 2);
  });
});

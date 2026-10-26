import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const rateLimitComposeMock = vi.fn();
const insertMock = vi.fn();
const recentIntentMock = vi.fn();

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
      // The "reuse a recent unpaid intent" lookup: .select().eq()...maybeSingle()
      select: () => {
        const chain: Record<string, unknown> = {};
        for (const m of ["eq", "is", "gt", "order", "limit"]) chain[m] = () => chain;
        chain.maybeSingle = () => recentIntentMock();
        return chain;
      },
      insert: () => ({
        select: () => ({
          single: () => insertMock(),
        }),
      }),
    }),
  },
}));

const fetchLicenseMock = vi.fn();
// The real pure helpers (the renewal window) stay; only what reads the database is replaced.
vi.mock("@/lib/license", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/license")>()),
  fetchLicenseForUser: (...args: unknown[]) => fetchLicenseMock(...args),
  fetchDocumentReview: () => Promise.resolve(false),
  fetchAccountCover: () => Promise.resolve(null),
  fetchProStatus: () =>
    Promise.resolve({ verified: false, creditsLeft: 0, creditsEndAt: null, proPlanActive: false }),
}));

process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS = "pri_test123";

import { POST } from "../checkout/intent/route";
import { newWorkspace } from "@/core/workspace";
import { checkoutEligibility } from "@/lib/checkoutRequest";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/checkout/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

/** A case whose confirmed route can be drafted, as the browser sends it with every response plan. */
const composable = () => ({
  ...newWorkspace(),
  notice: "Please provide the supplier invoice for the affected product.",
  formInstructions: "Upload the invoice.",
  confirmed: true,
  protocol: "documents" as const,
});

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
  recentIntentMock.mockReset();
  recentIntentMock.mockResolvedValue({ data: null, error: null });
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
    const res = await POST(
      makeReq({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        eligibility: checkoutEligibility(composable()),
      }),
    );
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
    const res = await POST(
      makeReq({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        eligibility: checkoutEligibility(composable()),
      }),
    );
    expect(res.status).toBe(200);
  });

  it("hands back a recent unpaid intent instead of opening a second one", async () => {
    recentIntentMock.mockResolvedValue({ data: { id: "intent-earlier" }, error: null });
    const res = await POST(
      makeReq({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        eligibility: checkoutEligibility(composable()),
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).intentId).toBe("intent-earlier");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("does not open a checkout when the licence lookup fails", async () => {
    fetchLicenseMock.mockRejectedValue(new Error("License lookup unavailable"));
    const res = await POST(
      makeReq({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        eligibility: checkoutEligibility(composable()),
      }),
    );
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

  // 26 Oct 2026: the workspace used to be optional here, which meant omitting it skipped the
  // composability check entirely — a seller could pay for a case that produces no response. The
  // browser always sends it (CheckoutButton), so its absence is a refusal, not a legacy allowance.
  it("refuses a response plan that omits the case facts, for every plan that pays for drafting", async () => {
    for (const plan of ["case", "single", "account"] as const) {
      const res = await POST(makeReq({ caseId: "c1", kind: "POLICY", consent: true, plan }));
      expect(res.status, plan).toBe(422);
      expect((await res.json()).error).toMatch(/needs to confirm a response can be drafted/);
    }
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a case whose route cannot be drafted, before creating a checkout intent", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Your response remains under review. No additional information is required.",
      formInstructions: "No action requested.",
      confirmed: true,
      protocol: "information" as const,
    };
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, eligibility: checkoutEligibility(w) }),
    );
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
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, eligibility: checkoutEligibility(w) }),
    );
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows a case whose confirmed route can be drafted", async () => {
    const w = {
      ...newWorkspace(),
      notice: "Please provide the supplier invoice for the affected product.",
      formInstructions: "Upload the invoice.",
      confirmed: true,
      protocol: "documents" as const,
    };
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, eligibility: checkoutEligibility(w) }),
    );
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  /*
    26 Oct 2026: D6 is refused before any money moves, with its own reason. Until now the
    composability check refused these cases under "this case does not currently need a drafted
    response", which reads as a defect in the case rather than as the one refusal this product
    makes on purpose. `/api/compose` and `planAdvice` ask the same predicate.
  */
  it("refuses a case that needs professional review, with the D6 reason", async () => {
    const w = {
      ...composable(),
      notice: "Your account was deactivated because we found you submitted forged invoices.",
    };
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, eligibility: checkoutEligibility(w) }),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("professional_review");
    expect(insertMock).not.toHaveBeenCalled();
  });

  /*
    26 Oct 2026: an unapplied reply is not part of the response route, so the case still reads as
    a clean document request — but the seller has already been accused of falsified documents and
    a drafted response is not what it needs.
  */
  it("refuses a clean case whose unapplied reply carries the allegation", async () => {
    const w = {
      ...composable(),
      replies: [
        {
          id: "r1",
          at: "2026-10-01T00:00:00Z",
          text: "The documents you provided were falsified.",
          applied: false,
        },
      ],
    };
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, eligibility: checkoutEligibility(w) }),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("professional_review");
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe("/api/checkout/intent body limits (26 Oct 2026)", () => {
  it("refuses a body too large to be a checkout", async () => {
    const res = await POST(
      makeReq({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        plan: "case",
        note: "x".repeat(9_000),
      }),
    );
    expect(res.status).toBe(413);
    expect(insertMock).not.toHaveBeenCalled();
  });

  /*
    The old shape carried the whole workspace. It is no longer read: a request that sends the case
    instead of the three facts is refused exactly as one that sends nothing, so nothing is posted
    that the server could store or log.
  */
  it("does not accept case text in place of the three facts", async () => {
    const res = await POST(
      makeReq({ caseId: "c1", kind: "POLICY", consent: true, workspace: composable() }),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/needs to confirm a response can be drafted/);
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe("/api/checkout/intent region gate (7 Oct 2026)", () => {
  const withCountry = (country: string): NextRequest =>
    new Request("http://localhost:3000/api/checkout/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vercel-ip-country": country },
      body: JSON.stringify({
        caseId: "c1",
        kind: "POLICY",
        consent: true,
        eligibility: checkoutEligibility(composable()),
      }),
    }) as unknown as NextRequest;

  it("refuses a buyer in the EU, EEA or UK before creating anything", async () => {
    for (const country of ["DE", "GB", "NO"]) {
      const res = await POST(withCountry(country));
      expect(res.status, country).toBe(403);
      expect(await res.json()).toMatchObject({ code: "region_blocked" });
    }
    expect(insertMock).not.toHaveBeenCalled();
    expect(fetchLicenseMock).not.toHaveBeenCalled();
  });

  it("lets a buyer in the US or Saudi Arabia through", async () => {
    for (const country of ["US", "SA"]) {
      const res = await POST(withCountry(country));
      expect(res.status, country).toBe(200);
    }
  });
});

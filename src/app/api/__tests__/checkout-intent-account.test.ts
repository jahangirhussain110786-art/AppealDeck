import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The Account Pass at /api/checkout/intent (22 Oct 2026): which price a plan opens, who may buy
 * which Pass, and when the founding code is offered. The Appeal Pass paths are covered in
 * checkout-intent-gate.test.ts and must not change.
 */
const getApiUserMock = vi.fn();
const insertSpy = vi.fn();
const fetchLicenseMock = vi.fn();
const foundingLeftMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () => new Response("{}", { status: 401 }),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: () => Promise.resolve({ success: true, limit: 30, remaining: 30, reset: 0 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => {
        const chain: Record<string, unknown> = {};
        for (const m of ["eq", "is", "gt", "order", "limit"]) chain[m] = () => chain;
        chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
        return chain;
      },
      insert: (row: unknown) => {
        insertSpy(row);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "intent-1" }, error: null }),
          }),
        };
      },
    }),
  },
}));
vi.mock("@/lib/license", () => ({
  fetchLicenseForUser: (...args: unknown[]) => fetchLicenseMock(...args),
}));
vi.mock("@/lib/founding", () => ({ foundingSpotsLeft: () => foundingLeftMock() }));

import { POST } from "../checkout/intent/route";

function req(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/checkout/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const base = { caseId: "c1", kind: "POLICY", consent: true };

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS", "pri_case");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
  vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "");
  insertSpy.mockReset();
  getApiUserMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  fetchLicenseMock.mockReset();
  fetchLicenseMock.mockResolvedValue({ status: "none", plan: null, licenseKey: null });
  foundingLeftMock.mockReset();
  foundingLeftMock.mockResolvedValue(10);
});

describe("which price a plan opens", () => {
  it("opens the Appeal Pass price when no plan is sent", async () => {
    const res = await POST(req(base));
    expect(res.status).toBe(200);
    expect((await res.json()).priceId).toBe("pri_case");
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ price_id: "pri_case" }));
  });

  it("opens the Account Pass price for the account plan, and records it on the intent", async () => {
    const res = await POST(req({ ...base, plan: "account" }));
    expect(res.status).toBe(200);
    expect((await res.json()).priceId).toBe("pri_account");
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ price_id: "pri_account" }));
  });

  it("says checkout is not configured for the account plan while it has no price", async () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    const res = await POST(req({ ...base, plan: "account" }));
    expect(res.status).toBe(503);
    expect(insertSpy).not.toHaveBeenCalled();
    // the Appeal Pass is unaffected
    expect((await POST(req(base))).status).toBe(200);
  });

  it("stores a consent that names the Pass being bought", async () => {
    await POST(req({ ...base, plan: "account" }));
    const stored = insertSpy.mock.calls.at(-1)![0] as { consent_text: string };
    expect(stored.consent_text).toContain("deliver the Account Pass immediately");
    expect(stored.consent_text).not.toContain("Appeal Pass immediately");
    insertSpy.mockReset();
    await POST(req(base));
    const storedCase = insertSpy.mock.calls.at(-1)![0] as { consent_text: string };
    expect(storedCase.consent_text).toContain("deliver the Appeal Pass immediately");
  });

  it("refuses a plan it does not know", async () => {
    const res = await POST(req({ ...base, plan: "lifetime" }));
    expect(res.status).toBe(400);
    expect(insertSpy).not.toHaveBeenCalled();
  });
});

describe("who may buy which Pass", () => {
  it("sells nothing more to the holder of an active Account Pass", async () => {
    fetchLicenseMock.mockResolvedValue({
      status: "active",
      plan: "account_pass",
      licenseKey: "AD-1",
    });
    for (const plan of ["case", "account"]) {
      const res = await POST(req({ ...base, plan }));
      expect(res.status, plan).toBe(409);
      expect((await res.json()).error).toMatch(/Account Pass already covers every case/);
    }
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("lets the holder of an Appeal Pass for this case buy the Account Pass, but not a second Appeal Pass", async () => {
    fetchLicenseMock.mockResolvedValue({
      status: "active",
      plan: "appeal_pass",
      licenseKey: "AD-1",
    });
    expect((await POST(req({ ...base, plan: "case" }))).status).toBe(409);
    expect((await POST(req({ ...base, plan: "account" }))).status).toBe(200);
  });

  it("still refuses a seller in a region where Passes are not sold, for either plan", async () => {
    for (const plan of ["case", "account"]) {
      const res = await POST(
        new Request("http://localhost:3000/api/checkout/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-vercel-ip-country": "DE" },
          body: JSON.stringify({ ...base, plan }),
        }) as unknown as NextRequest,
      );
      expect(res.status, plan).toBe(403);
    }
  });
});

describe("the founding code", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "founding"));

  it("is offered for the Account Pass while spots are left", async () => {
    const body = await (await POST(req({ ...base, plan: "account" }))).json();
    expect(body.foundingCode).toBe("FOUNDING");
  });

  it("is not offered when no spots are left", async () => {
    foundingLeftMock.mockResolvedValue(0);
    expect(
      (await (await POST(req({ ...base, plan: "account" }))).json()).foundingCode,
    ).toBeUndefined();
  });

  it("is not offered when the count cannot be read", async () => {
    foundingLeftMock.mockResolvedValue(null);
    expect(
      (await (await POST(req({ ...base, plan: "account" }))).json()).foundingCode,
    ).toBeUndefined();
    foundingLeftMock.mockRejectedValue(new Error("db down"));
    const res = await POST(req({ ...base, plan: "account" }));
    expect(res.status).toBe(200);
    expect((await res.json()).foundingCode).toBeUndefined();
  });

  it("is never offered for the Appeal Pass", async () => {
    expect((await (await POST(req(base))).json()).foundingCode).toBeUndefined();
    expect(foundingLeftMock).not.toHaveBeenCalled();
  });

  it("is not offered when no founding code is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "");
    expect(
      (await (await POST(req({ ...base, plan: "account" }))).json()).foundingCode,
    ).toBeUndefined();
  });

  it("is not offered when the configured code is not a usable code", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDING_CODE", "no spaces allowed");
    expect(
      (await (await POST(req({ ...base, plan: "account" }))).json()).foundingCode,
    ).toBeUndefined();
  });
});

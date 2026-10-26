import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const validateReferralMock = vi.fn();
const rateLimitReferralMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

/**
 * Referral checks used to be counted against the compose cap (26 Oct 2026). A seller who mistyped a
 * partner code while writing a response spent the allowance they needed to draft it, and Upstash
 * recorded the attempts as drafts. Calling compose here throws, so this test fails if the route goes
 * back to it.
 */
vi.mock("@/lib/ratelimit", () => ({
  rateLimitReferral: () => rateLimitReferralMock(),
  rateLimitCompose: () => {
    throw new Error("a partner code must not be counted against the draft allowance");
  },
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));

vi.mock("@/lib/referrals", () => ({
  validateReferral: (...args: unknown[]) => validateReferralMock(...args),
}));

import { POST } from "../referral/validate/route";

const request = (body: unknown) =>
  new NextRequest("https://appealdeck.com/api/referral/validate", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getApiUserMock.mockResolvedValue({ id: "seller-1", email: "seller@example.com" });
  validateReferralMock.mockResolvedValue({
    id: "ref-1",
    code: "PARTNER25",
    discountId: "dsc_1",
  });
  rateLimitReferralMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
});

describe("checking a partner code", () => {
  it("answers with the discount without touching the draft allowance", async () => {
    const res = await POST(request({ code: "partner25" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: "PARTNER25", discount: "$25", currency: "USD" });
  });

  it("has its own limit, so a seller who fumbles a code a few times is not refused", async () => {
    for (const code of ["PARTNER2", "PARTNER25", "PARTNER25"]) {
      expect((await POST(request({ code }))).status).toBe(200);
    }
    expect(rateLimitReferralMock).toHaveBeenCalledTimes(3);
  });

  it("refuses with the referral limiter's own message when it is used up", async () => {
    rateLimitReferralMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 40_000,
    });
    const res = await POST(request({ code: "PARTNER25" }));
    expect(res.status).toBe(429);
    expect(validateReferralMock).not.toHaveBeenCalled();
  });

  it("still requires a signed-in seller", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(request({ code: "PARTNER25" }));
    expect(res.status).toBe(401);
    expect(rateLimitReferralMock).not.toHaveBeenCalled();
  });
});

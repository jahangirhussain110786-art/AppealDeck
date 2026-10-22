import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The routes added with the professional products (22 Oct 2026): who is a verified professional, spending
 * a case credit, opening the Pro plan's billing portal, and the daily job that warns an Account Pass
 * holder their cover is ending. Each answers the same way when signed out, rate limited, or when
 * the database or Paddle cannot be reached, and none lets a request pick someone else's records.
 */
const getApiUserMock = vi.fn();
const proStatusMock = vi.fn();
const spendCreditMock = vi.fn();
const subscriptionMock = vi.fn();
const rateMock = vi.fn();
const deliverMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));
vi.mock("@/lib/license", () => ({
  fetchProStatus: (...a: unknown[]) => proStatusMock(...a),
  spendCaseCredit: (...a: unknown[]) => spendCreditMock(...a),
  fetchProSubscription: (...a: unknown[]) => subscriptionMock(...a),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: (...a: unknown[]) => rateMock(...a),
  tooManyRequestsResponse: () => new Response("{}", { status: 429 }),
}));
vi.mock("@/lib/accountPassNotices", () => ({
  deliverAccountPassNotices: (...a: unknown[]) => deliverMock(...a),
}));

import { GET as proStatus } from "../pro/status/route";
import { POST as spendCredit } from "../credits/use/route";
import { POST as portal } from "../billing/portal/route";
import { GET as expiryJob } from "../jobs/account-pass-expiry/route";

const USER = { id: "u1", email: "writer@example.com" };

function post(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/credits/use", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  for (const m of [
    getApiUserMock,
    proStatusMock,
    spendCreditMock,
    subscriptionMock,
    rateMock,
    deliverMock,
  ])
    m.mockReset();
  getApiUserMock.mockResolvedValue(USER);
  rateMock.mockResolvedValue({ success: true, limit: 30, remaining: 30, reset: 0 });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/pro/status", () => {
  it("is refused when signed out", async () => {
    getApiUserMock.mockResolvedValue(null);
    expect((await proStatus()).status).toBe(401);
  });

  it("returns only the signed-in account's own standing, uncached", async () => {
    proStatusMock.mockResolvedValue({
      verified: true,
      creditsLeft: 4,
      creditsEndAt: null,
      proPlanActive: false,
    });
    const res = await proStatus();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toMatchObject({ verified: true, creditsLeft: 4 });
    expect(proStatusMock).toHaveBeenCalledWith("u1");
  });

  it("says retry (503), not 'you are not a professional', when the lookup fails", async () => {
    proStatusMock.mockRejectedValue(new Error("down"));
    expect((await proStatus()).status).toBe(503);
  });
});

describe("POST /api/credits/use", () => {
  it("is refused when signed out, and when rate limited", async () => {
    getApiUserMock.mockResolvedValue(null);
    expect((await spendCredit(post({ caseId: "c1" }))).status).toBe(401);
    getApiUserMock.mockResolvedValue(USER);
    rateMock.mockResolvedValue({ success: false, limit: 30, remaining: 0, reset: 0 });
    expect((await spendCredit(post({ caseId: "c1" }))).status).toBe(429);
    expect(spendCreditMock).not.toHaveBeenCalled();
  });

  it("asks for a case, and spends nothing without one", async () => {
    expect((await spendCredit(post({}))).status).toBe(400);
    expect((await spendCredit(post({ caseId: "" }))).status).toBe(400);
    expect(spendCreditMock).not.toHaveBeenCalled();
  });

  it("maps each database answer to its own status, and spends only for the signed-in account", async () => {
    const expected: Record<string, number> = {
      used: 200,
      covered: 200,
      already_used: 409,
      not_verified: 403,
      no_credit: 402,
    };
    for (const [result, status] of Object.entries(expected)) {
      spendCreditMock.mockResolvedValue(result);
      const res = await spendCredit(post({ caseId: "case-1" }));
      expect(res.status, result).toBe(status);
      expect(await res.json()).toEqual({ result });
    }
    expect(spendCreditMock).toHaveBeenLastCalledWith("u1", "case-1");
  });

  it("answers 503 when the database cannot decide, so no credit is silently lost or spent", async () => {
    spendCreditMock.mockRejectedValue(new Error("down"));
    expect((await spendCredit(post({ caseId: "c1" }))).status).toBe(503);
  });
});

describe("POST /api/billing/portal", () => {
  const subscription = { customerId: "ctm_1", subscriptionId: "sub_1" };

  it("is refused when signed out, and says 404 when there is no Pro plan", async () => {
    getApiUserMock.mockResolvedValue(null);
    expect((await portal()).status).toBe(401);
    getApiUserMock.mockResolvedValue(USER);
    subscriptionMock.mockResolvedValue(null);
    expect((await portal()).status).toBe(404);
  });

  it("is honest that the portal is off when there is no Paddle key, so billing@ can cancel", async () => {
    vi.stubEnv("PADDLE_API_KEY", "");
    subscriptionMock.mockResolvedValue(subscription);
    const res = await portal();
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("portal_unavailable");
  });

  it("opens the customer's own cancel link, taking the ids from the account and not the request", async () => {
    vi.stubEnv("PADDLE_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "sandbox");
    subscriptionMock.mockResolvedValue(subscription);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            urls: {
              general: { overview: "https://customer-portal.paddle.com/overview" },
              subscriptions: [
                { id: "sub_other", cancel_subscription: "https://x.example/other" },
                { id: "sub_1", cancel_subscription: "https://customer-portal.paddle.com/cancel" },
              ],
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await portal();
    expect(await res.json()).toEqual({ url: "https://customer-portal.paddle.com/cancel" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://sandbox-api.paddle.com/customers/ctm_1/portal-sessions");
    expect(JSON.parse(init.body)).toEqual({ subscription_ids: ["sub_1"] });
    expect(init.headers.Authorization).toBe("Bearer key");
  });

  it("uses the live Paddle API only in production", async () => {
    vi.stubEnv("PADDLE_API_KEY", "key");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "production");
    subscriptionMock.mockResolvedValue(subscription);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: { urls: { general: { overview: "https://p.paddle.com/o" } } } }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const res = await portal();
    expect(fetchMock.mock.calls[0]![0]).toMatch(/^https:\/\/api\.paddle\.com\//);
    expect((await res.json()).url).toBe("https://p.paddle.com/o");
  });

  it("never returns a link that is not https, and never leaks Paddle's own error", async () => {
    vi.stubEnv("PADDLE_API_KEY", "key");
    subscriptionMock.mockResolvedValue(subscription);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { urls: { general: { overview: "http://insecure.example" } } },
          }),
          { status: 200 },
        ),
      ),
    );
    expect((await portal()).status).toBe(503);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("secret detail", { status: 500 })),
    );
    const res = await portal();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect((await portal()).status).toBe(503);
  });

  it("answers 503 when the licence lookup fails", async () => {
    subscriptionMock.mockRejectedValue(new Error("down"));
    expect((await portal()).status).toBe(503);
  });
});

describe("GET /api/jobs/account-pass-expiry", () => {
  function cron(token?: string): NextRequest {
    return new Request("http://localhost:3000/api/jobs/account-pass-expiry", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }) as unknown as NextRequest;
  }

  it("fails closed with no secret, and with the wrong one", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await expiryJob(cron("anything"))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "right");
    expect((await expiryJob(cron("wrong"))).status).toBe(401);
    expect((await expiryJob(cron())).status).toBe(401);
    expect(deliverMock).not.toHaveBeenCalled();
  });

  it("runs the delivery and returns its counts, and 503s if the queue is down", async () => {
    vi.stubEnv("CRON_SECRET", "right");
    deliverMock.mockResolvedValue({ sent: 2, skipped: 1, failed: 0 });
    const res = await expiryJob(cron("right"));
    expect(await res.json()).toEqual({ sent: 2, skipped: 1, failed: 0 });
    deliverMock.mockRejectedValue(new Error("down"));
    expect((await expiryJob(cron("right"))).status).toBe(503);
  });
});

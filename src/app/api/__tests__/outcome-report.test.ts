import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/** The identified outcome report that earns a $25 rebate (22 Oct 2026). */
const getApiUserMock = vi.fn();
const rateMock = vi.fn();
const insertSpy = vi.fn();
let licences: unknown[] = [];
let reports: unknown[] = [];
let insertError: { code?: string } | null = null;
let readError = false;

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () => new Response("{}", { status: 401 }),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitOutcome: () => rateMock(),
  tooManyRequestsResponse: () => new Response("slow down", { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => {
  const chain = (get: () => unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ["eq", "gte"]) c[m] = () => c;
    c.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: get(), error: readError ? { message: "down" } : null }).then(resolve);
    return c;
  };
  return {
    supabaseAdmin: {
      from: (table: string) => ({
        select: () => chain(() => (table === "licenses" ? licences : reports)),
        insert: (row: unknown) => {
          insertSpy(row);
          return Promise.resolve({ error: insertError });
        },
      }),
    },
  };
});

import { GET, POST } from "../outcome/report/route";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost:3000/api/outcome/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest,
  );
const recent = (txn: string, daysAgo: number) => ({
  provider_transaction_id: txn,
  plan: "appeal_pass",
  status: "active",
  created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "true");
  getApiUserMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  rateMock.mockReset();
  rateMock.mockResolvedValue({ success: true });
  insertSpy.mockReset();
  licences = [recent("txn_1", 10)];
  reports = [];
  insertError = null;
  readError = false;
});

describe("GET /api/outcome/report", () => {
  it("says the offer is not running until it is switched on", async () => {
    vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "");
    const res = await GET();
    expect(await res.json()).toEqual({ offered: false, eligible: false });
  });

  it("says whether the account has a payment to refund, and until when", async () => {
    const body = await (await GET()).json();
    expect(body).toMatchObject({ offered: true, eligible: true });
    expect(Date.parse(body.deadline)).toBeGreaterThan(Date.now());
  });

  it("says not eligible when every payment already has a report", async () => {
    reports = [{ transaction_id: "txn_1" }];
    expect(await (await GET()).json()).toMatchObject({ offered: true, eligible: false });
  });

  it("needs a sign-in", async () => {
    getApiUserMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("answers 503 rather than guess when it cannot read", async () => {
    readError = true;
    expect((await GET()).status).toBe(503);
  });
});

describe("POST /api/outcome/report", () => {
  it("records the report against the account's own payment, and says a rebate is pending", async () => {
    const res = await post({ result: "rejected", daysToOutcome: 21 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, rebate: "pending" });
    expect(insertSpy).toHaveBeenCalledWith({
      user_id: "u1",
      transaction_id: "txn_1",
      result: "rejected",
      days_to_outcome: 21,
    });
  });

  it("pays the same rebate whatever the result, so the result cannot be what is rewarded", async () => {
    for (const result of ["approved", "rejected", "no_response", "withdrawn"]) {
      insertSpy.mockReset();
      expect((await post({ result })).status, result).toBe(200);
      expect(insertSpy).toHaveBeenCalledTimes(1);
    }
  });

  it("never takes the payment from the request: a transaction id sent is ignored", async () => {
    await post({ result: "approved", transactionId: "txn_someone_elses", transaction_id: "x" });
    expect(insertSpy.mock.calls[0]![0]).toMatchObject({ transaction_id: "txn_1" });
  });

  it("is refused when there is no payment within 120 days", async () => {
    licences = [recent("txn_old", 130)];
    const res = await post({ result: "approved" });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("not_eligible");
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("answers 'already reported' for a second report on one payment", async () => {
    insertError = { code: "23505" };
    const res = await post({ result: "approved" });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("already_reported");
  });

  it("refuses a result it does not know and a days figure that is not a day count", async () => {
    expect((await post({ result: "won" })).status).toBe(400);
    expect((await post({ result: "approved", daysToOutcome: -1 })).status).toBe(400);
    expect((await post({ result: "approved", daysToOutcome: 1.5 })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("does nothing while the offer is not running", async () => {
    vi.stubEnv("NEXT_PUBLIC_REBATE_ENABLED", "");
    expect((await post({ result: "approved" })).status).toBe(404);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("is rate-limited and needs a sign-in", async () => {
    rateMock.mockResolvedValue({ success: false });
    expect((await post({ result: "approved" })).status).toBe(429);
    getApiUserMock.mockResolvedValue(null);
    expect((await post({ result: "approved" })).status).toBe(401);
  });
});

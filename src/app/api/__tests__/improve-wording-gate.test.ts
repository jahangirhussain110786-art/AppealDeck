import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const claimCasePassMock = vi.fn();
const rateLimitMock = vi.fn();
const callGeminiMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  isLicenseActive: (...args: unknown[]) => isLicenseActiveMock(...args),
  claimCasePass: (...args: unknown[]) => claimCasePassMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitWording: (...args: unknown[]) => rateLimitMock(...args),
  tooManyRequestsResponse: () =>
    new Response(JSON.stringify({ error: "Slow down" }), { status: 429 }),
}));

vi.mock("@/lib/llm/gemini", () => ({
  callGemini: (...args: unknown[]) => callGeminiMock(...args),
  withGeminiBreaker: (h: unknown) => h,
}));

import { handleImproveWording } from "../improve-wording/route";

const SELLER_TEXT =
  "on 3 sep our supplier Acme sent 40 units without invoices and we listed them anyway. that was our mistake.";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/improve-wording", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const valid = { caseId: "case-1", kind: "INAUTHENTIC", section: "explanation", text: SELLER_TEXT };

function modelReturns(text: string) {
  callGeminiMock.mockResolvedValue({ ok: true, model: "m", text: JSON.stringify({ text }) });
}

beforeEach(() => {
  for (const m of [getApiUserMock, isLicenseActiveMock, claimCasePassMock, rateLimitMock]) {
    m.mockReset();
  }
  callGeminiMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  isLicenseActiveMock.mockResolvedValue(true);
  claimCasePassMock.mockResolvedValue(true);
  rateLimitMock.mockResolvedValue({ success: true, limit: 40, remaining: 39, reset: 0 });
});

describe("/api/improve-wording", () => {
  it("needs a signed-in seller", async () => {
    getApiUserMock.mockResolvedValue(null);
    expect((await handleImproveWording(makeReq(valid))).status).toBe(401);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("needs an Appeal Pass, and one for this case", async () => {
    isLicenseActiveMock.mockResolvedValue(false);
    expect((await handleImproveWording(makeReq(valid))).status).toBe(402);

    isLicenseActiveMock.mockResolvedValue(true);
    claimCasePassMock.mockResolvedValue(false);
    const res = await handleImproveWording(makeReq(valid));
    expect(res.status).toBe(402);
    expect((await res.json()).code).toBe("case_pass_required");
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("returns a suggestion that changes only the wording", async () => {
    modelReturns(
      "On 3 Sep our supplier, Acme, sent 40 units without invoices, and we listed them anyway. That was our mistake.",
    );
    const body = await (await handleImproveWording(makeReq(valid))).json();
    expect(body).toMatchObject({ ok: true, unchanged: false });
    expect(body.text).toContain("On 3 Sep");
  });

  it("discards a suggestion that adds a fact, and says what it changed", async () => {
    modelReturns(
      "On 3 Sep our supplier Acme sent 40 units without invoices. On 4 Sep we retrained all 12 staff.",
    );
    const body = await (await handleImproveWording(makeReq(valid))).json();
    expect(body).toMatchObject({ ok: false, reason: "fact_changed" });
    expect(body.changed.added).toEqual(expect.arrayContaining(["4", "12"]));
    expect(body.text).toBeUndefined();
  });

  it("discards a suggestion that promises an outcome", async () => {
    modelReturns(
      "On 3 Sep our supplier Acme sent 40 units without invoices, and we listed them anyway. That was our mistake, and our account will be reinstated.",
    );
    const body = await (await handleImproveWording(makeReq(valid))).json();
    expect(body).toMatchObject({ ok: false, reason: "rejected_content" });
  });

  it("does not call the model for a section too short to improve", async () => {
    const body = await (
      await handleImproveWording(makeReq({ ...valid, text: "we made a mistake" }))
    ).json();
    expect(body).toMatchObject({ ok: false, reason: "too_short" });
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("says it is unavailable, never an error page, when the model fails", async () => {
    callGeminiMock.mockResolvedValue({ ok: false, reason: "timeout", message: "t" });
    const body = await (await handleImproveWording(makeReq(valid))).json();
    expect(body).toMatchObject({ ok: false, reason: "unavailable" });
  });
});

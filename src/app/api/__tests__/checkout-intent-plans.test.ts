import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The checkout intent for every product beyond the Appeal Pass and the Account Pass (22 Oct 2026):
 * the AI document review and the Appeal Pass credited for it, an Account Pass renewal, credit packs
 * and the Pro plan. Which price each opens, who may buy it, and what the consent says.
 */
const getApiUserMock = vi.fn();
const insertSpy = vi.fn();
const fetchLicenseMock = vi.fn();
const reviewMock = vi.fn();
const singleMock = vi.fn();
const coverMock = vi.fn();
const proMock = vi.fn();

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
vi.mock("@/lib/license", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/license")>()),
  fetchLicenseForUser: (...args: unknown[]) => fetchLicenseMock(...args),
  fetchDocumentReview: (...args: unknown[]) => reviewMock(...args),
  fetchSingleResponse: (...args: unknown[]) => singleMock(...args),
  fetchAccountCover: (...args: unknown[]) => coverMock(...args),
  fetchProStatus: (...args: unknown[]) => proMock(...args),
}));
vi.mock("@/lib/founding", () => ({ foundingSpotsLeft: () => Promise.resolve(null) }));

import { POST } from "../checkout/intent/route";

function req(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request("http://localhost:3000/api/checkout/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const withCase = { caseId: "c1", kind: "POLICY", consent: true };
const accountLevel = { consent: true };
const day = 86_400_000;
const inDays = (n: number) => new Date(Date.now() + n * day).toISOString();

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS", "pri_case");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW", "pri_review");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW", "pri_credited");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "pri_single");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "pri_after_single");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL", "pri_renew");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "pri_p10");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_30", "pri_p30");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "pri_pro");
  insertSpy.mockReset();
  getApiUserMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  fetchLicenseMock.mockReset();
  fetchLicenseMock.mockResolvedValue({ status: "none", plan: null, licenseKey: null });
  reviewMock.mockReset();
  reviewMock.mockResolvedValue(false);
  singleMock.mockReset();
  singleMock.mockResolvedValue(false);
  coverMock.mockReset();
  coverMock.mockResolvedValue(null);
  proMock.mockReset();
  proMock.mockResolvedValue({
    verified: true,
    creditsLeft: 0,
    creditsEndAt: null,
    proPlanActive: false,
  });
});

const stored = () =>
  insertSpy.mock.calls.at(-1)![0] as { case_id: string; price_id: string; consent_text: string };

describe("the AI document review", () => {
  it("opens the review price, for the case, with a consent that names the review", async () => {
    const res = await POST(req({ ...withCase, plan: "review" }));
    expect(res.status).toBe(200);
    expect((await res.json()).priceId).toBe("pri_review");
    expect(stored()).toMatchObject({ case_id: "c1", price_id: "pri_review" });
    expect(stored().consent_text).toContain("deliver the AI document review immediately");
  });

  it("is not on sale until both its price and the credited Appeal Pass price are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW", "");
    expect((await POST(req({ ...withCase, plan: "review" }))).status).toBe(503);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW", "pri_credited");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_DOCUMENT_REVIEW", "");
    expect((await POST(req({ ...withCase, plan: "review" }))).status).toBe(503);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("is not sold for a case that already has a Pass, which includes the reading", async () => {
    fetchLicenseMock.mockResolvedValue({
      status: "active",
      plan: "appeal_pass",
      licenseKey: "AD-1",
    });
    const res = await POST(req({ ...withCase, plan: "review" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already has an Appeal Pass/);
  });

  it("is not sold twice for one case", async () => {
    reviewMock.mockResolvedValue(true);
    const res = await POST(req({ ...withCase, plan: "review" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already has a document review/);
  });

  it("is not sold for a case that needs professional help", async () => {
    const res = await POST(
      req({ caseId: "c1", kind: "INAUTHENTIC_DOCUMENTS", consent: true, plan: "review" }),
    );
    expect(res.status).toBe(403);
  });

  it("needs a case", async () => {
    expect((await POST(req({ ...accountLevel, plan: "review" }))).status).toBe(400);
  });
});

describe("the Appeal Pass credited for a document review", () => {
  it("is offered at the credited price once the case has a review", async () => {
    reviewMock.mockResolvedValue(true);
    const res = await POST(req(withCase));
    expect((await res.json()).priceId).toBe("pri_credited");
    expect(stored().price_id).toBe("pri_credited");
  });

  it("is the ordinary price when the case has no review", async () => {
    expect((await (await POST(req(withCase))).json()).priceId).toBe("pri_case");
  });

  it("is the ordinary price when no credited price is configured", async () => {
    reviewMock.mockResolvedValue(true);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_REVIEW", "");
    expect((await (await POST(req(withCase))).json()).priceId).toBe("pri_case");
  });
});

describe("One Response (23 Oct 2026)", () => {
  it("opens its own price, for the case, with a consent that names it", async () => {
    const res = await POST(req({ ...withCase, plan: "single" }));
    expect(res.status).toBe(200);
    expect((await res.json()).priceId).toBe("pri_single");
    expect(stored()).toMatchObject({ case_id: "c1", price_id: "pri_single" });
    expect(stored().consent_text).toContain("deliver the One Response immediately");
  });

  it("is refused for a case that already has one, and for one that already has an Appeal Pass", async () => {
    singleMock.mockResolvedValue(true);
    expect((await POST(req({ ...withCase, plan: "single" }))).status).toBe(409);
    singleMock.mockResolvedValue(false);
    fetchLicenseMock.mockResolvedValue({ status: "active", plan: "appeal_pass", licenseKey: "k" });
    expect((await POST(req({ ...withCase, plan: "single" }))).status).toBe(409);
  });

  it("is not on sale without its price", async () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE", "");
    expect((await POST(req({ ...withCase, plan: "single" }))).status).toBe(503);
  });
});

describe("the Appeal Pass credited for a One Response", () => {
  it("is offered at the credited price once the case has a One Response", async () => {
    singleMock.mockResolvedValue(true);
    const res = await POST(req(withCase));
    expect((await res.json()).priceId).toBe("pri_after_single");
    expect(stored().price_id).toBe("pri_after_single");
  });

  it("is the ordinary price when the case has no One Response", async () => {
    expect((await (await POST(req(withCase))).json()).priceId).toBe("pri_case");
  });

  it("is the ordinary price when the credited price is not configured", async () => {
    singleMock.mockResolvedValue(true);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE", "");
    expect((await (await POST(req(withCase))).json()).priceId).toBe("pri_case");
  });

  it("wins over a document review's credit, being the larger", async () => {
    singleMock.mockResolvedValue(true);
    reviewMock.mockResolvedValue(true);
    expect((await (await POST(req(withCase))).json()).priceId).toBe("pri_after_single");
  });

  it("does not change the Account Pass", async () => {
    singleMock.mockResolvedValue(true);
    expect((await (await POST(req({ ...withCase, plan: "account" }))).json()).priceId).toBe(
      "pri_account",
    );
  });
});

describe("an Account Pass renewal", () => {
  it("is offered in its last 60 days, for the account, with no case", async () => {
    coverMock.mockResolvedValue({ expiresAt: inDays(20) });
    const res = await POST(req({ ...accountLevel, plan: "renewal" }));
    expect(res.status).toBe(200);
    expect((await res.json()).priceId).toBe("pri_renew");
    expect(stored()).toMatchObject({ case_id: "account", price_id: "pri_renew" });
    expect(stored().consent_text).toContain("deliver the Account Pass renewal immediately");
  });

  it("is still offered for 30 days after the Account Pass ended", async () => {
    coverMock.mockResolvedValue({ expiresAt: inDays(-10) });
    expect((await POST(req({ ...accountLevel, plan: "renewal" }))).status).toBe(200);
  });

  it("is refused with nothing to renew, too early, or too late", async () => {
    const cases: [string | null, string, string][] = [
      [null, "renewal_unavailable", "no Account Pass to renew"],
      [inDays(200), "renewal_early", "Renewing opens 60 days before"],
      [inDays(-45), "renewal_closed", "Buy a new Account Pass"],
    ];
    for (const [expiresAt, code, text] of cases) {
      coverMock.mockResolvedValue(expiresAt ? { expiresAt } : null);
      const res = await POST(req({ ...accountLevel, plan: "renewal" }));
      expect(res.status, code).toBe(409);
      const body = await res.json();
      expect(body.code).toBe(code);
      expect(body.error).toContain(text);
    }
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("is not on sale without both the Account Pass and its renewal price", async () => {
    coverMock.mockResolvedValue({ expiresAt: inDays(20) });
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL", "");
    expect((await POST(req({ ...accountLevel, plan: "renewal" }))).status).toBe(503);
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_RENEWAL", "pri_renew");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "");
    expect((await POST(req({ ...accountLevel, plan: "renewal" }))).status).toBe(503);
  });
});

describe("credit packs and the Pro plan", () => {
  it("are sold to a verified professional, with no case, at their own prices", async () => {
    for (const [plan, price, thing] of [
      ["pack10", "pri_p10", "the pack of 10 case credits"],
      ["pack30", "pri_p30", "the pack of 30 case credits"],
      ["pro", "pri_pro", "the Pro plan"],
    ] as const) {
      const res = await POST(req({ ...accountLevel, plan }));
      expect(res.status, plan).toBe(200);
      expect((await res.json()).priceId).toBe(price);
      expect(stored()).toMatchObject({ case_id: "account", price_id: price });
      expect(stored().consent_text, plan).toContain(`deliver ${thing} immediately`);
    }
  });

  it("are refused, with a way forward, to anyone who has not been verified", async () => {
    proMock.mockResolvedValue({
      verified: false,
      creditsLeft: 0,
      creditsEndAt: null,
      proPlanActive: false,
    });
    for (const plan of ["pack10", "pack30", "pro"]) {
      const res = await POST(req({ ...accountLevel, plan }));
      expect(res.status, plan).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("not_verified");
      expect(body.error).toMatch(/Write to us/);
    }
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("make the Pro plan's consent say it renews every month and how to stop it", async () => {
    await POST(req({ ...accountLevel, plan: "pro" }));
    const text = stored().consent_text;
    expect(text).toContain("renews every month");
    expect(text).toContain("until I cancel it in Billing");
    // and it still ends in the Terms and Refund links
    expect(text).toMatch(/I have read the Terms and the Refund policy\.$/);
    // a pack's consent does not claim a renewal
    await POST(req({ ...accountLevel, plan: "pack10" }));
    expect(stored().consent_text).not.toContain("renews");
  });

  it("do not sell a second Pro plan to someone who has one", async () => {
    proMock.mockResolvedValue({
      verified: true,
      creditsLeft: 2,
      creditsEndAt: null,
      proPlanActive: true,
    });
    expect((await POST(req({ ...accountLevel, plan: "pro" }))).status).toBe(409);
    // a pack is still fine alongside it
    expect((await POST(req({ ...accountLevel, plan: "pack10" }))).status).toBe(200);
  });

  it("are not on sale without their prices", async () => {
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PACK_10", "");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN", "");
    expect((await POST(req({ ...accountLevel, plan: "pack10" }))).status).toBe(503);
    expect((await POST(req({ ...accountLevel, plan: "pro" }))).status).toBe(503);
    expect((await POST(req({ ...accountLevel, plan: "pack30" }))).status).toBe(200);
  });

  it("are refused when the verification lookup fails, rather than guessed", async () => {
    proMock.mockRejectedValue(new Error("down"));
    expect((await POST(req({ ...accountLevel, plan: "pack10" }))).status).toBe(503);
  });
});

describe("every plan", () => {
  it("is refused in a region where Passes are not sold", async () => {
    for (const body of [
      { ...withCase, plan: "review" },
      { ...accountLevel, plan: "renewal" },
      { ...accountLevel, plan: "pack10" },
      { ...accountLevel, plan: "pro" },
    ]) {
      const res = await POST(req(body, { "x-vercel-ip-country": "DE" }));
      expect(res.status, JSON.stringify(body)).toBe(403);
      expect((await res.json()).code).toBe("region_blocked");
    }
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("needs the checkout consent", async () => {
    expect((await POST(req({ ...withCase, consent: false, plan: "review" }))).status).toBe(400);
    expect((await POST(req({ plan: "pack10" }))).status).toBe(400);
  });

  it("refuses a plan it does not know", async () => {
    expect((await POST(req({ ...withCase, plan: "lifetime" }))).status).toBe(400);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  error: null as unknown,
}));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.row, error: state.error }) }),
      }),
    }),
  },
}));
import { validateReferral } from "../referrals";

const valid = () => ({
  id: "dsc_partner",
  status: "active",
  enabled_for_checkout: true,
  code: "PARTNER25",
  type: "flat",
  amount: "2500",
  currency_code: "USD",
  recur: false,
  restrict_to: ["pri_case", "pri_account"],
  expires_at: null,
  usage_limit: null,
  times_used: 0,
});
beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("NEXT_PUBLIC_REFERRALS_ENABLED", "true");
  vi.stubEnv("PADDLE_API_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS", "pri_case");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS", "pri_account");
  state.row = {
    id: "code-id",
    code: "PARTNER25",
    discount_id: "dsc_partner",
    active: true,
    partners: { user_id: "partner", active: true },
  };
  state.error = null;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: valid() })));
});

describe("server-validated partner codes", () => {
  it("normalizes a valid code and checks Paddle without exposing the key", async () => {
    expect(await validateReferral(" partner25 ", "buyer")).toEqual({
      id: "code-id",
      code: "PARTNER25",
      discountId: "dsc_partner",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://sandbox-api.paddle.com/discounts/dsc_partner",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
  it("refuses self-referrals, unknown codes, paused codes and database failures before reaching Paddle", async () => {
    await expect(validateReferral("PARTNER25", "partner")).rejects.toThrow();
    state.row!.active = false;
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
    state.row = null;
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
    state.error = { message: "unavailable" };
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("stays off without its switch or API key", async () => {
    vi.stubEnv("NEXT_PUBLIC_REFERRALS_ENABLED", "false");
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
    vi.stubEnv("NEXT_PUBLIC_REFERRALS_ENABLED", "true");
    vi.stubEnv("PADDLE_API_KEY", "");
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
  });
  it.each([
    { status: "archived" },
    { enabled_for_checkout: false },
    { amount: "1000" },
    { currency_code: "EUR" },
    { type: "percentage" },
    { recur: true },
    { restrict_to: null },
    { restrict_to: ["pri_case"] },
    { restrict_to: ["pri_case", "pri_account", "pri_upgrade"] },
    { usage_limit: 1, times_used: 1 },
    { expires_at: "2020-01-01T00:00:00Z" },
    { code: "OTHER" },
    { id: "dsc_other" },
  ])("rejects an ineligible Paddle discount: %j", async (change) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ data: { ...valid(), ...change } })),
    );
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
  });
  it("fails closed on Paddle outages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(validateReferral("PARTNER25", "buyer")).rejects.toThrow();
  });
});
